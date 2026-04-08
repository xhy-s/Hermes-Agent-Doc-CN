---
title: "备用 Provider"
description: "在您的主要模型不可用时配置自动故障转移到备用 LLM provider"
sidebar_label: "备用 Provider"
sidebar_position: 8
---

# 备用 Provider

Hermes Agent 有三层弹性，在 provider 出现问题时保持会话运行：

1. **[凭证池](./credential-pools.md)** — 在*同一* provider 的多个 API 密钥之间轮换（最先尝试）
2. **主要模型备用** — 当您的 main model 失败时自动切换到*不同的* provider:model
3. **辅助任务备用** — 用于视觉、压缩和 Web 提取等辅助任务的独立 provider 解析

凭证池处理同 provider 轮换（例如多个 OpenRouter 密钥）。本页面涵盖跨 provider 故障转移。两者都是可选的，独立工作。

## 主要模型备用

当您的主要 LLM provider 遇到错误时 — 速率限制、服务器过载、认证失败、连接断开 — Hermes 可以在会话中途自动切换到备用 provider:model 对，而不丢失对话。

### 配置

在 `~/.hermes/config.yaml` 中添加 `fallback_model` 部分：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

`provider` 和 `model` 都是**必需的**。如果任一缺失，备用被禁用。

### 支持的 Provider

| Provider | 值 | 要求 |
|----------|-------|-------------|
| AI Gateway | `ai-gateway` | `AI_GATEWAY_API_KEY` |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` |
| Nous Portal | `nous` | `hermes auth` (OAuth) |
| OpenAI Codex | `openai-codex` | `hermes model` (ChatGPT OAuth) |
| GitHub Copilot | `copilot` | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 或 `GITHUB_TOKEN` |
| GitHub Copilot ACP | `copilot-acp` | 外部进程（编辑器集成） |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` 或 Claude Code 凭证 |
| z.ai / GLM | `zai` | `GLM_API_KEY` |
| Kimi / Moonshot | `kimi-coding` | `KIMI_API_KEY` |
| MiniMax | `minimax` | `MINIMAX_API_KEY` |
| MiniMax（中国） | `minimax-cn` | `MINIMAX_CN_API_KEY` |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` |
| OpenCode Zen | `opencode-zen` | `OPENCODE_ZEN_API_KEY` |
| OpenCode Go | `opencode-go` | `OPENCODE_GO_API_KEY` |
| Kilo Code | `kilocode` | `KILOCODE_API_KEY` |
| Alibaba / DashScope | `alibaba` | `DASHSCOPE_API_KEY` |
| Hugging Face | `huggingface` | `HF_TOKEN` |
| 自定义端点 | `custom` | `base_url` + `api_key_env`（见下文） |

### 自定义端点备用

对于自定义 OpenAI 兼容端点，添加 `base_url` 和可选的 `api_key_env`：

```yaml
fallback_model:
  provider: custom
  model: my-local-model
  base_url: http://localhost:8000/v1
  api_key_env: MY_LOCAL_KEY          # 包含 API 密钥的环境变量名
```

### 备用何时触发

当主要模型失败并出现以下情况时自动激活备用：

- **速率限制**（HTTP 429）— 重试尝试耗尽后
- **服务器错误**（HTTP 500、502、503）— 重试尝试耗尽后
- **认证失败**（HTTP 401、403）— 立即（重试无意义）
- **未找到**（HTTP 404）— 立即
- **无效响应** — 当 API 重复返回格式错误或空响应时

触发时，Hermes：

1. 为备用 provider 解析凭证
2. 构建新的 API 客户端
3. 就地交换模型、provider 和客户端
4. 重置重试计数器并继续对话

切换是无缝的 — 您的对话历史、工具调用和上下文都被保留。代理从它离开的地方继续，只是使用不同的模型。

:::info 一次性
备用每个会话最多激活**一次**。如果备用 provider 也失败，正常错误处理接管（重试，然后错误消息）。这防止了级联故障转移循环。
:::

### 示例

**OpenRouter 作为 Anthropic 原生的备用：**
```yaml
model:
  provider: anthropic
  default: claude-sonnet-4-6

fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

**Nous Portal 作为 OpenRouter 的备用：**
```yaml
model:
  provider: openrouter
  default: anthropic/claude-opus-4

fallback_model:
  provider: nous
  model: nous-hermes-3
```

**本地模型作为云模型的备用：**
```yaml
fallback_model:
  provider: custom
  model: llama-3.1-70b
  base_url: http://localhost:8000/v1
  api_key_env: LOCAL_API_KEY
```

**Codex OAuth 作为备用：**
```yaml
fallback_model:
  provider: openai-codex
  model: gpt-5.3-codex
```

### 备用在哪里工作

| 上下文 | 备用支持 |
|---------|-------------------|
| CLI 会话 | ✔ |
| 消息网关（Telegram、Discord 等） | ✔ |
| 子代理委托 | ✘（子代理不继承备用配置） |
| Cron 任务 | ✘（使用固定 provider 运行） |
| 辅助任务（视觉、压缩） | ✘（使用它们自己的 provider 链 — 见下文） |

:::tip
`fallback_model` 没有环境变量 — 它仅通过 `config.yaml` 配置。这是故意的：备用配置是一个深思熟虑的选择，而不是应该被陈旧的 shell 导出覆盖的东西。
:::

---

## 辅助任务备用

Hermes 使用独立的轻量级模型处理辅助任务。每个任务有自己的 provider 解析链，充当内置备用系统。

### 具有独立 Provider 解析的任务

| 任务 | 功能 | 配置键 |
|------|-------------|-----------|
| Vision | 图像分析、浏览器截图 | `auxiliary.vision` |
| Web Extract | 网页摘要 | `auxiliary.web_extract` |
| Compression | 上下文压缩摘要 | `auxiliary.compression` 或 `compression.summary_provider` |
| Session Search | 过去会话摘要 | `auxiliary.session_search` |
| Skills Hub | 技能搜索和发现 | `auxiliary.skills_hub` |
| MCP | MCP 辅助操作 | `auxiliary.mcp` |
| Memory Flush | 记忆整合 | `auxiliary.flush_memories` |

### 自动检测链

当任务的 provider 设置为 `"auto"`（默认）时，Hermes 按顺序尝试 provider 直到一个成功：

**对于文本任务（压缩、web 提取等）：**

```text
OpenRouter → Nous Portal → 自定义端点 → Codex OAuth →
API 密钥 provider（z.ai、Kimi、MiniMax、Hugging Face、Anthropic）→ 放弃
```

**对于视觉任务：**

```text
主 provider（如果支持视觉）→ OpenRouter → Nous Portal →
Codex OAuth → Anthropic → 自定义端点 → 放弃
```

如果解析的 provider 在调用时失败，Hermes 也有内部重试：如果 provider 不是 OpenRouter 且未设置明确的 `base_url`，它尝试 OpenRouter 作为最后手段备用。

### 配置辅助 Provider

每个任务可以在 `config.yaml` 中独立配置：

```yaml
auxiliary:
  vision:
    provider: "auto"              # auto | openrouter | nous | codex | main | anthropic
    model: ""                     # 例如 "openai/gpt-4o"
    base_url: ""                  # 直接端点（优先于 provider）
    api_key: ""                   # base_url 的 API 密钥

  web_extract:
    provider: "auto"
    model: ""

  compression:
    provider: "auto"
    model: ""

  session_search:
    provider: "auto"
    model: ""

  skills_hub:
    provider: "auto"
    model: ""

  mcp:
    provider: "auto"
    model: ""

  flush_memories:
    provider: "auto"
    model: ""
```

上面的每个任务遵循相同的 **provider / model / base_url** 模式。上下文压缩使用自己的顶层块：

```yaml
compression:
  summary_provider: main                             # 与辅助任务相同的 provider 选项
  summary_model: google/gemini-3-flash-preview
  summary_base_url: null                             # 自定义 OpenAI 兼容端点
```

备用 model 使用：

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
  # base_url: http://localhost:8000/v1               # 可选自定义端点
```

所有三个 — auxiliary、compression、fallback — 工作方式相同：设置 `provider` 选择谁处理请求，`model` 选择哪个模型，`base_url` 指向自定义端点（覆盖 provider）。

### 辅助任务的 Provider 选项

| Provider | 描述 | 要求 |
|----------|-------------|-------------|
| `"auto"` | 按顺序尝试 provider 直到一个成功（默认） | 至少配置了一个 provider |
| `"openrouter"` | 强制 OpenRouter | `OPENROUTER_API_KEY` |
| `"nous"` | 强制 Nous Portal | `hermes auth` |
| `"codex"` | 强制 Codex OAuth | `hermes model` → Codex |
| `"main"` | 使用主代理使用的任何 provider | 已配置活动主 provider |
| `"anthropic"` | 强制 Anthropic 原生 | `ANTHROPIC_API_KEY` 或 Claude Code 凭证 |

### 直接端点覆盖

对于任何辅助任务，设置 `base_url` 完全绕过 provider 解析，直接向该端点发送请求：

```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 优先于 `provider`。Hermes 使用配置的 `api_key` 进行认证，如果未设置则回退到 `OPENAI_API_KEY`。它**不会**为自定义端点重用 `OPENROUTER_API_KEY`。

---

## 上下文压缩备用

上下文压缩除了辅助系统外还有遗留配置路径：

```yaml
compression:
  summary_provider: "auto"                    # auto | openrouter | nous | main
  summary_model: "google/gemini-3-flash-preview"
```

这等同于配置 `auxiliary.compression.provider` 和 `auxiliary.compression.model`。如果两者都设置，`auxiliary.compression` 值优先。

如果没有可用于压缩的 provider，Hermes 在不生成摘要的情况下删除中间对话轮次，而不是使会话失败。

---

## 委托 Provider 覆盖

由 `delegate_task` 生成子代理**不**使用主要备用 model。但是，它们可以被路由到不同的 provider:model 对以优化成本：

```yaml
delegation:
  provider: "openrouter"                      # 为所有子代理覆盖 provider
  model: "google/gemini-3-flash-preview"      # 覆盖模型
  # base_url: "http://localhost:1234/v1"      # 或使用直接端点
  # api_key: "local-key"
```

参见[子代理委托](/docs/user-guide/features/delegation)获取完整配置详情。

---

## Cron 任务 Provider

Cron 任务使用执行时配置的任何 provider 运行。它们不支持备用 model。要为 cron 任务使用不同的 provider，请在 cron 任务本身上配置 `provider` 和 `model` 覆盖：

```python
cronjob(
    action="create",
    schedule="every 2h",
    prompt="Check server status",
    provider="openrouter",
    model="google/gemini-3-flash-preview"
)
```

参见[计划任务（Cron）](/docs/user-guide/features/cron)获取完整配置详情。

---

## 总结

| 功能 | 备用机制 | 配置位置 |
|---------|-------------------|----------------|
| 主代理模型 | config.yaml 中的 `fallback_model` — 错误时一次性故障转移 | `fallback_model:`（顶层） |
| Vision | 自动检测链 + 内部 OpenRouter 重试 | `auxiliary.vision` |
| Web 提取 | 自动检测链 + 内部 OpenRouter 重试 | `auxiliary.web_extract` |
| 上下文压缩 | 自动检测链，如果不可用则降级到无摘要 | `auxiliary.compression` 或 `compression.summary_provider` |
| 会话搜索 | 自动检测链 | `auxiliary.session_search` |
| Skills Hub | 自动检测链 | `auxiliary.skills_hub` |
| MCP 辅助 | 自动检测链 | `auxiliary.mcp` |
| 记忆刷新 | 自动检测链 | `auxiliary.flush_memories` |
| 委托 | 仅 Provider 覆盖（无自动备用） | `delegation.provider` / `delegation.model` |
| Cron 任务 | 仅每个任务的 Provider 覆盖（无自动备用） | 每个任务的 `provider` / `model` |
