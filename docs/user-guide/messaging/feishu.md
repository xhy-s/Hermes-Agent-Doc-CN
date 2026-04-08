---
sidebar_position: 11
title: "飞书 / Lark"
description: "将 Hermes Agent 设置为飞书或 Lark 机器人"
---

# 飞书 / Lark 设置

Hermes Agent 与飞书和 Lark 集成作为一个全功能机器人。连接后，您可以在直接消息或群聊中与代理聊天，在主聊天中接收定时任务结果，并通过正常的网关流程发送文本、图片、音频和文件附件。

该集成支持两种连接模式：

- `websocket`——推荐；Hermes 打开出站连接，您不需要公共 Webhook 端点
- `webhook`——当您希望飞书/Lark 通过 HTTP 将事件推送到您的网关时有用

## Hermes 的行为

| 场景 | 行为 |
|---------|----------|
| 直接消息 | Hermes 每条消息都会回复。 |
| 群聊 | Hermes 仅在聊天中被 @提及 时回复。 |
| 多人共享群聊 | 默认情况下，会话历史在共享聊天中按用户隔离。 |

此共享聊天行为通过 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

只有当您明确希望每个聊天共享一个对话时，才将其设置为 `false`。

## 步骤 1：创建飞书 / Lark 应用

1. 打开飞书或 Lark 开发者控制台：
   - 飞书：[https://open.feishu.cn/](https://open.feishu.cn/)
   - Lark：[https://open.larksuite.com/](https://open.larksuite.com/)
2. 创建新应用。
3. 在**凭证与基础信息**中，复制**应用 ID**和**应用密钥**。
4. 为应用启用**机器人**能力。

:::warning
保持应用密钥私密。拥有它的人可以冒充您的应用。
:::

## 步骤 2：选择连接模式

### 推荐：WebSocket 模式

当 Hermes 在您的笔记本电脑、工作站或私有服务器上运行时，使用 WebSocket 模式。无需公共 URL。官方 Lark SDK 打开并维护与自动重连的持久出站 WebSocket 连接。

```bash
FEISHU_CONNECTION_MODE=websocket
```

**要求：** 必须安装 `websockets` Python 包。SDK 在内部处理连接生命周期、心跳和自动重连。

**工作原理：** 适配器在后台执行线程中运行 Lark SDK 的 WebSocket 客户端。入站事件（消息、反应、卡片操作）被分派到主 asyncio 循环。断开连接时，SDK 会自动尝试重连。

### 可选：Webhook 模式

仅当您已经在可访问的 HTTP 端点后面运行 Hermes 时，才使用 Webhook 模式。

```bash
FEISHU_CONNECTION_MODE=webhook
```

在 Webhook 模式下，Hermes 启动一个 HTTP 服务器（通过 `aiohttp`）并在以下地址提供飞书端点：

```text
/feishu/webhook
```

**要求：** 必须安装 `aiohttp` Python 包。

您可以自定义 Webhook 服务器绑定地址和路径：

```bash
FEISHU_WEBHOOK_HOST=127.0.0.1   # 默认值：127.0.0.1
FEISHU_WEBHOOK_PORT=8765         # 默认值：8765
FEISHU_WEBHOOK_PATH=/feishu/webhook  # 默认值：/feishu/webhook
```

当飞书发送 URL 验证挑战（`type: url_verification`）时，Webhook 会自动响应，以便您可以在飞书开发者控制台中完成订阅设置。

## 步骤 3：配置 Hermes

### 选项 A：交互式设置

```bash
hermes gateway setup
```

选择**飞书 / Lark** 并填写提示。

### 选项 B：手动配置

将以下内容添加到 `~/.hermes/.env`：

```bash
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=secret_xxx
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket

# 可选但强烈推荐
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
FEISHU_HOME_CHANNEL=oc_xxx
```

`FEISHU_DOMAIN` 接受：

- `feishu` 适用于飞书中国
- `lark` 适用于 Lark 国际版

## 步骤 4：启动网关

```bash
hermes gateway
```

然后从飞书/Lark 向机器人发送消息以确认连接已激活。

## 主聊天

在飞书/Lark 聊天中使用 `/set-home` 将其标记为定时任务结果和跨平台通知的主频道。

您也可以预先配置它：

```bash
FEISHU_HOME_CHANNEL=oc_xxx
```

## 安全

### 用户白名单

对于生产环境，请设置飞书 Open ID 的白名单：

```bash
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
```

如果您将白名单留空，任何能接触到机器人的人都可能可以使用它。在群聊中，白名单会在消息处理前对照发送者的 open_id 进行检查。

### Webhook 加密密钥

在 Webhook 模式下运行时，设置加密密钥以启用入站 Webhook 有效载荷的签名验证：

```bash
FEISHU_ENCRYPT_KEY=your-encrypt-key
```

此密钥可在飞书应用配置的**事件订阅**部分找到。设置后，适配器使用以下签名算法验证每个 Webhook 请求：

```
SHA256(timestamp + nonce + encrypt_key + body)
```

计算出的哈希与 `x-lark-signature` 头使用时间安全比较进行比对。签名无效或缺失的请求会收到 HTTP 401 拒绝。

:::tip
在 WebSocket 模式下，签名验证由 SDK 本身处理，因此 `FEISHU_ENCRYPT_KEY` 是可选的。在 Webhook 模式下，强烈建议用于生产环境。
:::

### 验证令牌

检查 Webhook 有效载荷内部 `token` 字段的额外身份验证层：

```bash
FEISHU_VERIFICATION_TOKEN=your-verification-token
```

此令牌也可在飞书应用的**事件订阅**部分找到。设置后，每个入站 Webhook 有效载荷的 `header` 对象中必须包含匹配的 `token`。不匹配的令牌会收到 HTTP 401 拒绝。

`FEISHU_ENCRYPT_KEY` 和 `FEISHU_VERIFICATION_TOKEN` 可同时使用以实现深度防御。

## 群消息策略

`FEISHU_GROUP_POLICY` 环境变量控制 Hermes 是否及如何在群聊中回复：

```bash
FEISHU_GROUP_POLICY=allowlist   # 默认值
```

| 值 | 行为 |
|-------|----------|
| `open` | Hermes 在任何群中对任何用户的 @提及 都回复。 |
| `allowlist` | Hermes 仅对 `FEISHU_ALLOWED_USERS` 中列出用户的 @提及 回复。 |
| `disabled` | Hermes 完全忽略所有群消息。 |

在所有模式下，机器人必须被明确 @提及（或 @all）后才会处理消息。直接消息绕过此关卡。

### @提及关卡的机器人身份

为了在群中进行精确的 @提及 检测，适配器需要知道机器人的身份。可以明确提供：

```bash
FEISHU_BOT_OPEN_ID=ou_xxx
FEISHU_BOT_USER_ID=xxx
FEISHU_BOT_NAME=MyBot
```

如果这些都未设置，适配器将尝试在启动时通过应用信息 API 自动发现机器人名称。要使其工作，请授予 `admin:app.info:readonly` 或 `application:application:self_manage` 权限范围。

## 交互式卡片操作

当用户点击按钮或与机器人发送的交互式卡片交互时，适配器将这些作为合成的 `/card` 命令事件路由：

- 按钮点击变为：`/card button {"key": "value", ...}`
- 卡片定义中的操作的 `value` 有效载荷作为 JSON 包含。
- 卡片操作使用 15 分钟窗口进行去重，以防止重复处理。

卡片操作事件以 `MessageType.COMMAND` 分派，因此它们通过正常的命令处理管道。

要使用此功能，请在飞书应用的事件订阅中启用**交互式卡片**事件（`card.action.trigger`）。

## 媒体支持

### 入站（接收）

适配器从用户接收并缓存以下媒体类型：

| 类型 | 扩展名 | 处理方式 |
|------|-----------|-------------------|
| **图片** | .jpg, .jpeg, .png, .gif, .webp, .bmp | 通过飞书 API 下载并缓存在本地 |
| **音频** | .ogg, .mp3, .wav, .m4a, .aac, .flac, .opus, .webm | 下载并缓存；小的文本文件会自动提取 |
| **视频** | .mp4, .mov, .avi, .mkv, .webm, .m4v, .3gp | 作为文档下载并缓存 |
| **文件** | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx 等 | 作为文档下载并缓存 |

富文本（帖子）消息中的媒体（包括内联图片和文件附件）也会被提取和缓存。

对于小的基于文本的文档（.txt, .md），文件内容会自动注入到消息文本中，以便代理直接读取而无需工具。

### 出站（发送）

| 方法 | 发送内容 |
|--------|--------------|
| `send` | 文本或富帖子消息（基于 markdown 内容自动检测） |
| `send_image` / `send_image_file` | 上传图片到飞书，然后作为原生图片气泡发送（带可选标题） |
| `send_document` | 上传文件到飞书 API，然后作为文件附件发送 |
| `send_voice` | 上传音频文件作为飞书文件附件 |
| `send_video` | 上传视频并作为原生媒体消息发送 |
| `send_animation` | GIF 降级为文件附件（飞书没有原生 GIF 气泡） |

文件上传路由基于扩展名自动选择：

- `.ogg`, `.opus` → 作为 `opus` 音频上传
- `.mp4`, `.mov`, `.avi`, `.m4v` → 作为 `mp4` 媒体上传
- `.pdf`, `.doc(x)`, `.xls(x)`, `.ppt(x)` → 使用其文档类型上传
- 其他所有内容 → 作为通用流文件上传

## Markdown 渲染和帖子回退

当出站文本包含 markdown 格式（标题、粗体、列表、代码块、链接等）时，适配器自动将其作为飞书**帖子**消息发送，并嵌入 `md` 标签而非纯文本。这可以在飞书客户端中实现富文本渲染。

如果飞书 API 拒绝帖子有效载荷（例如由于不支持的 markdown 结构），适配器会自动回退到剥离 markdown 后作为纯文本发送。这种两级回退确保消息始终被投递。

纯文本消息（未检测到 markdown）以简单的 `text` 消息类型发送。

## ACK 表情反应

当适配器收到入站消息时，它会立即添加一个 ✅（OK）表情反应，以表示消息已被接收并正在处理。这在代理完成响应前提供视觉反馈。

该反应是持久性的——它在响应发送后保留在消息上，作为收据标记。

用户对机器人消息的反应也会被跟踪。如果用户在机器人发送的消息上添加或删除表情反应，它会被路由为合成的文本事件（`reaction:added:EMOJI_TYPE` 或 `reaction:removed:EMOJI_TYPE`），以便代理可以响应反馈。

## 突发保护和批处理

适配器包含对快速消息突发的去 debounce 处理，以避免压垮代理：

### 文本批处理

当用户快速连续发送多条文本消息时，它们会在分派前合并为单个事件：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | 0.6秒 |
| 每批最大消息数 | `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | 8 |
| 每批最大字符数 | `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | 4000 |

### 媒体批处理

快速连续发送的多个媒体附件（例如拖放多张图片）会被合并为单个事件：

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 静默期 | `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 0.8秒 |

### 每聊天的序列化

同一聊天中的消息被串行处理（一次一个）以保持对话连贯性。每个聊天有自己的锁，因此不同聊天中的消息被并发处理。

## 速率限制（Webhook 模式）

在 Webhook 模式下，适配器强制执行每 IP 速率限制以防止滥用：

- **窗口：** 60 秒滑动窗口
- **限制：** 每个（app_id、路径、IP）三元组每窗口 120 个请求
- **跟踪上限：** 最多跟踪 4096 个唯一密钥（防止无限制内存增长）

超出限制的请求会收到 HTTP 429（请求过多）。

### Webhook 异常跟踪

适配器跟踪每个 IP 地址的连续错误响应。在 6 小时窗口内同一 IP 连续收到 25 个错误后，会记录警告。这有助于检测配置错误的客户端或探测尝试。

额外的 Webhook 保护：
- **正文大小限制：** 最大 1 MB
- **正文读取超时：** 30 秒
- **Content-Type 强制：** 仅接受 `application/json`

## WebSocket 调优

使用 `websocket` 模式时，您可以自定义重连和 ping 行为：

```yaml
platforms:
  feishu:
    extra:
      ws_reconnect_interval: 120   # 重连尝试之间的秒数（默认：120）
      ws_ping_interval: 30         # WebSocket ping 之间的秒数（可选；未设置则使用 SDK 默认值）
```

| 设置 | 配置键 | 默认值 | 描述 |
|---------|-----------|---------|-------------|
| 重连间隔 | `ws_reconnect_interval` | 120秒 | 重连尝试之间等待多长时间 |
| Ping 间隔 | `ws_ping_interval` | _(SDK 默认)_ | WebSocket 保持活力 ping 的频率 |

## 每群访问控制

除了全局 `FEISHU_GROUP_POLICY`，您可以使用 `config.yaml` 中的 `group_rules` 为每个群聊设置细粒度规则：

```yaml
platforms:
  feishu:
    extra:
      default_group_policy: "open"     # 未在 group_rules 中列出的群的默认值
      admins:                          # 可以管理机器人设置的用户
        - "ou_admin_open_id"
      group_rules:
        "oc_group_chat_id_1":
          policy: "allowlist"          # open | allowlist | blacklist | admin_only | disabled
          allowlist:
            - "ou_user_open_id_1"
            - "ou_user_open_id_2"
        "oc_group_chat_id_2":
          policy: "admin_only"
        "oc_group_chat_id_3":
          policy: "blacklist"
          blacklist:
            - "ou_blocked_user"
```

| 策略 | 描述 |
|--------|-------------|
| `open` | 群中的任何人都可以使用机器人 |
| `allowlist` | 只有群中 `allowlist` 里的用户可以使用机器人 |
| `blacklist` | 除群中 `blacklist` 里的用户外都可以使用机器人 |
| `admin_only` | 只有全局 `admins` 列表中的用户可以在这个群中使用机器人 |
| `disabled` | 机器人忽略此群中的所有消息 |

未在 `group_rules` 中列出的群会回退到 `default_group_policy`（默认为 `FEISHU_GROUP_POLICY` 的值）。

## 去重

入站消息使用消息 ID 进行去重，TTL 为 24 小时。去重状态在重启之间持久化到 `~/.hermes/feishu_seen_message_ids.json`。

| 设置 | 环境变量 | 默认值 |
|---------|---------|---------|
| 缓存大小 | `HERMES_FEISHU_DEDUP_CACHE_SIZE` | 2048 条目 |

## 所有环境变量

| 变量 | 必填 | 默认值 | 描述 |
|----------|----------|---------|-------------|
| `FEISHU_APP_ID` | 是 | — | 飞书/Lark 应用 ID |
| `FEISHU_APP_SECRET` | 是 | — | 飞书/Lark 应用密钥 |
| `FEISHU_DOMAIN` | 否 | `feishu` | `feishu`（中国）或 `lark`（国际版） |
| `FEISHU_CONNECTION_MODE` | 否 | `websocket` | `websocket` 或 `webhook` |
| `FEISHU_ALLOWED_USERS` | 否 | _(空)_ | 用户白名单的逗号分隔 open_id 列表 |
| `FEISHU_HOME_CHANNEL` | 否 | — | 定时任务/通知输出的聊天 ID |
| `FEISHU_ENCRYPT_KEY` | 否 | _(空)_ | Webhook 签名验证的加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | 否 | _(空)_ | Webhook 有效载荷 auth 的验证令牌 |
| `FEISHU_GROUP_POLICY` | 否 | `allowlist` | 群消息策略：`open`、`allowlist`、`disabled` |
| `FEISHU_BOT_OPEN_ID` | 否 | _(空)_ | 机器人的 open_id（用于 @提及 检测） |
| `FEISHU_BOT_USER_ID` | 否 | _(空)_ | 机器人的 user_id（用于 @提及 检测） |
| `FEISHU_BOT_NAME` | 否 | _(空)_ | 机器人的显示名称（用于 @提及 检测） |
| `FEISHU_WEBHOOK_HOST` | 否 | `127.0.0.1` | Webhook 服务器绑定地址 |
| `FEISHU_WEBHOOK_PORT` | 否 | `8765` | Webhook 服务器端口 |
| `FEISHU_WEBHOOK_PATH` | 否 | `/feishu/webhook` | Webhook 端点路径 |
| `HERMES_FEISHU_DEDUP_CACHE_SIZE` | 否 | `2048` | 跟踪的最大去重消息 ID 数量 |
| `HERMES_FEISHU_TEXT_BATCH_DELAY_SECONDS` | 否 | `0.6` | 文本突发 debounce 静默期 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_MESSAGES` | 否 | `8` | 每文本批次合并的最大消息数 |
| `HERMES_FEISHU_TEXT_BATCH_MAX_CHARS` | 否 | `4000` | 每文本批次合并的最大字符数 |
| `HERMES_FEISHU_MEDIA_BATCH_DELAY_SECONDS` | 否 | `0.8` | 媒体突发 debounce 静默期 |

WebSocket 和每群 ACL 设置通过 `config.yaml` 中的 `platforms.feishu.extra` 配置（见上文 [WebSocket 调优](#websocket-tuning) 和 [每群访问控制](#per-group-access-control)）。

## 故障排除

| 问题 | 修复 |
|---------|-----|
| `lark-oapi 未安装` | 安装 SDK：`pip install lark-oapi` |
| `websockets 未安装；websocket 模式不可用` | 安装 websockets：`pip install websockets` |
| `aiohttp 未安装；webhook 模式不可用` | 安装 aiohttp：`pip install aiohttp` |
| `FEISHU_APP_ID 或 FEISHU_APP_SECRET 未设置` | 设置两个环境变量或通过 `hermes gateway setup` 配置 |
| `另一个本地 Hermes 网关已在使用此 Feishu app_id` | 一次只有一个 Hermes 实例可以使用相同的 app_id。先停止另一个网关。 |
| 机器人在群中不回复 | 确保机器人被 @提及，检查 `FEISHU_GROUP_POLICY`，如果策略是 `allowlist` 则验证发送者在 `FEISHU_ALLOWED_USERS` 中 |
| `Webhook 拒绝：无效的验证令牌` | 确保 `FEISHU_VERIFICATION_TOKEN` 与飞书应用事件订阅配置中的令牌匹配 |
| `Webhook 拒绝：无效的签名` | 确保 `FEISHU_ENCRYPT_KEY` 与您的飞书应用配置中的加密密钥匹配 |
| 帖子消息显示为纯文本 | 飞书 API 拒绝了帖子有效载荷；这是正常的回退行为。查看日志了解详情。 |
| 机器人未收到图片/文件 | 授予您的飞书应用 `im:message` 和 `im:resource` 权限范围 |
| 机器人身份未自动检测 | 授予 `admin:app.info:readonly` 范围，或手动设置 `FEISHU_BOT_OPEN_ID` / `FEISHU_BOT_NAME` |
| `Webhook 速率限制超出` | 同一 IP 每分钟超过 120 个请求。这通常是配置错误或循环。 |

## 工具集

飞书 / Lark 使用 `hermes-feishu` 平台预设，它包含与 Telegram 和其他基于网关的消息平台相同的核心工具。
