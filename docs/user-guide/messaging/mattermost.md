---
sidebar_position: 8
title: "Mattermost"
description: "将 Hermes Agent 设置为 Mattermost 机器人"
---

# Mattermost 设置

Hermes Agent 与 Mattermost 集成作为一个机器人，让您可以通过直接消息或团队频道与 AI 助手聊天。Mattermost 是一个自托管的开源 Slack 替代方案——您在自己的基础设施上运行它，完全掌控您的数据。机器人通过 Mattermost 的 REST API（v4）和 WebSocket 进行实时事件连接，通过 Hermes Agent 管道处理消息（包括工具使用、记忆和推理），并实时回复。它支持文本、文件附件、图片和斜杠命令。

无需外部 Mattermost 库——适配器使用 `aiohttp`，这已经是 Hermes 的依赖项。

在设置之前，这是大多数人都想了解的部分：Hermes 加入后的行为。

## Hermes 的行为

| 场景 | 行为 |
|---------|----------|
| **私信** | Hermes 每条消息都会回复。无需 `@提及`。每条私信都有自己的会话。 |
| **公开/私有频道** | Hermes 在被 `@提及` 时回复。没有提及时，Hermes 会忽略消息。 |
| **线程** | 如果 `MATTERMOST_REPLY_MODE=thread`，Hermes 会在您的消息下方的线程中回复。线程上下文与父频道保持隔离。 |
| **多人共享频道** | 默认情况下，Hermes 在频道内按用户隔离会话历史。除非您明确禁用，否则同一频道中的两个人不会共享一个对话记录。 |

:::tip
如果您希望 Hermes 以线程对话的形式回复（嵌套在原始消息下方），请设置 `MATTERMOST_REPLY_MODE=thread`。默认为 `off`，即在频道中发送扁平消息。
:::

### Mattermost 中的会话模型

默认情况下：

- 每条私信有自己的会话
- 每个线程有自己的会话命名空间
- 共享频道中的每个用户在频道内拥有自己的会话

这通过 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

只有当您明确希望整个频道共享一个对话时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话对协作频道很有用，但也意味着：

- 用户共享上下文增长和 token 费用
- 一个人的长时间工具密集型任务会膨胀其他人的上下文
- 一个人的进行中运行可能会中断同一频道中其他人的后续操作

本指南带您完成整个设置过程——从在 Mattermost 上创建机器人到发送第一条消息。

## 步骤 1：启用机器人账户

在创建机器人之前，必须在您的 Mattermost 服务器上启用机器人账户。

1. 以**系统管理员**身份登录 Mattermost。
2. 进入**系统控制台** → **集成** → **机器人账户**。
3. 将**启用机器人账户创建**设置为 **true**。
4. 点击**保存**。

:::info
如果您没有系统管理员访问权限，请让您的 Mattermost 管理员启用机器人账户并为您创建一个。
:::

## 步骤 2：创建机器人账户

1. 在 Mattermost 中，点击左上角的 **☰** 菜单 → **集成** → **机器人账户**。
2. 点击**添加机器人账户**。
3. 填写详情：
   - **用户名**：例如 `hermes`
   - **显示名称**：例如 `Hermes Agent`
   - **描述**：可选
   - **角色**：`成员` 就足够了
4. 点击**创建机器人账户**。
5. Mattermost 将显示**机器人令牌**。**立即复制。**

:::warning[令牌只显示一次]
机器人令牌在创建机器人账户时只显示一次。如果丢失，您需要从机器人账户设置中重新生成。切勿公开共享您的令牌或将其提交到 Git——拥有此令牌的任何人都可以完全控制机器人。
:::

将令牌保存在安全的地方（例如密码管理器）。您需要在步骤 5 中使用它。

:::tip
您也可以使用**个人访问令牌**代替机器人账户。进入**个人资料** → **安全** → **个人访问令牌** → **创建令牌**。如果您希望 Hermes 以您自己的用户身份发帖而非单独的机器人用户，这很有用。
:::

## 步骤 3：将机器人添加到频道

机器人需要成为您希望其回复的任何频道的成员：

1. 打开您希望机器人所在的频道。
2. 点击频道名称 → **添加成员**。
3. 搜索您的机器人用户名（例如 `hermes`）并添加它。

对于私信，只需打开与机器人的直接消息——它将能够立即回复。

## 步骤 4：找到您的 Mattermost 用户 ID

Hermes Agent 使用您的 Mattermost 用户 ID 来控制谁可以与机器人交互。查找方法：

1. 点击您的**头像**（左上角） → **个人资料**。
2. 您的用户 ID 会显示在个人资料对话框中——点击即可复制。

您的用户 ID 是一个 26 个字符的字母数字字符串，例如 `3uo8dkh1p7g1mfk49ear5fzs5c`。

:::warning
您的用户 ID **不是**您的用户名。用户名是 `@` 后面显示的内容（例如 `@alice`）。用户 ID 是 Mattermost 在内部使用的长字母数字标识符。
:::

**替代方法**：您也可以通过 API 获取您的用户 ID：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-mattermost-server/api/v4/users/me | jq .id
```

:::tip
要获取**频道 ID**：点击频道名称 → **查看信息**。频道 ID 会显示在信息面板中。如果您想手动设置主频道，则需要此 ID。
:::

## 步骤 5：配置 Hermes Agent

### 选项 A：交互式设置（推荐）

运行引导设置命令：

```bash
hermes gateway setup
```

出现提示时选择 **Mattermost**，然后在询问时粘贴您的服务器 URL、机器人令牌和用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

```bash
# 必填
MATTERMOST_URL=https://mm.example.com
MATTERMOST_TOKEN=***
MATTERMOST_ALLOWED_USERS=3uo8dkh1p7g1mfk49ear5fzs5c

# 多个允许的用户（逗号分隔）
# MATTERMOST_ALLOWED_USERS=3uo8dkh1p7g1mfk49ear5fzs5c,8fk2jd9s0a7bncm1xqw4tp6r3e

# 可选：回复模式（thread 或 off，默认：off）
# MATTERMOST_REPLY_MODE=thread

# 可选：在没有 @提及的情况下回复（默认：true = 需要提及）
# MATTERMOST_REQUIRE_MENTION=false

# 可选：机器人在没有 @提及情况下回复的频道（逗号分隔的频道 ID）
# MATTERMOST_FREE_RESPONSE_CHANNELS=channel_id_1,channel_id_2
```

`~/.hermes/config.yaml` 中的可选行为设置：

```yaml
group_sessions_per_user: true
```

- `group_sessions_per_user: true` 使共享频道和线程中每个参与者的上下文保持隔离

### 启动网关

配置完成后，启动 Mattermost 网关：

```bash
hermes gateway
```

机器人应在几秒钟内连接到您的 Mattermost 服务器。向它发送消息进行测试——可以是私信或它已被添加的频道中的消息。

:::tip
您可以在后台运行 `hermes gateway` 或将其作为 systemd 服务运行以实现持久运行。请参阅部署文档了解详情。
:::

## 主频道

您可以指定一个"主频道"，机器人会在那里发送主动消息（如定时任务输出、提醒和通知）。有两种方式设置：

### 使用斜杠命令

在任何机器人所在的 Mattermost 频道中输入 `/sethome`。该频道将成为主频道。

### 手动配置

将以下内容添加到您的 `~/.hermes/.env` 中：

```bash
MATTERMOST_HOME_CHANNEL=abc123def456ghi789jkl012mn
```

用实际频道 ID 替换（点击频道名称 → 查看信息 → 复制 ID）。

## 回复模式

`MATTERMOST_REPLY_MODE` 设置控制 Hermes 如何发布回复：

| 模式 | 行为 |
|------|---------|
| `off`（默认） | Hermes 在频道中发布扁平消息，像普通用户一样。 |
| `thread` | Hermes 在您原始消息下方的线程中回复。在大量来回对话时保持频道整洁。 |

在您的 `~/.hermes/.env` 中设置：

```bash
MATTERMOST_REPLY_MODE=thread
```

## 提及行为

默认情况下，机器人在被 `@提及` 时才在频道中回复。您可以更改此设置：

| 变量 | 默认值 | 描述 |
|----------|---------|-------------|
| `MATTERMOST_REQUIRE_MENTION` | `true` | 设置为 `false` 以回复频道中的所有消息（私信始终可用）。 |
| `MATTERMOST_FREE_RESPONSE_CHANNELS` | _(无)_ | 逗号分隔的频道 ID，即使 require_mention 为 true，机器人也会在没有 @提及的情况下回复。 |

在 Mattermost 中查找频道 ID：打开频道，点击频道名称标题，在 URL 或频道详情中查找 ID。

当机器人被 `@提及` 时，提及会在处理前自动从消息中剥离。

## 故障排除

### 机器人不回复消息

**原因**：机器人不是频道的成员，或者 `MATTERMOST_ALLOWED_USERS` 不包含您的用户 ID。

**修复**：将机器人添加到频道（频道名称 → 添加成员 → 搜索机器人）。验证您的用户 ID 在 `MATTERMOST_ALLOWED_USERS` 中。重启网关。

### 403 Forbidden 错误

**原因**：机器人令牌无效，或者机器人没有在频道中发布的权限。

**修复**：检查您的 `.env` 文件中的 `MATTERMOST_TOKEN` 是否正确。确保机器人账户未被停用。验证机器人已被添加到频道。如果使用个人访问令牌，请确保您的账户有所需的权限。

### WebSocket 断开连接 / 重连循环

**原因**：网络不稳定、Mattermost 服务器重启或 WebSocket 连接的防火墙/代理问题。

**修复**：适配器会自动以指数退避重连（2s → 60s）。检查服务器的 WebSocket 配置——反向代理（nginx、Apache）需要配置 WebSocket 升级头。验证没有防火墙阻止 Mattermost 服务器上的 WebSocket 连接。

对于 nginx，确保您的配置包含：

```nginx
location /api/v4/websocket {
    proxy_pass http://mattermost-backend;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 600s;
}
```

### 启动时"认证失败"

**原因**：令牌或服务器 URL 错误。

**修复**：验证 `MATTERMOST_URL` 指向您的 Mattermost 服务器（包含 `https://`，无尾部斜杠）。检查 `MATTERMOST_TOKEN` 是否有效——尝试用它执行 curl：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-server/api/v4/users/me
```

如果这返回您的机器人的用户信息，令牌有效。如果返回错误，请重新生成令牌。

### 机器人离线

**原因**：Hermes 网关未运行，或连接失败。

**修复**：检查 `hermes gateway` 是否正在运行。查看终端输出中的错误消息。常见问题：URL 错误、令牌过期、Mattermost 服务器不可达。

### "用户不被允许" / 机器人忽略您

**原因**：您的用户 ID 不在 `MATTERMOST_ALLOWED_USERS` 中。

**修复**：将您的用户 ID 添加到 `~/.hermes/.env` 中的 `MATTERMOST_ALLOWED_USERS` 并重启网关。记住：用户 ID 是一个 26 个字符的字母数字字符串，不是您的 `@username`。

## 安全

:::warning
始终设置 `MATTERMOST_ALLOWED_USERS` 以限制谁可以与机器人交互。没有它，网关默认拒绝所有用户作为安全措施。只添加您信任的人的用户 ID——授权用户拥有代理全部功能的访问权限，包括工具使用和系统访问。
:::

有关保护您的 Hermes Agent 部署的更多信息，请参阅[安全指南](../security.md)。

## 备注

- **自托管友好**：适用于任何自托管 Mattermost 实例。无需 Mattermost Cloud 账户或订阅。
- **无需额外依赖**：适配器使用 `aiohttp` 进行 HTTP 和 WebSocket，这已包含在 Hermes Agent 中。
- **团队版兼容**：适用于 Mattermost 团队版（免费）和企业版。
