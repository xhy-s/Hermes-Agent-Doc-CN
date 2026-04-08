---
sidebar_position: 4
title: "上下文压缩与缓存"
description: "Hermes Agent 如何使用双重压缩系统和 Anthropic prompt 缓存来高效管理长对话中的上下文窗口使用"
---

# 上下文压缩与缓存

Hermes Agent 使用双重压缩系统和 Anthropic prompt 缓存来在长对话中高效管理上下文窗口使用。

源文件：`agent/context_compressor.py`、`agent/prompt_caching.py`、
`gateway/run.py`（会话卫生）、`run_agent.py`（搜索 `_compress_context`）


## 双重压缩系统

Hermes 有两个独立的压缩层，各自独立运行：

```
                     ┌──────────────────────────┐
  输入消息            │   Gateway Session Hygiene  │  在上下文 85% 时触发
  ─────────────────► │   (pre-agent, 粗略估计)    │  大会话的安全网
                     └─────────────┬────────────┘
                                   │
                                   ▼
                     ┌──────────────────────────┐
                     │   Agent ContextCompressor │  在上下文 50% 时触发（默认）
                     │   (in-loop, 精确 token)    │  正常上下文管理
                     └──────────────────────────┘
```

### 1. Gateway 会话卫生（85% 阈值）

位于 `gateway/run.py`（搜索 `_maybe_compress_session`）。这是一个**安全网**，在 agent 处理消息之前运行。它防止会话在轮次之间增长过大时 API 失败（例如 Telegram/Discord 中的隔夜累积）。

- **阈值**：固定为模型上下文长度的 85%
- **Token 来源**：优先使用上次轮次 API 报告的 token；回退到粗略的基于字符的估计（`estimate_messages_tokens_rough`）
- **触发条件**：仅当 `len(history) >= 4` 且启用压缩时
- **目的**：捕获逃离 agent 自身压缩器的会话

gateway 卫生阈值故意高于 agent 的压缩器。如果将其设置为 50%（与 agent 相同），会导致长时间 gateway 会话中每轮都过早压缩。

### 2. Agent ContextCompressor（50% 阈值，可配置）

位于 `agent/context_compressor.py`。这是**主要压缩系统**，在 agent 的工具循环内运行，可访问准确的 API 报告的 token 计数。


## 配置

所有压缩设置从 `config.yaml` 的 `compression` 键下读取：

```yaml
compression:
  enabled: true              # 启用/禁用压缩（默认：true）
  threshold: 0.50            # 上下文窗口分数（默认：0.50 = 50%）
  target_ratio: 0.20         # 作为尾部保留的阈值比例（默认：0.20）
  protect_last_n: 20         # 受保护的尾部消息最小数量（默认：20）
  summary_model: null        # 摘要模型覆盖（默认：使用辅助模型）
```

### 参数详情

| 参数 | 默认值 | 范围 | 描述 |
|-----------|---------|-------|-------------|
| `threshold` | `0.50` | 0.0-1.0 | 当 prompt token ≥ `threshold × context_length` 时触发压缩 |
| `target_ratio` | `0.20` | 0.10-0.80 | 控制尾部保护 token 预算：`threshold_tokens × target_ratio` |
| `protect_last_n` | `20` | ≥1 | 始终保留的最近消息最小数量 |
| `protect_first_n` | `3` | （硬编码） | 系统 prompt + 第一次交互始终保留 |

### 计算值（200K 上下文模型，默认值）

```
context_length       = 200,000
threshold_tokens     = 200,000 × 0.50 = 100,000
tail_token_budget    = 100,000 × 0.20 = 20,000
max_summary_tokens   = min(200,000 × 0.05, 12,000) = 10,000
```


## 压缩算法

`ContextCompressor.compress()` 方法遵循 4 阶段算法：

### 阶段 1：修剪旧工具结果（廉价，无 LLM 调用）

超过 200 个字符的旧工具结果（不在受保护尾部内）被替换为：
```
[Old tool output cleared to save context space]
```

这是一个廉价的预传递，从冗长的工具输出（文件内容、终端输出、搜索结果）中节省大量 token。

### 阶段 2：确定边界

```
┌─────────────────────────────────────────────────────────────┐
│  消息列表                                                  │
│                                                            │
│  [0..2]  ← protect_first_n（系统 + 第一次交互）             │
│  [3..N]  ← 中间轮次 → 摘要                                   │
│  [N..end] ← 尾部（按 token 预算或 protect_last_n）           │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

尾部保护**基于 token 预算**：从末尾向后走，累积 token 直到预算用完。如果预算保护的消息少于固定 `protect_last_n` 数量，则回退到固定的计数。

边界对齐以避免拆分 tool_call/tool_result 组。`_align_boundary_backward()` 方法向后走过连续的工具结果，找到父 assistant 消息，保持组完整。

### 阶段 3：生成结构化摘要

中间轮次使用辅助 LLM 和结构化模板进行摘要：

```
## Goal
[用户试图完成什么]

## Constraints & Preferences
[用户偏好、编码风格、约束、重要决策]

## Progress
### Done
[已完成的工作 — 具体文件路径、运行的命令、结果]
### In Progress
[当前正在进行的工作]
### Blocked
[遇到的任何阻碍或问题]

## Key Decisions
[重要的技术决策及其原因]

## Relevant Files
[已读取、修改或创建的文件 — 附简要说明]

## Next Steps
[接下来需要发生的事情]

## Critical Context
[特定值、错误消息、配置详情]
```

摘要预算随压缩内容数量缩放：
- 公式：`content_tokens × 0.20`（`_SUMMARY_RATIO` 常量）
- 最小值：2,000 token
- 最大值：`min(context_length × 0.05, 12,000)` token

### 阶段 4：组装压缩消息

压缩后的消息列表为：
1. 头部消息（在第一次压缩时追加到系统 prompt 的说明）
2. 摘要消息（选择角色以避免连续的相同角色违规）
3. 尾部消息（未修改）

孤立 tool_call/tool_result 对通过 `_sanitize_tool_pairs()` 清理：
- 引用已删除调用的工具结果 → 已删除
- 其结果被删除的工具调用 → 注入存根结果

### 迭代重新压缩

在后续压缩中，将之前的摘要连同指令一起传递给 LLM，要求**更新**它而不是从头摘要。这在多次压缩中保留信息 — 项目从"In Progress"移动到"Done"，添加新进度，并删除过时信息。

压缩器实例上的 `_previous_summary` 字段存储此目的的最后摘要文本。


## 之前/之后示例

### 压缩前（45 条消息，约 95K token）

```
[0] system:    "You are a helpful assistant..." (system prompt)
[1] user:      "Help me set up a FastAPI project"
[2] assistant: <tool_call> terminal: mkdir project </tool_call>
[3] tool:      "directory created"
[4] assistant: <tool_call> write_file: main.py </tool_call>
[5] tool:      "file written (2.3KB)"
    ... 30 more turns of file editing, testing, debugging ...
[38] assistant: <tool_call> terminal: pytest </tool_call>
[39] tool:      "8 passed, 2 failed\n..."  (5KB output)
[40] user:      "Fix the failing tests"
[41] assistant: <tool_call> read_file: tests/test_api.py </tool_call>
[42] tool:      "import pytest\n..."  (3KB)
[43] assistant: "I see the issue with the test fixtures..."
[44] user:      "Great, also add error handling"
```

### 压缩后（25 条消息，约 45K token）

```
[0] system:    "You are a helpful assistant...
               [Note: Some earlier conversation turns have been compacted...]"
[1] user:      "Help me set up a FastAPI project"
[2] assistant: "[CONTEXT COMPACTION] Earlier turns were compacted...

               ## Goal
               Set up a FastAPI project with tests and error handling

               ## Progress
               ### Done
               - Created project structure: main.py, tests/, requirements.txt
               - Implemented 5 API endpoints in main.py
               - Wrote 10 test cases in tests/test_api.py
               - 8/10 tests passing

               ### In Progress
               - Fixing 2 failing tests (test_create_user, test_delete_user)

               ## Relevant Files
               - main.py — FastAPI app with 5 endpoints
               - tests/test_api.py — 10 test cases
               - requirements.txt — fastapi, pytest, httpx

               ## Next Steps
               - Fix failing test fixtures
               - Add error handling"
[3] user:      "Fix the failing tests"
[4] assistant: <tool_call> read_file: tests/test_api.py </tool_call>
[5] tool:      "import pytest\n..."
[6] assistant: "I see the issue with the test fixtures..."
[7] user:      "Great, also add error handling"
```


## Prompt 缓存（Anthropic）

来源：`agent/prompt_caching.py`

通过缓存对话前缀将多轮对话的输入 token 成本降低约 75%。使用 Anthropic 的 `cache_control` 断点。

### 策略：system_and_3

Anthropic 每个请求最多允许 4 个 `cache_control` 断点。Hermes 使用"system_and_3"策略：

```
断点 1：系统 prompt           （所有轮次稳定）
断点 2：倒数第 3 个非系统消息  ─┐
断点 3：倒数第 2 个非系统消息   ├─ 滚动窗口
断点 4：最后一个非系统消息      ─┘
```

### 工作原理

`apply_anthropic_cache_control()` 深拷贝消息并注入 `cache_control` 标记：

```python
# 缓存标记格式
marker = {"type": "ephemeral"}
# 或 1 小时 TTL：
marker = {"type": "ephemeral", "ttl": "1h"}
```

标记根据内容类型不同地应用：

| 内容类型 | 标记放置位置 |
|-------------|-------------------|
| 字符串内容 | 转换为 `[{"type": "text", "text": ..., "cache_control": ...}]` |
| 列表内容 | 添加到最后一个元素的 dict |
| None/空 | 添加为 `msg["cache_control"]` |
| 工具消息 | 添加为 `msg["cache_control"]`（原生 Anthropic 专用） |

### 缓存感知设计模式

1. **稳定的系统 prompt**：系统 prompt 是断点 1，在所有轮次中缓存。避免在对话中途改变它（压缩只在第一次压缩时追加说明）。

2. **消息顺序很重要**：缓存命中需要前缀匹配。在中间添加或删除消息会使之后所有内容的缓存失效。

3. **压缩缓存交互**：压缩后，压缩区域的缓存失效，但系统 prompt 缓存存活。滚动 3 消息窗口在 1-2 轮内重新建立缓存。

4. **TTL 选择**：默认是 `5m`（5 分钟）。对于长时间会话（用户在各轮之间休息）使用 `1h`。

### 启用 Prompt 缓存

当满足以下条件时，prompt 缓存自动启用：
- 模型是 Anthropic Claude 模型（通过模型名称检测）
- Provider 支持 `cache_control`（原生 Anthropic API 或 OpenRouter）

```yaml
# config.yaml — TTL 可配置
model:
  cache_ttl: "5m"   # "5m" 或 "1h"
```

CLI 在启动时显示缓存状态：
```
💾 Prompt caching: ENABLED (Claude via OpenRouter, 5m TTL)
```


## 上下文压力警告

Agent 在压缩阈值的 85% 处发出上下文压力警告（不是上下文的 85% — 是阈值本身的 85%，阈值本身是上下文的 50%）：

```
⚠️  Context is 85% to compaction threshold (42,500/50,000 tokens)
```

压缩后，如果使用率降至阈值的 85% 以下，警告状态清除。如果压缩未能降至警告水平以下（对话太密集），警告持续但压缩不会再次触发直到超过阈值。
