---
title: "AI 提供者"
sidebar_label: "AI 提供者"
sidebar_position: 1
---

# AI 提供者

本页面介绍为 Hermes Agent 设置推理提供商——从 OpenRouter 和 Anthropic 等云 API，到 Ollama 和 vLLM 等自托管端点，再到高级路由和备用配置。你需要至少配置一个提供商才能使用 Hermes。

## 推理提供商

你需要至少一种连接到 LLM 的方式。使用 `hermes model` 交互式切换提供商和模型，或直接配置：

| 提供商 | 设置 |
|----------|-------|
| **Nous Portal** | `hermes model`（OAuth，订阅制） |
| **OpenAI Codex** | `hermes model`（ChatGPT OAuth，使用 Codex 模型） |
| **GitHub Copilot** | `hermes model`（OAuth 设备代码流程，`COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 或 `gh auth token`） |
| **GitHub Copilot ACP** | `hermes model`（生成本地 `copilot --acp --stdio`） |
| **Anthropic** | `hermes model`（Claude Pro/Max 通过 Claude Code auth、Anthropic API 密钥或手动 setup-token） |
| **OpenRouter** | `~/.hermes/.env` 中的 `OPENROUTER_API_KEY` |
| **AI Gateway** | `~/.hermes/.env` 中的 `AI_GATEWAY_API_KEY`（提供商：`ai-gateway`） |
| **z.ai / GLM** | `~/.hermes/.env` 中的 `GLM_API_KEY`（提供商：`zai`） |
| **Kimi / Moonshot** | `~/.hermes/.env` 中的 `KIMI_API_KEY`（提供商：`kimi-coding`） |
| **MiniMax** | `~/.hermes/.env` 中的 `MINIMAX_API_KEY`（提供商：`minimax`） |
| **MiniMax 中国** | `~/.hermes/.env` 中的 `MINIMAX_CN_API_KEY`（提供商：`minimax-cn`） |
| **阿里云** | `~/.hermes/.env` 中的 `DASHSCOPE_API_KEY`（提供商：`alibaba`，别名：`dashscope`、`qwen`） |
| **Kilo Code** | `~/.hermes/.env` 中的 `KILOCODE_API_KEY`（提供商：`kilocode`） |
| **OpenCode Zen** | `~/.hermes/.env` 中的 `OPENCODE_ZEN_API_KEY`（提供商：`opencode-zen`） |
| **OpenCode Go** | `~/.hermes/.env` 中的 `OPENCODE_GO_API_KEY`（提供商：`opencode-go`） |
| **DeepSeek** | `~/.hermes/.env` 中的 `DEEPSEEK_API_KEY`（提供商：`deepseek`） |
| **Hugging Face** | `~/.hermes/.env` 中的 `HF_TOKEN`（提供商：`huggingface`，别名：`hf`） |
| **Google / Gemini** | `~/.hermes/.env` 中的 `GOOGLE_API_KEY`（或 `GEMINI_API_KEY`）（提供商：`gemini`） |
| **自定义端点** | `hermes model` → 选择"自定义端点"（保存在 `config.yaml`） |

:::tip 模型密钥别名
在 `model:` 配置部分，你可以使用 `default:` 或 `model:` 作为模型 ID 的键名。`model: { default: my-model }` 和 `model: { model: my-model }` 工作起来完全相同。
:::

:::info Codex 注意
OpenAI Codex 提供商通过设备代码进行身份验证（打开一个 URL，输入一个代码）。Hermes 将生成的凭证存储在自己的 auth store 中（`~/.hermes/auth.json`），并且当存在时可以从 `~/.codex/auth.json` 导入现有 Codex CLI 凭证。无需安装 Codex CLI。
:::

:::warning
即使使用 Nous Portal、Codex 或自定义端点，一些工具（vision、web summarization、MoA）使用单独的"辅助"模型——默认通过 OpenRouter 的 Gemini Flash。可以配置这些工具使用的模型和提供商——参见[辅助模型](/docs/user-guide/configuration#auxiliary-models)。
:::

### Anthropic（原生）

通过 Anthropic API 直接使用 Claude 模型——无需 OpenRouter 代理。支持三种 auth 方法：

```bash
# 使用 API 密钥（按量付费）
export ANTHROPIC_API_KEY=***
hermes chat --provider anthropic --model claude-sonnet-4-6

# 首选：通过 `hermes model` 进行身份验证
# 当 Claude Code 凭证可用时，Hermes 直接使用其凭证存储
hermes model

# 带有 setup-token 的手动覆盖（备用/传统）
export ANTHROPIC_TOKEN=***  # setup-token 或手动 OAuth token
hermes chat --provider anthropic

# 自动检测 Claude Code 凭证（如果你已经使用 Claude Code）
hermes chat --provider anthropic  # 自动读取 Claude Code 凭证文件
```

当你通过 `hermes model` 选择 Anthropic OAuth 时，Hermes 优先使用 Claude Code 自己的凭证存储，而不是将 token 复制到 `~/.hermes/.env`。这使可刷新的 Claude 凭证保持可刷新。

或永久设置：
```yaml
model:
  provider: "anthropic"
  default: "claude-sonnet-4-6"
```

:::tip 别名
`--provider claude` 和 `--provider claude-code` 也可以作为 `--provider anthropic` 的简写。
:::

### GitHub Copilot

Hermes 支持作为一等提供商的 GitHub Copilot，有两种模式：

**`copilot` — 直接 Copilot API**（推荐）。使用你的 GitHub Copilot 订阅通过 Copilot API 访问 GPT-5.x、Claude、Gemini 和其他模型。

```bash
hermes chat --provider copilot --model gpt-5.4
```

**认证选项**（按此顺序检查）：

1. `COPILOT_GITHUB_TOKEN` 环境变量
2. `GH_TOKEN` 环境变量
3. `GITHUB_TOKEN` 环境变量
4. `gh auth token` CLI 备用

如果没有找到 token，`hermes model` 提供 **OAuth 设备代码登录**——Copilot CLI 和 opencode 使用的相同流程。

:::warning Token 类型
Copilot API **不支持**经典的个人访问令牌（`ghp_*`）。支持的 token 类型：

| 类型 | 前缀 | 如何获取 |
|------|--------|------------|
| OAuth token | `gho_` | `hermes model` → GitHub Copilot → 用 GitHub 登录 |
| 细粒度 PAT | `github_pat_` | GitHub Settings → Developer settings → 细粒度 tokens（需要 **Copilot Requests** 权限） |
| GitHub App token | `ghu_` | 通过 GitHub App 安装 |

如果你的 `gh auth token` 返回一个 `ghp_*` token，使用 `hermes model` 通过 OAuth 进行身份验证。
:::

**API 路由**：GPT-5+ 模型（`gpt-5-mini` 除外）自动使用 Responses API。所有其他模型（GPT-4o、Claude、Gemini 等）使用 Chat Completions。模型从实时 Copilot 目录自动检测。

**`copilot-acp` — Copilot ACP 代理后端**。将本地 Copilot CLI 作为子进程生成：

```bash
hermes chat --provider copilot-acp --model copilot-acp
# 需要 PATH 中的 GitHub Copilot CLI 和现有的 `copilot login` 会话
```

**永久配置：**
```yaml
model:
  provider: "copilot"
  default: "gpt-5.4"
```

| 环境变量 | 描述 |
|---------------------|-------------|
| `COPILOT_GITHUB_TOKEN` | Copilot API 的 GitHub token（第一优先级） |
| `HERMES_COPILOT_ACP_COMMAND` | 覆盖 Copilot CLI 二进制路径（默认：`copilot`） |
| `HERMES_COPILOT_ACP_ARGS` | 覆盖 ACP 参数（默认：`--acp --stdio`） |

### 一等中国 AI 提供商

这些提供商具有内置支持并有专用提供商 ID。设置 API 密钥并使用 `--provider` 选择：

```bash
# z.ai / ZhipuAI GLM
hermes chat --provider zai --model glm-5
# 需要：~/.hermes/.env 中的 GLM_API_KEY

# Kimi / Moonshot AI
hermes chat --provider kimi-coding --model kimi-for-coding
# 需要：~/.hermes/.env 中的 KIMI_API_KEY

# MiniMax（全球端点）
hermes chat --provider minimax --model MiniMax-M2.7
# 需要：~/.hermes/.env 中的 MINIMAX_API_KEY

# MiniMax（中国端点）
hermes chat --provider minimax-cn --model MiniMax-M2.7
# 需要：~/.hermes/.env 中的 MINIMAX_CN_API_KEY

# 阿里云 / DashScope（Qwen 模型）
hermes chat --provider alibaba --model qwen3.5-plus
# 需要：~/.hermes/.env 中的 DASHSCOPE_API_KEY
```

或在 `config.yaml` 中永久设置提供商：
```yaml
model:
  provider: "zai"       # 或者：kimi-coding、minimax、minimax-cn、alibaba
  default: "glm-5"
```

可以用 `GLM_BASE_URL`、`KIMI_BASE_URL`、`MINIMAX_BASE_URL`、`MINIMAX_CN_BASE_URL` 或 `DASHSCOPE_BASE_URL` 环境变量覆盖 base URL。

:::note Z.AI 端点自动检测
使用 Z.AI / GLM 提供商时，Hermes 自动探测多个端点（全球、中国、编码变体）以找到接受你的 API 密钥的端点。你无需手动设置 `GLM_BASE_URL`——工作端点被自动检测并缓存。
:::

### xAI（Grok）提示缓存

当使用 xAI 作为提供商时（任何包含 `x.ai` 的 base URL），Hermes 通过为每个 API 请求发送 `x-grok-conv-id` 标头自动启用提示缓存。这在同一会话内将请求路由到同一服务器，允许 xAI 的基础设施重用缓存的系统提示和对话历史。

无需配置——当检测到 xAI 端点且会话 ID 可用时，缓存自动激活。这减少了多轮对话的延迟和成本。

### Hugging Face 推理提供商

[Hugging Face 推理提供商](https://huggingface.co/docs/inference-providers) 通过统一的 OpenAI 兼容端点（`router.huggingface.co/v1`）路由到 20+ 开放模型。请求自动路由到最快可用的后端（Groq、Together、SambaNova 等），并具有自动故障转移。

```bash
# 使用任何可用模型
hermes chat --provider huggingface --model Qwen/Qwen3-235B-A22B-Thinking-2507
# 需要：~/.hermes/.env 中的 HF_TOKEN

# 短别名
hermes chat --provider hf --model deepseek-ai/DeepSeek-V3.2
```

或在 `config.yaml` 中永久设置：
```yaml
model:
  provider: "huggingface"
  default: "Qwen/Qwen3-235B-A22B-Thinking-2507"
```

在 [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) 获取你的 token——确保启用"Make calls to Inference Providers"权限。包含免费等级（每月 $0.10 信用，对提供商费率无加价）。

你可以在模型名称后附加路由后缀：`:fastest`（默认）、`:cheapest` 或 `:provider_name` 以强制使用特定后端。

base URL 可以用 `HF_BASE_URL` 覆盖。

## 自定义和自托管 LLM 提供商

Hermes Agent 与**任何 OpenAI 兼容 API 端点**配合工作。如果服务器实现了 `/v1/chat/completions`，你就可以将 Hermes 指向它。这意味着你可以使用本地模型、GPU 推理服务器、多提供商路由器或任何第三方 API。

### 一般设置

配置自定义端点的三种方式：

**交互式设置（推荐）：**
```bash
hermes model
# 选择"Custom endpoint (self-hosted / VLLM / etc.)"
# 输入：API base URL、API 密钥、模型名称
```

**手动配置（`config.yaml`）：**
```yaml
# In ~/.hermes/config.yaml
model:
  default: your-model-name
  provider: custom
  base_url: http://localhost:8000/v1
  api_key: your-key-or-leave-empty-for-local
```

:::warning 旧环境变量
`.env` 中的 `OPENAI_BASE_URL` 和 `LLM_MODEL` **已弃用**。`OPENAI_BASE_URL` 不再被咨询用于端点解析——`config.yaml` 是唯一的事实来源。CLI 完全忽略 `LLM_MODEL`（只有网关将其作为备用读取）。使用 `hermes model` 或直接编辑 `config.yaml`——两者都能正确持久化跨重启和 Docker 容器。
:::

两种方法都持久化到 `config.yaml`，它是模型、提供商和 base URL 的事实来源。

### 使用 `/model` 切换模型

配置自定义端点后，你可以在会话中切换模型：

```
/model custom:qwen-2.5          # 切换到自定义端点上的模型
/model custom                    # 从端点自动检测模型
/model openrouter:claude-sonnet-4 # 切换回云提供商
```

如果你有**命名自定义提供商**配置（见下文），使用三重复语：

```
/model custom:local:qwen-2.5    # 使用"local"自定义提供商和 qwen-2.5 模型
/model custom:work:llama3       # 使用"work"自定义提供商和 llama3 模型
```

切换提供商时，Hermes 将 base URL 和提供商持久化到配置，以便更改跨重启生效。当从自定义端点切换离开到内置提供商时，旧的 base URL 会自动清除。

:::tip
`/model custom`（裸，无模型名）查询你端点的 `/models` API，如果正好加载了一个模型则自动选择它。适用于运行单个模型的本地服务器。
:::

以下所有都遵循相同模式——只需更改 URL、密钥和模型名称。

---

### Ollama — 本地模型，零配置

[Ollama](https://ollama.com/) 一条命令在本地运行开放权重模型。最适合：快速本地实验、隐私敏感工作、离线使用。通过 OpenAI 兼容 API 支持工具调用。

```bash
# 安装并运行模型
ollama pull qwen2.5-coder:32b
ollama serve   # 在端口 11434 启动
```

然后配置 Hermes：

```bash
hermes model
# 选择"Custom endpoint (self-hosted / VLLM / etc.)"
# 输入 URL：http://localhost:11434/v1
# 跳过 API 密钥（Ollama 不需要）
# 输入模型名称（例如 qwen2.5-coder:32b）
```

或直接配置 `config.yaml`：

```yaml
model:
  default: qwen2.5-coder:32b
  provider: custom
  base_url: http://localhost:11434/v1
  context_length: 32768   # 见下面的警告
```

:::caution Ollama 默认上下文长度非常低
Ollama **不使用**模型的完整上下文窗口。默认值取决于你的 VRAM：

| 可用 VRAM | 默认上下文 |
|----------------|----------------|
| 少于 24 GB | **4,096 tokens** |
| 24–48 GB | 32,768 tokens |
| 48+ GB | 256,000 tokens |

对于使用工具的代理，你需要至少 16k–32k 上下文。在 4k，系统提示 + 工具模式本身就可以填满窗口，没有对话的空间。

**如何增加**（选一个）：

```bash
# 选项 1：通过环境变量设置服务器范围（推荐）
OLLAMA_CONTEXT_LENGTH=32768 ollama serve

# 选项 2：对于 systemd 管理的 Ollama
sudo systemctl edit ollama.service
# 添加：Environment="OLLAMA_CONTEXT_LENGTH=32768"
# 然后：sudo systemctl daemon-reload && sudo systemctl restart ollama

# 选项 3：烘焙到自定义模型（持久化每个模型）
echo -e "FROM qwen2.5-coder:32b\nPARAMETER num_ctx 32768" > Modelfile
ollama create qwen2.5-coder-32k -f Modelfile
```

**你无法通过 OpenAI 兼容 API**（`/v1/chat/completions`）设置上下文长度。必须通过服务器端或 Modelfile 配置。这是将 Ollama 与 Hermes 等工具集成时的首要困惑来源。
:::

**验证你的上下文设置正确：**

```bash
ollama ps
# 查看 CONTEXT 列——它应该显示你配置的值
```

:::tip
用 `ollama list` 列出可用模型。从 [Ollama 库](https://ollama.com/library) 用 `ollama pull <model>` 拉取任何模型。Ollama 自动处理 GPU 卸载——大多数设置无需配置。
:::

---

### vLLM — 高性能 GPU 推理

[vLLM](https://docs.vllm.ai/) 是生产 LLM 服务的标准。最适合：GPU 硬件上的最大吞吐量、服务大型模型、连续批处理。

```bash
pip install vllm
vllm serve meta-llama/Llama-3.1-70B-Instruct \
  --port 8000 \
  --max-model-len 65536 \
  --tensor-parallel-size 2 \
  --enable-auto-tool-choice \
  --tool-call-parser hermes
```

然后配置 Hermes：

```bash
hermes model
# 选择"Custom endpoint (self-hosted / VLLM / etc.)"
# 输入 URL：http://localhost:8000/v1
# 跳过 API 密钥（如果你用 --api-key 配置了 vLLM 则输入一个）
# 输入模型名称：meta-llama/Llama-3.1-70B-Instruct
```

**上下文长度：** vLLM 默认读取模型的 `max_position_embeddings`。如果这超过你的 GPU 内存，它会出错并要求你设置更低的 `--max-model-len`。你也可以使用 `--max-model-len auto` 自动找到适合的最大值。设置 `--gpu-memory-utilization 0.95`（默认 0.9）以在 VRAM 中容纳更多上下文。

**工具调用需要显式标志：**

| 标志 | 目的 |
|------|---------|
| `--enable-auto-tool-choice` | 对于 `tool_choice: "auto"`（Hermes 中的默认）是必需的 |
| `--tool-call-parser <name>` | 模型工具调用格式的解析器 |

支持的解析器：`hermes`（Qwen 2.5、Hermes 2/3）、`llama3_json`（Llama 3.x）、`mistral`、`deepseek_v3`、`deepseek_v31`、`xlam`、`pythonic`。没有这些标志，工具调用不工作——模型会将工具调用输出为文本。

:::tip
vLLM 支持人类可读的尺寸：`--max-model-len 64k`（小写 k = 1000，大写 K = 1024）。
:::

---

### SGLang — 带 RadixAttention 的快速服务

[SGLang](https://github.com/sgl-project/sglang) 是 vLLM 的替代方案，具有 RadixAttention 用于 KV 缓存重用。最适合：多轮对话（前缀缓存）、约束解码、结构化输出。

```bash
pip install "sglang[all]"
python -m sglang.launch_server \
  --model meta-llama/Llama-3.1-70B-Instruct \
  --port 30000 \
  --context-length 65536 \
  --tp 2 \
  --tool-call-parser qwen
```

然后配置 Hermes：

```bash
hermes model
# 选择"Custom endpoint (self-hosted / VLLM / etc.)"
# 输入 URL：http://localhost:30000/v1
# 输入模型名称：meta-llama/Llama-3.1-70B-Instruct
```

**上下文长度：** SGLang 默认从模型配置读取。用 `--context-length` 覆盖。如果你需要超过模型声明的最大值，设置 `SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1`。

**工具调用：** 使用 `--tool-call-parser` 以及模型系列对应的解析器：`qwen`（Qwen 2.5）、`llama3`、`llama4`、`deepseekv3`、`mistral`、`glm`。没有此标志，工具调用会作为纯文本返回。

:::caution SGLang 默认最大输出 128 tokens
如果响应看起来被截断，在请求中添加 `max_tokens` 或在服务器上设置 `--default-max-tokens`。SGLang 的默认值只有 128 tokens per response（如果请求中未指定）。
:::

---

### llama.cpp / llama-server — CPU 和 Metal 推理

[llama.cpp](https://github.com/ggml-org/llama.cpp) 在 CPU、Apple Silicon（Metal）和消费级 GPU 上运行量化模型。最适合：在数据中心 GPU 外运行模型、Mac 用户、边缘部署。

```bash
# 构建并启动 llama-server
cmake -B build && cmake --build build --config Release
./build/bin/llama-server \
  --jinja -fa \
  -c 32768 \
  -ngl 99 \
  -m models/qwen2.5-coder-32b-instruct-Q4_K_M.gguf \
  --port 8080 --host 0.0.0.0
```

**上下文长度（`-c`）：** 最近的构建默认为 `0`，从 GGUF 元数据读取训练上下文。对于具有 128k+ 训练上下文的模型，这可能 OOM 尝试分配完整 KV 缓存。显式设置 `-c` 为你需要的内容（32k–64k 是代理使用的好范围）。如果使用并行插槽（`-np`），总上下文在插槽之间分配——使用 `-c 32768 -np 4`，每个插槽只得到 8k。

然后配置 Hermes 指向它：

```bash
hermes model
# 选择"Custom endpoint (self-hosted / VLLM / etc.)"
# 输入 URL：http://localhost:8080/v1
# 跳过 API 密钥（本地服务器不需要）
# 输入模型名称——或者如果只加载了一个模型则留空以自动检测
```

这将端点保存到 `config.yaml` 以便跨会话持久化。

:::caution `--jinja` 对于工具调用是必需的
没有 `--jinja`，llama-server 完全忽略 `tools` 参数。模型会尝试通过在响应文本中写入 JSON 来调用工具，但 Hermes 不会将其识别为工具调用——你会看到原始 JSON 如 `{"name": "web_search", ...}` 作为消息打印，而不是实际搜索。

原生工具调用支持（最佳性能）：Llama 3.x、Qwen 2.5（包括 Coder）、Hermes 2/3、Mistral、DeepSeek、Functionary。所有其他模型使用通用处理器，可以工作但可能效率较低。见 [llama.cpp 函数调用文档](https://github.com/ggml-org/llama.cpp/blob/master/docs/function-calling.md) 获取完整列表。

你可以通过检查 `http://localhost:8080/props` 验证工具支持是否激活——`chat_template` 字段应该存在。
:::

:::tip
从 [Hugging Face](https://huggingface.co/models?library=gguf) 下载 GGUF 模型。Q4_K_M 量化在质量和内存使用之间提供最佳平衡。
:::

---

### LM Studio — 带有本地模型的桌面应用

[LM Studio](https://lmstudio.ai/) 是一个用于运行本地模型的桌面应用。最适合：喜欢图形界面的用户、快速模型测试、macOS/Windows/Linux 开发者。

从 LM Studio 应用启动服务器（Developer 选项卡 → Start Server），或使用 CLI：

```bash
lms server start                        # 在端口 1234 启动
lms load qwen2.5-coder --context-length 32768
```

然后配置 Hermes：

```bash
hermes model
# 选择"Custom endpoint (self-hosted / VLLM / etc.)"
# 输入 URL：http://localhost:1234/v1
# 跳过 API 密钥（LM Studio 不需要）
# 输入模型名称
```

:::caution 上下文长度通常默认为 2048
LM Studio 从模型元数据读取上下文长度，但许多 GGUF 模型报告低默认值（2048 或 4096）。**始终在 LM Studio 模型设置中显式设置上下文长度**：

1. 点击模型选择器旁边的齿轮图标
2. 将"Context Length"设置为至少 16384（最好 32768）
3. 重新加载模型以使更改生效

或者使用 CLI：`lms load model-name --context-length 32768`

设置持久化每个模型默认值：My Models 选项卡 → 模型上的齿轮图标 → 设置上下文大小。
:::

**工具调用：** 自 LM Studio 0.3.6 起支持。具有原生工具调用训练的模型（Qwen 2.5、Llama 3.x、Mistral、Hermes）自动检测并显示工具徽章。其他模型使用可能在不太可靠的通用回退。

---

### WSL2 网络（Windows 用户）

由于 Hermes Agent 需要 Unix 环境，Windows 用户在 WSL2 内运行它。如果你的模型服务器（Ollama、LM Studio 等）运行在 **Windows 主机**上，你需要弥合网络差距——WSL2 使用虚拟网络适配器，有自己的子网，所以 WSL2 内的 `localhost` 指的是 Linux VM，**而不是** Windows 主机。

:::tip 两者都在 WSL2 中？没问题。
如果你的模型服务器也在 WSL2 内运行（vLLM、SGLang、llama-server 等很常见），`localhost` 按预期工作——它们共享相同的网络命名空间。跳过本节。
:::

#### 选项 1：镜像网络模式（推荐）

**Windows 11 22H2+** 可用，镜像模式使 `localhost` 在 Windows 和 WSL2 之间双向工作——最简单的修复。

1. 创建或编辑 `%USERPROFILE%\.wslconfig`（例如 `C:\Users\YourName\.wslconfig`）：
   ```ini
   [wsl2]
   networkingMode=mirrored
   ```

2. 从 PowerShell 重启 WSL：
   ```powershell
   wsl --shutdown
   ```

3. 重新打开 WSL2 终端。`localhost` 现在可以访问 Windows 服务：
   ```bash
   curl http://localhost:11434/v1/models   # Windows 上的 Ollama — 工作
   ```

:::note Hyper-V 防火墙
在一些 Windows 11 构建中，Hyper-V 防火墙默认阻止镜像连接。如果启用镜像模式后 `localhost` 仍然不工作，在**管理员 PowerShell**中运行：
```powershell
Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow
```
:::

#### 选项 2：使用 Windows 主机 IP（Windows 10 / 旧构建）

如果你无法使用镜像模式，从 WSL2 内部找到 Windows 主机 IP 并用它代替 `localhost`：

```bash
# 获取 Windows 主机 IP（WSL2 虚拟网络的默认网关）
ip route show | grep -i default | awk '{ print $3 }'
# 示例输出：172.29.192.1
```

在你的 Hermes 配置中使用该 IP：

```yaml
model:
  default: qwen2.5-coder:32b
  provider: custom
  base_url: http://172.29.192.1:11434/v1   # Windows 主机 IP，不是 localhost
```

:::tip 动态辅助
主机 IP 可能在 WSL2 重启时更改。你可以在 shell 中动态获取：
```bash
export WSL_HOST=$(ip route show | grep -i default | awk '{ print $3 }')
echo "Windows host at: $WSL_HOST"
curl http://$WSL_HOST:11434/v1/models   # 测试 Ollama
```

或者使用你机器的 mDNS 名称（需要在 WSL2 中安装 `libnss-mdns`）：
```bash
sudo apt install libnss-mdns
curl http://$(hostname).local:11434/v1/models
```
:::

#### 服务器绑定地址（NAT 模式需要）

如果你使用 **选项 2**（带主机 IP 的 NAT 模式），Windows 上的模型服务器必须接受来自 `127.0.0.1` 外部的连接。默认情况下，大多数服务器只监听 localhost——WSL2 NAT 模式中的连接来自不同的虚拟子网，将被拒绝。在镜像模式中，`localhost` 直接映射，所以默认 `127.0.0.1` 绑定工作正常。

| 服务器 | 默认绑定 | 如何修复 |
|--------|-------------|------------|
| **Ollama** | `127.0.0.1` | 在启动 Ollama 前设置 `OLLAMA_HOST=0.0.0.0` 环境变量（Windows 上的系统设置 → 环境变量，或编辑 Ollama 服务） |
| **LM Studio** | `127.0.0.1` | 在 Developer 选项卡 → Server 设置中启用 **"Serve on Network"** |
| **llama-server** | `127.0.0.1` | 在启动命令中添加 `--host 0.0.0.0` |
| **vLLM** | `0.0.0.0` | 已经绑定到所有接口 |
| **SGLang** | `127.0.0.1` | 在启动命令中添加 `--host 0.0.0.0` |

**Windows 上的 Ollama（详细）：** Ollama 作为 Windows 服务运行。设置 `OLLAMA_HOST`：
1. 打开**系统属性** → **环境变量**
2. 添加新的**系统变量**：`OLLAMA_HOST` = `0.0.0.0`
3. 重启 Ollama 服务（或重启）

#### Windows 防火墙

Windows 防火墙将 WSL2 视为单独的网络（在 NAT 和镜像模式中都是）。如果上述步骤后连接仍然失败，为你的模型服务器端口添加防火墙规则：

```powershell
# 在管理员 PowerShell 中运行 — 将 PORT 替换为你的服务器端口
New-NetFirewallRule -DisplayName "Allow WSL2 to Model Server" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 11434
```

常见端口：Ollama `11434`、vLLM `8000`、SGLang `30000`、llama-server `8080`、LM Studio `1234`。

#### 快速验证

从 WSL2 内部，测试你可以到达你的模型服务器：

```bash
# 将 URL 替换为你的服务器地址和端口
curl http://localhost:11434/v1/models          # 镜像模式
curl http://172.29.192.1:11434/v1/models       # NAT 模式（使用你实际的主机 IP）
```

如果你得到列出模型的 JSON 响应，你就准备好了。在 Hermes 配置中使用相同的 URL 作为 `base_url`。

---

### 本地模型故障排除

这些问题影响**所有**与 Hermes 一起使用的本地推理服务器。

#### 从 WSL2 到 Windows 托管模型服务器的"连接被拒绝"

如果你在 WSL2 内运行 Hermes 而模型服务器在 Windows 主机上，`http://localhost:<port>` 在 WSL2 的默认 NAT 网络模式中不工作。见上面 [WSL2 网络](#wsl2-networking-windows-users) 的修复。

#### 工具调用显示为文本而不是执行

模型输出类似 `{"name": "web_search", "arguments": {...}}` 作为消息而不是实际调用工具。

**原因：** 你的服务器没有启用工具调用，或者模型不支持服务器的 tool calling 实现。

| 服务器 | 修复 |
|--------|------|
| **llama.cpp** | 在启动命令中添加 `--jinja` |
| **vLLM** | 添加 `--enable-auto-tool-choice --tool-call-parser hermes` |
| **SGLang** | 添加 `--tool-call-parser qwen`（或适当的解析器） |
| **Ollama** | 工具调用默认启用——确保你的模型支持它（用 `ollama show model-name` 检查） |
| **LM Studio** | 更新到 0.3.6+ 并使用具有原生工具支持的模型 |

#### 模型似乎忘记上下文或给出不连贯的响应

**原因：** 上下文窗口太小。当对话超过上下文限制时，大多数服务器悄悄删除旧消息。Hermes 的系统提示 + 工具模式本身可以使用 4k–8k tokens。

**诊断：**

```bash
# 检查 Hermes 认为的上下文是什么
# 查看启动行："Context limit: X tokens"

# 检查你服务器的实际上下文
# Ollama：ollama ps（CONTEXT 列）
# llama.cpp：curl http://localhost:8080/props | jq '.default_generation_settings.n_ctx'
# vLLM：检查启动参数中的 --max-model-len
```

**修复：** 对于代理使用，将上下文设置为至少 **32,768 tokens**。见每个服务器上面的具体标志。

#### 启动时"上下文限制：2048 tokens"

Hermes 从服务器的 `/v1/models` 端点自动检测上下文长度。如果服务器报告低值（或者根本不报告），Hermes 使用模型声明的限制，可能是错误的。

**修复：** 在 `config.yaml` 中显式设置：

```yaml
model:
  default: your-model
  provider: custom
  base_url: http://localhost:11434/v1
  context_length: 32768
```

#### 响应在句子中间被切断

**可能原因：**
1. **服务器上的 `max_tokens` 太低** — SGLang 默认为每响应 128 tokens。在服务器上设置 `--default-max-tokens` 或在 Hermes 中用 `model.max_tokens` 配置。
2. **上下文耗尽** — 模型填满了它的上下文窗口。增加上下文长度或在 Hermes 中启用[上下文压缩](/docs/user-guide/configuration#context-compression)。

---

### LiteLLM 代理 — 多提供商网关

[LiteLLM](https://docs.litellm.ai/) 是一个 OpenAI 兼容代理，统一 100+ LLM 提供商在单个 API 后面。最适合：无需配置更改即可在提供商之间切换、负载均衡、备用链、预算控制。

```bash
# 安装并启动
pip install "litellm[proxy]"
litellm --model anthropic/claude-sonnet-4 --port 4000

# 或者用配置文件支持多个模型：
litellm --config litellm_config.yaml --port 4000
```

然后用 `hermes model` → Custom endpoint → `http://localhost:4000/v1` 配置 Hermes。

带有备用的 `litellm_config.yaml` 示例：
```yaml
model_list:
  - model_name: "best"
    litellm_params:
      model: anthropic/claude-sonnet-4
      api_key: sk-ant-...
  - model_name: "best"
    litellm_params:
      model: openai/gpt-4o
      api_key: sk-...
router_settings:
  routing_strategy: "latency-based-routing"
```

---

### ClawRouter — 成本优化路由

BlockRunAI 的 [ClawRouter](https://github.com/BlockRunAI/ClawRouter) 是一个本地路由代理，根据查询复杂性自动选择模型。它从 14 个维度对请求进行分类，并路由到能够处理任务的最便宜模型。付款通过 USDC 加密货币（无需 API 密钥）。

```bash
# 安装并启动
npx @blockrun/clawrouter    # 在端口 8402 启动
```

然后用 `hermes model` → Custom endpoint → `http://localhost:8402/v1` → 模型名称 `blockrun/auto` 配置 Hermes。

路由配置：
| 配置 | 策略 | 节省 |
|---------|----------|--------|
| `blockrun/auto` | 平衡质量/成本 | 74-100% |
| `blockrun/eco` | 最便宜可能 | 95-100% |
| `blockrun/premium` | 最佳质量模型 | 0% |
| `blockrun/free` | 仅免费模型 | 100% |
| `blockrun/agentic` | 针对工具使用优化 | 变化 |

:::note
ClawRouter 需要在 Base 或 Solana 上充值 USDC 的钱包。所有请求通过 BlockRun 的后端 API 路由。运行 `npx @blockrun/clawrouter doctor` 检查钱包状态。
:::

---

### 其他兼容提供商

任何具有 OpenAI 兼容 API 的服务都可以工作。一些流行的选项：

| 提供商 | Base URL | 备注 |
|----------|----------|-------|
| [Together AI](https://together.ai) | `https://api.together.xyz/v1` | 云托管开放模型 |
| [Groq](https://groq.com) | `https://api.groq.com/openai/v1` | 超快推理 |
| [DeepSeek](https://deepseek.com) | `https://api.deepseek.com/v1` | DeepSeek 模型 |
| [Fireworks AI](https://fireworks.ai) | `https://api.fireworks.ai/inference/v1` | 快速开放模型托管 |
| [Cerebras](https://cerebras.ai) | `https://api.cerebras.ai/v1` | 晶圆级芯片推理 |
| [Mistral AI](https://mistral.ai) | `https://api.mistral.ai/v1` | Mistral 模型 |
| [OpenAI](https://openai.com) | `https://api.openai.com/v1` | 直接 OpenAI 访问 |
| [Azure OpenAI](https://azure.microsoft.com) | `https://YOUR.openai.azure.com/` | 企业 OpenAI |
| [LocalAI](https://localai.io) | `http://localhost:8080/v1` | 自托管、多模型 |
| [Jan](https://jan.ai) | `http://localhost:1337/v1` | 带有本地模型的桌面应用 |

用 `hermes model` → Custom endpoint 或在 `config.yaml` 中配置其中任何一个：

```yaml
model:
  default: meta-llama/Llama-3.1-70B-Instruct-Turbo
  provider: custom
  base_url: https://api.together.xyz/v1
  api_key: your-together-key
```

---

### 上下文长度检测

Hermes 使用多源解析链来检测模型和提供商的正确上下文窗口：

1. **配置覆盖** — `config.yaml` 中的 `model.context_length`（最高优先级）
2. **自定义提供商每模型** — `custom_providers[].models.<id>.context_length`
3. **持久化缓存** — 之前发现的值（跨重启保持）
4. **端点 `/models`** — 查询你服务器的 API（本地/自定义端点）
5. **Anthropic `/v1/models`** — 查询 Anthropic 的 API 获取 `max_input_tokens`（仅 API 密钥用户）
6. **OpenRouter API** — 来自 OpenRouter 的实时模型元数据
7. **Nous Portal** — 在 OpenRouter 元数据上后缀匹配 Nous 模型 ID
8. **[models.dev](https://models.dev)** — 为 3800+ 模型跨 100+ 提供商的社区维护注册表，包含提供商特定的上下文长度
9. **备用默认值** — 广泛的模型系列模式（128K 默认）

对于大多数设置开箱即用。系统是提供商感知的——同一个模型可以根据服务它的人有不同的上下文限制（例如，`claude-opus-4.6` 在 Anthropic direct 上是 1M，但在 GitHub Copilot 上是 128K）。

要显式设置上下文长度，将 `context_length` 添加到你的模型配置：

```yaml
model:
  default: "qwen3.5:9b"
  base_url: "http://localhost:8080/v1"
  context_length: 131072  # tokens
```

对于自定义端点，你也可以按模型设置上下文长度：

```yaml
custom_providers:
  - name: "My Local LLM"
    base_url: http://localhost:11434/v1
    models:
      qwen3.5:27b:
        context_length: 32768
      deepseek-r1:70b:
        context_length: 65536
```

`hermes model` 在配置自定义端点时会提示输入上下文长度。为自动检测留空。

:::tip 何时手动设置
- 你使用具有低于模型最大值的自定义 `num_ctx` 的 Ollama
- 你想将上下文限制在模型最大值以下（例如，在 128k 模型上使用 8k 以节省 VRAM）
- 你在代理后面运行，不暴露 `/v1/models`
:::

---

### 命名自定义提供商

如果你使用多个自定义端点（例如，本地开发服务器和远程 GPU 服务器），你可以在 `config.yaml` 中将它们定义为命名自定义提供商：

```yaml
custom_providers:
  - name: local
    base_url: http://localhost:8080/v1
    # api_key 省略 — Hermes 为无密钥本地服务器使用"no-key-required"
  - name: work
    base_url: https://gpu-server.internal.corp/v1
    api_key: corp-api-key
    api_mode: chat_completions   # 可选，从 URL 自动检测
  - name: anthropic-proxy
    base_url: https://proxy.example.com/anthropic
    api_key: proxy-key
    api_mode: anthropic_messages  # 用于 Anthropic 兼容代理
```

在会话中用三重复语在它们之间切换：

```
/model custom:local:qwen-2.5       # 使用"local"端点和 qwen-2.5
/model custom:work:llama3-70b      # 使用"work"端点和 llama3-70b
/model custom:anthropic-proxy:claude-sonnet-4  # 使用代理
```

你也可以从交互式 `hermes model` 菜单中选择命名自定义提供商。

---

### 选择正确的设置

| 使用场景 | 推荐 |
|----------|---------|
| **只想让它工作** | OpenRouter（默认）或 Nous Portal |
| **本地模型，轻松设置** | Ollama |
| **生产 GPU 服务** | vLLM 或 SGLang |
| **Mac / 无 GPU** | Ollama 或 llama.cpp |
| **多提供商路由** | LiteLLM Proxy 或 OpenRouter |
| **成本优化** | ClawRouter 或带有 `sort: "price"` 的 OpenRouter |
| **最大隐私** | Ollama、vLLM 或 llama.cpp（完全本地） |
| **企业 / Azure** | 具有自定义端点的 Azure OpenAI |
| **中国 AI 模型** | z.ai（GLM）、Kimi/Moonshot 或 MiniMax（一等提供商） |

:::tip
你随时可以用 `hermes model` 在提供商之间切换——无需重启。你的对话历史、记忆和技能会跨提供商保留。
:::

## 可选 API 密钥

| 功能 | 提供商 | 环境变量 |
|---------|----------|--------------|
| 网页抓取 | [Firecrawl](https://firecrawl.dev/) | `FIRECRAWL_API_KEY`、`FIRECRAWL_API_URL` |
| 浏览器自动化 | [Browserbase](https://browserbase.com/) | `BROWSERBASE_API_KEY`、`BROWSERBASE_PROJECT_ID` |
| 图像生成 | [FAL](https://fal.ai/) | `FAL_KEY` |
| 高级 TTS 语音 | [ElevenLabs](https://elevenlabs.io/) | `ELEVENLABS_API_KEY` |
| OpenAI TTS + 语音转录 | [OpenAI](https://platform.openai.com/api-keys) | `VOICE_TOOLS_OPENAI_KEY` |
| 强化学习训练 | [Tinker](https://tinker-console.thinkingmachines.ai/) + [WandB](https://wandb.ai/) | `TINKER_API_KEY`、`WANDB_API_KEY` |
| 跨会话用户建模 | [Honcho](https://honcho.dev/) | `HONCHO_API_KEY` |
| 语义长期记忆 | [Supermemory](https://supermemory.ai) | `SUPERMEMORY_API_KEY` |

### 自托管 Firecrawl

默认情况下，Hermes 使用 [Firecrawl 云 API](https://firecrawl.dev/) 进行网络搜索和抓取。如果你更喜欢在本地运行 Firecrawl，你可以将 Hermes 指向自托管实例。见 Firecrawl 的 [SELF_HOST.md](https://github.com/firecrawl/firecrawl/blob/main/SELF_HOST.md) 获取完整设置说明。

**你得到的：** 无需 API 密钥、无速率限制、无按页费用、完全数据主权。

**你失去的：** 云版本使用 Firecrawl 专有的"Fire-engine"进行高级反机器人绕过（Cloudflare、CAPTCHA、IP 轮换）。自托管使用基本 fetch + Playwright，因此一些受保护站点可能失败。搜索使用 DuckDuckGo 而不是 Google。

**设置：**

1. 克隆并启动 Firecrawl Docker 堆栈（5 个容器：API、Playwright、Redis、RabbitMQ、PostgreSQL — 需要约 4-8 GB RAM）：
   ```bash
   git clone https://github.com/firecrawl/firecrawl
   cd firecrawl
   # 在 .env 中设置：USE_DB_AUTHENTICATION=false、HOST=0.0.0.0、PORT=3002
   docker compose up -d
   ```

2. 将 Hermes 指向你的实例（无需 API 密钥）：
   ```bash
   hermes config set FIRECRAWL_API_URL http://localhost:3002
   ```

你也可以同时设置 `FIRECRAWL_API_KEY` 和 `FIRECRAWL_API_URL`，如果你的自托管实例启用了身份验证。

## OpenRouter 提供商路由

使用 OpenRouter 时，你可以控制请求跨提供商的路由方式。将 `provider_routing` 部分添加到 `~/.hermes/config.yaml`：

```yaml
provider_routing:
  sort: "throughput"          # "price"（默认）、"throughput" 或 "latency"
  # only: ["anthropic"]      # 仅使用这些提供商
  # ignore: ["deepinfra"]    # 跳过这些提供商
  # order: ["anthropic", "google"]  # 按此顺序尝试提供商
  # require_parameters: true  # 仅使用支持所有请求参数的提供商
  # data_collection: "deny"   # 排除可能存储/训练数据的提供商
```

**快捷方式：** 在任何模型名称后附加 `:nitro` 以进行吞吐量排序（例如 `anthropic/claude-sonnet-4:nitro`），或 `:floor` 以进行价格排序。

## 备用模型

配置备用 provider:model：Hermes 在主模型失败时自动切换到备用模型（速率限制、服务器错误、auth 失败）：

```yaml
fallback_model:
  provider: openrouter                    # 必需
  model: anthropic/claude-sonnet-4        # 必需
  # base_url: http://localhost:8000/v1    # 可选，用于自定义端点
  # api_key_env: MY_CUSTOM_KEY           # 可选，自定义端点 API 密钥的环境变量名
```

激活时，备用在会话中间交换模型和提供商而不丢失对话。它每个会话最多触发**一次**。

支持的提供商：`openrouter`、`nous`、`openai-codex`、`copilot`、`copilot-acp`、`anthropic`、`huggingface`、`zai`、`kimi-coding`、`minimax`、`minimax-cn`、`deepseek`、`ai-gateway`、`opencode-zen`、`opencode-go`、`kilocode`、`alibaba`、`custom`。

:::tip
备用仅通过 `config.yaml` 配置——没有环境变量。关于何时触发、支持哪些提供商以及它如何与辅助任务和委托交互的完整详情，请参见[备用提供商](/docs/user-guide/features/fallback-providers)。
:::

## 智能模型路由

可选的便宜 vs 强路由让 Hermes 为主模型保留复杂工作，同时将非常短/简单的 turn 发送到更便宜的模型。

```yaml
smart_model_routing:
  enabled: true
  max_simple_chars: 160
  max_simple_words: 28
  cheap_model:
    provider: openrouter
    model: google/gemini-2.5-flash
    # base_url: http://localhost:8000/v1  # 可选自定义端点
    # api_key_env: MY_CUSTOM_KEY          # 可选该端点 API 密钥的环境变量名
```

工作原理：
- 如果一个 turn 很短、单一，并且看起来不像代码/工具/调试 heavy，Hermes 可能将其路由到 `cheap_model`
- 如果 turn 看起来复杂，Hermes 留在主模型/提供商上
- 如果便宜路由无法干净地解析，Hermes 自动回退到主模型

这是有意保守的。它适用于快速、低风险的 turn，如：
- 简短的事实问题
- 快速重写
- 轻量级摘要

它会避免路由看起来像这样的提示：
- 编码/调试工作
- 工具 heavy 请求
- 长或多行分析请求

当你想要更低的延迟或成本而不完全更改默认模型时使用此功能。

---

## 另见

- [配置](/docs/user-guide/configuration) — 一般配置（目录结构、配置优先级、终端后端、记忆、压缩等）
- [环境变量](/docs/reference/environment-variables) — 所有环境变量的完整参考
