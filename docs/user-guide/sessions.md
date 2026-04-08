---
sidebar_position: 3
title: "会话"
description: "会话持久化、恢复、搜索、管理以及每个平台会话跟踪"
---

# 会话

Hermes Agent 自动将每个对话保存为会话。会话支持对话恢复、跨会话搜索和完整对话历史管理。

## 会话如何工作

每个对话——无论是来自 CLI、Telegram、Discord、Slack、WhatsApp、Signal、Matrix 还是任何其他消息平台——都作为具有完整消息历史的会话存储。会话在两个互补系统中跟踪：

1. **SQLite 数据库**（`~/.hermes/state.db`）——带有 FTS5 全文搜索的结构化会话元数据
2. **JSONL 转录文件**（`~/.hermes/sessions/`）——包含工具调用的原始对话转录（网关）

SQLite 数据库存储：
- 会话 ID、源平台、用户 ID
- **会话标题**（唯一的人类可读名称）
- 模型名称和配置
- 系统提示快照
- 完整消息历史（role、content、tool calls、tool results）
- Token 计数（输入/输出）
- 时间戳（started_at、ended_at）
- 父会话 ID（用于压缩触发的会话拆分）

### 会话来源

每个会话都标记有其源平台：

| 来源 | 描述 |
|--------|-------------|
| `cli` | 交互式 CLI（`hermes` 或 `hermes chat`） |
| `telegram` | Telegram 信使 |
| `discord` | Discord 服务器/DM |
| `slack` | Slack 工作区 |
| `whatsapp` | WhatsApp 信使 |
| `signal` | Signal 信使 |
| `matrix` | Matrix 房间和 DM |
| `mattermost` | Mattermost 频道 |
| `email` | Email（IMAP/SMTP） |
| `sms` | 通过 Twilio 的 SMS |
| `dingtalk` | DingTalk 信使 |
| `feishu` | 飞书/Lark 信使 |
| `wecom` | 企业微信（WeChat Work） |
| `homeassistant` | Home Assistant 对话 |
| `webhook` | 传入 webhooks |
| `api-server` | API 服务器请求 |
| `acp` | ACP 编辑器集成 |
| `cron` | 计划的 cron 任务 |
| `batch` | 批处理运行 |

## CLI 会话恢复

使用 `--continue` 或 `--resume` 从 CLI 恢复之前的对话：

### 继续上一个会话

```bash
# 恢复最近的 CLI 会话
hermes --continue
hermes -c

# 或使用 chat 子命令
hermes chat --continue
hermes chat -c
```

这从 SQLite 数据库查找最近的 `cli` 会话并加载其完整对话历史。

### 按名称恢复

如果你给会话命名了（参见下面的 [会话命名](#session-naming)），可以按名称恢复：

```bash
# 恢复命名会话
hermes -c "my project"

# 如果有谱系变体（my project、my project #2、my project #3），
# 这会自动恢复最新的
hermes -c "my project"   # → 恢复 "my project #3"
```

### 恢复特定会话

```bash
# 按 ID 恢复特定会话
hermes --resume 20250305_091523_a1b2c3d4
hermes -r 20250305_091523_a1b2c3d4

# 按标题恢复
hermes --resume "refactoring auth"

# 或使用 chat 子命令
hermes chat --resume 20250305_091523_a1b2c3d4
```

会话 ID 在你退出 CLI 会话时显示，可以通过 `hermes sessions list` 找到。

### 恢复时的对话摘要

当恢复会话时，Hermes 在输入提示之前显示一个样式化面板，展示之前对话的紧凑摘要：

<img className="docs-terminal-figure" src="/img/docs/session-recap.svg" alt="Stylized preview of the Previous Conversation recap panel shown when resuming a Hermes session." />
<p className="docs-figure-caption">恢复模式在返回实时提示之前显示紧凑摘要面板，包含最近的用户和助手回合。</p>

摘要：
- 显示 **用户消息**（金色 `●`）和 **助手回复**（绿色 `◆`）
- **截断** 长消息（用户 300 字符，助手 200 字符 / 3 行）
- **折叠** 工具调用为计数及工具名称（例如 `[3 tool calls: terminal, web_search]`）
- **隐藏** 系统消息、工具结果和内部推理
- **上限** 为最后 10 个交换，带有"... N earlier messages ..."指示器
- 使用 **暗淡样式** 以区别于活跃对话

要禁用摘要并保持最小单行行为，在 `~/.hermes/config.yaml` 中设置：

```yaml
display:
  resume_display: minimal   # 默认：full
```

:::tip
会话 ID 格式为 `YYYYMMDD_HHMMSS_<8-char-hex>`，例如 `20250305_091523_a1b2c3d4`。你可以按 ID 或标题恢复——ID 和标题都适用于 `-c` 和 `-r`。
:::

## 会话命名

给会话命名，以便轻松找到和恢复它们。

### 自动生成的标题

Hermes 在第一次交换后自动为每个会话生成简短描述性标题（3-7 个词）。这使用快速辅助模型在后台线程中运行，因此不会增加延迟。你会在用 `hermes sessions list` 或 `hermes sessions browse` 浏览会话时看到自动生成的标题。

自动标题仅在每个会话触发一次，如果你已经手动设置了标题则跳过。

### 手动设置标题

在任何聊天会话（CLI 或网关）中使用 `/title` 斜杠命令：

```
/title my research project
```

标题立即应用。如果会话尚未在数据库中创建（例如，你在发送第一条消息之前运行 `/title`），它会被排队并在会话开始时应用。

你也可以从命令行重命名现有会话：

```bash
hermes sessions rename 20250305_091523_a1b2c3d4 "refactoring auth module"
```

### 标题规则

- **唯一** — 没有两个会话可以共享相同标题
- **最多 100 个字符** — 保持列表输出整洁
- **清理** — 控制字符、零宽字符和 RTL 覆盖被自动剥离
- **正常 Unicode 没问题** — 表情符号、CJK、带重音的字符都可以

### 压缩时自动谱系

当会话上下文被压缩时（手动通过 `/compress` 或自动），Hermes 会创建一个新的继续会话。如果原始会话有标题，新会话会自动获得带编号的标题：

```
"my project" → "my project #2" → "my project #3"
```

当你按名称恢复时（`hermes -c "my project"`），它会自动选择谱系中最新的会话。

### 消息平台中的 /title

`/title` 命令在所有网关平台（Telegram、Discord、Slack、WhatsApp）中都能工作：

- `/title My Research` — 设置会话标题
- `/title` — 显示当前标题

## 会话管理命令

Hermes 通过 `hermes sessions` 提供完整的会话管理命令集：

### 列出会话

```bash
# 列出最近的会话（默认：最后 20 个）
hermes sessions list

# 按平台过滤
hermes sessions list --source telegram

# 显示更多会话
hermes sessions list --limit 50
```

当会话有标题时，输出显示标题、预览和相对时间戳：

```
Title                  Preview                                  Last Active   ID
────────────────────────────────────────────────────────────────────────────────────────────────
refactoring auth       Help me refactor the auth module please   2h ago        20250305_091523_a
my project #3          Can you check the test failures?          yesterday     20250304_143022_e
—                      What's the weather in Las Vegas?          3d ago        20250303_101500_f
```

当会话没有标题时，使用更简单的格式：

```
Preview                                            Last Active   Src    ID
──────────────────────────────────────────────────────────────────────────────────────
Help me refactor the auth module please             2h ago        cli    20250305_091523_a
What's the weather in Las Vegas?                    3d ago        tele   20250303_101500_f
```

### 导出会话

```bash
# 将会话导出为 JSONL 文件
hermes sessions export backup.jsonl

# 从特定平台导出会话
hermes sessions export telegram-history.jsonl --source telegram

# 导出单个会话
hermes sessions export session.jsonl --session-id 20250305_091523_a1b2c3d4
```

导出的文件每行包含一个 JSON 对象，包含完整会话元数据和所有消息。

### 删除会话

```bash
# 删除特定会话（带确认）
hermes sessions delete 20250305_091523_a1b2c3d4

# 无需确认删除
hermes sessions delete 20250305_091523_a1b2c3d4 --yes
```

### 重命名会话

```bash
# 设置或更改会话标题
hermes sessions rename 20250305_091523_a1b2c3d4 "debugging auth flow"

# 多词标题在 CLI 中不需要引号
hermes sessions rename 20250305_091523_a1b2c3d4 debugging auth flow
```

如果标题已被另一个会话使用，则显示错误。

### 清理旧会话

```bash
# 删除 90 天前结束的会话（默认）
hermes sessions prune

# 自定义时间阈值
hermes sessions prune --older-than 30

# 仅从特定平台清理会话
hermes sessions prune --source telegram --older-than 60

# 跳过确认
hermes sessions prune --older-than 30 --yes
```

:::info
清理仅删除 **已结束** 的会话（已明确结束或自动重置的会话）。活动会话永远不会被清理。
:::

### 会话统计

```bash
hermes sessions stats
```

输出：

```
Total sessions: 142
Total messages: 3847
  cli: 89 sessions
  telegram: 38 sessions
  discord: 15 sessions
Database size: 12.4 MB
```

要获取更深入的分析——token 使用量、成本估算、工具分解和活动模式——使用 [`hermes insights`](/docs/reference/cli-commands#hermes-insights)。

## 会话搜索工具

代理有一个内置 `session_search` 工具，使用 SQLite 的 FTS5 引擎对所有过去对话执行全文搜索。

### 工作原理

1. FTS5 搜索匹配的消息，按相关性排名
2. 按会话分组结果，获取顶部 N 个唯一会话（默认 3 个）
3. 加载每个会话的对话，截断到以匹配项为中心的大约 100K 字符
4. 发送到快速摘要模型以获取集中摘要
5. 返回每个会话的摘要以及元数据和周围上下文

### FTS5 查询语法

搜索支持标准 FTS5 查询语法：

- 简单关键词：`docker deployment`
- 短语：`"exact phrase"`
- 布尔值：`docker OR kubernetes`、`python NOT java`
- 前缀：`deploy*`

### 使用时机

代理会自动提示使用会话搜索：

> *"当用户引用过去对话中的内容或你怀疑存在相关先前上下文时，使用 session_search 来回忆它，而不是让他们重复自己。"*

## 每个平台会话跟踪

### 网关会话

在消息平台上，会话由来自消息源的确定性会话键键控：

| 聊天类型 | 默认键格式 | 行为 |
|-----------|--------------------|-------------|
| Telegram DM | `agent:main:telegram:dm:<chat_id>` | 每个 DM 一个会话 |
| Discord DM | `agent:main:discord:dm:<chat_id>` | 每个 DM 一个会话 |
| WhatsApp DM | `agent:main:whatsapp:dm:<chat_id>` | 每个 DM 一个会话 |
| 群聊 | `agent:main:<platform>:group:<chat_id>:<user_id>` | 当平台暴露用户 ID 时，群组内每个用户一个 |
| 群线程/主题 | `agent:main:<platform>:group:<chat_id>:<thread_id>:<user_id>` | 该线程/主题内每个用户一个 |
| 频道 | `agent:main:<platform>:channel:<chat_id>:<user_id>` | 当平台暴露用户 ID 时，频道内每个用户一个 |

当 Hermes 无法获取共享聊天的参与者标识符时，它会退回到该房间的一个共享会话。

### 共享 vs 隔离群会话

默认情况下，Hermes 在 `config.yaml` 中使用 `group_sessions_per_user: true`。这意味着：

- Alice 和 Bob 都可以在同一 Discord 频道中与 Hermes 交谈，而不会共享转录历史
- 一个用户的长工具密集型任务不会污染另一个用户的上下文窗口
- 中断处理也按用户保持，因为 running-agent 键匹配隔离的会话键

如果你想要一个共享的"房间大脑"，设置：

```yaml
group_sessions_per_user: false
```

这会将群/频道恢复为每个房间的单个共享会话，这保留了共享对话上下文，但也共享 token 费用、中断状态和上下文增长。

### 会话重置策略

网关会话基于可配置策略自动重置：

- **idle** — 在 N 分钟不活动后重置
- **daily** — 每天特定小时重置
- **both** — 以先到者为准（idle 或 daily）
- **none** — 永不自动重置

在会话自动重置之前，会给代理一个回合来保存对话中的任何重要记忆或技能。

具有 **活动后台进程** 的会话无论策略如何都永远不会被自动重置。

## 存储位置

| 内容 | 路径 | 描述 |
|------|------|-------------|
| SQLite 数据库 | `~/.hermes/state.db` | 所有会话元数据 + 带 FTS5 的消息 |
| 网关转录 | `~/.hermes/sessions/` | 每个会话的 JSONL 转录 + sessions.json 索引 |
| 网关索引 | `~/.hermes/sessions/sessions.json` | 将会话键映射到活动会话 ID |

SQLite 数据库使用 WAL 模式进行并发读取和单个写入，这非常适合网关的多平台架构。

### 数据库架构

`state.db` 中的关键表：

- **sessions** — 会话元数据（id、source、user_id、model、title、timestamps、token counts）。标题有唯一索引（允许 NULL，唯一的非 NULL 必须唯一）。
- **messages** — 完整消息历史（role、content、tool_calls、tool_name、token_count）
- **messages_fts** — FTS5 虚拟表，用于消息内容的全文搜索

## 会话过期和清理

### 自动清理

- 网关会话基于配置的 reset 策略自动重置
- 重置前，代理从即将过期的会话中保存记忆和技能
- 已结束的会话保留在数据库中直到被清理

### 手动清理

```bash
# 清理 90 天前的会话
hermes sessions prune

# 删除特定会话
hermes sessions delete <session_id>

# 清理前导出（备份）
hermes sessions export backup.jsonl
hermes sessions prune --older-than 30 --yes
```

:::tip
数据库增长缓慢（典型值：数百个会话 10-15 MB）。清理主要用于删除你不再需要用于搜索召回的旧对话。
:::
