---
sidebar_position: 9
title: "Matrix"
description: "将 Hermes Agent 设置为 Matrix 机器人"
---

# Matrix 设置

Hermes Agent 与 Matrix 集成，Matrix 是一个开放的联邦消息协议。Matrix 让您运行自己的服务器或使用 matrix.org 等公共服务器——无论哪种方式，您都掌控着自己的通信。机器人通过 `matrix-nio` Python SDK 连接，通过 Hermes Agent 管道处理消息（包括工具使用、记忆和推理），并实时回复。它支持文本、文件附件、图片、音频、视频和可选的端到端加密（E2EE）。

Hermes 可与任何 Matrix 服务器配合使用——Synapse、Conduit、Dendrite 或 matrix.org。

在设置之前，这是大多数人都想了解的部分：Hermes 连接后的行为。

## Hermes 的行为

| 场景 | 行为 |
|---------|----------|
| **私信** | Hermes 每条消息都会回复。无需 `@提及`。每条私信都有自己的会话。 |
| **房间** | 默认情况下，Hermes 需要 `@提及` 才能回复。设置 `MATRIX_REQUIRE_MENTION=false` 或将房间 ID 添加到 `MATRIX_FREE_RESPONSE_ROOMS` 以实现自由回复房间。房间邀请会自动接受。 |
| **线程** | Hermes 支持 Matrix 线程（MSC3440）。如果您在线程中回复，Hermes 会将线程上下文与主房间时间线隔离开来。机器人已参与的线程不需要提及。 |
| **自动线程化** | 默认情况下，Hermes 为其回复的每条消息自动创建一个线程。这保持对话隔离。设置 `MATRIX_AUTO_THREAD=false` 以禁用。 |
| **多人共享房间** | 默认情况下，Hermes 在房间内按用户隔离会话历史。除非您明确禁用，否则同一房间中的两个人不会共享一个对话记录。 |

:::tip
机器人被邀请时会自动加入房间。只需将机器人的 Matrix 用户邀请到任何房间，它就会加入并开始回复。
:::

### Matrix 中的会话模型

默认情况下：

- 每条私信有自己的会话
- 每个线程有自己的会话命名空间
- 共享房间中的每个用户在房间内拥有自己的会话

这通过 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

只有当您明确希望整个房间共享一个对话时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

共享会话对协作房间很有用，但也意味着：

- 用户共享上下文增长和 token 费用
- 一个人的长时间工具密集型任务会膨胀其他人的上下文
- 一个人的进行中运行可能会中断同一房间中其他人的后续操作

### 提及和线程化配置

您可以通过环境变量或 `config.yaml` 配置提及和自动线程化行为：

```yaml
matrix:
  require_mention: true           # 在房间中需要 @提及（默认：true）
  free_response_rooms:            # 免除提及要求的房间
    - "!abc123:matrix.org"
  auto_thread: true               # 为回复自动创建线程（默认：true）
```

或通过环境变量：

```bash
MATRIX_REQUIRE_MENTION=true
MATRIX_FREE_RESPONSE_ROOMS=!abc123:matrix.org,!def456:matrix.org
MATRIX_AUTO_THREAD=true
```

:::note
如果您从没有 `MATRIX_REQUIRE_MENTION` 的版本升级，机器人以前会在房间中回复所有消息。要保留该行为，请设置 `MATRIX_REQUIRE_MENTION=false`。
:::

本指南带您完成整个设置过程——从创建机器人账户到发送第一条消息。

## 步骤 1：创建机器人账户

您需要一个 Matrix 用户账户作为机器人。有几种方法：

### 选项 A：在您的服务器上注册（推荐）

如果您运行自己的服务器（Synapse、Conduit、Dendrite）：

1. 使用管理 API 或注册工具创建新用户：

```bash
# Synapse 示例
register_new_matrix_user -c /etc/synapse/homeserver.yaml http://localhost:8008
```

2. 选择一个用户名，例如 `hermes`——完整的用户 ID 将是 `@hermes:your-server.org`。

### 选项 B：使用 matrix.org 或其他公共服务器

1. 登录 [Element Web](https://app.element.io) 并创建一个新账户。
2. 为您的机器人选择一个用户名（例如 `hermes-bot`）。

### 选项 C：使用您自己的账户

您也可以将 Hermes 作为您自己的用户运行。这意味着机器人以您的身份发帖——对私人助理很有用。

## 步骤 2：获取访问令牌

Hermes 需要访问令牌来向服务器进行身份验证。您有两种选择：

### 选项 A：访问令牌（推荐）

获取令牌最可靠的方式：

**通过 Element：**
1. 用机器人账户登录 [Element](https://app.element.io)。
2. 进入**设置** → **帮助与关于**。
3. 向下滚动并展开**高级**——访问令牌会显示在那里。
4. **立即复制。**

**通过 API：**

```bash
curl -X POST https://your-server/_matrix/client/v3/login \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "@hermes:your-server.org",
    "password": "your-password"
  }'
```

响应包含一个 `access_token` 字段——复制它。

:::warning[保护好您的访问令牌]
访问令牌授予对机器人 Matrix 账户的完全访问权限。切勿公开共享或将其提交到 Git。如果泄露，通过注销该用户的所有会话来撤销。
:::

### 选项 B：密码登录

除了提供访问令牌，您还可以提供机器人的用户 ID 和密码。Hermes 会在启动时自动登录。这更简单，但意味着密码存储在您的 `.env` 文件中。

```bash
MATRIX_USER_ID=@hermes:your-server.org
MATRIX_PASSWORD=your-password
```

## 步骤 3：找到您的 Matrix 用户 ID

Hermes Agent 使用您的 Matrix 用户 ID 来控制谁可以与机器人交互。Matrix 用户 ID 格式为 `@username:server`。

查找方法：

1. 打开 [Element](https://app.element.io)（或您首选的 Matrix 客户端）。
2. 点击您的头像 → **设置**。
3. 您的用户 ID 显示在个人资料顶部（例如 `@alice:matrix.org`）。

:::tip
Matrix 用户 ID 始终以 `@` 开头，包含一个 `:` 后跟服务器名。例如：`@alice:matrix.org`、`@bob:your-server.com`。
:::

## 步骤 4：配置 Hermes Agent

### 选项 A：交互式设置（推荐）

运行引导设置命令：

```bash
hermes gateway setup
```

出现提示时选择 **Matrix**，然后在询问时提供您的服务器 URL、访问令牌（或用户 ID + 密码）和允许的用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件中：

**使用访问令牌：**

```bash
# 必填
MATRIX_HOMESERVER=https://matrix.example.org
MATRIX_ACCESS_TOKEN=***

# 可选：用户 ID（如果省略则从令牌自动检测）
# MATRIX_USER_ID=@hermes:matrix.example.org

# 安全：限制谁可以与机器人交互
MATRIX_ALLOWED_USERS=@alice:matrix.example.org

# 多个允许的用户（逗号分隔）
# MATRIX_ALLOWED_USERS=@alice:matrix.example.org,@bob:matrix.example.org
```

**使用密码登录：**

```bash
# 必填
MATRIX_HOMESERVER=https://matrix.example.org
MATRIX_USER_ID=@hermes:matrix.example.org
MATRIX_PASSWORD=***

# 安全
MATRIX_ALLOWED_USERS=@alice:matrix.example.org
```

`~/.hermes/config.yaml` 中的可选行为设置：

```yaml
group_sessions_per_user: true
```

- `group_sessions_per_user: true` 使共享房间中每个参与者的上下文保持隔离

### 启动网关

配置完成后，启动 Matrix 网关：

```bash
hermes gateway
```

机器人应在几秒钟内连接到您的服务器并开始同步。向它发送消息进行测试——可以是私信或它已加入的房间中的消息。

:::tip
您可以在后台运行 `hermes gateway` 或将其作为 systemd 服务运行以实现持久运行。请参阅部署文档了解详情。
:::

## 端到端加密（E2EE）

Hermes 支持 Matrix 端到端加密，因此您可以在加密房间中与机器人聊天。

### 要求

E2EE 需要具有加密功能的 `matrix-nio` 库和 `libolm` C 库：

```bash
# 安装具有 E2EE 支持的 matrix-nio
pip install 'matrix-nio[e2e]'

# 或使用 hermes extras 安装
pip install 'hermes-agent[matrix]'
```

您还需要在系统上安装 `libolm`：

```bash
# Debian/Ubuntu
sudo apt install libolm-dev

# macOS
brew install libolm

# Fedora
sudo dnf install libolm-devel
```

### 启用 E2EE

将以下内容添加到您的 `~/.hermes/.env`：

```bash
MATRIX_ENCRYPTION=true
```

启用 E2EE 后，Hermes 会：

- 将加密密钥存储在 `~/.hermes/platforms/matrix/store/`（旧安装：`~/.hermes/matrix/store/`）
- 在首次连接时上传设备密钥
- 自动解密传入消息和加密传出消息
- 被邀请时自动加入加密房间

:::warning
如果您删除 `~/.hermes/platforms/matrix/store/` 目录，机器人会丢失其加密密钥。您需要在 Matrix 客户端中再次验证设备。如果要保留加密会话，请备份此目录。
:::

:::info
如果未安装 `matrix-nio[e2e]` 或缺少 `libolm`，机器人会自动回退到普通（未加密）客户端。您会在日志中看到警告。
:::

## 主房间

您可以指定一个"主房间"，机器人会在那里发送主动消息（如定时任务输出、提醒和通知）。有两种方式设置：

### 使用斜杠命令

在任何机器人所在的 Matrix 房间中输入 `/sethome`。该房间将成为主房间。

### 手动配置

将以下内容添加到您的 `~/.hermes/.env`：

```bash
MATRIX_HOME_ROOM=!abc123def456:matrix.example.org
```

:::tip
要查找房间 ID：在 Element 中，进入房间 → **设置** → **高级** → **内部房间 ID** 会显示在那里（以 `!` 开头）。
:::

## 故障排除

### 机器人不回复消息

**原因**：机器人未加入房间，或者 `MATRIX_ALLOWED_USERS` 不包含您的用户 ID。

**修复**：将机器人邀请到房间——它会在邀请时自动加入。验证您的用户 ID 在 `MATRIX_ALLOWED_USERS` 中（使用完整的 `@user:server` 格式）。重启网关。

### 启动时"认证失败" / "whoami 失败"

**原因**：访问令牌或服务器 URL 错误。

**修复**：验证 `MATRIX_HOMESERVER` 指向您的服务器（包含 `https://`，无尾部斜杠）。检查 `MATRIX_ACCESS_TOKEN` 是否有效——尝试用它执行 curl：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-server/_matrix/client/v3/account/whoami
```

如果这返回您的用户信息，令牌有效。如果返回错误，请生成新令牌。

### "matrix-nio 未安装"错误

**原因**：未安装 `matrix-nio` Python 包。

**修复**：安装它：

```bash
pip install 'matrix-nio[e2e]'
```

或使用 hermes extras：

```bash
pip install 'hermes-agent[matrix]'
```

### 加密错误 / "无法解密事件"

**原因**：缺少加密密钥、未安装 `libolm`，或机器人的设备不受信任。

**修复**：
1. 验证 `libolm` 已安装在您的系统上（见上文 E2EE 部分）。
2. 确保在您的 `.env` 中设置了 `MATRIX_ENCRYPTION=true`。
3. 在您的 Matrix 客户端（Element）中，进入机器人的个人资料 → **会话** → 验证/信任机器人的设备。
4. 如果机器人刚加入一个加密房间，它只能解密加入后发送的消息。旧消息无法访问。

### 同步问题 / 机器人落后

**原因**：长时间运行的工具执行可能会延迟同步循环，或者服务器较慢。

**修复**：同步循环会在错误时自动每 5 秒重试。检查 Hermes 日志中与同步相关的警告。如果机器人始终落后，确保您的服务器有足够的资源。

### 机器人离线

**原因**：Hermes 网关未运行，或连接失败。

**修复**：检查 `hermes gateway` 是否正在运行。查看终端输出中的错误消息。常见问题：服务器 URL 错误、访问令牌过期、服务器不可达。

### "用户不被允许" / 机器人忽略您

**原因**：您的用户 ID 不在 `MATRIX_ALLOWED_USERS` 中。

**修复**：将您的用户 ID 添加到 `~/.hermes/.env` 中的 `MATRIX_ALLOWED_USERS` 并重启网关。使用完整的 `@user:server` 格式。

## 安全

:::warning
始终设置 `MATRIX_ALLOWED_USERS` 以限制谁可以与机器人交互。没有它，网关默认拒绝所有用户作为安全措施。只添加您信任的人的用户 ID——授权用户拥有代理全部功能的访问权限，包括工具使用和系统访问。
:::

有关保护您的 Hermes Agent 部署的更多信息，请参阅[安全指南](../security.md)。

## 备注

- **任何服务器**：适用于 Synapse、Conduit、Dendrite、matrix.org 或任何符合规范的 Matrix 服务器。无需特定的服务器软件。
- **联邦**：如果您在联邦服务器上，机器人可以与其他服务器的用户通信——只需将他们的完整 `@user:server` ID 添加到 `MATRIX_ALLOWED_USERS`。
- **自动加入**：机器人自动接受房间邀请并加入。加入后会立即开始回复。
- **媒体支持**：Hermes 可以发送和接收图片、音频、视频和文件附件。媒体使用 Matrix 内容存储 API 上传到您的服务器。
- **原生语音消息（MSC3245）**：Matrix 适配器自动为传出语音消息添加 `org.matrix.msc3245.voice` 标志。这意味着 TTS 响应和语音音频在 Element 和其他支持 MSC3245 的客户端中呈现为**原生语音气泡**，而非通用音频文件附件。带有 MSC3245 标志的传入语音消息也会被正确识别并路由到语音转文本转录。无需配置——这自动工作。
