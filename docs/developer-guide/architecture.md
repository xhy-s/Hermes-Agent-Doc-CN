---
sidebar_position: 1
title: "架构"
description: "Hermes Agent 内部架构 — 主要子系统、执行路径、数据流以及阅读指南"
---

# 架构

本文档是 Hermes Agent 内部架构的顶层地图。在深入阅读子系统的具体实现文档之前，先通过本文档定位代码库结构。

## 系统概览

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        入口点                                        │
│                                                                      │
│  CLI (cli.py)    Gateway (gateway/run.py)    ACP (acp_adapter/)     │
│  Batch Runner    API Server                  Python Library          │
└──────────┬──────────────┬───────────────────────┬────────────────────┘
           │              │                       │
           ▼              ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     AIAgent (run_agent.py)                           │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │ Prompt       │ │ Provider     │ │ Tool         │                │
│  │ Builder      │ │ Resolution   │ │ Dispatch     │                │
│  │ (prompt_     │ │ (runtime_    │ │ (model_      │                │
│  │  builder.py) │ │  provider.py)│ │  tools.py)   │                │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                │
│         │                │                │                          │
│  ┌──────┴───────┐ ┌──────┴───────┐ ┌──────┴───────┐                │
│  │ 压缩         │ │ 3 种 API 模式 │ │ Tool Registry │                │
│  │ & 缓存        │ │ chat_compl. │ │ (registry.py) │                │
│  │              │ │ codex_resp. │ │ 48 个工具     │                │
│  │              │ │ anthropic   │ │ 40 个工具集   │                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌───────────────────┐              ┌──────────────────────┐
│ Session Storage   │              │ Tool Backends        │
│ (SQLite + FTS5)   │              │ Terminal (6 个后端)   │
│ hermes_state.py   │              │ Browser (5 个后端)    │
│ gateway/session.py│              │ Web (4 个后端)       │
└───────────────────┘              │ MCP (动态)           │
                                   │ File, Vision 等      │
                                   └──────────────────────┘
```

## 目录结构

```text
hermes-agent/
├── run_agent.py              # AIAgent — 核心对话循环（约 9,200 行）
├── cli.py                    # HermesCLI — 交互式终端 UI（约 8,500 行）
├── model_tools.py            # 工具发现、schema 收集、分发
├── toolsets.py               # 工具分组和平台预设
├── hermes_state.py           # SQLite session/state 数据库（FTS5）
├── hermes_constants.py       # HERMES_HOME、profile 感知路径
├── batch_runner.py           # 批量轨迹生成
│
├── agent/                    # Agent 内部模块
│   ├── prompt_builder.py     # 系统 prompt 组装
│   ├── context_compressor.py # 对话压缩算法
│   ├── prompt_caching.py     # Anthropic prompt 缓存
│   ├── auxiliary_client.py   # 辅助 LLM（视觉、摘要等）
│   ├── model_metadata.py     # 模型上下文长度、token 估算
│   ├── models_dev.py         # models.dev 注册集成
│   ├── anthropic_adapter.py  # Anthropic Messages API 格式转换
│   ├── display.py            # KawaiiSpinner、工具预览格式化
│   ├── skill_commands.py     # Skill 斜杠命令
│   ├── memory_manager.py    # 记忆管理器编排
│   ├── memory_provider.py   # 记忆提供者 ABC
│   └── trajectory.py         # 轨迹保存辅助函数
│
├── hermes_cli/               # CLI 子命令和设置
│   ├── main.py               # 入口点 — 所有 `hermes` 子命令（约 5,500 行）
│   ├── config.py             # DEFAULT_CONFIG、OPTIONAL_ENV_VARS、迁移
│   ├── commands.py           # COMMAND_REGISTRY — 中心斜杠命令定义
│   ├── auth.py               # PROVIDER_REGISTRY、凭证解析
│   ├── runtime_provider.py   # Provider → api_mode + 凭证
│   ├── models.py             # 模型目录、provider 模型列表
│   ├── model_switch.py       # /model 命令逻辑（CLI + gateway 共享）
│   ├── setup.py              # 交互式设置向导（约 3,100 行）
│   ├── skin_engine.py        # CLI 主题引擎
│   ├── skills_config.py      # hermes skills — 按平台启用/禁用
│   ├── skills_hub.py         # /skills 斜杠命令
│   ├── tools_config.py       # hermes tools — 按平台启用/禁用
│   ├── plugins.py            # PluginManager — 发现、加载、钩子
│   ├── callbacks.py          # 终端回调（clarify、sudo、approval）
│   └── gateway.py            # hermes gateway 启动/停止
│
├── tools/                    # 工具实现（每个工具一个文件）
│   ├── registry.py           # 中心工具注册表
│   ├── approval.py           # 危险命令检测
│   ├── terminal_tool.py      # 终端编排
│   ├── process_registry.py    # 后台进程管理
│   ├── file_tools.py         # read_file、write_file、patch、search_files
│   ├── web_tools.py          # web_search、web_extract
│   ├── browser_tool.py       # 11 个浏览器自动化工具
│   ├── code_execution_tool.py # execute_code 沙箱
│   ├── delegate_tool.py      # 子 agent 委托
│   ├── mcp_tool.py           # MCP 客户端（约 2,200 行）
│   ├── credential_files.py   # 基于文件的凭证传递
│   ├── env_passthrough.py    # 沙箱环境变量传递
│   ├── ansi_strip.py         # ANSI 转义码剥离
│   └── environments/         # 终端后端（local、docker、ssh、modal、daytona、singularity）
│
├── gateway/                  # 消息平台网关
│   ├── run.py                # GatewayRunner — 消息分发（约 7,500 行）
│   ├── session.py            # SessionStore — 对话持久化
│   ├── delivery.py           # 出站消息投递
│   ├── pairing.py            # DM 配对授权
│   ├── hooks.py              # 钩子发现和生命周期事件
│   ├── mirror.py             # 跨会话消息镜像
│   ├── status.py             # Token 锁、profile 作用域进程跟踪
│   ├── builtin_hooks/        # 始终注册的钩子
│   └── platforms/            # 14 个适配器：telegram、discord、slack、whatsapp、
│                             #   signal、matrix、mattermost、email、sms、
│                             #   dingtalk、feishu、wecom、homeassistant、webhook
│
├── acp_adapter/              # ACP 服务器（VS Code / Zed / JetBrains）
├── cron/                     # 调度器（jobs.py、scheduler.py）
├── plugins/memory/           # 记忆提供者插件
├── environments/             # RL 训练环境（Atropos）
├── skills/                   # 捆绑技能（始终可用）
├── optional-skills/          # 官方可选技能（需显式安装）
├── website/                  # Docusaurus 文档站点
└── tests/                    # Pytest 测试套件（3,000+ 测试）
```

## 数据流

### CLI 会话

```text
用户输入 → HermesCLI.process_input()
  → AIAgent.run_conversation()
    → prompt_builder.build_system_prompt()
    → runtime_provider.resolve_runtime_provider()
    → API 调用（chat_completions / codex_responses / anthropic_messages）
    → tool_calls? → model_tools.handle_function_call() → 循环
    → 最终响应 → display → 保存到 SessionDB
```

### Gateway 消息

```text
平台事件 → Adapter.on_message() → MessageEvent
  → GatewayRunner._handle_message()
    → 授权用户
    → 解析会话 key
    → 创建带有会话历史的 AIAgent
    → AIAgent.run_conversation()
    → 通过适配器投递响应
```

### Cron 任务

```text
调度器 tick → 从 jobs.json 加载到期任务
  → 创建新的 AIAgent（无历史）
  → 将附加的 skills 作为上下文注入
  → 运行任务 prompt
  → 将响应投递到目标平台
  → 更新任务状态和 next_run
```

## 推荐阅读顺序

如果你是代码库的新手：

1. **本文档** — 了解架构
2. **[Agent 循环内部原理](./agent-loop.md)** — AIAgent 如何工作
3. **[Prompt 组装](./prompt-assembly.md)** — 系统 prompt 构建
4. **[Provider 运行时解析](./provider-runtime.md)** — 如何选择 provider
5. **[添加提供者](./adding-providers.md)** — 添加新 provider 的实践指南
6. **[工具运行时](./tools-runtime.md)** — 工具注册表、分发、环境
7. **[会话存储](./session-storage.md)** — SQLite schema、FTS5、会话谱系
8. **[网关内部原理](./gateway-internals.md)** — 消息平台网关
9. **[上下文压缩与缓存](./context-compression-and-caching.md)** — 压缩和缓存
10. **[ACP 内部原理](./acp-internals.md)** — IDE 集成
11. **[环境、基准测试与数据生成](./environments.md)** — RL 训练

## 主要子系统

### Agent 循环

同步编排引擎（`run_agent.py` 中的 `AIAgent`）。处理 provider 选择、prompt 构建、工具执行、重试、回退、回调、压缩和持久化。支持三种 API 模式以适应不同的 provider 后端。

→ [Agent 循环内部原理](./agent-loop.md)

### Prompt 系统

对话生命周期中的 prompt 构建和维护：

- **`prompt_builder.py`** — 从 personality（SOUL.md）、记忆（MEMORY.md、USER.md）、skills、上下文文件（AGENTS.md、.hermes.md）、工具使用指导和模型特定指令组装系统 prompt
- **`prompt_caching.py`** — 为前缀缓存应用 Anthropic 缓存断点
- **`context_compressor.py`** — 当上下文超过阈值时对中间对话轮次进行摘要

→ [Prompt 组装](./prompt-assembly.md)、[上下文压缩与缓存](./context-compression-and-caching.md)

### Provider 解析

CLI、gateway、cron、ACP 和辅助调用共享的运行时解析器。将 `(provider, model)` 元组映射到 `(api_mode, api_key, base_url)`。处理 18+ 个 providers、OAuth 流程、凭证池和别名解析。

→ [Provider 运行时解析](./provider-runtime.md)

### 工具系统

中心工具注册表（`tools/registry.py`），包含 47 个注册工具分布在 20 个工具集中。每个工具文件在导入时自我注册。注册表处理 schema 收集、分发、可用性检查和错误包装。Terminal 工具支持 6 个后端（local、Docker、SSH、Daytona、Modal、Singularity）。

→ [工具运行时](./tools-runtime.md)

### 会话持久化

基于 SQLite 的会话存储，带 FTS5 全文搜索。会话有谱系跟踪（跨压缩的父子关系）、按平台隔离以及带有竞争处理的原子写入。

→ [会话存储](./session-storage.md)

### 消息网关

长时间运行的进程，具有 14 个平台适配器、统一会话路由、用户授权（白名单 + DM 配对）、斜杠命令分发、钩子系统、cron ticking 和后台维护。

→ [网关内部原理](./gateway-internals.md)

### 插件系统

三种发现来源：`~/.hermes/plugins/`（用户）、`.hermes/plugins/`（项目）和 pip 入口点。插件通过上下文 API 注册工具、钩子和 CLI 命令。记忆提供者是 `plugins/memory/` 下的专门插件类型。

→ [插件构建指南](/docs/guides/build-a-hermes-plugin)、[记忆提供者插件](./memory-provider-plugin.md)

### Cron

一等公民 agent 任务（不是 shell 任务）。任务存储在 JSON 中，支持多种调度格式，可以附加 skills 和脚本，投递到任何平台。

→ [Cron 内部原理](./cron-internals.md)

### ACP 集成

通过 stdio/JSON-RPC 将 Hermes 暴露为编辑器原生 agent，适用于 VS Code、Zed 和 JetBrains。

→ [ACP 内部原理](./acp-internals.md)

### RL / 环境 / 轨迹

用于评估和 RL 训练的完整环境框架。与 Atropos 集成，支持多种工具调用解析器，生成 ShareGPT 格式轨迹。

→ [环境、基准测试与数据生成](./environments.md)、[轨迹与训练格式](./trajectory-format.md)

## 设计原则

| 原则 | 实践中的含义 |
|--------|--------------------------|
| **Prompt 稳定性** | 系统 prompt 在对话过程中不会改变。除了显式的用户操作（`/model`）外，不会出现破坏缓存的变更。 |
| **可观测执行** | 每个工具调用都通过回调对用户可见。进度更新在 CLI（spinner）和 gateway（聊天消息）中显示。 |
| **可中断** | API 调用和工具执行可以被用户输入或信号取消。 |
| **平台无关核心** | 一个 AIAgent 类服务于 CLI、gateway、ACP、batch 和 API 服务器。平台差异在入口点，而不是 agent 中。 |
| **松耦合** | 可选子系统（MCP、插件、记忆提供者、RL 环境）使用注册表模式和 check_fn 门控，而不是硬依赖。 |
| **Profile 隔离** | 每个 profile（`hermes -p <name>`）拥有自己的 HERMES_HOME、配置、记忆、会话和 gateway PID。多个 profile 可以并发运行。 |

## 文件依赖链

```text
tools/registry.py  (无依赖 — 被所有工具文件导入)
       ↑
tools/*.py  (每个文件在导入时调用 registry.register())
       ↑
model_tools.py  (导入 tools/registry + 触发工具发现)
       ↑
run_agent.py、cli.py、batch_runner.py、environments/
```

这条链意味着工具注册发生在任何 agent 实例创建之前的导入时。添加新工具需要在 `model_tools.py` 的 `_discover_tools()` 列表中添加导入。
