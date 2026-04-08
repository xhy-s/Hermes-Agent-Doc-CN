---
sidebar_position: 6
title: "网关内部原理"
description: "消息平台网关的详细内部工作原理：会话管理、投递、钩子、cron 和多租户"
---

# 网关内部原理

Gateway 是将 Hermes Agent 连接到外部消息平台（Slack、Discord、Telegram、WhatsApp 等）的长时间运行进程。它接收消息事件，分派给 AIAgent，并将响应投递回平台。

## 核心职责

Gateway 处理：
- 接收和投递跨 14+ 平台的消息
- 统一会话管理（跨平台的相同会话模型）
- 用户授权（基于 allowlist 和 DM 配对）
- 斜杠命令分发
- 插件钩子系统
- 定时任务 ticking
- 后台维护

## 主要组件

### GatewayRunner

`gateway/run.py` 中的 `GatewayRunner` 是主循环。它：
- 初始化所有平台适配器
- 运行主事件循环处理消息
- 定期调用 cron 调度器
- 处理 graceful 关闭

### 会话存储

`gateway/session.py` 中的 `SessionStore` 管理会话生命周期：
- 创建新会话或恢复现有会话
- 按平台 + 用户 ID 路由
- 持久化到 SQLite
- 处理会话压缩

### 平台适配器

`gateway/platforms/` 中的每个适配器实现特定平台的协议：
- 接收 webhook 事件
- 将平台特定格式转换为通用 `MessageEvent`
- 将响应格式转换回平台特定格式

## 会话模型

Gateway 会话与 CLI 会话有不同的模型：

### 会话生命周期

```
用户消息 → on_message event
  → authorize_user()
  → resolve_session_key(platform, user_id, thread_id?)
  → session = get_or_create_session(key)
  → session.add_message(user_message)
  → agent.run_conversation(session_history)
  → session.add_message(agent_response)
  → deliver_response(platform, response)
```

### 会话路由

会话由 `(platform, user_id, thread_id)` 元组键控。这允许：
- 每个用户一个会话
- 每个线程/频道一个会话
- 跨会话的消息镜像

### 会话压缩

Gateway 在 API 调用之间运行主动压缩（85% 阈值），因为会话可能在轮次之间增长过大（特别是在 Telegram/Discord 等平台中隔夜累积）。

## 消息格式

### MessageEvent

```python
@dataclass
class MessageEvent:
    platform: str                    # 'telegram', 'discord', etc.
    event_type: str                  # 'message', 'callback_query', etc.
    user_id: str                     # 平台特定用户 ID
    thread_id: Optional[str]         # 线程/频道 ID
    message_id: Optional[str]       # 平台特定消息 ID
    text: str                        # 消息文本
    raw: Dict[str, Any]              # 原始平台事件
    sender: Optional[Sender]         # 发送者信息
    attachments: List[Attachment]   # 文件/图像附件
```

### 投递

出站消息通过 `gateway/delivery.py` 处理，支持：
- 文本消息
- 编辑现有消息
- 响应回调查询
- 上传附件

## 授权

### Allowlist

Gateway 支持基于 `config.yaml` 的 allowlist：

```yaml
gateway:
  allowlist:
    enabled: true
    users:
      - telegram:123456789
      - discord:987654321
```

### DM 配对

对于允许 DM 的平台，用户可以发起配对请求：

```
用户 → /pair → 配对码 → 在另一个会话中验证 → 会话链接
```

## 钩子系统

Gateway 实现了丰富的钩子系统：

| 钩子 | 触发时机 |
|------|---------|
| `on_message` | 收到消息时 |
| `pre_agent` | 在 agent 处理之前 |
| `post_agent` | agent 处理之后 |
| `pre_delivery` | 投递响应之前 |
| `post_delivery` | 投递响应之后 |
| `on_error` | 发生错误时 |

## Cron 集成

Gateway 在其主事件循环中 ticking 调度器：

```python
async def run():
    while running:
        await scheduler.tick()  # 检查并执行到期任务
        await process_messages()  # 处理待处理消息
        await maintenance()  # 清理、会话过期等
```

这允许 cron 任务即使在没有活动用户时也能触发。

## 错误处理

Gateway 实现了分层的错误处理：

1. **平台适配器级别** — 每个适配器处理其协议的特定错误
2. **网关级别** — 通用错误处理、优雅关闭
3. **Agent 级别** — agent 执行错误不会崩溃网关

## 配置

```yaml
gateway:
  host: "0.0.0.0"
  port: 8080
  platforms:
    telegram:
      enabled: true
      bot_token: ${TELEGRAM_BOT_TOKEN}
    discord:
      enabled: true
      bot_token: ${DISCORD_BOT_TOKEN}
  allowlist:
    enabled: false
    users: []
  session:
    ttl_days: 30
    max_messages: 1000
```

## 相关文档

- [架构](./architecture.md)
- [会话存储](./session-storage.md)
- [定时任务内部原理](./cron-internals.md)
- [插件系统](../guides/build-a-hermes-plugin.md)
