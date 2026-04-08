---
sidebar_position: 13
title: "委托与并行工作"
description: "何时以及如何使用子代理委托——并行研究、代码审查和多文件工作的模式"
---

# 委托与并行工作

Hermes 可以生成隔离的子代理来并行处理任务。每个子代理获得自己的对话、终端会话和工具集。只有最终摘要返回——中间工具调用永远不会进入你的上下文窗口。

有关完整功能参考，请参见 [子代理委托](/docs/user-guide/features/delegation)。

---

## 何时委托

**适合委托的好候选：**
- 重推理子任务（调试、代码审查、研究综合）
- 会用中间数据淹没你上下文的任务
- 并行独立工作流（同时研究 A 和 B）
- 需要无偏见方法的新上下文任务

**使用其他方式：**
- 单工具调用 → 直接使用工具
- 有步骤间逻辑的机械多步工作 → `execute_code`
- 需要用户交互的任务 → 子代理不能使用 `clarify`
- 快速文件编辑 → 直接完成

---

## 模式：并行研究

同时研究三个主题并获得结构化摘要：

```
Research these three topics in parallel:
1. Current state of WebAssembly outside the browser
2. RISC-V server chip adoption in 2025
3. Practical quantum computing applications

Focus on recent developments and key players.
```

幕后，Hermes 使用：

```python
delegate_task(tasks=[
    {
        "goal": "Research WebAssembly outside the browser in 2025",
        "context": "Focus on: runtimes (Wasmtime, Wasmer), cloud/edge use cases, WASI progress",
        "toolsets": ["web"]
    },
    {
        "goal": "Research RISC-V server chip adoption",
        "context": "Focus on: server chips shipping, cloud providers adopting, software ecosystem",
        "toolsets": ["web"]
    },
    {
        "goal": "Research practical quantum computing applications",
        "context": "Focus on: error correction breakthroughs, real-world use cases, key companies",
        "toolsets": ["web"]
    }
])
```

全部并发运行。每个子代理独立搜索网络并返回摘要。父代理然后将它们综合为一个连贯的简报。

---

## 模式：代码审查

委托给一个没有偏见的新上下文子代理进行安全审查：

```
Review the authentication module at src/auth/ for security issues.
Check for SQL injection, JWT validation problems, password handling,
and session management. Fix anything you find and run the tests.
```

关键是 `context` 字段——它必须包含子代理需要的一切：

```python
delegate_task(
    goal="Review src/auth/ for security issues and fix any found",
    context="""Project at /home/user/webapp. Python 3.11, Flask, PyJWT, bcrypt.
    Auth files: src/auth/login.py, src/auth/jwt.py, src/auth/middleware.py
    Test command: pytest tests/auth/ -v
    Focus on: SQL injection, JWT validation, password hashing, session management.
    Fix issues found and verify tests pass.""",
    toolsets=["terminal", "file"]
)
```

:::warning 上下文问题
子代理**绝对不知道**你的对话。他们完全重新开始。如果委托"修复我们在讨论的 bug"，子代理不知道你说的哪个 bug。总要明确传递文件路径、错误消息、项目结构和约束。
:::

---

## 模式：比较替代方案

并行评估同一问题的多种方法，然后选择最好的：

```
I need to add full-text search to our Django app. Evaluate three approaches
in parallel:
1. PostgreSQL tsvector (built-in)
2. Elasticsearch via django-elasticsearch-dsl
3. Meilisearch via meilisearch-python

For each: setup complexity, query capabilities, resource requirements,
and maintenance overhead. Compare them and recommend one.
```

每个子代理独立研究一个选项。因为它们是隔离的，不会有交叉污染——每个评估都基于自身优缺点。父代理获得所有三个摘要并进行对比。

---

## 模式：多文件重构

将大型重构任务分散到并行子代理，每个处理代码库的不同部分：

```python
delegate_task(tasks=[
    {
        "goal": "Refactor all API endpoint handlers to use the new response format",
        "context": """Project at /home/user/api-server.
        Files: src/handlers/users.py, src/handlers/auth.py, src/handlers/billing.py
        Old format: return {"data": result, "status": "ok"}
        New format: return APIResponse(data=result, status=200).to_dict()
        Import: from src.responses import APIResponse
        Run tests after: pytest tests/handlers/ -v""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "Update all client SDK methods to handle the new response format",
        "context": """Project at /home/user/api-server.
        Files: sdk/python/client.py, sdk/python/models.py
        Old parsing: result = response.json()["data"]
        New parsing: result = response.json()["data"] (same key, but add status code checking)
        Also update sdk/python/tests/test_client.py""",
        "toolsets": ["terminal", "file"]
    },
    {
        "goal": "Update API documentation to reflect the new response format",
        "context": """Project at /home/user/api-server.
        Docs at: docs/api/. Format: Markdown with code examples.
        Update all response examples from old format to new format.
        Add a 'Response Format' section to docs/api/overview.md explaining the schema.""",
        "toolsets": ["terminal", "file"]
    }
])
```

:::tip
每个子代理获得自己的终端会话。它们可以在同一项目目录上工作而不会相互干扰——只要它们编辑不同的文件。如果两个子代理可能编辑同一文件，在你完成并行工作后自己处理该文件。
:::

---

## 模式：先收集再分析

使用 `execute_code` 进行机械数据收集，然后委托进行重推理分析：

```python
# Step 1: Mechanical gathering (execute_code is better here — no reasoning needed)
execute_code("""
from hermes_tools import web_search, web_extract

results = []
for query in ["AI funding Q1 2026", "AI startup acquisitions 2026", "AI IPOs 2026"]:
    r = web_search(query, limit=5)
    for item in r["data"]["web"]:
        results.append({"title": item["title"], "url": item["url"], "desc": item["description"]})

# Extract full content from top 5 most relevant
urls = [r["url"] for r in results[:5]]
content = web_extract(urls)

# Save for the analysis step
import json
with open("/tmp/ai-funding-data.json", "w") as f:
    json.dump({"search_results": results, "extracted": content["results"]}, f)
print(f"Collected {len(results)} results, extracted {len(content['results'])} pages")
""")

# Step 2: Reasoning-heavy analysis (delegation is better here)
delegate_task(
    goal="Analyze AI funding data and write a market report",
    context="""Raw data at /tmp/ai-funding-data.json contains search results and
    extracted web pages about AI funding, acquisitions, and IPOs in Q1 2026.
    Write a structured market report: key deals, trends, notable players,
    and outlook. Focus on deals over $100M.""",
    toolsets=["terminal", "file"]
)
```

这通常是最有效的模式：`execute_code` 廉价处理 10+ 顺序工具调用，然后子代理用干净上下文进行单次昂贵推理任务。

---

## 工具集选择

根据子代理需要选择工具集：

| 任务类型 | 工具集 | 为什么 |
|-----------|----------|-----|
| 网络研究 | `["web"]` | 仅 web_search + web_extract |
| 编码工作 | `["terminal", "file"]` | Shell 访问 + 文件操作 |
| 全栈 | `["terminal", "file", "web"]` | 除消息外的一切 |
| 只读分析 | `["file"]` | 只能读取文件，无 shell |

限制工具集保持子代理专注并防止意外副作用（如研究子代理运行 shell 命令）。

---

## 约束

- **最多 3 个并行任务** — 批次限制为 3 个并发子代理
- **不允许嵌套** — 子代理不能调用 `delegate_task`、`clarify`、`memory`、`send_message` 或 `execute_code`
- **独立终端** — 每个子代理获得自己的终端会话，具有独立工作目录和状态
- **无对话历史** — 子代理只看到你放在 `goal` 和 `context` 中的内容
- **默认 50 次迭代** — 对于简单任务设置更低的 `max_iterations` 以节省成本

---

## 技巧

**目标要具体。** "修复 bug" 太模糊。"修复 api/handlers.py 第 47 行的 TypeError，其中 process_request() 从 parse_body() 接收到 None" 给子代理足够的信息工作。

**包含文件路径。** 子代理不知道你的项目结构。总要包含相关文件的绝对路径、项目根目录和测试命令。

**使用委托进行上下文隔离。** 有时你需要新的视角。委托迫使你清楚地阐述问题，子代理在没有对话中积累的假设的情况下处理它。

**检查结果。** 子代理摘要只是摘要。如果子代理说"修复了 bug 并且测试通过"，通过自己运行测试或读取 diff 来验证。

---

*有关完整委托参考——所有参数、ACP 集成和高级配置——请参见 [子代理委托](/docs/user-guide/features/delegation)。*
