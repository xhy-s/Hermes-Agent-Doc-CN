---
sidebar_position: 1
title: "Telegram"
description: "将 Hermes Agent 设置为 Telegram 机器人"
---

# Telegram 设置

Hermes Agent 与 Telegram 集成，作为一个功能齐全的对话机器人。连接后，您可以通过任何设备与您的代理聊天，发送自动转录的语音备忘录，接收预定任务结果，并在群组中使用代理。该集成基于 [python-telegram-bot](https://python-telegram-bot.org/) 构建，支持文本、语音、图片和文件附件。

## 步骤 1：通过 BotFather 创建机器人

每个 Telegram 机器人都需要通过 [@BotFather](https://t.me/BotFather)（Telegram 官方机器人管理工具）颁发的 API 令牌。

1. 打开 Telegram 并搜索 **@BotFather**，或访问 [t.me/BotFather](https://t.me/BotFather)
2. 发送 `/newbot`
3. 选择一个**显示名称**（例如"Hermes Agent"）—— 这个可以随意设置
4. 选择一个**用户名**—— 必须唯一且以 `bot` 结尾（例如 `my_hermes_bot`）
5. BotFather 会回复您的 **API 令牌**。格式如下：

```
123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
```

:::warning
保持您的机器人令牌秘密。任何拥有此令牌的人都可以控制您的机器人。如果泄漏，立即通过 BotFather 中的 `/revoke` 撤销。
:::

## 步骤 2：自定义您的机器人（可选）

这些 BotFather 命令可以改善用户体验。向 @BotFather 发送消息并使用：

| 命令 | 用途 |
|---------|---------|
| `/setdescription` | 用户开始聊天前显示的"此机器人可以做什么？"文本 |
| `/setabouttext` | 机器人个人资料页面上的简短文本 |
| `/setuserpic` | 为您的机器人上传头像 |
| `/setcommands` | 定义命令菜单（聊天中的 `/` 按钮） |
| `/setprivacy` | 控制机器人是否查看所有群组消息（参见步骤 3） |

:::tip
对于 `/setcommands`，一个有用的起始集合：

```
help - 显示帮助信息
new - 开始新对话
sethome - 将此聊天设置为主频道
```
:::

## 步骤 3：隐私模式（群组关键设置）

Telegram 机器人有一个**隐私模式**，默认**启用**。这是使用群组机器人时最常见的混淆来源。

**隐私模式开启时**，您的机器人只能看到：
- 以 `/` 命令开头的消息
- 直接回复机器人自己消息的内容
- 服务消息（成员加入/离开、置顶消息等）
- 机器人为管理员的频道中的消息

**隐私模式关闭时**，机器人会接收群组中的每条消息。

### 如何关闭隐私模式

1. 向 **@BotFather** 发送消息
2. 发送 `/mybots`
3. 选择您的机器人
4. 进入 **Bot Settings → Group Privacy → Turn off**

:::warning
**更改隐私设置后，您必须移除并重新添加机器人到任何群组**。Telegram 会在机器人加入群组时缓存隐私状态，在机器人被移除并重新添加之前不会更新。
:::

:::tip
关闭隐私模式的替代方案：将机器人提升为**群组管理员**。管理员机器人无论隐私设置如何都会接收所有消息，这样可以避免需要切换全局隐私模式。
:::

## 步骤 4：找到您的用户 ID

Hermes Agent 使用数字 Telegram 用户 ID 来控制访问。您的用户 ID **不是**您的用户名——它是一个数字，如 `123456789`。

**方法 1（推荐）：** 向 [@userinfobot](https://t.me/userinfobot) 发送消息——它会立即回复您的用户 ID。

**方法 2：** 向 [@get_id_bot](https://t.me/get_id_bot) 发送消息——另一个可靠的选择。

保存此数字；下一步需要用到。

## 步骤 5：配置 Hermes

### 选项 A：交互式设置（推荐）

```bash
hermes gateway setup
```

出现提示时选择 **Telegram**。向导会询问您的机器人令牌和允许的用户 ID，然后为您写入配置。

### 选项 B：手动配置

添加到 `~/.hermes/.env`：

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_ALLOWED_USERS=123456789    # 多个用户用逗号分隔
```

### 启动网关

```bash
hermes gateway
```

机器人应在几秒钟内上线。在 Telegram 上向它发送消息以验证。

## Webhook 模式

默认情况下，Hermes 使用**长轮询**连接到 Telegram——网关向 Telegram 服务器发出出站请求以获取新更新。这适用于本地和常驻部署。

对于**云部署**（Fly.io、Railway、Render 等），**webhook 模式**更具成本效益。这些平台可以在入站 HTTP 流量上自动唤醒暂停的机器，但不能在出站连接上唤醒。由于轮询是出站的，轮询机器人永远不会休眠。Webhook 模式改变了方向——Telegram 将更新推送到您机器人的 HTTPS URL，实现空闲时休眠的部署。

| | 轮询（默认） | Webhook |
|---|---|---|
| 方向 | 网关 → Telegram（出站） | Telegram → 网关（入站） |
| 适用于 | 本地、常驻服务器 | 具有自动唤醒的云平台 |
| 设置 | 无需额外配置 | 设置 `TELEGRAM_WEBHOOK_URL` |
| 空闲成本 | 机器必须保持运行 | 机器可以在消息之间休眠 |

### 配置

添加到 `~/.hermes/.env`：

```bash
TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
# TELEGRAM_WEBHOOK_PORT=8443        # 可选，默认 8443
# TELEGRAM_WEBHOOK_SECRET=mysecret  # 可选，建议使用
```

| 变量 | 必需 | 描述 |
|----------|----------|-------------|
| `TELEGRAM_WEBHOOK_URL` | 是 | Telegram 发送更新的公共 HTTPS URL。URL 路径自动提取（例如从上面的示例中提取 `/telegram`）。 |
| `TELEGRAM_WEBHOOK_PORT` | 否 | Webhook 服务器监听的本地端口（默认：`8443`）。 |
| `TELEGRAM_WEBHOOK_SECRET` | 否 | 用于验证更新确实来自 Telegram 的秘密令牌。**强烈建议用于生产部署。** |

设置 `TELEGRAM_WEBHOOK_URL` 后，网关启动 HTTP webhook 服务器而不是轮询。未设置时，使用轮询模式——与以前版本行为相同。

### 云部署示例（Fly.io）

1. 将环境变量添加到您的 Fly.io 应用 secrets：

```bash
fly secrets set TELEGRAM_WEBHOOK_URL=https://my-app.fly.dev/telegram
fly secrets set TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

2. 在您的 `fly.toml` 中暴露 webhook 端口：

```toml
[[services]]
  internal_port = 8443
  protocol = "tcp"

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

3. 部署：

```bash
fly deploy
```

网关日志应显示：`[telegram] Connected to Telegram (webhook mode)`。

## 主频道

在任何 Telegram 聊天（私信或群组）中使用 `/sethome` 命令来指定它为**主频道**。预定任务（cron 作业）会将其结果投递到此频道。

您也可以在 `~/.hermes/.env` 中手动设置：

```bash
TELEGRAM_HOME_CHANNEL=-1001234567890
TELEGRAM_HOME_CHANNEL_NAME="My Notes"
```

:::tip
群组聊天 ID 是负数（例如 `-1001234567890`）。您的个人私信 ID 与您的用户 ID 相同。
:::

## 语音消息

### 传入语音（语音转文本）

您在 Telegram 上发送的语音消息由 Hermes 的已配置 STT 提供商自动转录，并作为文本注入对话中。

- `local` 在运行 Hermes 的机器上使用 `faster-whisper`——无需 API 密钥
- `groq` 使用 Groq Whisper，需要 `GROQ_API_KEY`
- `openai` 使用 OpenAI Whisper，需要 `VOICE_TOOLS_OPENAI_KEY`

### 传出语音（文本转语音）

当代理通过 TTS 生成音频时，它作为原生 Telegram **语音气泡**传递——圆形的、内联可播放的那种。

- **OpenAI 和 ElevenLabs** 原生生成 Opus——无需额外设置
- **Edge TTS**（默认免费提供商）输出 MP3，需要 **ffmpeg** 转换为 Opus：

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

没有 ffmpeg，Edge TTS 音频作为常规音频文件发送（仍可播放，但使用矩形播放器而不是语音气泡）。

在 `config.yaml` 中的 `tts.provider` 键下配置 TTS 提供商。

## 群组聊天使用

Hermes Agent 在群组聊天中工作，需要注意以下几点：

- **隐私模式**决定机器人可以看到哪些消息（参见[步骤 3](#step-3-privacy-mode-critical-for-groups)）
- `TELEGRAM_ALLOWED_USERS` 仍然适用——只有授权用户可以触发机器人，即使在群组中
- 您可以使用 `telegram.require_mention: true` 来防止机器人响应普通群组聊天
- 使用 `telegram.require_mention: true` 时，群组消息在以下情况下被接受：
  - 斜杠命令
  - 回复机器人自己的消息
  - `@机器人用户名` 提及
  - 匹配您在 `telegram.mention_patterns` 中配置的正则表达式唤醒词
- 如果 `telegram.require_mention` 未设置或为 false，Hermes 保持之前开放群组的行为，并响应它能看到的所有普通群组消息

### 群组触发配置示例

添加到 `~/.hermes/config.yaml`：

```yaml
telegram:
  require_mention: true
  mention_patterns:
    - "^\\s*chompy\\b"
```

此示例允许所有常规直接触发，以及以 `chompy` 开头的消息，即使它们不使用 `@提及`。

### 关于 `mention_patterns` 的说明

- 模式使用 Python 正则表达式
- 匹配不区分大小写
- 模式针对文本消息和媒体字幕进行检查
- 无效的正则表达式模式会被忽略，并在网关日志中发出警告，而不是让机器人崩溃
- 如果您希望模式仅在消息开头匹配，请使用 `^` 锚定它

## 私信话题（Bot API 9.4）

Telegram Bot API 9.4（2026 年 2 月）引入了**私信话题**——机器人可以在 1 对 1 DM 聊天中直接创建论坛风格的话题线程，无需超级群组。这让您可以在现有的与 Hermes 的 DM 中运行多个隔离的工作空间。

### 使用场景

如果您处理多个长期运行的项目，话题可以保持它们的上下文分离：

- **"Website" 话题** —— 处理您的生产 Web 服务
- **"Research" 话题** —— 文献综述和论文探索
- **"General" 话题** —— 杂项任务和快速问题

每个话题都有自己独立的对话会话、历史记录和上下文——完全相互隔离。

### 配置

在 `~/.hermes/config.yaml` 中的 `platforms.telegram.extra.dm_topics` 下添加话题：

```yaml
platforms:
  telegram:
    extra:
      dm_topics:
      - chat_id: 123456789        # 您的 Telegram 用户 ID
        topics:
        - name: General
          icon_color: 7322096
        - name: Website
          icon_color: 9367192
        - name: Research
          icon_color: 16766590
          skill: arxiv              # 在此话题中自动加载技能
```

**字段：**

| 字段 | 必需 | 描述 |
|-------|----------|-------------|
| `name` | 是 | 话题显示名称 |
| `icon_color` | 否 | Telegram 图标颜色代码（整数） |
| `icon_custom_emoji_id` | 否 | 话题图标的自定义表情符号 ID |
| `skill` | 否 | 在此话题中新会话时自动加载的技能 |
| `thread_id` | 否 | 创建后自动填充——不要手动设置 |

### 工作原理

1. 在网关启动时，Hermes 为每个还没有 `thread_id` 的话题调用 `createForumTopic`
2. `thread_id` 自动保存回 `config.yaml`——后续重启跳过 API 调用
3. 每个话题映射到一个隔离的会话键：`agent:main:telegram:dm:{chat_id}:{thread_id}`
4. 每个话题中的消息都有自己独立的对话历史、记忆刷新和上下文窗口

### 技能绑定

带有 `skill` 字段的话题在新会话启动时自动加载该技能。这与在对话开始时输入 `/技能名称` 效果完全相同——技能内容被注入第一条消息，后续消息在对话历史中看到它。

例如，带有 `skill: arxiv` 的话题会在其会话重置时（由于空闲超时、每日重置或手动 `/reset`）预加载 arxiv 技能。

:::tip
在配置之外创建的话题（例如通过手动调用 Telegram API）会在 `forum_topic_created` 服务消息到达时自动被发现。您也可以在网关运行时将话题添加到配置中——它们会在下一次缓存未命中时被获取。
:::

## 群组论坛话题技能绑定

启用了**话题模式**的超级群组（也称为"论坛话题"）已经为每个话题提供了会话隔离——每个 `thread_id` 映射到自己独立的对话。但您可能希望在特定群组话题中消息到达时**自动加载技能**，就像 DM 话题技能绑定的工作方式一样。

### 使用场景

具有不同工作流的团队超级群组：

- **Engineering** 话题 → 自动加载 `software-development` 技能
- **Research** 话题 → 自动加载 `arxiv` 技能
- **General** 话题 → 无技能，通用助手

### 配置

在 `~/.hermes/config.yaml` 中的 `platforms.telegram.extra.group_topics` 下添加话题绑定：

```yaml
platforms:
  telegram:
    extra:
      group_topics:
      - chat_id: -1001234567890       # 超级群组 ID
        topics:
        - name: Engineering
          thread_id: 5
          skill: software-development
        - name: Research
          thread_id: 12
          skill: arxiv
        - name: General
          thread_id: 1
          # 无技能——通用目的
```

**字段：**

| 字段 | 必需 | 描述 |
|-------|----------|-------------|
| `chat_id` | 是 | 超级群组的数字 ID（以 `-100` 开头的负数） |
| `name` | 否 | 话题的人类可读标签（仅供信息参考） |
| `thread_id` | 是 | Telegram 论坛话题 ID——可在 `t.me/c/<group_id>/<thread_id>` 链接中看到 |
| `skill` | 否 | 在此话题中新会话时自动加载的技能 |

### 工作原理

1. 当消息到达映射的群组话题时，Hermes 在 `group_topics` 配置中查找 `chat_id` 和 `thread_id`
2. 如果匹配条目有 `skill` 字段，该技能为会话自动加载——与 DM 话题技能绑定相同
3. 没有 `skill` 键的话题仅获得会话隔离（现有行为，不变）
4. 未映射的 `thread_id` 或 `chat_id` 值静默传递——无错误，无技能

### 与 DM 话题的区别

| | DM 话题 | 群组话题 |
|---|---|---|
| 配置键 | `extra.dm_topics` | `extra.group_topics` |
| 话题创建 | 如果缺少 `thread_id`，Hermes 通过 API 创建话题 | 管理员在 Telegram UI 中创建话题 |
| `thread_id` | 创建后自动填充 | 必须手动设置 |
| `icon_color` / `icon_custom_emoji_id` | 支持 | 不适用（管理员控制外观） |
| 技能绑定 | ✓ | ✓ |
| 会话隔离 | ✓ | ✓（论坛话题已内置） |

:::tip
要找到话题的 `thread_id`，请在 Telegram Web 或 Desktop 中打开话题并查看 URL：`https://t.me/c/1234567890/5`——最后一个数字（`5`）是 `thread_id`。超级群组的 `chat_id` 是以 `-100` 为前缀的群组 ID（例如群组 `1234567890` 变为 `-1001234567890`）。
:::

## 最近的 Bot API 功能

- **Bot API 9.4（2026 年 2 月）：** 私信话题——机器人可以通过 `createForumTopic` 在 1 对 1 DM 聊天中创建论坛话题。参见上方的[私信话题](#private-chat-topics-bot-api-94)。
- **隐私政策：** Telegram 现在要求机器人具有隐私政策。通过 BotFather 使用 `/setprivacy_policy` 设置一个，否则 Telegram 可能会自动生成占位符。如果您的机器人是面向公众的，这尤其重要。
- **消息流式传输：** Bot API 9.x 添加了对长响应流式传输的支持，这可以改善冗长代理回复的感知延迟。

## 交互式模型选择器

当您在 Telegram 聊天中发送不带参数的 `/model` 时，Hermes 显示一个交互式内联键盘用于切换模型：

1. **提供商选择** —— 显示每个可用提供商的按钮及模型数量（例如"OpenAI (15)"，"✓ Anthropic (12)"表示当前提供商）。
2. **模型选择** —— 带 **Prev**/**Next** 导航的分页模型列表，一个 **Back** 按钮返回提供商，以及 **Cancel**。

当前模型和提供商显示在顶部。所有导航通过在同一消息中编辑进行（不会弄乱聊天）。

:::tip
如果您知道确切模型名称，直接输入 `/model <name>` 以跳过选择器。您也可以输入 `/model <name> --global` 以跨会话保持更改。
:::

## Webhook 模式

默认情况下，Telegram 适配器通过**长轮询**连接——网关向 Telegram 服务器发出出站连接。这在任何地方都能工作，但会保持持久连接打开。

**Webhook 模式**是一种替代方案，Telegram 通过 HTTPS 将更新推送到您的服务器。这对于**无服务器和云部署**（Fly.io、Railway 等）来说是理想的，因为入站 HTTP 可以唤醒暂停的机器。

### 配置

设置 `TELEGRAM_WEBHOOK_URL` 环境变量以启用 webhook 模式：

```bash
# 必需——您的公共 HTTPS 端点
TELEGRAM_WEBHOOK_URL=https://app.fly.dev/telegram

# 可选——本地监听端口（默认：8443）
TELEGRAM_WEBHOOK_PORT=8443

# 可选——更新验证的秘密令牌（如果未设置则自动生成）
TELEGRAM_WEBHOOK_SECRET=my-secret-token
```

或在 `~/.hermes/config.yaml` 中：

```yaml
telegram:
  webhook_mode: true
```

设置 `TELEGRAM_WEBHOOK_URL` 后，网关启动在 `0.0.0.0:<port>` 上监听的 HTTP 服务器，并向 Telegram 注册 webhook URL。URL 路径从 webhook URL 中提取（默认为 `/telegram`）。

:::warning
Telegram 需要 webhook 端点上有一个**有效的 TLS 证书**。自签名证书将被拒绝。使用反向代理（nginx、Caddy）或提供 TLS 终止的平台（Fly.io、Railway、Cloudflare Tunnel）。
:::

## DNS-over-HTTPS 备用 IP

在某些受限网络中，`api.telegram.org` 可能解析为无法访问的 IP。Telegram 适配器包含一个**备用 IP**机制，在保持正确的 TLS 主机名和 SNI 的同时，透明地针对替代 IP 重试连接。

### 工作原理

1. 如果设置了 `TELEGRAM_FALLBACK_IPS`，则直接使用这些 IP。
2. 否则，适配器自动通过 DNS-over-HTTPS（DoH）查询 **Google DNS** 和 **Cloudflare DNS** 以发现 `api.telegram.org` 的替代 IP。
3. DoH 返回的与系统 DNS 结果不同的 IP 用作备用。
4. 如果 DoH 也被阻止，则使用硬编码的种子 IP（`149.154.167.220`）作为最后手段。
5. 一旦备用 IP 成功，它变得"粘性"——后续请求直接使用它而不先重试主路径。

### 配置

```bash
# 显式备用 IP（逗号分隔）
TELEGRAM_FALLBACK_IPS=149.154.167.220,149.154.167.221
```

或在 `~/.hermes/config.yaml` 中：

```yaml
platforms:
  telegram:
    extra:
      fallback_ips:
        - "149.154.167.220"
```

:::tip
您通常不需要手动配置这个。DoH 自动发现可以处理大多数受限网络场景。只有当 DoH 在您的网络上也被阻止时，才需要 `TELEGRAM_FALLBACK_IPS` 环境变量。
:::

## 消息反应

机器人可以向消息添加表情符号反应作为视觉处理反馈：

- 👀 当机器人开始处理您的消息时
- ✅ 当响应成功投递时
- ❌ 如果处理过程中发生错误

反应**默认禁用**。在 `config.yaml` 中启用：

```yaml
telegram:
  reactions: true
```

或通过环境变量：

```bash
TELEGRAM_REACTIONS=true
```

:::note
与 Discord（反应是附加的）不同，Telegram 的 Bot API 在单个调用中替换所有机器人反应。从 👀 到 ✅/❌ 的转换是原子性的——您不会同时看到两者。
:::

:::tip
如果机器人没有在群组中添加反应的权限，反应调用会静默失败，消息处理继续正常进行。
:::

## 故障排除

| 问题 | 解决方案 |
|--------|----------|
| 机器人完全不响应 | 验证 `TELEGRAM_BOT_TOKEN` 正确。检查 `hermes gateway` 日志中的错误。 |
| 机器人以"未授权"响应 | 您的用户 ID 不在 `TELEGRAM_ALLOWED_USERS` 中。使用 @userinfobot 仔细检查。 |
| 机器人在群组中忽略消息 | 可能是隐私模式开启。禁用它（步骤 3）或让机器人成为群组管理员。**更改隐私后记得移除并重新添加机器人。** |
| 语音消息未转录 | 验证 STT 可用：安装 `faster-whisper` 用于本地转录，或在 `~/.hermes/.env` 中设置 `GROQ_API_KEY` / `VOICE_TOOLS_OPENAI_KEY`。 |
| 语音回复是文件而不是气泡 | 安装 `ffmpeg`（Edge TTS Opus 转换需要）。 |
| 机器人令牌被撤销/无效 | 通过 BotFather 中的 `/revoke` 然后 `/newbot` 或 `/token` 生成新令牌。更新您的 `.env` 文件。 |
| Webhook 未收到更新 | 验证 `TELEGRAM_WEBHOOK_URL` 可公开访问（用 `curl` 测试）。确保您的平台/反向代理将来自 URL 端口的入站 HTTPS 流量路由到 `TELEGRAM_WEBHOOK_PORT` 配置的本地监听端口（它们不必是相同的数字）。确保 SSL/TLS 处于活动状态——Telegram 仅发送到 HTTPS URL。检查防火墙规则。 |

## 执行审批

当代理尝试运行潜在危险命令时，它会在聊天中向您请求审批：

> ⚠️ 此命令潜在危险（递归删除）。回复"yes"以批准。

回复"yes"/"y"以批准或"no"/"n"以拒绝。

## 安全

:::warning
始终设置 `TELEGRAM_ALLOWED_USERS` 以限制谁可以与您的机器人交互。没有它，网关作为安全措施默认拒绝所有用户。
:::

切勿公开分享您的机器人令牌。如果泄露，立即通过 BotFather 的 `/revoke` 命令撤销。

更多详情，请参阅[安全文档](/docs/user-guide/security)。您也可以使用 [DM 配对](/docs/user-guide/messaging#dm-pairing-alternative-to-allowlists) 来获得更动态的用户授权方法。
