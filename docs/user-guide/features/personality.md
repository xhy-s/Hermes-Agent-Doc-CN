---
sidebar_position: 9
title: "个性 & SOUL.md"
description: "通过全局 SOUL.md、内置个性和自定义角色定义自定义 Hermes Agent 的个性"
---

# 个性 & SOUL.md

Hermes Agent 的个性是完全可定制的。`SOUL.md` 是**主要身份** — 它是系统提示中的第一个内容，定义代理是谁。

- `SOUL.md` — 一个耐用的角色文件，位于 `HERMES_HOME`，作为代理的身份（系统提示中的槽位 #1）
- 内置或自定义 `/personality` 预设 — 会话级系统提示覆盖

如果您想改变 Hermes 是谁 — 或用完全不同的代理角色替换它 — 编辑 `SOUL.md`。

## SOUL.md 现在如何工作

Hermes 自动在以下位置生成默认 `SOUL.md`：

```text
~/.hermes/SOUL.md
```

更准确地说，它使用当前实例的 `HERMES_HOME`，因此如果您使用自定义主目录运行 Hermes，它将使用：

```text
$HERMES_HOME/SOUL.md
```

### 重要行为

- **SOUL.md 是代理的主要身份。** 它占据系统提示中的槽位 #1，替换硬编码的默认身份。
- 如果尚不存在，Hermes 自动创建起始 `SOUL.md`
- 现有用户 `SOUL.md` 文件永远不会被覆盖
- Hermes 仅从 `HERMES_HOME` 加载 `SOUL.md`
- Hermes 不在当前工作目录中查找 `SOUL.md`
- 如果 `SOUL.md` 存在但为空，或无法加载，Hermes 回退到内置默认身份
- 如果 `SOUL.md` 有内容，在安全扫描和截断后逐字注入
- SOUL.md **不在**上下文文件部分重复 — 它仅出现一次，作为身份

这使 `SOUL.md` 成为真正的每用户或每实例身份，而不仅仅是附加层。

## 为什么这样设计

这保持个性可预测。

如果 Hermes 从您碰巧启动它的任何目录加载 `SOUL.md`，您的个性可能会在项目之间意外改变。通过仅从 `HERMES_HOME` 加载，个性属于 Hermes 实例本身。

这也让教学更容易：
- "编辑 `~/.hermes/SOUL.md` 改变 Hermes 的默认个性。"

## 在哪里编辑

对于大多数用户：

```bash
~/.hermes/SOUL.md
```

如果您使用自定义主目录：

```bash
$HERMES_HOME/SOUL.md
```

## SOUL.md 中应该放什么

将其用于持久的语音和个性指导，例如：
- 语气
- 沟通风格
- 直接程度
- 默认交互风格
- 风格上要避免什么
- Hermes 如何处理不确定性、分歧或歧义

少用于：
- 一次性项目指令
- 文件路径
- 仓库约定
- 临时工作流细节

那些属于 `AGENTS.md`，而不是 `SOUL.md`。

## 好的 SOUL.md 内容

一个好的 SOUL 文件是：
- 跨上下文稳定
- 足够广泛以适用于许多对话
- 足够具体以实质性塑造语音
- 专注于沟通和身份，而非特定任务的指令

### 示例

```markdown
# Personality

You are a pragmatic senior engineer with strong taste.
You optimize for truth, clarity, and usefulness over politeness theater.

## Style
- Be direct without being cold
- Prefer substance over filler
- Push back when something is a bad idea
- Admit uncertainty plainly
- Keep explanations compact unless depth is useful

## What to avoid
- Sycophancy
- Hype language
- Repeating the user's framing if it's wrong
- Overexplaining obvious things

## Technical posture
- Prefer simple systems over clever systems
- Care about operational reality, not idealized architecture
- Treat edge cases as part of the design, not cleanup
```

## Hermes 注入提示的内容

`SOUL.md` 内容直接进入系统提示的槽位 #1 — 代理身份位置。没有在其周围添加包装语言。

内容经过：
- 提示注入扫描
- 如果太大则截断

如果文件为空、仅空白或无法读取，Hermes 回退到内置默认身份（"You are Hermes Agent, an intelligent AI assistant created by Nous Research..."）。当设置 `skip_context_files` 时（例如在子代理/委托上下文中）也适用此回退。

## 安全扫描

`SOUL.md` 像其他带上下文文件一样在包含之前扫描提示注入模式。

这意味着您仍应将其集中在角色/语音上，而不是试图偷偷塞入奇怪的元指令。

## SOUL.md 与 AGENTS.md 的比较

这是最重要的区别。

### SOUL.md
用于：
- 身份
- 语气
- 风格
- 沟通默认
- 个性级行为

### AGENTS.md
用于：
- 项目架构
- 编码约定
- 工具偏好
- 仓库特定工作流
- 命令、端口、路径、部署笔记

一个有用的规则：
- 如果它应该跟随您到处走，它属于 `SOUL.md`
- 如果它属于项目，它属于 `AGENTS.md`

## SOUL.md 与 `/personality` 的比较

`SOUL.md` 是您的持久默认个性。

`/personality` 是更改或补充当前系统提示的会话级覆盖。

所以：
- `SOUL.md` = 基础语音
- `/personality` = 临时模式切换

示例：
- 保持务实的默认 SOUL，然后使用 `/personality teacher` 进行辅导对话
- 保持简洁的 SOUL，然后使用 `/personality creative` 进行头脑风暴

## 内置个性

Hermes 附带内置个性，您可以使用 `/personality` 切换。

| 名称 | 描述 |
|------|-------------|
| **helpful** | 友好、通用助手 |
| **concise** | 简洁、切中要害的响应 |
| **technical** | 详细、准确的技术专家 |
| **creative** | 创新、发散性思维 |
| **teacher** | 耐心的教育者，清晰的例子 |
| **kawaii** | 可爱的表达、星光和热情 ★ |
| **catgirl** | Neko-chan，带猫类表达，nya~ |
| **pirate** | 船长 Hermes，技术娴熟的海盗 |
| **shakespeare** | 莎士比亚风格的散文，戏剧性 flair |
| **surfer** | 完全冷静的兄弟氛围 |
| **noir** | 硬汉侦探叙述 |
| **uwu** | 最大可爱与 uwu 语言 |
| **philosopher** | 每个查询的深度思考 |
| **hype** | 最大能量和热情！！！ |

## 使用命令切换个性

### CLI

```text
/personality
/personality concise
/personality technical
```

### 消息平台

```text
/personality teacher
```

这些是方便的覆盖，但您的全局 `SOUL.md` 仍然赋予 Hermes 其持久默认个性，除非覆盖有意义地改变它。

## 配置中的自定义个性

您还可以在 `~/.hermes/config.yaml` 中的 `agent.personalities` 下定义命名自定义个性。

```yaml
agent:
  personalities:
    codereviewer: >
      You are a meticulous code reviewer. Identify bugs, security issues,
      performance concerns, and unclear design choices. Be precise and constructive.
```

然后切换到它：

```text
/personality codereviewer
```

## 推荐工作流

强大的默认设置：

1. 在 `~/.hermes/SOUL.md` 中保持深思熟虑的全局 `SOUL.md`
2. 将项目指令放在 `AGENTS.md`
3. 仅在想要临时模式切换时使用 `/personality`

这给您：
- 稳定的语音
- 在属于的地方的项目特定行为
- 必要时临时控制

## 个性与完整提示的交互

高层，提示栈包括：
1. **SOUL.md**（代理身份 — 或如果 SOUL.md 不可用则内置回退）
2. 工具感知行为指导
3. 记忆/用户上下文
4. 技能指导
5. 上下文文件（`AGENTS.md`、`.cursorrules`）
6. 时间戳
7. 平台特定格式提示
8. 可选的系统提示覆盖如 `/personality`

`SOUL.md` 是基础 — 其他一切都建立在其之上。

## 相关文档

- [上下文文件](/docs/user-guide/features/context-files)
- [配置](/docs/user-guide/configuration)
- [提示和最佳实践](/docs/guides/tips)
- [SOUL.md 指南](/docs/guides/use-soul-with-hermes)

## CLI 外观与会话个性的比较

会话个性和 CLI 外观是分开的：

- `SOUL.md`、`agent.system_prompt` 和 `/personality` 影响 Hermes 的说话方式
- `display.skin` 和 `/skin` 影响 Hermes 在终端中的外观

关于终端外观，参见[皮肤与主题](./skins.md)。
