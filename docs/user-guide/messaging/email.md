---
sidebar_position: 7
title: "Email"
description: "通过 IMAP/SMTP 将 Hermes Agent 设置为电子邮件助手"
---

# Email 设置

Hermes 可以使用标准 IMAP 和 SMTP 协议接收和回复电子邮件。将电子邮件发送到代理的地址，它会在线程中回复 — 无需特殊客户端或机器人 API。适用于 Gmail、Outlook、Yahoo、Fastmail 或任何支持 IMAP/SMTP 的提供商。

:::info 无外部依赖
Email 适配器使用 Python 内置的 `imaplib`、`smtplib` 和 `email` 模块。无需额外的包或外部服务。
:::

---

## 前置要求

- **一个专用的 Hermes 代理电子邮件账户**（不要使用您的个人邮箱）
- 在电子邮件账户上**启用 IMAP**
- 如果使用 Gmail 或其他启用 2FA 的提供商，则需要**应用密码**

### Gmail 设置

1. 在您的 Google 账户上启用双因素身份验证
2. 进入 [应用密码](https://myaccount.google.com/apppasswords)
3. 创建新的应用密码（选择"邮件"或其他）
4. 复制 16 个字符的密码 — 您将使用它而不是常规密码

### Outlook / Microsoft 365

1. 进入 [安全设置](https://account.microsoft.com/security)
2. 如果尚未激活，请启用 2FA
3. 在"其他安全选项"下创建应用密码
4. IMAP 主机：`outlook.office365.com`，SMTP 主机：`smtp.office365.com`

### 其他提供商

大多数电子邮件提供商支持 IMAP/SMTP。请查看您的提供商文档了解：
- IMAP 主机和端口（通常使用 SSL 的 993 端口）
- SMTP 主机和端口（通常使用 STARTTLS 的 587 端口）
- 是否需要应用密码

---

## 步骤 1：配置 Hermes

最简单的方式：

```bash
hermes gateway setup
```

从平台菜单中选择 **Email**。向导会提示您输入电子邮件地址、密码、IMAP/SMTP 主机和允许的发件人。

### 手动配置

添加到 `~/.hermes/.env`：

```bash
# 必需
EMAIL_ADDRESS=hermes@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop    # 应用密码（不是您的常规密码）
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_SMTP_HOST=smtp.gmail.com

# 安全（推荐）
EMAIL_ALLOWED_USERS=your@email.com,colleague@work.com

# 可选
EMAIL_IMAP_PORT=993                    # 默认：993（IMAP SSL）
EMAIL_SMTP_PORT=587                    # 默认：587（SMTP STARTTLS）
EMAIL_POLL_INTERVAL=15                 # 收件箱检查之间的秒数（默认：15）
EMAIL_HOME_ADDRESS=your@email.com      # cron 作业的默认投递目标
```

---

## 步骤 2：启动网关

```bash
hermes gateway              # 在前台运行
hermes gateway install      # 安装为用户服务
sudo hermes gateway install --system   # 仅 Linux：启动时系统服务
```

启动时，适配器：
1. 测试 IMAP 和 SMTP 连接
2. 将所有现有收件箱消息标记为"已读"（仅处理新电子邮件）
3. 开始轮询新消息

---

## 工作原理

### 接收消息

适配器以可配置的间隔（默认：15 秒）在 IMAP 收件箱中轮询 UNSEEN 消息。对于每封新邮件：

- **主题行** 作为上下文包含（例如 `[Subject: 部署到生产环境]`）
- **回复邮件**（以 `Re:` 开头的主题）跳过主题前缀 — 线程上下文已建立
- **附件** 在本地缓存：
  - 图片（JPEG、PNG、GIF、WebP）→ 可用于视觉工具
  - 文档（PDF、ZIP 等）→ 可用于文件访问
- **仅 HTML 邮件** 剥离标签以提取纯文本
- **自身消息** 被过滤以防止回复循环
- **自动/无回复发件人** 被静默忽略 — `noreply@`、`mailer-daemon@`、`bounce@`、`no-reply@`，以及带有 `Auto-Submitted`、`Precedence: bulk` 或 `List-Unsubscribe` 头的电子邮件

### 发送回复

回复通过 SMTP 发送，并带有正确的电子邮件线程：

- **In-Reply-To** 和 **References** 头保持线程
- **主题行** 保留 `Re:` 前缀（不会双重添加 `Re: Re:`）
- 使用代理域生成 **Message-ID**
- 响应以纯文本（UTF-8）发送

### 文件附件

代理可以在回复中发送文件附件。在回复中包含 `MEDIA:/path/to/file`，文件会附加到外发电子邮件。

### 跳过附件

要忽略所有传入附件（出于恶意软件保护或节省带宽），请添加到您的 `config.yaml`：

```yaml
platforms:
  email:
    skip_attachments: true
```

启用后，附件和内联部分在有效载荷解码之前被跳过。电子邮件正文文本仍正常处理。

---

## 访问控制

电子邮件访问遵循与所有其他 Hermes 平台相同的模式：

1. **`EMAIL_ALLOWED_USERS` 已设置** → 仅处理来自这些地址的电子邮件
2. **未设置白名单** → 未知发件人获得配对码
3. **`EMAIL_ALLOW_ALL_USERS=true`** → 接受任何发件人（谨慎使用）

:::warning
**始终配置 `EMAIL_ALLOWED_USERS`。** 没有它，知道代理电子邮件地址的任何人都可以发送命令。代理默认具有终端访问权限。
:::

---

## 故障排除

| 问题 | 解决方案 |
|--------|----------|
| 启动时 **"IMAP connection failed"** | 验证 `EMAIL_IMAP_HOST` 和 `EMAIL_IMAP_PORT`。确保在账户上启用了 IMAP。对于 Gmail，在设置 → 转发和 POP/IMAP 中启用。 |
| 启动时 **"SMTP connection failed"** | 验证 `EMAIL_SMTP_HOST` 和 `EMAIL_SMTP_PORT`。检查您的密码是否正确（对于 Gmail，使用应用密码而不是常规密码）。 |
| **未收到消息** | 检查 `EMAIL_ALLOWED_USERS` 包含发件人的电子邮件。检查垃圾邮件文件夹 — 某些提供商会将自动回复标记。 |
| **"Authentication failed"** | 对于 Gmail，您必须使用应用密码，而不是常规密码。首先确保 2FA 已启用。 |
| **重复回复** | 确保只有一个网关实例在运行。检查 `hermes gateway status`。 |
| **响应慢** | 默认轮询间隔为 15 秒。使用 `EMAIL_POLL_INTERVAL=5` 加快响应速度（但会产生更多 IMAP 连接）。 |
| **回复未线程化** | 适配器使用 In-Reply-To 头。某些电子邮件客户端（尤其是基于网页的）可能无法正确线程化自动消息。 |

---

## 安全性

:::warning
**使用专用电子邮件账户。** 不要使用您的个人邮箱 — 代理将密码存储在 `.env` 中，并通过 IMAP 拥有完整的收件箱访问权限。
:::

- 使用**应用密码**而不是您的主密码（对于启用 2FA 的 Gmail 是必需的）
- 设置 `EMAIL_ALLOWED_USERS` 以限制谁可以与代理交互
- 密码存储在 `~/.hermes/.env` — 保护此文件（`chmod 600`）
- IMAP 使用 SSL（端口 993），SMTP 使用 STARTTLS（端口 587）— 连接已加密

---

## 环境变量参考

| 变量 | 必需 | 默认 | 描述 |
|----------|----------|---------|-------------|
| `EMAIL_ADDRESS` | 是 | — | 代理的电子邮件地址 |
| `EMAIL_PASSWORD` | 是 | — | 电子邮件密码或应用密码 |
| `EMAIL_IMAP_HOST` | 是 | — | IMAP 服务器主机（例如 `imap.gmail.com`） |
| `EMAIL_SMTP_HOST` | 是 | — | SMTP 服务器主机（例如 `smtp.gmail.com`） |
| `EMAIL_IMAP_PORT` | 否 | `993` | IMAP 服务器端口 |
| `EMAIL_SMTP_PORT` | 否 | `587` | SMTP 服务器端口 |
| `EMAIL_POLL_INTERVAL` | 否 | `15` | 收件箱检查之间的秒数 |
| `EMAIL_ALLOWED_USERS` | 否 | — | 逗号分隔的允许发件人地址 |
| `EMAIL_HOME_ADDRESS` | 否 | — | cron 作业的默认投递目标 |
| `EMAIL_ALLOW_ALL_USERS` | 否 | `false` | 允许所有发件人（不推荐） |
