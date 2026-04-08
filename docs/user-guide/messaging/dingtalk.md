---
sidebar_position: 10
title: "DingTalk"
description: "将 Hermes Agent 设置为 DingTalk 聊天机器人"
---

# DingTalk 设置

Hermes Agent 与钉钉集成作为聊天机器人，让您可以通过私信或群聊与 AI 助手聊天。机器人通过钉钉的 Stream Mode 连接 — 一种持久化的 WebSocket 连接，无需公共 URL 或 webhook 服务器 — 并通过钉钉的会话 webhook API 使用 markdown 格式的消息回复。

在设置之前，这里是大多数人想了解的部分：Hermes 进入您的钉钉工作区后的行为。

## Hermes 的行为

| 上下文 | 行为 |
|---------|----------|
| **私信（1:1 聊天）** | Hermes 响应每条消息。无需 `@提及`。每条私信都有自己的会话。 |
| **群聊** | 当您 `@提及` Hermes 时响应。没有提及时，Hermes 忽略消息。 |
| **多用户共享群** | 默认情况下，Hermes 在群内隔离每个用户的会话历史。同一群中的两个人不会共享一个对话记录，除非您明确禁用。 |

### DingTalk 中的会话模型

默认情况下：

- 每条私信获得自己的会话
- 共享群聊中的每个用户在群内获得自己的会话

这通过 `config.yaml` 控制：

```yaml
group_sessions_per_user: true
```

仅当您明确希望整个群共享一个对话时，才将其设置为 `false`：

```yaml
group_sessions_per_user: false
```

本指南将引导您完成从创建 DingTalk 机器人到发送第一条消息的完整设置过程。

## 前置要求

安装所需的 Python 包：

```bash
pip install dingtalk-stream httpx
```

- `dingtalk-stream` — DingTalk 官方的 Stream Mode SDK（基于 WebSocket 的实时消息）
- `httpx` — 用于通过会话 webhook 发送回复的异步 HTTP 客户端

## 步骤 1：创建 DingTalk 应用

1. 进入 [DingTalk 开发者控制台](https://open-dev.dingtalk.com/)。
2. 使用您的 DingTalk 管理员账户登录。
3. 点击 **应用开发** → **自定义应用** → **通过 H5 微应用创建**（或 **机器人**，取决于您的控制台版本）。
4. 填写：
   - **应用名称**：例如 `Hermes Agent`
   - **描述**：可选
5. 创建后，导航到 **凭证与基础信息** 找到您的 **Client ID**（AppKey）和 **Client Secret**（AppSecret）。两者都复制。

:::warning[凭证仅显示一次]
AppSecret 在创建应用时仅显示一次。如果丢失，您需要重新生成。切勿公开分享这些凭证或将它们提交到 Git。
:::

## 步骤 2：启用机器人能力

1. 在应用设置页面，进入 **添加能力** → **机器人**。
2. 启用机器人能力。
3. 在 **消息接收模式** 下，选择 **Stream Mode**（推荐 — 无需公共 URL）。

:::tip
Stream Mode 是推荐的设置。它使用从您的机器发起的持久化 WebSocket 连接，因此您不需要公共 IP、域名或 webhook 端点。它在 NAT、防火墙和本地机器后面都能工作。
:::

## 步骤 3：找到您的 DingTalk 用户 ID

Hermes Agent 使用您的 DingTalk 用户 ID 来控制谁可以与机器人交互。DingTalk 用户 ID 是由您组织的管理员设置的字母数字字符串。

查找方法：

1. 询问您的 DingTalk 组织管理员 — 用户 ID 在 DingTalk 管理控制台的 **联系人** → **成员** 中配置。
2. 或者，机器人在每次收到消息时记录 `sender_id`。启动网关，向机器人发送一条消息，然后检查日志中的您的 ID。

## 步骤 4：配置 Hermes Agent

### 选项 A：交互式设置（推荐）

运行引导设置命令：

```bash
hermes gateway setup
```

出现提示时选择 **DingTalk**，然后在询问时粘贴您的 Client ID、Client Secret 和允许的用户 ID。

### 选项 B：手动配置

将以下内容添加到您的 `~/.hermes/.env` 文件：

```bash
# 必需
DINGTALK_CLIENT_ID=your-app-key
DINGTALK_CLIENT_SECRET=your-app-secret

# 安全：限制谁可以与机器人交互
DINGTALK_ALLOWED_USERS=user-id-1

# 多个允许的用户（逗号分隔）
# DINGTALK_ALLOWED_USERS=user-id-1,user-id-2
```

`~/.hermes/config.yaml` 中的可选行为设置：

```yaml
group_sessions_per_user: true
```

- `group_sessions_per_user: true` 在共享群聊中保持每个参与者的上下文隔离

### 启动网关

配置完成后，启动 DingTalk 网关：

```bash
hermes gateway
```

机器人应在几秒钟内连接到 DingTalk 的 Stream Mode。向它发送一条消息 — 私信或在已添加它的群中 — 来测试。

:::tip
您可以在后台运行 `hermes gateway` 或将其作为 systemd 服务运行以实现持久操作。参见部署文档了解详情。
:::

## 故障排除

### 机器人不响应消息

**原因**：机器人能力未启用，或 `DINGTALK_ALLOWED_USERS` 不包含您的用户 ID。

**修复**：验证机器人能力在您的应用设置中已启用，并选择了 Stream Mode。检查您的用户 ID 在 `DINGTALK_ALLOWED_USERS` 中。重启网关。

### "dingtalk-stream not installed" 错误

**原因**：`dingtalk-stream` Python 包未安装。

**修复**：安装它：

```bash
pip install dingtalk-stream httpx
```

### "DINGTALK_CLIENT_ID and DINGTALK_CLIENT_SECRET required"

**原因**：凭证未在您的环境或 `.env` 文件中设置。

**修复**：验证 `~/.hermes/.env` 中的 `DINGTALK_CLIENT_ID` 和 `DINGTALK_CLIENT_SECRET` 设置正确。Client ID 是您的 AppKey，Client Secret 是 DingTalk 开发者控制台中的 AppSecret。

### Stream 断开 / 重连循环

**原因**：网络不稳定、DingTalk 平台维护或凭证问题。

**修复**：适配器使用指数退避自动重连（2s → 5s → 10s → 30s → 60s）。检查您的凭证有效且您的应用未被停用。验证您的网络允许出站 WebSocket 连接。

### 机器人离线

**原因**：Hermes 网关未运行，或连接失败。

**修复**：检查 `hermes gateway` 是否正在运行。查看终端输出的错误消息。常见问题：凭证错误、应用停用、`dingtalk-stream` 或 `httpx` 未安装。

### "No session_webhook available"

**原因**：机器人尝试回复但没有 session webhook URL。这通常发生在 webhook 过期或机器人在收到消息和发送回复之间重启时。

**修复**：向机器人发送新消息 — 每条收到的消息都会提供一个新的会话 webhook 用于回复。这是 DingTalk 的正常限制；机器人只能回复最近收到的消息。

## 安全性

:::warning
始终设置 `DINGTALK_ALLOWED_USERS` 以限制谁可以与机器人交互。没有它，网关默认拒绝所有用户作为安全措施。只添加您信任的用户 ID — 授权用户完全访问代理的能力，包括工具使用和系统访问。
:::

有关保护您的 Hermes Agent 部署的更多信息，请参见[安全指南](../security.md)。

## 注意事项

- **Stream Mode**：无需公共 URL、域名或 webhook 服务器。连接通过 WebSocket 从您的机器发起，因此在 NAT 和防火墙后面也能工作。
- **Markdown 回复**：回复以 DingTalk 的 markdown 格式格式化为富文本显示。
- **消息去重**：适配器使用 5 分钟窗口对消息去重，以防止处理同一条消息两次。
- **自动重连**：如果流连接断开，适配器使用指数退避自动重连。
- **消息长度限制**：每条消息的回复上限为 20,000 个字符。更长的回复被截断。
