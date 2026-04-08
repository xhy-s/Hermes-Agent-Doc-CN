---
sidebar_position: 4
title: "教程：团队 Telegram 助手"
description: "分步指南：设置可供整个团队使用的 Telegram 机器人，用于代码帮助、研究、系统管理等"
---

# 设置团队 Telegram 助手

本教程带您设置一个由 Hermes Agent 驱动的 Telegram 机器人，多个团队成员都可以使用。完成后，你的团队将拥有一个共享的 AI 助手，他们可以发送消息寻求代码、研究、系统管理等方面的帮助——通过每用户授权保护。

## 我们要构建什么

一个 Telegram 机器人，具有以下功能：

- **任何授权的团队成员**都可以 DM 寻求帮助——代码审查、研究、shell 命令、调试
- **在你的服务器上运行**——拥有完整工具访问权限：终端、文件编辑、网络搜索、代码执行
- **每用户会话**——每个人获得自己的对话上下文
- **默认安全**——只有批准的用户可以交互，提供两种授权方法
- **计划任务**——每日站会、健康检查和提醒投递到团队频道

---

## 前提条件

开始之前，确保你拥有：

- **在服务器或 VPS 上安装 Hermes Agent**（不是你的笔记本电脑——机器人需要保持运行）。如果尚未安装，请遵循[安装指南](/docs/getting-started/installation)。
- **你自己的 Telegram 账户**（机器人所有者）
- **配置了 LLM 提供商**——在 `~/.hermes/.env` 中至少设置 OpenAI、Anthropic 或其他支持提供商的 API 密钥

:::tip
每月 5 美元的 VPS 足以运行网关。Hermes 本身很轻量——LLM API 调用才是花钱的地方，那些远程发生。
:::

---

## 步骤 1: 创建 Telegram 机器人

每个 Telegram 机器人从 **@BotFather** 开始——Telegram 官方创建机器人的 bot。

1. **打开 Telegram** 并搜索 `@BotFather`，或前往 [t.me/BotFather](https://t.me/BotFather)

2. **发送 `/newbot`** — BotFather 会问你两件事：
   - **显示名称** — 用户看到的名称（例如 `Team Hermes Assistant`）
   - **用户名** — 必须以 `bot` 结尾（例如 `myteam_hermes_bot`）

3. **复制机器人 token** — BotFather 回复类似：
   ```
   Use this token to access the HTTP API:
   7123456789:AAH1bGciOiJSUzI1NiIsInR5cCI6Ikp...
   ```
   保存此 token——下一步需要。

4. **设置描述**（可选但推荐）：
   ```
   /setdescription
   ```
   选择你的机器人，然后输入类似：
   ```
   Team AI assistant powered by Hermes Agent. DM me for help with code, research, debugging, and more.
   ```

5. **设置机器人命令**（可选——给用户命令菜单）：
   ```
   /setcommands
   ```
   选择你的机器人，然后粘贴：
   ```
   new - Start a fresh conversation
   model - Show or change the AI model
   status - Show session info
   help - Show available commands
   stop - Stop the current task
   ```

:::warning
保持你的机器人 token 机密。拥有 token 的任何人都可以控制机器人。如果泄露了，在 BotFather 中使用 `/revoke` 生成新的。
:::

---

## 步骤 2: 配置网关

有两个选项：交互式设置向导（推荐）或手动配置。

### 选项 A: 交互式设置（推荐）

```bash
hermes gateway setup
```

这会通过方向键选择引导你完成一切。选择 **Telegram**，粘贴你的机器人 token，并在提示时输入你的用户 ID。

### 选项 B: 手动配置

将这些行添加到 `~/.hermes/.env`：

```bash
# Telegram bot token from BotFather
TELEGRAM_BOT_TOKEN=7123456789:AAH1bGciOiJSUzI1NiIsInR5cCI6Ikp...

# Your Telegram user ID (numeric)
TELEGRAM_ALLOWED_USERS=123456789
```

### 查找你的用户 ID

你的 Telegram 用户 ID 是一个数字值（不是你的用户名）。查找方法：

1. 在 Telegram 上向 [@userinfobot](https://t.me/userinfobot) 发消息
2. 它会立即回复你的数字用户 ID
3. 将该数字复制到 `TELEGRAM_ALLOWED_USERS`

:::info
Telegram 用户 ID 是像 `123456789` 这样的永久数字。它们与可能变化的 `@username` 不同。始终使用数字 ID 进行白名单。
:::

---

## 步骤 3: 启动网关

### 快速测试

首先在前台运行网关以确保一切正常：

```bash
hermes gateway
```

你应该看到类似输出：

```
[Gateway] Starting Hermes Gateway...
[Gateway] Telegram adapter connected
[Gateway] Cron scheduler started (tick every 60s)
```

打开 Telegram，找到你的机器人并发送消息。如果它回复，你就在营业了。按 `Ctrl+C` 停止。

### 生产环境：安装为服务

为持久化部署（重启后依然运行）：

```bash
hermes gateway install
sudo hermes gateway install --system   # Linux only: boot-time system service
```

这创建一个后台服务：Linux 上默认为用户级 **systemd** 服务，macOS 上为 **launchd** 服务，或者如果你传递 `--system` 则为启动时 Linux 系统服务。

```bash
# Linux — 管理默认用户服务
hermes gateway start
hermes gateway stop
hermes gateway status

# 查看实时日志
journalctl --user -u hermes-gateway -f

# SSH 登出后保持运行
sudo loginctl enable-linger $USER

# Linux 服务器 — 明确的系统服务命令
sudo hermes gateway start --system
sudo hermes gateway status --system
journalctl -u hermes-gateway -f
```

```bash
# macOS — 管理服务
hermes gateway start
hermes gateway stop
tail -f ~/.hermes/logs/gateway.log
```

:::tip macOS PATH
launchd plist 在安装时捕获你的 shell PATH，这样网关子进程可以找到 Node.js 和 ffmpeg 等工具。如果稍后安装新工具，重新运行 `hermes gateway install` 以更新 plist。
:::

### 验证正在运行

```bash
hermes gateway status
```

然后向你的 Telegram 机器人发送测试消息。你应该在几秒钟内收到回复。

---

## 步骤 4: 设置团队访问

现在让我们给你的队友访问权限。有两种方法。

### 方法 A: 静态白名单

收集每个团队成员的 Telegram 用户 ID（让他们向 [@userinfobot](https://t.me/userinfobot) 发消息），然后以逗号分隔列表添加：

```bash
# In ~/.hermes/.env
TELEGRAM_ALLOWED_USERS=123456789,987654321,555555555
```

更改后重启网关：

```bash
hermes gateway stop && hermes gateway start
```

### 方法 B: DM 配对（推荐用于团队）

DM 配对更灵活——你不需要预先收集用户 ID。工作原理如下：

1. **队友 DM 机器人** — 因为他们不在白名单上，机器人回复一个一次性配对码：
   ```
   🔐 Pairing code: XKGH5N7P
   Send this code to the bot owner for approval.
   ```

2. **队友通过任何渠道向你发送代码**（Slack、email、当面）

3. **你在服务器上批准**：
   ```bash
   hermes pairing approve telegram XKGH5N7P
   ```

4. **他们就进来了** — 机器人立即开始响应他们的消息

**管理已配对用户：**

```bash
# 查看所有待处理和已批准的用户
hermes pairing list

# 撤销某人的访问权限
hermes pairing revoke telegram 987654321

# 清除过期的待处理代码
hermes pairing clear-pending
```

:::tip
DM 配对是团队的理想选择，因为添加新用户时不需要重启网关。批准立即生效。
:::

### 安全注意事项

- **永远不要在具有终端访问的机器人上设置 `GATEWAY_ALLOW_ALL_USERS=true`** — 任何找到你机器人的人都可以在你的服务器上运行命令
- 配对码在 **1 小时**后过期，使用加密随机性
- 速率限制防止暴力攻击：每个用户每 10 分钟 1 次请求，每个平台最多 3 个待处理代码
- 5 次失败批准尝试后，平台进入 1 小时锁定
- 所有配对数据以 `chmod 0600` 权限存储

---

## 步骤 5: 配置机器人

### 设置主页频道

**主页频道**是机器人投递 cron 任务结果和主动消息的地方。没有主页，计划任务无处发送输出。

**选项 1：** 在机器人所在的任何 Telegram 群组或聊天中使用 `/sethome` 命令。

**选项 2：** 在 `~/.hermes/.env` 中手动设置：

```bash
TELEGRAM_HOME_CHANNEL=-1001234567890
TELEGRAM_HOME_CHANNEL_NAME="Team Updates"
```

要查找频道 ID，将 [@userinfobot](https://t.me/userinfobot) 添加到群组——它会报告群组的聊天 ID。

### 配置工具进度显示

控制使用工具时显示的细节。在 `~/.hermes/config.yaml` 中：

```yaml
display:
  tool_progress: new    # off | new | all | verbose
```

| 模式 | 你看到的内容 |
|------|-------------|
| `off` | 仅清洁响应——无工具活动 |
| `new` | 每个新工具调用的简要状态（推荐用于消息） |
| `all` | 每个工具调用及其详情 |
| `verbose` | 包含命令结果的完整工具输出 |

用户也可以在聊天中使用 `/verbose` 命令更改此设置。

### 使用 SOUL.md 设置人格

通过编辑 `~/.hermes/SOUL.md` 自定义机器人通信方式：

有关完整指南，请参见 [在 Hermes 中使用 SOUL.md](/docs/guides/use-soul-with-hermes)。

```markdown
# Soul
You are a helpful team assistant. Be concise and technical.
Use code blocks for any code. Skip pleasantries — the team
values directness. When debugging, always ask for error logs
before guessing at solutions.
```

### 添加项目上下文

如果你的团队处理特定项目，创建上下文文件以便机器人了解你的技术栈：

```markdown
<!-- ~/.hermes/AGENTS.md -->
# Team Context
- We use Python 3.12 with FastAPI and SQLAlchemy
- Frontend is React with TypeScript
- CI/CD runs on GitHub Actions
- Production deploys to AWS ECS
- Always suggest writing tests for new code
```

:::info
上下文文件被注入每个会话的系统提示。保持简洁——每个字符都计入你的 token 预算。
:::

---

## 步骤 6: 设置计划任务

网关运行后，你可以安排定期任务，将结果投递到你的团队频道。

### 每日站会摘要

在 Telegram 上向机器人发消息：

```
Every weekday at 9am, check the GitHub repository at
github.com/myorg/myproject for:
1. Pull requests opened/merged in the last 24 hours
2. Issues created or closed
3. Any CI/CD failures on the main branch
Format as a brief standup-style summary.
```

代理自动创建 cron 任务并将结果投递到你询问的聊天（或主页频道）。

### 服务器健康检查

```
Every 6 hours, check disk usage with 'df -h', memory with 'free -h',
and Docker container status with 'docker ps'. Report anything unusual —
partitions above 80%, containers that have restarted, or high memory usage.
```

### 管理计划任务

```bash
# 从 CLI
hermes cron list          # 查看所有计划任务
hermes cron status        # 检查调度器是否运行

# 从 Telegram 聊天
/cron list                # 查看任务
/cron remove <job_id>     # 删除任务
```

:::warning
Cron 任务提示在完全新鲜会话中运行，没有先前对话的记忆。确保每个提示包含代理需要的**所有**上下文——文件路径、URL、服务器地址和清晰指令。
:::

---

## 生产技巧

### 使用 Docker 确保安全

在共享团队机器人上，使用 Docker 作为终端后端，这样代理命令在容器中运行而不是在你的主机上：

```bash
# In ~/.hermes/.env
TERMINAL_BACKEND=docker
TERMINAL_DOCKER_IMAGE=nikolaik/python-nodejs:python3.11-nodejs20
```

或在 `~/.hermes/config.yaml` 中：

```yaml
terminal:
  backend: docker
  container_cpu: 1
  container_memory: 5120
  container_persistent: true
```

这样，即使有人要求机器人运行破坏性操作，你的主机系统也受到保护。

### 监控网关

```bash
# 检查网关是否运行
hermes gateway status

# 查看实时日志（Linux）
journalctl --user -u hermes-gateway -f

# 查看实时日志（macOS）
tail -f ~/.hermes/logs/gateway.log
```

### 保持 Hermes 更新

从 Telegram，发送 `/update` 给机器人——它会拉取最新版本并重启。或从服务器：

```bash
hermes update
hermes gateway stop && hermes gateway start
```

### 日志位置

| 内容 | 位置 |
|------|----------|
| 网关日志 | `journalctl --user -u hermes-gateway`（Linux）或 `~/.hermes/logs/gateway.log`（macOS） |
| Cron 任务输出 | `~/.hermes/cron/output/{job_id}/{timestamp}.md` |
| Cron 任务定义 | `~/.hermes/cron/jobs.json` |
| 配对数据 | `~/.hermes/pairing/` |
| 会话历史 | `~/.hermes/sessions/` |

---

## 进一步探索

你已经拥有了一个可用的团队 Telegram 助手。以下是下一步：

- **[安全指南](/docs/user-guide/security)** — 深度研究授权、容器隔离和命令审批
- **[消息网关](/docs/user-guide/messaging)** — 网关架构、会话管理和聊天命令的完整参考
- **[Telegram 设置](/docs/user-guide/messaging/telegram)** — 平台特定详情，包括语音消息和 TTS
- **[计划任务](/docs/user-guide/features/cron)** — 带投递选项和 cron 表达式的高级 cron 调度
- **[上下文文件](/docs/user-guide/features/context-files)** — 项目知识的 AGENTS.md、SOUL.md 和 .cursorrules
- **[人格](/docs/user-guide/features/personality)** — 内置人格预设和自定义角色定义
- **添加更多平台** — 同一网关可以同时运行 [Discord](/docs/user-guide/messaging/discord)、[Slack](/docs/user-guide/messaging/slack) 和 [WhatsApp](/docs/user-guide/messaging/whatsapp)

---

*有问题或问题？在 GitHub 上开 issue——欢迎贡献。*
