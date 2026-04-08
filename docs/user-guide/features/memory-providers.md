---
sidebar_position: 4
title: "记忆 Provider"
description: "外部记忆 provider 插件 — Honcho、OpenViking、Mem0、Hindsight、Holographic、RetainDB、ByteRover、Supermemory"
---

# 记忆 Provider

Hermes Agent 附带 8 个外部记忆 provider 插件，为代理提供超越内置 MEMORY.md 和 USER.md 的持久化跨会话知识。同一时间只能激活**一个**外部 provider — 内置记忆始终与它一起活动。

## 快速开始

```bash
hermes memory setup      # 交互式选择器 + 配置
hermes memory status     # 检查活动的是什么
hermes memory off        # 禁用外部 provider
```

或在 `~/.hermes/config.yaml` 中手动设置：

```yaml
memory:
  provider: openviking   # 或 honcho、mem0、hindsight、holographic、retaindb、byterover、supermemory
```

## 工作原理

当记忆 provider 处于活动状态时，Hermes 自动：

1. **注入 provider 上下文** 到系统提示（provider 知道什么）
2. **在每个 turn 之前预取相关记忆**（后台，非阻塞）
3. **在每个响应后同步对话轮次** 到 provider
4. **在会话结束时提取记忆**（对于支持它的 provider）
5. **将内置记忆写入镜像** 到外部 provider
6. **添加 provider 特定工具** 以便代理可以搜索、存储和管理记忆

内置记忆（MEMORY.md / USER.md）继续像以前一样完全工作。外部 provider 是附加的。

## 可用的 Provider

### Honcho

具有辩证问答、语义搜索和持久化结论的 AI 原生跨会话用户建模。

| | |
|---|---|
| **最适合** | 具有跨会话上下文和用户代理对齐的多代理系统 |
| **需要** | `pip install honcho-ai` + [API 密钥](https://app.honcho.dev) 或自托管实例 |
| **数据存储** | Honcho Cloud 或自托管 |
| **成本** | Honcho 定价（云）/ 免费（自托管） |

**工具：** `honcho_profile`（对等体卡片）、`honcho_search`（语义搜索）、`honcho_context`（LLM 综合）、`honcho_conclude`（存储事实）

**设置向导：**
```bash
hermes honcho setup        # （遗留命令）
# 或
hermes memory setup        # 选择 "honcho"
```

**配置：** `$HERMES_HOME/honcho.json`（配置文件本地）或 `~/.honcho/config.json`（全局）。解析顺序：`$HERMES_HOME/honcho.json` > `~/.hermes/honcho.json` > `~/.honcho/config.json`。参见[配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md)和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。

<details>
<summary>关键配置选项</summary>

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `apiKey` | -- | 从 [app.honcho.dev](https://app.honcho.dev) 获取的 API 密钥 |
| `baseUrl` | -- | 自托管 Honcho 的基础 URL |
| `peerName` | -- | 用户对等体身份 |
| `aiPeer` | host key | AI 对等体身份（每个配置文件一个） |
| `workspace` | host key | 共享工作区 ID |
| `recallMode` | `hybrid` | `hybrid`（自动注入 + 工具）、`context`（仅注入）、`tools`（仅工具） |
| `observation` | all on | 每个对等体的 `observeMe`/`observeOthers` 布尔值 |
| `writeFrequency` | `async` | `async`、`turn`、`session` 或整数 N |
| `sessionStrategy` | `per-directory` | `per-directory`、`per-repo`、`per-session`、`global` |
| `dialecticReasoningLevel` | `low` | `minimal`、`low`、`medium`、`high`、`max` |
| `dialecticDynamic` | `true` | 按查询长度自动提升推理 |
| `messageMaxChars` | `25000` | 每条消息的最大字符数（超出时分块） |

</details>

<details>
<summary>最小 honcho.json（云）</summary>

```json
{
  "apiKey": "your-key-from-app.honcho.dev",
  "hosts": {
    "hermes": {
      "enabled": true,
      "aiPeer": "hermes",
      "peerName": "your-name",
      "workspace": "hermes"
    }
  }
}
```

</details>

<details>
<summary>最小 honcho.json（自托管）</summary>

```json
{
  "baseUrl": "http://localhost:8000",
  "hosts": {
    "hermes": {
      "enabled": true,
      "aiPeer": "hermes",
      "peerName": "your-name",
      "workspace": "hermes"
    }
  }
}
```

</details>

:::tip 从 `hermes honcho` 迁移
如果您以前使用过 `hermes honcho setup`，您的配置和所有服务器端数据完好无损。只需通过设置向导重新启用或手动设置 `memory.provider: honcho` 即可通过新系统重新激活。
:::

**多代理 / 画像：**

每个 Hermes 配置文件获得自己的 Honcho AI 对等体，同时共享相同的工作区 — 所有配置文件看到相同的用户表示，但每个代理构建自己的身份和观察。

```bash
hermes profile create coder --clone   # 创建 honcho 对等体 "coder"，从默认继承配置
```

`--clone` 的作用：在 `honcho.json` 中创建 `hermes.coder` 主机块，包含 `aiPeer: "coder"`、共享 `workspace`、继承的 `peerName`、`recallMode`、`writeFrequency`、`observation` 等。对等体被急切地在 Honcho 中创建，因此在第一条消息之前就存在。

对于在设置 Honcho 之前创建的配置：

```bash
hermes honcho sync   # 扫描所有配置文件，为任何缺失的创建主机块
```

这从默认的 `hermes` 主机块继承设置，并为每个配置文件创建新的 AI 对等体。幂等 — 跳过已有主机块的配置文件。

<details>
<summary>完整 honcho.json 示例（多配置文件）</summary>

```json
{
  "apiKey": "your-key",
  "workspace": "hermes",
  "peerName": "eri",
  "hosts": {
    "hermes": {
      "enabled": true,
      "aiPeer": "hermes",
      "workspace": "hermes",
      "peerName": "eri",
      "recallMode": "hybrid",
      "writeFrequency": "async",
      "sessionStrategy": "per-directory",
      "observation": {
        "user": { "observeMe": true, "observeOthers": true },
        "ai": { "observeMe": true, "observeOthers": true }
      },
      "dialecticReasoningLevel": "low",
      "dialecticDynamic": true,
      "dialecticMaxChars": 600,
      "messageMaxChars": 25000,
      "saveMessages": true
    },
    "hermes.coder": {
      "enabled": true,
      "aiPeer": "coder",
      "workspace": "hermes",
      "peerName": "eri",
      "recallMode": "tools",
      "observation": {
        "user": { "observeMe": true, "observeOthers": false },
        "ai": { "observeMe": true, "observeOthers": true }
      }
    },
    "hermes.writer": {
      "enabled": true,
      "aiPeer": "writer",
      "workspace": "hermes",
      "peerName": "eri"
    }
  },
  "sessions": {
    "/home/user/myproject": "myproject-main"
  }
}
```

</details>

参见[配置参考](https://github.com/hermes-ai/hermes-agent/blob/main/plugins/memory/honcho/README.md)和 [Honcho 集成指南](https://docs.honcho.dev/v3/guides/integrations/hermes)。

---

### OpenViking

具有文件系统风格知识层次、分层检索和自动记忆提取到 6 个类别的 Volcengine (ByteDance) 上下文数据库。

| | |
|---|---|
| **最适合** | 具有结构化浏览的自托管知识管理 |
| **需要** | `pip install openviking` + 运行中的服务器 |
| **数据存储** | 自托管（本地或云） |
| **成本** | 免费（开源，AGPL-3.0） |

**工具：** `viking_search`（语义搜索）、`viking_read`（分层：摘要/概览/完整）、`viking_browse`（文件系统导航）、`viking_remember`（存储事实）、`viking_add_resource`（摄取 URL/文档）

**设置：**
```bash
# 首先启动 OpenViking 服务器
pip install openviking
openviking-server

# 然后配置 Hermes
hermes memory setup    # 选择 "openviking"
# 或手动：
hermes config set memory.provider openviking
echo "OPENVIKING_ENDPOINT=http://localhost:1933" >> ~/.hermes/.env
```

**关键特性：**
- 分层上下文加载：L0（~100 tokens）→ L1（~2k）→ L2（完整）
- 会话提交时自动记忆提取（画像、偏好、实体、事件、案例、模式）
- 用于分层知识浏览的 `viking://` URI 方案

---

### Mem0

具有语义搜索、重排和自动去重的服务器端 LLM 事实提取。

| | |
|---|---|
| **最适合** | 免手动记忆管理 — Mem0 自动处理提取 |
| **需要** | `pip install mem0ai` + API 密钥 |
| **数据存储** | Mem0 Cloud |
| **成本** | Mem0 定价 |

**工具：** `mem0_profile`（所有存储的记忆）、`mem0_search`（语义搜索 + 重排）、`mem0_conclude`（存储逐字事实）

**设置：**
```bash
hermes memory setup    # 选择 "mem0"
# 或手动：
hermes config set memory.provider mem0
echo "MEM0_API_KEY=your-key" >> ~/.hermes/.env
```

**配置：** `$HERMES_HOME/mem0.json`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `user_id` | `hermes-user` | 用户标识符 |
| `agent_id` | `hermes` | 代理标识符 |

---

### Hindsight

具有知识图谱、实体解析和多策略检索的长期记忆。`hindsight_reflect` 工具提供跨记忆综合，这是其他 provider 无法提供的。

| | |
|---|---|
| **最适合** | 具有实体关系的基于知识图谱的召回 |
| **需要** | 云：`pip install hindsight-client` + API 密钥。本地：`pip install hindsight` + LLM 密钥 |
| **数据存储** | Hindsight Cloud 或本地嵌入式 PostgreSQL |
| **成本** | Hindsight 定价（云）或免费（本地） |

**工具：** `hindsight_retain`（带实体提取存储）、`hindsight_recall`（多策略搜索）、`hindsight_reflect`（跨记忆综合）

**设置：**
```bash
hermes memory setup    # 选择 "hindsight"
# 或手动：
hermes config set memory.provider hindsight
echo "HINDSIGHT_API_KEY=your-key" >> ~/.hermes/.env
```

**配置：** `$HERMES_HOME/hindsight/config.json`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `mode` | `cloud` | `cloud` 或 `local` |
| `bank_id` | `hermes` | 记忆库标识符 |
| `budget` | `mid` | 召回详尽度：`low` / `mid` / `high` |

---

### Holographic

具有 FTS5 全文搜索、信任评分和 HRR（全息简化表示）的本地 SQLite 事实存储，用于组合代数查询。

| | |
|---|---|
| **最适合** | 具有高级检索的本地唯一记忆，无外部依赖 |
| **需要** | 无（SQLite 始终可用）。NumPy 用于 HRR 代数为可选。 |
| **数据存储** | 本地 SQLite |
| **成本** | 免费 |

**工具：** `fact_store`（9 个操作：add、search、probe、related、reason、contradict、update、remove、list）、`fact_feedback`（有帮助/无帮助评分，训练信任评分）

**设置：**
```bash
hermes memory setup    # 选择 "holographic"
# 或手动：
hermes config set memory.provider holographic
```

**配置：** `config.yaml` 下的 `plugins.hermes-memory-store`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `db_path` | `$HERMES_HOME/memory_store.db` | SQLite 数据库路径 |
| `auto_extract` | `false` | 在会话结束时自动提取事实 |
| `default_trust` | `0.5` | 默认信任评分（0.0–1.0） |

**独特能力：**
- `probe` — 针对特定实体的代数召回（关于一个人/事物的所有事实）
- `reason` — 跨多个实体的组合 AND 查询
- `contradict` — 冲突事实的自动检测
- 不对称反馈的信任评分（+0.05 有帮助 / -0.10 无帮助）

---

### RetainDB

具有混合搜索（Vector + BM25 + 重排）、7 种记忆类型和增量压缩的云记忆 API。

| | |
|---|---|
| **最适合** | 已使用 RetainDB 基础设施的团队 |
| **需要** | RetainDB 账户 + API 密钥 |
| **数据存储** | RetainDB Cloud |
| **成本** | $20/月 |

**工具：** `retaindb_profile`（用户画像）、`retaindb_search`（语义搜索）、`retaindb_context`（任务相关上下文）、`retaindb_remember`（带类型 + 重要性存储）、`retaindb_forget`（删除记忆）

**设置：**
```bash
hermes memory setup    # 选择 "retaindb"
# 或手动：
hermes config set memory.provider retaindb
echo "RETAINDB_API_KEY=your-key" >> ~/.hermes/.env
```

---

### ByteRover

通过 `brv` CLI 的持久化记忆 — 具有分层检索的知识层次树（模糊文本 → LLM 驱动搜索）。本地优先，可选云同步。

| | |
|---|---|
| **最适合** | 希望使用 CLI 的便携式本地优先记忆的开发者 |
| **需要** | ByteRover CLI（`npm install -g byterover-cli` 或[安装脚本](https://byterover.dev)） |
| **数据存储** | 本地（默认）或 ByteRover Cloud（可选同步） |
| **成本** | 免费（本地）或 ByteRover 定价（云） |

**工具：** `brv_query`（搜索知识树）、`brv_curate`（存储事实/决策/模式）、`brv_status`（CLI 版本 + 树统计）

**设置：**
```bash
# 首先安装 CLI
curl -fsSL https://byterover.dev/install.sh | sh

# 然后配置 Hermes
hermes memory setup    # 选择 "byterover"
# 或手动：
hermes config set memory.provider byterover
```

**关键特性：**
- 自动预压缩提取（在上下文压缩丢弃之前保存洞察）
- 知识树存储在 `$HERMES_HOME/byterover/`（配置文件作用域）
- SOC2 Type II 认证云同步（可选）

---

### Supermemory

具有画像召回、语义搜索、显式记忆工具和通过 Supermemory 图 API 在会话结束时摄取对话的语义长期记忆。

| | |
|---|---|
| **最适合** | 具有用户画像和会话级图构建的语义召回 |
| **需要** | `pip install supermemory` + [API 密钥](https://supermemory.ai) |
| **数据存储** | Supermemory Cloud |
| **成本** | Supermemory 定价 |

**工具：** `supermemory_store`（保存显式记忆）、`supermemory_search`（语义相似性搜索）、`supermemory_forget`（按 ID 或最佳匹配查询遗忘）、`supermemory_profile`（持久化画像 + 最近上下文）

**设置：**
```bash
hermes memory setup    # 选择 "supermemory"
# 或手动：
hermes config set memory.provider supermemory
echo 'SUPERMEMORY_API_KEY=***' >> ~/.hermes/.env
```

**配置：** `$HERMES_HOME/supermemory.json`

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `container_tag` | `hermes` | 用于搜索和写入的容器标签。支持 `{identity}` 模板用于配置文件作用域标签。 |
| `auto_recall` | `true` | 在 turn 之前注入相关记忆上下文 |
| `auto_capture` | `true` | 在每个响应后存储清理后的用户-助手轮次 |
| `max_recall_results` | `10` | 格式化为上下文的最多召回项数 |
| `profile_frequency` | `50` | 在第一次 turn 和每 N 个 turn 时包含画像事实 |
| `capture_mode` | `all` | 默认跳过微小或平凡的轮次 |
| `search_mode` | `hybrid` | 搜索模式：`hybrid`、`memories` 或 `documents` |
| `api_timeout` | `5.0` | SDK 和摄取请求的超时 |

**环境变量：** `SUPERMEMORY_API_KEY`（必需）、`SUPERMEMORY_CONTAINER_TAG`（覆盖配置）。

**关键特性：**
- 自动上下文隔离 — 从摄取的轮次中剥离召回的记忆以防止递归记忆污染
- 会话结束对话摄取以获得更丰富的图级知识构建
- 在第一次 turn 和可配置间隔注入画像事实
- 平凡消息过滤（跳过 "ok"、"thanks" 等）
- **配置文件作用域容器** — 在 `container_tag` 中使用 `{identity}`（例如 `hermes-{identity}` → `hermes-coder`）来隔离每个 Hermes 配置文件的记忆
- **多容器模式** — 启用 `enable_custom_container_tags` 以及 `custom_containers` 列表，让代理跨命名容器读取/写入。自动操作（同步、预取）保持在主容器上。

<details>
<summary>多容器示例</summary>

```json
{
  "container_tag": "hermes",
  "enable_custom_container_tags": true,
  "custom_containers": ["project-alpha", "shared-knowledge"],
  "custom_container_instructions": "Use project-alpha for coding context."
}
```

</details>

**支持：** [Discord](https://supermemory.link/discord) · [support@supermemory.com](mailto:support@supermemory.com)

---

## Provider 比较

| Provider | 存储 | 成本 | 工具 | 依赖 | 独特特性 |
|----------|---------|------|-------|-------------|----------------|
| **Honcho** | 云 | 付费 | 4 | `honcho-ai` | 辩证用户建模 |
| **OpenViking** | 自托管 | 免费 | 5 | `openviking` + 服务器 | 文件系统层次 + 分层加载 |
| **Mem0** | 云 | 付费 | 3 | `mem0ai` | 服务器端 LLM 提取 |
| **Hindsight** | 云/本地 | 免费/付费 | 3 | `hindsight-client` | 知识图谱 + 反射综合 |
| **Holographic** | 本地 | 免费 | 2 | 无 | HRR 代数 + 信任评分 |
| **RetainDB** | 云 | $20/月 | 5 | `requests` | 增量压缩 |
| **ByteRover** | 本地/云 | 免费/付费 | 3 | `brv` CLI | 预压缩提取 |
| **Supermemory** | 云 | 付费 | 4 | `supermemory` | 上下文隔离 + 会话图摄取 + 多容器 |

## 配置文件隔离

每个 provider 的数据按[配置文件](/docs/user-guide/profiles)隔离：

- **本地存储 provider**（Holographic、ByteRover）使用每个配置文件不同的 `$HERMES_HOME/` 路径
- **配置文件 provider**（Honcho、Mem0、Hindsight、Supermemory）在 `$HERMES_HOME/` 中存储配置，因此每个配置文件有自己的凭证
- **云 provider**（RetainDB）自动派生配置文件作用域的项目名称
- **环境变量 provider**（OpenViking）通过每个配置文件的 `.env` 文件配置

## 构建记忆 Provider

参见[开发者指南：记忆 Provider 插件](/docs/developer-guide/memory-provider-plugin)了解如何创建您自己的。
