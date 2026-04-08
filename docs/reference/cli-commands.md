---
sidebar_position: 2
title: "CLI 命令参考"
description: "Hermes 终端命令和命令族的权威参考"
---

# CLI 命令参考

本文档涵盖从 shell 中运行的**终端命令**。

关于应用内斜杠命令，请参阅[斜杠命令参考](./slash-commands.md)。

## 全局入口

```bash
hermes [global-options] <command> [subcommand/options]
```

### 全局选项

| 选项 | 描述 |
|--------|-------------|
| `--version`, `-V` | 显示版本并退出。 |
| `--profile <name>`, `-p <name>` | 选择此次调用使用的 Hermes profile。覆盖 `hermes profile use` 设置的 sticky 默认值。 |
| `--resume <session>`, `-r <session>` | 通过 ID 或标题恢复之前的会话。 |
| `--continue [name]`, `-c [name]` | 恢复最近的会话，或恢复与标题匹配的最新会话。 |
| `--worktree`, `-w` | 为并行代理工作流启动一个隔离的 git worktree。 |
| `--yolo` | 绕过危险命令批准提示。 |
| `--pass-session-id` | 在代理的系统提示中包含会话 ID。 |

## 顶级命令

| 命令 | 用途 |
|---------|---------|
| `hermes chat` | 与代理进行交互式或一次性聊天。 |
| `hermes model` | 交互式选择默认 provider 和模型。 |
| `hermes gateway` | 运行或管理消息网关服务。 |
| `hermes setup` | 用于全部或部分配置的交互式设置向导。 |
| `hermes whatsapp` | 配置并配对 WhatsApp bridge。 |
| `hermes auth` | 管理凭据 — 添加、列出、移除、重置、设置策略。处理 Codex/Nous/Anthropic 的 OAuth 流程。 |
| `hermes login` / `logout` | **已弃用** — 请改用 `hermes auth`。 |
| `hermes status` | 显示代理、认证和平台状态。 |
| `hermes cron` | 检查和触发 cron 调度器。 |
| `hermes webhook` | 管理用于事件驱动激活的动态 webhook 订阅。 |
| `hermes doctor` | 诊断配置和依赖问题。 |
| `hermes config` | 显示、编辑、迁移和查询配置文件。 |
| `hermes pairing` | 批准或撤销消息配对码。 |
| `hermes skills` | 浏览、安装、发布、审计和配置技能。 |
| `hermes honcho` | 管理 Honcho 跨会话记忆集成。 |
| `hermes memory` | 配置外部记忆 provider。 |
| `hermes acp` | 将 Hermes 作为 ACP 服务器运行以实现编辑器集成。 |
| `hermes mcp` | 管理 MCP server 配置并将 Hermes 作为 MCP server 运行。 |
| `hermes plugins` | 管理 Hermes Agent 插件（安装、启用、禁用、移除）。 |
| `hermes tools` | 按平台配置启用的工具。 |
| `hermes sessions` | 浏览、导出、清理、重命名和删除会话。 |
| `hermes insights` | 显示 token/费用/活动分析。 |
| `hermes claw` | OpenClaw 迁移助手。 |
| `hermes profile` | 管理 profiles — 多个隔离的 Hermes 实例。 |
| `hermes completion` | 打印 shell 补全脚本（bash/zsh）。 |
| `hermes version` | 显示版本信息。 |
| `hermes update` | 拉取最新代码并重新安装依赖。 |
| `hermes uninstall` | 从系统中移除 Hermes。 |

## `hermes chat`

```bash
hermes chat [options]
```

常用选项：

| 选项 | 描述 |
|--------|-------------|
| `-q`, `--query "..."` | 一次性、非交互式提示。 |
| `-m`, `--model <model>` | 覆盖此次运行的模型。 |
| `-t`, `--toolsets <csv>` | 启用逗号分隔的工具集。 |
| `--provider <provider>` | 强制使用某个 provider：`auto`、`openrouter`、`nous`、`openai-codex`、`copilot-acp`、`copilot`、`anthropic`、`huggingface`、`zai`、`kimi-coding`、`minimax`、`minimax-cn`、`deepseek`、`ai-gateway`、`opencode-zen`、`opencode-go`、`kilocode`、`alibaba`。 |
| `-s`, `--skills <name>` | 预加载一个或多个技能到会话中（可重复或逗号分隔）。 |
| `-v`, `--verbose` | 详细输出。 |
| `-Q`, `--quiet` | 程序化模式：抑制横幅/旋转器/工具预览。 |
| `--resume <session>` / `--continue [name]` | 直接从 `chat` 恢复会话。 |
| `--worktree` | 为此次运行创建隔离的 git worktree。 |
| `--checkpoints` | 在破坏性文件更改之前启用文件系统检查点。 |
| `--yolo` | 跳过批准提示。 |
| `--pass-session-id` | 将会话 ID 传递到系统提示中。 |
| `--source <tag>` | 会话源标签用于过滤（默认：`cli`）。第三方集成使用 `tool`，这样不会出现在用户会话列表中。 |
| `--max-turns <N>` | 每次对话轮次最大工具调用迭代次数（默认：90，或 config 中的 `agent.max_turns`）。 |

示例：

```bash
hermes
hermes chat -q "Summarize the latest PRs"
hermes chat --provider openrouter --model anthropic/claude-sonnet-4.6
hermes chat --toolsets web,terminal,skills
hermes chat --quiet -q "Return only JSON"
hermes chat --worktree -q "Review this repo and open a PR"
```

## `hermes model`

交互式 provider + 模型选择器。

```bash
hermes model
```

在以下情况使用：
- 切换默认 providers
- 在模型选择期间登录 OAuth 支持的 providers
- 从 provider 特定模型列表中选择
- 配置自定义/自托管端点
- 将新默认值保存到 config

### `/model` 斜杠命令（会话中）

在不离开会话的情况下切换模型：

```
/model                              # 显示当前模型和可用选项
/model claude-sonnet-4              # 切换模型（自动检测 provider）
/model zai:glm-5                    # 切换 provider 和模型
/model custom:qwen-2.5              # 使用自定义端点上的模型
/model custom                       # 从自定义端点自动检测模型
/model custom:local:qwen-2.5        # 使用命名自定义 provider
/model openrouter:anthropic/claude-sonnet-4  # 切换回云端
```

Provider 和 base URL 更改会自动持久化到 `config.yaml`。当从自定义端点切换走时，stale base URL 会被清除以防止泄漏到其他 providers。

## `hermes gateway`

```bash
hermes gateway <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `run` | 在前台运行 gateway。 |
| `start` | 启动已安装的 gateway 服务。 |
| `stop` | 停止服务。 |
| `restart` | 重启服务。 |
| `status` | 显示服务状态。 |
| `install` | 安装为用户服务（Linux 上是 `systemd`，macOS 上是 `launchd`）。 |
| `uninstall` | 移除已安装的服务。 |
| `setup` | 交互式消息平台设置。 |

## `hermes setup`

```bash
hermes setup [model|terminal|gateway|tools|agent] [--non-interactive] [--reset]
```

使用完整向导或跳转到某个部分：

| 部分 | 描述 |
|---------|-------------|
| `model` | Provider 和模型设置。 |
| `terminal` | 终端后端和沙箱设置。 |
| `gateway` | 消息平台设置。 |
| `tools` | 按平台启用/禁用工具。 |
| `agent` | 代理行为设置。 |

选项：

| 选项 | 描述 |
|--------|-------------|
| `--non-interactive` | 使用默认值/环境值而不提示。 |
| `--reset` | 在设置前重置配置为默认值。 |

## `hermes whatsapp`

```bash
hermes whatsapp
```

运行 WhatsApp 配对/设置流程，包括模式选择和 QR 码配对。

## `hermes login` / `hermes logout` *（已弃用）*

:::caution
`hermes login` 已被移除。请使用 `hermes auth` 管理 OAuth 凭据，`hermes model` 选择 provider，或 `hermes setup` 进行完整的交互式设置。
:::

## `hermes auth`

管理同一 provider 密钥轮换的凭据池。参见[凭据池](/docs/user-guide/features/credential-pools)获取完整文档。

```bash
hermes auth                                              # 交互式向导
hermes auth list                                         # 显示所有池
hermes auth list openrouter                              # 显示特定 provider
hermes auth add openrouter --api-key sk-or-v1-xxx        # 添加 API 密钥
hermes auth add anthropic --type oauth                   # 添加 OAuth 凭据
hermes auth remove openrouter 2                          # 按索引移除
hermes auth reset openrouter                             # 清除冷却时间
```

子命令：`add`、`list`、`remove`、`reset`。不带子命令调用时启动交互式管理向导。

## `hermes status`

```bash
hermes status [--all] [--deep]
```

| 选项 | 描述 |
|--------|-------------|
| `--all` | 以可共享的编辑格式显示所有详细信息。 |
| `--deep` | 运行可能耗时更长的深度检查。 |

## `hermes cron`

```bash
hermes cron <list|create|edit|pause|resume|run|remove|status|tick>
```

| 子命令 | 描述 |
|------------|-------------|
| `list` | 显示计划任务。 |
| `create` / `add` | 从提示创建计划任务，可选择通过重复 `--skill` 附加一个或多个技能。 |
| `edit` | 更新任务的计划、提示、名称、传递、重复次数或附加的技能。支持 `--clear-skills`、`--add-skill` 和 `--remove-skill`。 |
| `pause` | 暂停任务而不删除。 |
| `resume` | 恢复暂停的任务并计算其下次运行时间。 |
| `run` | 在下次调度器 tick 时触发任务。 |
| `remove` | 删除计划任务。 |
| `status` | 检查 cron 调度器是否正在运行。 |
| `tick` | 运行到期任务一次然后退出。 |

## `hermes webhook`

```bash
hermes webhook <subscribe|list|remove|test>
```

管理用于事件驱动代理激活的动态 webhook 订阅。如果 config 中未配置 webhook platform，则打印设置说明。

| 子命令 | 描述 |
|------------|-------------|
| `subscribe` / `add` | 创建 webhook 路由。返回要在服务上配置的 URL 和 HMAC secret。 |
| `list` / `ls` | 显示所有代理创建的订阅。 |
| `remove` / `rm` | 删除动态订阅。config.yaml 中的静态路由不受影响。 |
| `test` | 发送测试 POST 以验证订阅是否正常工作。 |

### `hermes webhook subscribe`

```bash
hermes webhook subscribe <name> [options]
```

| 选项 | 描述 |
|--------|-------------|
| `--prompt` | 带有 `{dot.notation}` payload 引用的提示模板。 |
| `--events` | 接受的逗号分隔事件类型（如 `issues,pull_request`）。空 = 全部。 |
| `--description` | 人类可读的描述。 |
| `--skills` | 逗号分隔的技能名称，用于为代理运行加载。 |
| `--deliver` | 传递目标：`log`（默认）、`telegram`、`discord`、`slack`、`github_comment`。 |
| `--deliver-chat-id` | 跨平台传递的目标聊天/频道 ID。 |
| `--secret` | 自定义 HMAC secret。如果省略则自动生成。 |

订阅持久化到 `~/.hermes/webhook_subscriptions.json`，并被 webhook adapter 热重载，无需 gateway 重启。

## `hermes doctor`

```bash
hermes doctor [--fix]
```

| 选项 | 描述 |
|--------|-------------|
| `--fix` | 尽可能尝试自动修复。 |

## `hermes config`

```bash
hermes config <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `show` | 显示当前配置值。 |
| `edit` | 在编辑器中打开 `config.yaml`。 |
| `set <key> <value>` | 设置配置值。 |
| `path` | 打印配置文件路径。 |
| `env-path` | 打印 `.env` 文件路径。 |
| `check` | 检查缺失或过时的配置。 |
| `migrate` | 交互式添加新引入的选项。 |

## `hermes pairing`

```bash
hermes pairing <list|approve|revoke|clear-pending>
```

| 子命令 | 描述 |
|------------|-------------|
| `list` | 显示待批准和已批准的用户。 |
| `approve <platform> <code>` | 批准配对码。 |
| `revoke <platform> <user-id>` | 撤销用户的访问权限。 |
| `clear-pending` | 清除待处理的配对码。 |

## `hermes skills`

```bash
hermes skills <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `browse` | 技能注册表的分页浏览器。 |
| `search` | 搜索技能注册表。 |
| `install` | 安装技能。 |
| `inspect` | 预览技能而不安装。 |
| `list` | 列出已安装的技能。 |
| `check` | 检查已安装的 hub 技能是否有上游更新。 |
| `update` | 在有上游更改时重新安装 hub 技能。 |
| `audit` | 重新扫描已安装的 hub 技能。 |
| `uninstall` | 移除 hub 安装的技能。 |
| `publish` | 将技能发布到注册表。 |
| `snapshot` | 导出/导入技能配置。 |
| `tap` | 管理自定义技能来源。 |
| `config` | 交互式按平台启用/禁用技能配置。 |

常用示例：

```bash
hermes skills browse
hermes skills browse --source official
hermes skills search react --source skills-sh
hermes skills search https://mintlify.com/docs --source well-known
hermes skills inspect official/security/1password
hermes skills inspect skills-sh/vercel-labs/json-render/json-render-react
hermes skills install official/migration/openclaw-migration
hermes skills install skills-sh/anthropics/skills/pdf --force
hermes skills check
hermes skills update
hermes skills config
```

注意：
- `--force` 可以覆盖第三方/社区技能的非危险策略阻止。
- `--force` 不会覆盖危险扫描裁决。
- `--source skills-sh` 搜索公共 `skills.sh` 目录。
- `--source well-known` 让 Hermes 指向暴露 `/.well-known/skills/index.json` 的站点。

## `hermes honcho`

```bash
hermes honcho [--target-profile NAME] <subcommand>
```

管理 Honcho 跨会话记忆集成。此命令由 Honcho 记忆 provider 插件提供，仅在 config 中将 `memory.provider` 设置为 `honcho` 时可用。

`--target-profile` 标志允许您管理另一个 profile 的 Honcho 配置而无需切换到它。

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `setup` | 重定向到 `hermes memory setup`（统一设置路径）。 |
| `status [--all]` | 显示当前 Honcho 配置和连接状态。`--all` 显示跨 profile 概览。 |
| `peers` | 显示所有 profiles 的 peer 身份。 |
| `sessions` | 列出已知的 Honcho 会话映射。 |
| `map [name]` | 将当前目录映射到 Honcho 会话名称。省略 `name` 以列出当前映射。 |
| `peer` | 显示或更新 peer 名称和辩证推理级别。选项：`--user NAME`、`--ai NAME`、`--reasoning LEVEL`。 |
| `mode [mode]` | 显示或设置召回模式：`hybrid`、`context` 或 `tools`。省略以显示当前模式。 |
| `tokens` | 显示或设置 context 和辩证的 token 预算。选项：`--context N`、`--dialectic N`。 |
| `identity [file] [--show]` | 种子化或显示 AI peer 身份表示。 |
| `enable` | 为当前 profile 启用 Honcho。 |
| `disable` | 为当前 profile 禁用 Honcho。 |
| `sync` | 将 Honcho 配置同步到所有现有 profiles（创建缺失的主机块）。 |
| `migrate` | 从 openclaw-honcho 到 Hermes Honcho 的分步迁移指南。 |

## `hermes memory`

```bash
hermes memory <subcommand>
```

设置和管理外部记忆 provider 插件。可用 providers：honcho、openviking、mem0、hindsight、holographic、retaindb、byterover、supermemory。同一时间只能有一个外部 provider 处于活动状态。内置记忆（MEMORY.md/USER.md）始终处于活动状态。

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `setup` | 交互式 provider 选择和配置。 |
| `status` | 显示当前记忆 provider 配置。 |
| `off` | 禁用外部 provider（仅内置）。 |

## `hermes acp`

```bash
hermes acp
```

将 Hermes 启动为 ACP（Agent Client Protocol）stdio 服务器以实现编辑器集成。

相关入口点：

```bash
hermes-acp
python -m acp_adapter
```

首先安装支持：

```bash
pip install -e '.[acp]'
```

参见 [ACP 编辑器集成](../user-guide/features/acp.md) 和 [ACP 内部原理](../developer-guide/acp-internals.md)。

## `hermes mcp`

```bash
hermes mcp <subcommand>
```

管理 MCP（Model Context Protocol）server 配置并将 Hermes 作为 MCP server 运行。

| 子命令 | 描述 |
|------------|-------------|
| `serve [-v|--verbose]` | 将 Hermes 作为 MCP server 运行 — 向其他代理暴露对话。 |
| `add <name> [--url URL] [--command CMD] [--args ...] [--auth oauth|header]` | 添加带有自动工具发现的 MCP server。 |
| `remove <name>`（别名：`rm`） | 从 config 中移除 MCP server。 |
| `list`（别名：`ls`） | 列出已配置的 MCP servers。 |
| `test <name>` | 测试到 MCP server 的连接。 |
| `configure <name>`（别名：`config`） | 切换 server 的工具选择。 |

参见 [MCP 配置参考](./mcp-config-reference.md)、[在 Hermes 中使用 MCP](../guides/use-mcp-with-hermes.md) 和 [MCP Server 模式](../user-guide/features/mcp.md#running-hermes-as-an-mcp-server)。

## `hermes plugins`

```bash
hermes plugins [subcommand]
```

管理 Hermes Agent 插件。运行不带子命令的 `hermes plugins` 会启动交互式 curses 检查列表以启用/禁用已安装的插件。

| 子命令 | 描述 |
|------------|-------------|
| *（无）* | 交互式切换 UI — 用方向键和空格启用/禁用插件。 |
| `install <identifier> [--force]` | 从 Git URL 或 `owner/repo` 安装插件。 |
| `update <name>` | 为已安装的插件拉取最新更改。 |
| `remove <name>`（别名：`rm`、`uninstall`） | 移除已安装的插件。 |
| `enable <name>` | 启用已禁用的插件。 |
| `disable <name>` | 禁用插件而不移除。 |
| `list`（别名：`ls`） | 列出已安装的插件及其启用/禁用状态。 |

禁用的插件存储在 config.yaml 的 `plugins.disabled` 下，并在加载时跳过。

参见[插件](../user-guide/features/plugins.md)和[构建 Hermes 插件](../guides/build-a-hermes-plugin.md)。

## `hermes tools`

```bash
hermes tools [--summary]
```

| 选项 | 描述 |
|--------|-------------|
| `--summary` | 打印当前启用工具的摘要并退出。 |

不带 `--summary` 时，启动交互式按平台工具配置 UI。

## `hermes sessions`

```bash
hermes sessions <subcommand>
```

子命令：

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出最近的会话。 |
| `browse` | 带有搜索和恢复功能的交互式会话选择器。 |
| `export <output> [--session-id ID]` | 将会话导出为 JSONL。 |
| `delete <session-id>` | 删除一个会话。 |
| `prune` | 删除旧会话。 |
| `stats` | 显示会话存储统计。 |
| `rename <session-id> <title>` | 设置或更改会话标题。 |

## `hermes insights`

```bash
hermes insights [--days N] [--source platform]
```

| 选项 | 描述 |
|--------|-------------|
| `--days <n>` | 分析最近 `n` 天（默认：30）。 |
| `--source <platform>` | 按来源过滤，如 `cli`、`telegram` 或 `discord`。 |

## `hermes claw`

```bash
hermes claw migrate [options]
```

将您的 OpenClaw 设置迁移到 Hermes。从 `~/.openclaw`（或自定义路径）读取并写入 `~/.hermes`。自动检测传统目录名（`~/.clawdbot`、`~/.moldbot`）和配置文件名（`clawdbot.json`、`moldbot.json`）。

| 选项 | 描述 |
|--------|-------------|
| `--dry-run` | 预览将要迁移的内容而不写入任何内容。 |
| `--preset <name>` | 迁移预设：`full`（默认，包含密钥）或 `user-data`（排除 API 密钥）。 |
| `--overwrite` | 覆盖冲突时的现有 Hermes 文件（默认：跳过）。 |
| `--migrate-secrets` | 包含 API 密钥（默认启用 `--preset full`）。 |
| `--source <path>` | 自定义 OpenClaw 目录（默认：`~/.openclaw`）。 |
| `--workspace-target <path>` | 工作区指令（AGENTS.md）的目标目录。 |
| `--skill-conflict <mode>` | 处理技能名称冲突：`skip`（默认）、`overwrite` 或 `rename`。 |
| `--yes` | 跳过确认提示。 |

### 迁移内容

迁移涵盖 30+ 个类别，包括 persona、记忆、技能、模型 providers、消息平台、代理行为、会话策略、MCP servers、TTS 等。項目要么**直接导入**到 Hermes 等效项，要么**归档**供手动审查。

**直接导入：** SOUL.md、MEMORY.md、USER.md、AGENTS.md、技能（4 个来源目录）、默认模型、自定义 providers、MCP servers、消息平台令牌和允许列表（Telegram、Discord、Slack、WhatsApp、Signal、Matrix、Mattermost）、代理默认值（推理工作、压缩、人工延迟、时区、沙箱）、会话重置策略、批准规则、TTS 配置、浏览器设置、工具设置、执行超时、命令允许列表、gateway 配置以及来自 3 个来源的 API 密钥。

**归档供手动审查：** Cron 任务、插件、hooks/webhooks、记忆后端（QMD）、技能注册表配置、UI/identity、日志记录、多代理设置、渠道绑定、IDENTITY.md、TOOLS.md、HEARTBEAT.md、BOOTSTRAP.md。

**API 密钥解析**按优先级顺序检查三个来源：config 值 → `~/.openclaw/.env` → `auth-profiles.json`。所有令牌字段处理纯字符串、env 模板（`${VAR}`）和 SecretRef 对象。

有关完整的 config 密钥映射、SecretRef 处理细节和迁移后检查清单，请参阅**[完整迁移指南](../guides/migrate-from-openclaw.md)**。

### 示例

```bash
# 预览将要迁移的内容
hermes claw migrate --dry-run

# 包含 API 密钥的完整迁移
hermes claw migrate --preset full

# 仅迁移用户数据（无密钥），覆盖冲突
hermes claw migrate --preset user-data --overwrite

# 从自定义 OpenClaw 路径迁移
hermes claw migrate --source /home/user/old-openclaw
```

## `hermes profile`

```bash
hermes profile <subcommand>
```

管理 profiles — 多个隔离的 Hermes 实例，每个都有自己的 config、会话、技能和主目录。

| 子命令 | 描述 |
|------------|-------------|
| `list` | 列出所有 profiles。 |
| `use <name>` | 设置 sticky 默认 profile。 |
| `create <name> [--clone] [--clone-all] [--clone-from <source>] [--no-alias]` | 创建新 profile。`--clone` 从活动 profile 复制 config、`.env` 和 `SOUL.md`。`--clone-all` 复制所有状态。`--clone-from` 指定源 profile。 |
| `delete <name> [-y]` | 删除 profile。 |
| `show <name>` | 显示 profile 详细信息（主目录、config 等）。 |
| `alias <name> [--remove] [--name NAME]` | 管理用于快速访问 profile 的包装脚本。 |
| `rename <old> <new>` | 重命名 profile。 |
| `export <name> [-o FILE]` | 将 profile 导出为 `.tar.gz` 存档。 |
| `import <archive> [--name NAME]` | 从 `.tar.gz` 存档导入 profile。 |

示例：

```bash
hermes profile list
hermes profile create work --clone
hermes profile use work
hermes profile alias work --name h-work
hermes profile export work -o work-backup.tar.gz
hermes profile import work-backup.tar.gz --name restored
hermes -p work chat -q "Hello from work profile"
```

## `hermes completion`

```bash
hermes completion [bash|zsh]
```

打印 shell 补全脚本到 stdout。在 shell profile 中 source 输出以获得 Hermes 命令、子命令和 profile 名称的 tab 补全。

示例：

```bash
# Bash
hermes completion bash >> ~/.bashrc

# Zsh
hermes completion zsh >> ~/.zshrc
```

## 维护命令

| 命令 | 描述 |
|---------|-------------|
| `hermes version` | 打印版本信息。 |
| `hermes update` | 拉取最新更改并重新安装依赖。 |
| `hermes uninstall [--full] [--yes]` | 移除 Hermes，可选择删除所有 config/数据。 |

## 另请参阅

- [斜杠命令参考](./slash-commands.md)
- [CLI 接口](../user-guide/cli.md)
- [会话](../user-guide/sessions.md)
- [技能系统](../user-guide/features/skills.md)
- [皮肤和主题](../user-guide/features/skins.md)
