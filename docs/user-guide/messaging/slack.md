---
sidebar_position: 4
title: "Slack"
description: "使用 Socket Mode 将 Hermes Agent 设置为 Slack 机器人"
---

# Slack 设置

使用 Socket Mode 将 Hermes Agent 连接到 Slack。Socket Mode 使用 WebSocket 而不是公共 HTTP 端点，因此您的 Hermes 实例不需要公开访问——它在防火墙后面、您的笔记本电脑上或私有服务器上都能工作。

:::warning 经典 Slack 应用已弃用
经典 Slack 应用（使用 RTM API）于 **2025 年 3 月完全弃用**。Hermes 使用现代 Bolt SDK 和 Socket Mode。如果您有旧版经典应用，必须按照以下步骤创建一个新的。
:::

## 概览

| 组件 | 值 |
|-----------|-------|
| **库** | `slack-bolt` / `slack_sdk` for Python（Socket Mode） |
| **连接** | WebSocket — 无需公共 URL |
| **所需 auth 令牌** | Bot Token（`xoxb-`）+ App-Level Token（`xapp-`） |
| **用户标识** | Slack Member ID（例如 `U01ABC2DEF3`） |

---

## 步骤 1：创建 Slack 应用

1. 进入 [https://api.slack.com/apps](https://api.slack.com/apps)
2. 点击 **创建新应用**
3. 选择**从头开始**
4. 输入应用名称（例如"Hermes Agent"）并选择您的工作区
5. 点击**创建应用**

您将进入应用的**基本信息**页面。

---

## 步骤 2：配置 Bot Token 范围

在侧边栏中导航到 **功能 → OAuth & Permissions**。向下滚动到 **Scopes → Bot Token Scopes** 并添加以下内容：

| 范围 | 用途 |
|-------|---------|
| `chat:write` | 以机器人身份发送消息 |
| `app_mentions:read` | 检测何时在频道中被 @提及 |
| `channels:history` | 读取机器人所在的公开频道中的消息 |
| `channels:read` | 列出和获取公开频道的信息 |
| `groups:history` | 读取机器人被邀请的私有频道中的消息 |
| `im:history` | 读取直接消息历史 |
| `im:read` | 查看基本私信信息 |
| `im:write` | 打开和管理私信 |
| `users:read` | 查找用户信息 |
| `files:write` | 上传文件（图片、音频、文档） |

:::caution 缺少范围 = 缺少功能
没有 `channels:history` 和 `groups:history`，机器人**将不会在频道中接收消息**——它仅在私信中工作。这些是最常被遗漏的范围。
:::

**可选范围：**

| 范围 | 用途 |
|-------|---------|
| `groups:read` | 列出和获取私有频道的信息 |

---

## 步骤 3：启用 Socket Mode

Socket Mode 让机器人通过 WebSocket 连接，而不是需要公共 URL。

1. 在侧边栏中，进入 **设置 → Socket Mode**
2. 将 **Enable Socket Mode** 切换为 **开启**
3. 系统会提示您创建一个 **App-Level Token**：
   - 为其命名如 `hermes-socket`（名称无关紧要）
   - 添加 **`connections:write`** 范围
   - 点击**生成**
4. **复制令牌** — 它以 `xapp-` 开头。这是您的 `SLACK_APP_TOKEN`

:::tip
您可以随时在 **设置 → 基本信息 → App-Level Tokens** 下找到或重新生成应用级令牌。
:::

---

## 步骤 4：订阅事件

此步骤至关重要——它控制机器人可以看到哪些消息。

1. 在侧边栏中，进入 **功能 → Event Subscriptions**
2. 将 **Enable Events** 切换为 **开启**
3. 展开 **Subscribe to bot events** 并添加：

| 事件 | 必需？ | 用途 |
|-------|-----------|---------|
| `message.im` | **是** | 机器人接收直接消息 |
| `message.channels` | **是** | 机器人在其所在的**公开**频道中接收消息 |
| `message.groups` | **推荐** | 机器人在其被邀请的**私有**频道中接收消息 |
| `app_mention` | **是** | 当机器人在被 @提及 时防止 Bolt SDK 错误 |

4. 点击页面底部的 **保存更改**

:::danger 缺少事件订阅是 #1 设置问题
如果机器人在私信中工作但在**频道中不工作**，您几乎肯定忘记添加 `message.channels`（对于公开频道）和/或 `message.groups`（对于私有频道）。
没有这些事件，Slack 根本不会将频道消息传递给机器人。
:::

---

## 步骤 5：启用消息标签

此步骤启用对机器人的直接消息。如果没有它，用户在尝试向机器人发送私信时会看到 **"向此应用发送消息已被关闭"**。

1. 在侧边栏中，进入 **功能 → App Home**
2. 向下滚动到 **显示标签**
3. 将**消息标签**切换为 **开启**
4. 勾选**允许用户从消息标签发送斜杠命令和消息**

:::danger 没有此步骤，私信完全被阻止
即使所有正确的范围和事件订阅都到位，除非消息标签被启用，Slack 也不允许用户向机器人发送直接消息。这是 Slack 平台要求，不是 Hermes 配置问题。
:::

---

## 步骤 6：将应用安装到工作区

1. 在侧边栏中，进入 **设置 → 安装应用**
2. 点击**安装到工作区**
3. 审查权限并点击**允许**
4. 授权后，您将看到以 `xoxb-` 开头的**Bot User OAuth Token**
5. **复制此令牌** — 这是您的 `SLACK_BOT_TOKEN`

:::tip
如果您稍后更改范围或事件订阅，您**必须重新安装应用**才能使更改生效。安装应用页面将显示一条横幅提示您这样做。
:::

---

## 步骤 7：查找用户 ID 以加入白名单

Hermes 使用 Slack **Member ID**（而不是用户名或显示名称）进行白名单。

查找 Member ID：

1. 在 Slack 中，点击用户的姓名或头像
2. 点击**查看完整个人资料**
3. 点击 **⋮**（更多）按钮
4. 选择**复制 member ID**

Member ID 类似 `U01ABC2DEF3`。您至少需要您自己的 Member ID。

---

## 步骤 8：配置 Hermes

将以下内容添加到您的 `~/.hermes/.env` 文件：

```bash
# 必需
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_APP_TOKEN=xapp-your-app-token-here
SLACK_ALLOWED_USERS=U01ABC2DEF3              # 逗号分隔的 Member ID

# 可选
SLACK_HOME_CHANNEL=C01234567890              # cron/定时消息的默认频道
SLACK_HOME_CHANNEL_NAME=general              # 主频道的人类可读名称（可选）
```

或运行交互式设置：

```bash
hermes gateway setup    # 出现提示时选择 Slack
```

然后启动网关：

```bash
hermes gateway              # 前台
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅 Linux：启动时系统服务
```

---

## 步骤 9：将机器人邀请到频道

启动网关后，您需要将机器人**邀请**到您希望它响应的任何频道：

```
/invite @Hermes Agent
```

机器人不会自动加入频道。您必须单独邀请它到每个频道。

---

## 机器人如何回复

了解 Hermes 在不同上下文中的行为：

| 上下文 | 行为 |
|---------|----------|
| **私信** | 机器人回复每条消息 — 无需 @提及 |
| **频道** | 机器人**仅在被 @提及 时回复**（例如 `@Hermes Agent 现在几点了？`）。在频道中，Hermes 在该消息的线程中回复。 |
| **线程** | 如果您在现有线程中 @提及 Hermes，它会在同一线程中回复。一旦机器人在线程中有了活动会话，该线程中的**后续回复不需要 @提及**——机器人自然地跟随对话。 |

:::tip
在频道中，始终 @提及 机器人以开始对话。一旦机器人在线程中处于活动状态，您可以不带提及地回复该线程。在线程之外，没有 @提及 的消息会被忽略，以防止繁忙频道中的噪音。
:::

---

## 配置选项

除了步骤 8 中的必需环境变量外，您还可以通过 `~/.hermes/config.yaml` 自定义 Slack 机器人行为。

### 线程和回复行为

```yaml
platforms:
  slack:
    # 控制多部分回复如何线程化
    # "off"   — 从不将回复线程化到原始消息
    # "first" — 第一个块线程化到用户消息（默认）
    # "all"   — 所有块线程化到用户消息
    reply_to_mode: "first"

    extra:
      # 是否在线程中回复（默认：true）。
      # 当为 false 时，频道消息直接回复到频道而不是线程。
      # 现有线程内的消息仍在线程中回复。
      reply_in_thread: true

      # 还将线程回复发布到主频道
      #（Slack 的"也发送到频道"功能）。
      # 只有第一个回复的第一个块被广播。
      reply_broadcast: false
```

| 键 | 默认 | 描述 |
|-----|---------|-------------|
| `platforms.slack.reply_to_mode` | `"first"` | 多部分消息的线程化模式：`"off"`、`"first"` 或 `"all"` |
| `platforms.slack.extra.reply_in_thread` | `true` | 当为 `false` 时，频道消息直接回复而不是线程化。现有线程内的消息仍在线程中回复。 |
| `platforms.slack.extra.reply_broadcast` | `false` | 当为 `true` 时，线程回复也发布到主频道。只有第一个块被广播。 |

### 会话隔离

```yaml
# 全局设置 — 适用于 Slack 和所有其他平台
group_sessions_per_user: true
```

当为 `true`（默认）时，共享频道中的每个用户获得自己隔离的对话会话。在 `#general` 中与 Hermes 聊天的两个人将有单独的历史和上下文。

如果您想要协作模式（整个频道共享一个对话会话），请设置为 `false`。请注意，这意味着用户共享上下文增长和令牌费用，一个用户的 `/reset` 会清除每个人的会话。

### 提及和触发行为

```yaml
slack:
  # 在频道中需要 @提及（这是默认行为；
  # Slack 适配器无论如何都在频道中强制执行 @提及门控，
  # 但您可以将其明确设置以与其他平台保持一致）
  require_mention: true

  # 触发机器人的自定义提及模式
  #（除了默认的 @提及 检测之外）
  mention_patterns:
    - "hey hermes"
    - "hermes,"

  # 每个出站消息前面添加的文本
  reply_prefix: ""
```

:::info
与 Discord 和 Telegram 不同，Slack 没有 `free_response_channels` 等效项。Slack 适配器在频道中启动对话需要 `@提及`。但是，一旦机器人在线程中有了活动会话，该线程中的后续回复不需要提及。在私信中，机器人始终无需提及即可回复。
:::

### 未授权用户处理

```yaml
slack:
  # 当未授权用户（不在 SLACK_ALLOWED_USERS 中）向机器人发送私信时会发生什么
  # "pair"   — 提示他们输入配对码（默认）
  # "ignore" — 静默丢弃消息
  unauthorized_dm_behavior: "pair"
```

您也可以全局设置此设置以适用于所有平台：

```yaml
unauthorized_dm_behavior: "pair"
```

`slack:` 下的平台特定设置优先于全局设置。

### 语音转录

```yaml
# 全局设置 — 启用/禁用传入语音消息的自动转录
stt_enabled: true
```

当为 `true`（默认）时，传入音频消息在使用配置的 STT provider 转录后由代理处理。

### 完整示例

```yaml
# 全局网关设置
group_sessions_per_user: true
unauthorized_dm_behavior: "pair"
stt_enabled: true

# Slack 特定设置
slack:
  require_mention: true
  unauthorized_dm_behavior: "pair"

# 平台配置
platforms:
  slack:
    reply_to_mode: "first"
    extra:
      reply_in_thread: true
      reply_broadcast: false
```

---

## 主频道

设置 `SLACK_HOME_CHANNEL` 为频道 ID，Hermes 将在其中投递定时消息、cron 作业结果和其他主动通知。查找频道 ID：

1. 在 Slack 中右键单击频道名称
2. 点击**查看频道详情**
3. 向下滚动 — 频道 ID 显示在那里

```bash
SLACK_HOME_CHANNEL=C01234567890
```

确保机器人已被**邀请到频道**（`/invite @Hermes Agent`）。

---

## 多工作区支持

Hermes 可以同时连接**多个 Slack 工作区**，使用单个网关实例。每个工作区使用自己的机器人用户 ID 独立认证。

### 配置

将多个机器人令牌作为**逗号分隔列表**提供：

```bash
# 多个机器人令牌 — 每个工作区一个
SLACK_BOT_TOKEN=xoxb-workspace1-token,xoxb-workspace2-token,xoxb-workspace3-token

# 单个应用级令牌仍用于 Socket Mode
SLACK_APP_TOKEN=xapp-your-app-token
```

或在 `~/.hermes/config.yaml` 中：

```yaml
platforms:
  slack:
    token: "xoxb-workspace1-token,xoxb-workspace2-token"
```

### OAuth 令牌文件

除了环境或配置中的令牌，Hermes 还可以从 **OAuth 令牌文件** 加载令牌：

```
~/.hermes/slack_tokens.json
```

此文件是一个将团队 ID 映射到令牌条目的 JSON 对象：

```json
{
  "T01ABC2DEF3": {
    "token": "xoxb-workspace-token-here",
    "team_name": "My Workspace"
  }
}
```

此文件的令牌与通过 `SLACK_BOT_TOKEN` 指定的令牌合并。重复令牌自动去重。

### 工作原理

- **第一个令牌**是主令牌，用于 Socket Mode 连接（AsyncApp）。
- 每个令牌在启动时通过 `auth.test` 进行认证。网关将每个 `team_id` 映射到其自己的 `WebClient` 和 `bot_user_id`。
- 当消息到达时，Hermes 使用正确的工作区特定客户端回复。
- 主 `bot_user_id`（来自第一个令牌）用于与期望单一机器人身份的功能向后兼容。

---

## 语音消息

Hermes 支持 Slack 语音：

- **入站：** 语音/音频消息使用配置的 STT provider 自动转录：本地 `faster-whisper`、Groq Whisper（`GROQ_API_KEY`）或 OpenAI Whisper（`VOICE_TOOLS_OPENAI_KEY`）
- **出站：** TTS 响应作为音频文件附件发送

---

## 故障排除

| 问题 | 解决方案 |
|--------|----------|
| 机器人在私信中不回复 | 验证 `message.im` 在您的事件订阅中并且应用已重新安装 |
| 机器人在私信中工作但在频道中不工作 | **最常见问题。** 将 `message.channels` 和 `message.groups` 添加到事件订阅，重新安装应用，并使用 `/invite @Hermes Agent` 将机器人邀请到频道 |
| 机器人在频道中不回复 @提及 | 1) 检查 `message.channels` 事件已订阅。2) 机器人必须被邀请到频道。3) 确保添加了 `channels:history` 范围。4) 在范围/事件更改后重新安装应用 |
| 机器人在私有频道中忽略消息 | 添加 `message.groups` 事件订阅和 `groups:history` 范围，然后重新安装应用并 `/invite` 机器人 |
| 私信中显示"向此应用发送消息已被关闭" | 在 App Home 设置中启用**消息标签**（参见步骤 5） |
| "not_auth_​" 或 "invalid_auth" 错误 | 重新生成您的 Bot Token 和 App Token，更新 `.env` |
| 机器人回复但无法在频道中发布 | 使用 `/invite @Hermes Agent` 将机器人邀请到频道 |
| "missing_scope" 错误 | 在 OAuth & Permissions 中添加所需范围，然后**重新安装**应用 |
| Socket 频繁断开 | 检查您的网络；Bolt 自动重连，但不稳定连接会导致延迟 |
| 更改了范围/事件但没有更改 | 在任何范围或事件订阅更改后，您**必须重新安装**应用到您的工作区 |

### 快速检查清单

如果机器人在频道中不工作，请验证**所有**以下内容：

1. ✅ `message.channels` 事件已订阅（对于公开频道）
2. ✅ `message.groups` 事件已订阅（对于私有频道）
3. ✅ `app_mention` 事件已订阅
4. ✅ `channels:history` 范围已添加（对于公开频道）
5. ✅ `groups:history` 范围已添加（对于私有频道）
6. ✅ 在添加范围/事件后**重新安装**了应用
7. ✅ 机器人被**邀请**到频道（`/invite @Hermes Agent`）
8. ✅ 您在消息中 **@提及**了机器人

---

## 安全性

:::warning
**始终使用授权用户的 Member ID 设置 `SLACK_ALLOWED_USERS`**。没有此设置，网关将作为安全措施**默认拒绝所有消息**。切勿分享您的机器人令牌——像密码一样对待它们。
:::

- 令牌应存储在 `~/.hermes/.env` 中（文件权限 `600`）
- 定期通过 Slack 应用设置轮换令牌
- 审计谁有权限访问您的 Hermes 配置目录
- Socket Mode 意味着没有公开的端点暴露——减少一个攻击面
