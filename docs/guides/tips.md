---
sidebar_position: 1
title: "技巧与最佳实践"
description: "从 Hermes Agent 获得最佳效果的实用建议——提示技巧、CLI 快捷方式、上下文文件、内存、成本优化和安全"
---

# 技巧与最佳实践

一个快速获胜的实用技巧集合，让你立即更有效地使用 Hermes Agent。每个部分针对不同方面——扫描标题并跳转到相关部分。

---

## 获得最佳结果

### 具体说明你想要什么

模糊的提示产生模糊的结果。不要说"修复代码"，而要说"修复 `api/handlers.py` 第 47 行的 TypeError——`process_request()` 函数从 `parse_body()` 接收到 `None`。"你给的上下文越多，需要的迭代次数就越少。

### 提前提供上下文

将请求与相关细节前置：文件路径、错误消息、预期行为。一条精心制作的消息胜过三轮澄清。直接粘贴错误追溯——代理可以解析它们。

### 使用上下文文件处理重复指令

如果你发现自己重复相同的指令（"使用制表符而非空格"、"我们使用 pytest"、"API 在 `/api/v2`"），将它们放入 `AGENTS.md` 文件。代理在每个会话自动读取它——设置后零努力。

### 让代理使用它的工具

不要试图手把手指导每一步。说"找到并修复失败的测试"而不是"打开 `tests/test_foo.py`，看第 42 行，然后……"。代理有文件搜索、终端访问和代码执行——让它探索和迭代。

### 使用技能处理复杂工作流

在写一个冗长的提示解释如何做某事之前，检查是否已经有相关技能。输入 `/skills` 浏览可用技能，或直接调用一个如 `/axolotl` 或 `/github-pr-workflow`。

## CLI 高级用户技巧

### 多行输入

按 **Alt+Enter**（或 **Ctrl+J**）插入换行符而不发送。这让你在按 Enter 发送之前可以编写多行提示、粘贴代码块或构建复杂请求。

### 粘贴检测

CLI 自动检测多行粘贴。直接粘贴代码块或错误追溯——它不会将每一行作为单独消息发送。粘贴被缓冲并作为一条消息发送。

### 中断和重定向

按 **Ctrl+C** 一次在代理响应中途中断。然后你可以输入新消息来重定向它。2 秒内双按 Ctrl+C 强制退出。当代理开始走错路时，这非常宝贵。

### 使用 `-c` 恢复会话

忘记了上一个会话的内容？运行 `hermes -c` 准确地从你离开的地方继续，完整对话历史恢复。你也可以按标题恢复：`hermes -r "my research project"`。

### 剪贴板图像粘贴

按 **Ctrl+V** 直接将图像从剪贴板粘贴到聊天中。代理使用 vision 分析屏幕截图、图表、错误弹窗或 UI 模型——无需先保存到文件。

### 斜杠命令自动补全

输入 `/` 并按 **Tab** 查看所有可用命令。这包括内置命令（`/compress`、`/model`、`/title`）和每个已安装的技能。你不需要记住任何东西——Tab 补全覆盖你。

:::tip
使用 `/verbose` 循环切换工具输出显示模式：**off → new → all → verbose**。"all" 模式非常适合观察代理做什么；"off" 对简单问答最干净。
:::

## 上下文文件

### AGENTS.md: 你的项目大脑

在项目根目录创建 `AGENTS.md`，包含架构决策、编码约定和项目特定指令。这自动注入每个会话，所以代理始终知道你项目的规则。

```markdown
# Project Context
- This is a FastAPI backend with SQLAlchemy ORM
- Always use async/await for database operations
- Tests go in tests/ and use pytest-asyncio
- Never commit .env files
```

### SOUL.md: 自定义人格

想要 Hermes 有稳定的默认声音？编辑 `~/.hermes/SOUL.md`（或如果你使用自定义 Hermes home，则为 `$HERMES_HOME/SOUL.md`）。Hermes 现在自动生成起始 SOUL 并使用该全局文件作为实例范围的人格来源。

有关完整指南，请参见 [在 Hermes 中使用 SOUL.md](/docs/guides/use-soul-with-hermes)。

```markdown
# Soul
You are a senior backend engineer. Be terse and direct.
Skip explanations unless asked. Prefer one-liners over verbose solutions.
Always consider error handling and edge cases.
```

使用 `SOUL.md` 获得持久人格。使用 `AGENTS.md` 获得项目特定指令。

### .cursorrules 兼容性

已经有 `.cursorrules` 或 `.cursor/rules/*.mdc` 文件？Hermes 也会读取它们。无需重复你的编码约定——它们从工作目录自动加载。

### 发现

Hermes 在会话开始时从当前工作目录加载顶层 `AGENTS.md`。子目录 `AGENTS.md` 文件在工具调用期间懒发现（通过 `subdirectory_hints.py`）并注入工具结果——它们不会预先加载到系统提示中。

:::tip
保持上下文文件专注且简洁。每个字符都计入你的 token 预算，因为它们被注入每条消息。
:::

## 内存与技能

### 内存 vs. 技能：什么放哪里

**内存**用于事实：你的环境、偏好、项目位置以及代理了解你的事情。**技能**用于程序：多步骤工作流、特定工具指令和可复用配方。内存用于"什么"，技能用于"如何"。

### 何时创建技能

如果你发现一个需要 5+ 步骤的任务并且你会再做一次，让代理为其创建一个技能。说"将你刚才做的保存为名为 `deploy-staging` 的技能"。下次，只需输入 `/deploy-staging`，代理加载完整程序。

### 管理内存容量

内存有意被限制（`MEMORY.md` 约 2200 字符，`USER.md` 约 1375 字符）。当它满了，代理会合并条目。你可以通过说"清理你的内存"或"替换旧的 Python 3.9 笔记——我们现在用 3.12"来提供帮助。

### 让代理记住

在一次富有成效的会话后，说"记住这个下次用"，代理会保存关键要点。你也可以具体："保存到内存，我们的 CI 使用 GitHub Actions 和 `deploy.yml` 工作流。"

:::warning
内存是冻结的快照——会话期间所做的更改不会出现在系统提示中，直到下一会话开始。代理立即写入磁盘，但提示缓存不会在会话中途失效。
:::

## 性能与成本

### 不要破坏提示缓存

大多数 LLM 提供商缓存系统提示前缀。如果你保持系统提示稳定（相同的上下文文件、相同的内存），会话中的后续消息会获得**缓存命中**，便宜得多。避免在会话中途更改模型或系统提示。

### 在达到限制前使用 /compress

长会话会累积 token。当注意到响应变慢或被截断时，运行 `/compress`。这总结对话历史，在保持关键上下文的同时显著减少 token 计数。使用 `/usage` 检查你的状态。

### 使用委托进行并行工作

需要同时研究三个主题？让代理使用带有并行子任务的 `delegate_task`。每个子代理独立运行并获得自己的上下文，只有最终摘要返回——大大减少主对话的 token 使用。

### 使用 execute_code 进行批量操作

不要一次运行一个终端命令，让代理编写一个一次完成一切的脚本。"编写一个 Python 脚本将所有 `.jpeg` 文件重命名为 `.jpg` 并运行它"比单独重命名文件更便宜更快。

### 选择正确的模型

使用 `/model` 在会话中途切换模型。对于复杂推理和架构决策使用前沿模型（Claude Sonnet/Opus、GPT-4o）。对于简单任务如格式化、重命名或样板生成，切换到更快的模型。

:::tip
定期运行 `/usage` 查看你的 token 消耗。运行 `/insights` 获取过去 30 天使用模式的更广视图。
:::

## 消息提示

### 设置主页频道

在你首选的 Telegram 或 Discord 聊天中使用 `/sethome` 将其指定为主页频道。Cron 任务结果和计划任务输出投递到这里。没有它，代理无处发送主动消息。

### 使用 /title 组织会话

用 `/title auth-refactor` 或 `/title research-llm-quantization` 为你的会话命名。命名会话通过 `hermes sessions list` 容易找到，用 `hermes -r "auth-refactor"` 恢复。unnamed 会话堆积如山，无法区分。

### 用于团队访问的 DM 配对

不要手动收集用于白名单的用户 ID，启用 DM 配对。当队友 DM 机器人时，他们会获得一次性配对码。你用 `hermes pairing approve telegram XKGH5N7P` 批准——简单安全。

### 工具进度显示模式

使用 `/verbose` 控制你看到多少工具活动。在消息平台上，越少通常越好——保持在"new"仅查看新工具调用。在 CLI 中，"all" 给你看到代理所做的一切的满意实时视图。

:::tip
在消息平台上，会话在空闲时间后自动重置（默认：24 小时）或每天 4 AM。如果需要更长会话，在 `~/.hermes/config.yaml` 中调整每个平台。
:::

## 安全

### 对不受信任的代码使用 Docker

在处理不受信任的仓库或运行不熟悉的代码时，使用 Docker 或 Daytona 作为终端后端。在 `.env` 中设置 `TERMINAL_BACKEND=docker`。容器内的破坏性命令无法伤害你的主机系统。

```bash
# In your .env:
TERMINAL_BACKEND=docker
TERMINAL_DOCKER_IMAGE=hermes-sandbox:latest
```

### 避免 Windows 编码陷阱

在 Windows 上，一些默认编码（如 `cp125x`）无法表示所有 Unicode 字符，这可能在写入测试或脚本中的文件时导致 `UnicodeEncodeError`。

- 首选使用显式 UTF-8 编码打开文件：

```python
with open("results.txt", "w", encoding="utf-8") as f:
    f.write("✓ All good\n")
```

- 在 PowerShell 中，你也可以将当前会话切换到 UTF-8 以便控制台和本机命令输出：

```powershell
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
```

这保持 PowerShell 和子进程在 UTF-8 上，有助于避免仅限 Windows 的失败。

### 仔细考虑选择"始终"

当代理触发危险命令批准（`rm -rf`、`DROP TABLE` 等）时，你获得四个选项：**一次**、**会话**、**始终**、**拒绝**。在选择"始终"之前仔细考虑——它永久允许该模式。从"会话"开始，直到你感到舒适。

### 命令批准是你的安全网

Hermes 在执行前根据危险模式列表检查每个命令。这包括递归删除、SQL drops、piping curl 到 shell 等。不要在生产中禁用它——它存在有充分理由。

:::warning
在容器后端（Docker、Singularity、Modal、Daytona）中运行，危险命令检查会被**跳过**，因为容器是安全边界。确保你的容器镜像正确锁定。
:::

### 为消息机器人使用白名单

永远不要在具有终端访问的机器人上设置 `GATEWAY_ALLOW_ALL_USERS=true`。始终使用平台特定白名单（`TELEGRAM_ALLOWED_USERS`、`DISCORD_ALLOWED_USERS`）或 DM 配对来控制谁可以与你的代理交互。

```bash
# Recommended: explicit allowlists per platform
TELEGRAM_ALLOWED_USERS=123456789,987654321
DISCORD_ALLOWED_USERS=123456789012345678

# Or use cross-platform allowlist
GATEWAY_ALLOWED_USERS=123456789,987654321
```

---

*觉得这个页面应该有提示？在 GitHub 上开 issue 或 PR——欢迎社区贡献。*
