---
sidebar_position: 4
title: "MCP (Model Context Protocol)"
description: "通过 MCP 将 Hermes Agent 连接到外部工具服务器 — 并精确控制 Hermes 加载哪些 MCP 工具"
---

# MCP (Model Context Protocol)

MCP 让 Hermes Agent 连接到外部工具服务器，以便代理可以使用存在于 Hermes 本身之外的工具 — GitHub、数据库、文件系统、浏览器栈、内部 API 等。

如果您曾经希望 Hermes 使用已经存在于其他地方的工具，MCP 通常是最干净的方式。

## MCP 给您什么

- 无需先编写原生 Hermes 工具即可访问外部工具生态系统
- 在同一配置中支持本地 stdio 服务器和远程 HTTP MCP 服务器
- 启动时自动工具发现和注册
- 当服务器支持时，自动为 MCP 资源和提示提供实用工具包装器
- 每个服务器过滤，以便您可以仅暴露您实际希望 Hermes 看到的 MCP 工具

## 快速开始

1. 安装 MCP 支持（如果您使用标准安装脚本，则已包含）：

```bash
cd ~/.hermes/hermes-agent
uv pip install -e ".[mcp]"
```

2. 在 `~/.hermes/config.yaml` 中添加 MCP 服务器：

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
```

3. 启动 Hermes：

```bash
hermes chat
```

4. 要求 Hermes 使用 MCP 支持的功能。

例如：

```text
List the files in /home/user/projects and summarize the repo structure.
```

Hermes 将发现 MCP 服务器的工具并像任何其他工具一样使用它们。

## 两种 MCP 服务器

### Stdio 服务器

Stdio 服务器作为本地子进程运行，通过 stdin/stdout 通信。

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
```

在以下情况下使用 stdio 服务器：
- 服务器在本地安装
- 您想要低延迟访问本地资源
- 您遵循显示 `command`、`args` 和 `env` 的 MCP 服务器文档

### HTTP 服务器

HTTP MCP 服务器是 Hermes 直接连接的远程端点。

```yaml
mcp_servers:
  remote_api:
    url: "https://mcp.example.com/mcp"
    headers:
      Authorization: "Bearer ***"
```

在以下情况下使用 HTTP 服务器：
- MCP 服务器托管在其他地方
- 您的组织暴露内部 MCP 端点
- 您不希望 Hermes 为该集成生成本地子进程

## 基本配置参考

Hermes 从 `~/.hermes/config.yaml` 中的 `mcp_servers` 下读取 MCP 配置。

### 通用键

| 键 | 类型 | 含义 |
|---|---|---|
| `command` | 字符串 | stdio MCP 服务器的可执行文件 |
| `args` | 列表 | stdio 服务器的参数 |
| `env` | 映射 | 传递给 stdio 服务器的环境变量 |
| `url` | 字符串 | HTTP MCP 端点 |
| `headers` | 映射 | 远程服务器的 HTTP 头 |
| `timeout` | 数字 | 工具调用超时 |
| `connect_timeout` | 数字 | 初始连接超时 |
| `enabled` | 布尔 | 如果为 `false`，Hermes 完全跳过服务器 |
| `tools` | 映射 | 每个服务器的工个过滤和实用工具策略 |

### 最小 stdio 示例

```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
```

### 最小 HTTP 示例

```yaml
mcp_servers:
  company_api:
    url: "https://mcp.internal.example.com"
    headers:
      Authorization: "Bearer ***"
```

## Hermes 如何注册 MCP 工具

Hermes 为 MCP 工具添加前缀以避免与内置名称冲突：

```text
mcp_<server_name>_<tool_name>
```

示例：

| 服务器 | MCP 工具 | 注册名称 |
|---|---|---|
| `filesystem` | `read_file` | `mcp_filesystem_read_file` |
| `github` | `create_issue` | `mcp_github_create_issue` |
| `my-api` | `query_data` | `mcp_my_api_query_data` |

在实践中，您通常不需要手动调用带前缀的名称 — Hermes 查看工具并在正常推理过程中选择它。

## MCP 实用工具

当支持时，Hermes 还围绕 MCP 资源和提示注册实用工具：

- `list_resources`
- `read_resource`
- `list_prompts`
- `get_prompt`

这些按服务器注册，使用相同的前缀模式，例如：

- `mcp_github_list_resources`
- `mcp_github_get_prompt`

### 重要

这些实用工具现在是能力感知的：
- Hermes 仅在实际支持资源操作的 MCP 会话中注册资源实用工具
- Hermes 仅在实际支持提示操作的 MCP 会话中注册提示实用工具

因此，暴露可调用工具但没有资源/提示的服务器不会获得那些额外的包装器。

## 每个服务器过滤

您可以控制每个 MCP 服务器向 Hermes 贡献哪些工具，从而精细管理您的工具命名空间。

### 完全禁用服务器

```yaml
mcp_servers:
  legacy:
    url: "https://mcp.legacy.internal"
    enabled: false
```

如果 `enabled: false`，Hermes 完全跳过服务器，甚至不尝试连接。

### 白名单服务器工具

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [create_issue, list_issues]
```

仅注册那些 MCP 服务器工具。

### 黑名单服务器工具

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    tools:
      exclude: [delete_customer]
```

注册除排除项外的所有服务器工具。

### 优先级规则

如果两者都存在：

```yaml
tools:
  include: [create_issue]
  exclude: [create_issue, delete_issue]
```

`include` 获胜。

### 也过滤实用工具

您也可以单独禁用 Hermes 添加的实用工具包装器：

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: false
      resources: false
```

这意味着：
- `tools.resources: false` 禁用 `list_resources` 和 `read_resource`
- `tools.prompts: false` 禁用 `list_prompts` 和 `get_prompt`

### 完整示例

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [create_issue, list_issues, search_code]
      prompts: false

  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer]
      resources: false

  legacy:
    url: "https://mcp.legacy.internal"
    enabled: false
```

## 如果所有工具都被过滤掉会怎样？

如果您的配置过滤掉所有可调用工具并禁用或省略所有支持的实用工具，Hermes 不会为该服务器创建空的运行时 MCP 工具集。

这保持工具列表干净。

## 运行时行为

### 发现时间

Hermes 在启动时发现 MCP 服务器并将其工具注册到正常工具注册表中。

### 动态工具发现

MCP 服务器可以通过发送 `notifications/tools/list_changed` 通知来通知 Hermes 其可用工具在运行时发生了变化。当 Hermes 收到此通知时，它会自动重新获取服务器的工个列表并更新注册表 — 无需手动 `/reload-mcp`。

这对于能力动态变化的 MCP 服务器很有用（例如，在加载新数据库架构时添加工具的服务器，或在服务下线时移除工具的服务器）。

刷新受锁保护，因此同一服务器的快速通知不会导致重叠刷新。提示和资源更改通知（`prompts/list_changed`、`resources/list_changed`）被接收但尚未被处理。

### 重新加载

如果您更改了 MCP 配置，请使用：

```text
/reload-mcp
```

这会从配置重新加载 MCP 服务器并刷新可用工具列表。关于服务器本身推送的运行时工具更改，参见上面的[动态工具发现](#dynamic-tool-discovery)。

### 工具集

每个配置的 MCP 服务器在贡献至少一个注册工具时也会创建运行时工具集：

```text
mcp-<server>
```

这使得 MCP 服务器在工具集级别更容易推理。

## 安全模型

### Stdio 环境过滤

对于 stdio 服务器，Hermes 不会盲目传递完整的 shell 环境。

只有明确配置的 `env` 加上安全基线被传递。这减少了意外 secrets 泄露。

### 配置级暴露控制

新的过滤支持也是一种安全控制：
- 禁用您不希望模型看到的危险工具
- 为敏感服务器仅暴露最小白名单
- 当您不希望暴露该表面时，禁用资源/提示包装器

## 示例用例

### 具有最小问题管理面的 GitHub 服务器

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, update_issue]
      prompts: false
      resources: false
```

像这样使用：

```text
Show me open issues labeled bug, then draft a new issue for the flaky MCP reconnection behavior.
```

### 移除危险操作的 Stripe 服务器

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer, refund_payment]
```

像这样使用：

```text
Look up the last 10 failed payments and summarize common failure reasons.
```

### 单个项目根的文件系统服务器

```yaml
mcp_servers:
  project_fs:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/my-project"]
```

像这样使用：

```text
Inspect the project root and explain the directory layout.
```

## 故障排除

### MCP 服务器未连接

检查：

```bash
# 验证 MCP 依赖已安装（标准安装中已包含）
cd ~/.hermes/hermes-agent && uv pip install -e ".[mcp]"

node --version
npx --version
```

然后验证您的配置并重启 Hermes。

### 工具未出现

可能原因：
- 服务器连接失败
- 发现失败
- 您的过滤配置排除了工具
- 该服务器上的实用工具能力不存在
- 服务器被 `enabled: false` 禁用

如果您有意过滤，这是预期的。

### 为什么没有出现资源或提示实用工具？

因为 Hermes 现在仅在以下两者都为真时才注册这些包装器：
1. 您的配置允许它们
2. 服务器会话实际支持该能力

这是有意为之，保持工具列表诚实。

## MCP 采样支持

MCP 服务器可以通过 `sampling/createMessage` 协议请求来自 Hermes 的 LLM 推理。这允许 MCP 服务器请求 Hermes 代其生成文本 — 对于需要 LLM 能力但没有自己的模型访问的服务器很有用。

采样**默认启用**用于所有 MCP 服务器（当 MCP SDK 支持时）。在 `sampling` 键下按服务器配置：

```yaml
mcp_servers:
  my_server:
    command: "my-mcp-server"
    sampling:
      enabled: true            # 启用采样（默认：true）
      model: "openai/gpt-4o"  # 覆盖采样请求的模型（可选）
      max_tokens_cap: 4096     # 每次采样响应的最大 token 数（默认：4096）
      timeout: 30              # 每次请求的超时秒数（默认：30）
      max_rpm: 10              # 速率限制：每分钟最大请求数（默认：10）
      max_tool_rounds: 5       # 采样循环中的最大工具轮次（默认：5）
      allowed_models: []       # 服务器可能请求的模型名称白名单（空 = 任意）
      log_level: "info"        # 审计日志级别：debug、info 或 warning（默认：info）
```

采样处理程序包括滑动窗口速率限制器、每请求超时和工具循环深度限制，以防止失控使用。指标（请求计数、错误、使用的 token）按服务器实例跟踪。

要为特定服务器禁用采样：

```yaml
mcp_servers:
  untrusted_server:
    url: "https://mcp.example.com"
    sampling:
      enabled: false
```

## 将 Hermes 作为 MCP 服务器运行

除了连接到 MCP 服务器，Hermes 还可以作为 MCP 服务器。这允许其他支持 MCP 的代理（Claude Code、Cursor、Codex 或任何 MCP 客户端）使用 Hermes 的消息传递能力 — 列出对话、读取消息历史，以及跨所有连接的平台发送消息。

### 何时使用

- 您希望 Claude Code、Cursor 或其他编码代理通过 Hermes 发送和读取 Telegram/Discord/Slack 消息
- 您想要一个桥接到所有 Hermes 连接的消息平台的单一 MCP 服务器
- 您已经运行了带有连接平台的 Hermes 网关

### 快速开始

```bash
hermes mcp serve
```

这启动一个 stdio MCP 服务器。MCP 客户端（不是您）管理进程生命周期。

### MCP 客户端配置

将 Hermes 添加到您的 MCP 客户端配置。例如，在 Claude Code 的 `~/.claude/claude_desktop_config.json` 中：

```json
{
  "mcpServers": {
    "hermes": {
      "command": "hermes",
      "args": ["mcp", "serve"]
    }
  }
}
```

或者如果您将 Hermes 安装在特定位置：

```json
{
  "mcpServers": {
    "hermes": {
      "command": "/home/user/.hermes/hermes-agent/venv/bin/hermes",
      "args": ["mcp", "serve"]
    }
  }
}
```

### 可用工具

MCP 服务器暴露 10 个工具，匹配 OpenClaw 的通道桥接面加上 Hermes 特定的通道浏览器：

| 工具 | 描述 |
|------|-------------|
| `conversations_list` | 列出活动消息对话。按平台过滤或按名称搜索。 |
| `conversation_get` | 通过会话键获取一个对话的详细信息。 |
| `messages_read` | 读取对话的最近消息历史。 |
| `attachments_fetch` | 从特定消息中提取非文本附件（图像、媒体）。 |
| `events_poll` | 轮询自光标位置以来的新对话事件。 |
| `events_wait` | 长轮询/阻塞直到下一个事件到达（接近实时）。 |
| `messages_send` | 通过平台发送消息（例如 `telegram:123456`、`discord:#general`）。 |
| `channels_list` | 跨所有平台列出可用的消息目标。 |
| `permissions_list_open` | 列出在此桥接会话期间观察到的待定批准请求。 |
| `permissions_respond` | 允许或拒绝待定批准请求。 |

### 事件系统

MCP 服务器包含一个实时事件桥，通过 mtime 优化的 DB 轮询轮询 Hermes 的会话数据库以获取新消息。这为 MCP 客户端提供了传入对话的接近实时感知：

```
# 轮询新事件（非阻塞）
events_poll(after_cursor=0)

# 等待下一个事件（最多阻塞）
events_wait(after_cursor=42, timeout_ms=30000)
```

事件类型：`message`、`approval_requested`、`approval_resolved`

事件队列在内存中，从桥接连接时开始。较旧的消息可通过 `messages_read` 获取。

### 选项

```bash
hermes mcp serve              # 正常模式
hermes mcp serve --verbose    # 调试日志到 stderr
```

### 工作原理

MCP 服务器直接从 Hermes 的会话存储读取对话数据（`~/.hermes/sessions/sessions.json` 和 SQLite 数据库）。后台线程轮询数据库以获取新消息并维护内存事件队列。对于发送消息，它使用与 Hermes 代理本身相同的 `send_message` 基础设施。

网关不需要运行来进行读取操作（列出对话、读取历史、轮询事件）。对于发送操作，它需要运行，因为平台适配器需要活动连接。

### 当前限制

- 仅 stdio 传输（尚无 HTTP MCP 传输）
- 通过 mtime 优化 DB 轮询以约 200ms 间隔轮询（文件未更改时跳过工作）
- 尚无 `claude/channel` 推送通知协议
- 仅文本发送（不通过 `messages_send` 发送媒体/附件）

## 相关文档

- [将 MCP 与 Hermes 结合使用](/docs/guides/use-mcp-with-hermes)
- [CLI 命令](/docs/reference/cli-commands)
- [斜杠命令](/docs/reference/slash-commands)
- [常见问题](/docs/reference/faq)
