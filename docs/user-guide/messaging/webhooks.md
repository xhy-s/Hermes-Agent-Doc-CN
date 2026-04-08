---
sidebar_position: 13
title: "Webhooks"
description: "接收来自 GitHub、GitLab 和其他服务的事件以触发 Hermes agent 运行"
---

# Webhooks

接收来自外部服务（GitHub、GitLab、JIRA、Stripe 等）的事件并自动触发 Hermes agent 运行。webhook 适配器运行一个 HTTP 服务器，接受 POST 请求，验证 HMAC 签名，将载荷转换为 agent 提示，并路由响应回源或其他已配置的平台。

代理处理事件并可以通过在 PR 上发布评论、发送消息到 Telegram/Discord 或记录结果来响应。

---

## 快速开始

1. 通过 `hermes gateway setup` 或环境变量启用
2. 在 `config.yaml` 中定义路由 **或** 使用 `hermes webhook subscribe` 动态创建
3. 将您的服务指向 `http://your-server:8644/webhooks/<route-name>`

---

## 设置

有两种方法启用 webhook 适配器。

### 通过设置向导

```bash
hermes gateway setup
```

按照提示启用 webhooks、设置端口和设置全局 HMAC 秘密。

### 通过环境变量

添加到 `~/.hermes/.env`：

```bash
WEBHOOK_ENABLED=true
WEBHOOK_PORT=8644        # 默认
WEBHOOK_SECRET=your-global-secret
```

### 验证服务器

网关运行后：

```bash
curl http://localhost:8644/health
```

预期响应：

```json
{"status": "ok", "platform": "webhook"}
```

---

## 配置路由 {#configuring-routes}

路由定义如何处理不同的 webhook 源。每个路由是您 `config.yaml` 中 `platforms.webhook.extra.routes` 下的命名条目。

### 路由属性

| 属性 | 必需 | 描述 |
|----------|----------|-------------|
| `events` | 否 | 要接受的事件类型列表（例如 `["pull_request"]`）。如果为空，则接受所有事件。事件类型从 `X-GitHub-Event`、`X-GitLab-Event` 或载荷中的 `event_type` 读取。 |
| `secret` | **是** | 用于签名验证的 HMAC 秘密。如果路由上未设置，则回退到全局 `secret`。仅用于测试设置为 `"INSECURE_NO_AUTH"`（跳过验证）。 |
| `prompt` | 否 | 带点符号载荷访问的模板字符串（例如 `{pull_request.title}`）。如果省略，则将完整 JSON 载荷转储到提示中。 |
| `skills` | 否 | 为 agent 运行加载的技能名称列表。 |
| `deliver` | 否 | 发送响应的目标：`github_comment`、`telegram`、`discord`、`slack`、`signal`、`matrix`、`mattermost`、`email`、`sms`、`dingtalk`、`feishu`、`wecom` 或 `log`（默认）。 |
| `deliver_extra` | 否 | 附加投递配置——键取决于 `deliver` 类型（例如 `repo`、`pr_number`、`chat_id`）。值支持与 `prompt` 相同的 `{dot.notation}` 模板。 |

### 完整示例

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      port: 8644
      secret: "global-fallback-secret"
      routes:
        github-pr:
          events: ["pull_request"]
          secret: "github-webhook-secret"
          prompt: |
            Review this pull request:
            Repository: {repository.full_name}
            PR #{number}: {pull_request.title}
            Author: {pull_request.user.login}
            URL: {pull_request.html_url}
            Diff URL: {pull_request.diff_url}
            Action: {action}
          skills: ["github-code-review"]
          deliver: "github_comment"
          deliver_extra:
            repo: "{repository.full_name}"
            pr_number: "{number}"
        deploy-notify:
          events: ["push"]
          secret: "deploy-secret"
          prompt: "New push to {repository.full_name} branch {ref}: {head_commit.message}"
          deliver: "telegram"
```

### 提示模板

提示使用点符号访问 webhook 载荷中的嵌套字段：

- `{pull_request.title}` 解析为 `payload["pull_request"]["title"]`
- `{repository.full_name}` 解析为 `payload["repository"]["full_name"]`
- `{__raw__}` —— 特殊标记，将整个载荷转储为缩进的 JSON（截断至 4000 字符）。用于监控警报或通用 webhooks，代理需要完整上下文。
- 缺失的键保留为字面 `{key}` 字符串（无错误）
- 嵌套字典和列表被 JSON 序列化并截断至 2000 字符

您可以混合使用 `{__raw__}` 和常规模板变量：

```yaml
prompt: "PR #{pull_request.number} by {pull_request.user.login}: {__raw__}"
```

如果路由没有配置 `prompt` 模板，则整个载荷被转储为缩进的 JSON（截断至 4000 字符）。

相同的点符号模板也适用于 `deliver_extra` 值。

### 论坛话题投递

当将 webhook 响应投递到 Telegram 时，您可以通过在 `deliver_extra` 中包含 `message_thread_id`（或 `thread_id`）来定位特定的论坛话题：

```yaml
webhooks:
  routes:
    alerts:
      events: ["alert"]
      prompt: "Alert: {__raw__}"
      deliver: "telegram"
      deliver_extra:
        chat_id: "-1001234567890"
        message_thread_id: "42"
```

如果 `deliver_extra` 中未提供 `chat_id`，则投递回退到为目标平台配置的主频道。

---

## GitHub PR 评审（分步说明） {#github-pr-review}

本演练设置每个拉取请求的自动代码评审。

### 1. 在 GitHub 中创建 webhook

1. 进入您的仓库 → **Settings** → **Webhooks** → **Add webhook**
2. 设置 **Payload URL** 为 `http://your-server:8644/webhooks/github-pr`
3. 设置 **Content type** 为 `application/json`
4. 设置 **Secret** 以匹配您的路由配置（例如 `github-webhook-secret`）
5. 在 **Which events?** 下，选择 **Let me select individual events** 并勾选 **Pull requests**
6. 点击 **Add webhook**

### 2. 添加路由配置

将 `github-pr` 路由添加到您的 `~/.hermes/config.yaml`，如上面的示例所示。

### 3. 确保 `gh` CLI 已认证

`github_comment` 投递类型使用 GitHub CLI 发布评论：

```bash
gh auth login
```

### 4. 测试

在仓库上打开一个拉取请求。Webhook 触发，Hermes 处理事件，并在 PR 上发布评审评论。

---

## GitLab Webhook 设置 {#gitlab-webhook-setup}

GitLab webhooks 工作方式类似，但使用不同的认证机制。GitLab 以纯文本 `X-Gitlab-Token` 头发送秘密（精确字符串匹配，不是 HMAC）。

### 1. 在 GitLab 中创建 webhook

1. 进入您的项目 → **Settings** → **Webhooks**
2. 设置 **URL** 为 `http://your-server:8644/webhooks/gitlab-mr`
3. 输入您的 **Secret token**
4. 选择 **Merge request events**（以及您想要的其他任何事件）
5. 点击 **Add webhook**

### 2. 添加路由配置

```yaml
platforms:
  webhook:
    enabled: true
    extra:
      routes:
        gitlab-mr:
          events: ["merge_request"]
          secret: "your-gitlab-secret-token"
          prompt: |
            Review this merge request:
            Project: {project.path_with_namespace}
            MR !{object_attributes.iid}: {object_attributes.title}
            Author: {object_attributes.last_commit.author.name}
            URL: {object_attributes.url}
            Action: {object_attributes.action}
          deliver: "log"
```

---

## 投递选项 {#delivery-options}

`deliver` 字段控制代理处理 webhook 事件后响应的去向。

| 投递类型 | 描述 |
|-------------|-------------|
| `log` | 将响应记录到网关日志输出。这是默认的，对测试有用。 |
| `github_comment` | 通过 `gh` CLI 将响应作为 PR/issue 评论发布。需要 `deliver_extra.repo` 和 `deliver_extra.pr_number`。`gh` CLI 必须安装在网关主机上并已认证（`gh auth login`）。 |
| `telegram` | 将响应路由到 Telegram。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `discord` | 将响应路由到 Discord。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `slack` | 将响应路由到 Slack。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `signal` | 将响应路由到 Signal。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |
| `sms` | 通过 Twilio 将响应路由到 SMS。使用主频道，或在 `deliver_extra` 中指定 `chat_id`。 |

对于跨平台投递（telegram、discord、slack、signal、sms），目标平台也必须在网关中启用并连接。如果 `deliver_extra` 中未提供 `chat_id`，则响应发送到该平台配置的主频道。

---

## 动态订阅（CLI） {#dynamic-subscriptions}

除了 `config.yaml` 中的静态路由外，您还可以使用 `hermes webhook` CLI 命令动态创建 webhook 订阅。当代理本身需要设置事件驱动触发器时，这尤其有用。

### 创建订阅

```bash
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "New issue #{issue.number}: {issue.title}\nBy: {issue.user.login}\n\n{issue.body}" \
  --deliver telegram \
  --deliver-chat-id "-100123456789" \
  --description "Triage new GitHub issues"
```

这返回 webhook URL 和自动生成的 HMAC 秘密。配置您的服务 POST 到该 URL。

### 列出订阅

```bash
hermes webhook list
```

### 移除订阅

```bash
hermes webhook remove github-issues
```

### 测试订阅

```bash
hermes webhook test github-issues
hermes webhook test github-issues --payload '{"issue": {"number": 42, "title": "Test"}}'
```

### 动态订阅工作原理

- 订阅存储在 `~/.hermes/webhook_subscriptions.json`
- Webhook 适配器在每个传入请求上热重载此文件（基于 mtime，开销可忽略不计）
- 静态路由始终优先于具有相同名称的动态订阅
- 动态订阅使用与静态路由相同的路由格式和功能（事件、提示模板、技能、投递）
- 无需网关重启——订阅后立即生效

### 代理驱动的订阅

代理可以通过终端工具在 `webhook-subscriptions` 技能的指导下创建订阅。要求代理"为 GitHub issues 设置 webhook"，它将运行适当的 `hermes webhook subscribe` 命令。

---

## 安全 {#security}

webhook 适配器包含多层安全保护：

### HMAC 签名验证

适配器使用对每个源适当的方法验证传入的 webhook 签名：

- **GitHub**：`X-Hub-Signature-256` 头——以 `sha256=` 为前缀的 HMAC-SHA256 十六进制摘要
- **GitLab**：`X-Gitlab-Token` 头——纯秘密字符串匹配
- **通用**：`X-Webhook-Signature` 头——原始 HMAC-SHA256 十六进制摘要

如果配置了秘密但没有识别出的签名头，则请求被拒绝。

### 秘密是必需的

每个路由必须有一个秘密——要么直接在路由上设置，要么从全局 `secret` 继承。没有秘密的路由会导致适配器在启动时失败并报错。仅用于开发/测试，您可以将秘密设置为 `"INSECURE_NO_AUTH"` 以完全跳过验证。

### 速率限制

每个路由默认限制为每分钟 **30 个请求**（固定窗口）。全局配置：

```yaml
platforms:
  webhook:
    extra:
      rate_limit: 60  # 每分钟请求数
```

超出限制的请求会收到 `429 Too Many Requests` 响应。

### 幂等性

投递 ID（来自 `X-GitHub-Delivery`、`X-Request-ID` 或时间戳回退）被缓存 **1 小时**。重复投递（例如 webhook 重试）会被静默跳过并返回 `200` 响应，防止重复的 agent 运行。

###  body 大小限制

超过 **1 MB** 的载荷在读取 body 之前被拒绝。配置：

```yaml
platforms:
  webhook:
    extra:
      max_body_bytes: 2097152  # 2 MB
```

### 提示注入风险

:::warning
Webhook 载荷包含攻击者控制的数据——PR 标题、提交消息、issue 描述等都可能包含恶意指令。当暴露于互联网时，请在沙盒化环境（Docker、VM）中运行网关。考虑为隔离使用 Docker 或 SSH 终端后端。
:::

---

## 故障排除 {#troubleshooting}

### Webhook 未到达

- 验证端口已暴露且可从 webhook 源访问
- 检查防火墙规则——端口 `8644`（或您配置的端口）必须开放
- 验证 URL 路径匹配：`http://your-server:8644/webhooks/<route-name>`
- 使用 `/health` 端点确认服务器正在运行

### 签名验证失败

- 确保您的路由配置中的秘密与 webhook 源中配置的秘密完全匹配
- 对于 GitHub，秘密是基于 HMAC 的——检查 `X-Hub-Signature-256`
- 对于 GitLab，秘密是纯令牌匹配——检查 `X-Gitlab-Token`
- 检查网关日志中的 `Invalid signature` 警告

### 事件被忽略

- 检查事件类型在您的路由 `events` 列表中
- GitHub 事件使用诸如 `pull_request`、`push`、`issues` 之类的值（`X-GitHub-Event` 头值）
- GitLab 事件使用诸如 `merge_request`、`push` 之类的值（`X-GitLab-Event` 头值）
- 如果 `events` 为空或未设置，则接受所有事件

### 代理无响应

- 在前台运行网关以查看日志：`hermes gateway run`
- 检查提示模板是否正确渲染
- 验证投递目标已配置并连接

### 重复响应

- 幂等性缓存应该防止这种情况——检查 webhook 源是否发送了投递 ID 头（`X-GitHub-Delivery` 或 `X-Request-ID`）
- 投递 ID 被缓存 1 小时

### `gh` CLI 错误（GitHub 评论投递）

- 在网关主机上运行 `gh auth login`
- 确保已认证的 GitHub 用户对仓库有写访问权限
- 检查 `gh` 已安装并在 PATH 上

---

## 环境变量 {#environment-variables}

| 变量 | 描述 | 默认 |
|----------|-------------|---------|
| `WEBHOOK_ENABLED` | 启用 webhook 平台适配器 | `false` |
| `WEBHOOK_PORT` | 用于接收 webhooks 的 HTTP 服务器端口 | `8644` |
| `WEBHOOK_SECRET` | 全局 HMAC 秘密（当路由未指定自己的秘密时用作回退） | _(无)_ |
