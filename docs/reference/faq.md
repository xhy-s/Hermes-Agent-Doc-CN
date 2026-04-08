---
sidebar_position: 3
title: "常见问题"
description: "Hermes Agent 常见问题及解决方案"
---

# 常见问题与故障排除

常见问题和 issue 的快速答案和修复。

---

## 常见问题

### Hermes 支持哪些 LLM providers？

Hermes Agent 可与任何 OpenAI 兼容 API 一起工作。支持的主要 providers 包括：

- **[OpenRouter](https://openrouter.ai/)** — 通过一个 API 密钥访问数百个模型（推荐用于灵活性）
- **Nous Portal** — Nous Research 自己的推理端点
- **OpenAI** — GPT-4o、o1、o3 等
- **Anthropic** — Claude 模型（通过 OpenRouter 或兼容代理）
- **Google** — Gemini 模型（通过 OpenRouter 或兼容代理）
- **z.ai / ZhipuAI** — GLM 模型
- **Kimi / Moonshot AI** — Kimi 模型
- **MiniMax** — 全球和中国端点
- **本地模型** — 通过 [Ollama](https://ollama.com/)、[vLLM](https://docs.vllm.ai/)、[llama.cpp](https://github.com/ggerganov/llama.cpp)、[SGLang](https://github.com/sgl-project/sglang) 或任何 OpenAI 兼容服务器

使用 `hermes model` 或编辑 `~/.hermes/.env` 来设置您的 provider。有关所有 provider 密钥，请参阅[环境变量](./environment-variables.md)参考。

### 它能在 Windows 上运行吗？

**不是原生运行。** Hermes Agent 需要类 Unix 环境。在 Windows 上，安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) 并在其中运行 Hermes。标准安装命令在 WSL2 中完美运行：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

### 我的数据会被发送到任何地方吗？

API 调用**仅发送到您配置的 LLM provider**（例如 OpenRouter、您的本地 Ollama 实例）。Hermes Agent 不收集遥测、使用数据或分析。您的对话、记忆和技能存储在本地 `~/.hermes/` 中。

### 我可以离线使用/使用本地模型吗？

可以。运行 `hermes model`，选择**自定义端点**，然后输入服务器的 URL：

```bash
hermes model
# 选择：自定义端点（手动输入 URL）
# API base URL: http://localhost:11434/v1
# API key: ollama
# Model name: qwen3.5:27b
# Context length: 32768   ← 设置为与服务器实际上下文窗口匹配
```

或直接在 `config.yaml` 中配置：

```yaml
model:
  default: qwen3.5:27b
  provider: custom
  base_url: http://localhost:11434/v1
```

Hermes 将端点、provider 和 base URL 持久化到 `config.yaml`，因此它会在重启后保留。如果您的本地服务器恰好加载了一个模型，`/model custom` 会自动检测它。您也可以在 config.yaml 中设置 `provider: custom` — 它是一等 provider，不是任何东西的别名。

这适用于 Ollama、vLLM、llama.cpp server、SGLang、LocalAI 等。请参阅[配置指南](../user-guide/configuration.md)了解更多详情。

:::tip Ollama 用户
如果您在 Ollama 中设置了自定义 `num_ctx`（例如 `ollama run --num_ctx 16384`），请确保在 Hermes 中设置匹配的上下文长度 — Ollama 的 `/api/show` 报告模型的*最大*上下文，而不是您配置的 effective `num_ctx`。
:::

### 它要花多少钱？

Hermes Agent 本身是**免费和开源的**（MIT 许可证）。您只需支付所选 provider 的 LLM API 使用费用。本地模型完全免费运行。

### 多人可以使用同一个实例吗？

可以。[消息网关](../user-guide/messaging/index.md)允许多个用户通过 Telegram、Discord、Slack、WhatsApp 或 Home Assistant 与同一个 Hermes Agent 实例交互。访问通过允许列表（特定用户 ID）和 DM 配对（第一个发送消息的用户声明访问权限）控制。

### 记忆和技能有什么区别？

- **记忆**存储**事实** — 代理了解的关于您、您的项目和偏好的事物。记忆根据相关性自动检索。
- **技能**存储**过程** — 如何做事情的分步说明。当代理遇到类似任务时召回技能。

两者都会跨会话持久化。请参阅[记忆](../user-guide/features/memory.md)和[技能](../user-guide/features/skills.md)了解更多详情。

### 我可以在自己的 Python 项目中使用它吗？

可以。导入 `AIAgent` 类并以编程方式使用 Hermes：

```python
from run_agent import AIAgent

agent = AIAgent(model="openrouter/nous/hermes-3-llama-3.1-70b")
response = agent.chat("Explain quantum computing briefly")
```

有关完整的 API 使用方法，请参阅 [Python 库指南](../user-guide/features/code-execution.md)。

---

## 故障排除

### 安装问题

#### 安装后 `hermes: command not found`

**原因：** 您的 shell 没有重新加载更新的 PATH。

**解决方案：**
```bash
# 重新加载您的 shell profile
source ~/.bashrc    # bash
source ~/.zshrc     # zsh

# 或者启动一个新的终端会话
```

如果仍然不起作用，请验证安装位置：
```bash
which hermes
ls ~/.local/bin/hermes
```

:::tip
安装程序将 `~/.local/bin` 添加到您的 PATH。如果您使用非标准 shell 配置，请手动添加 `export PATH="$HOME/.local/bin:$PATH"`。
:::

#### Python 版本太旧

**原因：** Hermes 需要 Python 3.11 或更高版本。

**解决方案：**
```bash
python3 --version   # 检查当前版本

# 安装更新版本的 Python
sudo apt install python3.12   # Ubuntu/Debian
brew install python@3.12      # macOS
```

安装程序会自动处理这个问题 — 如果在手动安装期间看到此错误，请先升级 Python。

#### `uv: command not found`

**原因：** `uv` 包管理器未安装或不在 PATH 中。

**解决方案：**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
```

#### 安装期间权限被拒绝

**原因：** 写入安装目录的权限不足。

**解决方案：**
```bash
# 不要使用 sudo 运行安装程序 — 它安装到 ~/.local/bin
# 如果之前用 sudo 安装过，请清理：
sudo rm /usr/local/bin/hermes
# 然后重新运行标准安装程序
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

---

### Provider 和模型问题

#### API 密钥不工作

**原因：** 密钥缺失、过期、设置错误或用于错误的 provider。

**解决方案：**
```bash
# 检查您的配置
hermes config show

# 重新配置您的 provider
hermes model

# 或直接设置
hermes config set OPENROUTER_API_KEY sk-or-v1-xxxxxxxxxxxx
```

:::warning
确保密钥与 provider 匹配。OpenAI 密钥不适用于 OpenRouter，反之亦然。检查 `~/.hermes/.env` 中是否有冲突条目。
:::

#### 模型不可用/模型未找到

**原因：** 模型标识符不正确或不在您的 provider 上可用。

**解决方案：**
```bash
# 列出您的 provider 的可用模型
hermes model

# 设置有效模型
hermes config set HERMES_MODEL openrouter/nous/hermes-3-llama-3.1-70b

# 或指定每个会话
hermes chat --model openrouter/meta-llama/llama-3.1-70b-instruct
```

#### 速率限制（429 错误）

**原因：** 您已超过 provider 的速率限制。

**解决方案：** 等待片刻然后重试。对于持续使用，请考虑：
- 升级您的 provider 计划
- 切换到不同的模型或 provider
- 使用 `hermes chat --provider <alternative>` 路由到不同的后端

#### 上下文长度超出

**原因：** 对话对于模型的上下文窗口来说太长，或者 Hermes 检测到您模型的上下文长度错误。

**解决方案：**
```bash
# 压缩当前会话
/compress

# 或者开始一个新会话
hermes chat

# 使用具有更大上下文窗口的模型
hermes chat --model openrouter/google/gemini-3-flash-preview
```

如果这发生在第一次长对话时，Hermes 可能对您的模型具有错误的上下文长度。检查它检测到的内容：

查看 CLI 启动行 — 它显示检测到的上下文长度（例如 `📊 Context limit: 128000 tokens`）。您也可以在会话期间使用 `/usage` 检查。

要修复上下文检测，请明确设置：

```yaml
# 在 ~/.hermes/config.yaml 中
model:
  default: your-model-name
  context_length: 131072  # 您模型的实际上下文窗口
```

或者对于自定义端点，按模型添加：

```yaml
custom_providers:
  - name: "My Server"
    base_url: "http://localhost:11434/v1"
    models:
      qwen3.5:27b:
        context_length: 32768
```

有关自动检测的工作原理以及所有覆盖选项，请参阅[上下文长度检测](../integrations/providers.md#context-length-detection)。

---

### 终端问题

#### 命令被阻止为危险命令

**原因：** Hermes 检测到潜在破坏性命令（例如 `rm -rf`、`DROP TABLE`）。这是一个安全功能。

**解决方案：** 提示时，查看命令并输入 `y` 批准。您也可以：
- 要求代理使用更安全的替代方案
- 在[安全文档](../user-guide/security.md)中查看危险模式的完整列表

:::tip
这是按预期工作的 — Hermes 永远不会静默运行破坏性命令。批准提示向您显示将要执行的确切内容。
:::

#### 通过消息网关 `sudo` 不工作

**原因：** 消息网关在没有交互式终端的情况下运行，因此 `sudo` 无法提示输入密码。

**解决方案：**
- 在消息传递中避免使用 `sudo` — 要求代理找到替代方案
- 如果必须使用 sudo，请在 `/etc/sudoers` 中为特定命令配置无密码 sudo
- 或者切换到终端界面进行管理任务：`hermes chat`

#### Docker 后端无法连接

**原因：** Docker 守护进程未运行或用户缺少权限。

**解决方案：**
```bash
# 检查 Docker 是否运行
docker info

# 将您的用户添加到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证
docker run hello-world
```

---

### 消息问题

#### Bot 不响应消息

**原因：** bot 未运行、未授权，或者您的用户不在允许列表中。

**解决方案：**
```bash
# 检查 gateway 是否运行
hermes gateway status

# 启动 gateway
hermes gateway start

# 检查日志中的错误
cat ~/.hermes/logs/gateway.log | tail -50
```

#### 消息未传递

**原因：** 网络问题、bot 令牌过期或平台 webhook 配置错误。

**解决方案：**
- 使用 `hermes gateway setup` 验证您的 bot 令牌是否有效
- 检查 gateway 日志：`cat ~/.hermes/logs/gateway.log | tail -50`
- 对于基于 webhook 的平台（Slack、WhatsApp），确保您的服务器可公开访问

#### 允许列表混淆 — 谁可以与 bot 交谈？

**原因：** 授权模式决定谁获得访问权限。

**解决方案：**

| 模式 | 工作原理 |
|------|-------------|
| **允许列表** | 仅允许列在 config 中的用户 ID 交互 |
| **DM 配对** | 第一个在 DM 中发送消息的用户声明独占访问权限 |
| **开放** | 任何人都可以交互（不推荐用于生产） |

在 `~/.hermes/config.yaml` 中您 gateway 的设置下配置。请参阅[消息文档](../user-guide/messaging/index.md)。

#### Gateway 无法启动

**原因：** 缺少依赖、端口冲突或令牌配置错误。

**解决方案：**
```bash
# 安装消息依赖
pip install "hermes-agent[telegram]"   # 或 [discord]、[slack]、[whatsapp]

# 检查端口冲突
lsof -i :8080

# 验证配置
hermes config show
```

#### macOS：Node.js / ffmpeg / 其他工具未通过 gateway 找到

**原因：** launchd 服务继承的 PATH（`/usr/bin:/bin:/usr/sbin:/sbin`）不包括 Homebrew、nvm、cargo 或其他用户安装的工具目录。这通常会破坏 WhatsApp bridge（`node not found`）或语音转录（`ffmpeg not found`）。

**解决方案：** Gateway 在您运行 `hermes gateway install` 时捕获您的 shell PATH。如果您在设置 gateway 后安装了工具，请重新运行安装以捕获更新的 PATH：

```bash
hermes gateway install    # 重新快照您当前的 PATH
hermes gateway start      # 检测更新的 plist 并重新加载
```

您可以验证 plist 是否具有正确的 PATH：
```bash
/usr/libexec/PlistBuddy -c "Print :EnvironmentVariables:PATH" \
  ~/Library/LaunchAgents/ai.hermes.gateway.plist
```

---

### 性能问题

#### 响应缓慢

**原因：** 大模型、远程 API 服务器或带有许多工具的繁重系统提示。

**解决方案：**
- 尝试更小/更快的模型：`hermes chat --model openrouter/meta-llama/llama-3.1-8b-instruct`
- 减少活动的工具集：`hermes chat -t "terminal"`
- 检查到 provider 的网络延迟
- 对于本地模型，确保您有足够的 GPU VRAM

#### Token 使用量高

**原因：** 长对话、冗长的系统提示或累积上下文的许多工具调用。

**解决方案：**
```bash
# 压缩对话以减少 token
/compress

# 检查会话 token 使用情况
/usage
```

:::tip
在长会话期间定期使用 `/compress`。它总结对话历史并显著减少 token 使用量，同时保留上下文。
:::

#### 会话变得太长

**原因：** 扩展对话累积消息和工具输出，接近上下文限制。

**解决方案：**
```bash
# 压缩当前会话（保留关键上下文）
/compress

# 开始新会话并引用旧会话
hermes chat

# 如果需要，稍后恢复特定会话
hermes chat --continue
```

---

### MCP 问题

#### MCP server 未连接

**原因：** 服务器二进制文件未找到、命令路径错误或缺少运行时。

**解决方案：**
```bash
# 确保 MCP 依赖已安装（标准安装已包含）
cd ~/.hermes/hermes-agent && uv pip install -e ".[mcp]"

# 对于基于 npm 的服务器，确保 Node.js 可用
node --version
npx --version

# 手动测试服务器
npx -y @modelcontextprotocol/server-filesystem /tmp
```

验证您的 `~/.hermes/config.yaml` MCP 配置：
```yaml
mcp_servers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
```

#### MCP server 中的工具未显示

**原因：** 服务器已启动但工具发现失败、工具被 config 过滤掉，或者服务器不支持您期望的 MCP 能力。

**解决方案：**
- 检查 gateway/agent 日志中的 MCP 连接错误
- 确保服务器响应 `tools/list` RPC 方法
- 审查该服务器下任何 `tools.include`、`tools.exclude`、`tools.resources`、`tools.prompts` 或 `enabled` 设置
- 请记住，资源/提示实用工具仅在会话实际支持这些能力时才注册
- 在更改配置后使用 `/reload-mcp`

```bash
# 验证 MCP servers 已配置
hermes config show | grep -A 12 mcp_servers

# 在配置更改后重启 Hermes 或重新加载 MCP
hermes chat
```

另请参阅：
- [MCP（模型上下文协议）](/docs/user-guide/features/mcp)
- [在 Hermes 中使用 MCP](/docs/guides/use-mcp-with-hermes)
- [MCP 配置参考](/docs/reference/mcp-config-reference)

#### MCP 超时错误

**原因：** MCP 服务器响应时间过长，或者在执行期间崩溃。

**解决方案：**
- 如果支持，在 MCP server 配置中增加超时
- 检查 MCP 服务器进程是否仍在运行
- 对于远程 HTTP MCP 服务器，检查网络连接

:::warning
如果 MCP 服务器在请求中间崩溃，Hermes 将报告超时。检查服务器自己的日志（不仅仅是 Hermes 日志）来诊断根本原因。
:::

---

## Profiles

### Profiles 与仅设置 HERMES_HOME 有什么不同？

Profiles 是 `HERMES_HOME` 之上的托管层。您*可以*在每个命令之前手动设置 `HERMES_HOME=/some/path`，但 profiles 为您处理所有连接：创建目录结构、生成 shell 别名（`hermes-work`）、在 `~/.hermes/active_profile` 中跟踪活动 profile，以及跨所有 profiles 自动同步技能更新。它们还与 tab 补全集成，因此您无需记住路径。

### 两个 profiles 可以共享同一个 bot 令牌吗？

不能。每个消息平台（Telegram、Discord 等）都需要对 bot 令牌的独占访问权限。如果两个 profiles 尝试同时使用同一个令牌，第二个 gateway 将无法连接。为每个 profile 创建单独的 bot — 对于 Telegram，请联系 [@BotFather](https://t.me/BotFather) 来制作额外的 bots。

### Profiles 共享记忆或会话吗？

不能。每个 profile 都有自己的记忆存储、会话数据库和技能目录。它们完全隔离。如果您想用现有的记忆和会话开始新 profile，请使用 `hermes profile create newname --clone-all` 来复制当前 profile 的所有内容。

### 运行 `hermes update` 时会发生什么？

`hermes update` 拉取最新代码并重新安装依赖**一次**（不是每个 profile 一次）。然后它自动将更新的技能同步到所有 profiles。您只需运行 `hermes update` 一次 — 它涵盖机器上的每个 profile。

### 我可以将 profile 移动到不同的机器吗？

可以。将 profile 导出为可移植存档，然后在另一台机器上导入：

```bash
# 在源机器上
hermes profile export work ./work-backup.tar.gz

# 将文件复制到目标机器，然后：
hermes profile import ./work-backup.tar.gz work
```

导入的 profile 将包含导出的所有 config、记忆、会话和技能。如果新机器设置不同，您可能需要更新路径或重新与 providers 认证。

### 我可以运行多少个 profiles？

没有硬性限制。每个 profile 只是 `~/.hermes/profiles/` 下的一个目录。实际限制取决于您的磁盘空间和系统可以处理多少并发 gateway（每个 gateway 是一个轻量级 Python 进程）。运行数十个 profiles 没问题；每个空闲 profile 不使用资源。

---

## 工作流和模式

### 为不同任务使用不同模型（多模型工作流）

**场景：** 您使用 GPT-5.4 作为日常驱动，但 Gemini 或 Grok 更好地撰写社交媒体内容。每次手动切换模型很繁琐。

**解决方案：委托配置。** Hermes 可以自动将子代理路由到不同的模型。在 `~/.hermes/config.yaml` 中设置：

```yaml
delegation:
  model: "google/gemini-3-flash-preview"   # 子代理使用此模型
  provider: "openrouter"                    # 子代理的 provider
```

现在当您告诉 Hermes "写一个关于 X 的 Twitter 帖子"并且它生成 `delegate_task` 子代理时，该子代理在 Gemini 上运行而不是您的主模型。您的主要对话保持在 GPT-5.4 上。

您也可以在提示中明确说明：*"委托一个任务来撰写关于我们产品发布的社交媒体帖子。让您的子代理进行实际写作。"* 代理将使用 `delegate_task`，它自动拾取委托配置。

对于一次性模型切换而不委托，请在 CLI 中使用 `/model`：

```bash
/model google/gemini-3-flash-preview    # 为此会话切换
# ... 写您的内容 ...
/model openai/gpt-5.4                   # 切换回来
```

有关委托工作原理的更多信息，请参阅[子代理委托](../user-guide/features/delegation.md)。

### 在一个 WhatsApp 号码上运行多个代理（per-chat 绑定）

**场景：** 在 OpenClaw 中，您有多个绑定到特定 WhatsApp 聊天的独立代理 — 一个用于家庭购物清单群组，另一个用于您的私人聊天。Hermes 可以这样做吗？

**当前限制：** Hermes profiles 各自需要自己的 WhatsApp 号码/会话。您无法将多个 profiles 绑定到同一 WhatsApp 号码上的不同聊天 — WhatsApp bridge（Baileys）每个号码使用一个经过认证的会话。

**变通方法：**

1. **使用带有 personality 切换的单一 profile。** 创建不同的 `AGENTS.md` 上下文文件或使用 `/personality` 命令来更改每个聊天的行为。代理可以看到它在哪个聊天中，并且可以适应。

2. **使用 cron 任务进行专门任务。** 对于购物清单跟踪器，设置一个 cron 任务来监视特定聊天并管理列表 — 不需要单独的代理。

3. **使用单独的号码。** 如果您需要真正独立的代理，请为每个 profile 配对自己的 WhatsApp 号码。来自 Google Voice 等服务的虚拟号码适用于此。

4. **改用 Telegram 或 Discord。** 这些平台更自然地支持 per-chat 绑定 — 每个 Telegram 组或 Discord 频道都有自己的会话，您可以在一 个账户上运行多个 bot 令牌（每个 profile 一个）。

请参阅 [Profiles](../user-guide/profiles.md) 和 [WhatsApp 设置](../user-guide/messaging/whatsapp.md) 了解更多详情。

### 控制 Telegram 中显示的内容（隐藏日志和推理）

**场景：** 您在 Telegram 中看到 gateway exec 日志、Hermes 推理和工具调用详情，而不是仅仅最终输出。

**解决方案：** config.yaml 中的 `display.tool_progress` 设置控制显示多少工具活动：

```yaml
display:
  tool_progress: "off"   # 选项：off、new、all、verbose
```

- **`off`** — 仅最终响应。无工具调用、无推理、无日志。
- **`new`** — 显示新工具调用（简短的 one-liners）。
- **`all`** — 显示所有工具活动包括结果。
- **`verbose`** — 完全详细信息包括工具参数和输出。

对于消息平台，`off` 或 `new` 通常是您想要的。编辑 `config.yaml` 后，重启 gateway 以使更改生效。

您也可以使用 `/verbose` 命令（如果启用）按会话切换：

```yaml
display:
  tool_progress_command: true   # 在 gateway 中启用 /verbose
```

### 在 Telegram 上管理技能（斜杠命令限制）

**场景：** Telegram 有 100 个斜杠命令限制，您的技能正在超过它。您想禁用 Telegram 上不需要的技能，但 `hermes skills config` 设置似乎不生效。

**解决方案：** 使用 `hermes skills config` 按平台禁用技能。这会写入 `config.yaml`：

```yaml
skills:
  disabled: []                    # 全局禁用的技能
  platform_disabled:
    telegram: [skill-a, skill-b]  # 仅在 telegram 上禁用
```

更改后，**重启 gateway**（`hermes gateway restart` 或 kill 并重新启动）。Telegram bot 命令菜单在启动时重新构建。

:::tip
具有非常长描述的技能在 Telegram 菜单中被截断为 40 个字符以保持有效负载大小限制。如果技能没有出现，可能是总有效负载大小问题而不是 100 个命令计数限制 — 禁用未使用的技能有助于两者。
:::

### 共享线程会话（多个用户，一个对话）

**场景：** 您有一个 Telegram 或 Discord 线程，多个人提及 bot。您希望该线程中的所有提及都是一个共享对话，而不是每个用户单独的会话。

**当前行为：** Hermes 在大多数平台上创建按用户 ID 键控的会话，因此每个人都有自己的对话上下文。这是出于隐私和上下文隔离的设计。

**变通方法：**

1. **使用 Slack。** Slack 会话按线程键控，而不是按用户。同一线程中的多个用户共享一个对话 — 这正是您描述的行为。这是最自然的选择。

2. **使用带有单个用户的群组聊天。** 如果一个人是指定的"操作员"来传递问题，会话保持统一。其他人可以阅读。

3. **使用 Discord 频道。** Discord 会话按频道键控，因此同一频道中的所有用户共享上下文。使用专用频道进行共享对话。

### 导出 Hermes 到另一台机器

**场景：** 您在一台机器上构建了技能、cron 任务和记忆，并希望将所有内容移动到新的专用 Linux 机器。

**解决方案：**

1. 在新机器上安装 Hermes Agent：
   ```bash
   curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
   ```

2. 复制您的整个 `~/.hermes/` 目录**除了** `hermes-agent` 子目录（那是代码 repo — 新安装有自己的）：
   ```bash
   # 在源机器上
   rsync -av --exclude='hermes-agent' ~/.hermes/ newmachine:~/.hermes/
   ```

   或者使用 profile 导出/导入：
   ```bash
   # 在源机器上
   hermes profile export default ./hermes-backup.tar.gz

   # 在目标机器上
   hermes profile import ./hermes-backup.tar.gz default
   ```

3. 在新机器上，运行 `hermes setup` 来验证 API 密钥和 provider 配置是否正常工作。重新与消息平台认证（尤其是 WhatsApp，它使用 QR 配对）。

`~/.hermes/` 目录包含所有内容：`config.yaml`、`.env`、`SOUL.md`、`memories/`、`skills/`、`state.db`（会话）、`cron/` 以及任何自定义插件。代码本身位于 `~/.hermes/hermes-agent/` 中，是全新安装的。

### 安装后重新加载 shell 时权限被拒绝

**场景：** 运行 Hermes 安装程序后，`source ~/.zshrc` 给出权限被拒绝错误。

**原因：** 这通常发生在 `~/.zshrc`（或 `~/.bashrc`）具有不正确文件权限时，或者安装程序无法干净地写入它时。这不是 Hermes 特定的问题 — 这是 shell 配置权限问题。

**解决方案：**
```bash
# 检查权限
ls -la ~/.zshrc

# 如有需要修复（应该是 -rw-r--r-- 或 644）
chmod 644 ~/.zshrc

# 然后重新加载
source ~/.zshrc

# 或者只需打开一个新的终端窗口 — 它自动拾取 PATH 更改
```

如果安装程序添加了 PATH 行但权限错误，您可以手动添加：
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

### 第一次代理运行时错误 400

**场景：** 设置顺利完成，但第一次聊天尝试失败，HTTP 400。

**原因：** 通常是模型名称不匹配 — 配置的模型在您的 provider 上不存在，或者 API 密钥无权访问它。

**解决方案：**
```bash
# 检查配置了哪些模型和 provider
hermes config show | head -20

# 重新运行模型选择
hermes model

# 或者用已知良好的模型测试
hermes chat -q "hello" --model anthropic/claude-sonnet-4.6
```

如果使用 OpenRouter，请确保您的 API 密钥有积分。来自 OpenRouter 的 400 通常意味着模型需要付费计划或模型 ID 有拼写错误。

---

## 仍然卡住？

如果您的问题不在此处：

1. **搜索现有问题：** [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
2. **询问社区：** [Nous Research Discord](https://discord.gg/nousresearch)
3. **提交错误报告：** 包含您的操作系统、Python 版本（`python3 --version`）、Hermes 版本（`hermes --version`）和完整错误消息
