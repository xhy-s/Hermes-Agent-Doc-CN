---
sidebar_position: 3
title: "Discord"
description: "将 Hermes Agent 设置为 Discord 机器人"
---

# Discord 设置

Hermes Agent 与 Discord 集成作为机器人，让您可以通过私信或服务器频道与 AI 助手聊天。机器人接收您的消息，通过 Hermes Agent 管道处理（包括工具使用、记忆和推理），并实时回复。它支持文本、语音消息、文件附件和斜杠命令。

在设置之前，这里是大多数人想了解的部分：Hermes 进入您的服务器后的行为。

## Hermes 的行为

| 上下文 | 行为 |
|---------|----------|
| **私信** | Hermes 响应每条消息。无需 `@提及`。每条私信都有自己的会话。 |
| **服务器频道** | 默认情况下，Hermes 仅在您 `@提及` 它时响应。如果您在频道中发布消息而没有提及它，Hermes 忽略该消息。 |
| **自由回复频道** | 您可以使用 `DISCORD_FREE_RESPONSE_CHANNELS` 使特定频道无需提及，或使用 `DISCORD_REQUIRE_MENTION=false` 全局禁用提及。 |
| **线程** | Hermes 在同一线程中回复。除非该线程或其父频道配置为自由回复，否则提及规则仍然适用。线程与会话历史中的父频道隔离。 |
| **多用户共享频道** | 默认情况下，Hermes 在频道内为每个用户隔离会话历史以确保安全和清晰。同一频道中与 Hermes 聊天的两个人默认不会共享一个对话记录，除非您明确禁用。 |
| **提及其他用户的消息** | 当 `DISCORD_IGNORE_NO_MENTION` 为 `true`（默认）时，如果消息 @提及了其他用户但**没有**提及机器人，Hermes 保持沉默。这防止机器人在针对其他人的对话中跳入。如果设置为 `false`，即使消息 @提及了其他人，机器人也会响应。仅适用于服务器频道，不适用于私信。 |

:::tip
如果您想要一个正常的机器人帮助频道，让人们每次都能与 Hermes 交谈而不必标记它，请将该频道添加到 `DISCORD_FREE_RESPONSE_CHANNELS`。
:::

### Discord 网关模型

Discord 上的 Hermes 不是 stateless 回复的 webhook。它通过完整的消息网关运行，这意味着每条收到的消息都会经过：

1. 授权（`DISCORD_ALLOWED_USERS`）
2. 提及/自由回复检查
3. 会话查找
4. 会话记录加载
5. 正常 Hermes 代理执行，包括工具、记忆和斜杠命令
6. 回复传递回 Discord

这很重要，因为繁忙服务器中的行为取决于 Discord 路由和 Hermes 会话策略。

### Discord 中的会话模型

默认情况下：

- 每条私信获得自己的会话
- 每个服务器线程获得自己的会话命名空间
- 共享频道中的每个用户在频道内获得自己的会话

因此，如果 Alice 和 Bob 都在 `#research` 中与 Hermes 交谈，Hermes 默认将它们视为独立的对话，即使它们使用相同的可见 Discord 频道。

这通过 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您明确希望整个房间共享一个对话时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话对于协作房间可能有用，但它们也意味着：

- 用户共享上下文增长和令牌成本
- 一人的长期工具密集型任务可能膨胀其他所有人的上下文
- 一人在同一房间的进行中运行可能中断另一人的后续操作

### 中断和并发

Hermes 按会话键跟踪正在运行的代理。

使用默认的 `group_sessions_per_user: true`：

- Alice 中断她自己的进行中请求仅影响该频道中 Alice 的会话
- Bob 可以在同一频道中继续交谈而不继承 Alice 的历史或中断 Alice 的运行

使用 `group_sessions_per_user: false`：

- 整个房间在该频道/线程共享一个运行代理槽
- 来自不同人的后续消息可能相互中断或在彼此后面排队

本指南将引导您完成从在 Discord 开发者门户创建机器人到发送第一条消息的完整设置过程。

## 步骤 1：创建 Discord 应用程序

1. 进入 [Discord 开发者门户](https://discord.com/developers/applications) 并使用您的 Discord 账户登录。
2. 点击右上角的 **新建应用程序**。
3. 为您的应用程序输入名称（例如"Hermes Agent"）并接受开发者服务条款。
4. 点击 **创建**。

您将进入 **常规信息** 页面。记下 **应用程序 ID** — 您稍后需要它来构建邀请 URL。

## 步骤 2：创建机器人

1. 在左侧边栏，点击 **机器人**。
2. Discord 自动为您的应用程序创建一个机器人用户。您将看到机器人的用户名，可以自定义。
3. 在 **授权流程** 下：
   - 将 **公开机器人** 设置为 **开启** — 需要使用 Discord 提供的邀请链接（推荐）。这允许安装选项卡生成默认授权 URL。
   - 将 **需要 OAuth2 代码授权** 保持 **关闭**。

:::tip
您可以在此页面为机器人设置自定义头像和横幅。这是用户在 Discord 中看到的。
:::

:::info[私人机器人替代方案]
如果您希望保持机器人私有（公开机器人 = 关闭），您**必须**在步骤 5 中使用 **手动 URL** 方法而不是安装选项卡。Discord 提供的链接需要启用公开机器人。
:::

## 步骤 3：启用特权网关 Intent

这是整个设置中最关键的步骤。如果没有正确的 Intent 启用，您的机器人将连接到 Discord 但**无法读取消息内容**。

在 **机器人** 页面，向下滚动到 **特权网关 Intent**。您将看到三个切换：

| Intent | 用途 | 必需？ |
|--------|---------|-----------|
| **Presence Intent** | 查看用户在线/离线状态 | 可选 |
| **Server Members Intent** | 访问成员列表，解析用户名 | **必需** |
| **Message Content Intent** | 读取消息的文本内容 | **必需** |

**启用 Server Members Intent 和 Message Content Intent** 两者都将切换为 **开启**。

- 没有 **Message Content Intent**，您的机器人收到消息事件但消息文本为空 — 机器人实际上看不到您输入的内容。
- 没有 **Server Members Intent**，机器人无法解析允许用户列表的用户名，并且可能无法识别谁在向它发送消息。

:::warning[这是 Discord 机器人不工作的首要原因]
如果您的机器人在线但从不回复消息，几乎可以肯定是 **Message Content Intent** 被禁用了。返回 [开发者门户](https://discord.com/developers/applications)，选择您的应用程序 → 机器人 → 特权网关 Intent，并确保 **Message Content Intent** 切换为开启。点击 **保存更改**。
:::

**关于服务器数量：**
- 如果您的机器人在 **少于 100 个服务器** 中，您可以自由切换 Intent。
- 如果您的机器人在 **100 个或更多服务器** 中，Discord 要求您提交验证申请以使用特权 Intent。对于个人使用，这不是问题。

点击页面底部的 **保存更改**。

## 步骤 4：获取机器人令牌

机器人令牌是 Hermes Agent 用于登录机器人的凭证。仍在 **机器人** 页面上：

1. 在 **令牌** 部分，点击 **重置令牌**。
2. 如果您在 Discord 账户上启用了双因素身份验证，请输入您的 2FA 代码。
3. Discord 将显示您的新令牌。**立即复制。**

:::warning[令牌仅显示一次]
令牌仅显示一次。如果丢失，您需要重置它并生成新的。切勿公开分享您的令牌或将令牌提交到 Git — 拥有此令牌的任何人都可以完全控制您的机器人。
:::

将令牌保存在安全的地方（例如密码管理器）。您需要在步骤 8 中使用它。

## 步骤 5：生成邀请 URL

您需要 OAuth2 URL 将机器人邀请到您的服务器。有两种方式：

### 选项 A：使用安装选项卡（推荐）

:::note[需要公开机器人]
此方法需要在步骤 2 中将 **公开机器人** 设置为 **开启**。如果您将公开机器人设置为关闭，请改用下面的手动 URL 方法。
:::

1. 在左侧边栏，点击 **安装**。
2. 在 **安装上下文** 下，启用 **公会安装**。
3. 对于 **安装链接**，选择 **Discord 提供的链接**。
4. 在 **公会安装的默认安装设置** 下：
   - **范围**：选择 `bot` 和 `applications.commands`
   - **权限**：选择下面列出的权限。

### 选项 B：手动 URL

您可以使用以下格式直接构建邀请 URL：

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=274878286912
```

将 `YOUR_APP_ID` 替换为步骤 1 中的应用程序 ID。

### 所需权限

这些是机器人需要的最低权限：

- **查看频道** — 查看其有权访问的频道
- **发送消息** — 回复您的消息
- **嵌入链接** — 格式化富响应
- **附加文件** — 发送图片、音频和文件输出
- **读取消息历史** — 维护对话上下文

### 推荐的其他权限

- **在线程中发送消息** — 在线程对话中回复
- **添加反应** — 对消息添加反应以示确认

### 权限整数

| 级别 | 权限整数 | 包含内容 |
|-------|-------------------|-----------------|
| 最小 | `117760` | 查看频道、发送消息、读取消息历史、附加文件 |
| 推荐 | `274878286912` | 以上全部加上嵌入链接、在线程中发送消息、添加反应 |

## 步骤 6：邀请到您的服务器

1. 在浏览器中打开邀请 URL（从安装选项卡或您构建的手动 URL）。
2. 在 **添加到服务器** 下拉菜单中，选择您的服务器。
3. 点击 **继续**，然后 **授权**。
4. 如果出现 CAPTCHA，请完成。

:::info
您需要在 Discord 服务器上拥有 **管理服务器** 权限才能邀请机器人。如果在下拉菜单中看不到您的服务器，请让服务器管理员使用邀请链接。
:::

授权后，机器人将出现在您服务器的成员列表中（它将显示为离线，直到您启动 Hermes 网关）。

## 步骤 7：找到您的 Discord 用户 ID

Hermes Agent 使用您的 Discord 用户 ID 来控制谁可以与机器人交互。查找方法：

1. 打开 Discord（桌面或网页应用）。
2. 进入 **设置** → **高级** → 将 **开发者模式** 切换为 **开启**。
3. 关闭设置。
4. 右键单击您自己的用户名（在消息中、成员列表中或您的个人资料中）→ **复制用户 ID**。

您的用户 ID 是一个长数字，例如 `284102345871466496`。

:::tip
开发者模式还允许您以相同方式复制 **频道 ID** 和 **服务器 ID** — 右键单击频道或服务器名称并选择复制 ID。如果您想手动设置主频道，则需要频道 ID。
:::

## 步骤 8：配置 Hermes Agent

### 选项 A：交互式设置（推荐）

运行引导设置命令：

```bash
hermes gateway setup
```

出现提示时选择 **Discord**，然后在询问时粘贴您的机器人令牌和用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件：

```bash
# 必需
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_ALLOWED_USERS=284102345871466496

# 多个允许的用户（逗号分隔）
# DISCORD_ALLOWED_USERS=284102345871466496,198765432109876543
```

然后启动网关：

```bash
hermes gateway
```

机器人应在几秒钟内在 Discord 上线。向它发送一条消息 — 私信或它可以看到的频道 — 来测试。

:::tip
您可以在后台运行 `hermes gateway` 或将其作为 systemd 服务运行以实现持久操作。参见部署文档了解详情。
:::

## 配置参考

Discord 行为通过两个文件控制：用于凭证和环境级切换的 **`~/.hermes/.env`**，以及用于结构化设置的 **`~/.hermes/config.yaml`**。当两者都设置时，环境变量始终优先于 config.yaml 值。

### 环境变量（`.env`）

| 变量 | 必需 | 默认 | 描述 |
|----------|----------|---------|-------------|
| `DISCORD_BOT_TOKEN` | **是** | — | 来自 [Discord 开发者门户](https://discord.com/developers/applications) 的机器人令牌。 |
| `DISCORD_ALLOWED_USERS` | **是** | — | 允许与机器人交互的逗号分隔的 Discord 用户 ID。没有此，网关拒绝所有用户。 |
| `DISCORD_HOME_CHANNEL` | 否 | — | 机器人发送主动消息（cron 输出、提醒、通知）的频道 ID。 |
| `DISCORD_HOME_CHANNEL_NAME` | 否 | `"Home"` | 主频道在日志和状态输出中的显示名称。 |
| `DISCORD_REQUIRE_MENTION` | 否 | `true` | 当为 `true` 时，机器人在服务器频道中仅在 `@提及` 时响应。设置为 `false` 以响应每个频道中的所有消息。 |
| `DISCORD_FREE_RESPONSE_CHANNELS` | 否 | — | 逗号分隔的频道 ID，机器人在其中无需 `@提及` 即可响应，即使 `DISCORD_REQUIRE_MENTION` 为 `true`。 |
| `DISCORD_IGNORE_NO_MENTION` | 否 | `true` | 当为 `true` 时，如果消息 @提及了其他用户但**没有**提及机器人，机器人保持沉默。防止机器人在针对其他人的对话中跳入。仅适用于服务器频道，不适用于私信。 |
| `DISCORD_AUTO_THREAD` | 否 | `true` | 当为 `true` 时，在文本频道中每次 `@提及` 自动创建一个新线程，使每个对话隔离（类似于 Slack 行为）。已在线程内或私信中的消息不受影响。 |
| `DISCORD_ALLOW_BOTS` | 否 | `"none"` | 控制机器人如何处理来自其他 Discord 机器人的消息。`"none"` — 忽略所有其他机器人。`"mentions"` — 仅接受 @提及 Hermes 的机器人消息。`"all"` — 接受所有机器人消息。 |
| `DISCORD_REACTIONS` | 否 | `true` | 当为 `true` 时，机器人在处理过程中向消息添加 emoji 反应（👀 开始时，✅ 成功时，❌ 错误时）。设置为 `false` 以完全禁用反应。 |
| `DISCORD_IGNORED_CHANNELS` | 否 | — | 逗号分隔的频道 ID，机器人**绝不**响应，即使 `@提及`。优先于所有其他频道设置。 |
| `DISCORD_NO_THREAD_CHANNELS` | 否 | — | 逗号分隔的频道 ID，机器人在其中直接回复频道而不是创建线程。仅当 `DISCORD_AUTO_THREAD` 为 `true` 时相关。 |

### 配置文件（`config.yaml`）

`~/.hermes/config.yaml` 中的 `discord` 部分镜像上述环境变量。Config.yaml 设置作为默认值应用 — 如果等效的环境变量已设置，则环境变量优先。

```yaml
# Discord 特定设置
discord:
  require_mention: true           # 在服务器频道中需要 @提及
  free_response_channels: ""      # 逗号分隔的频道 ID（或 YAML 列表）
  auto_thread: true               # @提及时自动创建线程
  reactions: true                 # 在处理过程中添加 emoji 反应
  ignored_channels: []            # 机器人绝不响应的频道 ID
  no_thread_channels: []          # 不创建线程直接回复的频道 ID

# 会话隔离（适用于所有网关平台，不仅是 Discord）
group_sessions_per_user: true     # 在共享频道中为每个用户隔离会话
```

#### `discord.require_mention`

**类型：** boolean — **默认：** `true`

启用后，机器人仅在服务器频道中直接 `@提及` 时响应。无论此设置如何，私信始终获得响应。

#### `discord.free_response_channels`

**类型：** string 或 list — **默认：** `""`

机器人无需 `@提及` 即可响应所有消息的频道 ID。接受逗号分隔的字符串或 YAML 列表：

```yaml
# 字符串格式
discord:
  free_response_channels: "1234567890,9876543210"

# 列表格式
discord:
  free_response_channels:
    - 1234567890
    - 9876543210
```

如果线程的父频道在此列表中，则该线程也变得无需提及。

#### `discord.auto_thread`

**类型：** boolean — **默认：** `true`

启用后，在常规文本频道中每次 `@提及` 都会自动为对话创建一个新线程。这保持了主频道的清洁，并为每个对话提供自己隔离的会话历史。一旦创建线程，该线程中的后续消息不需要 `@提及` — 机器人知道它已经在参与了。

在现有线程或私信中发送的消息不受此设置影响。

#### `discord.reactions`

**类型：** boolean — **默认：** `true`

控制机器人是否添加 emoji 反应作为视觉反馈：
- 👀 在机器人开始处理您的消息时添加
- ✅ 在回复成功传递时添加
- ❌ 如果处理过程中发生错误则添加

如果您发现反应分散注意力或机器人的角色没有 **添加反应** 权限，请禁用。

#### `discord.ignored_channels`

**类型：** string 或 list — **默认：** `[]`

机器人**绝不**响应的频道 ID，即使直接 `@提及`。这是最高优先级 — 如果频道在此列表中，机器人静默忽略所有消息，无论 `require_mention`、`free_response_channels` 或任何其他设置如何。

```yaml
# 字符串格式
discord:
  ignored_channels: "1234567890,9876543210"

# 列表格式
discord:
  ignored_channels:
    - 1234567890
    - 9876543210
```

如果线程的父频道在此列表中，该线程中的消息也被忽略。

#### `discord.no_thread_channels`

**类型：** string 或 list — **默认：** `[]`

机器人直接回复频道而不是自动创建线程的频道 ID。这仅在 `auto_thread` 为 `true`（默认）时有效。在这些频道中，机器人像普通消息一样内联回复，而不是生成新线程。

```yaml
discord:
  no_thread_channels:
    - 1234567890  # 机器人在此处内联回复
```

对于专用机器人交互频道有用，线程会增加不必要的噪音。

#### `group_sessions_per_user`

**类型：** boolean — **默认：** `true`

这是全局网关设置（不是 Discord 特定的），控制同一频道中的用户是否获得隔离的会话历史。

当为 `true` 时：Alice 和 Bob 在 `#research` 中交谈，每个人与 Hermes 有自己独立的对话。当为 `false` 时：整个频道共享一个对话记录和一个运行代理槽。

```yaml
group_sessions_per_user: true
```

有关每种模式全部含义的详细信息，请参见上面的[会话模型](#discord-中的会话模型)部分。

#### `display.tool_progress`

**类型：** string — **默认：** `"all"` — **值：** `off`、`new`、`all`、`verbose`

控制机器人在处理过程中是否在聊天中发送进度消息（例如"正在读取文件..."、"正在运行终端命令..."）。这是适用于所有平台的全局网关设置。

```yaml
display:
  tool_progress: "all"    # off | new | all | verbose
```

- `off` — 无进度消息
- `new` — 仅显示每轮的第一个工具调用
- `all` — 显示所有工具调用（在网关消息中截断为 40 个字符）
- `verbose` — 显示完整的工具调用详情（可能产生长消息）

#### `display.tool_progress_command`

**类型：** boolean — **默认：** `false`

启用后，使 `/verbose` 斜杠命令在网关中可用，让您无需编辑 config.yaml 即可循环切换工具进度模式（`off → new → all → verbose → off`）。

```yaml
display:
  tool_progress_command: true
```

## 交互式模型选择器

在 Discord 频道中发送不带参数的 `/model` 以打开基于下拉菜单的模型选择器：

1. **Provider 选择** — 显示可用 provider（最多 25 个）的选择下拉菜单。
2. **模型选择** — 所选 provider 的模型下拉菜单（最多 25 个）。

选择器在 120 秒后超时。只有授权用户（`DISCORD_ALLOWED_USERS` 中的那些）可以与之交互。如果您知道模型名称，直接输入 `/model <name>`。

## 用于技能的本机斜杠命令

Hermes 自动将已安装的技能注册为**本机 Discord 应用程序命令**。这意味着技能出现在 Discord 的自动完成 `/` 菜单中，与内置命令一起。

- 每个技能成为一个 Discord 斜杠命令（例如 `/code-review`、`/ascii-art`）
- 技能接受可选的 `args` 字符串参数
- Discord 限制每个机器人 100 个应用程序命令 — 如果您的技能多于可用槽位，额外的技能会被跳过并带有日志警告
- 技能在机器人启动期间与内置命令（如 `/model`、`/reset` 和 `/background`）一起注册

无需额外配置 — 通过 `hermes skills install` 安装的任何技能都会在下次网关重启时自动注册为 Discord 斜杠命令。

## 主频道

您可以指定一个"主频道"，机器人发送主动消息（如 cron 作业输出、提醒和通知）。有两种方式设置：

### 使用斜杠命令

在机器人所在的任何 Discord 频道中输入 `/sethome`。该频道成为主频道。

### 手动配置

将这些添加到您的 `~/.hermes/.env`：

```bash
DISCORD_HOME_CHANNEL=123456789012345678
DISCORD_HOME_CHANNEL_NAME="#bot-updates"
```

将 ID 替换为实际频道 ID（启用开发者模式后右键单击 → 复制频道 ID）。

## 语音消息

Hermes Agent 支持 Discord 语音消息：

- **收到的语音消息** 使用配置的 STT provider 自动转录：本地 `faster-whisper`（无需密钥）、Groq Whisper（`GROQ_API_KEY`）或 OpenAI Whisper（`VOICE_TOOLS_OPENAI_KEY`）。
- **文本转语音**：使用 `/voice tts` 让机器人发送语音音频回复以及文本回复。
- **Discord 语音频道**：Hermes 还可以加入语音频道，监听用户说话，并在频道中回复。

有关完整设置和操作指南，请参见：
- [语音模式](/docs/user-guide/features/voice-mode)
- [将语音模式与 Hermes 结合使用](/docs/guides/use-voice-mode-with-hermes)

## 故障排除

### 机器人在线但不响应消息

**原因**：Message Content Intent 被禁用。

**修复**：进入 [开发者门户](https://discord.com/developers/applications) → 您的应用 → 机器人 → 特权网关 Intent → 启用 **Message Content Intent** → 保存。更改后重启网关。

### 启动时出现"Disallowed Intents"错误

**原因**：您的代码请求了未在开发者门户中启用的 Intent。

**修复**：在机器人设置中启用全部三个特权网关 Intent（Presence、Server Members、Message Content），然后重启。

### 机器人在特定频道中看不到消息

**原因**：机器人的角色无权查看该频道。

**修复**：在 Discord 中，进入频道的设置 → 权限 → 添加机器人的角色，启用 **查看频道** 和 **读取消息历史**。

### 403 Forbidden 错误

**原因**：机器人缺少所需权限。

**修复**：使用步骤 5 的正确权限 URL 重新邀请机器人，或在服务器设置 → 角色中手动调整机器人的角色权限。

### 机器人离线

**原因**：Hermes 网关未运行，或令牌不正确。

**修复**：检查 `hermes gateway` 是否正在运行。验证 `.env` 文件中的 `DISCORD_BOT_TOKEN`。如果最近重置了令牌，请更新。

### "User not allowed" / 机器人忽略您

**原因**：您的用户 ID 不在 `DISCORD_ALLOWED_USERS` 中。

**修复**：将您的用户 ID 添加到 `~/.hermes/.env` 的 `DISCORD_ALLOWED_USERS` 并重启网关。

### 同一频道中的人意外共享上下文

**原因**：`group_sessions_per_user` 被禁用，或平台无法在该上下文中提供消息的用户 ID。

**修复**：在 `~/.hermes/config.yaml` 中设置并重启网关：

```yaml
group_sessions_per_user: true
```

如果您有意希望共享房间对话，请保持关闭 — 只是期望共享的记录历史和共享的中断行为。

## 安全性

:::warning
始终设置 `DISCORD_ALLOWED_USERS` 以限制谁可以与机器人交互。没有它，网关默认拒绝所有用户作为安全措施。只添加您信任的用户 ID — 授权用户完全访问代理的能力，包括工具使用和系统访问。
:::

有关保护您的 Hermes Agent 部署的更多信息，请参见[安全指南](../security.md)。
