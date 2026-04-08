---
---
sidebar_position: 2
title: "轨迹格式"
description: "Hermes Agent 轨迹的格式和规范化：ShareGPT 格式、推理内容和工具统计"
---

# 轨迹格式

Hermes Agent 将 agent 对话轨迹保存为 ShareGPT 格式的 JSONL，用于 RL 训练和评估。

## 概述

轨迹在每次对话结束时保存，包含完整的消息历史、推理内容、工具调用统计和元数据。

## ShareGPT 格式

每行是一个有效的 JSON 对象：

```json
{
  "id": "traj_abc123",
  "conversations": [
    {"from": "human", "value": "..."},
    {"from": "gpt", "value": "...", "think": "..."},
    {"from": "tool", "value": "...", "name": "tool_name"},
    {"from": "gpt", "value": "Final response"}
  ],
  "system": "...",
  "tools": [...],
  "tool_stats": {
    "terminal": {"calls": 5, "total_tokens": 1200},
    "read_file": {"calls": 3, "total_tokens": 800}
  },
  "turns": 8,
  "finish_reason": "stop",
  "model": "anthropic/claude-sonnet-4-6",
  "timestamp": "2026-03-30T14:22:31.456789",
  "completed": true
}
```

## 规范化

### 推理内容标记

轨迹转换器将所有推理规范化到 `<think>` 标签，无论模型原始如何产生：

1. **原生 thinking token**（来自 `msg["reasoning"]` 字段的 providers 如 Anthropic、OpenAI o 系列）：包装为 `<think>\n{reasoning}\n</think>\`，在内容之前预处理。

2. **REASONING_SCRATCHPAD XML**（当原生 thinking 被禁用且模型通过 system-prompt 指令的 XML 推理时）：`<REASONING_SCRATCHPAD>` 标签通过 `convert_scratchpad_to_think()` 转换为 `<think>`。

3. **空的 think 块**：确保每个 `gpt` 轮次都有 `<think>` 块。如果没有产生推理，插入空块：`<think>\n\n</think>\`` — 这确保训练数据格式一致。

### 工具调用规范化

来自 API 格式的工具调用（带有 `tool_call_id`、函数名、JSON 字符串格式的参数）转换为 XML 包装的 JSON：

```
<tool_call>
{"name": "terminal", "arguments": {"command": "ls -la"}}
</tool_call>
```

- 参数从 JSON 字符串解析回对象（不是双重编码）
- 如果 JSON 解析失败（不应该发生 — 在对话期间验证），使用空 `{}` 并记录警告
- 一个 assistant 轮次中的多个工具调用在一个 `gpt` 消息中产生多个 `<tool_call>` 块

### 工具响应规范化

跟随 assistant 消息的所有工具结果分组到一个带 XML 包装的 JSON 响应的单个 `tool` 轮次中：

```
<tool_response>
{"tool_call_id": "call_abc123", "name": "terminal", "content": "output here"}
</tool_response>
```

- 如果工具内容看起来像 JSON（以 `{` 或 `[` 开头），则被解析以便内容字段包含 JSON 对象/数组而不是字符串
- 多个工具结果在一个消息中用换行符连接
- 工具名称按位置与父 assistant 的 `tool_calls` 数组匹配

### 系统消息

系统消息在保存时生成（不是从对话中获取）。它遵循 Hermes function-calling prompt 模板，包含：

- 解释 function-calling 协议的前导文字
- 包含 JSON 工具定义的 `<tools>` XML 块
- `FunctionCall` 对象的 schema 引用
- `<tool_call>` 示例

工具定义包含 `name`、`description`、`parameters` 和 `required`（设置为 `null` 以匹配规范格式）。


## 加载轨迹

轨迹是标准 JSONL — 用任何 JSON-lines reader 加载：

```python
import json

def load_trajectories(path: str):
    """Load trajectory entries from a JSONL file."""
    entries = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                entries.append(json.loads(line))
    return entries

# Filter to successful completions only
successful = [e for e in load_trajectories("trajectory_samples.jsonl")
              if e.get("completed")]

# Extract just the conversations for training
training_data = [e["conversations"] for e in successful]
```

### 加载为 HuggingFace 数据集

```python
from datasets import load_dataset

ds = load_dataset("json", data_files="trajectory_samples.jsonl")
```

规范化的 `tool_stats` schema 确保所有条目具有相同的列，防止数据集加载期间的 Arrow schema 不匹配错误。


## 控制轨迹保存

在 CLI 中，轨迹保存由以下控制：

```yaml
# config.yaml
agent:
  save_trajectories: true  # 默认：false
```

或通过 `--save-trajectories` 标志。当 agent 用 `save_trajectories=True` 初始化时，`_save_trajectory()` 方法在每次对话轮次结束时调用。

批处理运行器始终保存轨迹（这是其主要目的）。

零推理的样本在所有轮次中通过批处理运行器自动丢弃，以避免用非推理示例污染训练数据。
