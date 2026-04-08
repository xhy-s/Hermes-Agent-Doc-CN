---
sidebar_position: 3
title: "学习路径"
description: "根据你的经验水平和目标选择 Hermes Agent 文档的学习路径。"
---

# 学习路径

Hermes Agent 可以做很多事情——CLI 助手、Telegram/Discord 机器人、任务自动化、RL 训练等等。本页面帮助你了解从哪里开始，以及根据你的经验水平和目标应该阅读哪些内容。

:::tip 从这里开始
如果你还没有安装 Hermes Agent，请从 [安装指南](/docs/getting-started/installation) 开始，然后完成 [快速入门](/docs/getting-started/quickstart)。以下所有内容都假设你有一个可用的安装。
:::

## 如何使用本页面

- **知道你的水平？** 跳转到 [按经验水平](#by-experience-level) 表格并按顺序阅读你所在层级的推荐内容。
- **有特定目标？** 跳转到 [按用例](#by-use-case) 找到匹配的场景。
- **只是随便看看？** 查看 [关键功能一览](#key-features-at-a-glance) 表格，快速了解 Hermes Agent 可以做的所有事情。

## 按经验水平

| 级别 | 目标 | 推荐阅读 | 时间估计 |
|---|---|---|---|
| **初学者** | 启动并运行，进行基本对话，使用内置工具 | [安装](/docs/getting-started/installation) → [快速入门](/docs/getting-started/quickstart) → [CLI 使用](/docs/user-guide/cli) → [配置](/docs/user-guide/configuration) | 约 1 小时 |
| **中级** | 设置消息机器人，使用记忆、cron 任务和技能等高级功能 | [会话](/docs/user-guide/sessions) → [消息](/docs/user-guide/messaging) → [工具](/docs/user-guide/features/tools) → [技能](/docs/user-guide/features/skills) → [记忆](/docs/user-guide/features/memory) → [Cron](/docs/user-guide/features/cron) | 约 2-3 小时 |
| **高级** | 构建自定义工具、创建技能、使用 RL 训练模型、为项目做贡献 | [架构](/docs/developer-guide/architecture) → [添加工具](/docs/developer-guide/adding-tools) → [创建技能](/docs/developer-guide/creating-skills) → [RL 训练](/docs/user-guide/features/rl-training) → [贡献](/docs/developer-guide/contributing) | 约 4-6 小时 |

## 按用例

选择匹配你需求的场景。每个场景都会链接到你应该按顺序阅读的相关文档。

### "我想要一个 CLI 编程助手"

将 Hermes Agent 用作交互式终端助手来编写、审查和运行代码。

1. [安装](/docs/getting-started/installation)
2. [快速入门](/docs/getting-started/quickstart)
3. [CLI 使用](/docs/user-guide/cli)
4. [代码执行](/docs/user-guide/features/code-execution)
5. [上下文文件](/docs/user-guide/features/context-files)
6. [技巧与窍门](/docs/guides/tips)

:::tip
使用上下文文件直接将文件传入对话。Hermes Agent 可以读取、编辑和运行你项目中的代码。
:::

### "我想要一个 Telegram/Discord 机器人"

将 Hermes Agent 部署为你喜欢的消息平台上的机器人。

1. [安装](/docs/getting-started/installation)
2. [配置](/docs/user-guide/configuration)
3. [消息概述](/docs/user-guide/messaging)
4. [Telegram 设置](/docs/user-guide/messaging/telegram)
5. [Discord 设置](/docs/user-guide/messaging/discord)
6. [语音模式](/docs/user-guide/features/voice-mode)
7. [在 Hermes 中使用语音模式](/docs/guides/use-voice-mode-with-hermes)
8. [安全](/docs/user-guide/security)

完整的项目示例见：
- [每日简报机器人](/docs/guides/daily-briefing-bot)
- [团队 Telegram 助手](/docs/guides/team-telegram-assistant)

### "我想要自动化任务"

安排周期性任务、运行批量作业或将代理操作链接在一起。

1. [快速入门](/docs/getting-started/quickstart)
2. [Cron 调度](/docs/user-guide/features/cron)
3. [批处理](/docs/user-guide/features/batch-processing)
4. [委托](/docs/user-guide/features/delegation)
5. [钩子](/docs/user-guide/features/hooks)

:::tip
Cron 任务让 Hermes Agent 按计划运行任务——每日摘要、周期性检查、自动报告——无需你在场。
:::

### "我想要构建自定义工具/技能"

用你自己的工具和可重用的技能包扩展 Hermes Agent。

1. [工具概述](/docs/user-guide/features/tools)
2. [技能概述](/docs/user-guide/features/skills)
3. [MCP（模型上下文协议）](/docs/user-guide/features/mcp)
4. [架构](/docs/developer-guide/architecture)
5. [添加工具](/docs/developer-guide/adding-tools)
6. [创建技能](/docs/developer-guide/creating-skills)

:::tip
工具是代理可以调用的单个函数。技能是打包在一起的工具、提示和配置的集合。先从工具开始，再进阶到技能。
:::

### "我想要训练模型"

使用强化学习通过 Hermes Agent 内置的 RL 训练管道微调模型行为。

1. [快速入门](/docs/getting-started/quickstart)
2. [配置](/docs/user-guide/configuration)
3. [RL 训练](/docs/user-guide/features/rl-training)
4. [提供商路由](/docs/user-guide/features/provider-routing)
5. [架构](/docs/developer-guide/architecture)

:::tip
RL 训练在你已经了解 Hermes Agent 如何处理对话和工具调用的基础上效果最佳。如果你是新手，请先完成初学者路径。
:::

### "我想要将它用作 Python 库"

以编程方式将 Hermes Agent 集成到你自己的 Python 应用程序中。

1. [安装](/docs/getting-started/installation)
2. [快速入门](/docs/getting-started/quickstart)
3. [Python 库指南](/docs/guides/python-library)
4. [架构](/docs/developer-guide/architecture)
5. [工具](/docs/user-guide/features/tools)
6. [会话](/docs/user-guide/sessions)

## 关键功能一览

不确定有什么可用？以下是主要功能的快速目录：

| 功能 | 功能说明 | 链接 |
|---|---|---|
| **工具** | 代理可以调用的内置工具（文件 I/O、搜索、shell 等） | [工具](/docs/user-guide/features/tools) |
| **技能** | 为添加新功能而安装的插件包 | [技能](/docs/user-guide/features/skills) |
| **记忆** | 跨会话持久化的记忆 | [记忆](/docs/user-guide/features/memory) |
| **上下文文件** | 将文件和目录提供给对话 | [上下文文件](/docs/user-guide/features/context-files) |
| **MCP** | 通过模型上下文协议连接到外部工具服务器 | [MCP](/docs/user-guide/features/mcp) |
| **Cron** | 调度周期性代理任务 | [Cron](/docs/user-guide/features/cron) |
| **委托** | 为并行工作生成隔离的子代理 | [委托](/docs/user-guide/features/delegation) |
| **代码执行** | 在沙盒环境中运行代码 | [代码执行](/docs/user-guide/features/code-execution) |
| **浏览器** | 网页浏览和抓取 | [浏览器](/docs/user-guide/features/browser) |
| **钩子** | 事件驱动的回调和中间件 | [钩子](/docs/user-guide/features/hooks) |
| **批处理** | 批量处理多个输入 | [批处理](/docs/user-guide/features/batch-processing) |
| **RL 训练** | 使用强化学习微调模型 | [RL 训练](/docs/user-guide/features/rl-training) |
| **提供商路由** | 跨多个 LLM 提供商路由请求 | [提供商路由](/docs/user-guide/features/provider-routing) |

## 接下来读什么

根据你目前的位置：

- **刚完成安装？** → 前往 [快速入门](/docs/getting-started/quickstart) 运行你的第一次对话。
- **完成了快速入门？** → 阅读 [CLI 使用](/docs/user-guide/cli) 和 [配置](/docs/user-guide/configuration) 来定制你的设置。
- **对基础知识感到熟练？** → 探索 [工具](/docs/user-guide/features/tools)、[技能](/docs/user-guide/features/skills) 和 [记忆](/docs/user-guide/features/memory) 以释放代理的全部能力。
- **为团队设置？** → 阅读 [安全](/docs/user-guide/security) 和 [会话](/docs/user-guide/sessions) 了解访问控制和对话管理。
- **准备好构建了？** → 跳转到 [开发者指南](/docs/developer-guide/architecture) 了解内部结构并开始贡献。
- **想要实用示例？** → 查看 [指南](/docs/guides/tips) 部分获取实际项目和一些技巧。

:::tip
你不需要阅读所有内容。选择与你的目标匹配的路径，按顺序跟随链接，你会很快上手。如果需要下一步，随时可以回到此页面。
:::
