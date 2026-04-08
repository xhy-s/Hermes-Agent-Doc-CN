---
sidebar_position: 2
title: "ACP 内部原理"
description: "ACP 适配器的工作原理：生命周期、会话、事件桥、批准和工具渲染"
---

# ACP 内部原理

ACP 适配器将 Hermes 的同步 `AIAgent` 包装在异步 JSON-RPC stdio 服务器中。

关键实现文件：

- `acp_adapter/entry.py`
- `acp_adapter/server.py`
- `acp_adapter/session.py`
- `acp_adapter/events.py`
- `acp_adapter/permissions.py`
- `acp_adapter/tools.py`
- `acp_adapter/auth.py`
- `acp_registry/agent.json`

## 启动流程

```text
hermes acp / hermes-acp / python -m acp_adapter
  -> acp_adapter.entry.main()
  -> load ~/.hermes/.env
  -> configure stderr logging
  -> construct HermesACPAgent
  -> acp.run_agent(agent)
```

Stdout 保留用于 ACP JSON-RPC 传输。人类可读的日志发送到 stderr。

## 主要组件

### `HermesACPAgent`

`acp_adapter/server.py` 实现 ACP agent 协议。

职责：

- 初始化 / 认证
- new/load/resume/fork/list/cancel 会话方法
- prompt 执行
- 会话模型切换
- 将同步 AIAgent 回调连接到 ACP 异步通知的接线

### `SessionManager`

`acp_adapter/session.py` 跟踪 live ACP 会话。

每个会话存储：

- `session_id`
- `agent`
- `cwd`
- `model`
- `history`
- `cancel_event`

管理器是线程安全的，支持：

- create
- get
- remove
- fork
- list
- cleanup
- cwd updates

### 事件桥

`acp_adapter/events.py` 将 AIAgent 回调转换为 ACP `session_update` 事件。

桥接的回调：

- `tool_progress_callback`
- `thinking_callback`
- `step_callback`
- `message_callback`

因为 `AIAgent` 在工作线程中运行而 ACP I/O 位于主事件循环，桥使用：

```python
asyncio.run_coroutine_threadsafe(...)
```

### 权限桥

`acp_adapter/permissions.py` 将危险的终端批准提示适配为 ACP 权限请求。

映射：

- `allow_once` -> Hermes `once`
- `allow_always` -> Hermes `always`
- reject 选项 -> Hermes `deny`

超时和桥接失败默认为拒绝。

### 工具渲染辅助函数

`acp_adapter/tools.py` 将 Hermes 工具映射到 ACP 工具种类并构建面向编辑器的内容。

示例：

- `patch` / `write_file` -> 文件 diff
- `terminal` -> shell 命令文本
- `read_file` / `search_files` -> 文本预览
- 大结果 -> 为 UI 安全截断的文本块

## 会话生命周期

```text
new_session(cwd)
  -> create SessionState
  -> create AIAgent(platform="acp", enabled_toolsets=["hermes-acp"])
  -> bind task_id/session_id to cwd override

prompt(..., session_id)
  -> 从 ACP content blocks 提取文本
  -> 重置 cancel event
  -> 安装回调 + 批准桥
  -> 在 ThreadPoolExecutor 中运行 AIAgent
  -> 更新会话历史
  -> 发出最终 agent 消息块
```

### 取消

`cancel(session_id)`：

- 设置会话取消事件
- 在可用时调用 `agent.interrupt()`
- 导致 prompt 响应返回 `stop_reason="cancelled"`

### 分叉

`fork_session()` 将消息历史深拷贝到一个新的 live 会话，在保留对话状态的同时给分叉自己的 session ID 和 cwd。

## Provider/auth 行为

ACP 不实现自己的 auth store。

相反它复用 Hermes 的运行时解析器：

- `acp_adapter/auth.py`
- `hermes_cli/runtime_provider.py`

所以 ACP 通告并使用当前配置的 Hermes provider/凭证。

## 工作目录绑定

ACP 会话携带编辑器 cwd。

会话管理器通过任务作用域的 terminal/file 覆盖将该 cwd 绑定到 ACP 会话 ID，因此 file 和 terminal 工具相对于编辑器工作区操作。

## 重复同名工具调用

事件桥按工具名称跟踪工具 ID FIFO，而不仅仅是一个 ID 每名称。这对于以下情况很重要：

- 并行同名调用
- 一步中重复的同名调用

没有 FIFO 队列，完成事件会附加到错误的工具调用。

## 批准回调恢复

ACP 在 prompt 执行期间在终端工具上临时安装批准回调，然后之后恢复之前的回调。这避免将 ACP 会话特定的批准处理程序全局永久安装。

## 当前限制

- ACP 会话从 ACP 服务器的角度来说是进程本地的
- 非文本 prompt 块当前被忽略以进行请求文本提取
- 编辑器特定的 UX 因 ACP 客户端实现而异

## 相关文件

- `tests/acp/` — ACP 测试套件
- `toolsets.py` — `hermes-acp` 工具集定义
- `hermes_cli/main.py` — `hermes acp` CLI 子命令
- `pyproject.toml` — `[acp]` 可选依赖 + `hermes-acp` 脚本
