---
slug: /
sidebar_position: 0
title: "Hermes Agent 文档"
description: "由 Nous Research 构建的自我改进 AI 代理。一个内置的学习循环，能够从经验中创建技能、在使用中改进技能，并跨会话记忆信息。"
hide_table_of_contents: true
---

# Hermes Agent

由 [Nous Research](https://nousresearch.com) 构建的自我改进 AI 代理。唯一具有内置学习循环的代理——它能从经验中创建技能、在使用中不断完善技能、推动自身保存知识，并在跨会话中建立对用户日益深化的认知模型。

<div style={{display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap'}}>
  <a href="/docs/getting-started/installation" style={{display: 'inline-block', padding: '0.6rem 1.2rem', backgroundColor: '#FFD700', color: '#07070d', borderRadius: '8px', fontWeight: 600, textDecoration: 'none'}}>开始使用 →</a>
  <a href="https://github.com/NousResearch/hermes-agent" style={{display: 'inline-block', padding: '0.6rem 1.2rem', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '8px', textDecoration: 'none'}}>在 GitHub 上查看</a>
</div>

## Hermes Agent 是什么？

它不是一个绑在 IDE 上的代码副驾驶，也不是围绕单一 API 的聊天机器人包装器。它是一个**自主代理**，运行时间越长能力越强。它可以部署在任何地方——5 美元的 VPS、GPU 集群，或者几乎空载时几乎不花钱的无服务器基础设施（Daytona、Modal）。当你通过 Telegram 与它聊天时，它正在你从不亲自 SSH 连接的云 VM 上工作。它不依赖你的笔记本电脑。

## 快速链接

| | |
|---|---|
| 🚀 **[安装](/docs/getting-started/installation)** | 在 Linux、macOS 或 WSL2 上 60 秒安装 |
| 📖 **[快速入门教程](/docs/getting-started/quickstart)** | 你的第一次对话以及尝试的关键功能 |
| 🗺️ **[学习路径](/docs/getting-started/learning-path)** | 根据你的经验水平找到合适的文档 |
| ⚙️ **[配置](/docs/user-guide/configuration)** | 配置文件、提供商、模型和选项 |
| 💬 **[消息网关](/docs/user-guide/messaging)** | 设置 Telegram、Discord、Slack 或 WhatsApp |
| 🔧 **[工具和工具集](/docs/user-guide/features/tools)** | 47 个内置工具及配置方法 |
| 🧠 **[记忆系统](/docs/user-guide/features/memory)** | 跨会话持久化的记忆 |
| 📚 **[技能系统](/docs/user-guide/features/skills)** | 代理创建和重用的程序性记忆 |
| 🔌 **[MCP 集成](/docs/user-guide/features/mcp)** | 连接到 MCP 服务器、过滤工具并安全扩展 Hermes |
| 🧭 **[在 Hermes 中使用 MCP](/docs/guides/use-mcp-with-hermes)** | 实用的 MCP 设置模式、示例和教程 |
| 🎙️ **[语音模式](/docs/user-guide/features/voice-mode)** | 在 CLI、Telegram、Discord 和 Discord 语音频道中的实时语音交互 |
| 🗣️ **[在 Hermes 中使用语音模式](/docs/guides/use-voice-mode-with-hermes)** | Hermes 语音工作流的手把手设置和使用模式 |
| 🎭 **[人格与 SOUL.md](/docs/user-guide/features/personality)** | 用全局 SOUL.md 定义 Hermes 的默认语音 |
| 📄 **[上下文文件](/docs/user-guide/features/context-files)** | 塑造每次对话的项目上下文文件 |
| 🔒 **[安全](/docs/user-guide/security)** | 命令审批、授权、容器隔离 |
| 💡 **[技巧与最佳实践](/docs/guides/tips)** | 最大限度利用 Hermes 的实用技巧 |
| 🏗️ **[架构](/docs/developer-guide/architecture)** | 底层工作原理 |
| ❓ **[常见问题与故障排除](/docs/reference/faq)** | 常见问题及解决方案 |

## 核心特性

- **闭环学习系统** — 代理驱动的记忆，包含定期提醒、自动创建技能、使用中自我改进技能、FTS5 跨会话检索与 LLM 摘要，以及 [Honcho](https://github.com/plastic-labs/honcho) 方言用户建模
- **随地运行，不只是你的笔记本** — 6 种终端后端：local、Docker、SSH、Daytona、Singularity、Modal。Daytona 和 Modal 提供无服务器持久化——你的环境在空闲时休眠，几乎不产生费用
- **在你所在的地方生活** — CLI、Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost、Email、SMS、DingTalk、飞书、企业微信、Home Assistant——来自一个网关的 14+ 平台
- **由模型训练师构建** — 由 Nous Research（Hermes、Nomos 和 Psyche 模型的背后实验室）创建。支持 [Nous Portal](https://portal.nousresearch.com)、[OpenRouter](https://openrouter.ai)、OpenAI 或任何端点
- **计划自动化** — 内置 cron，支持投递到任何平台
- **委托与并行化** — 为并行工作流生成隔离的子代理。通过 `execute_code` 的编程式工具调用将多步骤管道折叠为单次推理调用
- **开放标准技能** — 与 [agentskills.io](https://agentskills.io) 兼容。技能可移植、可共享，通过技能中心由社区贡献
- **完整网络控制** — 搜索、提取、浏览、视觉、图像生成、TTS
- **MCP 支持** — 连接到任何 MCP 服务器以扩展工具能力
- **研究就绪** — 批处理、轨迹导出、使用 Atropos 进行 RL 训练。由 [Nous Research](https://nousresearch.com)（Hermes、Nomos 和 Psyme 模型的背后实验室）构建
