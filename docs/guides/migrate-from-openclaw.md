---
sidebar_position: 10
title: "从 OpenClaw 迁移"
description: "将 OpenClaw / Clawdbot 设置迁移到 Hermes Agent 的完整指南——迁移内容、配置映射和迁移后检查项"
---

# 从 OpenClaw 迁移

`hermes claw migrate` 将你的 OpenClaw（或遗留的 Clawdbot/Moldbot）设置导入 Hermes。本指南涵盖确切迁移内容、配置键映射和迁移后验证项。

## 快速开始

```bash
# 预览会发生什么（不更改任何文件）
hermes claw migrate --dry-run

# 运行迁移（默认排除密钥）
hermes claw migrate

# 完整迁移，包括 API 密钥
hermes claw migrate --preset full
```

迁移默认从 `~/.openclaw/` 读取。如果你仍有遗留的 `~/.clawdbot/` 或 `~/.moldbot/` 目录，会自动检测。遗留配置文件名（`clawdbot.json`、`moldbot.json`）也一样。

## 选项

| 选项 | 描述 |
|--------|-------------|
| `--dry-run` | 预览将被迁移的内容，不写入任何内容。 |
| `--preset <name>` | `full`（默认，包含密钥）或 `user-data`（排除 API 密钥）。 |
| `--overwrite` | 冲突时覆盖现有 Hermes 文件（默认：跳过）。 |
| `--migrate-secrets` | 包含 API 密钥（`--preset full` 时默认启用）。 |
| `--source <path>` | 自定义 OpenClaw 目录。 |
| `--workspace-target <path>` | 放置 `AGENTS.md` 的位置。 |
| `--skill-conflict <mode>` | `skip`（默认）、`overwrite` 或 `rename`。 |
| `--yes` | 跳过确认提示。 |

## 迁移内容

### 角色、记忆和指令

| 内容 | OpenClaw 源 | Hermes 目标 | 备注 |
|------|----------------|-------------------|-------|
| Persona | `workspace/SOUL.md` | `~/.hermes/SOUL.md` | 直接复制 |
| Workspace 指令 | `workspace/AGENTS.md` | `--workspace-target` 中的 `AGENTS.md` | 需要 `--workspace-target` 标志 |
| 长期记忆 | `workspace/MEMORY.md` | `~/.hermes/memories/MEMORY.md` | 解析为条目，与现有合并、去重。使用 `§` 分隔符。 |
| 用户配置 | `workspace/USER.md` | `~/.hermes/memories/USER.md` | 与记忆相同的条目合并逻辑。 |
| 每日记忆文件 | `workspace/memory/*.md` | `~/.hermes/memories/MEMORY.md` | 所有每日文件合并到主记忆。 |

所有 workspace 文件也检查 `workspace.default/` 作为回退路径。

### 技能（4 个来源）

| 源 | OpenClaw 位置 | Hermes 目标 |
|--------|------------------|-------------------|
| Workspace 技能 | `workspace/skills/` | `~/.hermes/skills/openclaw-imports/` |
| 托管/共享技能 | `~/.openclaw/skills/` | `~/.hermes/skills/openclaw-imports/` |
| 个人跨项目 | `~/.agents/skills/` | `~/.hermes/skills/openclaw-imports/` |
| 项目级共享 | `workspace/.agents/skills/` | `~/.hermes/skills/openclaw-imports/` |

技能冲突由 `--skill-conflict` 处理：`skip` 保留现有 Hermes 技能，`overwrite` 替换它，`rename` 创建 `-imported` 副本。

### 模型和提供商配置

| 内容 | OpenClaw 配置路径 | Hermes 目标 | 备注 |
|------|---------------------|-------------------|-------|
| 默认模型 | `agents.defaults.model` | `config.yaml` → `model` | 可以是字符串或 `{primary, fallbacks}` 对象 |
| 自定义提供商 | `models.providers.*` | `config.yaml` → `custom_providers` | 映射 `baseUrl`、`apiType`（"openai"→"chat_completions"、"anthropic"→"anthropic_messages"） |
| 提供商 API 密钥 | `models.providers.*.apiKey` | `~/.hermes/.env` | 需要 `--migrate-secrets`。参见下面的 [API 密钥解析](#api-key-resolution)。 |

### 代理行为

| 内容 | OpenClaw 配置路径 | Hermes 配置路径 | 映射 |
|------|---------------------|-------------------|---------|
| 最大轮次 | `agents.defaults.timeoutSeconds` | `agent.max_turns` | `timeoutSeconds / 10`，上限为 200 |
| 详细模式 | `agents.defaults.verboseDefault` | `agent.verbose` | "off" / "on" / "full" |
| 推理努力 | `agents.defaults.thinkingDefault` | `agent.reasoning_effort` | "always"/"high" → "high", "auto"/"medium" → "medium", "off"/"low"/"none"/"minimal" → "low" |
| 压缩 | `agents.defaults.compaction.mode` | `compression.enabled` | "off" → false，其他 → true |
| 压缩模型 | `agents.defaults.compaction.model` | `compression.summary_model` | 直接字符串复制 |
| 人工延迟 | `agents.defaults.humanDelay.mode` | `human_delay.mode` | "natural" / "custom" / "off" |
| 人工延迟时间 | `agents.defaults.humanDelay.minMs` / `.maxMs` | `human_delay.min_ms` / `.max_ms` | 直接复制 |
| 时区 | `agents.defaults.userTimezone` | `timezone` | 直接字符串复制 |
| Exec 超时 | `tools.exec.timeoutSec` | `terminal.timeout` | 直接复制（字段是 `timeoutSec`，不是 `timeout`） |
| Docker 沙箱 | `agents.defaults.sandbox.backend` | `terminal.backend` | "docker" → "docker" |
| Docker 镜像 | `agents.defaults.sandbox.docker.image` | `terminal.docker_image` | 直接复制 |

### 会话重置策略

| OpenClaw 配置路径 | Hermes 配置路径 | 备注 |
|---------------------|-------------------|-------|
| `session.reset.mode` | `session_reset.mode` | "daily"、"idle" 或两者 |
| `session.reset.atHour` | `session_reset.at_hour` | 每日重置的小时（0–23） |
| `session.reset.idleMinutes` | `session_reset.idle_minutes` | 不活动分钟数 |

注意：OpenClaw 也有 `session.resetTriggers`（一个简单字符串数组如 `["daily", "idle"]`）。如果不存在结构化 `session.reset`，迁移会回退到从 `resetTriggers` 推断。

### MCP 服务器

| OpenClaw 字段 | Hermes 字段 | 备注 |
|----------------|-------------|-------|
| `mcp.servers.*.command` | `mcp_servers.*.command` | Stdio 传输 |
| `mcp.servers.*.args` | `mcp_servers.*.args` | |
| `mcp.servers.*.env` | `mcp_servers.*.env` | |
| `mcp.servers.*.cwd` | `mcp_servers.*.cwd` | |
| `mcp.servers.*.url` | `mcp_servers.*.url` | HTTP/SSE 传输 |
| `mcp.servers.*.tools.include` | `mcp_servers.*.tools.include` | 工具过滤 |
| `mcp.servers.*.tools.exclude` | `mcp_servers.*.tools.exclude` | |

### TTS（文本转语音）

TTS 设置从**两个** OpenClaw 配置位置读取，优先级如下：

1. `messages.tts.providers.{provider}.*`（规范位置）
2. 顶层 `talk.providers.{provider}.*`（回退）
3. 遗留扁平键 `messages.tts.{provider}.*`（最旧格式）

| 内容 | Hermes 目标 |
|------|-------------------|
| 提供商名称 | `config.yaml` → `tts.provider` |
| ElevenLabs 语音 ID | `config.yaml` → `tts.elevenlabs.voice_id` |
| ElevenLabs 模型 ID | `config.yaml` → `tts.elevenlabs.model_id` |
| OpenAI 模型 | `config.yaml` → `tts.openai.model` |
| OpenAI 语音 | `config.yaml` → `tts.openai.voice` |
| Edge TTS 语音 | `config.yaml` → `tts.edge.voice` |
| TTS 资产 | `~/.hermes/tts/`（文件复制） |

### 消息平台

| 平台 | OpenClaw 配置路径 | Hermes `.env` 变量 | 备注 |
|----------|---------------------|----------------------|-------|
| Telegram | `channels.telegram.botToken` | `TELEGRAM_BOT_TOKEN` | Token 可以是字符串或 [SecretRef](#secretref-handling) |
| Telegram | `credentials/telegram-default-allowFrom.json` | `TELEGRAM_ALLOWED_USERS` | 从 `allowFrom[]` 数组逗号连接 |
| Discord | `channels.discord.token` | `DISCORD_BOT_TOKEN` | |
| Discord | `channels.discord.allowFrom` | `DISCORD_ALLOWED_USERS` | |
| Slack | `channels.slack.botToken` | `SLACK_BOT_TOKEN` | |
| Slack | `channels.slack.appToken` | `SLACK_APP_TOKEN` | |
| Slack | `channels.slack.allowFrom` | `SLACK_ALLOWED_USERS` | |
| WhatsApp | `channels.whatsapp.allowFrom` | `WHATSAPP_ALLOWED_USERS` | 通过 Baileys QR 配对认证（非 token） |
| Signal | `channels.signal.account` | `SIGNAL_ACCOUNT` | |
| Signal | `channels.signal.httpUrl` | `SIGNAL_HTTP_URL` | |
| Signal | `channels.signal.allowFrom` | `SIGNAL_ALLOWED_USERS` | |
| Matrix | `channels.matrix.botToken` | `MATRIX_ACCESS_TOKEN` | 通过 deep-channels 迁移 |
| Mattermost | `channels.mattermost.botToken` | `MATTERMOST_BOT_TOKEN` | 通过 deep-channels 迁移 |

### 其他配置

| 内容 | OpenClaw 路径 | Hermes 路径 | 备注 |
|------|-------------|-------------|-------|
| 审批模式 | `approvals.exec.mode` | `config.yaml` → `approvals.mode` | "auto"→"off", "always"→"manual", "smart"→"smart" |
| 命令白名单 | `exec-approvals.json` | `config.yaml` → `command_allowlist` | 模式合并去重 |
| 浏览器 CDP URL | `browser.cdpUrl` | `config.yaml` → `browser.cdp_url` | |
| 浏览器无头 | `browser.headless` | `config.yaml` → `browser.headless` | |
| Brave 搜索密钥 | `tools.web.search.brave.apiKey` | `.env` → `BRAVE_API_KEY` | 需要 `--migrate-secrets` |
| 网关认证令牌 | `gateway.auth.token` | `.env` → `HERMES_GATEWAY_TOKEN` | 需要 `--migrate-secrets` |
| 工作目录 | `agents.defaults.workspace` | `.env` → `MESSAGING_CWD` | |

### 已归档（无直接 Hermes 等效项）

这些保存到 `~/.hermes/migration/openclaw/<timestamp>/archive/` 供手动处理：

| 内容 | 归档文件 | 在 Hermes 中如何重新创建 |
|------|-------------|--------------------------|
| `IDENTITY.md` | `archive/workspace/IDENTITY.md` | 合并到 `SOUL.md` |
| `TOOLS.md` | `archive/workspace/TOOLS.md` | Hermes 有内置工具指令 |
| `HEARTBEAT.md` | `archive/workspace/HEARTBEAT.md` | 使用 cron 任务进行定期任务 |
| `BOOTSTRAP.md` | `archive/workspace/BOOTSTRAP.md` | 使用上下文文件或技能 |
| Cron 任务 | `archive/cron-config.json` | 使用 `hermes cron create` 重新创建 |
| 插件 | `archive/plugins-config.json` | 参见[插件指南](/docs/user-guide/features/hooks) |
| Hooks/Webhooks | `archive/hooks-config.json` | 使用 `hermes webhook` 或网关 hooks |
| 记忆后端 | `archive/memory-backend-config.json` | 通过 `hermes honcho` 配置 |
| 技能注册表 | `archive/skills-registry-config.json` | 使用 `hermes skills config` |
| UI/身份 | `archive/ui-identity-config.json` | 使用 `/skin` 命令 |
| 日志记录 | `archive/logging-diagnostics-config.json` | 在 `config.yaml` 日志部分设置 |
| 多代理列表 | `archive/agents-list.json` | 使用 Hermes profiles |
| 通道绑定 | `archive/bindings.json` | 每个平台手动设置 |
| 复杂通道 | `archive/channels-deep-config.json` | 手动平台配置 |

## API 密钥解析

启用 `--migrate-secrets` 时，API 密钥从**三个来源**按优先级收集：

1. **配置值** — `openclaw.json` 中的 `models.providers.*.apiKey` 和 TTS 提供商密钥
2. **环境文件** — `~/.openclaw/.env`（类似 `OPENROUTER_API_KEY`、`ANTHROPIC_API_KEY` 等的密钥）
3. **认证配置文件** — `~/.openclaw/agents/main/agent/auth-profiles.json`（每个代理的凭证）

配置值优先。`.env` 填补任何空白。认证配置文件填充剩余内容。

### 支持的密钥目标

`OPENROUTER_API_KEY`、`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`DEEPSEEK_API_KEY`、`GEMINI_API_KEY`、`ZAI_API_KEY`、`MINIMAX_API_KEY`、`ELEVENLABS_API_KEY`、`TELEGRAM_BOT_TOKEN`、`VOICE_TOOLS_OPENAI_KEY`

不在此白名单中的密钥永远不会被复制。

## SecretRef 处理

OpenClaw 配置中 token 和 API 密钥的格式有三种：

```json
// Plain string
"channels": { "telegram": { "botToken": "123456:ABC-DEF..." } }

// Environment template
"channels": { "telegram": { "botToken": "${TELEGRAM_BOT_TOKEN}" } }

// SecretRef object
"channels": { "telegram": { "botToken": { "source": "env", "id": "TELEGRAM_BOT_TOKEN" } } }
```

迁移解析所有三种格式。对于 `source: "env"` 的环境模板和 SecretRef 对象，它在 `~/.openclaw/.env` 中查找值。对于 `source: "file"` 或 `source: "exec"` 的 SecretRef 对象无法自动解析——这些值必须在迁移后手动添加到 Hermes。

## 迁移后

1. **检查迁移报告** — 完成后打印，包含迁移、跳过和冲突项目的计数。

2. **审查归档文件** — `~/.hermes/migration/openclaw/<timestamp>/archive/` 中的任何内容都需要手动处理。

3. **验证 API 密钥** — 运行 `hermes status` 检查提供商身份验证。

4. **测试消息传递** — 如果迁移了平台令牌，重启网关：`systemctl --user restart hermes-gateway`

5. **检查会话策略** — 验证 `hermes config get session_reset` 符合你的预期。

6. **重新配对 WhatsApp** — WhatsApp 使用 QR 码配对（Baileys），不是令牌迁移。运行 `hermes whatsapp` 配对。

## 故障排除

### "OpenClaw 目录未找到"

迁移检查 `~/.openclaw/`、`~/.clawdbot/`、`~/.moldbot/`。如果你的安装在其他位置，使用 `--source /path/to/your/openclaw`。

### "未找到提供商 API 密钥"

密钥可能在 `.env` 文件中而不是 `openclaw.json` 中。迁移检查两者——确保 `~/.openclaw/.env` 存在且包含密钥。如果密钥使用 `source: "file"` 或 `source: "exec"` SecretRef，则无法自动解析。

### 迁移后技能未出现

导入的技能位于 `~/.hermes/skills/openclaw-imports/`。启动新会话以使其生效，或运行 `/skills` 验证它们已加载。

### TTS 语音未迁移

OpenClaw 在两个地方存储 TTS 设置：`messages.tts.providers.*` 和顶层 `talk` 配置。迁移检查两者。如果你的语音 ID 是通过 OpenClaw UI 设置的（存储在不同路径），你可能需要手动设置：`hermes config set tts.elevenlabs.voice_id YOUR_VOICE_ID`。
