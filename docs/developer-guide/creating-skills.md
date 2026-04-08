---
sidebar_position: 3
title: "创建技能"
description: "如何为 Hermes Agent 创建技能 — SKILL.md 格式、指南和发布"
---

# 创建技能

技能是为 Hermes Agent 添加新能力的首选方式。它们比工具更容易创建，不需要对 agent 进行代码更改，并且可以与社区分享。

## 应该是 Skill 还是 Tool？

**做成 Skill** 当：
- 能力可以用指令 + shell 命令 + 现有工具表达
- 它包装了 agent 可以通过 `terminal` 或 `web_extract` 调用的外部 CLI 或 API
- 它不需要烘焙到 agent 中的自定义 Python 集成或 API 密钥管理
- 示例：arXiv 搜索、git 工作流、Docker 管理、PDF 处理、通过 CLI 工具发送电子邮件

**做成 Tool** 当：
- 它需要与 API 密钥、auth 流程或多组件配置的端到端集成
- 它需要必须每次精确执行的自定义处理逻辑
- 它处理二进制数据、流式处理或实时事件
- 示例：浏览器自动化、TTS、视觉分析

## 技能目录结构

捆绑的 skills 生活在 `skills/` 中，按类别组织。官方可选 skills 在 `optional-skills/` 中使用相同的结构：

```text
skills/
├── research/
│   └── arxiv/
│       ├── SKILL.md              # 必需：主要指令
│       └── scripts/              # 可选：辅助脚本
│           └── search_arxiv.py
├── productivity/
│   └── ocr-and-documents/
│       ├── SKILL.md
│       ├── scripts/
│       └── references/
└── ...
```

## SKILL.md 格式

```markdown
---
name: my-skill
description: Brief description (shown in skill search results)
version: 1.0.0
author: Your Name
license: MIT
platforms: [macos, linux]          # 可选 — 限制为特定 OS 平台
                                   #   有效值：macos、linux、windows
                                   #   省略则在所有平台加载（默认）
metadata:
  hermes:
    tags: [Category, Subcategory, Keywords]
    related_skills: [other-skill-name]
    requires_toolsets: [web]            # 可选 — 仅在这些工具集激活时显示
    requires_tools: [web_search]        # 可选 — 仅在这些工具可用时显示
    fallback_for_toolsets: [browser]    # 可选 — 在这些工具集激活时隐藏
    fallback_for_tools: [browser_navigate]  # 可选 — 在这些工具存在时隐藏
    config:                              # 可选 — 技能需要的 config.yaml 设置
      - key: my.setting
        description: "What this setting controls"
        default: "sensible-default"
        prompt: "Display prompt for setup"
required_environment_variables:          # 可选 — 技能需要的环境变量
  - name: MY_API_KEY
    prompt: "Enter your API key"
    help: "Get one at https://example.com"
    required_for: "API access"
---

# Skill Title

Brief intro.

## When to Use
Trigger conditions — when should the agent load this skill?

## Quick Reference
Table of common commands or API calls.

## Procedure
Step-by-step instructions the agent follows.

## Pitfalls
Known failure modes and how to handle them.

## Verification
How the agent confirms it worked.
```

### 平台特定技能

技能可以使用 `platforms` 字段将自己限制在特定操作系统：

```yaml
platforms: [macos]            # 仅 macOS（例如 iMessage、Apple Reminders）
platforms: [macos, linux]     # macOS 和 Linux
platforms: [windows]          # 仅 Windows
```

设置后，技能会在不兼容平台上从系统 prompt、`skills_list()` 和斜杠命令中自动隐藏。如果省略或为空，技能在所有平台上加载（向后兼容）。

### 条件技能激活

技能可以声明对特定工具或工具集的依赖。这控制技能是否出现在给定会话的系统 prompt 中。

```yaml
metadata:
  hermes:
    requires_toolsets: [web]           # 如果 web 工具集**未**激活则隐藏
    requires_tools: [web_search]       # 如果 web_search 工具**未**激活则隐藏
    fallback_for_toolsets: [browser]   # 如果 browser 工具集**已**激活则隐藏
    fallback_for_tools: [browser_navigate]  # 如果 browser_navigate **已**可用则隐藏
```

| 字段 | 行为 |
|-------|-------|
| `requires_toolsets` | 当**任何**列出的工具集**未**激活时，技能**隐藏** |
| `requires_tools` | 当**任何**列出的工具**未**激活时，技能**隐藏** |
| `fallback_for_toolsets` | 当**任何**列出的工具集**已**激活时，技能**隐藏** |
| `fallback_for_tools` | 当**任何**列出的工具**已**激活时，技能**隐藏** |

**`fallback_for_*` 的用例：** 创建一个在主工具不可用时作为工作替代的技能。例如，带有 `fallback_for_tools: [web_search]` 的 `duckduckgo-search` 技能仅在网络搜索工具（需要 API 密钥）未配置时显示。

**`requires_*` 的用例：** 创建一个仅在某些工具存在时才合理的技能。例如，带有 `requires_toolsets: [web]` 的网络抓取工作流技能在 web 工具被禁用时不会弄乱 prompt。

### 环境变量要求

技能可以声明它们需要的环境变量。当技能通过 `skill_view` 加载时，其必需的变量会自动注册以穿透到沙箱执行环境（terminal、execute_code）。

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: "Tenor API key"               # 提示用户时显示
    help: "Get your key at https://tenor.com"  # 帮助文本或 URL
    required_for: "GIF search functionality"   # 什么需要这个变量
```

每个条目支持：
- `name`（必需）— 环境变量名称
- `prompt`（可选）— 询问用户值时显示的提示文本
- `help`（可选）— 获取值的帮助文本或 URL
- `required_for`（可选）— 描述哪个功能需要这个变量

用户也可以在 `config.yaml` 中手动配置穿透变量：

```yaml
terminal:
  env_passthrough:
    - MY_CUSTOM_VAR
    - ANOTHER_VAR
```

见 `skills/apple/` 获取 macOS 专用技能的示例。

## 加载时的安全设置

当技能需要 API 密钥或令牌时使用 `required_environment_variables`。缺失值**不会**从发现中隐藏技能。相反，Hermes 在本地 CLI 中加载技能时会安全地提示输入。

```yaml
required_environment_variables:
  - name: TENOR_API_KEY
    prompt: Tenor API key
    help: Get a key from https://developers.google.com/tenor
    required_for: full functionality
```

用户可以跳过设置并继续加载技能。Hermes 永远不会将原始 secret 值暴露给模型。Gateway 和消息会话显示本地设置指导，而不是在带内收集 secrets。

:::tip 沙箱穿透
当你的技能加载时，任何已设置的声明 `required_environment_variables` **都会自动穿透**到 `execute_code` 和 `terminal` 沙箱 — 包括 Docker 和 Modal 等远程后端。你的技能的脚本可以访问 `$TENOR_API_KEY`（或在 Python 中 `os.environ["TENOR_API_KEY"]`），而无需用户配置任何额外内容。见[环境变量穿透](/docs/user-guide/security#environment-variable-passthrough)获取详情。
:::

旧版 `prerequisites.env_vars` 仍然支持作为向后兼容别名。

### 配置设置（config.yaml）

技能可以声明存储在 `config.yaml` 的 `skills.config` 命名空间下的非秘密设置。与环境变量（存储在 `.env` 中的 secrets）不同，config 设置用于路径、偏好设置和其他非敏感值。

```yaml
metadata:
  hermes:
    config:
      - key: wiki.path
        description: Path to the LLM Wiki knowledge base directory
        default: "~/wiki"
        prompt: Wiki directory path
      - key: wiki.domain
        description: Domain the wiki covers
        default: ""
        prompt: Wiki domain (e.g., AI/ML research)
```

每个条目支持：
- `key`（必需）— 设置的点路径（例如 `wiki.path`）
- `description`（必需）— 解释设置控制什么
- `default`（可选）— 如果用户不配置则使用默认值
- `prompt`（可选）— 在 `hermes config migrate` 期间显示的提示文本；回退到 `description`

**工作原理：**

1. **存储：** 值写入 `config.yaml` 的 `skills.config.<key>` 下：
   ```yaml
   skills:
     config:
       wiki:
         path: ~/my-research
   ```

2. **发现：** `hermes config migrate` 扫描所有已启用技能，找到未配置设置并提示用户。设置也出现在 `hermes config show` 的"Skill Settings"下。

3. **运行时注入：** 当技能加载时，其配置值被解析并追加到技能消息：
   ```
   [Skill config (from ~/.hermes/config.yaml):
     wiki.path = /home/user/my-research
   ]
   ```
   Agent 无需自己读取 `config.yaml` 即可看到配置的值。

4. **手动设置：** 用户也可以直接设置值：
   ```bash
   hermes config set skills.config.wiki.path ~/my-wiki
   ```

:::tip 何时使用哪个
对 API 密钥、令牌和**secrets**（存储在 `~/.hermes/.env` 中，永不向模型显示）使用 `required_environment_variables`。对**路径、偏好设置和非敏感设置**（存储在 `config.yaml` 中，可在配置显示中查看）使用 `config`。
:::

### 凭证文件要求（OAuth 令牌等）

使用 OAuth 或基于文件的凭证的技能可以声明需要挂载到远程沙箱的文件。这适用于存储为**文件**的凭证（不是 env vars）— 通常是设置脚本生成的 OAuth 令牌文件。

```yaml
required_credential_files:
  - path: google_token.json
    description: Google OAuth2 token (created by setup script)
  - path: google_client_secret.json
    description: Google OAuth2 client credentials
```

每个条目支持：
- `path`（必需）— 相对于 `~/.hermes/` 的文件路径
- `description`（可选）— 解释文件是什么以及如何创建

加载时，Hermes 检查这些文件是否存在。缺失文件触发 `setup_needed`。现有文件自动：
- **挂载到 Docker** 容器作为只读绑定挂载
- **同步到 Modal** 沙箱（在创建时 + 每个命令之前，因此会话内 OAuth 有效）
- 在**本地**后端上无需特殊处理即可使用

:::tip 何时使用哪个
对简单的 API 密钥和令牌（存储在 `~/.hermes/.env` 中的字符串）使用 `required_environment_variables`。对 OAuth 令牌文件、客户端密钥、服务账户 JSON、证书或任何在磁盘上作为文件的凭证使用 `required_credential_files`。
:::

见 `skills/productivity/google-workspace/SKILL.md` 获取使用两者的完整示例。

## 技能指南

### 无外部依赖

首选 stdlib Python、curl 和现有 Hermes 工具（`web_extract`、`terminal`、`read_file`）。如果需要依赖，在技能中记录安装步骤。

### 渐进式披露

将最常见的工作流放在前面。边缘情况和高级用法放在底部。这使常见任务的 token 使用量保持较低。

### 包含辅助脚本

对于 XML/JSON 解析或复杂逻辑，在 `scripts/` 中包含辅助脚本 — 不要期望 LLM 每次都内联编写解析器。

### 测试它

运行技能并验证 agent 正确遵循指令：

```bash
hermes chat --toolsets skills -q "Use the X skill to do Y"
```

## 技能应该放在哪里？

捆绑技能（在 `skills/` 中）随每个 Hermes 安装一起发布。它们应该**对大多数用户广泛有用**：

- 文档处理、网络研究、常见开发工作流、系统管理
- 被各种人群定期使用

如果你的技能是官方的且有用但不是普遍需要的（例如付费服务集成、重型依赖），将其放入 **`optional-skills/`** — 它随 repo 发布，可通过 `hermes skills browse` 发现（标记为"official"），并通过 builtin trust 安装。

如果你的技能是专门的、社区贡献的或小众的，它更适合 **Skills Hub** — 上传到注册表并通过 `hermes skills install` 分享。

## 发布技能

### 到 Skills Hub

```bash
hermes skills publish skills/my-skill --to github --repo owner/repo
```

### 到自定义仓库

将你的仓库添加为 tap：

```bash
hermes skills tap add owner/repo
```

然后用户可以从中搜索和安装。

## 安全扫描

所有 hub 安装的技能都经过安全扫描器检查：

- 数据泄露模式
- Prompt 注入尝试
- 破坏性命令
- Shell 注入

信任级别：
- `builtin` — 随 Hermes 发布（始终信任）
- `official` — 来自 repo 中的 `optional-skills/`（builtin trust，无第三方警告）
- `trusted` — 来自 openai/skills、anthropics/skills
- `community` — 非危险发现可以用 `--force` 覆盖；`dangerous` 裁决保持阻止

Hermes 现在可以从多个外部发现模型中使用第三方技能：
- 直接 GitHub 标识符（例如 `openai/skills/k8s`）
- `skills.sh` 标识符（例如 `skills-sh/vercel-labs/json-render/json-render-react`）
- 从 `/.well-known/skills/index.json` 提供服务的已知端点

如果你希望技能无需 GitHub 特定安装程序即可被发现，考虑除了在 repo 或市场中发布外，还从已知端点提供服务。
