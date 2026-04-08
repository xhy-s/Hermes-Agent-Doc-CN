---
sidebar_position: 12
title: "使用技能"
description: "查找、安装、使用和创建技能——按需知识，教 Hermes 新工作流程"
---

# 使用技能

技能是按需知识文档，教 Hermes 如何处理特定任务——从生成 ASCII 艺术到管理 GitHub PR。本指南带你了解日常使用它们的方法。

有关完整技术参考，请参见[技能系统](/docs/user-guide/features/skills)。

---

## 查找技能

每个 Hermes 安装都附带了捆绑的技能。查看可用内容：

```bash
# 在任何聊天会话中：
/skills

# 或者从 CLI：
hermes skills list
```

这显示了一个带有名称和描述的紧凑列表：

```
ascii-art         Generate ASCII art using pyfiglet, cowsay, boxes...
arxiv             Search and retrieve academic papers from arXiv...
github-pr-workflow Full PR lifecycle — create branches, commit...
plan              Plan mode — inspect context, write a markdown...
excalidraw        Create hand-drawn style diagrams using Excalidraw...
```

### 搜索技能

```bash
# 按关键词搜索
/skills search docker
/skills search music
```

### 技能中心

官方可选技能（默认未激活的较重或专业技能）可通过中心获得：

```bash
# 浏览官方可选技能
/skills browse

# 在中心搜索
/skills search blockchain
```

---

## 使用技能

每个已安装的技能都自动成为一个斜杠命令。只需输入它的名字：

```bash
# 加载一个技能并给它一个任务
/ascii-art Make a banner that says "HELLO WORLD"
/plan Design a REST API for a todo app
/github-pr-workflow Create a PR for the auth refactor

# 只需技能名称（无任务）加载它并让你描述你需要什么
/excalidraw
```

你也可以通过自然对话触发技能——让 Hermes 使用特定技能，它会通过 `skill_view` 工具加载它。

### 渐进式披露

技能使用令牌高效加载模式。代理不会一次加载所有内容：

1. **`skills_list()`** — 所有技能的紧凑列表（~3k tokens）。在会话开始时加载。
2. **`skill_view(name)`** — 一个技能的完整 SKILL.md 内容。当代理决定需要该技能时加载。
3. **`skill_view(name, file_path)`** — 技能内的特定参考文件。仅在需要时加载。

这意味着技能在实际使用之前不会消耗 tokens。

---

## 从中心安装

官方可选技能随 Hermes 一起提供，但默认未激活。显式安装它们：

```bash
# 安装一个官方可选技能
hermes skills install official/research/arxiv

# 在聊天会话中从中心安装
/skills install official/creative/songwriting-and-ai-music
```

发生的事情：
1. 技能目录被复制到 `~/.hermes/skills/`
2. 它出现在你的 `skills_list` 输出中
3. 它作为斜杠命令可用

:::tip
已安装的技能在新会话中生效。如果你想在当前会话中可用，使用 `/reset` 开始新的，或添加 `--now` 立即使提示缓存失效（下次 turn 花费更多 tokens）。
:::

### 验证安装

```bash
# 检查它在那里
hermes skills list | grep arxiv

# 或者在聊天中
/skills search arxiv
```

---

## 配置技能设置

一些技能在其 frontmatter 中声明它们需要的配置：

```yaml
metadata:
  hermes:
    config:
      - key: tenor.api_key
        description: "Tenor API key for GIF search"
        prompt: "Enter your Tenor API key"
        url: "https://developers.google.com/tenor/guides/quickstart"
```

当具有配置的技能首次加载时，Hermes 会提示你输入值。它们存储在 `config.yaml` 下的 `skills.config.*` 中。

从 CLI 管理技能配置：

```bash
# 交互式配置特定技能
hermes skills config gif-search

# 查看所有技能配置
hermes config get skills.config
```

---

## 创建你自己的技能

技能只是带有 YAML frontmatter 的 markdown 文件。创建一个不到五分钟。

### 1. 创建目录

```bash
mkdir -p ~/.hermes/skills/my-category/my-skill
```

### 2. 编写 SKILL.md

```markdown title="~/.hermes/skills/my-category/my-skill/SKILL.md"
---
name: my-skill
description: Brief description of what this skill does
version: 1.0.0
metadata:
  hermes:
    tags: [my-tag, automation]
    category: my-category
---

# My Skill

## When to Use
Use this skill when the user asks about [specific topic] or needs to [specific task].

## Procedure
1. First, check if [prerequisite] is available
2. Run `command --with-flags`
3. Parse the output and present results

## Pitfalls
- Common failure: [description]. Fix: [solution]
- Watch out for [edge case]

## Verification
Run `check-command` to confirm the result is correct.
```

### 3. 添加参考文件（可选）

技能可以包含代理按需加载的支持文件：

```
my-skill/
├── SKILL.md                    # Main skill document
├── references/
│   ├── api-docs.md             # API reference the agent can consult
│   └── examples.md             # Example inputs/outputs
├── templates/
│   └── config.yaml             # Template files the agent can use
└── scripts/
    └── setup.sh                # Scripts the agent can execute
```

在你的 SKILL.md 中引用这些：

```markdown
For API details, load the reference: `skill_view("my-skill", "references/api-docs.md")`
```

### 4. 测试它

开始新会话并尝试你的技能：

```bash
hermes chat -q "/my-skill help me with the thing"
```

技能自动出现——无需注册。把它放到 `~/.hermes/skills/` 它就生效了。

:::info
代理也可以使用 `skill_manage` 创建和更新技能。在解决复杂问题之后，Hermes 可能会提供将方法保存为技能。说出"是"——这些代理创作的技能捕获了包括沿途发现的陷阱在内的确切工作流程。
:::

---

## 按平台技能管理

控制哪些技能在哪些平台上可用：

```bash
hermes skills
```

这打开一个交互式 TUI，你可以在其中为每个平台（CLI、Telegram、Discord 等）启用或禁用技能。当你想让某些技能只在特定上下文中可用时很有用——例如，让开发技能远离 Telegram。

---

## 技能 vs 记忆

两者都在会话之间持久化，但它们服务不同目的：

| | 技能 | 记忆 |
|---|---|---|
| **什么** | 程序性知识——如何做事 | 事实性知识——事物是什么 |
| **何时** | 按需加载，仅在相关时 | 自动注入每个会话 |
| **大小** | 可以很大（数百行） | 应保持紧凑（仅关键事实） |
| **成本** | 加载前零 tokens | 小但恒定的 token 成本 |
| **示例** | "如何部署到 Kubernetes" | "用户更喜欢深色模式，住在 PST" |
| **谁创建** | 你、代理或从中心安装 | 基于对话的代理 |

**经验法则：** 如果你会把它放在参考文档中，它是技能。如果你把它放在便签上，它是记忆。

---

## 技巧

**保持技能专注。** 试图覆盖"所有 DevOps"的技能会太长太模糊。覆盖"将 Python 应用部署到 Fly.io"的技能足够具体，是真正有用的。

**让代理创建技能。** 在复杂多步骤任务之后，Hermes 通常会提供将方法保存为技能。说"是"——这些代理创作的技能捕获了包括沿途发现的陷阱在内的确切工作流程。

**使用分类。** 将技能组织到子目录中（`~/.hermes/skills/devops/`、`~/.hermes/skills/research/` 等）。这保持列表可管理并帮助代理更快找到相关技能。

**技能过时时要更新。** 如果你使用一个技能并遇到它没有涵盖的问题，告诉 Hermes 用你学到的内容更新技能。不维护的技能会成为负担。

---

*完整的技能参考——frontmatter 字段、条件激活、外部目录等——请参见[技能系统](/docs/user-guide/features/skills)。*
