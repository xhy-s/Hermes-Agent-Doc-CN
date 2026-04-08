---
title: "功能概述"
sidebar_position: 1
---

# 功能概述

Hermes Agent 包含丰富的功能，远超基本的聊天能力。从持久化记忆和文件感知上下文到浏览器自动化和语音对话，这些功能共同使 Hermes成为一个强大的自主助手。

## 核心功能

- **[工具和工具集](tools.md)** — 工具是扩展代理能力的函数。它们被组织成逻辑工具集，可以按平台启用或禁用，覆盖 Web 搜索、终端执行、文件编辑、记忆、委托等功能。
- **[技能系统](skills.md)** — 按需知识文档，代理可以在需要时加载。技能遵循渐进式披露模式以减少 Token 使用量，并兼容 [agentskills.io](https://agentskills.io/specification) 开放标准。
- **[持久化记忆](memory.md)** — 有边界的精选记忆，跨会话持久化。Hermes 通过 `MEMORY.md` 和 `USER.md` 记住您的偏好、项目、环境以及它学到的东西。
- **[上下文文件](context-files.md)** — Hermes 自动发现并加载项目上下文文件（`.hermes.md`、`AGENTS.md`、`CLAUDE.md`、`SOUL.md`、`.cursorrules`），这些文件塑造了它在您的项目中的行为方式。
- **[上下文引用](context-references.md)** — 输入 `@` 然后跟上引用，直接将文件、文件夹、git 差异和 URL 注入到您的消息中。Hermes 内联展开引用并自动追加内容。
- **[检查点](../checkpoints-and-rollback.md)** — Hermes 在进行文件更改前自动快照您的工作目录，为您提供安全网，如果出现问题可以用 `/rollback` 回滚。

## 自动化

- **[定时任务（Cron）](cron.md)** — 使用自然语言或 cron 表达式安排任务自动运行。作业可以附加技能，交付结果到任何平台，并支持暂停/恢复/编辑操作。
- **[子代理委托](delegation.md)** — `delegate_task` 工具生成具有隔离上下文、受限工具集和独立终端会话的子代理实例。最多运行 3 个并发子代理进行并行工作流。
- **[代码执行](code-execution.md)** — `execute_code` 工具让代理编写调用 Hermes 工具的 Python 脚本，通过沙箱 RPC 执行将多步骤工作流压缩为单个 LLM 回合。
- **[事件钩子](hooks.md)** — 在关键生命周期点运行自定义代码。网关钩子处理日志、告警和 Webhook；插件钩子处理工具拦截、指标和安全护栏。
- **[批处理](batch-processing.md)** — 跨数百或数千个提示并行运行 Hermes 代理，生成结构化的 ShareGPT 格式轨迹数据，用于训练数据生成或评估。

## 媒体与 Web

- **[语音模式](voice-mode.md)** — 跨 CLI 和消息平台的全语音交互。与代理对话使用麦克风，听到语音回复，并在 Discord 语音频道中进行实时语音对话。
- **[浏览器自动化](browser.md)** — 多后端支持的全浏览器自动化：Browserbase 云、Browser Use 云、通过 CDP 的本地 Chrome 或本地 Chromium。浏览网站、填写表单并提取信息。
- **[视觉与图片粘贴](vision.md)** — 多模态视觉支持。将图片从剪贴板粘贴到 CLI 中，使用任何支持视觉的模型让代理分析、描述或处理它们。
- **[图像生成](image-generation.md)** — 使用 FAL.ai 的 FLUX 2 Pro 模型从文本提示生成图像，并通过 Clarity Upscaler 进行自动 2 倍放大。
- **[语音与 TTS](tts.md)** — 跨所有消息平台的文本转语音输出和语音消息转录，提供五个提供商选项：Edge TTS（免费）、ElevenLabs、OpenAI TTS、MiniMax 和 NeuTTS。

## 集成

- **[MCP 集成](mcp.md)** — 通过 stdio 或 HTTP 传输连接到任何 MCP 服务器。访问外部工具如 GitHub、数据库、文件系统内部 API，无需编写原生 Hermes 工具。包括每服务器工具过滤和采样支持。
- **[提供者路由](provider-routing.md)** — 精细控制哪些 AI 提供商处理您的请求。通过排序、白名单、黑名单和优先级排序优化成本、速度或质量。
- **[备用提供者](fallback-providers.md)** — 当您的主模型遇到错误时，自动故障切换到备用 LLM 提供商，包括辅助任务（如视觉和压缩）的独立备用。
- **[凭证池](credential-pools.md)** — 在同一提供商的多个 API 密钥之间分配 API 调用。在速率限制或失败时自动轮换。
- **[记忆提供者](memory-providers.md)** — 插入外部记忆后端（Honcho、OpenViking、Mem0、Hindsight、Holographic、RetainDB、ByteRover、Supermemory），用于跨会话用户建模和个性化，超越内置记忆系统。
- **[API 服务器](api-server.md)** — 将 Hermes 暴露为 OpenAI 兼容的 HTTP 端点。连接任何使用 OpenAI 格式的前端 — Open WebUI、LobeChat、LibreChat 等。
- **[IDE 集成（ACP）](acp.md)** — 在 VS Code、Zed 和 JetBrains 等 ACP 兼容编辑器中使用 Hermes。聊天、工具活动、文件差异和终端命令在您的编辑器中渲染。
- **[RL 训练](rl-training.md)** — 从代理会话生成轨迹数据，用于强化学习和模型微调。

## 自定义

- **[个性化和 SOUL.md](personality.md)** — 完全可定制的代理个性。`SOUL.md` 是主要身份文件 — 系统提示中的第一项 — 您可以为每个会话交换内置或自定义的 `/personality` 预设。
- **[主题皮肤](skins.md)** — 自定义 CLI 的视觉呈现：横幅颜色、微调器表情和动词、响应框标签、品牌文本和工具活动前缀。
- **[插件](plugins.md)** — 无需修改核心代码即可添加自定义工具、钩子和集成。将目录放入 `~/.hermes/plugins/` 配合 `plugin.yaml` 和 Python 代码。
