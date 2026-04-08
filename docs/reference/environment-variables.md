---
sidebar_position: 1
title: "环境变量参考"
description: "Hermes Agent 使用的所有环境变量的完整参考"
---

# 环境变量参考

所有变量都放在 `~/.hermes/.env` 中。您也可以使用 `hermes config set VAR value` 来设置。

## LLM Providers

| 变量 | 描述 |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API 密钥（推荐用于灵活性） |
| `OPENROUTER_BASE_URL` | 覆盖 OpenRouter 兼容的 base URL |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway API 密钥（[ai-gateway.vercel.sh](https://ai-gateway.vercel.sh)） |
| `AI_GATEWAY_BASE_URL` | 覆盖 AI Gateway base URL（默认：`https://ai-gateway.vercel.sh/v1`） |
| `OPENAI_API_KEY` | 自定义 OpenAI 兼容端点的 API 密钥（与 `OPENAI_BASE_URL` 一起使用） |
| `OPENAI_BASE_URL` | 自定义端点的 base URL（VLLM、SGLang 等） |
| `COPILOT_GITHUB_TOKEN` | Copilot API 的 GitHub 令牌 — 第一优先级（OAuth `gho_*` 或细粒度 PAT `github_pat_*`；经典 PATs `ghp_*` **不支持**） |
| `GH_TOKEN` | GitHub 令牌 — Copilot 第二优先级（也由 `gh` CLI 使用） |
| `GITHUB_TOKEN` | GitHub 令牌 — Copilot 第三优先级 |
| `HERMES_COPILOT_ACP_COMMAND` | 覆盖 Copilot ACP CLI 二进制路径（默认：`copilot`） |
| `COPILOT_CLI_PATH` | `HERMES_COPILOT_ACP_COMMAND` 的别名 |
| `HERMES_COPILOT_ACP_ARGS` | 覆盖 Copilot ACP 参数（默认：`--acp --stdio`） |
| `COPILOT_ACP_BASE_URL` | 覆盖 Copilot ACP base URL |
| `GLM_API_KEY` | z.ai / ZhipuAI GLM API 密钥（[z.ai](https://z.ai)） |
| `ZAI_API_KEY` | `GLM_API_KEY` 的别名 |
| `Z_AI_API_KEY` | `GLM_API_KEY` 的别名 |
| `GLM_BASE_URL` | 覆盖 z.ai base URL（默认：`https://api.z.ai/api/paas/v4`） |
| `KIMI_API_KEY` | Kimi / Moonshot AI API 密钥（[moonshot.ai](https://platform.moonshot.ai)） |
| `KIMI_BASE_URL` | 覆盖 Kimi base URL（默认：`https://api.moonshot.ai/v1`） |
| `MINIMAX_API_KEY` | MiniMax API 密钥 — 全局端点（[minimax.io](https://www.minimax.io)） |
| `MINIMAX_BASE_URL` | 覆盖 MiniMax base URL（默认：`https://api.minimax.io/v1`） |
| `MINIMAX_CN_API_KEY` | MiniMax API 密钥 — 中国端点（[minimaxi.com](https://www.minimaxi.com)） |
| `MINIMAX_CN_BASE_URL` | 覆盖 MiniMax 中国 base URL（默认：`https://api.minimaxi.com/v1`） |
| `KILOCODE_API_KEY` | Kilo Code API 密钥（[kilo.ai](https://kilo.ai)） |
| `KILOCODE_BASE_URL` | 覆盖 Kilo Code base URL（默认：`https://api.kilo.ai/api/gateway`） |
| `HF_TOKEN` | Hugging Face Inference Providers 令牌（[huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)） |
| `HF_BASE_URL` | 覆盖 Hugging Face base URL（默认：`https://router.huggingface.co/v1`） |
| `GOOGLE_API_KEY` | Google AI Studio API 密钥（[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)） |
| `GEMINI_API_KEY` | `GOOGLE_API_KEY` 的别名 |
| `GEMINI_BASE_URL` | 覆盖 Google AI Studio base URL |
| `ANTHROPIC_API_KEY` | Anthropic Console API 密钥（[console.anthropic.com](https://console.anthropic.com/)） |
| `ANTHROPIC_TOKEN` | 手动或旧版 Anthropic OAuth/setup-token 覆盖 |
| `DASHSCOPE_API_KEY` | 用于 Qwen 模型的阿里巴巴云 DashScope API 密钥（[modelstudio.console.alibabacloud.com](https://modelstudio.console.alibabacloud.com/)） |
| `DASHSCOPE_BASE_URL` | 自定义 DashScope base URL（默认：`https://coding-intl.dashscope.aliyuncs.com/v1`） |
| `DEEPSEEK_API_KEY` | 用于直接 DeepSeek 访问的 DeepSeek API 密钥（[platform.deepseek.com](https://platform.deepseek.com/api_keys)） |
| `DEEPSEEK_BASE_URL` | 自定义 DeepSeek API base URL |
| `OPENCODE_ZEN_API_KEY` | OpenCode Zen API 密钥 — 对策划模型的按需付费访问（[opencode.ai](https://opencode.ai/auth)） |
| `OPENCODE_ZEN_BASE_URL` | 覆盖 OpenCode Zen base URL |
| `OPENCODE_GO_API_KEY` | OpenCode Go API 密钥 — 订阅开放模型每月 $10（[opencode.ai](https://opencode.ai/auth)） |
| `OPENCODE_GO_BASE_URL` | 覆盖 OpenCode Go base URL |
| `CLAUDE_CODE_OAUTH_TOKEN` | 如果您手动导出一个，则显式 Claude Code 令牌覆盖 |
| `HERMES_MODEL` | 首选模型名称（在 `LLM_MODEL` 之前检查，由 gateway 使用） |
| `LLM_MODEL` | 默认模型名称（未在 config.yaml 中设置时的后备） |
| `VOICE_TOOLS_OPENAI_KEY` | OpenAI 语音转文本和文本转语音提供商的优选 OpenAI 密钥 |
| `HERMES_LOCAL_STT_COMMAND` | 可选本地语音转文本命令模板。支持 `{input_path}`、`{output_dir}`、`{language}` 和 `{model}` 占位符 |
| `HERMES_LOCAL_STT_LANGUAGE` | 传递给 `HERMES_LOCAL_STT_COMMAND` 或自动检测本地 `whisper` CLI 后备的默认语言（默认：`en`） |
| `HERMES_HOME` | 覆盖 Hermes config 目录（默认：`~/.hermes`）。还限定 gateway PID 文件和 systemd 服务名称，因此多个安装可以同时运行 |

## Provider Auth (OAuth)

对于原生 Anthropic 认证，Hermes 更喜欢 Claude Code 的自有凭据文件，因为这些凭据可以自动刷新。环境变量（如 `ANTHROPIC_TOKEN`）仍然作为手动覆盖有用，但它们不再是 Claude Pro/Max 登录的首选路径。

| 变量 | 描述 |
|----------|-------------|
| `HERMES_INFERENCE_PROVIDER` | 覆盖 provider 选择：`auto`、`openrouter`、`nous`、`openai-codex`、`copilot`、`copilot-acp`、`anthropic`、`huggingface`、`zai`、`kimi-coding`、`minimax`、`minimax-cn`、`kilocode`、`alibaba`、`deepseek`、`opencode-zen`、`opencode-go`、`ai-gateway`（默认：`auto`） |
| `HERMES_PORTAL_BASE_URL` | 覆盖 Nous Portal URL（用于开发/测试） |
| `NOUS_INFERENCE_BASE_URL` | 覆盖 Nous inference API URL |
| `HERMES_NOUS_MIN_KEY_TTL_SECONDS` | 代理密钥 TTL 最少时间（默认：1800 = 30 分钟） |
| `HERMES_NOUS_TIMEOUT_SECONDS` | Nous 凭据/令牌流程的 HTTP 超时 |
| `HERMES_DUMP_REQUESTS` | 将 API 请求负载转储到日志文件（`true`/`false`） |
| `HERMES_PREFILL_MESSAGES_FILE` | 在 API 调用时注入的临时 prefill 消息的 JSON 文件路径 |
| `HERMES_TIMEZONE` | IANA 时区覆盖（例如 `America/New_York`） |

## 工具 APIs

| 变量 | 描述 |
|----------|-------------|
| `PARALLEL_API_KEY` | AI 原生网页搜索（[parallel.ai](https://parallel.ai/)） |
| `FIRECRAWL_API_KEY` | 网页抓取和云浏览器（[firecrawl.dev](https://firecrawl.dev/)） |
| `FIRECRAWL_API_URL` | 自托管实例的自定义 Firecrawl API 端点（可选） |
| `TAVILY_API_KEY` | 用于 AI 原生网页搜索、提取和爬取的 Tavily API 密钥（[app.tavily.com](https://app.tavily.com/home)） |
| `EXA_API_KEY` | 用于 AI 原生网页搜索和内容的 Exa API 密钥（[exa.ai](https://exa.ai/)） |
| `BROWSERBASE_API_KEY` | 浏览器自动化（[browserbase.com](https://browserbase.com/)） |
| `BROWSERBASE_PROJECT_ID` | Browserbase 项目 ID |
| `BROWSER_USE_API_KEY` | Browser Use 云浏览器 API 密钥（[browser-use.com](https://browser-use.com/)） |
| `FIRECRAWL_BROWSER_TTL` | Firecrawl 浏览器会话 TTL（秒）（默认：300） |
| `BROWSER_CDP_URL` | 本地浏览器的 Chrome DevTools Protocol URL（通过 `/browser connect` 设置，例如 `ws://localhost:9222`） |
| `CAMOFOX_URL` | Camofox 本地反检测浏览器 URL（默认：`http://localhost:9377`） |
| `BROWSER_INACTIVITY_TIMEOUT` | 浏览器会话不活动超时（秒） |
| `FAL_KEY` | 图像生成（[fal.ai](https://fal.ai/)） |
| `GROQ_API_KEY` | Groq Whisper STT API 密钥（[groq.com](https://groq.com/)） |
| `ELEVENLABS_API_KEY` | ElevenLabs 高级 TTS 语音（[elevenlabs.io](https://elevenlabs.io/)） |
| `STT_GROQ_MODEL` | 覆盖 Groq STT 模型（默认：`whisper-large-v3-turbo`） |
| `GROQ_BASE_URL` | 覆盖 Groq OpenAI 兼容 STT 端点 |
| `STT_OPENAI_MODEL` | 覆盖 OpenAI STT 模型（默认：`whisper-1`） |
| `STT_OPENAI_BASE_URL` | 覆盖 OpenAI 兼容 STT 端点 |
| `GITHUB_TOKEN` | 用于 Skills Hub 的 GitHub 令牌（更高的 API 速率限制、技能发布） |
| `HONCHO_API_KEY` | 跨会话用户建模（[honcho.dev](https://honcho.dev/)） |
| `HONCHO_BASE_URL` | 自托管 Honcho 实例的 base URL（默认：Honcho cloud）。本地实例不需要 API 密钥 |
| `SUPERMEMORY_API_KEY` | 具有 profile 召回和会话摄取的语义长期记忆（[supermemory.ai](https://supermemory.ai)） |
| `TINKER_API_KEY` | RL 训练（[tinker-console.thinkingmachines.ai](https://tinker-console.thinkingmachines.ai/)） |
| `WANDB_API_KEY` | RL 训练指标（[wandb.ai](https://wandb.ai/)） |
| `DAYTONA_API_KEY` | Daytona 云沙箱（[daytona.io](https://daytona.io/)） |

## 终端后端

| 变量 | 描述 |
|----------|-------------|
| `TERMINAL_ENV` | 后端：`local`、`docker`、`ssh`、`singularity`、`modal`、`daytona` |
| `TERMINAL_DOCKER_IMAGE` | Docker 镜像（默认：`nikolaik/python-nodejs:python3.11-nodejs20`） |
| `TERMINAL_DOCKER_FORWARD_ENV` | 显式转发到 Docker 终端会话的环境变量名 JSON 数组。注意：技能声明的 `required_environment_variables` 会自动转发 — 您只需要为任何技能未声明的变量使用此选项。 |
| `TERMINAL_DOCKER_VOLUMES` | 额外的 Docker 卷挂载（逗号分隔的 `host:container` 对） |
| `TERMINAL_DOCKER_MOUNT_CWD_TO_WORKSPACE` | 高级选择加入：将启动 cwd 挂载到 Docker `/workspace`（`true`/`false`，默认：`false`） |
| `TERMINAL_SINGULARITY_IMAGE` | Singularity 镜像或 `.sif` 路径 |
| `TERMINAL_MODAL_IMAGE` | Modal 容器镜像 |
| `TERMINAL_DAYTONA_IMAGE` | Daytona 沙箱镜像 |
| `TERMINAL_TIMEOUT` | 命令超时（秒） |
| `TERMINAL_LIFETIME_SECONDS` | 终端会话的最大生命周期（秒） |
| `TERMINAL_CWD` | 所有终端会话的工作目录 |
| `SUDO_PASSWORD` | 启用无提示 sudo |

对于云沙箱后端，持久性是面向文件系统的。`TERMINAL_LIFETIME_SECONDS` 控制 Hermes 清理空闲终端会话的时间，之后的恢复可能会重新创建沙箱而不是保持相同的运行中进程。

## SSH 后端

| 变量 | 描述 |
|----------|-------------|
| `TERMINAL_SSH_HOST` | 远程服务器主机名 |
| `TERMINAL_SSH_USER` | SSH 用户名 |
| `TERMINAL_SSH_PORT` | SSH 端口（默认：22） |
| `TERMINAL_SSH_KEY` | 私钥路径 |
| `TERMINAL_SSH_PERSISTENT` | 覆盖 SSH 的持久 shell（默认：遵循 `TERMINAL_PERSISTENT_SHELL`） |

## 容器资源（Docker、Singularity、Modal、Daytona）

| 变量 | 描述 |
|----------|-------------|
| `TERMINAL_CONTAINER_CPU` | CPU 核心数（默认：1） |
| `TERMINAL_CONTAINER_MEMORY` | 内存（MB）（默认：5120） |
| `TERMINAL_CONTAINER_DISK` | 磁盘（MB）（默认：51200） |
| `TERMINAL_CONTAINER_PERSISTENT` | 在会话之间持久化容器文件系统（默认：`true`） |
| `TERMINAL_SANDBOX_DIR` | 工作区和覆盖层的主机目录（默认：`~/.hermes/sandboxes/`） |

## 持久化 Shell

| 变量 | 描述 |
|----------|-------------|
| `TERMINAL_PERSISTENT_SHELL` | 为非本地后端启用持久 shell（默认：`true`）。也可通过 config.yaml 中的 `terminal.persistent_shell` 设置 |
| `TERMINAL_LOCAL_PERSISTENT` | 为本地后端启用持久 shell（默认：`false`） |
| `TERMINAL_SSH_PERSISTENT` | 覆盖 SSH 后端的持久 shell（默认：遵循 `TERMINAL_PERSISTENT_SHELL`） |

## 消息

| 变量 | 描述 |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot 令牌（来自 @BotFather） |
| `TELEGRAM_ALLOWED_USERS` | 允许使用 bot 的逗号分隔用户 ID |
| `TELEGRAM_HOME_CHANNEL` | 用于 cron 传递的默认 Telegram 聊天/频道 |
| `TELEGRAM_HOME_CHANNEL_NAME` | Telegram 家庭频道的显示名称 |
| `TELEGRAM_WEBHOOK_URL` | webhook 模式的公共 HTTPS URL（启用 webhook 而不是轮询） |
| `TELEGRAM_WEBHOOK_PORT` | webhook 服务器的本地监听端口（默认：`8443`） |
| `TELEGRAM_WEBHOOK_SECRET` | 用于验证更新来自 Telegram 的秘密令牌 |
| `TELEGRAM_REACTIONS` | 在处理消息期间启用 emoji 回应（默认：`false`） |
| `DISCORD_BOT_TOKEN` | Discord bot 令牌 |
| `DISCORD_ALLOWED_USERS` | 允许使用 bot 的逗号分隔 Discord 用户 ID |
| `DISCORD_HOME_CHANNEL` | 用于 cron 传递的默认 Discord 频道 |
| `DISCORD_HOME_CHANNEL_NAME` | Discord 家庭频道的显示名称 |
| `DISCORD_REQUIRE_MENTION` | 在服务器频道中响应前需要 @mention |
| `DISCORD_FREE_RESPONSE_CHANNELS` | 不需要 mention 的逗号分隔频道 ID |
| `DISCORD_AUTO_THREAD` | 支持时自动线程化长回复 |
| `DISCORD_REACTIONS` | 在处理消息期间启用 emoji 回应（默认：`true`） |
| `DISCORD_IGNORED_CHANNELS` | bot 从不响应的逗号分隔频道 ID |
| `DISCORD_NO_THREAD_CHANNELS` | bot 响应而不自动线程化的逗号分隔频道 ID |
| `SLACK_BOT_TOKEN` | Slack bot 令牌（`xoxb-...`） |
| `SLACK_APP_TOKEN` | Slack app 级令牌（`xapp-...`，Socket Mode 必需） |
| `SLACK_ALLOWED_USERS` | 逗号分隔的 Slack 用户 ID |
| `SLACK_HOME_CHANNEL` | 用于 cron 传递的默认 Slack 频道 |
| `SLACK_HOME_CHANNEL_NAME` | Slack 家庭频道的显示名称 |
| `WHATSAPP_ENABLED` | 启用 WhatsApp bridge（`true`/`false`） |
| `WHATSAPP_MODE` | `bot`（单独号码）或 `self-chat`（给自己发消息） |
| `WHATSAPP_ALLOWED_USERS` | 逗号分隔的电话号码（带国家代码，无 `+`），或 `*` 允许所有发送者 |
| `WHATSAPP_ALLOW_ALL_USERS` | 允许所有 WhatsApp 发送者而不使用允许列表（`true`/`false`） |
| `WHATSAPP_DEBUG` | 记录原始消息事件以便在 bridge 中进行故障排除（`true`/`false`） |
| `SIGNAL_HTTP_URL` | signal-cli 守护进程 HTTP 端点（例如 `http://127.0.0.1:8080`） |
| `SIGNAL_ACCOUNT` | 机器人电话号码（E.164 格式） |
| `SIGNAL_ALLOWED_USERS` | 逗号分隔的 E.164 电话号码或 UUID |
| `SIGNAL_GROUP_ALLOWED_USERS` | 逗号分隔的群组 ID，或 `*` 代表所有群组 |
| `SIGNAL_HOME_CHANNEL_NAME` | Signal 家庭频道的显示名称 |
| `SIGNAL_IGNORE_STORIES` | 忽略 Signal stories/状态更新 |
| `SIGNAL_ALLOW_ALL_USERS` | 允许所有 Signal 用户而不使用允许列表 |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID（与 telephony skill 共享） |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token（与 telephony skill 共享） |
| `TWILIO_PHONE_NUMBER` | Twilio 电话号码（E.164 格式）（与 telephony skill 共享） |
| `SMS_WEBHOOK_PORT` | 入站 SMS 的 webhook 监听器端口（默认：`8080`） |
| `SMS_ALLOWED_USERS` | 允许聊天的逗号分隔 E.164 电话号码 |
| `SMS_ALLOW_ALL_USERS` | 允许所有 SMS 发送者而不使用允许列表 |
| `SMS_HOME_CHANNEL` | 用于 cron 任务/通知传递的电话号码 |
| `SMS_HOME_CHANNEL_NAME` | SMS 家庭频道的显示名称 |
| `EMAIL_ADDRESS` | Email gateway adapter 的电子邮件地址 |
| `EMAIL_PASSWORD` | 邮箱账户的密码或应用密码 |
| `EMAIL_IMAP_HOST` | 电子邮件适配器的 IMAP 主机名 |
| `EMAIL_IMAP_PORT` | IMAP 端口 |
| `EMAIL_SMTP_HOST` | 电子邮件适配器的 SMTP 主机名 |
| `EMAIL_SMTP_PORT` | SMTP 端口 |
| `EMAIL_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔电子邮件地址 |
| `EMAIL_HOME_ADDRESS` | 主动电子邮件传递的默认收件人 |
| `EMAIL_HOME_ADDRESS_NAME` | 电子邮件家庭目标的显示名称 |
| `EMAIL_POLL_INTERVAL` | 电子邮件轮询间隔（秒） |
| `EMAIL_ALLOW_ALL_USERS` | 允许所有入站电子邮件发送者 |
| `DINGTALK_CLIENT_ID` | 来自开发者门户的 DingTalk bot AppKey（[open.dingtalk.com](https://open.dingtalk.com)） |
| `DINGTALK_CLIENT_SECRET` | 来自开发者门户的 DingTalk bot AppSecret |
| `DINGTALK_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔 DingTalk 用户 ID |
| `FEISHU_APP_ID` | 来自 [open.feishu.cn](https://open.feishu.cn/) 的 Feishu/Lark bot App ID |
| `FEISHU_APP_SECRET` | Feishu/Lark bot App Secret |
| `FEISHU_DOMAIN` | `feishu`（中国）或 `lark`（国际）。默认：`feishu` |
| `FEISHU_CONNECTION_MODE` | `websocket`（推荐）或 `webhook`。默认：`websocket` |
| `FEISHU_ENCRYPT_KEY` | webhook 模式的可选加密密钥 |
| `FEISHU_VERIFICATION_TOKEN` | webhook 模式的可选验证令牌 |
| `FEISHU_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔 Feishu 用户 ID |
| `FEISHU_HOME_CHANNEL` | 用于 cron 传递和通知的 Feishu 聊天 ID |
| `WECOM_BOT_ID` | 来自管理控制台的 WeCom AI Bot ID |
| `WECOM_SECRET` | WeCom AI Bot 密钥 |
| `WECOM_WEBSOCKET_URL` | 自定义 WebSocket URL（默认：`wss://openws.work.weixin.qq.com`） |
| `WECOM_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔 WeCom 用户 ID |
| `WECOM_HOME_CHANNEL` | 用于 cron 传递和通知的 WeCom 聊天 ID |
| `MATTERMOST_URL` | Mattermost 服务器 URL（例如 `https://mm.example.com`） |
| `MATTERMOST_TOKEN` | Mattermost 的 bot 令牌或个人访问令牌 |
| `MATTERMOST_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔 Mattermost 用户 ID |
| `MATTERMOST_HOME_CHANNEL` | 用于主动消息传递（cron、通知）的频道 ID |
| `MATTERMOST_REQUIRE_MENTION` | 在频道中需要 `@mention`（默认：`true`）。设置为 `false` 以响应所有消息。 |
| `MATTERMOST_FREE_RESPONSE_CHANNELS` | bot 无需 `@mention` 即可响应的逗号分隔频道 ID |
| `MATTERMOST_REPLY_MODE` | 回复样式：`thread`（线程化回复）或 `off`（扁平消息，默认） |
| `MATRIX_HOMESERVER` | Matrix homeserver URL（例如 `https://matrix.org`） |
| `MATRIX_ACCESS_TOKEN` | 用于 bot 认证的 Matrix 访问令牌 |
| `MATRIX_USER_ID` | Matrix 用户 ID（例如 `@hermes:matrix.org`）— 密码登录时必需，访问令牌时可选 |
| `MATRIX_PASSWORD` | Matrix 密码（访问令牌的替代方案） |
| `MATRIX_ALLOWED_USERS` | 允许向 bot 发消息的逗号分隔 Matrix 用户 ID（例如 `@alice:matrix.org`） |
| `MATRIX_HOME_ROOM` | 用于主动消息传递（cron、通知）的房间 ID（例如 `!abc123:matrix.org`） |
| `MATRIX_ENCRYPTION` | 启用端到端加密（`true`/`false`，默认：`false`） |
| `MATRIX_REQUIRE_MENTION` | 在房间中需要 `@mention`（默认：`true`）。设置为 `false` 以响应所有消息。 |
| `MATRIX_FREE_RESPONSE_ROOMS` | bot 无需 `@mention` 即可响应的逗号分隔房间 ID |
| `MATRIX_AUTO_THREAD` | 为房间消息自动创建线程（默认：`true`） |
| `HASS_TOKEN` | Home Assistant 长期访问令牌（启用 HA 平台 + 工具） |
| `HASS_URL` | Home Assistant URL（默认：`http://homeassistant.local:8123`） |
| `WEBHOOK_ENABLED` | 启用 webhook 平台适配器（`true`/`false`） |
| `WEBHOOK_PORT` | 用于接收 webhooks 的 HTTP 服务器端口（默认：8644） |
| `WEBHOOK_SECRET` | 用于 webhook 签名验证的全局 HMAC 密钥（当路由未指定自己的密钥时用作后备） |
| `API_SERVER_ENABLED` | 启用 OpenAI 兼容 API 服务器（`true`/`false`）。与其他平台一起运行。 |
| `API_SERVER_KEY` | API 服务器认证的 Bearer 令牌。强烈推荐；对于任何网络可访问的部署都是必需的。 |
| `API_SERVER_CORS_ORIGINS` | 允许直接调用 API 服务器的逗号分隔浏览器来源（例如 `http://localhost:3000,http://127.0.0.1:3000`）。默认：禁用。 |
| `API_SERVER_PORT` | API 服务器的端口（默认：8642） |
| `API_SERVER_HOST` | API 服务器的主机/绑定地址（默认：`127.0.0.1`）。仅在有 `API_SERVER_KEY` 和窄的 `API_SERVER_CORS_ORIGINS` 允许列表时使用 `0.0.0.0` 进行网络访问。 |
| `MESSAGING_CWD` | 消息模式下终端命令的工作目录（默认：`~`） |
| `GATEWAY_ALLOWED_USERS` | 跨所有平台允许的逗号分隔用户 ID |
| `GATEWAY_ALLOW_ALL_USERS` | 允许所有用户而不使用允许列表（`true`/`false`，默认：`false`） |

## 代理行为

| 变量 | 描述 |
|----------|-------------|
| `HERMES_MAX_ITERATIONS` | 每次对话的最大工具调用迭代次数（默认：90） |
| `HERMES_TOOL_PROGRESS` | 已弃用的工具进度显示兼容性变量。推荐使用 config.yaml 中的 `display.tool_progress`。 |
| `HERMES_TOOL_PROGRESS_MODE` | 已弃用的工具进度模式兼容性变量。推荐使用 config.yaml 中的 `display.tool_progress`。 |
| `HERMES_HUMAN_DELAY_MODE` | 响应节奏：`off`/`natural`/`custom` |
| `HERMES_HUMAN_DELAY_MIN_MS` | 自定义延迟范围最小值（ms） |
| `HERMES_HUMAN_DELAY_MAX_MS` | 自定义延迟范围最大值（ms） |
| `HERMES_QUIET` | 抑制非必要输出（`true`/`false`） |
| `HERMES_API_TIMEOUT` | LLM API 调用超时（秒）（默认：`1800`） |
| `HERMES_EXEC_ASK` | 在 gateway 模式下启用执行批准提示（`true`/`false`） |
| `HERMES_ENABLE_PROJECT_PLUGINS` | 启用从 `./.hermes/plugins/` 自动发现 repo 本地插件（`true`/`false`，默认：`false`） |
| `HERMES_BACKGROUND_NOTIFICATIONS` | Gateway 中后台进程通知模式：`all`（默认）、`result`、`error`、`off` |
| `HERMES_EPHEMERAL_SYSTEM_PROMPT` | 在 API 调用时注入的临时系统提示（从不持久化到会话） |

## 会话设置

| 变量 | 描述 |
|----------|-------------|
| `SESSION_IDLE_MINUTES` | N 分钟不活动后重置会话（默认：1440） |
| `SESSION_RESET_HOUR` | 每日重置小时（24 小时格式）（默认：4 = 凌晨 4 点） |

## 上下文压缩（仅限 config.yaml）

上下文压缩仅通过 config.yaml 中的 `compression` 部分配置 — 没有环境变量。

```yaml
compression:
  enabled: true
  threshold: 0.50
  summary_model: ""                            # 空 = 使用配置的主模型
  summary_provider: auto
  summary_base_url: null  # 用于摘要的自定义 OpenAI 兼容端点
```

## 辅助任务覆盖

| 变量 | 描述 |
|----------|-------------|
| `AUXILIARY_VISION_PROVIDER` | 覆盖视觉任务的 provider |
| `AUXILIARY_VISION_MODEL` | 覆盖视觉任务的模型 |
| `AUXILIARY_VISION_BASE_URL` | 用于视觉任务的直接 OpenAI 兼容端点 |
| `AUXILIARY_VISION_API_KEY` | 与 `AUXILIARY_VISION_BASE_URL` 配对的 API 密钥 |
| `AUXILIARY_WEB_EXTRACT_PROVIDER` | 覆盖网页提取/摘要的 provider |
| `AUXILIARY_WEB_EXTRACT_MODEL` | 覆盖网页提取/摘要的模型 |
| `AUXILIARY_WEB_EXTRACT_BASE_URL` | 用于网页提取/摘要的直接 OpenAI 兼容端点 |
| `AUXILIARY_WEB_EXTRACT_API_KEY` | 与 `AUXILIARY_WEB_EXTRACT_BASE_URL` 配对的 API 密钥 |

对于特定于任务的直接端点，Hermes 使用任务的配置 API 密钥或 `OPENAI_API_KEY`。它不会为这些自定义端点重用 `OPENROUTER_API_KEY`。

## 回退模型（仅限 config.yaml）

主模型回退仅通过 `config.yaml` 配置 — 没有环境变量。添加带有 `provider` 和 `model` 键的 `fallback_model` 部分以在主模型遇到错误时启用自动故障转移。

```yaml
fallback_model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
```

有关完整详细信息，请参阅[回退 Providers](/docs/user-guide/features/fallback-providers)。

## Provider 路由（仅限 config.yaml）

这些放在 `~/.hermes/config.yaml` 的 `provider_routing` 部分下：

| 键 | 描述 |
|-----|-------------|
| `sort` | 对 providers 排序：`"price"`（默认）、`"throughput"` 或 `"latency"` |
| `only` | 允许的 provider slug 列表（例如 `["anthropic", "google"]`） |
| `ignore` | 跳过的 provider slug 列表 |
| `order` | 要按顺序尝试的 provider slug 列表 |
| `require_parameters` | 仅使用支持所有请求参数的 providers（`true`/`false`） |
| `data_collection` | `"allow"`（默认）或 `"deny"` 排除数据存储 providers |

:::tip
使用 `hermes config set` 设置环境变量 — 它会自动将它们保存到正确的文件（`.env` 用于密钥，`config.yaml` 用于其他所有内容）。
:::
