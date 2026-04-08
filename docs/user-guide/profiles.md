---
sidebar_position: 2
---

# Profiles：运行多个代理

在同一台机器上运行多个独立的 Hermes 代理——每个都有自己的配置、API key、记忆、会话、技能和网关。

## 什么是 profile？

profile 是一个完全隔离的 Hermes 环境。每个 profile 都有自己的目录，包含自己的 `config.yaml`、`.env`、`SOUL.md`、记忆、会话、技能、cron 任务和状态数据库。Profile 让你可以为不同目的运行独立的代理——一个编程助手、一个私人机器人、一个研究代理——而不会相互污染。

当你创建一个 profile 时，它会自动成为自己的命令。创建一个名为 `coder` 的 profile，你立即拥有 `coder chat`、`coder setup`、`coder gateway start` 等。

## 快速开始

```bash
hermes profile create coder       # 创建 profile + "coder" 命令别名
coder setup                       # 配置 API key 和模型
coder chat                        # 开始聊天
```

就这样。`coder` 现在是一个完全独立的代理。它有自己的配置、自己的记忆、自己的所有东西。

## 创建一个 profile

### 空白 profile

```bash
hermes profile create mybot
```

创建一个带有捆绑技能种子的全新 profile。运行 `mybot setup` 配置 API key、模型和网关令牌。

### 仅克隆配置（`--clone`）

```bash
hermes profile create work --clone
```

将你当前 profile 的 `config.yaml`、`.env` 和 `SOUL.md` 复制到新 profile。相同的 API key 和模型，但全新的会话和记忆。编辑 `~/.hermes/profiles/work/.env` 使用不同的 API key，或编辑 `~/.hermes/profiles/work/SOUL.md` 使用不同的人格。

### 克隆一切（`--clone-all`）

```bash
hermes profile create backup --clone-all
```

复制**所有内容**——配置、API key、人格、所有记忆、完整会话历史、技能、cron 任务、插件。一个完整的快照。可用于备份或 fork 已经有关联的代理。

### 从特定 profile 克隆

```bash
hermes profile create work --clone --clone-from coder
```

:::tip Honcho 记忆 + profiles
当 Honcho 启用时，`--clone` 自动为新 profile 创建专用 AI peer，同时共享相同的用户工作区。每个 profile 构建自己的观察和身份。详见 [Honcho -- 多代理 / Profiles](./features/memory-providers.md#honcho)。
:::

## 使用 profiles

### 命令别名

每个 profile 都在 `~/.local/bin/<name>` 自动获得一个命令别名：

```bash
coder chat                    # 与 coder 代理聊天
coder setup                   # 配置 coder 的设置
coder gateway start           # 启动 coder 的网关
coder doctor                  # 检查 coder 的健康状态
coder skills list             # 列出 coder 的技能
coder config set model.model anthropic/claude-sonnet-4
```

别名适用于每个 hermes 子命令——它只是 `hermes -p <name>` 的包装。

### `-p` 标志

你也可以用任何命令显式定位 profile：

```bash
hermes -p coder chat
hermes --profile=coder doctor
hermes chat -p coder -q "hello"    # 可以在任意位置工作
```

### 粘性默认（`hermes profile use`）

```bash
hermes profile use coder
hermes chat                   # 现在指向 coder
hermes tools                  # 配置 coder 的工具
hermes profile use default    # 切换回来
```

设置一个默认，这样普通的 `hermes` 命令就指向那个 profile。像 `kubectl config use-context`。

### 了解你所在的位置

CLI 始终显示哪个 profile 处于活动状态：

- **提示符**：`coder ❯` 而不是 `❯`
- **横幅**：启动时显示 `Profile: coder`
- **`hermes profile`**：显示当前 profile 名称、路径、模型、网关状态

## 运行网关

每个 profile 作为具有自己机器人令牌的独立进程运行自己的网关：

```bash
coder gateway start           # 启动 coder 的网关
assistant gateway start       # 启动 assistant 的网关（独立进程）
```

### 不同的机器人令牌

每个 profile 有自己的 `.env` 文件。在每个中配置不同的 Telegram/Discord/Slack 机器人令牌：

```bash
# 编辑 coder 的令牌
nano ~/.hermes/profiles/coder/.env

# 编辑 assistant 的令牌
nano ~/.hermes/profiles/assistant/.env
```

### 安全：令牌锁

如果两个 profile 意外使用相同的机器人令牌，第二个网关将被阻止，并显示明确指出冲突 profile 的错误。支持 Telegram、Discord、Slack、WhatsApp 和 Signal。

### 持久化服务

```bash
coder gateway install         # 创建 hermes-gateway-coder systemd/launchd 服务
assistant gateway install     # 创建 hermes-gateway-assistant 服务
```

每个 profile 获得自己的服务名称。它们独立运行。

## 配置 profiles

每个 profile 有自己的：

- **`config.yaml`** — 模型、提供商、工具集、所有设置
- **`.env`** — API key、机器人令牌
- **`SOUL.md`** — 人格和指令

```bash
coder config set model.model anthropic/claude-sonnet-4
echo "You are a focused coding assistant." > ~/.hermes/profiles/coder/SOUL.md
```

## 更新

`hermes update` 拉取代码一次（共享）并自动将新捆绑技能同步到**所有** profile：

```bash
hermes update
# → 代码已更新（12 个提交）
# → 技能已同步：default（最新）、coder（+2 新）、assistant（+2 新）
```

用户修改的技能永远不会被覆盖。

## 管理 profiles

```bash
hermes profile list           # 显示所有 profiles 及状态
hermes profile show coder     # 显示一个 profile 的详细信息
hermes profile rename coder dev-bot   # 重命名（更新别名 + 服务）
hermes profile export coder   # 导出为 coder.tar.gz
hermes profile import coder.tar.gz   # 从归档导入
```

## 删除一个 profile

```bash
hermes profile delete coder
```

这会停止网关，移除 systemd/launchd 服务，移除命令别名，并删除所有 profile 数据。你会被要求输入 profile 名称以确认。

使用 `--yes` 跳过确认：`hermes profile delete coder --yes`

:::note
你无法删除默认 profile（`~/.hermes`）。要删除所有内容，使用 `hermes uninstall`。
:::

## 标签完成

```bash
# Bash
eval "$(hermes completion bash)"

# Zsh
eval "$(hermes completion zsh)"
```

将行添加到你的 `~/.bashrc` 或 `~/.zshrc` 以持久化完成。在 `-p` 之后、profile 子命令和顶级命令之后补全 profile 名称。

## 工作原理

Profile 使用 `HERMES_HOME` 环境变量。当你运行 `coder chat` 时，包装脚本在启动 hermes 之前设置 `HERMES_HOME=~/.hermes/profiles/coder`。由于代码库中 119+ 个文件通过 `get_hermes_home()` 解析路径，一切都会自动作用域到 profile 的目录——配置、会话、记忆、技能、状态数据库、网关 PID、日志和 cron 任务。

默认 profile 就是 `~/.hermes` 本身。无需迁移——现有安装以相同方式工作。
