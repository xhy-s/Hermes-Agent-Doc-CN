---
sidebar_position: 2
title: "安装指南"
description: "在 Linux、macOS 或 WSL2 上安装 Hermes Agent"
---

# 安装指南

使用一行安装程序在两分钟内启动 Hermes Agent，或按照手动步骤进行以获得完全控制。

## 快速安装

### Linux / macOS / WSL2

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

:::warning Windows
原生 Windows 不支持。请安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) 并从中运行 Hermes Agent。上面的安装命令可以在 WSL2 中运行。
:::

### 安装程序做了什么

安装程序自动处理一切——所有依赖项（Python、Node.js、ripgrep、ffmpeg）、仓库克隆、虚拟环境、全局 `hermes` 命令设置以及 LLM 提供商配置。完成后，你就可以开始聊天了。

### 安装之后

重新加载 shell 并开始聊天：

```bash
source ~/.bashrc   # 或者：source ~/.zshrc
hermes             # 开始聊天！
```

之后如需重新配置各个设置，使用以下命令：

```bash
hermes model          # 选择你的 LLM 提供商和模型
hermes tools          # 配置哪些工具已启用
hermes gateway setup  # 设置消息平台
hermes config set     # 设置单个配置值
hermes setup          # 或者运行完整设置向导一次性配置所有内容
```

---

## 前置要求

唯一的前提是 **Git**。安装程序自动处理其他一切：

- **uv**（快速的 Python 包管理器）
- **Python 3.11**（通过 uv，无需 sudo）
- **Node.js v22**（用于浏览器自动化和 WhatsApp 桥接）
- **ripgrep**（快速文件搜索）
- **ffmpeg**（TTS 音频格式转换）

:::info
你不需要手动安装 Python、Node.js、ripgrep 或 ffmpeg。安装程序检测缺少的内容并为你安装。只需确保 `git` 可用（`git --version`）。
:::

:::tip Nix 用户
如果你使用 Nix（NixOS、macOS 或 Linux），有专用的设置路径，包含 Nix flake、声明式 NixOS 模块和可选容器模式。详见 **[Nix 和 NixOS 设置](./nix-setup.md)** 指南。
:::

---

## 手动安装

如果你更喜欢完全控制安装过程，请按照以下步骤操作。

### 步骤 1：克隆仓库

使用 `--recurse-submodules` 克隆以获取所需的子模块：

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
```

如果你已经克隆但没有 `--recurse-submodules`：
```bash
git submodule update --init --recursive
```

### 步骤 2：安装 uv 并创建虚拟环境

```bash
# 安装 uv（如果尚未安装）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 使用 Python 3.11 创建 venv（uv 会下载它——无需 sudo）
uv venv venv --python 3.11
```

:::tip
你不需要激活 venv 来使用 `hermes`。入口点有一个硬编码的 shebang 指向 venv Python，因此一旦创建符号链接，它就能全局工作。
:::

### 步骤 3：安装 Python 依赖

```bash
# 告诉 uv 要安装到哪个 venv
export VIRTUAL_ENV="$(pwd)/venv"

# 安装所有额外依赖
uv pip install -e ".[all]"
```

如果你只需要核心代理（不支持 Telegram/Discord/cron）：
```bash
uv pip install -e "."
```

<details>
<summary><strong>可选额外依赖详解</strong></summary>

| Extra | 包含内容 | 安装命令 |
|-------|-------------|-----------------|
| `all` | 以下所有 | `uv pip install -e ".[all]"` |
| `messaging` | Telegram 和 Discord 网关 | `uv pip install -e ".[messaging]"` |
| `cron` | 计划任务的 Cron 表达式解析 | `uv pip install -e ".[cron]"` |
| `cli` | 设置向导的终端菜单 UI | `uv pip install -e ".[cli]"` |
| `modal` | Modal 云执行后端 | `uv pip install -e ".[modal]"` |
| `tts-premium` | ElevenLabs 高级语音 | `uv pip install -e ".[tts-premium]"` |
| `voice` | CLI 麦克风输入 + 音频播放 | `uv pip install -e ".[voice]"` |
| `pty` | PTY 终端支持 | `uv pip install -e ".[pty]"` |
| `honcho` | AI 原生记忆（Honcho 集成） | `uv pip install -e ".[honcho]"` |
| `mcp` | 模型上下文协议支持 | `uv pip install -e ".[mcp]"` |
| `homeassistant` | Home Assistant 集成 | `uv pip install -e ".[homeassistant]"` |
| `acp` | ACP 编辑器集成支持 | `uv pip install -e ".[acp]"` |
| `slack` | Slack 消息 | `uv pip install -e ".[slack]"` |
| `dev` | pytest 和测试工具 | `uv pip install -e ".[dev]"` |

你可以组合额外依赖：`uv pip install -e ".[messaging,cron]"`

</details>

### 步骤 4：安装可选子模块（如需要）

```bash
# RL 训练后端（可选）
uv pip install -e "./tinker-atropos"
```

两者都是可选的——如果你跳过它们，相应的工具集只是不可用。

### 步骤 5：安装 Node.js 依赖（可选）

仅在需要**浏览器自动化**（Browserbase 驱动）和 **WhatsApp 桥接**时需要：

```bash
npm install
```

### 步骤 6：创建配置目录

```bash
# 创建目录结构
mkdir -p ~/.hermes/{cron,sessions,logs,memories,skills,pairing,hooks,image_cache,audio_cache,whatsapp/session}

# 复制示例配置文件
cp cli-config.yaml.example ~/.hermes/config.yaml

# 创建空的 .env 文件用于存储 API key
touch ~/.hermes/.env
```

### 步骤 7：添加你的 API Key

打开 `~/.hermes/.env` 并至少添加一个 LLM 提供商 key：

```bash
# 必填——至少一个 LLM 提供商：
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# 可选——启用额外工具：
FIRECRAWL_API_KEY=fc-your-key          # 网络搜索和抓取（或自托管，详见文档）
FAL_KEY=your-fal-key                   # 图像生成（FLUX）
```

或通过 CLI 设置：
```bash
hermes config set OPENROUTER_API_KEY sk-or-v1-your-key-here
```

### 步骤 8：将 `hermes` 添加到 PATH

```bash
mkdir -p ~/.local/bin
ln -sf "$(pwd)/venv/bin/hermes" ~/.local/bin/hermes
```

如果 `~/.local/bin` 不在你的 PATH 中，将其添加到 shell 配置：

```bash
# Bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc

# Zsh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc

# Fish
fish_add_path $HOME/.local/bin
```

### 步骤 9：配置你的提供商

```bash
hermes model       # 选择你的 LLM 提供商和模型
```

### 步骤 10：验证安装

```bash
hermes version    # 检查命令是否可用
hermes doctor     # 运行诊断以验证一切正常
hermes status     # 检查你的配置
hermes chat -q "Hello! What tools do you have available?"
```

---

## 快速参考：手动安装（精简版）

对于只需要命令的人：

```bash
# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 克隆并进入
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent

# 使用 Python 3.11 创建 venv
uv venv venv --python 3.11
export VIRTUAL_ENV="$(pwd)/venv"

# 安装所有内容
uv pip install -e ".[all]"
uv pip install -e "./tinker-atropos"
npm install  # 可选，用于浏览器工具和 WhatsApp

# 配置
mkdir -p ~/.hermes/{cron,sessions,logs,memories,skills,pairing,hooks,image_cache,audio_cache,whatsapp/session}
cp cli-config.yaml.example ~/.hermes/config.yaml
touch ~/.hermes/.env
echo 'OPENROUTER_API_KEY=sk-or-v1-your-key' >> ~/.hermes/.env

# 使 hermes 全局可用
mkdir -p ~/.local/bin
ln -sf "$(pwd)/venv/bin/hermes" ~/.local/bin/hermes

# 验证
hermes doctor
hermes
```

---

## 故障排除

| 问题 | 解决方案 |
|---------|----------|
| `hermes: command not found` | 重新加载 shell（`source ~/.bashrc`）或检查 PATH |
| `API key not set` | 运行 `hermes model` 配置你的提供商，或 `hermes config set OPENROUTER_API_KEY your_key` |
| 更新后配置缺失 | 运行 `hermes config check` 然后 `hermes config migrate` |

如需更多诊断，运行 `hermes doctor`——它会准确告诉你缺少什么以及如何修复。
