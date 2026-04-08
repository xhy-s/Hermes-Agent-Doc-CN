---
sidebar_position: 2
title: "Prompt 组装"
description: "Hermes Agent 如何组装系统 prompt：从 personality、记忆、skills、上下文文件构建"
---

# Prompt 组装

Hermes Agent 在对话生命周期的每个关键时刻构建和维护系统 prompt。本文档解释它是如何工作的。

## 概述

系统 prompt 不是静态的 — 它是动态组装的来自多个来源：

```
System prompt =
    [Personality Layer]      # SOUL.md / 性格文件
    + [Capability Flags]     # 功能开启/关闭
    + [Memory Layer]         # MEMORY.md + USER.md
    + [Skills Layer]         # 已启用的 skills
    + [Context Files]        # AGENTS.md, .hermes.md 等
    + [Tool Guidance]        # 工具使用说明
    + [Model-Specific]       # 模型特定指令
```

## Prompt 构建器

`agent/prompt_builder.py` 中的 `PromptBuilder` 类处理所有 prompt 组装。

### 构建阶段

```python
def build_system_prompt(self, context: BuildContext) -> str:
    parts = []

    # 1. 性格
    parts.append(self.load_personality())

    # 2. 功能标记
    parts.append(self.render_capability_flags())

    # 3. 记忆
    if context.include_memory:
        parts.append(self.render_memory())

    # 4. Skills
    if context.enabled_skills:
        parts.append(self.render_skills(context.enabled_skills))

    # 5. 上下文文件
    parts.append(self.render_context_files())

    # 6. 工具指导
    parts.append(self.render_tool_guidance())

    # 7. 模型特定
    parts.append(self.render_model_specific())

    return "\n\n".join(filter(None, parts))
```

## 层次详情

### 1. 性格层

从 `SOUL.md` 或用户配置的性格文件加载。这定义了 AIAgent 的整体个性和行为模式。

### 2. 功能标记

基于 `config.yaml` 中的设置渲染功能标记：

```yaml
features:
  memory_enabled: true
  skills_enabled: true
  cron_enabled: true
```

### 3. 记忆层

渲染 `MEMORY.md`（跨会话持久化的记忆）和 `USER.md`（用户偏好和上下文）的内容。

### 4. Skills 层

将所有已启用 skills 的内容注入为上下文。每个 skill 格式为：

```
=== SKILL: skill-name ===

[skill 内容 from SKILL.md]

===
```

### 5. 上下文文件

扫描并渲染额外的上下文文件：
- `AGENTS.md` — 项目特定的 agent 指令
- `.hermes.md` — 用户主目录的 Hermite 配置
- 其他在 `config.yaml` 中指定的文件

### 6. 工具指导

根据启用的工具集渲染工具使用说明：

```yaml
tools:
  enabled_toolsets:
    - terminal
    - file
    - web
```

### 7. 模型特定

模型特定的指令和配置。

## Prompt 稳定性

### 不变性规则

**系统 prompt 在对话过程中不会改变**，除非：
- 用户明确要求改变（`/model`、`/reset`）
- 发生压缩（追加说明而非替换）
- 上下文文件被外部修改

### 缓存

`PromptBuilder` 缓存构建的 prompt 以避免不必要的重建：

```python
def build_system_prompt(self, context: BuildContext) -> str:
    cache_key = self._compute_cache_key(context)
    if cache_key in self._cache:
        return self._cache[cache_key]

    prompt = self._build_impl(context)
    self._cache[cache_key] = prompt
    return prompt
```

缓存失效发生在：
- 新的 `context_hash`（skill 改变、配置改变）
- 压缩之后（追加变化说明）

## 压缩交互

当上下文压缩发生时，prompt 构建器会：

1. 在系统 prompt 后追加一条说明：`[Note: Some earlier conversation turns have been compacted...]`
2. 保持系统 prompt 本身不变（缓存不失效）
3. 仅在说明中反映压缩发生的事实

## 工具提示

### 工具可用性

只有启用工具集的工具才会被包含在工具 schema 中。禁用工具集中的工具不会出现在 prompt 中。

### 工具描述

工具描述来自 `schema` 中的 `description` 字段，在注册时设置。

## 上下文文件加载

### 文件发现顺序

1. `~/.hermes/AGENTS.md`
2. `./AGENTS.md`（当前工作目录）
3. 项目特定的 `.hermes.md`
4. `config.yaml` 中指定的额外文件

### 文件合并

多个上下文文件按顺序合并，用分隔符分开：

```
=== From ~/.hermes/AGENTS.md ===
[内容]
===

=== From ./AGENTS.md ===
[内容]
===
```

## 模型特定处理

### Anthropic

对于 Anthropic 模型，系统 prompt 可能被格式化为：
- 直接作为 `system` 消息
- 或作为第一个 `user` 消息（取决于 API 模式）

### OpenAI 兼容

对于 OpenAI 兼容端点，系统 prompt 作为标准的 `system` 消息角色。

## 调试 Prompt

查看 AIAgent 看到的实际 prompt：

```bash
hermes chat --debug -q "Your question"
```

这将打印完整组装的系统 prompt 以供检查。

## 相关文档

- [Agent 循环内部原理](./agent-loop.md)
- [上下文压缩与缓存](./context-compression-and-caching.md)
- [创建 Skills](./creating-skills.md)
