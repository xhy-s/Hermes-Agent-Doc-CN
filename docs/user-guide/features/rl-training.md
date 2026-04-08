---
sidebar_position: 13
title: "RL 训练"
description: "使用 Tinker-Atropos 进行代理行为的强化学习 — 环境发现、训练和评估"
---

# RL 训练

Hermes Agent 包含一个基于 **Tinker-Atropos** 构建的集成 RL（强化学习）训练管道。这支持使用 GRPO（组相对策略优化）与 LoRA 适配器对特定环境任务训练语言模型，整个过程通过代理的工具接口编排。

## 概述

RL 训练系统由三个组件组成：

1. **Atropos** — 轨迹 API 服务器，协调环境交互、管理 rollout 组和计算优势
2. **Tinker** — 训练服务，处理模型权重、LoRA 训练、采样/推理和优化器步骤
3. **环境** — Python 类，定义任务、评分和奖励函数（例如 GSM8K 数学问题）

代理可以发现环境、配置训练参数、启动训练运行和监控指标 — 所有这些都是通过一组 `rl_*` 工具完成的。

## 要求

RL 训练需要：

- **Python >= 3.11**（Tinker 包要求）
- **TINKER_API_KEY** — Tinker 训练服务的 API 密钥
- **WANDB_API_KEY** — Weights & Biases 指标跟踪的 API 密钥
- `tinker-atropos` 子模块（在 Hermes 根目录下相对于 `tinker-atropos/`）

```bash
# 设置 API 密钥
hermes config set TINKER_API_KEY your-tinker-key
hermes config set WANDB_API_KEY your-wandb-key
```

当两个密钥都存在且 Python >= 3.11 可用时，`rl` 工具集自动启用。

## 可用工具

| 工具 | 描述 |
|------|-------------|
| `rl_list_environments` | 发现可用的 RL 环境 |
| `rl_select_environment` | 选择环境并加载其配置 |
| `rl_get_current_config` | 查看可配置和锁定的字段 |
| `rl_edit_config` | 修改可配置的训练参数 |
| `rl_start_training` | 启动训练运行（生成 3 个进程） |
| `rl_check_status` | 监控训练进度和 WandB 指标 |
| `rl_stop_training` | 停止正在运行的训练作业 |
| `rl_get_results` | 获取最终指标和模型权重路径 |
| `rl_list_runs` | 列出所有活动和已完成的运行 |
| `rl_test_inference` | 使用 OpenRouter 进行快速推理测试 |

## 工作流

### 1. 发现环境

```
List the available RL environments
```

代理调用 `rl_list_environments()`，使用 AST 解析扫描 `tinker-atropos/tinker_atropos/environments/` 以查找继承自 `BaseEnv` 的 Python 类。每个环境定义：

- **数据集加载** — 训练数据来自哪里（例如 HuggingFace 数据集）
- **提示构建** — 如何为模型格式化项目
- **评分/验证** — 如何评估模型输出并分配奖励

### 2. 选择和配置

```
Select the GSM8K environment and show me the configuration
```

代理调用 `rl_select_environment("gsm8k_tinker")`，然后调用 `rl_get_current_config()` 查看所有参数。

配置字段分为两类：

**可配置字段**（可以修改）：
- `group_size` — 每个项目的 completions 数量（默认：16）
- `batch_size` — 训练批量大小（默认：128）
- `wandb_name` — WandB 运行名称（自动设置为 `{env}-{timestamp}`）
- 其他环境特定参数

**锁定字段**（基础设施设置，无法更改）：
- `tokenizer_name` — 模型分词器（例如 `Qwen/Qwen3-8B`）
- `rollout_server_url` — Atropos API URL（`http://localhost:8000`）
- `max_token_length` — 最大 token 长度（8192）
- `max_num_workers` — 最大并行 worker 数（2048）
- `total_steps` — 总训练步骤（2500）
- `lora_rank` — LoRA 适配器 rank（32）
- `learning_rate` — 学习率（4e-5）
- `max_token_trainer_length` — 训练器的最大 token 数（9000）

### 3. 开始训练

```
Start the training run
```

代理调用 `rl_start_training()`，这会：

1. 生成一个 YAML 配置文件，合并锁定设置与可配置覆盖
2. 创建唯一运行 ID
3. 生成三个进程：
   - **Atropos API 服务器**（`run-api`）— 轨迹协调
   - **Tinker 训练器**（`launch_training.py`）— LoRA 训练 + 端口 8001 上的 FastAPI 推理服务器
   - **环境**（`environment.py serve`）— 连接 Atropos 的选定环境

进程以交错延迟启动（API 5s，训练器 30s，环境再加 90s）以确保正确的初始化顺序。

### 4. 监控进度

```
Check the status of training run abc12345
```

代理调用 `rl_check_status(run_id)`，报告：

- 进程状态（3 个进程中每个的 running/exited）
- 运行时间
- WandB 指标（step、reward mean、percent correct、eval accuracy）
- 用于调试的日志文件位置

:::note 速率限制
状态检查每个 run ID 每 **30 分钟** 限制一次。这防止长时间运行的训练作业在数小时的过程中过度轮询。
:::

### 5. 停止或获取结果

```
Stop the training run
# 或
Get the final results for run abc12345
```

`rl_stop_training()` 以相反顺序（环境 → 训练器 → API）终止所有三个进程。`rl_get_results()` 检索最终 WandB 指标和训练历史。

## 推理测试

在提交完整训练运行之前，您可以使用 `rl_test_inference` 测试环境是否正常工作。这使用 OpenRouter 运行一些推理和评分步骤 — 不需要 Tinker API，只需要 `OPENROUTER_API_KEY`。

```
Test the selected environment with inference
```

默认配置：
- **3 步 × 16 个 completions = 每个模型 48 个 rollout**
- 测试 3 个不同规模的模型以验证稳健性：
  - `qwen/qwen3-8b`（小）
  - `z-ai/glm-4.7-flash`（中）
  - `minimax/minimax-m2.7`（大）
- 总计：约 144 个 rollout

这验证：
- 环境加载正确
- 提示构建工作
- 推理响应解析在不同模型规模下稳健
- 验证器/评分逻辑产生有效奖励

## Tinker API 集成

训练器使用 [Tinker](https://tinker.computer) API 进行模型训练操作：

- **ServiceClient** — 创建训练和采样客户端
- **训练客户端** — 使用重要性采样损失处理前向-后向传递、优化器步骤（Adam）和权重检查点
- **采样客户端** — 使用最新训练权重提供推理

训练循环：
1. 从 Atropos 获取一批 rollout（提示 + completions + 分数）
2. 转换为带有 padding logprobs 和优势的 Tinker Datum 对象
3. 使用重要性采样损失运行前向-后向传递
4. 采取优化器步骤（Adam: lr=4e-5, β1=0.9, β2=0.95）
5. 保存权重并为下一步推理创建新的采样客户端
6. 记录指标到 WandB

## 架构图

```mermaid
flowchart LR
    api["Atropos API<br/>run-api<br/>port 8000"]
    env["Environment<br/>BaseEnv implementation"]
    infer["OpenAI / sglang<br/>inference API<br/>port 8001"]
    trainer["Tinker Trainer<br/>LoRA training + FastAPI"]

    env <--> api
    env --> infer
    api -->|"batches: tokens, scores, logprobs"| trainer
    trainer -->|"serves inference"| infer
```

## 创建自定义环境

要创建新的 RL 环境：

1. 在 `tinker-atropos/tinker_atropos/environments/` 中创建 Python 文件
2. 定义继承自 `BaseEnv` 的类
3. 实现所需方法：
   - `load_dataset()` — 加载您的训练数据
   - `get_next_item()` — 向模型提供下一个项目
   - `score_answer()` — 评分模型输出并分配奖励
   - `collect_trajectories()` — 收集并返回轨迹
4. 可选定义继承自 `BaseEnvConfig` 的自定义配置类

以现有的 `gsm8k_tinker.py` 为模板学习。代理可以帮助您创建新环境 — 它可以读取现有环境文件、检查 HuggingFace 数据集和编写新环境代码。

## WandB 指标

训练运行使用这些关键指标记录到 Weights & Biases：

| 指标 | 描述 |
|--------|-------------|
| `train/loss` | 训练损失（重要性采样） |
| `train/learning_rate` | 当前学习率 |
| `reward/mean` | 组间的平均奖励 |
| `logprobs/mean` | 平均参考 logprobs |
| `logprobs/mean_training` | 平均训练 logprobs |
| `logprobs/diff` | Logprob 漂移（参考 - 训练） |
| `advantages/mean` | 平均优势值 |
| `advantages/std` | 优势标准差 |

## 日志文件

每个训练运行在 `~/.hermes/logs/rl_training/` 中生成日志文件：

```
logs/
├── api_{run_id}.log        # Atropos API 服务器日志
├── trainer_{run_id}.log    # Tinker 训练器日志
├── env_{run_id}.log        # 环境进程日志
└── inference_tests/        # 推理测试结果
    ├── test_{env}_{model}.jsonl
    └── test_{env}_{model}.log
```

这些在训练失败或产生意外结果时对调试非常重要。
