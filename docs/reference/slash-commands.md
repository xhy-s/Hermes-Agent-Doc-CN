---
sidebar_position: 2
title: "斜杠命令参考"
description: "交互式 CLI 和消息斜杠命令的完整参考"
---

# 斜杠命令参考

Hermes 有两个斜杠命令界面，均由 `hermes_cli/commands.py` 中的中央 `COMMAND_REGISTRY` 驱动：

- **交互式 CLI 斜杠命令** — 由 `cli.py` 分派，具有来自注册表的自动补全
- **消息斜杠命令** — 由 `gateway/run.py` 分派，从注册表生成帮助文本和平台菜单

已安装的技能也会作为动态斜杠命令暴露在两个界面上。包括捆绑技能如 `/plan`，它打开计划模式并将 markdown 计划保存到活动 workspace/backend 工作目录下的 `.hermes/plans/`。

## 交互式 CLI 斜杠命令

在 CLI 中输入 `/` 打开自动补全菜单。内置命令不区分大小写。

### 会话

| 命令 | 描述 |
|---------|-------------|
| `/new`（别名：`/reset`） | 开始新会话（新的 session ID + 历史记录） |
| `/clear` | 清除屏幕并开始新会话 |
| `/history` | 显示对话历史 |
| `/save` | 保存当前对话 |
| `/retry` | 重试上一条消息（重新发送给代理） |
| `/undo` | 删除上一条用户/助手交换 |
| `/title` | 为当前会话设置标题（用法：/title 我的会话名称） |
| `/compress` | 手动压缩对话上下文（刷新 memories + 总结） |
| `/rollback` | 列出或恢复文件系统检查点（用法：/rollback [数字]） |
| `/stop` | 终止所有运行的后台进程 |
| `/queue <prompt>`（别名：`/q`） | 将 prompt 排队等待下一轮（不会中断当前代理响应）。**注意：** `/q` 同时被 `/queue` 和 `/quit` 声明，最后注册的优先，所以 `/q` 实际上解析为 `/quit`。请明确使用 `/queue`。 |
| `/resume [name]` | 恢复之前命名的会话 |
| `/statusbar`（别名：`/sb`） | 切换上下文/模型状态栏的开关 |
| `/background <prompt>`（别名：`/bg`） | 在独立的后台会话中运行 prompt。代理独立处理你的 prompt——你的当前会话保持空闲以处理其他工作。结果在任务完成时显示为面板。参见 [CLI 后台会话](/docs/user-guide/cli#background-sessions)。 |
| `/btw <question>` | 使用会话上下文的临时附带问题（无工具，不持久）。用于快速澄清，不影响对话历史。 |
| `/plan [request]` | 加载捆绑的 `plan` 技能以编写 markdown 计划而不是执行工作。计划保存在活动 workspace/backend 工作目录下的 `.hermes/plans/`。 |
| `/branch [name]`（别名：`/fork`） | 分支当前会话（探索不同路径） |

### 配置

| 命令 | 描述 |
|---------|-------------|
| `/config` | 显示当前配置 |
| `/model [model-name]` | 显示或更改当前模型。支持：`/model claude-sonnet-4`、`/model provider:model`（切换提供商）、`/model custom:model`（自定义端点）、`/model custom:name:model`（命名自定义提供商）、`/model custom`（自动检测端点） |
| `/provider` | 显示可用提供商和当前提供商 |
| `/prompt` | 查看/设置自定义系统提示 |
| `/personality` | 设置预定义人格 |
| `/verbose` | 循环工具进度显示：off → new → all → verbose。可通过配置为消息传递启用。 |
| `/reasoning` | 管理推理工作量和显示（用法：/reasoning [level\|show\|hide]） |
| `/skin` | 显示或更改显示皮肤/主题 |
| `/voice [on\|off\|tts\|status]` | 切换 CLI 语音模式和口语播放。录音使用 `voice.record_key`（默认：`Ctrl+B`）。 |
| `/yolo` | 切换 YOLO 模式——跳过所有危险命令批准提示。 |

### 工具与技能

| 命令 | 描述 |
|---------|-------------|
| `/tools [list\|disable\|enable] [name...]` | 管理工具：列出可用工具，或为当前会话禁用/启用特定工具。禁用工具会将其从代理的工具集中移除并触发会话重置。 |
| `/toolsets` | 列出可用工具集 |
| `/browser [connect\|disconnect\|status]` | 管理本地 Chrome CDP 连接。`connect` 将浏览器工具附加到运行的 Chrome 实例（默认：`ws://localhost:9222`）。`disconnect` 分离。`status` 显示当前连接。如未检测到调试器会自动启动 Chrome。 |
| `/skills` | 从在线注册表搜索、安装、检查或管理技能 |
| `/cron` | 管理计划任务（列出、添加/创建、编辑、暂停、恢复、运行、删除） |
| `/reload-mcp`（别名：`/reload_mcp`） | 从 config.yaml 重新加载 MCP 服务器 |
| `/plugins` | 列出已安装的插件及其状态 |

### 信息

| 命令 | 描述 |
|---------|-------------|
| `/help` | 显示此帮助消息 |
| `/usage` | 显示 token 使用量、成本细分和会话持续时间 |
| `/insights` | 显示使用洞察和分析（过去 30 天） |
| `/platforms`（别名：`/gateway`） | 显示网关/消息平台状态 |
| `/paste` | 检查剪贴板中的图像并附加它 |
| `/profile` | 显示活动 profile 名称和主目录 |

### 退出

| 命令 | 描述 |
|---------|-------------|
| `/quit` | 退出 CLI（也：`/exit`）。参见上面 `/queue` 下的 `/q` 说明。 |

### 动态 CLI 斜杠命令

| 命令 | 描述 |
|---------|-------------|
| `/<skill-name>` | 将任何已安装的技能作为按需命令加载。示例：`/gif-search`、`/github-pr-workflow`、`/excalidraw`。 |
| `/skills ...` | 从注册表和官方可选技能目录搜索、浏览、安装、审核、发布和配置技能。 |

### 快速命令

用户定义的快速命令将短别名映射到更长的 prompt。在 `~/.hermes/config.yaml` 中配置：

```yaml
quick_commands:
  review: "Review my latest git diff and suggest improvements"
  deploy: "Run the deployment script at scripts/deploy.sh and verify the output"
  morning: "Check my calendar, unread emails, and summarize today's priorities"
```

然后在 CLI 中输入 `/review`、`/deploy` 或 `/morning`。快速命令在分派时解析，不会在内置自动补全/帮助表中显示。

### 别名解析

命令支持前缀匹配：输入 `/h` 解析为 `/help`，`/mod` 解析为 `/model`。当前缀模糊（匹配多个命令）时，按注册表顺序第一个匹配优先。完整命令名称和注册别名始终优先于前缀匹配。

## 消息斜杠命令

消息网关在 Telegram、Discord、Slack、WhatsApp、Signal、Email 和 Home Assistant 聊天中支持以下内置命令：

| 命令 | 描述 |
|---------|-------------|
| `/new` | 开始新对话。 |
| `/reset` | 重置对话历史。 |
| `/status` | 显示会话信息。 |
| `/stop` | 终止所有运行的后台进程并中断正在运行的代理。 |
| `/model [provider:model]` | 显示或更改模型。支持提供商切换（`/model zai:glm-5`）、自定义端点（`/model custom:model`）、命名自定义提供商（`/model custom:local:qwen`）和自动检测（`/model custom`）。 |
| `/provider` | 显示提供商可用性和认证状态。 |
| `/personality [name]` | 为会话设置人格覆盖。 |
| `/retry` | 重试上一条消息。 |
| `/undo` | 删除上一条交换。 |
| `/sethome`（别名：`/set-home`） | 将当前聊天标记为平台主页通道以进行投递。 |
| `/compress` | 手动压缩对话上下文。 |
| `/title [name]` | 设置或显示会话标题。 |
| `/resume [name]` | 恢复之前命名的会话。 |
| `/usage` | 显示 token 使用量、成本估算（输入/输出）、上下文窗口状态和会话持续时间。 |
| `/insights [days]` | 显示使用分析。 |
| `/reasoning [level\|show\|hide]` | 更改推理工作量或切换推理显示。 |
| `/voice [on\|off\|tts\|join\|channel\|leave\|status]` | 控制聊天中的口语回复。`join`/`channel`/`leave` 管理 Discord 语音频道模式。 |
| `/rollback [number]` | 列出或恢复文件系统检查点。 |
| `/background <prompt>` | 在独立的后台会话中运行 prompt。结果在任务完成时返回到同一聊天。参见 [消息后台会话](/docs/user-guide/messaging/#background-sessions)。 |
| `/plan [request]` | 加载捆绑的 `plan` 技能以编写 markdown 计划而不是执行工作。计划保存在活动 workspace/backend 工作目录下的 `.hermes/plans/`。 |
| `/reload-mcp`（别名：`/reload_mcp`） | 从配置重新加载 MCP 服务器。 |
| `/yolo` | 切换 YOLO 模式——跳过所有危险命令批准提示。 |
| `/commands [page]` | 浏览所有命令和技能（分页）。 |
| `/approve [session\|always]` | 批准并执行待处理危险命令。`session` 仅为此会话批准；`always` 添加到永久允许列表。 |
| `/deny` | 拒绝待处理危险命令。 |
| `/update` | 将 Hermes Agent 更新到最新版本。 |
| `/help` | 显示消息帮助。 |
| `/<skill-name>` | 按名称调用任何已安装的技能。 |

## 注意事项

- `/skin`、`/tools`、`/toolsets`、`/browser`、`/config`、`/prompt`、`/cron`、`/skills`、`/platforms`、`/paste`、`/statusbar` 和 `/plugins` 是**仅 CLI** 命令。
- `/verbose` **默认仅 CLI**，但可通过在 `config.yaml` 中设置 `display.tool_progress_command: true` 为消息平台启用。启用后，它会循环切换 `display.tool_progress` 模式并保存到配置。
- `/status`、`/sethome`、`/update`、`/approve`、`/deny` 和 `/commands` 是**仅消息**命令。
- `/background`、`/voice`、`/reload-mcp`、`/rollback` 和 `/yolo` 在**CLI 和消息网关**中均可工作。
- `/voice join`、`/voice channel` 和 `/voice leave` 仅在 Discord 上有意义。