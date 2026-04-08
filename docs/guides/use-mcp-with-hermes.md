---
sidebar_position: 6
title: "在 Hermes 中使用 MCP"
description: "将 MCP 服务器连接到 Hermes Agent、过滤其工具并在真实工作流中安全使用的实用指南"
---

# 在 Hermes 中使用 MCP

本指南展示如何在日常工作流中实际使用 MCP 与 Hermes Agent。

如果功能页面解释了什么 MCP 是，本指南是关于如何快速安全地从它获得价值。

## 何时应该使用 MCP？

在以下情况下使用 MCP：
- 一个工具已经以 MCP 形式存在，你不想构建原生 Hermes 工具
- 你希望 Hermes 通过干净的 RPC 层对本地或远程系统进行操作
- 你想要细粒度的每服务器暴露控制
- 你想将 Hermes 连接到内部 API、数据库或公司系统而不修改 Hermes 核心

在以下情况下不要使用 MCP：
- 内置 Hermes 工具已经很好地解决了工作
- 服务器暴露大量危险工具表面，而你还没准备好过滤
- 你只需要一个非常狭窄的集成，而原生工具会更简单更安全

## 心理模型

将 MCP 视为适配层：

- Hermes 保持为代理
- MCP 服务器贡献工具
- Hermes 在启动或重新加载时发现这些工具
- 模型可以像普通工具一样使用它们
- 你控制每个服务器可见多少

最后一部分很重要。好的 MCP 用法不只是"连接一切"。而是"连接正确的东西，以最小的有用表面"。

## 步骤 1: 安装 MCP 支持

如果你用标准安装脚本安装了 Hermes，MCP 支持已经包含（安装程序运行 `uv pip install -e ".[all]"`）。

如果没有 extra 安装需要单独添加 MCP：

```bash
cd ~/.hermes/hermes-agent
uv pip install -e ".[mcp]"
```

对于基于 npm 的服务器，确保 Node.js 和 `npx` 可用。

对于许多 Python MCP 服务器，`uvx` 是一个不错的默认值。

## 步骤 2: 先添加一个服务器

从一个单一、安全的服务器开始。

示例：仅一个项目目录的文件系统访问。

```yaml
mcp_servers:
  project_fs:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/my-project"]
```

然后启动 Hermes：

```bash
hermes chat
```

现在问一个具体的问题：

```text
Inspect this project and summarize the repo layout.
```

## 步骤 3: 验证 MCP 已加载

你可以通过几种方式验证 MCP：

- Hermes 横幅/状态应在配置时显示 MCP 集成
- 问 Hermes 它有哪些可用工具
- 在配置更改后使用 `/reload-mcp`
- 如果服务器连接失败，检查日志

一个实际测试提示：

```text
Tell me which MCP-backed tools are available right now.
```

## 步骤 4: 立即开始过滤

如果服务器暴露大量工具，不要等到以后。

### 示例：白名单仅你想要的内容

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, search_code]
```

对于敏感系统，这通常是最好的默认设置。

### 示例：黑名单危险操作

```yaml
mcp_servers:
  stripe:
    url: "https://mcp.stripe.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      exclude: [delete_customer, refund_payment]
```

### 示例：也禁用实用工具包装器

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: false
      resources: false
```

## 过滤实际上影响什么？

Hermes 中有两类 MCP 暴露的功能：

1. 服务器原生 MCP 工具
- 使用以下过滤：
  - `tools.include`
  - `tools.exclude`

2. Hermes 添加的实用工具包装器
- 使用以下过滤：
  - `tools.resources`
  - `tools.prompts`

### 你可能看到的实用工具包装器

Resources:
- `list_resources`
- `read_resource`

Prompts:
- `list_prompts`
- `get_prompt`

这些包装器仅在以下情况下出现：
- 你的配置允许它们，并且
- MCP 服务器会话实际支持这些能力

所以如果服务器没有 resources/prompts，Hermes 不会假装服务器有。

## 常见模式

### 模式 1: 本地项目助手

当你想让 Hermes 推理有限 workspace 时，对 repo 本地文件系统或 git 服务器使用 MCP。

```yaml
mcp_servers:
  fs:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/project"]

  git:
    command: "uvx"
    args: ["mcp-server-git", "--repository", "/home/user/project"]
```

好的提示：

```text
Review the project structure and identify where configuration lives.
```

```text
Check the local git state and summarize what changed recently.
```

### 模式 2: GitHub 分诊助手

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, update_issue, search_code]
      prompts: false
      resources: false
```

好的提示：

```text
List open issues about MCP, cluster them by theme, and draft a high-quality issue for the most common bug.
```

```text
Search the repo for uses of _discover_and_register_server and explain how MCP tools are registered.
```

### 模式 3: 内部 API 助手

```yaml
mcp_servers:
  internal_api:
    url: "https://mcp.internal.example.com"
    headers:
      Authorization: "Bearer ***"
    tools:
      include: [list_customers, get_customer, list_invoices]
      resources: false
      prompts: false
```

好的提示：

```text
Look up customer ACME Corp and summarize recent invoice activity.
```

这是严格白名单比重写黑名单好得多的地方。

### 模式 4: 文档/知识服务器

一些 MCP 服务器暴露的 prompts 或 resources 更像是共享知识资产而非直接操作。

```yaml
mcp_servers:
  docs:
    url: "https://mcp.docs.example.com"
    tools:
      prompts: true
      resources: true
```

好的提示：

```text
List available MCP resources from the docs server, then read the onboarding guide and summarize it.
```

```text
List prompts exposed by the docs server and tell me which ones would help with incident response.
```

## 教程：带过滤的端到端设置

这是一个实用进展。

### 阶段 1: 添加带严格白名单的 GitHub MCP

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, search_code]
      prompts: false
      resources: false
```

启动 Hermes 并问：

```text
Search the codebase for references to MCP and summarize the main integration points.
```

### 阶段 2: 仅在需要时扩展

如果稍后你还需要 issue 更新：

```yaml
tools:
  include: [list_issues, create_issue, update_issue, search_code]
```

然后重新加载：

```text
/reload-mcp
```

### 阶段 3: 添加具有不同策略的第二个服务器

```yaml
mcp_servers:
  github:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "***"
    tools:
      include: [list_issues, create_issue, update_issue, search_code]
      prompts: false
      resources: false

  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/project"]
```

现在 Hermes 可以组合它们：

```text
Inspect the local project files, then create a GitHub issue summarizing the bug you find.
```

这就是 MCP 变得强大的地方：不改变 Hermes 核心的多系统工作流。

## 安全使用建议

### 对危险系统首选白名单

对于任何财务、客户面向或破坏性的：
- 使用 `tools.include`
- 从尽可能小的集合开始

### 禁用未使用的实用工具

如果你不想要模型浏览服务器提供的 resources/prompts，关掉它们：

```yaml
tools:
  resources: false
  prompts: false
```

### 保持服务器范围狭窄

示例：
- 文件系统服务器根目录到一个项目目录，而不是你的整个主目录
- git 服务器指向一个仓库
- 内部 API 服务器默认暴露读写为主的工具

### 配置更改后重新加载

```text
/reload-mcp
```

在更改以下内容后执行此操作：
- include/exclude 列表
- enabled 标志
- resources/prompts 切换
- auth headers / env

## 按症状故障排除

### "服务器连接但我预期的工具缺失"

可能原因：
- 被 `tools.include` 过滤
- 被 `tools.exclude` 排除
- 实用工具包装器通过 `resources: false` 或 `prompts: false` 禁用
- 服务器实际上不支持 resources/prompts

### "服务器已配置但什么都没加载"

检查：
- 配置中未留下 `enabled: false`
- command/runtime 存在（`npx`、`uvx` 等）
- HTTP 端点可访问
- auth env 或 headers 正确

### "为什么我看到的工具比 MCP 服务器广告的少？"

因为 Hermes 现在尊重你的每服务器策略和感知能力的注册。这是预期的，而且通常是你想要的。

### "如何移除 MCP 服务器而不删除配置？"

使用：

```yaml
enabled: false
```

这保留配置但防止连接和注册。

## 推荐的首个 MCP 设置

对大多数用户来说，好的首个服务器：
- filesystem
- git
- GitHub
- fetch / documentation MCP 服务器
- 一个狭窄的内部 API

不太好的首个服务器：
- 具有大量破坏性操作且没有过滤的巨大业务系统
- 你不够了解而无法约束的任何东西

## 相关文档

- [MCP (Model Context Protocol)](/docs/user-guide/features/mcp)
- [常见问题](/docs/reference/faq)
- [斜杠命令](/docs/reference/slash-commands)
