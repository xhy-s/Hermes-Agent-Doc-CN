---
sidebar_position: 4
title: "提供者运行时解析"
description: "Hermes 如何在运行时解析提供者、凭证、API 模式和辅助模型"
---

# 提供者运行时解析

Hermes 有一个跨 CLI、gateway、cron 任务、ACP 和辅助调用共享的提供者运行时解析器。

主要实现：

- `hermes_cli/runtime_provider.py` — 凭证解析、`_resolve_custom_runtime()`
- `hermes_cli/auth.py` — 提供者注册表、`resolve_provider()`
- `hermes_cli/model_switch.py` — 共享的 `/model` 切换流水线（CLI + gateway）
- `agent/auxiliary_client.py` — 辅助模型路由

如果你想添加新的第一类推理 provider，请同时阅读 [添加提供者](./adding-providers.md)。

## 解析优先级

在高层，提供者解析使用：

1. 显式 CLI/运行时请求
2. `config.yaml` model/provider 配置
3. 环境变量
4. 提供者特定默认值或自动解析

这个顺序很重要，因为 Hermes 将保存的 model/provider 选择作为正常运行的真实来源。这防止了过时的 shell 导出在用户上次在 `hermes model` 中选择的端点上静默覆盖。

## 提供者

当前提供者系列包括：

- AI Gateway（Vercel）
- OpenRouter
- Nous Portal
- OpenAI Codex
- Copilot / Copilot ACP
- Anthropic（原生）
- Google / Gemini
- Alibaba / DashScope
- DeepSeek
- Z.AI
- Kimi / Moonshot
- MiniMax
- MiniMax China
- Kilo Code
- Hugging Face
- OpenCode Zen / OpenCode Go
- Custom（`provider: custom`）— 任何 OpenAI 兼容端点的第一类提供者
- 命名自定义提供者（`config.yaml` 中的 `custom_providers` 列表）

## 运行时解析的输出

运行时解析器返回例如：

- `provider`
- `api_mode`
- `base_url`
- `api_key`
- `source`
- 提供者特定的元数据如 expiry/refresh 信息

## 为什么这很重要

这个解析器是 Hermes 可以在以下之间共享 auth/运行时逻辑的主要原因：

- `hermes chat`
- gateway 消息处理
- 在新鲜会话中运行的 cron 任务
- ACP 编辑器会话
- 辅助模型任务

## AI Gateway

在 `~/.hermes/.env` 中设置 `AI_GATEWAY_API_KEY` 并使用 `--provider ai-gateway` 运行。Hermes 从 gateway 的 `/models` 端点获取可用模型，过滤到支持工具使用的语言模型。

## OpenRouter、AI Gateway 和自定义 OpenAI 兼容 base URL

Hermes 包含逻辑来避免在存在多个 provider 密钥时将错误的 API 密钥泄露给自定义端点（例如 `OPENROUTER_API_KEY`、`AI_GATEWAY_API_KEY` 和 `OPENAI_API_KEY`）。

每个 provider 的 API 密钥作用域限定到其自己的 base URL：

- `OPENROUTER_API_KEY` 仅发送到 `openrouter.ai` 端点
- `AI_GATEWAY_API_KEY` 仅发送到 `ai-gateway.vercel.sh` 端点
- `OPENAI_API_KEY` 用于自定义端点并作为回退

Hermes 还区分：
- 用户选择的真实自定义端点
- 当未配置自定义端点时使用的 OpenRouter 回退路径

这种区别对于以下情况特别重要：
- 本地模型服务器
- 非 OpenRouter/非 AI Gateway 的 OpenAI 兼容 API
- 切换 provider 而不重新运行设置
- 应该继续工作的 config 保存的自定义端点，即使在当前 shell 中未导出 `OPENAI_BASE_URL`

## 原生 Anthropic 路径

Anthropic 不再只是"通过 OpenRouter"。

当提供者解析选择 `anthropic` 时，Hermes 使用：

- `api_mode = anthropic_messages`
- 原生 Anthropic Messages API
- `agent/anthropic_adapter.py` 用于翻译

原生 Anthropic 的凭证解析现在在存在可刷新的 Claude Code 凭证和环境令牌时优先选择前者。实际上意味着：

- 当 Claude Code 凭证文件包含可刷新的 auth 时，被视为首选来源
- 手动 `ANTHROPIC_TOKEN` / `CLAUD_CODE_OAUTH_TOKEN` 值仍作为显式覆盖工作
- Hermes 在原生 Messages API 调用之前预检 Anthropic 凭证刷新
- Hermes 在重建 Anthropic 客户端后仍会在 401 上重试一次，作为回退路径

## OpenAI Codex 路径

Codex 使用单独的 Responses API 路径：

- `api_mode = codex_responses`
- 专用凭证解析和 auth 存储支持

## 辅助模型路由

辅助任务如：

- vision
- Web 提取摘要
- 上下文压缩摘要
- 会话搜索摘要
- Skills hub 操作
- MCP 辅助操作
- 记忆刷新

可以使用自己的 provider/model 路由，而不是主对话模型。

当辅助任务配置了 provider `main` 时，Hermes 通过与正常聊天相同的共享运行时路径解析。实际上意味着：

- 环境驱动的自定义端点仍然有效
- 通过 `hermes model` / `config.yaml` 保存的自定义端点也有效
- 辅助路由可以区分真实保存的自定义端点和 OpenRouter 回退

## 回退模型

Hermes 支持配置的回退 model/provider 对，允许在主模型遇到错误时进行运行时故障转移。

### 内部工作原理

1. **存储**：`AIAgent.__init__` 存储 `fallback_model` 字典并设置 `_fallback_activated = False`。

2. **触发点**：`_try_activate_fallback()` 在 `run_agent.py` 主重试循环中的三个地方调用：
   - 在无效 API 响应（None choices、missing content）上的最大重试后
   - 在不可重试的客户端错误（HTTP 401、403、404）时
   - 在瞬态错误（HTTP 429、500、502、503）上的最大重试后

3. **激活流程**（`_try_activate_fallback`）：
   - 如果已激活或未配置则立即返回 `False`
   - 从 `auxiliary_client.py` 调用 `resolve_provider_client()` 构建具有正确 auth 的新客户端
   - 确定 `api_mode`：openai-codex 用 `codex_responses`、anthropic 用 `anthropic_messages`、其他用 `chat_completions`
   - 交换：`self.model`、`self.provider`、`self.base_url`、`self.api_mode`、`self.client`、`self._client_kwargs`
   - 对于 anthropic 回退：构建原生 Anthropic 客户端而不是 OpenAI 兼容的
   - 重新评估 prompt 缓存（为 OpenRouter 上的 Claude 模型启用）
   - 设置 `_fallback_activated = True` — 防止再次触发
   - 重置重试计数为 0 并继续循环

4. **配置流程**：
   - CLI：`cli.py` 读取 `CLI_CONFIG["fallback_model"]` → 传递给 `AIAgent(fallback_model=...)`
   - Gateway：`gateway/run.py._load_fallback_model()` 读取 `config.yaml` → 传递给 `AIAgent`
   - 验证：`provider` 和 `model` 键都必须非空，否则回退被禁用

### 什么不支持回退

- **子 agent 委托**（`tools/delegate_tool.py`）：子 agent 继承父级的 provider 但不继承回退配置
- **Cron 任务**（`cron/`）：使用固定 provider 运行，无回退机制
- **辅助任务**：使用自己的独立 provider 自动检测链（见上文的辅助模型路由）

### 测试覆盖

参见 `tests/test_fallback_model.py` 获取全面测试，覆盖所有支持的提供者、一次性语义和边缘情况。

## 相关文档

- [Agent 循环内部原理](./agent-loop.md)
- [ACP 内部原理](./acp-internals.md)
- [上下文压缩与缓存](./context-compression-and-caching.md)
