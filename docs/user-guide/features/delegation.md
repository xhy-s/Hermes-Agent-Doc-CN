---
sidebar_position: 7
title: "子代理委托"
description: "使用 delegate_task 生成具有隔离上下文、限制工具集和各自终端会话的隔离子代理"
---

# 子代理委托

`delegate_task` 工具生成具有隔离上下文、限制工具集和各自终端会话的子 AIAgent 实例。每个子代理获得新鲜对话并独立工作 — 只有其最终摘要进入父代理的上下文。

## 单任务

```python
delegate_task(
    goal="Debug why tests fail",
    context="Error: assertion in test_foo.py line 42",
    toolsets=["terminal", "file"]
)
```

## 并行批量

最多 3 个并发子代理：

```python
delegate_task(tasks=[
    {"goal": "Research topic A", "toolsets": ["web"]},
    {"goal": "Research topic B", "toolsets": ["web"]},
    {"goal": "Fix the build", "toolsets": ["terminal", "file"]}
])
```

## 子代理上下文如何工作

:::warning 关键：子代理一无所知
子代理从**完全新鲜的对话**开始。它们对父代理的对话历史、之前的工具调用或委托前讨论的任何内容都没有了解。子代理的唯一上下文来自您提供的 `goal` 和 `context` 字段。
:::

这意味着您必须传递子代理需要的**一切**：

```python
# 错误 - 子代理不知道"错误"是什么
delegate_task(goal="Fix the error")

# 正确 - 子代理有其需要的全部上下文
delegate_task(
    goal="Fix the TypeError in api/handlers.py",
    context="""文件 api/handlers.py 在第 47 行有 TypeError：
    'NoneType' object has no attribute 'get'。
    函数 process_request() 从 parse_body() 接收字典，
    但当 Content-Type 缺失时 parse_body() 返回 None。
    项目在 /home/user/myproject，使用 Python 3.11。"""
)
```

子代理收到从您的 goal 和 context 构建的专注系统提示，指导它完成任务并提供其所做工作的结构化摘要，包括修改的文件和遇到的任何问题。

## 实际示例

### 并行研究

同时研究多个主题并收集摘要：

```python
delegate_task(tasks=[
    {
        "goal": "Research the current state of WebAssembly in 2025",
        "context": "Focus on: browser support, non-browser runtimes, language support",
        "toolsets": ["web"]
    },
    {
        "goal": "Research the current state of RISC-V adoption in 2025",
        "context": "Focus on: server chips, embedded systems, software ecosystem",
        "toolsets": ["web"]
    },
    {
        "goal": "Research quantum computing progress in 2025",
        "context": "Focus on: error correction breakthroughs, practical applications, key players",
        "toolsets": ["web"]
    }
])
```

### 代码审查 + 修复

将审查和修复工作流委托给新鲜上下文：

```python
delegate_task(
    goal="Review the authentication module for security issues and fix any found",
    context="""项目在 /home/user/webapp。
    Auth 模块文件：src/auth/login.py, src/auth/jwt.py, src/auth/middleware.py。
    项目使用 Flask、PyJWT 和 bcrypt。
    重点关注：SQL 注入、JWT 验证、密码处理、会话管理。
    修复发现的任何问题并运行测试套件（pytest tests/auth/）。""",
    toolsets=["terminal", "file"]
)
```

### 多文件重构

委托一个会淹没父代理上下文的大型重构任务：

```python
delegate_task(
    goal="Refactor all Python files in src/ to replace print() with proper logging",
    context="""项目在 /home/user/myproject。
    使用 'logging' 模块和 logger = logging.getLogger(__name__)。
    替换 print() 调用为适当的日志级别：
    - print(f"Error: ...") -> logger.error(...)
    - print(f"Warning: ...") -> logger.warning(...)
    - print(f"Debug: ...") -> logger.debug(...)
    - 其他 prints -> logger.info(...)
    不要更改测试文件或 CLI 输出中的 print()。
    之后运行 pytest 验证没有破坏。""",
    toolsets=["terminal", "file"]
)
```

## 批量模式详情

当您提供 `tasks` 数组时，子代理使用线程池**并行**运行：

- **最大并发：** 3 个任务（如果 `tasks` 数组更长，则截断为 3）
- **线程池：** 使用 `ThreadPoolExecutor` 和 `MAX_CONCURRENT_CHILDREN = 3` 工作线程
- **进度显示：** 在 CLI 模式下，树视图实时显示每个子代理的工具调用，并带有每任务完成行。在网关模式下，进度被批处理并中继到父代理的进度回调
- **结果排序：** 结果按任务索引排序以匹配输入顺序，无论完成顺序如何
- **中断传播：** 中断父代理（例如发送新消息）会中断所有活动子代理

单任务委托直接运行，没有线程池开销。

## 模型覆盖

您可以通过 `config.yaml` 为子代理配置不同的模型 — 用于将简单任务委托给更便宜/更快的模型：

```yaml
# 在 ~/.hermes/config.yaml 中
delegation:
  model: "google/gemini-flash-2.0"    # 子代理的更便宜模型
  provider: "openrouter"              # 可选：将子代理路由到不同 provider
```

如果省略，子代理使用与父代理相同的模型。

## 工具集选择提示

`toolsets` 参数控制子代理有权访问哪些工具。根据任务选择：

| 工具集模式 | 使用场景 |
|----------------|----------|
| `["terminal", "file"]` | 代码工作、调试、文件编辑、构建 |
| `["web"]` | 研究、事实核查、文档查找 |
| `["terminal", "file", "web"]` | 全栈任务（默认） |
| `["file"]` | 只读分析，无需执行即可进行代码审查 |
| `["terminal"]` | 系统管理、进程管理 |

某些工具集无论您指定什么，**始终被阻止**用于子代理：
- `delegation` — 无递归委托（防止无限生成）
- `clarify` — 子代理不能与用户交互
- `memory` — 不写入共享持久化记忆
- `code_execution` — 子代理应逐步推理
- `send_message` — 无跨平台副作用（例如发送 Telegram 消息）

## 最大迭代次数

每个子代理有迭代限制（默认：50），控制它可以进行的工具调用轮次：

```python
delegate_task(
    goal="Quick file check",
    context="Check if /etc/nginx/nginx.conf exists and print its first 10 lines",
    max_iterations=10  # 简单任务，不需要很多轮次
)
```

## 深度限制

委托有**深度限制 2** — 父代理（深度 0）可以生成子代理（深度 1），但子代理不能再委托。这防止失控的递归委托链。

## 关键属性

- 每个子代理获得自己的**终端会话**（与父代理分开）
- **无嵌套委托** — 子代理不能再委托（无孙代理）
- 子代理**不能**调用：`delegate_task`、`clarify`、`memory`、`send_message`、`execute_code`
- **中断传播** — 中断父代理会中断所有活动子代理
- 只有最终摘要进入父代理的上下文，保持 token 使用高效
- 子代理继承父代理的**API 密钥、provider 配置和凭证池**（在速率限制时启用密钥轮换）

## 委托与 execute_code 对比

| 因素 | delegate_task | execute_code |
|--------|--------------|-------------|
| **推理** | 完整 LLM 推理循环 | 仅 Python 代码执行 |
| **上下文** | 新鲜隔离对话 | 无对话，只有脚本 |
| **工具访问** | 带推理的所有非阻塞工具 | 通过 RPC 的 7 个工具，无推理 |
| **并行性** | 最多 3 个并发子代理 | 单个脚本 |
| **最适合** | 需要判断的复杂任务 | 机械多步骤管道 |
| **Token 成本** | 更高（完整 LLM 循环） | 更低（仅返回 stdout） |
| **用户交互** | 无（子代理不能澄清） | 无 |

**经验法则：** 当子任务需要推理、判断或多步骤问题解决时使用 `delegate_task`。当您需要机械数据处理或脚本化工作流时使用 `execute_code`。

## 配置

```yaml
# 在 ~/.hermes/config.yaml 中
delegation:
  max_iterations: 50                        # 每个子代理的最大轮次（默认：50）
  default_toolsets: ["terminal", "file", "web"]  # 默认工具集
  model: "google/gemini-3-flash-preview"             # 可选的 provider/model 覆盖
  provider: "openrouter"                             # 可选的内置 provider

# 或使用直接自定义端点而不是 provider：
delegation:
  model: "qwen2.5-coder"
  base_url: "http://localhost:1234/v1"
  api_key: "local-key"
```

:::tip
代理根据任务复杂性自动处理委托。您不需要明确要求它委托 — 它会在有意义时这样做。
:::
