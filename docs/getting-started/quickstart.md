---
sidebar_position: 1
title: "快速入门"
description: "从安装到聊天的 2 分钟指南——你的第一次 Hermes Agent 对话"
---

# 快速入门

本指南将引导你完成安装 Hermes Agent、设置提供商并进行第一次对话。到最后，你将了解关键功能以及如何进一步探索。

## 1. 安装 Hermes Agent

运行一行安装命令：

```bash
# Linux / macOS / WSL2
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

:::tip Windows 用户
先安装 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)，然后在 WSL2 终端中运行上面的命令。
:::

安装完成后，重新加载你的 shell：

```bash
source ~/.bashrc   # 或者 source ~/.zshrc
```

## 2. 设置提供商

安装程序会自动配置你的 LLM 提供商。之后如需更改，使用以下命令之一：

```bash
hermes model       # 选择你的 LLM 提供商和模型
hermes tools       # 配置哪些工具已启用
hermes setup       # 或者一次性配置所有内容
```

`hermes model` 会引导你选择推理提供商：

| 提供商 | 是什么 | 如何设置 |
|----------|-----------|---------------|
| **Nous Portal** | 订阅制，零配置 | 通过 `hermes model` 进行 OAuth 登录 |
| **OpenAI Codex** | ChatGPT OAuth，使用 Codex 模型 | 通过 `hermes model` 进行设备代码认证 |
| **Anthropic** | 直接使用 Claude 模型（Pro/Max 或 API key） | 使用 Claude Code 认证的 `hermes model`，或使用 Anthropic API key |
| **OpenRouter** | 跨多种模型的多元提供商路由 | 输入你的 API key |
| **Z.AI** | GLM / 智谱托管模型 | 设置 `GLM_API_KEY` / `ZAI_API_KEY` |
| **Kimi / Moonshot** | Moonshot 托管的编码和聊天模型 | 设置 `KIMI_API_KEY` |
| **MiniMax** | 国际 MiniMax 端点 | 设置 `MINIMAX_API_KEY` |
| **MiniMax China** | 中国区 MiniMax 端点 | 设置 `MINIMAX_CN_API_KEY` |
| **Alibaba Cloud** | 通过 DashScope 的 Qwen 模型 | 设置 `DASHSCOPE_API_KEY` |
| **Hugging Face** | 通过统一路由器访问 20+ 开放模型（Qwen、DeepSeek、Kimi 等） | 设置 `HF_TOKEN` |
| **Kilo Code** | KiloCode 托管的模型 | 设置 `KILOCODE_API_KEY` |
| **OpenCode Zen** | 按需访问精选模型 | 设置 `OPENCODE_ZEN_API_KEY` |
| **OpenCode Go** | 每月 10 美元订阅开放模型 | 设置 `OPENCODE_GO_API_KEY` |
| **DeepSeek** | 直接访问 DeepSeek API | 设置 `DEEPSEEK_API_KEY` |
| **GitHub Copilot** | GitHub Copilot 订阅（GPT-5.x、Claude、Gemini 等） | 通过 `hermes model` 进行 OAuth，或设置 `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` |
| **GitHub Copilot ACP** | Copilot ACP 代理后端（生成本地 `copilot` CLI） | `hermes model`（需要 `copilot` CLI + `copilot login`） |
| **Vercel AI Gateway** | Vercel AI Gateway 路由 | 设置 `AI_GATEWAY_API_KEY` |
| **自定义端点** | VLLM、SGLang、Ollama 或任何 OpenAI 兼容 API | 设置 base URL + API key |

:::tip
你可以随时通过 `hermes model` 切换提供商——无需代码更改，没有锁定。当配置自定义端点时，Hermes 会提示输入上下文窗口大小，并在可能时自动检测。详见 [上下文长度检测](../integrations/providers.md#context-length-detection)。
:::

## 3. 开始聊天

```bash
hermes
```

就这样！你将看到一个欢迎横幅，显示你的模型、可用的工具和已安装的技能。输入消息并按回车。

```
❯ What can you help me with?
```

代理可以访问网络搜索、文件操作、终端命令等工具——开箱即用。

## 4. 尝试关键功能

### 让它使用终端

```
❯ 我的磁盘使用情况如何？显示最大的 5 个目录。
```

代理将代表你运行终端命令并显示结果。

### 使用斜杠命令

输入 `/` 查看所有命令的自动完成下拉列表：

| 命令 | 功能 |
|--------|-------------|
| `/help` | 显示所有可用命令 |
| `/tools` | 列出可用工具 |
| `/model` | 显示或切换当前模型 |
| `/personality pirate` | 尝试一个有趣的人格 |
| `/save` | 保存对话 |

### 多行输入

按 `Alt+Enter` 或 `Ctrl+J` 添加新行。非常适合粘贴代码或编写详细提示。

### 中断代理

如果代理花费时间太长，只需输入新消息并按回车——它会中断当前任务并切换到你的新指示。`Ctrl+C` 也可以。

### 恢复会话

退出时，hermes 会打印恢复命令：

```bash
hermes --continue    # 恢复最近的会话
hermes -c            # 简短形式
```

## 5. 进一步探索

以下是接下来可以尝试的一些内容：

### 设置沙盒终端

为了安全起见，在 Docker 容器或远程服务器上运行代理：

```bash
hermes config set terminal.backend docker    # Docker 隔离
hermes config set terminal.backend ssh       # 远程服务器
```

### 连接消息平台

通过 Telegram、Discord、Slack、WhatsApp、Signal、Email 或 Home Assistant 从手机或其他界面与 Hermes 聊天：

```bash
hermes gateway setup    # 交互式平台配置
```

### 添加语音模式

想在 CLI 中使用麦克风输入或在消息中收到语音回复吗？

```bash
pip install "hermes-agent[voice]"

# 可选但推荐用于免费本地语音转文字
pip install faster-whisper
```

然后启动 Hermes 并在 CLI 中启用：

```text
/voice on
```

按 `Ctrl+B` 录制，或使用 `/voice tts` 让 Hermes 说出回复。详见 [语音模式](../user-guide/features/voice-mode.md)，了解跨 CLI、Telegram、Discord 和 Discord 语音频道的完整设置。

### 计划自动化任务

```
❯ 每天早上 9 点检查 Hacker News 上的 AI 新闻并在 Telegram 上给我发送摘要。
```

代理将设置一个通过网关自动运行的 cron 任务。

### 浏览和安装技能

```bash
hermes skills search kubernetes
hermes skills search react --source skills-sh
hermes skills search https://mintlify.com/docs --source well-known
hermes skills install openai/skills/k8s
hermes skills install official/security/1password
hermes skills install skills-sh/vercel-labs/json-render/json-render-react --force
```

提示：
- 使用 `--source skills-sh` 搜索公共 `skills.sh` 目录。
- 使用 `--source well-known` 加文档/网站 URL 从 `/.well-known/skills/index.json` 发现技能。
- 仅在审查第三方技能后才使用 `--force`。它可以覆盖非危险策略块，但不能覆盖危险扫描裁决。

或者在聊天中使用 `/skills` 斜杠命令。

### 通过 ACP 在编辑器中使用 Hermes

Hermes 还可以作为 ACP 服务器，为 ACP 兼容的编辑器（如 VS Code、Zed 和 JetBrains）运行：

```bash
pip install -e '.[acp]'
hermes acp
```

详见 [ACP 编辑器集成](../user-guide/features/acp.md) 的设置详情。

### 尝试 MCP 服务器

通过模型上下文协议连接到外部工具：

```yaml
# 添加到 ~/.hermes/config.yaml
mcp_servers:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxx"
```

---

## 快速参考

| 命令 | 描述 |
|--------|-------------|
| `hermes` | 开始聊天 |
| `hermes model` | 选择你的 LLM 提供商和模型 |
| `hermes tools` | 配置每个平台启用哪些工具 |
| `hermes setup` | 完全设置向导（一次性配置所有内容） |
| `hermes doctor` | 诊断问题 |
| `hermes update` | 更新到最新版本 |
| `hermes gateway` | 启动消息网关 |
| `hermes --continue` | 恢复上一个会话 |

## 下一步

- **[CLI 指南](../user-guide/cli.md)** — 掌握终端界面
- **[配置](../user-guide/configuration.md)** — 自定义你的设置
- **[消息网关](../user-guide/messaging/index.md)** — 连接 Telegram、Discord、Slack、WhatsApp、Signal、Email 或 Home Assistant
- **[工具和工具集](../user-guide/features/tools.md)** — 探索可用功能
