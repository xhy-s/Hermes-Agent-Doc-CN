---
sidebar_position: 5
title: "WhatsApp"
description: "通过内置的 Baileys 桥接将 Hermes Agent 设置为 WhatsApp 机器人"
---

# WhatsApp 设置

Hermes 通过基于 **Baileys** 的内置桥接连接到 WhatsApp。这是通过模拟 WhatsApp Web 会话工作的——**不是**通过官方 WhatsApp Business API。无需 Meta 开发者账户或 Business 验证。

:::warning 非官方 API — 封号风险
WhatsApp **不正式支持** Business API 之外的第三方机器人。使用第三方桥接带有小风险的账户限制。为最小化风险：
- **使用专用电话号码**用于机器人（不是您的个人号码）
- **不要发送批量/垃圾消息**——保持对话式使用
- **不要向未首先向您发送消息的人自动化出站消息**
:::

:::warning WhatsApp Web 协议更新
WhatsApp 定期更新其 Web 协议，这可能暂时破坏与第三方桥接的兼容性。当这种情况发生时，Hermes 将更新桥接依赖项。如果机器人 WhatsApp 更新后停止工作，请拉取最新版本的 Hermes 并重新配对。
:::

## 两种模式

| 模式 | 如何工作 | 适用于 |
|------|-------------|----------|
| **独立机器人号码**（推荐） | 为机器人专用一个电话号码。人们直接向该号码发送消息。 | 干净的 UX、多个用户、较低的封号风险 |
| **个人自聊** | 使用您自己的 WhatsApp。您向自己发送消息以与代理交谈。 | 快速设置、单一用户、测试 |

---

## 前置要求

- **Node.js v18+** 和 **npm** —— WhatsApp 桥接作为 Node.js 进程运行
- **装有 WhatsApp 的手机**（用于扫描二维码）

与旧版浏览器驱动的桥接不同，当前的基于 Baileys 的桥接**不需要**本地 Chromium 或 Puppeteer 依赖栈。

---

## 步骤 1：运行设置向导

```bash
hermes whatsapp
```

向导将：

1. 询问您想要哪种模式（**bot** 或 **self-chat**）
2. 如需要安装桥接依赖
3. 在您的终端显示一个 **QR 码**
4. 等待您扫描

**扫描 QR 码：**

1. 在您的手机上打开 WhatsApp
2. 进入 **设置 → 关联的设备**
3. 点击 **关联设备**
4. 将相机对准终端 QR 码

配对后，向导确认连接并退出。您的会话自动保存。

:::tip
如果 QR 码看起来乱码，请确保您的终端至少 60 列宽并支持 Unicode。您也可以尝试不同的终端模拟器。
:::

---

## 步骤 2：获取第二个电话号码（机器人模式）

对于机器人模式，您需要一个尚未注册 WhatsApp 的电话号码。三个选项：

| 选项 | 费用 | 备注 |
|--------|------|-------|
| **Google Voice** | 免费 | 仅美国。在 [voice.google.com](https://voice.google.com) 获取号码。通过 Google Voice 应用内的 SMS 验证 WhatsApp。 |
| **预付费 SIM** | $5–15 一次性 | 任何运营商。激活，验证 WhatsApp，然后 SIM 可以放在抽屉里。号码必须保持活跃（每 90 天打一次电话）。 |
| **VoIP 服务** | 免费–$5/月 | TextNow、TextFree 或类似服务。一些 VoIP 号码会被 WhatsApp 阻止——如果第一个不行，多试几个。 |

获取号码后：

1. 在手机上安装 WhatsApp（或使用 WhatsApp Business 应用双卡）
2. 用 WhatsApp 注册新号码
3. 从该 WhatsApp 账户运行 `hermes whatsapp` 并扫描 QR 码

---

## 步骤 3：配置 Hermes

将以下内容添加到您的 `~/.hermes/.env` 文件：

```bash
# 必需
WHATSAPP_ENABLED=true
WHATSAPP_MODE=bot                          # "bot" 或 "self-chat"

# 访问控制——选择其中一项：
WHATSAPP_ALLOWED_USERS=15551234567         # 逗号分隔的电话号码（带国家代码，无 +）
# WHATSAPP_ALLOWED_USERS=*                 # 或使用 * 允许所有人
# WHATSAPP_ALLOW_ALL_USERS=true            # 或设置此标志（与 * 相同效果）
```

:::tip 全允许速记
设置 `WHATSAPP_ALLOWED_USERS=*` 允许**所有**发送者（等同于 `WHATSAPP_ALLOW_ALL_USERS=true`）。
这与 [Signal 群组白名单](/docs/reference/environment-variables) 一致。
要改用配对流程，请移除这两个变量并依赖
[DM 配对系统](/docs/user-guide/security#dm-pairing-system)。
:::

在 `~/.hermes/config.yaml` 中的可选行为设置：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `unauthorized_dm_behavior: pair` 是全局默认值。未知 DM 发送者会收到配对码。
- `whatsapp.unauthorized_dm_behavior: ignore` 使 WhatsApp 对未授权的 DM 保持沉默，这对于私人号码通常是更好的选择。

然后启动网关：

```bash
hermes gateway              # 前台
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅 Linux：启动时系统服务
```

网关使用保存的会话自动启动 WhatsApp 桥接。

---

## 会话持久化

Baileys 桥接将其会话保存在 `~/.hermes/platforms/whatsapp/session`。这意味着：

- **会话在重启后保留**——您不必每次都重新扫描 QR 码
- 会话数据包括加密密钥和设备凭证
- **不要共享或提交此会话目录**——它授予对 WhatsApp 账户的完全访问权限

---

## 重新配对

如果会话中断（手机重置、WhatsApp 更新、手动取消链接），您将在网关日志中看到连接错误。修复方法：

```bash
hermes whatsapp
```

这会生成一个新的 QR 码。再次扫描后会话重新建立。网关自动处理**临时**断开（网络波动、手机暂时离线）并重新连接逻辑。

---

## 语音消息

Hermes 支持 WhatsApp 语音：

- **入站：** 语音消息（`.ogg` opus）使用配置的 STT 提供商自动转录：本地 `faster-whisper`、Groq Whisper（`GROQ_API_KEY`）或 OpenAI Whisper（`VOICE_TOOLS_OPENAI_KEY`）
- **出站：** TTS 响应作为 MP3 音频文件附件发送
- 代理响应默认以 "⚕ **Hermes Agent**" 为前缀。您可以在 `config.yaml` 中自定义或禁用此：

```yaml
# ~/.hermes/config.yaml
whatsapp:
  reply_prefix: ""                          # 空字符串禁用标题
  # reply_prefix: "🤖 *My Bot*\n──────\n"  # 自定义前缀（支持 \n 换行）
```

---

## 故障排除

| 问题 | 解决方案 |
|--------|----------|
| **QR 码不扫描** | 确保终端足够宽（60+ 列）。尝试不同的终端。确保从正确的 WhatsApp 账户扫描（机器人号码，不是个人号码）。 |
| **QR 码过期** | QR 码每约 20 秒刷新一次。如果超时，重新启动 `hermes whatsapp`。 |
| **会话未持久化** | 检查 `~/.hermes/platforms/whatsapp/session` 存在且可写。如果是容器化的，请将其挂载为持久卷。 |
| **意外注销** | WhatsApp 会长时间不活动后取消链接设备。保持手机开机并连接到网络，然后在需要时使用 `hermes whatsapp` 重新配对。 |
| **桥接崩溃或重连循环** | 重启网关，更新 Hermes，如果会话被 WhatsApp 协议更改作废则重新配对。 |
| **WhatsApp 更新后机器人停止工作** | 更新 Hermes 以获取最新桥接版本，然后重新配对。 |
| **macOS: "Node.js not installed" 但 node 在终端中可用** | launchd 服务不继承您的 shell PATH。运行 `hermes gateway install` 以将您当前的 PATH 重新快照到 plist，然后 `hermes gateway start`。参见 [网关服务文档](./index.md#macos-launchd) 的详细信息。 |
| **消息未收到** | 验证 `WHATSAPP_ALLOWED_USERS` 包含发送者的号码（带国家代码，无 `+` 或空格），或设置为 `*` 以允许所有人。在 `.env` 中设置 `WHATSAPP_DEBUG=true` 并重启网关以在 `bridge.log` 中查看原始消息事件。 |
| **机器人用配对码回复陌生人** | 如果您希望未授权的 DM 被静默忽略，请在 `~/.hermes/config.yaml` 中设置 `whatsapp.unauthorized_dm_behavior: ignore`。 |

---

## 安全

:::warning
**在上线前配置访问控制。** 使用特定电话号码设置 `WHATSAPP_ALLOWED_USERS`（包括国家代码，不带 `+`），使用 `*` 允许所有人，或设置 `WHATSAPP_ALLOW_ALL_USERS=true`。没有这些，网关**作为安全措施拒绝所有传入消息**。
:::

默认情况下，未授权的 DM 仍会收到配对码回复。如果您希望私人 WhatsApp 号码对陌生人完全沉默，请设置：

```yaml
whatsapp:
  unauthorized_dm_behavior: ignore
```

- `~/.hermes/platforms/whatsapp/session` 目录包含完整会话凭证——像密码一样保护它
- 设置文件权限：`chmod 700 ~/.hermes/platforms/whatsapp/session`
- 为机器人使用**专用电话号码**以将风险与您的个人账户隔离
- 如果怀疑被泄露，从 WhatsApp → 设置 → 关联的设备取消链接设备
- 日志中的电话号码会被部分编辑，但请查看您的日志保留策略
