---
sidebar_position: 2
title: "配置"
description: "配置 Hermes Agent——config.yaml、提供商、模型、API key 等"
---

# 配置

所有设置都存储在 `~/.hermes/` 目录中，便于访问。

## 目录结构

```text
~/.hermes/
├── config.yaml     # 设置（模型、终端、TTS、压缩等）
├── .env            # API key 和密钥
├── auth.json       # OAuth 提供商凭证（Nous Portal 等）
├── SOUL.md         # 主要代理身份（系统提示槽位 #1）
├── memories/       # 持久化记忆（MEMORY.md、USER.md）
├── skills/         # 代理创建的技能（通过 skill_manage 工具管理）
├── cron/           # 计划任务
├── sessions/       # 网关会话
└── logs/           # 日志（errors.log、gateway.log——密钥自动编辑）
```

## 管理配置

```bash
hermes config              # 查看当前配置
hermes config edit         # 在编辑器中打开 config.yaml
hermes config set KEY VAL  # 设置特定值
hermes config check        # 检查缺失的选项（更新后）
hermes config migrate      # 交互式添加缺失的选项

# 示例：
hermes config set model anthropic/claude-opus-4
hermes config set terminal.backend docker
hermes config set OPENROUTER_API_KEY sk-or-...  # 保存到 .env
```

:::tip
`hermes config set` 命令自动将值路由到正确的文件——API key 保存到 `.env`，其他都保存到 `config.yaml`。
:::

## 配置优先级

设置按此顺序解析（优先级最高优先）：

1. **CLI 参数** — 例如 `hermes chat --model anthropic/claude-sonnet-4`（每次调用覆盖）
2. **`~/.hermes/config.yaml`** — 所有非密钥设置的主要配置文件
3. **`~/.hermes/.env`** — 环境变量的后备；**密钥必填**（API key、令牌、密码）
4. **内置默认值** — 当没有设置任何其他内容时的硬编码安全默认值

:::info 经验法则
密钥（API key、机器人令牌、密码）放在 `.env`。其他（模型、终端后端、压缩设置、内存限制、工具集）放在 `config.yaml`。当两者都设置时，`config.yaml` 在非密钥设置上优先。
:::

## 环境变量替换

你可以在 `config.yaml` 中使用 `${VAR_NAME}` 语法引用环境变量：

```yaml
auxiliary:
  vision:
    api_key: ${GOOGLE_API_KEY}
    base_url: ${CUSTOM_VISION_URL}

delegation:
  api_key: ${DELEGATION_KEY}
```

单个值中的多个引用可以：`url: "${HOST}:${PORT}"`。如果引用的变量未设置，占位符保持不变（`${UNDEFINED_VAR}` 保持原样）。仅支持 `${VAR}` 语法——裸 `$VAR` 不会展开。

有关 AI 提供商设置（OpenRouter、Anthropic、Copilot、自定义端点、自托管 LLM、回退模型等），参见 [AI 提供商](/docs/integrations/providers)。

## 终端后端配置

Hermes 支持六种终端后端。每一个都决定代理的 shell 命令实际执行在哪里——你的本地机器、Docker 容器、通过 SSH 的远程服务器、Modal 云沙盒、Daytona 工作区或 Singularity/Apptainer 容器。

```yaml
terminal:
  backend: local    # local | docker | ssh | modal | daytona | singularity
  cwd: "."          # 工作目录（"." = 本地当前目录，容器内为 "/root"）
  timeout: 180      # 每命令超时秒数
  env_passthrough: []  # 转发到沙盒执行的 env var 名称（terminal + execute_code）
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"  # Singularity 后端的容器镜像
  modal_image: "nikolaik/python-nodejs:python3.11-nodejs20"                 # Modal 后端的容器镜像
  daytona_image: "nikolaik/python-nodejs:python3.11-nodejs20"               # Daytona 后端的容器镜像
```

对于 Modal 和 Daytona 等云沙盒，`container_persistent: true` 意味着 Hermes 会尝试在沙盒重新创建之间保留文件系统状态。它不能承诺相同的实时沙盒、PID 空间或后台进程稍后仍在运行。

### 后端概览

| 后端 | 命令运行在 | 隔离 | 适用于 |
|---------|-------------------|-----------|--------|
| **local** | 直接在你的机器上 | 无 | 开发、个人使用 |
| **docker** | Docker 容器内 | 完全（命名空间、cap-drop） | 安全沙盒、CI/CD |
| **ssh** | 通过 SSH 的远程服务器 | 网络边界 | 远程开发、强大硬件 |
| **modal** | Modal 云沙盒 | 完全（云 VM） | 临时云计算、评估 |
| **daytona** | Daytona 工作区 | 完全（云容器） | 托管云开发环境 |
| **singularity** | Singularity/Apptainer 容器 | 命名空间（--containall） | HPC 集群、共享机器 |

### 本地后端

默认值。命令直接在你的机器上运行，无隔离。无需特殊设置。

```yaml
terminal:
  backend: local
```

:::warning
代理具有与你的用户账户相同的文件系统访问权限。使用 `hermes tools` 禁用你不想要的工具，或切换到 Docker 进行沙盒化。
:::

### Docker 后端

在具有安全加固的 Docker 容器内运行命令（所有 capabilities 丢弃、无权限提升、PID 限制）。

```yaml
terminal:
  backend: docker
  docker_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  docker_mount_cwd_to_workspace: false  # 将启动目录挂载到 /workspace
  docker_forward_env:              # 转发到容器的 env var
    - "GITHUB_TOKEN"
  docker_volumes:                  # 主机目录挂载
    - "/home/user/projects:/workspace/projects"
    - "/home/user/data:/data:ro"   # :ro 为只读

  # 资源限制
  container_cpu: 1                 # CPU 核心数（0 = 无限制）
  container_memory: 5120           # MB（0 = 无限制）
  container_disk: 51200            # MB（需要 XFS+pquota 上的 overlay2）
  container_persistent: true       # 在会话之间持久化 /workspace 和 /root
```

**要求：** Docker Desktop 或 Docker Engine 已安装并运行。Hermes 探测 `$PATH` 加上常见 macOS 安装位置（`/usr/local/bin/docker`、`/opt/homebrew/bin/docker`、Docker Desktop 应用包）。

**容器生命周期：** 每个会话启动一个长期容器（`docker run -d ... sleep 2h`）。命令通过 `docker exec` 和登录 shell 运行。清理时，容器被停止并移除。

**安全加固：**
- `--cap-drop ALL`，仅添加回 `DAC_OVERRIDE`、`CHOWN`、`FOWNER`
- `--security-opt no-new-privileges`
- `--pids-limit 256`
- 大小限制的 tmpfs 用于 `/tmp`（512MB）、`/var/tmp`（256MB）、`/run`（64MB）

**凭证转发：** `docker_forward_env` 中列出的 env var 先从你的 shell 环境解析，然后回退到 `~/.hermes/.env`。技能也可以声明 `required_environment_variables`，这些会自动合并。

### SSH 后端

通过 SSH 在远程服务器上运行命令。使用 ControlMaster 进行连接重用（5 分钟空闲保活）。默认启用持久化 shell——状态（cwd、env var）在命令之间保持。

```yaml
terminal:
  backend: ssh
  persistent_shell: true           # 保持长期 bash 会话（默认：true）
```

**必需的环境变量：**

```bash
TERMINAL_SSH_HOST=my-server.example.com
TERMINAL_SSH_USER=ubuntu
```

**可选：**

| 变量 | 默认 | 描述 |
|----------|---------|-------------|
| `TERMINAL_SSH_PORT` | `22` | SSH 端口 |
| `TERMINAL_SSH_KEY` | （系统默认） | SSH 私钥路径 |
| `TERMINAL_SSH_PERSISTENT` | `true` | 启用持久化 shell |

**工作原理：** 使用 `BatchMode=yes` 和 `StrictHostKeyChecking=accept-new` 在初始化时连接。持久化 shell 在远程主机上保持单个 `bash -l` 进程存活，通过临时文件通信。需要 `stdin_data` 或 sudo 的命令自动回退到一次性模式。

### Modal 后端

在 [Modal](https://modal.com) 云沙盒中运行命令。每个任务获得一个具有可配置 CPU、内存和磁盘的隔离 VM。文件系统可以在会话之间快照/恢复。

```yaml
terminal:
  backend: modal
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB（5GB）
  container_disk: 51200            # MB（50GB）
  container_persistent: true       # 快照/恢复文件系统
```

**必需：** `MODAL_TOKEN_ID` + `MODAL_TOKEN_SECRET` 环境变量，或 `~/.modal.toml` 配置文件。

**持久化：** 启用时，沙盒文件系统在清理时快照并在下次会话时恢复。快照跟踪在 `~/.hermes/modal_snapshots.json` 中。这保留文件系统状态，不保留实时进程、PID 空间或后台作业。

**凭证文件：** 自动从 `~/.hermes/` 挂载（OAuth 令牌等）并在每个命令之前同步。

### Daytona 后端

在 [Daytona](https://daytona.io) 托管工作区中运行命令。支持停止/恢复以实现持久化。

```yaml
terminal:
  backend: daytona
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB → 转换为 GiB
  container_disk: 10240            # MB → 转换为 GiB（最大 10 GiB）
  container_persistent: true       # 停止/恢复而非删除
```

**必需：** `DAYTONA_API_KEY` 环境变量。

**持久化：** 启用时，沙盒在清理时停止（而非删除）并在下次会话时恢复。沙盒名称遵循模式 `hermes-{task_id}`。

**磁盘限制：** Daytona 强制最大 10 GiB。高于此的请求会被警告并限制。

### Singularity/Apptainer 后端

在 [Singularity/Apptainer](https://apptainer.org) 容器中运行命令。为 Docker 不可用的 HPC 集群和共享机器设计。

```yaml
terminal:
  backend: singularity
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"
  container_cpu: 1                 # CPU 核心数
  container_memory: 5120           # MB
  container_persistent: true       # 可写覆盖在会话之间持久化
```

**要求：** `apptainer` 或 `singularity` 二进制文件在 `$PATH` 中。

**镜像处理：** Docker URL（`docker://...`）自动转换为 SIF 文件并缓存。现有 `.sif` 文件直接使用。

**暂存目录：** 按顺序解析：`TERMINAL_SCRATCH_DIR` → `TERMINAL_SANDBOX_DIR/singularity` → `/scratch/$USER/hermes-agent`（HPC 约定）→ `~/.hermes/sandboxes/singularity`。

**隔离：** 使用 `--containall --no-home` 进行完整命名空间隔离，不挂载主机主目录。

### 常见终端后端问题

如果终端命令立即失败或报告工具已禁用：

- **Local** — 无特殊要求。开始时最安全的默认值。
- **Docker** — 运行 `docker version` 验证 Docker 工作。如果失败，修复 Docker 或 `hermes config set terminal.backend local`。
- **SSH** — 必须设置 `TERMINAL_SSH_HOST` 和 `TERMINAL_SSH_USER`。如果任一缺失，Hermes 会记录明确错误。
- **Modal** — 需要 `MODAL_TOKEN_ID` 环境变量或 `~/.modal.toml`。运行 `hermes doctor` 检查。
- **Daytona** — 需要 `DAYTONA_API_KEY`。Daytona SDK 处理服务器 URL 配置。
- **Singularity** — 需要 `apptainer` 或 `singularity` 在 `$PATH` 中。HPC 集群上常见。

如有疑问，将 `terminal.backend` 设回 `local` 并首先验证命令在那里运行。

### Docker 卷挂载

使用 Docker 后端时，`docker_volumes` 允许你与容器共享主机目录。每个条目使用标准 Docker `-v` 语法：`host_path:container_path[:options]`。

```yaml
terminal:
  backend: docker
  docker_volumes:
    - "/home/user/projects:/workspace/projects"   # 读写（默认）
    - "/home/user/datasets:/data:ro"              # 只读
    - "/home/user/outputs:/outputs"               # 代理写入，你读取
```

这适用于：
- **向代理提供文件**（数据集、配置、参考代码）
- **从代理接收文件**（生成的代码、报告、导出）
- **共享工作区** 你和代理都访问相同文件的地方

也可以通过环境变量设置：`TERMINAL_DOCKER_VOLUMES='["/host:/container"]'`（JSON 数组）。

### Docker 凭证转发

默认情况下，Docker 终端会话不继承任意主机凭证。如果你需要容器内的特定令牌，将其添加到 `terminal.docker_forward_env`。

```yaml
terminal:
  backend: docker
  docker_forward_env:
    - "GITHUB_TOKEN"
    - "NPM_TOKEN"
```

Hermes 首先从当前 shell 解析每个列出的变量，然后回退到 `~/.hermes/.env`（如果通过 `hermes config set` 保存）。

:::warning
任何在 `docker_forward_env` 中列出的内容在容器内运行的命令都可见。只转发你愿意在终端会话中暴露的凭证。
:::

### 可选：将启动目录挂载到 `/workspace`

Docker 沙盒默认保持隔离。Hermes 默认**不**将你的当前主机工作目录传递到容器中，除非你明确选择。

在 `config.yaml` 中启用：

```yaml
terminal:
  backend: docker
  docker_mount_cwd_to_workspace: true
```

启用时：
- 如果你从 `~/projects/my-app` 启动 Hermes，该主机目录绑定挂载到 `/workspace`
- Docker 后端从 `/workspace` 开始
- 文件工具和终端命令都看到相同的挂载项目

禁用时，`/workspace` 保持沙盒所有，除非你通过 `docker_volumes` 明确挂载。

安全权衡：
- `false` 保留沙盒边界
- `true` 给予沙盒直接访问你启动 Hermes 的目录

只有当你故意希望容器处理实时主机文件时才使用 opt-in。

### 持久化 Shell

默认情况下，每个终端命令在自己的子进程中运行——工作目录、环境变量和 shell 变量在命令之间重置。当**持久化 shell** 启用时，单个长期存在的 bash 进程在 `execute()` 调用之间保持存活，以便状态在命令之间保持。

这对 **SSH 后端** 最有用，它还消除了每个命令的连接开销。持久化 shell **默认启用 SSH**，本地后端默认禁用。

```yaml
terminal:
  persistent_shell: true   # 默认——为 SSH 启用持久化 shell
```

禁用：

```bash
hermes config set terminal.persistent_shell false
```

**跨命令保持的内容：**
- 工作目录（`cd /tmp` 为下一个命令保留）
- 导出的环境变量（`export FOO=bar`）
- Shell 变量（`MY_VAR=hello`）

**优先级：**

| 级别 | 变量 | 默认 |
|-------|----------|---------|
| Config | `terminal.persistent_shell` | `true` |
| SSH 覆盖 | `TERMINAL_SSH_PERSISTENT` | 跟随 config |
| Local 覆盖 | `TERMINAL_LOCAL_PERSISTENT` | `false` |

每个后端的环境变量优先。如果你也想在本地后端启用持久化 shell：

```bash
export TERMINAL_LOCAL_PERSISTENT=true
```

:::note
需要 `stdin_data` 或 sudo 的命令自动回退到一次性模式，因为持久化 shell 的 stdin 已被 IPC 协议占用。
:::

参见 [代码执行](features/code-execution.md) 和 [README 的终端部分](features/tools.md) 了解每个后端的详情。

## 技能设置

技能可以通过其 SKILL.md frontmatter 声明自己的配置设置。这些是非密钥值（路径、首选项、域设置），存储在 `config.yaml` 的 `skills.config` 命名空间下。

```yaml
skills:
  config:
    wiki:
      path: ~/wiki          # 由 llm-wiki 技能使用
```

**技能设置如何工作：**

- `hermes config migrate` 扫描所有已启用技能，找未配置的设置并主动提供提示
- `hermes config show` 在"技能设置"下显示所有技能设置及其所属技能
- 当技能加载时，其解析的配置值会自动注入技能上下文

**手动设置值：**

```bash
hermes config set skills.config.wiki.path ~/my-research-wiki
```

有关在你的技能中声明配置设置的详情，参见 [创建技能——配置设置](/docs/developer-guide/creating-skills#config-settings-configyaml)。

## 记忆配置

```yaml
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200   # 约 800 token
  user_char_limit: 1375     # 约 500 token
```

## 文件读取安全

控制单次 `read_file` 调用可以返回多少内容。超过限制的读取会被拒绝，并告知代理使用 `offset` 和 `limit` 获取更小的范围。这可以防止单次读取精简的 JS 包或大数据文件时洪水般涌入上下文窗口。

```yaml
file_read_max_chars: 100000  # 默认——约 25-35K token
```

如果你使用大上下文窗口模型并经常读取大文件，可以提高它。为小上下文模型降低它以保持读取效率：

```yaml
# 大上下文模型（200K+）
file_read_max_chars: 200000

# 小型本地模型（16K 上下文）
file_read_max_chars: 30000
```

代理也会自动去重文件读取——如果同一文件区域被读取两次且文件未更改，则返回轻量级存根而非重新发送内容。这在上下文压缩时重置，以便代理在其内容被摘要后可以重新读取文件。

## Git Worktree 隔离

为在同一仓库上并行运行多个代理启用隔离的 git worktree：

```yaml
worktree: true    # 始终创建 worktree（与 hermes -w 相同）
# worktree: false # 默认——仅在传递 -w 标志时
```

启用时，每个 CLI 会话在 `.worktrees/` 下创建一个新的 worktree 和自己的分支。代理可以编辑文件、提交、推送和创建 PR，而不会相互干扰。干净的 worktree 在退出时被移除；脏的会被保留以供手动恢复。

你也可以通过仓库根目录下的 `.worktreeinclude` 列出要复制到 worktree 的 gitignored 文件：

```
# .worktreeinclude
.env
.venv/
node_modules/
```

## 上下文压缩

Hermes 自动压缩长对话以保持在模型上下文窗口内。压缩摘要器是单独的 LLM 调用——你可以将其指向任何提供商或端点。

所有压缩设置都在 `config.yaml` 中（无环境变量）。

### 完整参考

```yaml
compression:
  enabled: true                                     # 切换压缩开/关
  threshold: 0.50                                   # 在上下文限制的此百分比时压缩
  target_ratio: 0.20                                # 作为最近尾部保留的比例
  protect_last_n: 20                                # 保持未压缩的最小最近消息数
  summary_model: "google/gemini-3-flash-preview"    # 用于摘要的模型
  summary_provider: "auto"                          # 提供商："auto"、"openrouter"、"nous"、"codex"、"main" 等
  summary_base_url: null                            # 自定义 OpenAI 兼容端点（覆盖提供商）
```

### 常见设置

**默认（自动检测）——无需配置：**
```yaml
compression:
  enabled: true
  threshold: 0.50
```
使用第一个可用提供商（OpenRouter → Nous → Codex）和 Gemini Flash。

**强制特定提供商**（基于 OAuth 或 API key）：
```yaml
compression:
  summary_provider: nous
  summary_model: gemini-3-flash
```
适用于任何提供商：`nous`、`openrouter`、`codex`、`anthropic`、`main` 等。

**自定义端点**（自托管、Ollama、zai、DeepSeek 等）：
```yaml
compression:
  summary_model: glm-4-7
  summary_base_url: https://api.z.ai/api/coding/paas/v4
```
指向自定义 OpenAI 兼容端点。使用 `OPENAI_API_KEY` 进行认证。

### 三个旋钮如何交互

| `summary_provider` | `summary_base_url` | 结果 |
|---------------------|---------------------|--------|
| `auto`（默认） | 未设置 | 自动检测最佳可用提供商 |
| `nous` / `openrouter` 等 | 未设置 | 强制使用该提供商，使用其认证 |
| 任意 | 设置 | 直接使用自定义端点（忽略提供商） |

`summary_model` 必须支持至少与你主模型一样大的上下文长度，因为它接收对话的完整中间部分以进行压缩。

## 迭代预算压力

当代理处理具有许多工具调用的复杂任务时，它可能会在未意识到预算快用完的情况下耗尽其迭代预算（默认：90 回合）。预算压力在接近限制时自动警告模型：

| 阈值 | 级别 | 模型看到的内容 |
|-----------|-------|---------------------|
| **70%** | 注意 | `[BUDGET: 63/90. 27 iterations left. Start consolidating.]` |
| **90%** | 警告 | `[BUDGET WARNING: 81/90. Only 9 left. Respond NOW.]` |

警告被注入到最后一个工具结果的 JSON 中（作为 `_budget_warning` 字段）而非作为单独消息——这保留了提示缓存且不会破坏对话结构。

```yaml
agent:
  max_turns: 90                # 每次对话回合的最大迭代次数（默认：90）
```

预算压力默认启用。代理自然会作为工具结果的一部分看到警告，鼓励它在运行迭代之前整合工作并交付响应。

## 上下文压力警告

与迭代预算压力不同，上下文压力跟踪对话接近**压缩阈值**的程度——即上下文压缩触发以摘要旧消息的点。这有助于你和代理理解对话何时变长。

| 进度 | 级别 | 发生什么 |
|----------|-------|-------------|
| **≥ 60%** 到阈值 | 信息 | CLI 显示青色进度条；网关发送通知 |
| **≥ 85%** 到阈值 | 警告 | CLI 显示粗体黄色条；网关警告压缩即将来临 |

在 CLI 中，上下文压力显示在工具输出信息中的进度条：

```
  ◐ context ████████████░░░░░░░░ 62% to compaction  48k threshold (50%) · approaching compaction
```

在消息平台上，发送纯文本通知：

```
◐ Context: ████████████░░░░░░░░ 62% to compaction (threshold: 50% of window).
```

如果自动压缩被禁用，警告会告诉你上下文可能被截断而不是。

上下文压力是自动的——无需配置。它纯粹作为面向用户的通知触发，不修改消息流或向模型上下文注入任何内容。

## 凭证池策略

当你有多个相同提供商的 API key 或 OAuth 令牌时，配置轮换策略：

```yaml
credential_pool_strategies:
  openrouter: round_robin    # 均匀循环使用 key
  anthropic: least_used      # 始终选择使用最少的 key
```

选项：`fill_first`（默认）、`round_robin`、`least_used`、`random`。参见 [凭证池](/docs/user-guide/features/credential-pools) 获取完整文档。

## 辅助模型

Hermes 使用轻量级"辅助"模型处理副任务，如图像分析、网页摘要和浏览器截图分析。默认情况下，这些使用 **Gemini Flash** 并通过自动检测——你无需配置任何内容。

### 通用配置模式

Hermes 中的每个模型槽——辅助任务、压缩、回退——使用相同的三个旋钮：

| 键 | 功能 | 默认 |
|-----|-------------|---------|
| `provider` | 使用哪个提供商进行认证和路由 | `"auto"` |
| `model` | 请求哪个模型 | 提供商默认 |
| `base_url` | 自定义 OpenAI 兼容端点（覆盖提供商） | 未设置 |

当 `base_url` 设置时，Hermes 忽略提供商并直接调用该端点（使用 `api_key` 或 `OPENAI_API_KEY` 进行认证）。当仅设置 `provider` 时，Hermes 使用该提供商的内置认证和 base URL。

可用提供商：`auto`、`openrouter`、`nous`、`codex`、`copilot`、`anthropic`、`main`、`zai`、`kimi-coding`、`minimax`、[provider 注册表](/docs/reference/environment-variables) 中注册的任何提供商，或你的 `custom_providers` 列表中的任何命名自定义提供商（例如 `provider: "beans"`）。

### 完整辅助配置参考

```yaml
auxiliary:
  # 图像分析（vision_analyze 工具 + 浏览器截图）
  vision:
    provider: "auto"           # "auto"、"openrouter"、"nous"、"codex"、"main" 等
    model: ""                  # 例如 "openai/gpt-4o"、"google/gemini-2.5-flash"
    base_url: ""               # 自定义 OpenAI 兼容端点（覆盖提供商）
    api_key: ""                # base_url 的 API key（回退到 OPENAI_API_KEY）
    timeout: 30                # 秒——LLM API 调用；对慢速本地视觉模型增加此值
    download_timeout: 30       # 秒——图像 HTTP 下载；对慢速连接增加此值

  # 网页摘要 + 浏览器页面文本提取
  web_extract:
    provider: "auto"
    model: ""                  # 例如 "google/gemini-2.5-flash"
    base_url: ""
    api_key: ""
    timeout: 360               # 秒（6 分钟）——每次 LLM 摘要尝试

  # 危险命令审批分类器
  approval:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30                # 秒

  # 上下文压缩超时（独立于 compression.* 配置）
  compression:
    timeout: 120               # 秒——压缩摘要长对话，需要更多时间

  # 会话搜索——摘要过去会话匹配项
  session_search:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

  # 技能中心——技能匹配和搜索
  skills_hub:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

  # MCP 工具分发
  mcp:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30

  # 记忆刷新——摘要对话以持久化记忆
  flush_memories:
    provider: "auto"
    model: ""
    base_url: ""
    api_key: ""
    timeout: 30
```

:::tip
每个辅助任务都有可配置的 `timeout`（秒）。默认值：vision 30s、web_extract 360s、approval 30s、compression 120s。如果你对辅助任务使用慢速本地模型，增加这些值。Vision 还有一个单独的 `download_timeout`（默认 30s）用于 HTTP 图像下载——对慢速连接或自托管图像服务器增加此值。
:::

:::info
上下文压缩有自己的顶级 `compression:` 块，包含 `summary_provider`、`summary_model` 和 `summary_base_url`——参见上面的 [上下文压缩](#context-compression)。回退模型使用 `fallback_model:` 块——参见 [回退模型](/docs/integrations/providers#fallback-model)。三者都遵循相同的 provider/model/base_url 模式。
:::

### 更改视觉模型

要使用 GPT-4o 而不是 Gemini Flash 进行图像分析：

```yaml
auxiliary:
  vision:
    model: "openai/gpt-4o"
```

或通过环境变量（在 `~/.hermes/.env` 中）：

```bash
AUXILIARY_VISION_MODEL=openai/gpt-4o
```

### 提供商选项

| 提供商 | 描述 | 要求 |
|----------|-------------|-------------|
| `"auto"` | 最佳可用（默认）。Vision 尝试 OpenRouter → Nous → Codex。 | — |
| `"openrouter"` | 强制 OpenRouter——路由到任何模型（Gemini、GPT-4o、Claude 等） | `OPENROUTER_API_KEY` |
| `"nous"` | 强制 Nous Portal | `hermes auth` |
| `"codex"` | 强制 Codex OAuth（ChatGPT 账户）。支持 vision（gpt-5.3-codex）。 | `hermes model` → Codex |
| `"main"` | 使用你活跃的自定义/主端点。这可以来自 `OPENAI_BASE_URL` + `OPENAI_API_KEY`，或从通过 `hermes model` / `config.yaml` 保存的自定义端点。与 OpenAI、本地模型或任何 OpenAI 兼容 API 一起使用。 | 自定义端点凭证 + base URL |

### 常见设置

**使用直接自定义端点**（比 `provider: "main"` 更清晰，用于本地/自托管 API）：
```yaml
auxiliary:
  vision:
    base_url: "http://localhost:1234/v1"
    api_key: "local-key"
    model: "qwen2.5-vl"
```

`base_url` 优先于 `provider`，因此这是将辅助任务路由到特定端点的最明确方式。对于直接端点覆盖，Hermes 使用配置的 `api_key` 或回退到 `OPENAI_API_KEY`；它不会为该自定义端点重用 `OPENROUTER_API_KEY`。

**使用 OpenAI API key 进行 vision：**
```yaml
# 在 ~/.hermes/.env 中：
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_API_KEY=sk-...

auxiliary:
  vision:
    provider: "main"
    model: "gpt-4o"       # 或 "gpt-4o-mini" 更便宜
```

**使用 OpenRouter 进行 vision**（路由到任何模型）：
```yaml
auxiliary:
  vision:
    provider: "openrouter"
    model: "openai/gpt-4o"      # 或 "google/gemini-2.5-flash" 等
```

**使用 Codex OAuth**（ChatGPT Pro/Plus 账户——无需 API key）：
```yaml
auxiliary:
  vision:
    provider: "codex"     # 使用你的 ChatGPT OAuth 令牌
    # 模型默认为 gpt-5.3-codex（支持 vision）
```

**使用本地/自托管模型：**
```yaml
auxiliary:
  vision:
    provider: "main"      # 使用你活跃的自定义端点
    model: "my-local-model"
```

`provider: "main"` 使用 Hermes 用于正常聊天的任何提供商——无论是命名自定义提供商（例如 `beans`）、内置提供商如 `openrouter`，还是遗留 `OPENAI_BASE_URL` 端点。

:::tip
如果你将 Codex OAuth 用作主模型提供商，vision 自动工作——无需额外配置。Codex 在 vision 自动检测链中。
:::

:::warning
**Vision 需要多模态模型。** 如果你设置 `provider: "main"`，确保你的端点支持多模态/vision——否则图像分析会失败。
:::

### 环境变量（遗留）

辅助模型也可以通过环境变量配置。但是 `config.yaml` 是首选方法——它更容易管理并支持所有选项包括 `base_url` 和 `api_key`。

| 设置 | 环境变量 |
|---------|---------------------|
| Vision 提供商 | `AUXILIARY_VISION_PROVIDER` |
| Vision 模型 | `AUXILIARY_VISION_MODEL` |
| Vision 端点 | `AUXILIARY_VISION_BASE_URL` |
| Vision API key | `AUXILIARY_VISION_API_KEY` |
| Web 提取提供商 | `AUXILIARY_WEB_EXTRACT_PROVIDER` |
| Web 提取模型 | `AUXILIARY_WEB_EXTRACT_MODEL` |
| Web 提取端点 | `AUXILIARY_WEB_EXTRACT_BASE_URL` |
| Web 提取 API key | `AUXILIARY_WEB_EXTRACT_API_KEY` |

压缩和回退模型设置仅在 config.yaml 中。

:::tip
运行 `hermes config` 查看你当前的辅助模型设置。仅当与默认值不同时，覆盖才会显示。
:::

## 推理努力

控制模型在响应之前做多少"思考"：

```yaml
agent:
  reasoning_effort: ""   # 空 = 中等（默认）。选项：xhigh（最大）、high、medium、low、minimal、none
```

未设置时（默认），推理努力默认为"medium"——一个对大多数任务平衡良好的级别。设置值会覆盖它——更高的推理努力在复杂任务上给出更好的结果，但代价是更多 token 和延迟。

你也可以在运行时用 `/reasoning` 命令更改推理努力：

```
/reasoning           # 显示当前努力级别和显示状态
/reasoning high      # 将推理努力设置为高
/reasoning none      # 禁用推理
/reasoning show      # 在每个响应上方显示模型思考
/reasoning hide      # 隐藏模型思考
```

## 工具使用强制

某些模型（尤其是 GPT 系列）偶尔会文本描述预期操作而不是进行工具调用。工具使用强制注入指导，将模型引导回实际调用工具。

```yaml
agent:
  tool_use_enforcement: "auto"   # "auto" | true | false | ["model-substring", ...]
```

| 值 | 行为 |
|-------|-------|
| `"auto"`（默认） | 对 GPT 模型（`gpt-`、`openai/gpt-`）启用，对其他所有模型禁用。 |
| `true` | 始终为所有模型启用。 |
| `false` | 始终禁用。 |
| `["gpt-", "o1-", "custom-model"]` | 仅对名称包含列出的任何子字符串的模型启用。 |

启用时，系统提示包含提醒，指导模型进行实际工具调用而不是描述它会做什么。这对用户透明，对已经可靠使用工具的模型没有影响。

## TTS 配置

```yaml
tts:
  provider: "edge"              # "edge" | "elevenlabs" | "openai" | "neutts"
  edge:
    voice: "en-US-AriaNeural"   # 322 种语音，74 种语言
  elevenlabs:
    voice_id: "pNInz6obpgDQGcFmaJgB"
    model_id: "eleven_multilingual_v2"
  openai:
    model: "gpt-4o-mini-tts"
    voice: "alloy"              # alloy、echo、fable、onyx、nova、shimmer
    base_url: "https://api.openai.com/v1"  # 覆盖用于 OpenAI 兼容 TTS 端点
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
```

这同时控制 `text_to_speech` 工具和语音模式下的语音回复（CLI 中的 `/voice tts` 或消息网关）。

## 显示设置

```yaml
display:
  tool_progress: all      # off | new | all | verbose
  tool_progress_command: false  # 在消息网关中启用 /verbose 斜杠命令
  skin: default           # 内置或自定义 CLI 皮肤（参见 user-guide/features/skins）
  personality: "kawaii"  # 遗留 cosmetic 字段，在某些摘要中仍显示
  compact: false          # 紧凑输出模式（更少空白）
  resume_display: full    # full（恢复时显示之前消息）| minimal（仅一行）
  bell_on_complete: false # 代理完成时播放终端铃声（适合长时间任务）
  show_reasoning: false   # 在每个响应上方显示模型推理/思考（用 /reasoning show|hide 切换）
  streaming: false        # 将 token 流式传输到终端（实时输出）
  show_cost: false        # 在 CLI 状态栏显示估计的 $ 费用
  tool_preview_length: 0  # 工具调用预览的最大字符数（0 = 无限制，显示完整路径/命令）
```

| 模式 | 你看到的内容 |
|------|-------------|
| `off` | 静默——仅最终响应 |
| `new` | 仅当工具更改时显示工具指示器 |
| `all` | 每个工具调用及其简短预览（默认） |
| `verbose` | 完整参数、结果和调试日志 |

在 CLI 中，用 `/verbose` 循环切换这些模式。要在消息平台（Telegram、Discord、Slack 等）中使用 `/verbose`，在上面 `display` 部分设置 `tool_progress_command: true`。该命令然后循环模式并保存到配置。

## 隐私

```yaml
privacy:
  redact_pii: false  # 从 LLM 上下文中剥离 PII（仅网关）
```

当 `redact_pii` 为 `true` 时，网关在将个人可识别信息发送到 LLM 之前，在支持的平台上从系统提示中编辑这些信息：

| 字段 | 处理方式 |
|-------|-----------|
| 电话号码（WhatsApp/Signal 上的用户 ID） | 哈希为 `user_<12-char-sha256>` |
| 用户 ID | 哈希为 `user_<12-char-sha256>` |
| 聊天 ID | 数字部分哈希，保留平台前缀（`telegram:<hash>`） |
| 主频道 ID | 数字部分哈希 |
| 用户名 / 用户名称 | **不受影响**（用户选择，公开可见） |

**平台支持：** 编辑适用于 WhatsApp、Signal 和 Telegram。Discord 和 Slack 被排除，因为它们的提及系统（`<@user_id>`）需要在 LLM 上下文中使用真实 ID。

哈希是确定性的——同一用户始终映射到相同哈希，因此模型仍然可以区分群聊中的用户。路由和传递在内部使用原始值。

## 语音转文字（STT）

```yaml
stt:
  provider: "local"            # "local" | "groq" | "openai"
  local:
    model: "base"              # tiny、base、small、medium、large-v3
  openai:
    model: "whisper-1"         # whisper-1 | gpt-4o-mini-transcribe | gpt-4o-transcribe
  # model: "whisper-1"         # 遗留回退键仍被尊重
```

提供商行为：

- `local` 使用在你机器上运行的 `faster-whisper`。用 `pip install faster-whisper` 单独安装。
- `groq` 使用 Groq 的 Whisper 兼容端点并读取 `GROQ_API_KEY`。
- `openai` 使用 OpenAI 语音 API 并读取 `VOICE_TOOLS_OPENAI_KEY`。

如果请求的提供商不可用，Hermes 按此顺序自动回退：`local` → `groq` → `openai`。

Groq 和 OpenAI 模型覆盖由环境驱动：

```bash
STT_GROQ_MODEL=whisper-large-v3-turbo
STT_OPENAI_MODEL=whisper-1
GROQ_BASE_URL=https://api.groq.com/openai/v1
STT_OPENAI_BASE_URL=https://api.openai.com/v1
```

## 语音模式（CLI）

```yaml
voice:
  record_key: "ctrl+b"         # CLI 中的按键说话
  max_recording_seconds: 120    # 长录音的硬停止
  auto_tts: false               # 启用时 `/voice on` 自动启用语音回复
  silence_threshold: 200        # 语音检测的 RMS 阈值
  silence_duration: 3.0         # 自动停止前的静音秒数
```

在 CLI 中使用 `/voice on` 启用麦克风模式，用 `record_key` 开始/停止录制，用 `/voice tts` 切换语音回复。参见 [语音模式](/docs/user-guide/features/voice-mode) 了解端到端设置和平台特定行为。

## 流式传输

将 token 流式传输到终端或消息平台，而不是等待完整响应。

### CLI 流式传输

```yaml
display:
  streaming: true         # 将 token 实时流式传输到终端
  show_reasoning: true    # 也流式传输推理/思考 token（可选）
```

启用后，响应在流式框中逐 token 显示。工具调用仍被静默捕获。如果提供商不支持流式传输，它会自动回退到正常显示。

### 网关流式传输（Telegram、Discord、Slack）

```yaml
streaming:
  enabled: true           # 启用渐进式消息编辑
  transport: edit         # "edit"（渐进式消息编辑）或 "off"
  edit_interval: 0.3      # 消息编辑之间的秒数
  buffer_threshold: 40    # 强制刷新编辑前的字符数
  cursor: " ▉"            # 流式传输期间显示的光标
```

启用后，机器人在第一个 token 时发送消息，然后在更多 token 到达时逐步编辑。不支持消息编辑的平台（Signal、Email、Home Assistant）在首次尝试时自动检测——流式传输会为该会话被优雅禁用，不会产生大量消息。

**溢出处理：** 如果流式文本超过平台的消息长度限制（约 4096 字符），当前消息被最终确定，新消息自动开始。

:::note
流式传输默认禁用。在 `~/.hermes/config.yaml` 中启用它以尝试流式传输 UX。
:::

## 群聊会话隔离

控制共享聊天是保持每个房间一个对话还是每个参与者一个对话：

```yaml
group_sessions_per_user: true  # true = 在群/频道中按用户隔离，false = 每个聊天一个共享会话
```

- `true` 是默认和建议的设置。在 Discord 频道、Telegram 群、Slack 频道等共享上下文中，当平台提供用户 ID 时，每个发送者获得自己的会话。
- `false` 恢复为旧的共享房间行为。如果你明确希望 Hermes 将频道视为一个协作对话，这可能有用，但它也意味着用户共享上下文、token 费用和中断状态。
- 直接消息不受影响。Hermes 仍像往常一样按聊天/DM ID 键控。
- 线程无论如何都与父频道隔离；使用 `true` 时，每个参与者在线程内也有自己的会话。

关于行为详情和示例，参见 [会话](/docs/user-guide/sessions) 和 [Discord 指南](/docs/user-guide/messaging/discord)。

## 未授权 DM 行为

控制当未知用户发送直接消息时 Hermes 做什么：

```yaml
unauthorized_dm_behavior: pair

whatsapp:
  unauthorized_dm_behavior: ignore
```

- `pair` 是默认设置。Hermes 拒绝访问，但在 DM 中回复一次性配对码。
- `ignore` 静默丢弃未授权的 DM。
- 平台部分覆盖全局默认值，因此你可以在 Telegram 上保持配对启用，同时让 WhatsApp 更安静。

## 快速命令

定义在调用 LLM 之外即时运行 shell 命令的自定义命令——零 token 使用，即时执行。特别适用于消息平台（Telegram、Discord 等）进行快速服务器检查或实用脚本。

```yaml
quick_commands:
  status:
    type: exec
    command: systemctl status hermes-agent
  disk:
    type: exec
    command: df -h /
  update:
    type: exec
    command: cd ~/.hermes/hermes-agent && git pull && pip install -e .
  gpu:
    type: exec
    command: nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total --format=csv,noheader
```

使用：在 CLI 或任何消息平台中输入 `/status`、`/disk`、`/update` 或 `/gpu`。命令在主机上本地运行并直接返回输出——无 LLM 调用，无 token 消耗。

- **30 秒超时** — 长时间运行的命令被终止并显示错误消息
- **优先级** — 快速命令在技能命令之前检查，因此你可以覆盖技能名称
- **自动补全** — 快速命令在调度时解析，不显示在内置斜杠命令自动补全表中
- **类型** — 仅支持 `exec`（运行 shell 命令）；其他类型显示错误
- **随地工作** — CLI、Telegram、Discord、Slack、WhatsApp、Signal、Email、Home Assistant

## 人类延迟

在消息平台中模拟类人响应节奏：

```yaml
human_delay:
  mode: "off"                  # off | natural | custom
  min_ms: 800                  # 最小延迟（custom 模式）
  max_ms: 2500                 # 最大延迟（custom 模式）
```

## 代码执行

配置沙盒化 Python 代码执行工具：

```yaml
code_execution:
  timeout: 300                 # 最大执行时间秒数
  max_tool_calls: 50           # 代码执行内的最大工具调用
```

## Web 搜索后端

`web_search`、`web_extract` 和 `web_crawl` 工具支持四种后端提供商。在 `config.yaml` 或通过 `hermes tools` 配置后端：

```yaml
web:
  backend: firecrawl    # firecrawl | parallel | tavily | exa
```

| 后端 | Env Var | 搜索 | 提取 | 爬取 |
|---------|---------|--------|---------|---------|
| **Firecrawl**（默认） | `FIRECRAWL_API_KEY` | ✔ | ✔ | ✔ |
| **Parallel** | `PARALLEL_API_KEY` | ✔ | ✔ | — |
| **Tavily** | `TAVILY_API_KEY` | ✔ | ✔ | ✔ |
| **Exa** | `EXA_API_KEY` | ✔ | ✔ | — |

**后端选择：** 如果 `web.backend` 未设置，后端从可用 API key 自动检测。如果仅设置 `EXA_API_KEY`，使用 Exa。如果仅设置 `TAVILY_API_KEY`，使用 Tavily。如果仅设置 `PARALLEL_API_KEY`，使用 Parallel。否则 Firecrawl 是默认值。

**自托管 Firecrawl：** 设置 `FIRECRAWL_API_URL` 指向你自己的实例。设置自定义 URL 时，API key 变为可选（设置 `USE_DB_AUTHENTICATION=false` 在服务器上禁用认证）。

**Parallel 搜索模式：** 设置 `PARALLEL_SEARCH_MODE` 控制搜索行为——`fast`、`one-shot` 或 `agentic`（默认：`agentic`）。

## 浏览器

配置浏览器自动化行为：

```yaml
browser:
  inactivity_timeout: 120        # 自动关闭空闲会话前的秒数
  command_timeout: 30             # 浏览器命令的超时秒数（截图、导航等）
  record_sessions: false         # 自动将浏览器会话记录为 WebM 视频到 ~/.hermes/browser_recordings/
  camofox:
    managed_persistence: false   # 为 true 时，Camofox 会话在重启之间保留 cookie/登录
```

浏览器工具集支持多种提供商。参见 [浏览器功能页面](/docs/user-guide/features/browser) 了解 Browserbase、Browser Use 和本地 Chrome CDP 设置的详情。

## 时区

用 IANA 时区字符串覆盖服务器本地时区。影响日志、cron 调度和系统提示时间注入中的时间戳。

```yaml
timezone: "America/New_York"   # IANA 时区（默认："" = 服务器本地时间）
```

支持的值：任何 IANA 时区标识符（例如 `America/New_York`、`Europe/London`、`Asia/Kolkata`、`UTC`）。留空或省略为服务器本地时间。

## Discord

为消息网关配置 Discord 特定行为：

```yaml
discord:
  require_mention: true          # 在服务器频道中需要 @mention 才能响应
  free_response_channels: ""     # 机器人无需 @mention 即可响应的逗号分隔频道 ID 列表
  auto_thread: true              # 在频道中 @mention 时自动创建线程
```

- `require_mention` — 当 `true`（默认）时，机器人在服务器频道中仅在 @mention 时响应。DM 无需 mention 即可工作。
- `free_response_channels` — 逗号分隔的频道 ID 列表，机器人在其中无需 @mention 即可响应每个消息。
- `auto_thread` — 当 `true`（默认）时，频道中的 mention 自动为对话创建线程，保持频道整洁（类似于 Slack 线程）。

## 安全

预执行安全扫描和密钥编辑：

```yaml
security:
  redact_secrets: true           # 在工具输出和日志中自动检测和编辑 API key 模式
  tirith_enabled: true           # 启用 Tirith 安全扫描终端命令
  tirith_path: "tirith"          # tirith 二进制文件的路径（默认：PATH 中的 "tirith"）
  tirith_timeout: 5              # tirith 扫描前等待的秒数
  tirith_fail_open: true         # tirith 不可用时允许命令执行
  website_blocklist:             # 参见下面的网站黑名单部分
    enabled: false
    domains: []
    shared_files: []
```

- `redact_secrets` — 在工具输出进入对话上下文和日志之前，自动检测并编辑看起来像 API key、令牌和密码的模式。
- `tirith_enabled` — 当 `true` 时，终端命令在执行前由 [Tirith](https://github.com/StackGuardian/tirith) 扫描，以检测潜在危险操作。
- `tirith_path` — tirith 二进制文件的路径。如果 tirith 安装在非标准位置，设置此值。
- `tirith_timeout` — 等待 tirith 扫描的最大秒数。如果扫描超时，命令继续。
- `tirith_fail_open` — 当 `true`（默认）时，如果 tirith 不可用或失败，命令被允许执行。设置为 `false` 以在 tirith 无法验证时阻止命令。

## 网站黑名单

阻止特定域名被代理的网络和浏览器工具访问：

```yaml
security:
  website_blocklist:
    enabled: false               # 启用 URL 阻止（默认：false）
    domains:                     # 阻止的域名模式列表
      - "*.internal.company.com"
      - "admin.example.com"
      - "*.local"
    shared_files:                # 从外部文件加载额外规则
      - "/etc/hermes/blocked-sites.txt"
```

启用时，任何匹配阻止域名模式的 URL 都会在网络或浏览器工具执行之前被拒绝。这适用于 `web_search`、`web_extract`、`browser_navigate` 以及任何访问 URL 的工具。

域名规则支持：
- 精确域名：`admin.example.com`
- 通配符子域名：`*.internal.company.com`（阻止所有子域名）
- TLD 通配符：`*.local`

共享文件每行包含一个域名规则（空行和 `#` 注释被忽略）。缺失或不可读的文件记录警告但不禁用其他网络工具。

策略缓存 30 秒，因此配置更改很快生效而无需重启。

## 智能审批

控制 Hermes 如何处理潜在危险命令：

```yaml
approvals:
  mode: manual   # manual | smart | off
```

| 模式 | 行为 |
|------|-------------|
| `manual`（默认） | 在执行任何标记命令之前提示用户。在 CLI 中显示交互式批准对话框。在消息中，队列暂停批准请求。 |
| `smart` | 使用辅助 LLM 评估标记命令是否实际危险。低风险命令被自动批准并具有会话级持久性。真正危险的命令升级给用户。 |
| `off` | 跳过所有批准检查。等同于 `HERMES_YOLO_MODE=true`。**慎用。** |

智能模式对于减少批准疲劳特别有用——它让代理在安全操作上更自主地工作，同时仍能捕获真正具有破坏性的命令。

:::warning
设置 `approvals.mode: off` 会禁用终端命令的所有安全检查。仅在可信的沙盒环境中使用。
:::

## 检查点

在破坏性文件操作之前的自动文件系统快照。详见 [检查点和回滚](/docs/user-guide/checkpoints-and-rollback)。

```yaml
checkpoints:
  enabled: true                  # 启用自动检查点（也可：hermes --checkpoints）
  max_snapshots: 50              # 每个目录保留的最大检查点数
```

## 委托

为 delegate 工具配置子代理行为：

```yaml
delegation:
  # model: "google/gemini-3-flash-preview"  # 覆盖模型（空 = 继承父级）
  # provider: "openrouter"                  # 覆盖提供商（空 = 继承父级）
  # base_url: "http://localhost:1234/v1"    # 直接 OpenAI 兼容端点（优先于提供商）
  # api_key: "local-key"                    # base_url 的 API key（回退到 OPENAI_API_KEY）
```

**子代理提供商:模型覆盖：** 默认情况下，子代理继承父代理的提供商和模型。设置 `delegation.provider` 和 `delegation.model` 以将子代理路由到不同的提供商:模型对——例如，在你的主代理运行昂贵推理模型的同时，为狭义范围的子任务使用廉价/快速模型。

**直接端点覆盖：** 如果你想要明显的自定义端点路径，设置 `delegation.base_url`、`delegation.api_key` 和 `delegation.model`。这将子代理直接发送到那个 OpenAI 兼容端点，优先于 `delegation.provider`。如果省略 `delegation.api_key`，Hermes 仅回退到 `OPENAI_API_KEY`。

委托提供商使用与 CLI/网关启动相同的凭证解析。支持所有配置的提供商：`openrouter`、`nous`、`copilot`、`zai`、`kimi-coding`、`minimax`、`minimax-cn`。当设置提供商时，系统自动解析正确的 base URL、API key 和 API 模式——无需手动凭证连接。

**优先级：** `config` 中的 `delegation.base_url` → `config` 中的 `delegation.provider` → 父提供商（继承）。`config` 中的 `delegation.model` → 父模型（继承）。仅设置 `model` 而不设置 `provider` 只更改模型名称，同时保留父级的凭证（适用于在同一提供商（如 OpenRouter）内切换模型）。

## 澄清

配置澄清提示行为：

```yaml
clarify:
  timeout: 120                 # 等待用户澄清响应的秒数
```

## 上下文文件（SOUL.md、AGENTS.md）

Hermes 使用两种不同的上下文范围：

| 文件 | 目的 | 范围 |
|------|---------|---------|
| `SOUL.md` | **主要代理身份** — 定义代理是谁（系统提示槽位 #1） | `~/.hermes/SOUL.md` 或 `$HERMES_HOME/SOUL.md` |
| `.hermes.md` / `HERMES.md` | 项目特定指令（最高优先级） | 走到 git 根目录 |
| `AGENTS.md` | 项目特定指令、编码约定 | 递归目录遍历 |
| `CLAUDE.md` | Claude Code 上下文文件（也被检测到） | 仅工作目录 |
| `.cursorrules` | Cursor IDE 规则（也被检测到） | 仅工作目录 |
| `.cursor/rules/*.mdc` | Cursor 规则文件（也被检测到） | 仅工作目录 |

- **SOUL.md** 是代理的主要身份。它占据系统提示中的槽位 #1，完全替换内置默认身份。编辑它以完全自定义代理是谁。
- 如果 SOUL.md 缺失、空或无法加载，Hermes 回退到内置默认身份。
- **项目上下文文件使用优先级系统** — 只加载一种类型（首先匹配优先）：`.hermes.md` → `AGENTS.md` → `CLAUDE.md` → `.cursorrules`。SOUL.md 始终独立加载。
- **AGENTS.md** 是分层的：如果子目录也有 AGENTS.md，则全部合并。
- 如果不存在，Hermes 会自动种子默认 `SOUL.md`。
- 所有加载的上下文文件上限为 20,000 个字符，并进行智能截断。

另请参见：
- [人格与 SOUL.md](/docs/user-guide/features/personality)
- [上下文文件](/docs/user-guide/features/context-files)

## 工作目录

| 上下文 | 默认 |
|---------|---------|
| **CLI（`hermes`）** | 运行命令的当前目录 |
| **消息网关** | 主目录 `~`（用 `MESSAGING_CWD` 覆盖） |
| **Docker / Singularity / Modal / SSH** | 容器内或远程机器内的用户主目录 |

覆盖工作目录：
```bash
# 在 ~/.hermes/.env 或 ~/.hermes/config.yaml 中：
MESSAGING_CWD=/home/myuser/projects    # 网关会话
TERMINAL_CWD=/workspace                # 所有终端会话
```
