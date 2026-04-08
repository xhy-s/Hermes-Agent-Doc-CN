---
sidebar_position: 1
title: "命令行界面"
description: "掌握 Hermes Agent 终端界面——命令、按键绑定、人格等"
---

# 命令行界面

Hermes Agent 的 CLI 是一个完整的终端用户界面（TUI）——不是 Web UI。它具有多行编辑、斜杠命令自动补全、对话历史、中断重定向和流式工具输出。为生活在终端中的人构建。

## 运行 CLI

```bash
# 启动交互式会话（默认）
hermes

# 单查询模式（非交互式）
hermes chat -q "Hello"

# 使用特定模型
hermes chat --model "anthropic/claude-sonnet-4"

# 使用特定提供商
hermes chat --provider nous        # 使用 Nous Portal
hermes chat --provider openrouter  # 强制使用 OpenRouter

# 使用特定工具集
hermes chat --toolsets "web,terminal,skills"

# 启动时预加载一个或多个技能
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -q "open a draft PR"

# 恢复之前的会话
hermes --continue             # 恢复最近的 CLI 会话（-c）
hermes --resume <session_id>  # 按 ID 恢复特定会话（-r）

# 详细模式（调试输出）
hermes chat --verbose

# 隔离的 git worktree（用于并行运行多个代理）
hermes -w                         # 在 worktree 中的交互模式
hermes -w -q "Fix issue #123"     # 在 worktree 中的单次查询
```

## 界面布局

<img className="docs-terminal-figure" src="/img/docs/cli-layout.svg" alt="Stylized preview of the Hermes CLI layout showing the banner, conversation area, and fixed input prompt." />
<p className="docs-figure-caption">Hermes CLI 横幅、对话流和固定输入提示符，渲染为稳定的文档图形而非脆弱的文本艺术。</p>

欢迎横幅一目了然地显示你的模型、终端后端、工作目录、可用工具和已安装技能。

### 状态栏

一个持久的状态栏位于输入区域上方，实时更新：

```
 ⚕ claude-sonnet-4-20250514 │ 12.4K/200K │ [██████░░░] 6% │ $0.06 │ 15m
```

| 元素 | 描述 |
|--------|-------------|
| 模型名称 | 当前模型（如果超过 26 个字符则截断） |
| Token 计数 | 已用上下文 Token / 最大上下文窗口 |
| 上下文条 | 带颜色编码阈值的可视化填充指示器 |
| 费用 | 估计的会话费用（或未知/零价格型号的 `n/a`） |
| 时长 | 经过的会话时间 |

栏会适应终端宽度——在 ≥76 列时完整布局，52-75 列紧凑，52 列以下最小（仅模型和时长）。

**上下文颜色编码：**

| 颜色 | 阈值 | 含义 |
|-------|-----------|-------|
| 绿色 | < 50% | 空间充足 |
| 黄色 | 50-80% | 越来越满 |
| 橙色 | 80-95% | 接近极限 |
| 红色 | ≥ 95% | 接近溢出——考虑 `/compress` |

使用 `/usage` 获取详细分类费用分解（输入 vs 输出 Token）。

### 恢复会话显示

恢复之前的会话时（`hermes -c` 或 `hermes --resume <id>`），横幅和输入提示之间会出现"之前的对话"面板，显示对话历史的紧凑摘要。详见 [会话——恢复时的对话摘要](sessions.md#conversation-recap-on-resume) 的详情和配置。

## 按键绑定

| 按键 | 动作 |
|-----|--------|
| `Enter` | 发送消息 |
| `Alt+Enter` 或 `Ctrl+J` | 新行（多行输入） |
| `Alt+V` | 当终端支持时从剪贴板粘贴图片 |
| `Ctrl+V` | 粘贴文本并机会性地附加剪贴板图片 |
| `Ctrl+B` | 启用语音模式时开始/停止录音（`voice.record_key`，默认：`ctrl+b`） |
| `Ctrl+C` | 中断代理（2 秒内按两次强制退出） |
| `Ctrl+D` | 退出 |
| `Ctrl+Z` | 将 Hermes 挂起到后台（仅 Unix）。在 shell 中运行 `fg` 恢复。 |
| `Tab` | 接受自动建议（幽灵文本）或自动补全斜杠命令 |

## 斜杠命令

输入 `/` 查看自动完成下拉列表。Hermes 支持大量 CLI 斜杠命令、动态技能命令和用户定义的快速命令。

常见示例：

| 命令 | 描述 |
|--------|-------------|
| `/help` | 显示命令帮助 |
| `/model` | 显示或更改当前模型 |
| `/tools` | 列出当前可用工具 |
| `/skills browse` | 浏览技能中心和官方可选技能 |
| `/background <prompt>` | 在单独的后台会话中运行提示 |
| `/skin` | 显示或切换活动的 CLI 皮肤 |
| `/voice on` | 启用 CLI 语音模式（按 `Ctrl+B` 录音） |
| `/voice tts` | 切换 Hermes 回复的语音播放 |
| `/reasoning high` | 增加推理努力 |
| `/title My Session` | 命名当前会话 |

完整的内置 CLI 和消息列表，参见 [斜杠命令参考](../reference/slash-commands.md)。

关于设置、提供商、静音调优和消息/Discord 语音使用，参见 [语音模式](features/voice-mode.md)。

:::tip
命令不区分大小写——`/HELP` 和 `/help` 效果相同。已安装的技能也会自动成为斜杠命令。
:::

## 快速命令

你可以定义自定义命令，无需调用 LLM 即可立即运行 shell 命令。这些在 CLI 和消息平台（Telegram、Discord 等）中都能工作。

```yaml
# ~/.hermes/config.yaml
quick_commands:
  status:
    type: exec
    command: systemctl status hermes-agent
  gpu:
    type: exec
    command: nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader
```

然后在任何聊天中输入 `/status` 或 `/gpu`。更多示例请参阅 [配置指南](/docs/user-guide/configuration#quick-commands)。

## 启动时预加载技能

如果你已经知道会话想要哪些技能，可以在启动时传递：

```bash
hermes -s hermes-agent-dev,github-auth
hermes chat -s github-pr-workflow -s github-auth
```

Hermes 在第一次对话之前将每个命名技能加载到会话提示中。相同标志在交互模式和单查询模式下都有效。

## 技能斜杠命令

`~/.hermes/skills/` 中的每个已安装技能都会自动注册为斜杠命令。技能名称成为命令：

```
/gif-search funny cats
/axolotl help me fine-tune Llama 3 on my dataset
/github-pr-workflow create a PR for the auth refactor

# 只需技能名称会加载它并让代理询问你需要什么：
/excalidraw
```

## 人格

设置预定义人格以更改代理的语气：

```
/personality pirate
/personality kawaii
/personality concise
```

内置人格包括：`helpful`、`concise`、`technical`、`creative`、`teacher`、`kawaii`、`catgirl`、`pirate`、`shakespeare`、`surfer`、`noir`、`uwu`、`philosopher`、`hype`。

你也可以在 `~/.hermes/config.yaml` 中定义自定义人格：

```yaml
personalities:
  helpful: "You are a helpful, friendly AI assistant."
  kawaii: "You are a kawaii assistant! Use cute expressions..."
  pirate: "Arrr! Ye be talkin' to Captain Hermes..."
  # 添加你自己的！
```

## 多行输入

有两种输入多行消息的方法：

1. **`Alt+Enter` 或 `Ctrl+J`** — 插入新行
2. **反斜杠续行** — 以 `\` 结束一行以继续：

```
❯ Write a function that:\
  1. Takes a list of numbers\
  2. Returns the sum
```

:::info
支持粘贴多行文本——使用 `Alt+Enter` 或 `Ctrl+J` 插入换行符，或直接粘贴内容。
:::

## 中断代理

你可以在任何时候中断代理：

- **输入新消息 + 回车** 而代理正在工作时——它会中断并处理你的新指示
- **`Ctrl+C`** — 中断当前操作（2 秒内按两次强制退出）
- 正在进行的终端命令会立即终止（SIGTERM，然后 1 秒后 SIGKILL）
- 在中断期间输入的多条消息会合并为一个提示

### 忙碌输入模式

`display.busy_input_mode` 配置键控制当你在代理工作时按回车时会发生什么：

| 模式 | 行为 |
|------|-------------|
| `"interrupt"`（默认） | 你的消息会中断当前操作并立即处理 |
| `"queue"` | 你的消息会被静默排队，并在代理完成后作为下一个回合发送 |

```yaml
# ~/.hermes/config.yaml
display:
  busy_input_mode: "queue"   # 或 "interrupt"（默认）
```

队列模式在你想要准备后续消息而不意外取消进行中的工作时很有用。未知值回退到 `"interrupt"`。

### 挂起到后台

在 Unix 系统上，按 **`Ctrl+Z`** 将 Hermes 挂起到后台——就像任何终端进程一样。shell 打印确认：

```
Hermes Agent has been suspended. Run `fg` to bring Hermes Agent back.
```

在 shell 中输入 `fg` 以准确从中断处恢复会话。不支持 Windows。

## 工具进度显示

CLI 在代理工作时显示动画反馈：

**思考动画**（API 调用期间）：
```
  ◜ (｡•́︿•̀｡) pondering... (1.2s)
  ◠ (⊙_⊙) contemplating... (2.4s)
  ✧٩(ˊᗜˋ*)و✧ got it! (3.1s)
```

**工具执行信息：**
```
  ┊ 💻 terminal `ls -la` (0.3s)
  ┊ 🔍 web_search (1.2s)
  ┊ 📄 web_extract (2.1s)
```

使用 `/verbose` 循环显示模式：`off → new → all → verbose`。此命令也可以为消息平台启用——参见 [配置](/docs/user-guide/configuration#display-settings)。

### 工具预览长度

`display.tool_preview_length` 配置键控制工具调用预览行中显示的最大字符数（例如文件路径、终端命令）。默认为 `0`，表示无限制——显示完整路径和命令。

```yaml
# ~/.hermes/config.yaml
display:
  tool_preview_length: 80   # 将工具预览截断为 80 个字符（0 = 无限制）
```

这在窄终端上或当工具参数包含非常长的文件路径时很有用。

## 会话管理

### 恢复会话

退出 CLI 会话时，会打印恢复命令：

```
Resume this session with:
  hermes --resume 20260225_143052_a1b2c3

Session:        20260225_143052_a1b2c3
Duration:       12m 34s
Messages:       28 (5 user, 18 tool calls)
```

恢复选项：

```bash
hermes --continue                          # 恢复最近的 CLI 会话
hermes -c                                  # 简短形式
hermes -c "my project"                     # 恢复命名会话（谱系中的最新）
hermes --resume 20260225_143052_a1b2c3     # 按 ID 恢复特定会话
hermes --resume "refactoring auth"         # 按标题恢复
hermes -r 20260225_143052_a1b2c3           # 简短形式
```

恢复会从 SQLite 完整恢复对话历史。代理会看到所有之前的消息、工具调用和响应——就像你从未离开过一样。

使用 `/title My Session Name` 在聊天中命名当前会话，或从命令行使用 `hermes sessions rename <id> <title>`。使用 `hermes sessions list` 浏览过去的会话。

### 会话存储

CLI 会话存储在 Hermes 的 SQLite 状态数据库 `~/.hermes/state.db` 中。数据库保留：

- 会话元数据（ID、标题、时间戳、Token 计数器）
- 消息历史
- 压缩/恢复会话的谱系
- `session_search` 使用的全文搜索索引

某些消息适配器也在数据库旁边保留每个平台的转录文件，但 CLI 本身从 SQLite 会话存储恢复。

### 上下文压缩

长对话在接近上下文限制时会自动摘要：

```yaml
# 在 ~/.hermes/config.yaml 中
compression:
  enabled: true
  threshold: 0.50    # 默认在上下文限制的 50% 时压缩
  summary_model: "google/gemini-3-flash-preview"  # 用于摘要的模型
```

当压缩触发时，中间回合被摘要，而前 3 个和最后 4 个回合始终保留。

## 后台会话

在单独的后台会话中运行提示，同时继续使用 CLI 进行其他工作：

```
/background Analyze the logs in /var/log and summarize any errors from today
```

Hermes 立即确认任务并返回提示：

```
🔄 Background task #1 started: "Analyze the logs in /var/log and summarize..."
   Task ID: bg_143022_a1b2c3
```

### 工作原理

每个 `/background` 提示会生成一个**完全独立的代理会话**在守护线程中：

- **隔离对话** — 后台代理不知道你当前会话的历史。它只接收你提供的提示。
- **相同配置** — 后台代理继承你当前会话的模型、提供商、工具集、推理设置和回退模型。
- **非阻塞** — 你的前台会话保持完全交互式。你可以聊天、运行命令，甚至启动更多后台任务。
- **多任务** — 你可以同时运行多个后台任务。每个任务都有一个编号 ID。

### 结果

当后台任务完成时，结果会显示为终端中的面板：

```
╭─ ⚕ Hermes (background #1) ──────────────────────────────────╮
│ Found 3 errors in syslog from today:                         │
│ 1. OOM killer invoked at 03:22 — killed process nginx        │
│ 2. Disk I/O error on /dev/sda1 at 07:15                      │
│ 3. Failed SSH login attempts from 192.168.1.50 at 14:30      │
╰──────────────────────────────────────────────────────────────╯
```

如果任务失败，你会看到错误通知。如果你的配置中启用了 `display.bell_on_complete`，任务完成时终端铃声会响。

### 用例

- **长时间研究** — "/background research the latest developments in quantum error correction" 而你工作时研究代码
- **文件处理** — "/background analyze all Python files in this repo and list any security issues" 而你继续对话
- **并行调查** — 同时启动多个后台任务以探索不同角度

:::info
后台会话不会出现在你的主要对话历史中。它们是具有自己任务 ID（例如 `bg_143022_a1b2c3`）的独立会话。
:::

## 安静模式

默认情况下，CLI 以安静模式运行：
- 抑制工具的详细日志
- 启用 kawaii 风格的动画反馈
- 保持输出简洁且用户友好

调试输出：
```bash
hermes chat --verbose
```
