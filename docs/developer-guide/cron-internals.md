---
sidebar_position: 11
title: "定时任务内部原理"
description: "Hermes 如何存储、调度、编辑、暂停、技能加载和投递定时任务"
---

# 定时任务内部原理

定时任务子系统提供调度任务执行 — 从简单的一次性延迟到带技能注入和跨平台投递的循环 cron 表达式任务。

## 关键文件

| 文件 | 用途 |
|------|---------|
| `cron/jobs.py` | 任务模型、存储、原子读写 `jobs.json` |
| `cron/scheduler.py` | 调度器循环 — 到期任务检测、执行、重复跟踪 |
| `tools/cronjob_tools.py` | 模型面向的 `cronjob` 工具注册和处理 |
| `gateway/run.py` | Gateway 集成 — 长运行循环中的定时任务 ticking |
| `hermes_cli/cron.py` | CLI `hermes cron` 子命令 |

## 调度模型

支持四种调度格式：

| 格式 | 示例 | 行为 |
|--------|---------|----------|
| **相对延迟** | `30m`、`2h`、`1d` | 一次性的，在指定时长后触发 |
| **间隔** | `every 2h`、`every 30m` | 循环的，定期触发 |
| **Cron 表达式** | `0 9 * * *` | 标准 5 字段 cron 语法（分、时、日、月、周） |
| **ISO 时间戳** | `2025-01-15T09:00:00` | 一次性的，在确切时间触发 |

模型面向的表面是一个带有操作风格任务的单一 `cronjob` 工具：`create`、`list`、`update`、`pause`、`resume`、`run`、`remove`。

## 任务存储

任务存储在 `~/.hermes/cron/jobs.json` 中，具有原子写入语义（写入临时文件，然后重命名）。每个任务记录包含：

```json
{
  "id": "job_abc123",
  "name": "Daily briefing",
  "prompt": "Summarize today's AI news and funding rounds",
  "schedule": "0 9 * * *",
  "skills": ["ai-funding-daily-report"],
  "deliver": "telegram:-1001234567890",
  "repeat": null,
  "state": "scheduled",
  "next_run": "2025-01-16T09:00:00Z",
  "run_count": 42,
  "created_at": "2025-01-01T00:00:00Z",
  "model": null,
  "provider": null,
  "script": null
}
```

### 任务生命周期状态

| 状态 | 含义 |
|-------|-------|
| `scheduled` | 活跃的，将在下次预定时间触发 |
| `paused` | 暂停的 — 恢复前不会触发 |
| `completed` | 重复次数耗尽或已触发的一次性任务 |
| `running` | 当前正在执行（瞬态） |

### 向后兼容

旧任务可能有一个 `skill` 字段而不是 `skills` 数组。调度器在加载时将其规范化 — 单个 `skill` 被提升为 `skills: [skill]`。

## 调度器运行时

### Tick 周期

调度器按周期性 tick 运行（默认：每 60 秒）：

```text
tick()
  1. 获取调度器锁（防止重叠 tick）
  2. 从 jobs.json 加载所有任务
  3. 过滤到到期任务（next_run <= now AND state == "scheduled"）
  4. 对于每个到期任务：
     a. 设置状态为 "running"
     b. 创建新的 AIAgent 会话（无对话历史）
     c. 按顺序加载附加的技能（作为用户消息注入）
     d. 通过 agent 运行任务 prompt
     e. 将响应投递到配置的目标
     f. 更新 run_count，计算 next_run
     g. 如果重复次数耗尽 → state = "completed"
     h. 否则 → state = "scheduled"
  5. 将更新后的任务写回 jobs.json
  6. 释放调度器锁
```

### Gateway 集成

在 gateway 模式中，调度器 tick 集成到 gateway 的主事件循环中。Gateway 在其周期性维护周期调用 `scheduler.tick()`，与消息处理一起运行。

在 CLI 模式中，定时任务仅在运行 `hermes cron` 命令或活动 CLI 会话期间触发。

### 新会话隔离

每个定时任务在完全新的 agent 会话中运行：

- 无先前运行中的对话历史
- 无先前定时任务执行的记忆（除非持久化到记忆/文件）
- Prompt 必须是自包含的 — 定时任务不能提出澄清问题
- `cronjob` 工具集被禁用（递归保护）

## 基于技能的任务

定时任务可以通过 `skills` 字段附加一个或多个技能。在执行时：

1. 技能按指定顺序加载
2. 每个技能的 SKILL.md 内容作为上下文注入
3. 任务的 prompt 作为任务指令追加
4. Agent 处理组合的技能上下文 + prompt

这实现了可复用的、经过测试的工作流，无需将完整指令粘贴到定时 prompt 中。例如：

```
Create a daily funding report → attach "ai-funding-daily-report" skill
```

### 基于脚本的任务

任务也可以通过 `script` 字段附加 Python 脚本。脚本在每个 agent 轮次**之前**运行，其 stdout 作为上下文注入到 prompt 中。这实现了数据收集和变化检测模式：

```python
# ~/.hermes/scripts/check_competitors.py
import requests, json
# Fetch competitor release notes, diff against last run
# Print summary to stdout — agent analyzes and reports
```

## 投递模型

定时任务结果可以投递到任何支持的平台：

| 目标 | 语法 | 示例 |
|--------|--------|---------|
| Origin chat | `origin` | 投递到创建任务的聊天 |
| Local file | `local` | 保存到 `~/.hermes/cron/output/` |
| Telegram | `telegram` 或 `telegram:<chat_id>` | `telegram:-1001234567890` |
| Discord | `discord` 或 `discord:#channel` | `discord:#engineering` |
| Slack | `slack` | 投递到 Slack home 频道 |
| WhatsApp | `whatsapp` | 投递到 WhatsApp home |
| Signal | `signal` | 投递到 Signal |
| Matrix | `matrix` | 投递到 Matrix home 房间 |
| Mattermost | `mattermost` | 投递到 Mattermost home |
| Email | `email` | 通过电子邮件投递 |
| SMS | `sms` | 通过 SMS 投递 |
| Home Assistant | `homeassistant` | 投递到 HA 对话 |
| DingTalk | `dingtalk` | 投递到 DingTalk |
| Feishu | `feishu` | 投递到 Feishu |
| WeCom | `wecom` | 投递到 WeCom |

对于 Telegram topic，使用格式 `telegram:<chat_id>:<thread_id>`（例如 `telegram:-1001234567890:17585`）。

### 响应包装

默认（`cron.wrap_response: true`），定时任务投递被包装有：
- 标识定时任务名称和任务的标题
- 脚注说明 agent 无法在对话中看到投递的消息

cron 响应中的 `[SILENT]` 前缀完全抑制投递 — 用于只写入文件或执行副作用的任务。

### 会话隔离

定时任务投递**不会**镜像到 gateway 会话对话历史中。它们仅存在于定时任务自己的会话中。这防止了目标对话中的消息交替违规。

## 递归保护

定时任务运行的会话禁用了 `cronjob` 工具集。这防止：
- 预定任务创建新的定时任务
- 可能爆炸 token 使用量的递归调度
- 在任务内部意外改变任务调度

## 锁定

调度器使用基于文件的锁定来防止重叠 tick 执行相同的到期任务批次两次。这在 gateway 模式中很重要，因为如果前一个 tick 的时间超过 tick 间隔，多个维护周期可能重叠。

## CLI 接口

`hermes cron` CLI 提供直接的任务管理：

```bash
hermes cron list                    # 显示所有任务
hermes cron create                  # 交互式任务创建（别名：add）
hermes cron edit <job_id>           # 编辑任务配置
hermes cron pause <job_id>          # 暂停运行中的任务
hermes cron resume <job_id>         # 恢复暂停的任务
hermes cron run <job_id>            # 触发立即执行
hermes cron remove <job_id>         # 删除任务
```

## 相关文档

- [Cron 功能指南](/docs/user-guide/features/cron)
- [网关内部原理](./gateway-internals.md)
- [Agent 循环内部原理](./agent-loop.md)
