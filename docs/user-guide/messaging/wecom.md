---
sidebar_position: 14
title: "WeCom (企业微信)"
description: "通过 AI Bot WebSocket 网关将 Hermes Agent 连接到 WeCom"
---

# WeCom（企业微信）

将 Hermes 连接到 [WeCom](https://work.weixin.qq.com/)（企业微信），腾讯的企业消息平台。该适配器使用 WeCom 的 AI Bot WebSocket 网关进行实时双向通信——无需公共端点或 webhook。

## 前置要求

- WeCom 组织账户
- 在 WeCom 管理控制台中创建的 AI Bot
- 来自机器人凭证页面的 Bot ID 和 Secret
- Python 包：`aiohttp` 和 `httpx`

## 设置

### 1. 创建 AI Bot

1. 登录 [WeCom 管理控制台](https://work.weixin.qq.com/wework_admin/frame)
2. 导航到 **应用** → **创建应用** → **AI Bot**
3. 配置机器人名称和描述
4. 从凭证页面复制 **Bot ID** 和 **Secret**

### 2. 配置 Hermes

运行交互式设置：

```bash
hermes gateway setup
```

选择 **WeCom** 并输入您的 Bot ID 和 Secret。

或在 `~/.hermes/.env` 中设置环境变量：

```bash
WECOM_BOT_ID=your-bot-id
WECOM_SECRET=your-secret

# 可选：限制访问
WECOM_ALLOWED_USERS=user_id_1,user_id_2

# 可选：cron/通知的主频道
WECOM_HOME_CHANNEL=chat_id
```

### 3. 启动网关

```bash
hermes gateway
```

## 功能

- **WebSocket 传输** —— 持久连接，无需公共端点
- **私信和群组消息** —— 可配置的访问策略
- **每群组发送者白名单** —— 对每个群组中谁可以交互的细粒度控制
- **媒体支持** —— 图片、文件、语音、视频上传和下载
- **AES 加密媒体** —— 入站附件自动解密
- **引用上下文** —— 保留回复线程
- **Markdown 渲染** —— 富文本响应
- **回复模式流式响应** —— 将响应与入站消息上下文关联
- **自动重连** —— 连接断开时指数退避

## 配置选项

在 `config.yaml` 中的 `platforms.wecom.extra` 下设置：

| 键 | 默认 | 描述 |
|-----|---------|-------------|
| `bot_id` | — | WeCom AI Bot ID（必需） |
| `secret` | — | WeCom AI Bot Secret（必需） |
| `websocket_url` | `wss://openws.work.weixin.qq.com` | WebSocket 网关 URL |
| `dm_policy` | `open` | DM 访问：`open`、`allowlist`、`disabled`、`pairing` |
| `group_policy` | `open` | 群组访问：`open`、`allowlist`、`disabled` |
| `allow_from` | `[]` | 允许 DM 的用户 ID（当 dm_policy=allowlist 时） |
| `group_allow_from` | `[]` | 允许的群组 ID（当 group_policy=allowlist 时） |
| `groups` | `{}` | 每群组配置（见下文） |

## 访问策略

### DM 策略

控制谁可以向机器人发送直接消息：

| 值 | 行为 |
|-------|----------|
| `open` | 任何人都可以 DM 机器人（默认） |
| `allowlist` | 只有 `allow_from` 中的用户 ID 可以 DM |
| `disabled` | 所有 DM 都被忽略 |
| `pairing` | 配对模式（用于初始设置） |

```bash
WECOM_DM_POLICY=allowlist
```

### 群组策略

控制机器人响应哪些群组：

| 值 | 行为 |
|-------|----------|
| `open` | 机器人在所有群组中响应（默认） |
| `allowlist` | 机器人仅在 `group_allow_from` 中列出的群组 ID 中响应 |
| `disabled` | 所有群组消息都被忽略 |

```bash
WECOM_GROUP_POLICY=allowlist
```

### 每群组发送者白名单

为了更细粒度的控制，您可以限制允许哪些用户在特定群组中与机器人交互。这在 `config.yaml` 中配置：

```yaml
platforms:
  wecom:
    enabled: true
    extra:
      bot_id: "your-bot-id"
      secret: "your-secret"
      group_policy: "allowlist"
      group_allow_from:
        - "group_id_1"
        - "group_id_2"
      groups:
        group_id_1:
          allow_from:
            - "user_alice"
            - "user_bob"
        group_id_2:
          allow_from:
            - "user_charlie"
        "*":
          allow_from:
            - "user_admin"
```

**工作原理：**

1. `group_policy` 和 `group_allow_from` 控制决定一个群组是否被允许。
2. 如果一个群组通过了顶层检查，`groups.<group_id>.allow_from` 列表（如果存在）进一步限制了该群组中哪些发送者可以与机器人交互。
3. 通配符 `"*"` 群组条目作为未明确列出的群组的默认值。
4. 白名单条目支持 `*` 通配符以允许所有用户，且条目不区分大小写。
5. 条目可以可选地使用 `wecom:user:` 或 `wecom:group:` 前缀格式——前缀会被自动剥离。

如果未为群组配置 `allow_from`，则该群组中的所有用户都被允许（假设群组本身通过了顶层策略检查）。

## 媒体支持

### 入站（接收）

适配器从用户接收媒体附件并将其缓存到本地以供代理处理：

| 类型 | 如何处理 |
|------|-----------------|
| **图片** | 下载并缓存在本地。支持基于 URL 和 base64 编码的图片。 |
| **文件** | 下载并缓存。文件名从原始消息保留。 |
| **语音** | 如果可用，提取语音消息文本转录。 |
| **混合消息** | 解析 WeCom 混合类型消息（文本 + 图片）并提取所有组件。 |

**引用消息：** 来自引用（回复）消息的媒体也被提取，因此代理具有用户回复内容的上下文。

### AES 加密媒体解密

WeCom 使用 AES-256-CBC 对某些入站媒体附件进行加密。适配器自动处理：

- 当入站媒体项包含 `aeskey` 字段时，适配器下载加密字节并使用 PKCS#7 填充的 AES-256-CBC 解密它们。
- AES 密钥是 `aeskey` 字段的 base64 解码值（必须正好是 32 字节）。
- IV 从密钥的前 16 字节派生。
- 这需要 `cryptography` Python 包（`pip install cryptography`）。

无需配置——当收到加密媒体时，解密透明发生。

### 出站（发送）

| 方法 | 发送内容 | 大小限制 |
|--------|--------------|------------|
| `send` | Markdown 文本消息 | 4000 字符 |
| `send_image` / `send_image_file` | 原生图片消息 | 10 MB |
| `send_document` | 文件附件 | 20 MB |
| `send_voice` | 语音消息（仅原生语音支持 AMR 格式） | 2 MB |
| `send_video` | 视频消息 | 10 MB |

**分块上传：** 文件通过三步协议以 512 KB 块上传（初始化 → 块 → 完成）。适配器自动处理。

**自动降级：** 当媒体超过原生类型的大小限制但在绝对 20 MB 文件限制内时，自动作为通用文件附件发送：

- 图片 > 10 MB → 作为文件发送
- 视频 > 10 MB → 作为文件发送
- 语音 > 2 MB → 作为文件发送
- 非 AMR 音频 → 作为文件发送（WeCom 原生语音仅支持 AMR）

超过绝对 20 MB 限制的文件会被拒绝，并向聊天发送信息性消息。

## 回复模式流式响应

当机器人通过 WeCom 回调收到消息时，适配器记住入站请求 ID。如果在请求上下文仍然活动时发送响应，适配器使用 WeCom 的回复模式（`aibot_respond_msg`）与流式传输将响应直接关联到入站消息。这在 WeCom 客户端中提供了更自然的对话体验。

如果入站请求上下文已过期或不可用，适配器回退到通过 `aibot_send_msg` 主动发送消息。

回复模式也适用于媒体：上传的媒体可以作为对原始消息的回复发送。

## 连接和重连

适配器维护到 WeCom 网关 `wss://openws.work.weixin.qq.com` 的持久 WebSocket 连接。

### 连接生命周期

1. **连接：** 打开 WebSocket 连接并发送带有 bot_id 和 secret 的 `aibot_subscribe` 认证帧。
2. **心跳：** 每 30 秒发送应用程序级 ping 帧以保持连接活动。
3. **监听：** 持续读取入站帧并分派消息回调。

### 重连行为

连接丢失时，适配器使用指数退避重连：

| 尝试 | 延迟 |
|---------|-------|
| 第 1 次重试 | 2 秒 |
| 第 2 次重试 | 5 秒 |
| 第 3 次重试 | 10 秒 |
| 第 4 次重试 | 30 秒 |
| 第 5+ 次重试 | 60 秒 |

每次成功重连后，退避计数器重置为零。断开连接时所有待处理请求 future 都会失败，这样调用者不会无限期挂起。

### 去重

入站消息使用消息 ID 和 5 分钟窗口以及最多 1000 条条目的缓存进行去重。这可以防止在重连或网络抖动期间重复处理消息。

## 所有环境变量

| 变量 | 必需 | 默认 | 描述 |
|----------|----------|---------|-------------|
| `WECOM_BOT_ID` | ✅ | — | WeCom AI Bot ID |
| `WECOM_SECRET` | ✅ | — | WeCom AI Bot Secret |
| `WECOM_ALLOWED_USERS` | — | _(空)_ | 网关级白名单的逗号分隔用户 ID |
| `WECOM_HOME_CHANNEL` | — | — | cron/通知输出的聊天 ID |
| `WECOM_WEBSOCKET_URL` | — | `wss://openws.work.weixin.qq.com` | WebSocket 网关 URL |
| `WECOM_DM_POLICY` | — | `open` | DM 访问策略 |
| `WECOM_GROUP_POLICY` | — | `open` | 群组访问策略 |

## 故障排除

| 问题 | 修复 |
|---------|-----|
| `WECOM_BOT_ID and WECOM_SECRET are required` | 设置两个环境变量或在设置向导中配置 |
| `WeCom startup failed: aiohttp not installed` | 安装 aiohttp：`pip install aiohttp` |
| `WeCom startup failed: httpx not installed` | 安装 httpx：`pip install httpx` |
| `invalid secret (errcode=40013)` | 验证 secret 与您机器人的凭证匹配 |
| `Timed out waiting for subscribe acknowledgement` | 检查到 `openws.work.weixin.qq.com` 的网络连接 |
| 机器人在群组中不响应 | 检查 `group_policy` 设置并确保群组 ID 在 `group_allow_from` 中 |
| 机器人在群组中忽略某些用户 | 检查 `groups` 配置部分中的每群组 `allow_from` 列表 |
| 媒体解密失败 | 安装 `cryptography`：`pip install cryptography` |
| `cryptography is required for WeCom media decryption` | 入站媒体是 AES 加密的。安装：`pip install cryptography` |
| 语音消息作为文件发送 | WeCom 原生语音仅支持 AMR 格式。其他格式自动降级为文件。 |
| `File too large` 错误 | WeCom 对所有文件上传有 20 MB 绝对限制。压缩或分割文件。 |
| 图片作为文件发送 | 图片 > 10 MB 超过原生图片限制并自动降级为文件附件。 |
| `Timeout sending message to WeCom` | WebSocket 可能已断开。检查日志中的重连消息。 |
| `WeCom websocket closed during authentication` | 网络问题或凭证错误。验证 bot_id 和 secret。 |
