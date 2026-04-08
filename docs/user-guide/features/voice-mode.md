---
sidebar_position: 10
title: "语音模式"
description: "与 Hermes Agent 的实时语音对话 — CLI、Telegram、Discord（私信、文本频道和语音频道）"
---

# 语音模式

Hermes Agent 支持跨 CLI 和消息平台的完整语音交互。通过麦克风与代理对话、听取语音回复，并在 Discord 语音频道中进行实时语音对话。

如果您需要实用配置指南和真实使用模式，请参见[将语音模式与 Hermes 结合使用](/docs/guides/use-voice-mode-with-hermes)。

## 前置要求

在使用语音功能之前，请确保已满足以下条件：

1. **已安装 Hermes Agent** — `pip install hermes-agent`（参见[安装](/docs/getting-started/installation)）
2. **已配置 LLM provider** — 运行 `hermes model` 或在 `~/.hermes/.env` 中设置您偏好的 provider 凭证
3. **基础设置正常工作** — 运行 `hermes` 以验证代理在启用语音之前能响应文本

:::tip
`~/.hermes/` 目录和默认 `config.yaml` 会在首次运行 `hermes` 时自动创建。您只需要手动创建 `~/.hermes/.env` 来存放 API 密钥。
:::

## 概览

| 功能 | 平台 | 描述 |
|---------|----------|-------------|
| **交互式语音** | CLI | 按 Ctrl+B 录音，代理自动检测静音并回复 |
| **自动语音回复** | Telegram、Discord | 代理发送语音音频以及文本回复 |
| **语音频道** | Discord | Bot 加入 VC，监听用户说话并语音回复 |

## 要求

### Python 包

```bash
# CLI 语音模式（麦克风 + 音频播放）
pip install "hermes-agent[voice]"

# Discord + Telegram 消息（包含用于 VC 支持的 discord.py[voice]）
pip install "hermes-agent[messaging]"

# 高级 TTS（ElevenLabs）
pip install "hermes-agent[tts-premium]"

# 本地 TTS（NeuTTS，可选）
python -m pip install -U neutts[all]

# 一次性安装所有
pip install "hermes-agent[all]"
```

| 额外包 | 包含的包 | 用途 |
|-------|----------|-------------|
| `voice` | `sounddevice`, `numpy` | CLI 语音模式 |
| `messaging` | `discord.py[voice]`, `python-telegram-bot`, `aiohttp` | Discord 和 Telegram 机器人 |
| `tts-premium` | `elevenlabs` | ElevenLabs TTS provider |

可选的本地 TTS provider：使用 `python -m pip install -U neutts[all]` 单独安装 NeuTTS。首次使用时自动下载模型。

:::info
`discord.py[voice]` 自动安装 **PyNaCl**（用于语音加密）和 **opus 绑定**。这是 Discord 语音频道支持所必需的。
:::

### 系统依赖

```bash
# macOS
brew install portaudio ffmpeg opus
brew install espeak-ng   # 用于 NeuTTS

# Ubuntu/Debian
sudo apt install portaudio19-dev ffmpeg libopus0
sudo apt install espeak-ng   # 用于 NeuTTS
```

| 依赖 | 用途 | 必需用于 |
|-----------|---------|-------------|
| **PortAudio** | 麦克风输入和音频播放 | CLI 语音模式 |
| **ffmpeg** | 音频格式转换（MP3 → Opus、PCM → WAV） | 所有平台 |
| **Opus** | Discord 语音编解码器 | Discord 语音频道 |
| **espeak-ng** | 音素器后端 | 本地 NeuTTS provider |

### API 密钥

添加到 `~/.hermes/.env`：

```bash
# 语音转文本 — 本地 provider 完全不需要密钥
# pip install faster-whisper          # 免费，本地运行，推荐
GROQ_API_KEY=your-key                 # Groq Whisper — 快速，免费套餐（云端）
VOICE_TOOLS_OPENAI_KEY=your-key       # OpenAI Whisper — 付费（云端）

# 文本转语音（可选 — Edge TTS 和 NeuTTS 不需要任何密钥）
ELEVENLABS_API_KEY=***           # ElevenLabs — 高级质量
# 上面的 VOICE_TOOLS_OPENAI_KEY 也可启用 OpenAI TTS
```

:::tip
如果安装了 `faster-whisper`，语音模式对于 STT **无需任何 API 密钥**即可工作。模型（约 150 MB，对应 `base`）会在首次使用时自动下载。
:::

---

## CLI 语音模式

### 快速开始

启动 CLI 并启用语音模式：

```bash
hermes                # 启动交互式 CLI
```

然后在 CLI 内部使用以下命令：

```
/voice          切换语音模式开/关
/voice on       启用语音模式
/voice off      禁用语音模式
/voice tts      切换 TTS 输出
/voice status   显示当前状态
```

### 工作原理

1. 使用 `hermes` 启动 CLI，然后使用 `/voice on` 启用语音模式
2. **按 Ctrl+B** — 播放一声蜂鸣（880Hz），开始录音
3. **说话** — 实时音频电平条显示您的输入：`● [▁▂▃▅▇▇▅▂] ❯`
4. **停止说话** — 3 秒静音后，录音自动停止
5. **播放两声蜂鸣**（660Hz）确认录音结束
6. 音频通过 Whisper 转录并发送给代理
7. 如果启用了 TTS，代理的回复会被朗读出来
8. 录音**自动重新开始** — 无需按任何键即可再次说话

此循环持续，直到您在录音过程中按 **Ctrl+B**（退出连续模式）或连续 3 次录音检测到无语音。

:::tip
录音键可通过 `~/.hermes/config.yaml` 中的 `voice.record_key` 配置（默认：`ctrl+b`）。
:::

### 静音检测

两阶段算法检测您何时说完话：

1. **语音确认** — 等待音频高于 RMS 阈值（200）至少 0.3 秒，允许音节之间的短暂下降
2. **结束检测** — 一旦确认语音，在连续 3.0 秒静音后触发

如果 15 秒内完全未检测到语音，录音会自动停止。

`silence_threshold` 和 `silence_duration` 都可在 `config.yaml` 中配置。

### 流式 TTS

启用 TTS 时，代理在生成文本时**逐句**朗读回复 — 您无需等待完整响应：

1. 将文本增量缓冲为完整句子（至少 20 个字符）
2. 剥离 markdown 格式和 `<think>` 块
3. 实时为每个句子生成并播放音频

### 幻觉过滤器

Whisper 有时会从静音或背景噪音中生成虚假文本（"Thank you for watching"、"Subscribe" 等）。代理使用 26 个已知多语言幻觉短语集以及捕获重复变体的正则表达式模式来过滤这些。

---

## 网关语音回复（Telegram 和 Discord）

如果您尚未设置消息机器人，请参见平台特定指南：
- [Telegram 设置指南](../messaging/telegram.md)
- [Discord 设置指南](../messaging/discord.md)

启动网关以连接到您的消息平台：

```bash
hermes gateway        # 启动网关（连接到已配置的平台）
hermes gateway setup  # 首次配置的交互式设置向导
```

### Discord：频道与私信

机器人在 Discord 上支持两种交互模式：

| 模式 | 如何对话 | 是否需要 @提 | 设置 |
|------|------------|-----------------|-------|
| **私信（DM）** | 打开机器人个人资料 → "发送消息" | 否 | 立即可用 |
| **服务器频道** | 在机器人所在的文本频道中输入 | 是（`@机器人名称`） | 机器人必须被邀请到服务器 |

**私信（个人使用推荐）：** 直接向机器人发送私信即可 — 无需 @提。语音回复和所有命令与频道中相同工作。

**服务器频道：** 机器人仅在您 @提它时响应（例如 `@hermesbyt4 hello`）。确保从提及弹出框中选择**机器人用户**，而非同名的角色。

:::tip
要在服务器频道中禁用提及要求，请添加到 `~/.hermes/.env`：
```bash
DISCORD_REQUIRE_MENTION=false
```
或将特定频道设置为自由回复（无需提及）：
```bash
DISCORD_FREE_RESPONSE_CHANNELS=123456789,987654321
```
:::

### 命令

这些在 Telegram 和 Discord（私信和文本频道）中均可用：

```
/voice          切换语音模式开/关
/voice on       仅当您发送语音消息时语音回复
/voice tts      对所有消息进行语音回复
/voice off      禁用语音回复
/voice status   显示当前设置
```

### 模式

| 模式 | 命令 | 行为 |
|------|---------|----------|
| `off` | `/voice off` | 仅文本（默认） |
| `voice_only` | `/voice on` | 仅当您发送语音消息时才语音回复 |
| `all` | `/voice tts` | 对每条消息都语音回复 |

语音模式设置在网关重启后持久化。

### 平台传递

| 平台 | 格式 | 备注 |
|----------|--------|-------|
| **Telegram** | 语音气泡（Opus/OGG） | 在聊天中内联播放。如需 ffmpeg 将 MP3 转换为 Opus |
| **Discord** | 原生语音气泡（Opus/OGG） | 像用户语音消息一样内联播放。如果语音气泡 API 失败则回退到文件附件 |

---

## Discord 语音频道

最沉浸式的语音功能：机器人加入 Discord 语音频道，监听用户说话，将其语音转录，通过代理处理，并在语音频道中语音回复。

### 设置

#### 1. Discord 机器人权限

如果您已经为文本设置了 Discord 机器人（参见 [Discord 设置指南](../messaging/discord.md)），则需要添加语音权限。

进入 [Discord 开发者门户](https://discord.com/developers/applications) → 您的应用程序 → **安装** → **默认安装设置** → **公会安装**：

**将以下权限添加到现有文本权限：**

| 权限 | 用途 | 必需 |
|-----------|---------|----------|
| **连接** | 加入语音频道 | 是 |
| **说话** | 在语音频道中播放 TTS 音频 | 是 |
| **使用语音活动** | 检测用户何时说话 | 推荐 |

**更新后的权限整数：**

| 级别 | 整数 | 包含内容 |
|-------|---------|----------------|
| 仅文本 | `274878286912` | 查看频道、发送消息、读取历史、嵌入、附件、线程、反应 |
| 文本 + 语音 | `274881432640` | 以上全部 + 连接、说话 |

**使用更新后的权限 URL 重新邀请机器人：**

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=274881432640
```

将 `YOUR_APP_ID` 替换为开发者门户中的应用程序 ID。

:::warning
重新邀请机器人到其已在的服务器会更新其权限而不会移除它。您不会丢失任何数据或配置。
:::

#### 2. 特权网关 Intent

在[开发者门户](https://discord.com/developers/applications) → 您的应用程序 → **机器人** → **特权网关 Intent**中，启用全部三个：

| Intent | 用途 |
|--------|---------|
| **Presence Intent** | 检测用户在线/离线状态 |
| **Server Members Intent** | 将语音 SSRC 标识符映射到 Discord 用户 ID |
| **Message Content Intent** | 读取频道中的文本消息内容 |

全部三个都是完整语音频道功能所必需的。**Server Members Intent** 尤其关键 — 没有它，机器人无法识别语音频道中是谁在说话。

#### 3. Opus 编解码器

运行网关的机器子上必须安装 Opus 编解码器库：

```bash
# macOS（Homebrew）
brew install opus

# Ubuntu/Debian
sudo apt install libopus0
```

机器人自动加载编解码器：
- **macOS：** `/opt/homebrew/lib/libopus.dylib`
- **Linux：** `libopus.so.0`

#### 4. 环境变量

```bash
# ~/.hermes/.env

# Discord 机器人（已为文本配置）
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_ALLOWED_USERS=your-user-id

# STT — 本地 provider 不需要密钥（pip install faster-whisper）
# GROQ_API_KEY=your-key            # 替代方案：云端，快速，免费套餐

# TTS — 可选。Edge TTS 和 NeuTTS 不需要密钥。
# ELEVENLABS_API_KEY=***      # 高级质量
# VOICE_TOOLS_OPENAI_KEY=***  # OpenAI TTS / Whisper
```

### 启动网关

```bash
hermes gateway        # 使用现有配置启动
```

机器人应在几秒钟内在 Discord 上线。

### 命令

在机器人所在的 Discord 文本频道中使用：

```
/voice join      机器人加入您当前的语音频道
/voice channel   /voice join 的别名
/voice leave     机器人从语音频道断开
/voice status    显示语音模式和连接的频道
```

:::info
在运行 `/voice join` 之前，您必须已在语音频道中。机器人加入与您相同的 VC。
:::

### 工作原理

当机器人加入语音频道时，它会：

1. **监听** 每个用户的独立音频流
2. **检测静音** — 在至少 0.5 秒语音后 1.5 秒静音触发处理
3. **通过 Whisper STT 转录**音频（本地、Groq 或 OpenAI）
4. **通过**完整代理管道处理（会话、工具、记忆）
5. **通过 TTS 在语音频道中说话回复**

### 文本频道集成

当机器人在语音频道中时：

- 转录显示在文本频道中：`[Voice] @用户：您说的话`
- 代理回复在频道中作为文本发送，并在 VC 中语音播放
- 文本频道是发出 `/voice join` 的频道

### 回声防止

机器人在播放 TTS 回复时自动暂停其音频监听器，防止听到并重新处理自己的输出。

### 访问控制

只有 `DISCORD_ALLOWED_USERS` 中列出的用户可以通过语音交互。其他用户的音频被静默忽略。

```bash
# ~/.hermes/.env
DISCORD_ALLOWED_USERS=284102345871466496
```

---

## 配置参考

### config.yaml

```yaml
# 语音录制（CLI）
voice:
  record_key: "ctrl+b"            # 开始/停止录制的键
  max_recording_seconds: 120       # 最大录制长度
  auto_tts: false                  # 语音模式启动时自动启用 TTS
  silence_threshold: 200           # RMS 电平（0-32767），低于此值视为静音
  silence_duration: 3.0            # 自动停止前的静音秒数

# 语音转文本
stt:
  provider: "local"                  # "local"（免费）| "groq" | "openai"
  local:
    model: "base"                    # tiny、base、small、medium、large-v3
  # model: "whisper-1"              # 旧版：未设置 provider 时使用

# 文本转语音
tts:
  provider: "edge"                 # "edge"（免费）| "elevenlabs" | "openai" | "neutts" | "minimax"
  edge:
    voice: "en-US-AriaNeural"      # 322 种声音，74 种语言
  elevenlabs:
    voice_id: "pNInz6obpgDQGcFmaJgB"    # Adam
    model_id: "eleven_multilingual_v2"
  openai:
    model: "gpt-4o-mini-tts"
    voice: "alloy"                 # alloy、echo、fable、onyx、nova、shimmer
    base_url: "https://api.openai.com/v1"  # 可选：覆盖用于自托管或 OpenAI 兼容端点
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
```

### 环境变量

```bash
# 语音转文本 provider（本地不需要密钥）
# pip install faster-whisper        # 免费本地 STT — 无需 API 密钥
GROQ_API_KEY=...                    # Groq Whisper（快速，免费套餐）
VOICE_TOOLS_OPENAI_KEY=...         # OpenAI Whisper（付费）

# STT 高级覆盖（可选）
STT_GROQ_MODEL=whisper-large-v3-turbo    # 覆盖默认 Groq STT 模型
STT_OPENAI_MODEL=whisper-1               # 覆盖默认 OpenAI STT 模型
GROQ_BASE_URL=https://api.groq.com/openai/v1     # 自定义 Groq 端点
STT_OPENAI_BASE_URL=https://api.openai.com/v1    # 自定义 OpenAI STT 端点

# 文本转语音 provider（Edge TTS 和 NeuTTS 不需要密钥）
ELEVENLABS_API_KEY=***             # ElevenLabs（高级质量）
# 上面的 VOICE_TOOLS_OPENAI_KEY 也可启用 OpenAI TTS

# Discord 语音频道
DISCORD_BOT_TOKEN=...
DISCORD_ALLOWED_USERS=...
```

### STT Provider 对比

| Provider | 模型 | 速度 | 质量 | 成本 | API 密钥 |
|----------|-------|-------|---------|------|---------|
| **本地** | `base` | 快（取决于 CPU/GPU） | 良好 | 免费 | 否 |
| **本地** | `small` | 中等 | 更好 | 免费 | 否 |
| **本地** | `large-v3` | 慢 | 最佳 | 免费 | 否 |
| **Groq** | `whisper-large-v3-turbo` | 非常快（约 0.5s） | 良好 | 免费套餐 | 是 |
| **Groq** | `whisper-large-v3` | 快（约 1s） | 更好 | 免费套餐 | 是 |
| **OpenAI** | `whisper-1` | 快（约 1s） | 良好 | 付费 | 是 |
| **OpenAI** | `gpt-4o-transcribe` | 中等（约 2s） | 最佳 | 付费 | 是 |

Provider 优先级（自动回退）：**本地** > **groq** > **openai**

### TTS Provider 对比

| Provider | 质量 | 成本 | 延迟 | 需要密钥 |
|----------|---------|------|---------|-------------|
| **Edge TTS** | 良好 | 免费 | ~1s | 否 |
| **ElevenLabs** | 优秀 | 付费 | ~2s | 是 |
| **OpenAI TTS** | 良好 | 付费 | ~1.5s | 是 |
| **NeuTTS** | 良好 | 免费 | 取决于 CPU/GPU | 否 |

NeuTTS 使用上面的 `tts.neutts` 配置块。

---

## 故障排除

### "找不到音频设备"（CLI）

PortAudio 未安装：

```bash
brew install portaudio    # macOS
sudo apt install portaudio19-dev  # Ubuntu
```

### 机器人在 Discord 服务器频道中不响应

机器人默认在服务器频道中需要 @提及。请确保：

1. 输入 `@` 并选择**机器人用户**（带 #discriminator），而非同名的**角色**
2. 或改用私信 — 无需提及
3. 或在 `~/.hermes/.env` 中设置 `DISCORD_REQUIRE_MENTION=false`

### 机器人加入 VC 但听不到我

- 检查您的 Discord 用户 ID 是否在 `DISCORD_ALLOWED_USERS` 中
- 确保您在 Discord 中没有静音
- 机器人需要 Discord 的 SPEAKING 事件才能映射您的音频 — 在加入后几秒钟内开始说话

### 机器人听到我但不回复

- 验证 STT 可用：安装 `faster-whisper`（不需要密钥）或设置 `GROQ_API_KEY` / `VOICE_TOOLS_OPENAI_KEY`
- 检查 LLM 模型已配置且可访问
- 查看网关日志：`tail -f ~/.hermes/logs/gateway.log`

### 机器人在文本中回复但不在语音频道中回复

- TTS provider 可能失败 — 检查 API 密钥和配额
- Edge TTS（免费，无需密钥）是默认回退
- 检查日志中的 TTS 错误

### Whisper 返回垃圾文本

幻觉过滤器会自动捕获大多数情况。如果您仍然收到虚假转录：

- 使用更安静的环境
- 调整配置中的 `silence_threshold`（越高越不敏感）
- 尝试不同的 STT 模型
