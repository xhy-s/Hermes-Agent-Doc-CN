---
sidebar_position: 5
title: "计划任务（Cron）"
description: "用自然语言计划自动化任务，使用一个 cron 工具管理它们，并附加一个或多个技能"
---

# 计划任务（Cron）

使用自然语言或 cron 表达式计划任务自动运行。Hermes 通过单一的 `cronjob` 工具暴露 cron 管理，使用操作风格而非分离的 schedule/list/remove 工具。

## cron 现在可以做什么

Cron 任务可以：

- 计划一次性或循环任务
- 暂停、恢复、编辑、触发和删除任务
- 附加零个、一个或多个技能到任务
- 将结果传回到原始聊天、本地文件或配置的平台目标
- 在具有正常静态工具列表的新鲜代理会话中运行

:::warning
Cron 运行会话不能递归创建更多 cron 任务。Hermes 在 cron 执行内部禁用 cron 管理工具以防止失控的调度循环。
:::

## 创建计划任务

### 在聊天中使用 `/cron`

```bash
/cron add 30m "Remind me to check the build"
/cron add "every 2h" "Check server status"
/cron add "every 1h" "Summarize new feed items" --skill blogwatcher
/cron add "every 1h" "Use both skills and combine the result" --skill blogwatcher --skill find-nearby
```

### 从独立 CLI

```bash
hermes cron create "every 2h" "Check server status"
hermes cron create "every 1h" "Summarize new feed items" --skill blogwatcher
hermes cron create "every 1h" "Use both skills and combine the result" \
  --skill blogwatcher \
  --skill find-nearby \
  --name "Skill combo"
```

### 通过自然对话

正常询问 Hermes：

```text
Every morning at 9am, check Hacker News for AI news and send me a summary on Telegram.
```

Hermes 会在内部使用统一的 `cronjob` 工具。

## 技能支持的 cron 任务

Cron 任务可以在运行提示之前加载一个或多个技能。

### 单个技能

```python
cronjob(
    action="create",
    skill="blogwatcher",
    prompt="Check the configured feeds and summarize anything new.",
    schedule="0 9 * * *",
    name="Morning feeds",
)
```

### 多个技能

技能按顺序加载。提示成为叠加在这些技能之上的任务指令。

```python
cronjob(
    action="create",
    skills=["blogwatcher", "find-nearby"],
    prompt="Look for new local events and interesting nearby places, then combine them into one short brief.",
    schedule="every 6h",
    name="Local brief",
)
```

当您希望计划代理继承可重用工作流而不将完整技能文本填入 cron 提示本身时，这很有用。

## 编辑任务

您不需要仅仅为了更改任务而删除和重新创建。

### 聊天

```bash
/cron edit <job_id> --schedule "every 4h"
/cron edit <job_id> --prompt "Use the revised task"
/cron edit <job_id> --skill blogwatcher --skill find-nearby
/cron edit <job_id> --remove-skill blogwatcher
/cron edit <job_id> --clear-skills
```

### 独立 CLI

```bash
hermes cron edit <job_id> --schedule "every 4h"
hermes cron edit <job_id> --prompt "Use the revised task"
hermes cron edit <job_id> --skill blogwatcher --skill find-nearby
hermes cron edit <job_id> --add-skill find-nearby
hermes cron edit <job_id> --remove-skill blogwatcher
hermes cron edit <job_id> --clear-skills
```

备注：

- 重复的 `--skill` 替换任务的附加技能列表
- `--add-skill` 追加到现有列表而不替换
- `--remove-skill` 移除特定附加技能
- `--clear-skills` 移除所有附加技能

## 生命周期操作

Cron 任务现在具有比创建/删除更完整的生命周期。

### 聊天

```bash
/cron list
/cron pause <job_id>
/cron resume <job_id>
/cron run <job_id>
/cron remove <job_id>
```

### 独立 CLI

```bash
hermes cron list
hermes cron pause <job_id>
hermes cron resume <job_id>
hermes cron run <job_id>
hermes cron remove <job_id>
hermes cron status
hermes cron tick
```

它们的作用：

- `pause` — 保留任务但停止调度
- `resume` — 重新启用任务并计算下一个未来运行时间
- `run` — 在下一个调度 tick 触发任务
- `remove` — 完全删除

## 工作原理

**Cron 执行由网关守护进程处理。** 网关每 60 秒 tick 一次调度器，在隔离的代理会话中运行任何到期的任务。

```bash
hermes gateway install     # 安装为用户服务
sudo hermes gateway install --system   # Linux：引导时系统服务（用于服务器）
hermes gateway             # 或在前台运行

hermes cron list
hermes cron status
```

### 网关调度器行为

每次 tick 时 Hermes：

1. 从 `~/.hermes/cron/jobs.json` 加载任务
2. 检查 `next_run_at` 与当前时间的对比
3. 为每个到期任务启动一个新的 `AIAgent` 会话
4. 可选地将一个或多个附加技能注入到那个新会话中
5. 运行提示直到完成
6. 传递最终响应
7. 更新运行元数据和下一个计划时间

`~/.hermes/cron/.tick.lock` 处的文件锁防止重叠的调度 tick 双重运行同一批任务。

## 传递选项

计划任务时，指定输出到哪里：

| 选项 | 描述 | 示例 |
|--------|-------------|---------|
| `"origin"` | 返回到创建任务的地方 | 消息平台上的默认设置 |
| `"local"` | 仅保存到本地文件（`~/.hermes/cron/output/`） | CLI 上的默认设置 |
| `"telegram"` | Telegram 主频道 | 使用 `TELEGRAM_HOME_CHANNEL` |
| `"telegram:123456"` | 特定 Telegram 聊天（按 ID） | 直接传递 |
| `"telegram:-100123:17585"` | 特定 Telegram 话题 | `chat_id:thread_id` 格式 |
| `"discord"` | Discord 主频道 | 使用 `DISCORD_HOME_CHANNEL` |
| `"discord:#engineering"` | 特定 Discord 频道 | 按频道名称 |
| `"slack"` | Slack 主频道 | |
| `"whatsapp"` | WhatsApp 主频道 | |
| `"signal"` | Signal | |
| `"matrix"` | Matrix 主房间 | |
| `"mattermost"` | Mattermost 主频道 | |
| `"email"` | 电子邮件 | |
| `"sms"` | 通过 Twilio 的 SMS | |
| `"homeassistant"` | Home Assistant | |
| `"dingtalk"` | DingTalk | |
| `"feishu"` | Feishu/Lark | |
| `"wecom"` | WeCom | |

代理的最终响应自动传递。您不需要在 cron 提示中调用 `send_message`。

### 响应包装

默认情况下，传递的 cron 输出带有页眉和页脚，以便接收者知道它来自计划任务：

```
Cronjob Response: Morning feeds
-------------

<代理输出在这里>

Note: The agent cannot see this message, and therefore cannot respond to it.
```

要在没有包装器的情况下传递原始代理输出，请将 `cron.wrap_response` 设置为 `false`：

```yaml
# 在 ~/.hermes/config.yaml 中
cron:
  wrap_response: false
```

### 静默抑制

如果代理的最终响应以 `[SILENT]` 开头，传递被完全抑制。输出仍保存在本地用于审计（`~/.hermes/cron/output/`），但不会发送到传递目标。

这对于仅在出现问题时才报告的监控任务很有用：

```text
Check if nginx is running. If everything is healthy, respond with only [SILENT].
Otherwise, report the issue.
```

失败的任务始终传递，不受 `[SILENT]` 标记影响 — 只有成功运行可以被静默。

## 计划格式

代理的最终响应自动传递 — 您**不需要**在 cron 提示中包含 `send_message` 来达到相同目的地。如果 cron 运行调用 `send_message` 到调度器已经传递的确切目标，Hermes 跳过该重复发送并告诉模型将面向用户的内容放在最终响应中。仅在需要额外或不同目标时使用 `send_message`。

### 相对延迟（一次性）

```text
30m     → 30 分钟后运行一次
2h      → 2 小时后运行一次
1d      → 1 天后运行一次
```

### 间隔（循环）

```text
every 30m    → 每 30 分钟
every 2h     → 每 2 小时
every 1d     → 每天
```

### Cron 表达式

```text
0 9 * * *       → 每天上午 9:00
0 9 * * 1-5     → 工作日上午 9:00
0 */6 * * *     → 每 6 小时
30 8 1 * *      → 每月 1 日上午 8:30
0 0 * * 0       → 每周日上午午夜
```

### ISO 时间戳

```text
2026-03-15T09:00:00    → 2026 年 3 月 15 日上午 9:00 一次性
```

## 重复行为

| 计划类型 | 默认重复 | 行为 |
|--------------|----------------|----------|
| 一次性（`30m`，时间戳） | 1 | 运行一次 |
| 间隔（`every 2h`） | 永远 | 运行直到被删除 |
| Cron 表达式 | 永远 | 运行直到被删除 |

您可以覆盖它：

```python
cronjob(
    action="create",
    prompt="...",
    schedule="every 2h",
    repeat=5,
)
```

## 以编程方式管理任务

代理面向的 API 是一个工具：

```python
cronjob(action="create", ...)
cronjob(action="list")
cronjob(action="update", job_id="...")
cronjob(action="pause", job_id="...")
cronjob(action="resume", job_id="...")
cronjob(action="run", job_id="...")
cronjob(action="remove", job_id="...")
```

对于 `update`，传递 `skills=[]` 以移除所有附加技能。

## 任务存储

任务存储在 `~/.hermes/cron/jobs.json`。任务运行的输出保存到 `~/.hermes/cron/output/{job_id}/{timestamp}.md`。

存储使用原子文件写入，因此中断的写入不会留下部分写入的任务文件。

## 自包含提示仍然重要

:::warning 重要
Cron 任务在完全新鲜的代理会话中运行。提示必须包含代理所需的全部信息，这些信息不是附加技能已经提供的。
:::

**错误：** `"Check on that server issue"`

**正确：** `"SSH into server 192.168.1.100 as user 'deploy', check if nginx is running with 'systemctl status nginx', and verify https://example.com returns HTTP 200."`

## 安全

计划任务提示在创建和更新时扫描提示注入和凭证泄露模式。包含不可见 Unicode 技巧、SSH 后门尝试或明显 secret 泄露负载的提示被阻止。
