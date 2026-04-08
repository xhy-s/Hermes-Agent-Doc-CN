---
sidebar_position: 11
sidebar_label: "插件"
title: "插件"
description: "通过插件系统扩展 Hermes 的自定义工具、钩子和集成"
---

# 插件

Hermes 有一个插件系统，用于在不改写核心代码的情况下添加自定义工具、钩子和集成。

**→ [构建 Hermes 插件](/docs/guides/build-a-hermes-plugin)** — 带有完整工作示例的分步指南。

## 快速概览

将一个目录放入 `~/.hermes/plugins/`，包含 `plugin.yaml` 和 Python 代码：

```
~/.hermes/plugins/my-plugin/
├── plugin.yaml      # 清单
├── __init__.py      # register() — 将模式连接到处理程序
├── schemas.py       # 工具模式（LLM 看到的）
└── tools.py         # 工具处理程序（调用时运行的）
```

启动 Hermes — 您的工具与内置工具一起出现。模型可以立即调用它们。

### 最小工作示例

这是一个添加 `hello_world` 工具并通过钩子记录每个工具调用的完整插件。

**`~/.hermes/plugins/hello-world/plugin.yaml`**

```yaml
name: hello-world
version: "1.0"
description: A minimal example plugin
```

**`~/.hermes/plugins/hello-world/__init__.py`**

```python
"""Minimal Hermes plugin — registers a tool and a hook."""


def register(ctx):
    # --- Tool: hello_world ---
    schema = {
        "name": "hello_world",
        "description": "Returns a friendly greeting for the given name.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Name to greet",
                }
            },
            "required": ["name"],
        },
    }

    def handle_hello(params):
        name = params.get("name", "World")
        return f"Hello, {name}! 👋  (from the hello-world plugin)"

    ctx.register_tool("hello_world", schema, handle_hello)

    # --- Hook: log every tool call ---
    def on_tool_call(tool_name, params, result):
        print(f"[hello-world] tool called: {tool_name}")

    ctx.register_hook("post_tool_call", on_tool_call)
```

将两个文件放入 `~/.hermes/plugins/hello-world/`，重启 Hermes，模型就可以立即调用 `hello_world`。钩子在每次工具调用后打印一行日志。

`./.hermes/plugins/` 下的项目本地插件默认禁用。仅在通过在启动 Hermes 之前设置 `HERMES_ENABLE_PROJECT_PLUGINS=true` 来为可信仓库启用它们。

## 插件可以做什么

| 能力 | 如何做 |
|-----------|-----|
| 添加工具 | `ctx.register_tool(name, schema, handler)` |
| 添加钩子 | `ctx.register_hook("post_tool_call", callback)` |
| 添加 CLI 命令 | `ctx.register_cli_command(name, help, setup_fn, handler_fn)` — 添加 `hermes <plugin> <subcommand>` |
| 注入消息 | `ctx.inject_message(content, role="user")` — 参见[注入消息](#注入消息) |
| 附带数据文件 | `Path(__file__).parent / "data" / "file.yaml"` |
| 捆绑技能 | 在加载时将 `skill.md` 复制到 `~/.hermes/skills/` |
| 环境变量门控 | `plugin.yaml` 中的 `requires_env: [API_KEY]` — 在 `hermes plugins install` 期间提示 |
| 通过 pip 分发 | `[project.entry-points."hermes_agent.plugins"]` |

## 插件发现

| 来源 | 路径 | 使用场景 |
|--------|------|----------|
| 用户 | `~/.hermes/plugins/` | 个人插件 |
| 项目 | `.hermes/plugins/` | 项目特定插件（需要 `HERMES_ENABLE_PROJECT_PLUGINS=true`） |
| pip | `hermes_agent.plugins` 入口点 | 分发包 |

## 可用的钩子

插件可以为这些生命周期事件注册回调。参见**[事件钩子页面](/docs/user-guide/features/hooks#插件钩子)**获取完整详情、回调签名和示例。

| 钩子 | 触发于 |
|------|-----------|
| [`pre_tool_call`](/docs/user-guide/features/hooks#pre_tool_call) | 任何工具执行前 |
| [`post_tool_call`](/docs/user-guide/features/hooks#post_tool_call) | 任何工具返回后 |
| [`pre_llm_call`](/docs/user-guide/features/hooks#pre_llm_call) | 每次 turn 开始、LLM 循环前 — 可以返回 `{"context": "..."}` 以[将上下文注入用户消息](/docs/user-guide/features/hooks#pre_llm_call) |
| [`post_llm_call`](/docs/user-guide/features/hooks#post_llm_call) | 每次 turn 结束后、LLM 循环后（仅成功 turn） |
| [`on_session_start`](/docs/user-guide/features/hooks#on_session_start) | 创建新会话时（仅第一次 turn） |
| [`on_session_end`](/docs/user-guide/features/hooks#on_session_end) | 每个 `run_conversation` 调用的结束 + CLI 退出处理程序 |

## 管理插件

```bash
hermes plugins                  # 交互式切换 UI — 使用复选框启用/禁用
hermes plugins list             # 带启用/禁用状态的表格视图
hermes plugins install user/repo  # 从 Git 安装
hermes plugins update my-plugin   # 拉取最新
hermes plugins remove my-plugin   # 卸载
hermes plugins enable my-plugin   # 重新启用已禁用的插件
hermes plugins disable my-plugin  # 禁用而不移除
```

不带参数运行 `hermes plugins` 会启动交互式 curses 复选框（与 `hermes tools` 相同的 UI），您可以使用方向键和空格启用/禁用插件。

已禁用的插件保持安装但在加载期间被跳过。禁用列表存储在 `config.yaml` 的 `plugins.disabled` 下：

```yaml
plugins:
  disabled:
    - my-noisy-plugin
```

在运行中的会话中，`/plugins` 显示当前加载了哪些插件。

## 注入消息

插件可以使用 `ctx.inject_message()` 将消息注入活动对话：

```python
ctx.inject_message("New data arrived from the webhook", role="user")
```

**签名：** `ctx.inject_message(content: str, role: str = "user") -> bool`

工作原理：

- 如果代理**空闲**（等待用户输入），消息作为下一个输入排队并开始新 turn。
- 如果代理**正在 turn 中**（主动运行），消息中断当前操作 — 与用户输入新消息并按 Enter 相同。
- 对于非 `"user"` 角色，内容被加上前缀 `[role]`（例如 `[system] ...`）。
- 如果消息成功排队则返回 `True`，如果没有 CLI 引用（例如在网关模式下）则返回 `False`。

这使得像远程控制查看器、消息桥接器或 webhook 接收器这样的插件能够从外部来源将消息输入对话。

:::note
`inject_message` 仅在 CLI 模式下可用。在网关模式下，没有 CLI 引用，方法返回 `False`。
:::

参见**[完整指南](/docs/guides/build-a-hermes-plugin)**获取处理程序契约、模式格式、钩子行为、错误处理和常见错误。
