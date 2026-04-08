---
sidebar_position: 3
title: "Agent 循环内部原理"
description: "AIAgent 执行、API 模式、工具、回调和回退行为的详细讲解"
---

# Agent 循环内部原理

核心编排引擎是 `run_agent.py` 中的 `AIAgent` 类 — 大约 9,200 行代码，处理从 prompt 组装到工具分发再到 provider 故障转移的所有工作。

## 核心职责

`AIAgent` 负责：

- 通过 `prompt_builder.py` 组装有效的系统 prompt 和工具 schema
- 选择正确的 provider/API 模式（chat_completions、codex_responses、anthropic_messages）
- 使用取消支持进行可中断的模型调用
- 执行工具调用（通过线程池顺序或并发）
- 在 OpenAI 消息格式中维护对话历史
- 处理压缩、重试和回退模型切换
- 跨父和子 agent 跟踪迭代预算
- 在上下文丢失之前刷新持久化记忆

## 两个入口点

```python
# 简单接口 — 返回最终响应字符串
response = agent.chat("Fix the bug in main.py")

# 完整接口 — 返回带有消息、元数据、使用统计的字典
result = agent.run_conversation(
    user_message="Fix the bug in main.py",
    system_message=None,           # 如果省略则自动构建
    conversation_history=None,      # 如果省略则自动从会话加载
    task_id="task_abc123"
)
```

`chat()` 是围绕 `run_conversation()` 的薄包装，从结果字典中提取 `final_response` 字段。

## API 模式

Hermes 支持三种 API 执行模式，从 provider 选择、显式参数和 base URL 启发式解析：

| API 模式 | 用于 | 客户端类型 |
|----------|----------|-------------|
| `chat_completions` | OpenAI 兼容端点（OpenRouter、自定义、大多数 provider） | `openai.OpenAI` |
| `codex_responses` | OpenAI Codex / Responses API | `openai.OpenAI`（Responses 格式） |
| `anthropic_messages` | 原生 Anthropic Messages API | `anthropic.Anthropic`（通过适配器） |

模式决定消息如何格式化、工具调用如何构造、响应如何解析以及缓存/流式处理如何工作。所有三种模式在 API 调用之前和之后都会聚到相同的内部消息格式（OpenAI 风格的 `role`/`content`/`tool_calls` 字典）。

**模式解析顺序：**
1. 显式 `api_mode` 构造函数参数（最高优先级）
2. Provider 特定检测（例如 `anthropic` provider → `anthropic_messages`）
3. Base URL 启发式（例如 `api.anthropic.com` → `anthropic_messages`）
4. 默认：`chat_completions`

## 轮次生命周期

agent 循环的每次迭代遵循此顺序：

```text
run_conversation()
  1. 如果未提供则生成 task_id
  2. 将用户消息追加到对话历史
  3. 构建或重用缓存的系统 prompt（prompt_builder.py）
  4. 检查是否需要预压缩（> 50% 上下文）
  5. 从对话历史构建 API 消息
     - chat_completions: OpenAI 格式原样
     - codex_responses: 转换为 Responses API 输入项
     - anthropic_messages: 通过 anthropic_adapter.py 转换
  6. 注入临时 prompt 层（预算警告、上下文压力）
  7. 如果在 Anthropic 上则应用 prompt 缓存标记
  8. 进行可中断的 API 调用（_api_call_with_interrupt）
  9. 解析响应：
     - 如果有 tool_calls：执行它们，追加结果，返回步骤 5
     - 如果是文本响应：持久化会话，必要时刷新记忆，返回
```

### 消息格式

所有消息在内部使用 OpenAI 兼容格式：

```python
{"role": "system", "content": "..."}
{"role": "user", "content": "..."}
{"role": "assistant", "content": "...", "tool_calls": [...]}
{"role": "tool", "tool_call_id": "...", "content": "..."}
```

推理内容（来自支持扩展思考的模型的 `msg["reasoning"]` 字段）存储在 `assistant_msg["reasoning"]` 中，可选择通过 `reasoning_callback` 显示。

### 消息交替规则

agent 循环强制执行严格的角色交替：

- 系统消息之后：`User → Assistant → User → Assistant → ...`
- 工具调用期间：`Assistant（带 tool_calls）→ Tool → Tool → ... → Assistant`
- **永远不要**连续两个 assistant 消息
- **永远不要**连续两个 user 消息
- **只有** `tool` 角色可以有连续条目（并行工具结果）

Provider 验证这些序列并将拒绝格式错误的历史。

## 可中断的 API 调用

API 请求包装在 `_api_call_with_interrupt()` 中，它在实际 HTTP 调用在后台线程运行的同时监控中断事件：

```text
┌──────────────────────┐     ┌──────────────┐
│  主线程               │     │  API 线程    │
│  等待：              │────▶│  HTTP POST   │
│  - 响应就绪          │     │  到 provider │
│  - 中断事件          │     └──────────────┘
│  - 超时              │
└──────────────────────┘
```

当被中断时（用户发送新消息、`/stop` 命令或信号）：
- API 线程被放弃（响应被丢弃）
- Agent 可以干净地处理新输入或关闭
- 不会将部分响应注入对话历史

## 工具执行

### 顺序 vs 并发

当模型返回工具调用时：

- **单个工具调用** → 在主线程中直接执行
- **多个工具调用** → 通过 `ThreadPoolExecutor` 并发执行
  - 例外：标记为交互式的工具（例如 `clarify`）强制顺序执行
  - 结果按原始工具调用顺序重新插入，无论完成顺序如何

### 执行流程

```text
for each tool_call in response.tool_calls:
    1. 从 tools/registry.py 解析 handler
    2. 触发 pre_tool_call 插件钩子
    3. 检查是否为危险命令（tools/approval.py）
       - 如果危险：调用 approval_callback，等待用户
    4. 使用 args + task_id 执行 handler
    5. 触发 post_tool_call 插件钩子
    6. 将 {"role": "tool", "content": result} 追加到历史
```

### Agent 级工具

有些工具在到达 `handle_function_call()` **之前**被 `run_agent.py` *拦截*：

| 工具 | 为什么被拦截 |
|------|--------------------|
| `todo` | 读取/写入 agent 本地任务状态 |
| `memory` | 写入具有字符限制的持久化记忆文件 |
| `session_search` | 通过 agent 的会话 DB 查询会话历史 |
| `delegate_task` | 使用隔离上下文生成子 agent |

这些工具直接修改 agent 状态并返回合成工具结果，而不经过注册表。

## 回调接口

`AIAgent` 支持启用 CLI、gateway 和 ACP 集成中实时进度的平台特定回调：

| 回调 | 触发时机 | 使用者 |
|----------|-----------|---------|
| `tool_progress_callback` | 每个工具执行之前/之后 | CLI spinner、gateway 进度消息 |
| `thinking_callback` | 模型开始/停止思考时 | CLI "thinking..." 指示器 |
| `reasoning_callback` | 模型返回推理内容时 | CLI 推理显示、gateway 推理块 |
| `clarify_callback` | 调用 `clarify` 工具时 | CLI 输入提示、gateway 交互消息 |
| `step_callback` | 每个完整的 agent 轮次之后 | Gateway 步骤跟踪、ACP 进度 |
| `stream_delta_callback` | 每个流式 token（启用时） | CLI 流式显示 |
| `tool_gen_callback` | 从流中解析工具调用时 | CLI spinner 中的工具预览 |
| `status_callback` | 状态变化（思考、执行等）时 | ACP 状态更新 |

## 预算和回退行为

### 迭代预算

Agent 通过 `IterationBudget` 跟踪迭代：

- 默认：90 次迭代（可通过 `agent.max_turns` 配置）
- 跨父和子 agent 共享 — 子 agent 消耗父级的预算
- 通过 `_get_budget_warning()` 实现两级预算压力：
  - 70%+ 使用率（谨慎层）：将 `[BUDGET: Iteration X/Y. N iterations left. Start consolidating your work.]` 追加到最后一个工具结果
  - 90%+ 使用率（警告层）：将 `[BUDGET WARNING: Iteration X/Y. Only N iteration(s) left. Provide your final response NOW.]` 追加到最后一个工具结果
- 100% 时，agent 停止并返回已完成工作的摘要

### 回退模型

当主模型失败时（429 速率限制、5xx 服务器错误、401/403 认证错误）：

1. 检查配置中的 `fallback_providers` 列表
2. 按顺序尝试每个回退
3. 成功后，使用新 provider 继续对话
4. 遇到 401/403 时，在故障转移之前尝试刷新凭证

回退系统还独立覆盖辅助任务 — 视觉、压缩、网络提取和会话搜索各有自己的可配置回退链，通过 `auxiliary.*` 配置部分。

## 压缩和持久化

### 压缩触发时机

- **预压缩**（API 调用之前）：如果对话超过模型上下文窗口的 50%
- **Gateway 自动压缩**：如果对话超过 85%（更具侵略性，在轮次之间运行）

### 压缩期间发生什么

1. 记忆首先刷新到磁盘（防止数据丢失）
2. 中间对话轮次被摘要为紧凑摘要
3. 最后 N 条消息保持完整（`compression.protect_last_n`，默认：20）
4. 工具调用/结果消息对保持在一起（永不拆分）
5. 生成新的会话谱系 ID（压缩创建"子"会话）

### 会话持久化

每轮之后：
- 消息保存到会话存储（通过 `hermes_state.py` 的 SQLite）
- 记忆更改刷新到 `MEMORY.md` / `USER.md`
- 会话可以通过 `/resume` 或 `hermes chat --resume` 恢复

## 关键源文件

| 文件 | 用途 |
|------|------|
| `run_agent.py` | AIAgent 类 — 完整的 agent 循环（约 9,200 行） |
| `agent/prompt_builder.py` | 从记忆、skills、上下文文件、personality 组装系统 prompt |
| `agent/context_compressor.py` | 对话压缩算法 |
| `agent/prompt_caching.py` | Anthropic prompt 缓存标记和缓存指标 |
| `agent/auxiliary_client.py` | 用于辅助任务（视觉、摘要）的辅助 LLM 客户端 |
| `model_tools.py` | 工具 schema 收集、`handle_function_call()` 分发 |

## 相关文档

- [Provider 运行时解析](./provider-runtime.md)
- [Prompt 组装](./prompt-assembly.md)
- [上下文压缩与缓存](./context-compression-and-caching.md)
- [工具运行时](./tools-runtime.md)
- [架构概述](./architecture.md)
