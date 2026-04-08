---
sidebar_position: 3
title: "内置工具参考"
description: "Hermes 内置工具的权威参考，按工具集分组"
---

# 内置工具参考

本文档记录了 Hermes 工具注册表中的所有 47 个内置工具，按工具集分组。可用性因平台、凭证和启用的工具集而异。

**快速统计：** 10 个浏览器工具、4 个文件工具、10 个 RL 工具、4 个 Home Assistant 工具、2 个终端工具、2 个 Web 工具，以及跨其他工具集的 15 个独立工具。

:::tip MCP 工具
除了内置工具，Hermes 还可以从 MCP 服务器动态加载工具。MCP 工具带有服务器名称前缀（例如，`github` MCP 服务器的 `github_create_issue`）。参见 [MCP 集成](/docs/user-guide/features/mcp) 了解配置。
:::

## `browser` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `browser_back` | 在浏览器历史中导航回上一页。需要先调用 browser_navigate。 | — |
| `browser_click` | 点击快照中以其 ref ID 标识的元素（例如 '@e5'）。快照输出中 ref ID 显示在方括号中。需要先调用 browser_navigate 和 browser_snapshot。 | — |
| `browser_console` | 获取当前页面的浏览器控制台输出和 JavaScript 错误。返回 console.log/warn/error/info 消息和未捕获的 JS 异常。使用此工具检测静默 JavaScript 错误、失败的 API 调用和应用警告。需要… | — |
| `browser_get_images` | 获取当前页面上所有图像及其 URL 和 alt 文本的列表。用于查找可与 vision 工具一起分析的图像。需要先调用 browser_navigate。 | — |
| `browser_navigate` | 在浏览器中导航到 URL。初始化会话并加载页面。必须在其他浏览器工具之前调用。对于简单信息检索，优先使用 web_search 或 web_extract（更快、更便宜）。当需要… | — |
| `browser_press` | 按下键盘键。用于提交表单（Enter）、导航（Tab）或键盘快捷键。需要先调用 browser_navigate。 | — |
| `browser_scroll` | 在一个方向上滚动页面。使用此工具显示可能位于当前视口上方或下方的更多内容。需要先调用 browser_navigate。 | — |
| `browser_snapshot` | 获取当前页面可访问性树的文本快照。返回带有 ref ID（如 @e1、@e2）的交互元素，供 browser_click 和 browser_type 使用。full=false（默认）：紧凑视图，仅交互元素。full=true：完整… | — |
| `browser_type` | 在以其 ref ID 标识的输入字段中键入文本。先清除字段，然后输入新文本。需要先调用 browser_navigate 和 browser_snapshot。 | — |
| `browser_vision` | 拍摄页面截图并用 vision AI 分析。当需要直观了解页面内容时使用——特别适用于 CAPTCHA、视觉验证挑战、复杂布局或文本快照… | — |

## `clarify` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `clarify` | 当需要澄清、反馈或在继续之前做决策时向用户提问。支持两种模式：1. **多选** — 提供最多 4 个选项。用户选择一个或通过第 5 个"其他"选项输入自己的答案。2.… | — |

## `code_execution` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `execute_code` | 运行可以编程方式调用 Hermes 工具的 Python 脚本。当需要 3+ 个工具调用且之间有处理逻辑、需要过滤/缩减大量工具输出后再进入上下文、需要条件分支（… | — |

## `cronjob` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `cronjob` | 统一的任务调度管理器。使用 `action="create"`、`"list"`、`"update"`、`"pause"`、`"resume"`、`"run"` 或 `"remove"` 管理任务。支持带一个或多个附加技能的后备技能作业，更新时 `skills=[]` 清除附加技能。Cron 运行发生在没有当前聊天上下文的新会话中。 | — |

## `delegation` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `delegate_task` | 生成一个或多个子代理在工作流中处理任务。每个子代理获得自己的对话、终端会话和工具集。只返回最终摘要——中间工具结果永远不会进入你的上下文窗口。两… | — |

## `file` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `patch` | 定向的文件查找替换编辑。使用此工具代替终端中的 sed/awk。使用模糊匹配（9 种策略），因此轻微的空白/缩进差异不会破坏它。返回统一 diff。编辑后自动运行语法检查… | — |
| `read_file` | 带行号和分页的文本文件读取。使用此工具代替终端中的 cat/head/tail。输出格式：'LINE_NUM|CONTENT'。文件未找到时建议相似文件名。使用 offset 和 limit 处理大文件。注：无法读取图像… | — |
| `search_files` | 搜索文件内容或按名称查找文件。使用此工具代替终端中的 grep/rg/find/ls。基于 Ripgrep，比 shell 等效命令更快。内容搜索（target='content'）：正则表达式搜索。输出模式：完整匹配及其行… | — |
| `write_file` | 将内容写入文件，完全替换现有内容。使用此工具代替终端中的 echo/cat heredoc。自动创建父目录。覆盖整个文件——用于定向编辑使用 'patch'。 | — |

## `homeassistant` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `ha_call_service` | 调用 Home Assistant 服务以控制设备。使用 ha_list_services 发现每个域的可用服务及其参数。 | — |
| `ha_get_state` | 获取单个 Home Assistant 实体的详细状态，包括所有属性（亮度、颜色、温度设置点、传感器读数等）。 | — |
| `ha_list_entities` | 列出 Home Assistant 实体。可按域（light、switch、climate、sensor、binary_sensor、cover、fan 等）或按区域名称（客厅、厨房、卧室等）过滤。 | — |
| `ha_list_services` | 列出可用的 Home Assistant 服务（动作）以进行设备控制。显示每种设备类型可执行的动作及其接受的参数。使用此工具发现如何控制通过 ha_list_entities 找到的设备。 | — |

:::note
**Honcho 工具**（`honcho_conclude`、`honcho_context`、`honcho_profile`、`honcho_search`）不再是内置工具。可通过 `plugins/memory/honcho/` 的 Honcho memory provider 插件获取。参见 [插件](../user-guide/features/plugins.md) 了解安装和使用。
:::

## `image_gen` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `image_generate` | 使用 FLUX 2 Pro 模型通过文本提示生成高质量图像，并自动进行 2 倍放大。创建详细、艺术化的图像，自动放大以获得高分辨率结果。返回单个放大后的图像 URL。使用… | FAL_KEY |

## `memory` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `memory` | 将重要信息保存到跨会话持久化的内存中。你的记忆在会话开始时出现在系统提示中——这是你在对话之间记住关于用户和环境的方式。何时使用… | — |

## `messaging` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `send_message` | 发送消息到已连接的消息平台，或列出可用目标。重要：当用户要求发送到特定频道或个人（不仅是裸平台名称）时，先调用 send_message(action='list') 查看可用目标… | — |

## `moa` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `mixture_of_agents` | 通过多个前沿 LLM 协作地路由难题。进行 5 次 API 调用（4 个参考模型 + 1 个聚合器），最大推理努力——谨慎使用，仅用于真正困难的问题。最佳用于：复杂数学、高级算法… | OPENROUTER_API_KEY |

## `rl` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `rl_check_status` | 获取训练运行的状态和指标。速率限制：同一运行 30 分钟内只能检查一次。返回 WandB 指标：step、state、reward_mean、loss、percent_correct。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_edit_config` | 更新配置字段。先调用 rl_get_current_config() 查看所选环境的所有可用字段。每个环境有不同的可配置选项。基础设施设置（tokenizer、URL、lora_rank、learning_ra… | TINKER_API_KEY, WANDB_API_KEY |
| `rl_get_current_config` | 获取当前环境配置。仅返回可修改的字段：group_size、max_token_length、total_steps、steps_per_eval、use_wandb、wandb_name、max_num_workers。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_get_results` | 获取已完成训练运行的最终结果和指标。返回最终指标和训练权重路径。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_list_environments` | 列出所有可用的 RL 环境。返回环境名称、路径和描述。提示：使用文件工具读取 file_path 了解每个环境的工作方式（验证器、数据加载、奖励）。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_list_runs` | 列出所有训练运行（活动和完成）及其状态。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_select_environment` | 选择 RL 环境进行训练。加载环境的默认配置。选择后，使用 rl_get_current_config() 查看设置，使用 rl_edit_config() 修改它们。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_start_training` | 使用当前环境和配置开始新的 RL 训练运行。大多数训练参数（lora_rank、learning_rate 等）是固定的。使用 rl_edit_config() 设置 group_size、batch_size、wandb_project 后再开始。警告：训练… | TINKER_API_KEY, WANDB_API_KEY |
| `rl_stop_training` | 停止正在运行的训练作业。如果指标看起来不佳、训练停滞或想尝试不同设置，请使用。 | TINKER_API_KEY, WANDB_API_KEY |
| `rl_test_inference` | 任何环境的快速推理测试。使用 OpenRouter 运行几步推理 + 评分。默认：3 步 x 16 完成 = 每个模型 48 次 rollouts，测试 3 个模型 = 总共 144 次。测试环境加载、提示构建、输入… | TINKER_API_KEY, WANDB_API_KEY |

## `session_search` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `session_search` | 在过去对话的长期记忆中搜索。这是你的回忆——每个过去的会话都是可搜索的，此工具总结发生了什么。主动使用此工具当：- 用户说'我们之前做过这个'、'记得吗'、'上次… | — |

## `skills` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `skill_manage` | 管理技能（创建、更新、删除）。技能是你的程序记忆——可复用的重复任务类型方法。新技能到 ~/.hermes/skills/；现有技能可在其所在位置修改。操作：create（完整 SKILL.m… | — |
| `skill_view` | 技能允许加载关于特定任务和工作流程的信息，以及脚本和模板。首次调用返回 SKILL.md 内容加链接文件的路径列表。 | — |
| `skills_list` | 列出可用技能（名称 + 描述）。使用 skill_view(name) 加载完整内容。 | — |

## `terminal` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `process` | 管理使用 terminal(background=true) 启动的后台进程。操作：'list'（显示所有）、'poll'（检查状态 + 新输出）、'log'（带分页的完整输出）、'wait'（阻塞直到完成或超时）、'kill'（终止）、'write'（发送… | — |
| `terminal` | 在 Linux 环境中执行 shell 命令。文件系统在调用之间保持。使用 `background=true` 运行长期服务器。使用 `notify_on_complete=true`（配合 `background=true`）在进程完成时自动获得通知——无需轮询。不要使用 cat/head/tail——使用 read_file。不要使用 grep/rg/find——使用 search_files。 | — |

## `todo` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `todo` | 管理当前会话的任务列表。用于复杂任务（3+ 步骤）或当用户提供多个任务时。调用时不带参数读取当前列表。写入：- 提供 'todos' 数组创建/更新项目 - merge=… | — |

## `vision` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `vision_analyze` | 使用 AI vision 分析图像。提供全面描述并回答关于图像内容的特定问题。 | — |

## `web` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `web_search` | 在网络上搜索任何主题的信息。返回最多 5 个相关结果，包含标题、URL 和描述。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |
| `web_extract` | 从网页 URL 提取内容。以 markdown 格式返回页面内容。也适用于 PDF URL——直接传递 PDF 链接，它会转换为 markdown 文本。5000 字符以下的页面返回完整 markdown；较大的页面由 LLM 总结。 | EXA_API_KEY 或 PARALLEL_API_KEY 或 FIRECRAWL_API_KEY 或 TAVILY_API_KEY |

## `tts` 工具集

| 工具 | 描述 | 需要环境 |
|------|-------------|----------------------|
| `text_to_speech` | 将文本转换为语音音频。返回平台作为语音消息传递的 MEDIA: 路径。在 Telegram 上作为语音气泡播放，在 Discord/WhatsApp 上作为音频附件。在 CLI 模式下保存到 ~/voice-memos/。语音和提供商… | — |
