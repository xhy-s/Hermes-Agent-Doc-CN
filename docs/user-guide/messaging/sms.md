---
sidebar_position: 8
sidebar_label: "SMS (Twilio)"
title: "SMS (Twilio)"
description: "通过 Twilio 将 Hermes Agent 设置为 SMS 聊天机器人"
---

# SMS 设置（Twilio）

Hermes 通过 [Twilio](https://www.twilio.com/) API 连接到 SMS。人们向您的 Twilio 电话号码发送短信，会获得 AI 回复——与 Telegram 或 Discord 相同的对话体验，但通过标准文本消息。

:::info 共享凭证
SMS 网关与可选的[电话技能](/docs/reference/skills-catalog)共享凭证。如果您已经为语音通话或一次性 SMS 设置了 Twilio，网关使用相同的 `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_PHONE_NUMBER`。
:::

---

## 前置要求

- **Twilio 账户** — [在 twilio.com 注册](https://www.twilio.com/try-twilio)（有免费试用）
- **具有 SMS 功能的 Twilio 电话号码**
- **可公开访问的服务器** — 当 SMS 到达时，Twilio 向您的服务器发送 webhook
- **aiohttp** — `pip install 'hermes-agent[sms]'`

---

## 步骤 1：获取您的 Twilio 凭证

1. 进入 [Twilio Console](https://console.twilio.com/)
2. 从仪表板复制您的 **Account SID** 和 **Auth Token**
3. 进入 **Phone Numbers → Manage → Active Numbers** — 注意您的电话号码，格式为 E.164（例如 `+15551234567`）

---

## 步骤 2：配置 Hermes

### 交互式设置（推荐）

```bash
hermes gateway setup
```

从平台列表中选择 **SMS (Twilio)**。向导将提示您输入凭证。

### 手动设置

添加到 `~/.hermes/.env`：

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567

# 安全：限制为特定电话号码（推荐）
SMS_ALLOWED_USERS=+15559876543,+15551112222

# 可选：设置 cron 作业投递的主频道
SMS_HOME_CHANNEL=+15559876543
```

---

## 步骤 3：配置 Twilio Webhook

Twilio 需要知道何时将收到消息发送到哪里。在 [Twilio Console](https://console.twilio.com/) 中：

1. 进入 **Phone Numbers → Manage → Active Numbers**
2. 点击您的电话号码
3. 在 **Messaging → A MESSAGE COMES IN** 下，设置：
   - **Webhook**：`https://your-server:8080/webhooks/twilio`
   - **HTTP Method**：POST

:::tip 暴露您的 Webhook
如果您在本地运行 Hermes，请使用隧道来暴露 webhook：

```bash
# 使用 cloudflared
cloudflared tunnel --url http://localhost:8080

# 使用 ngrok
ngrok http 8080
```

将生成的公共 URL 设置为您的 Twilio webhook。
:::

Webhook 端口默认为 `8080`。使用以下命令覆盖：

```bash
SMS_WEBHOOK_PORT=3000
```

---

## 步骤 4：启动网关

```bash
hermes gateway
```

您应该看到：

```
[sms] Twilio webhook server listening on port 8080, from: +1555***4567
```

向您的 Twilio 号码发送短信 — Hermes 将通过 SMS 回复。

---

## 环境变量

| 变量 | 必需 | 描述 |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | 是 | Twilio Account SID（以 `AC` 开头） |
| `TWILIO_AUTH_TOKEN` | 是 | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | 是 | 您的 Twilio 电话号码（E.164 格式） |
| `SMS_WEBHOOK_PORT` | 否 | Webhook 监听端口（默认：`8080`） |
| `SMS_ALLOWED_USERS` | 否 | 允许聊天的逗号分隔的 E.164 电话号码 |
| `SMS_ALLOW_ALL_USERS` | 否 | 设置为 `true` 以允许任何人（不推荐） |
| `SMS_HOME_CHANNEL` | 否 | cron 作业/通知投递的电话号码 |
| `SMS_HOME_CHANNEL_NAME` | 否 | 主频道的显示名称（默认：`Home`） |

---

## SMS 特定行为

- **仅纯文本** — Markdown 自动剥离，因为 SMS 将其呈现为字面字符
- **1600 字符限制** — 更长的响应在自然边界（换行，然后是空格）处分割到多条消息
- **回声防止** — 来自您自己的 Twilio 号码的消息被忽略以防止循环
- **电话号码编辑** — 电话号码在日志中被编辑以保护隐私

---

## 安全性

**网关默认拒绝所有用户。** 配置白名单：

```bash
# 推荐：限制为特定电话号码
SMS_ALLOWED_USERS=+15559876543,+15551112222

# 或允许所有人（不推荐用于具有终端访问权限的机器人）
SMS_ALLOW_ALL_USERS=true
```

:::warning
SMS 没有内置加密。除非您了解安全含义，否则不要将 SMS 用于敏感操作。对于敏感用例，请优先使用 Signal 或 Telegram。
:::

---

## 故障排除

### 消息未到达

1. 检查您的 Twilio webhook URL 正确且可公开访问
2. 验证 `TWILIO_ACCOUNT_SID` 和 `TWILIO_AUTH_TOKEN` 正确
3. 检查 Twilio Console → **Monitor → Logs → Messaging** 以获取投递错误
4. 确保您的电话号码在 `SMS_ALLOWED_USERS` 中（或 `SMS_ALLOW_ALL_USERS=true`）

### 回复未发送

1. 检查 `TWILIO_PHONE_NUMBER` 设置正确（带 `+` 的 E.164 格式）
2. 验证您的 Twilio 账户有 SMS 功能的号码
3. 检查 Hermes 网关日志中的 Twilio API 错误

### Webhook 端口冲突

如果端口 8080 已被使用，请更改：

```bash
SMS_WEBHOOK_PORT=3001
```

更新 Twilio Console 中的 webhook URL 以匹配。
