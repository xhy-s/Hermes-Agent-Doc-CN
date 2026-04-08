---
sidebar_position: 3
title: "持久化记忆"
description: "Hermes Agent 如何跨会话记忆 — MEMORY.md、USER.md 和会话搜索"
---

# 持久化记忆

Hermes Agent 有bounded的、精选的记忆，跨会话持久化。这让它能记住您的偏好、您的项目、您的环境，以及它学到的东西。

## 工作原理

两个文件构成代理的记忆：

| 文件 | 用途 | 字符限制 |
|------|---------|------------|
| **MEMORY.md** | 代理的个人笔记 — 环境事实、约定、学到的东西 | 2,200 字符（~800 tokens） |
| **USER.md** | 用户画像 — 您的偏好、沟通风格、期望 | 1,375 字符（~500 tokens） |

两者都存储在 `~/.hermes/memories/` 中，并在会话开始时作为冻结快照注入到系统提示中。代理通过 `memory` 工具管理自己的记忆 — 它可以添加、替换或删除条目。

:::info
字符限制保持记忆专注。当记忆满时，代理会整合或替换条目以腾出空间容纳新信息。
:::

## 记忆如何出现在系统提示中

在每个会话开始时，记忆条目从磁盘加载并渲染到系统提示中作为冻结块：

```
══════════════════════════════════════════════
MEMORY (your personal notes) [67% — 1,474/2,200 chars]
══════════════════════════════════════════════
User's project is a Rust web service at ~/code/myapi using Axum + SQLx
§
This machine runs Ubuntu 22.04, has Docker and Podman installed
§
User prefers concise responses, dislikes verbose explanations
```

格式包括：
- 显示哪个存储（MEMORY 或 USER PROFILE）的标题
- 使用百分比和字符计数，以便代理了解容量
- 用 `§`（章节符号）分隔符分隔的单个条目
- 条目可以多行

**冻结快照模式：** 系统提示注入在会话开始时捕获一次，中途永不更改。这是故意的 — 它为 LLM 前缀缓存保留以提高性能。当代理在会话期间添加/删除记忆条目时，更改会立即持久化到磁盘，但直到下一个会话开始才会出现在系统提示中。工具响应始终显示实时状态。

## 记忆工具操作

代理使用这些操作的 `memory` 工具：

- **add** — 添加新记忆条目
- **replace** — 用更新内容替换现有条目（使用 `old_text` 的子字符串匹配）
- **remove** — 删除不再相关的条目（使用 `old_text` 的子字符串匹配）

没有 `read` 操作 — 记忆内容在会话开始时自动注入到系统提示中。代理将记忆视为对话上下文的一部分。

### 子字符串匹配

`replace` 和 `remove` 操作使用短唯一子字符串匹配 — 您不需要完整条目文本。`old_text` 参数只需要一个唯一子字符串来精确识别一个条目：

```python
# 如果记忆包含 "User prefers dark mode in all editors"
memory(action="replace", target="memory",
       old_text="dark mode",
       content="User prefers light mode in VS Code, dark mode in terminal")
```

如果子字符串匹配多个条目，返回错误要求更具体的匹配。

## 两个目标解释

### `memory` — 代理的个人笔记

用于代理需要记住的关于环境、工作流和经验教训的信息：

- 环境事实（操作系统、工具、项目结构）
- 项目约定和配置
- 发现的工具怪癖和解决方法
- 已完成的任务日记条目
- 起作用的技能和技术

### `user` — 用户画像

用于关于用户身份、偏好和沟通风格的信息：

- 姓名、角色、时区
- 沟通偏好（简洁 vs 详细、格式偏好）
- 痛点和需要避免的事情
- 工作流习惯
- 技术水平

## 保存什么 vs 跳过什么

### 保存这些（主动）

代理自动保存 — 不需要您要求。它在学到以下内容时保存：

- **用户偏好：** "I prefer TypeScript over JavaScript" → 保存到 `user`
- **环境事实：** "This server runs Debian 12 with PostgreSQL 16" → 保存到 `memory`
- **纠正：** "Don't use `sudo` for Docker commands, user is in docker group" → 保存到 `memory`
- **约定：** "Project uses tabs, 120-char line width, Google-style docstrings" → 保存到 `memory`
- **已完成工作：** "Migrated database from MySQL to PostgreSQL on 2026-01-15" → 保存到 `memory`
- **明确请求：** "Remember that my API key rotation happens monthly" → 保存到 `memory`

### 跳过这些

- **平凡/显而易见的信息：** "User asked about Python" — 太模糊，无用
- **容易重新发现的事实：** "Python 3.12 supports f-string nesting" — 可以网络搜索
- **原始数据转储：** 大代码块、日志文件、数据表 — 对记忆来说太大
- **会话特定 ephemera：** 临时文件路径、一次性的调试上下文
- **已在上下文文件中的信息：** SOUL.md 和 AGENTS.md 内容

## 容量管理

记忆有严格的字符限制以保持系统提示bounded：

| 存储 | 限制 | 典型条目 |
|-------|-------|----------------|
| memory | 2,200 字符 | 8-15 条目 |
| user | 1,375 字符 | 5-10 条目 |

### 记忆满时会发生什么

当您尝试添加会超出限制的条目时，工具返回错误：

```json
{
  "success": false,
  "error": "Memory at 2,100/2,200 chars. Adding this entry (250 chars) would exceed the limit. Replace or remove existing entries first.",
  "current_entries": ["..."],
  "usage": "2,100/2,200"
}
```

代理然后应该：
1. 读取当前条目（错误响应中显示）
2. 识别可以删除或整合的条目
3. 使用 `replace` 将相关条目合并为更短版本
4. 然后 `add` 新条目

**最佳实践：** 当记忆超过 80% 容量（可在系统提示标题中看到）时，在添加新条目之前先整合条目。例如，将三个单独的 "project uses X" 条目合并为一个全面的项目描述条目。

### 好的记忆条目实用示例

**紧凑、信息密集的条目效果最好：**

```
# 好：打包多个相关事实
User runs macOS 14 Sonoma, uses Homebrew, has Docker Desktop and Podman. Shell: zsh with oh-my-zsh. Editor: VS Code with Vim keybindings.

# 好：具体、可操作的约定
Project ~/code/api uses Go 1.22, sqlc for DB queries, chi router. Run tests with 'make test'. CI via GitHub Actions.

# 好：有背景的经验教训
The staging server (10.0.1.50) needs SSH port 2222, not 22. Key is at ~/.ssh/staging_ed25519.

# 坏：太模糊
User has a project.

# 坏：太冗长
On January 5th, 2026, the user asked me to look at their project which is
located at ~/code/api. I discovered it uses Go version 1.22 and...
```

## 重复预防

记忆系统自动拒绝完全重复的条目。如果您尝试添加已存在的内容，它返回成功并显示 "no duplicate added" 消息。

## 安全扫描

记忆条目在接受之前会扫描注入和泄露模式，因为它们被注入到系统提示中。匹配威胁模式（提示注入、凭证泄露、SSH 后门）或包含不可见 Unicode 字符的内容会被阻止。

## 会话搜索

除了 MEMORY.md 和 USER.md，代理还可以使用 `session_search` 工具搜索过去的对话：

- 所有 CLI 和消息会话都存储在 SQLite（`~/.hermes/state.db`）中，带有 FTS5 全文搜索
- 搜索查询返回带有 Gemini Flash 摘要的相关过去对话
- 代理可以找到几周前讨论的内容，即使它们不在活动记忆中

```bash
hermes sessions list    # 浏览过去会话
```

### session_search 与 memory 比较

| 功能 | 持久化记忆 | 会话搜索 |
|---------|------------------|----------------|
| **容量** | ~1,300 tokens 总计 | 无限（所有会话） |
| **速度** | 即时（在系统提示中） | 需要搜索 + LLM 摘要 |
| **用例** | 始终可用的关键事实 | 查找具体过去对话 |
| **管理** | 代理手动策划 | 自动 — 所有会话存储 |
| **Token 成本** | 每个会话固定（~1,300 tokens） | 按需（需要时搜索） |

**Memory** 用于应该始终在上下文中的关键事实。**Session search** 用于"上周我们讨论过 X 吗？"这类查询，代理需要回忆过去对话的细节。

## 配置

```yaml
# 在 ~/.hermes/config.yaml 中
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # ~800 tokens
  user_char_limit: 1375     # ~500 tokens
```

## 外部记忆提供者

对于超越 MEMORY.md 和 USER.md 的更深层次、持久化记忆，Hermes 附带 8 个外部记忆提供者插件 — 包括 Honcho、OpenViking、Mem0、Hindsight、Holographic、RetainDB、ByteRover 和 Supermemory。

外部提供者**与**内置记忆一起运行（从不替换它），并添加知识图谱、语义搜索、自动事实提取和跨会话用户建模等功能。

```bash
hermes memory setup      # 选择提供者并配置它
hermes memory status     # 检查活动的是哪个
```

请参阅[记忆提供者](./memory-providers.md)指南，了解每个提供者的完整详情、安装说明和比较。
