---
sidebar_position: 5
title: "环境、基准测试与数据生成"
description: "构建 RL 训练环境、运行评估基准测试，以及使用 Hermes-Agent Atropos 集成生成 SFT 数据"
---

# 环境、基准测试与数据生成

Hermes Agent 包含一个完整的环境框架，将其工具调用能力连接到 [Atropos](https://github.com/NousResearch/atropos) RL 训练框架。这实现了三种工作流：

1. **RL 训练** — 使用 GRPO 在多轮 agentic 任务上训练语言模型
2. **基准测试** — 在标准化的 agentic 基准上评估模型
3. **数据生成** — 从 agent  rollout 生成 SFT 训练数据

所有三种共享同一个核心：一个定义任务、运行 agent 循环并对输出评分的**环境**类。

:::info Repo 环境 vs RL 训练工具
这里记录的 Python 环境框架位于 repo 的 `environments/` 目录下，是 Hermes/Atropos 集成的实现级 API。这与面向用户的 `rl_*` 工具分开，后者作为远程 RL 训练工作流的编排表面运行。
:::

:::tip 快速链接
- **想运行基准测试？** 跳转到[可用基准测试](#available-benchmarks)
- **想用 RL 训练？** 查看 [RL 训练工具](/user-guide/features/rl-training) 获取 agent 驱动的接口，或[运行环境](#running-environments)获取手动执行
- **想创建新环境？** 查看[创建环境](#creating-environments)
:::

## 架构

环境系统建立在三层继承链上：

```mermaid
classDiagram
    class BaseEnv {
      Server management
      Worker scheduling
      Wandb logging
      CLI: serve / process / evaluate
    }

    class HermesAgentBaseEnv {
      Terminal backend configuration
      Tool resolution
      Agent loop engine
      ToolContext access
    }

    class TerminalTestEnv {
      Stack testing
    }

    class HermesSweEnv {
      SWE training
    }

    class TerminalBench2EvalEnv {
      Benchmark evaluation
    }

    class TBLiteEvalEnv {
      Fast benchmark
    }

    class YCBenchEvalEnv {
      Long-horizon benchmark
    }

    BaseEnv <|-- HermesAgentBaseEnv
    HermesAgentBaseEnv <|-- TerminalTestEnv
    HermesAgentBaseEnv <|-- HermesSweEnv
    HermesAgentBaseEnv <|-- TerminalBench2EvalEnv
    TerminalBench2EvalEnv <|-- TBLiteEvalEnv
    TerminalBench2EvalEnv <|-- YCBenchEvalEnv
```

### BaseEnv（Atropos）

来自 `atroposlib` 的基础。提供：
- **服务器管理** — 连接到 OpenAI 兼容 API（VLLM、SGLang、OpenRouter）
- **工作调度** — 并行 rollout 协调
- **Wandb 集成** — 指标日志和 rollout 可视化
- **CLI 接口** — 三个子命令：`serve`、`process`、`evaluate`
- **评估日志** — `evaluate_log()` 将结果保存到 JSON + JSONL

### HermesAgentBaseEnv

hermes-agent 层（`environments/hermes_base_env.py`）。添加：
- **Terminal 后端配置** — 设置 `TERMINAL_ENV` 用于沙箱执行（local、Docker、Modal、Daytona、SSH、Singularity）
- **工具解析** — `_resolve_tools_for_group()` 调用 hermes-agent 的 `get_tool_definitions()` 根据启用/禁用的工具集获取正确的工具 schema
- **Agent 循环集成** — `collect_trajectory()` 运行 `HermesAgentLoop` 并对结果评分
- **两阶段操作** — 阶段 1（OpenAI 服务器）用于评估/SFT，阶段 2（VLLM ManagedServer）用于带 logprobs 的完整 RL
- **异步安全补丁** — monkey-patch Modal 后端以在 Atropos 的事件循环内工作

### 具体环境

你的环境继承自 `HermesAgentBaseEnv` 并实现五个方法：

| 方法 | 用途 |
|--------|------|
| `setup()` | 加载数据集，初始化状态 |
| `get_next_item()` | 返回下一个用于 rollout 的项目 |
| `format_prompt(item)` | 将项目转换为用户消息 |
| `compute_reward(item, result, ctx)` | 对 rollout 评分（0.0–1.0） |
| `evaluate()` | 周期性评估逻辑 |

## 核心组件

### Agent 循环

`HermesAgentLoop`（`environments/agent_loop.py`）是可复用的多轮 agent 引擎。它运行与 hermes-agent 主循环相同的工具调用模式：

1. 通过 `server.chat_completion()` 发送消息 + 工具 schema 到 API
2. 如果响应包含 `tool_calls`，通过 `handle_function_call()` 分发每个
3. 将工具结果追加到对话，返回步骤 1
4. 如果没有 `tool_calls`，agent 完成

工具调用通过线程池（`ThreadPoolExecutor(128)`）执行，因此异步后端（Modal、Docker）不会在 Atropos 的事件循环中死锁。

返回 `AgentResult`：

```python
@dataclass
class AgentResult:
    messages: List[Dict[str, Any]]       # 完整对话历史
    turns_used: int                       # 进行的 LLM 调用次数
    finished_naturally: bool              # 模型自行停止则为 True
    reasoning_per_turn: List[Optional[str]]  # 提取的推理内容
    tool_errors: List[ToolError]          # 工具分发期间遇到的错误
    managed_state: Optional[Dict]         # VLLM ManagedServer 状态（阶段 2）
```

### 工具上下文

`ToolContext`（`environments/tool_context.py`）给予奖励函数直接访问模型在 rollout 期间使用的**相同沙箱**。`task_id` 作用域意味着所有状态（文件、进程、浏览器标签）都被保留。

```python
async def compute_reward(self, item, result, ctx: ToolContext):
    # 在模型的终端沙箱中运行测试
    test = ctx.terminal("pytest -v")
    if test["exit_code"] == 0:
        return 1.0

    # 检查文件是否被创建
    content = ctx.read_file("/workspace/solution.py")
    if content.get("content"):
        return 0.5

    # 下载文件用于本地验证
    ctx.download_file("/remote/output.bin", "/local/output.bin")
    return 0.0
```

可用方法：

| 类别 | 方法 |
|----------|-------|
| **Terminal** | `terminal(command, timeout)` |
| **Files** | `read_file(path)`、`write_file(path, content)`、`search(query, path)` |
| **Transfers** | `upload_file()`、`upload_dir()`、`download_file()`、`download_dir()` |
| **Web** | `web_search(query)`、`web_extract(urls)` |
| **Browser** | `browser_navigate(url)`、`browser_snapshot()` |
| **Generic** | `call_tool(name, args)` — 任何 hermes-agent 工具的逃生出口 |
| **Cleanup** | `cleanup()` — 释放所有资源 |

### 工具调用解析器

对于**阶段 2**（VLLM ManagedServer），服务器返回没有结构化工具调用的原始文本。客户端解析器在 `environments/tool_call_parsers/` 中从原始输出提取 `tool_calls`：

```python
from environments.tool_call_parsers import get_parser

parser = get_parser("hermes")  # 或 "mistral"、"llama3_json"、"qwen"、"deepseek_v3" 等
content, tool_calls = parser.parse(raw_model_output)
```

可用解析器：`hermes`、`mistral`、`llama3_json`、`qwen`、`qwen3_coder`、`deepseek_v3`、`deepseek_v3_1`、`kimi_k2`、`longcat`、`glm45`、`glm47`。

在阶段 1（OpenAI 服务器类型）中，不需要解析器 — 服务器原生处理工具调用解析。

## 可用基准测试

### TerminalBench2

**89 个具有挑战性的终端任务**，每个任务使用独立的 Docker 沙箱环境。

| | |
|---|---|
| **测试内容** | 单任务编码/sysadmin 能力 |
| **评分** | 二元通过/失败（测试套件验证） |
| **沙箱** | Modal 云沙箱（每个任务一个 Docker 镜像） |
| **工具** | `terminal` + `file` |
| **任务数** | 89 个任务跨多个类别 |
| **成本** | 完整评估约 $50–200（并行执行） |
| **时间** | 约 2–4 小时 |

```bash
python environments/benchmarks/terminalbench_2/terminalbench2_env.py evaluate \
    --config environments/benchmarks/terminalbench_2/default.yaml

# 运行特定任务
python environments/benchmarks/terminalbench_2/terminalbench2_env.py evaluate \
    --config environments/benchmarks/terminalbench_2/default.yaml \
    --env.task_filter fix-git,git-multibranch
```

数据集：[NousResearch/terminal-bench-2](https://huggingface.co/datasets/NousResearch/terminal-bench-2)（HuggingFace）。

### TBLite（OpenThoughts Terminal Bench Lite）

**100 个难度校准的任务** — TerminalBench2 的更快代理。

| | |
|---|---|
| **测试内容** | 与 TB2 相同（编码/sysadmin），校准难度等级 |
| **评分** | 二元通过/失败 |
| **沙箱** | Modal 云沙箱 |
| **工具** | `terminal` + `file` |
| **任务数** | 100 个任务：简单（40）、中等（26）、困难（26）、极端（8） |
| **相关性** | 与完整 TB2 的 r=0.911 |
| **速度** | 比 TB2 快 2.6–8 倍 |

```bash
python environments/benchmarks/tblite/tblite_env.py evaluate \
    --config environments/benchmarks/tblite/default.yaml
```

TBLite 是 TerminalBench2 的一个简单子类 — 只有数据集和超时不同。由 OpenThoughts Agent 团队（Snorkel AI + Bespoke Labs）创建。数据集：[NousResearch/openthoughts-tblite](https://huggingface.co/datasets/NousResearch/openthoughts-tblite)。

### YC-Bench

**长时战略基准** — agent 扮演 AI 创业公司的 CEO。

| | |
|---|---|
| **测试内容** | 数百轮的多回合战略一致性 |
| **评分** | 复合：`0.5 × survival + 0.5 × normalised_funds` |
| **沙箱** | 本地终端（无需 Modal） |
| **工具** | 仅 `terminal` |
| **运行** | 9 个默认（3 个预设 × 3 个种子），顺序 |
| **成本** | 完整评估约 $50–200 |
| **时间** | 约 3–6 小时 |

```bash
# 安装 yc-bench（可选依赖）
pip install "hermes-agent[yc-bench]"

# 运行评估
bash environments/benchmarks/yc_bench/run_eval.sh

# 或直接
python environments/benchmarks/yc_bench/yc_bench_env.py evaluate \
    --config environments/benchmarks/yc_bench/default.yaml

# 快速单预设测试
python environments/benchmarks/yc_bench/yc_bench_env.py evaluate \
    --config environments/benchmarks/yc_bench/default.yaml \
    --env.presets '["fast_test"]' --env.seeds '[1]'
```

YC-Bench 使用 [collinear-ai/yc-bench](https://github.com/collinear-ai/yc-bench) — 一个确定性模拟，有 4 个技能领域（研究、推理、data_environment、训练）、声望系统、员工管理和财务压力。与 TB2 的每任务二元评分不同，YC-Bench 衡量 agent 能否在数百个复合决策中保持一致的策略。

## 训练环境

### TerminalTestEnv

一个带有内联任务的最小自包含环境（无外部数据集）。用于**端到端验证完整堆栈**。每个任务要求模型在已知路径创建文件；验证器检查内容。

```bash
# 处理模式（保存 rollout 到 JSONL，无需训练服务器）
python environments/terminal_test_env/terminal_test_env.py process \
    --env.data_path_to_save_groups terminal_test_output.jsonl

# 服务模式（连接到 Atropos API 进行 RL 训练）
python environments/terminal_test_env/terminal_test_env.py serve
```

### HermesSweEnv

SWE-bench 风格的训练环境。模型获得编码任务，使用 terminal + file + web 工具解决它，奖励函数在同一个 Modal 沙箱中运行测试。

```bash
python environments/hermes_swe_env/hermes_swe_env.py serve \
    --openai.model_name YourModel \
    --env.dataset_name bigcode/humanevalpack \
    --env.terminal_backend modal
```

## 运行环境

每个环境是一个带有三个 CLI 子命令的独立 Python 脚本：

### `evaluate` — 运行基准测试

用于仅评估的环境（基准测试）。运行所有项目，计算指标，记录到 wandb。

```bash
python environments/benchmarks/tblite/tblite_env.py evaluate \
    --config environments/benchmarks/tblite/default.yaml \
    --openai.model_name anthropic/claude-sonnet-4.6
```

不需要训练服务器或 `run-api`。环境处理一切。

### `process` — 生成 SFT 数据

运行 rollout 并将评分的轨迹保存到 JSONL。用于在没有完整 RL 循环的情况下生成训练数据。

```bash
python environments/terminal_test_env/terminal_test_env.py process \
    --env.data_path_to_save_groups output.jsonl \
    --openai.model_name anthropic/claude-sonnet-4.6
```

输出格式：每行是一个带完整对话历史、奖励和元数据的评分轨迹。

### `serve` — 连接到 Atropos 进行 RL 训练

将环境连接到运行的 Atropos API 服务器（`run-api`）。在 live RL 训练期间使用。

```bash
# 终端 1：启动 Atropos API
run-api

# 终端 2：启动环境
python environments/hermes_swe_env/hermes_swe_env.py serve \
    --openai.model_name YourModel
```

环境从 Atropos 接收项目，运行 agent rollout，计算奖励，并发送评分轨迹回训练。

## 两阶段操作

### 阶段 1：OpenAI 服务器（评估 / SFT）

使用 `server.chat_completion()` 与 `tools=` 参数。服务器（VLLM、SGLang、OpenRouter、OpenAI）原生处理工具调用解析。返回带结构化 `tool_calls` 的 `ChatCompletion` 对象。

- **用于**：评估、SFT 数据生成、基准测试、测试
- **占位符 token** 为 Atropos 流水线创建（因为从 OpenAI API 无法获得真实 token ID）

### 阶段 2：VLLM ManagedServer（完整 RL）

使用 ManagedServer 通过 `/generate` 获取精确 token ID + logprobs。客户端侧[工具调用解析器](#tool-call-parsers)从原始输出重构结构化 `tool_calls`。

- **用于**：带 GRPO/PPO 的完整 RL 训练
- **真实 token**、mask 和 logprobs 通过流水线流动
- 在配置中设置 `tool_call_parser` 以匹配你模型的格式（例如 `"hermes"`、`"qwen"`、`"mistral"`）

## 创建环境

### 训练环境

```python
from environments.hermes_base_env import HermesAgentBaseEnv, HermesAgentEnvConfig
from atroposlib.envs.server_handling.server_manager import APIServerConfig

class MyEnvConfig(HermesAgentEnvConfig):
    my_custom_field: str = "default_value"

class MyEnv(HermesAgentBaseEnv):
    name = "my-env"
    env_config_cls = MyEnvConfig

    @classmethod
    def config_init(cls):
        env_config = MyEnvConfig(
            enabled_toolsets=["terminal", "file"],
            terminal_backend="modal",
            max_agent_turns=30,
        )
        server_configs = [APIServerConfig(
            base_url="https://openrouter.ai/api/v1",
            model_name="anthropic/claude-sonnet-4.6",
            server_type="openai",
        )]
        return env_config, server_configs

    async def setup(self):
        from datasets import load_dataset
        self.dataset = list(load_dataset("my-dataset", split="train"))
        self.iter = 0

    async def get_next_item(self):
        item = self.dataset[self.iter % len(self.dataset)]
        self.iter += 1
        return item

    def format_prompt(self, item):
        return item["instruction"]

    async def compute_reward(self, item, result, ctx):
        # ctx 给予对 rollout 沙箱的完整工具访问
        test = ctx.terminal("pytest -v")
        return 1.0 if test["exit_code"] == 0 else 0.0

    async def evaluate(self, *args, **kwargs):
        # 训练期间的周期性评估
        pass

if __name__ == "__main__":
    MyEnv.cli()
```

### 仅评估基准测试

对于基准测试，遵循 TerminalBench2、TBLite 和 YC-Bench 使用的模式：

1. **创建在** `environments/benchmarks/your-benchmark/`
2. **设置仅评估配置**：`eval_handling=STOP_TRAIN`、`steps_per_eval=1`、`total_steps=1`
3. **存根训练方法**：`collect_trajectories()` 返回 `(None, [])`，`score()` 返回 `None`
4. **实现** `rollout_and_score_eval(eval_item)` — 每个项目的 agent 循环 + 评分
5. **实现** `evaluate()` — 编排所有运行，计算聚合指标
6. **添加流式 JSONL** 以实现崩溃安全的结果持久化
7. **添加清理**：`KeyboardInterrupt` 处理、`cleanup_all_environments()`、`_tool_executor.shutdown()`
8. **使用** `evaluate` 子命令运行

参见 `environments/benchmarks/yc_bench/yc_bench_env.py` 获取一个干净、文档完善的参考实现。

## 配置参考

### HermesAgentEnvConfig 字段

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `enabled_toolsets` | `List[str]` | `None`（全部） | 启用哪些 hermes 工具集 |
| `disabled_toolsets` | `List[str]` | `None` | 要过滤掉的工具集 |
| `distribution` | `str` | `None` | 概率工具集分发名称 |
| `max_agent_turns` | `int` | `30` | 每次 rollout 的最大 LLM 调用次数 |
| `agent_temperature` | `float` | `1.0` | 采样温度 |
| `system_prompt` | `str` | `None` | Agent 的系统消息 |
| `terminal_backend` | `str` | `"local"` | `local`、`docker`、`modal`、`daytona`、`ssh`、`singularity` |
| `terminal_timeout` | `int` | `120` | 每个终端命令的秒数 |
| `terminal_lifetime` | `int` | `3600` | 最大沙箱生命周期 |
| `dataset_name` | `str` | `None` | HuggingFace 数据集标识符 |
| `tool_pool_size` | `int` | `128` | 工具执行的线程池大小 |
| `tool_call_parser` | `str` | `"hermes"` | 阶段 2 原始输出的解析器 |
| `extra_body` | `Dict` | `None` | OpenAI API 的额外参数（例如 OpenRouter provider 偏好） |
| `eval_handling` | `Enum` | `STOP_TRAIN` | `STOP_TRAIN`、`LIMIT_TRAIN`、`NONE` |

### YAML 配置

环境可以通过随 `--config` 传递的 YAML 文件配置：

```yaml
env:
  enabled_toolsets: ["terminal", "file"]
  max_agent_turns: 60
  max_token_length: 32000
  agent_temperature: 0.8
  terminal_backend: "modal"
  terminal_timeout: 300
  dataset_name: "NousResearch/terminal-bench-2"
  tokenizer_name: "NousResearch/Hermes-3-Llama-3.1-8B"
  use_wandb: true
  wandb_name: "my-benchmark"

openai:
  base_url: "https://openrouter.ai/api/v1"
  model_name: "anthropic/claude-sonnet-4.6"
  server_type: "openai"
  health_check: false
```

YAML 值覆盖 `config_init()` 默认值。CLI 参数覆盖 YAML 值：

```bash
python my_env.py evaluate \
    --config my_config.yaml \
    --openai.model_name anthropic/claude-opus-4.6  # 覆盖 YAML
```

## 前置要求

### 所有环境

- Python >= 3.11
- `atroposlib`：`pip install git+https://github.com/NousResearch/atropos.git`
- LLM API 密钥（OpenRouter、OpenAI 或自托管 VLLM/SGLang）

### Modal 沙箱基准测试（TB2、TBLite）

- [Modal](https://modal.com) 账户和 CLI：`pip install "hermes-agent[modal]"`
- `MODAL_TOKEN_ID` 和 `MODAL_TOKEN_SECRET` 环境变量

### YC-Bench

- `pip install "hermes-agent[yc-bench]"`（安装 yc-bench CLI + SQLAlchemy）
- 不需要 Modal — 使用本地终端后端运行

### RL 训练

- `TINKER_API_KEY` — [Tinker](https://tinker.computer) 训练服务的 API 密钥
- `WANDB_API_KEY` — 用于 Weights & Biases 指标跟踪
- `tinker-atropos` 子模块（在 repo 的 `tinker-atropos/`）

参见 [RL 训练](/user-guide/features/rl-training) 获取 agent 驱动的 RL 工作流。

## 目录结构

```
environments/
├── hermes_base_env.py          # 抽象基类（HermesAgentBaseEnv）
├── agent_loop.py               # 多轮 agent 引擎（HermesAgentLoop）
├── tool_context.py             # 奖励函数的每次 rollout 工具访问
├── patches.py                  # Modal 后端的异步安全补丁
│
├── tool_call_parsers/          # 阶段 2 客户端解析器
│   ├── hermes_parser.py        # Hermes/ChatML <tool_call> 格式
│   ├── mistral_parser.py       # Mistral [TOOL_CALLS] 格式
│   ├── llama_parser.py         # Llama 3 JSON 工具调用
│   ├── qwen_parser.py          # Qwen 格式
│   ├── deepseek_v3_parser.py   # DeepSeek V3 格式
│   └── ...                     # + kimi_k2、longcat、glm45/47 等
│
├── terminal_test_env/          # 堆栈验证（内联任务）
├── hermes_swe_env/             # SWE-bench 训练环境
│
└── benchmarks/                 # 评估基准
    ├── terminalbench_2/        # 89 个终端任务，Modal 沙箱
    ├── tblite/                 # 100 个校准任务（快速 TB2 代理）
    └── yc_bench/               # 长时战略基准
```
