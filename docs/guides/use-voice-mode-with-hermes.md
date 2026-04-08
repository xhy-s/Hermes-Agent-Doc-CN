---
sidebar_position: 8
title: "在 Hermes 中使用语音模式"
description: "跨 CLI、Telegram、Discord 和 Discord 语音频道设置和使用 Hermes 语音模式的实用指南"
---

# 在 Hermes 中使用语音模式

本指南是[语音模式功能参考](/docs/user-guide/features/voice-mode)的实用伴侣。

如果功能页面解释了语音模式可以做什么，本指南展示如何实际使用它。

## 语音模式适合什么

语音模式特别适合：
- 你想要免手持的 CLI 工作流程
- 你想在 Telegram 或 Discord 中获得口语响应
- 你想让 Hermes 坐在 Discord 语音频道中进行实时对话
- 你想要在走动而不是打字时快速捕获想法、调试或来回交流

## 选择你的语音模式设置

Hermes 实际上有三种不同的语音体验。

| 模式 | 最适合 | 平台 |
|---|---|---|
| 交互式麦克风循环 | 个人免手持使用，同时编码或研究 | CLI |
| 聊天中的语音回复 | 口语响应与正常消息一起 | Telegram、Discord |
| 实时语音频道机器人 | VC 中的群组或个人实时对话 | Discord 语音频道 |

一个好路径是：
1. 首先让文本工作
2. 第二启用语音回复
3. 如果你想要完整体验，最后转到 Discord 语音频道

## 步骤 1：首先确保普通 Hermes 工作

在触及语音模式之前，验证：
- Hermes 启动
- 你的提供商已配置
- 代理可以正常回答文本提示

```bash
hermes
```

问一个简单的问题：

```text
What tools do you have available?
```

如果这还不稳定，先修复文本模式。

## 步骤 2：安装正确的 extras

### CLI 麦克风 + 播放

```bash
pip install "hermes-agent[voice]"
```

### 消息平台

```bash
pip install "hermes-agent[messaging]"
```

### 高级 ElevenLabs TTS

```bash
pip install "hermes-agent[tts-premium]"
```

### 本地 NeuTTS（可选）

```bash
python -m pip install -U neutts[all]
```

### 全部

```bash
pip install "hermes-agent[all]"
```

## 步骤 3：安装系统依赖

### macOS

```bash
brew install portaudio ffmpeg opus
brew install espeak-ng
```

### Ubuntu / Debian

```bash
sudo apt install portaudio19-dev ffmpeg libopus0
sudo apt install espeak-ng
```

这些为什么重要：
- `portaudio` → CLI 语音模式的麦克风输入/播放
- `ffmpeg` → TTS 和消息传递的音频转换
- `opus` → Discord 语音编解码器支持
- `espeak-ng` → NeuTTS 的音素器后端

## 步骤 4：选择 STT 和 TTS 提供商

Hermes 支持本地和云语音栈。

### 最简单/最便宜的设置

使用本地 STT 和免费 Edge TTS：
- STT 提供商：`local`
- TTS 提供商：`edge`

这通常是最好的起点。

### 环境文件示例

添加到 `~/.hermes/.env`：

```bash
# 云 STT 选项（本地不需要密钥）
GROQ_API_KEY=***
VOICE_TOOLS_OPENAI_KEY=***

# 高级 TTS（可选）
ELEVENLABS_API_KEY=***
```

### 提供商建议

#### 语音转文本

- `local` → 隐私和零成本使用的最佳默认
- `groq` → 非常快速的云转录
- `openai` → 不错的付费备选

#### 文本转语音

- `edge` → 对大多数用户免费且足够好
- `neutts` → 免费本地/设备上 TTS
- `elevenlabs` → 最佳质量
- `openai` → 不错的中间选择

### 如果你使用 `hermes setup`

如果你在设置向导中选择了 NeuTTS，Hermes 检查 `neutts` 是否已安装。如果缺失，向导告诉你 NeuTTS 需要 Python 包 `neutts` 和系统包 `espeak-ng`，为你提供安装选项，使用你的平台包管理器安装 `espeak-ng`，然后运行：

```bash
python -m pip install -U neutts[all]
```

如果你跳过该安装或失败，向导回退到 Edge TTS。

## 步骤 5：推荐配置

```yaml
voice:
  record_key: "ctrl+b"
  max_recording_seconds: 120
  auto_tts: false
  silence_threshold: 200
  silence_duration: 3.0

stt:
  provider: "local"
  local:
    model: "base"

tts:
  provider: "edge"
  edge:
    voice: "en-US-AriaNeural"
```

这是对大多数人来说不错的保守默认值。

如果你想要本地 TTS，切换 `tts` 块到：

```yaml
tts:
  provider: "neutts"
  neutts:
    ref_audio: ''
    ref_text: ''
    model: neuphonic/neutts-air-q4-gguf
    device: cpu
```

## 用例 1：CLI 语音模式

## 打开它

启动 Hermes：

```bash
hermes
```

在 CLI 内：

```text
/voice on
```

### 录音流程

默认按键：
- `Ctrl+B`

工作流程：
1. 按 `Ctrl+B`
2. 说话
3. 等待静默检测自动停止录音
4. Hermes 转录并回复
5. 如果 TTS 开启，它会说话回答
6. 循环可以自动重启以持续使用

### 有用的命令

```text
/voice
/voice on
/voice off
/voice tts
/voice status
```

### 好的 CLI 工作流程

#### 步行调试

说：

```text
I keep getting a docker permission error. Help me debug it.
```

然后继续免手持：
- "Read the last error again"
- "Explain the root cause in simpler terms"
- "Now give me the exact fix"

#### 研究/头脑风暴

非常适合：
- 走路时思考
- 口述半成形的想法
- 让 Hermes 实时构建你的思绪

#### 无障碍/低打字会话

如果打字不方便，语音模式是保持在完整 Hermes 循环中最快的方式之一。

## 调优 CLI 行为

### 静默阈值

如果 Hermes 开始/停止过于激进，调优：

```yaml
voice:
  silence_threshold: 250
```

更高阈值 = 更低灵敏度。

### 静默持续时间

如果你在句子之间停顿很多，增加：

```yaml
voice:
  silence_duration: 4.0
```

### 录音按键

如果 `Ctrl+B` 与你的终端或 tmux 习惯冲突：

```yaml
voice:
  record_key: "ctrl+space"
```

## 用例 2：Telegram 或 Discord 中的语音回复

这个模式比完整语音频道更简单。

Hermes 保持为普通聊天机器人，但可以说话回复。

### 启动网关

```bash
hermes gateway
```

### 打开语音回复

在 Telegram 或 Discord 内：

```text
/voice on
```

或者

```text
/voice tts
```

### 模式

| 模式 | 含义 |
|---|---|
| `off` | 仅文本 |
| `voice_only` | 仅当用户发送语音时说话 |
| `all` | 每次回复都说话 |

### 何时使用哪种模式

- 如果你只想对语音来源的消息获得口语回复，使用 `/voice on`
- 如果你想一直获得全口语助手，使用 `/voice tts`

### 好的消息工作流程

#### 手机上的 Telegram 助手

在以下情况使用：
- 你不在机器旁边
- 你想发送语音笔记并获得快速口语回复
- 你想让 Hermes 像便携式研究或运营助手一样运作

#### Discord DM 与口语输出

当你想要私密交互而不使用服务器频道提及行为时很有用。

## 用例 3：Discord 语音频道

这是最高级的模式。

Hermes 加入一个 Discord VC，监听用户语音，转录它，运行正常代理管道，并将回复说话回频道。

## 所需的 Discord 权限

除了正常的文本机器人设置外，确保机器人有：
- 连接
- 说话
- 最好使用语音活动

同时在开发者门户中启用特权意图：
- Presence Intent
- Server Members Intent
- Message Content Intent

## 加入和离开

在机器人存在的 Discord 文本频道中：

```text
/voice join
/voice leave
/voice status
```

### 加入后会发生什么

- 用户在 VC 中说话
- Hermes 检测语音边界
- 转录发布在关联的文本频道中
- Hermes 以文本和音频回复
- 文本频道是发出 `/voice join` 的那个

### Discord VC 使用的最佳实践

- 保持 `DISCORD_ALLOWED_USERS` 严格
- 最初使用专用机器人/测试频道
- 在尝试 VC 模式之前，在普通文本聊天语音模式下验证 STT 和 TTS 工作

## 语音质量建议

### 最佳质量设置

- STT：本地 `large-v3` 或 Groq `whisper-large-v3`
- TTS：ElevenLabs

### 最佳速度/便利设置

- STT：本地 `base` 或 Groq
- TTS：Edge

### 最佳零成本设置

- STT：本地
- TTS：Edge

## 常见故障模式

### "未找到音频设备"

安装 `portaudio`。

### "机器人加入但什么都听不到"

检查：
- 你的 Discord 用户 ID 在 `DISCORD_ALLOWED_USERS` 中
- 你没有静音
- 特权意图已启用
- 机器人有连接/说话权限

### "它转录但不说话"

检查：
- TTS 提供商配置
- ElevenLabs 或 OpenAI 的 API 密钥/配额
- Edge 转换路径的 `ffmpeg` 安装

### "Whisper 输出垃圾"

尝试：
- 更安静的环境
- 更高的 `silence_threshold`
- 不同的 STT 提供商/模型
- 更短、更清晰的表述

### "它在 DM 中工作但在服务器频道中不工作"

这通常是提及策略。

默认情况下，机器人在 Discord 服务器文本频道中需要 `@mention`，除非另有配置。

## 建议的第一周设置

如果你想要最短的成功路径：

1. 让文本 Hermes 工作
2. 安装 `hermes-agent[voice]`
3. 使用本地 STT + Edge TTS 使用 CLI 语音模式
4. 然后在 Telegram 或 Discord 中启用 `/voice on`
5. 只有在那之后，尝试 Discord VC 模式

这个进展保持了小的调试表面。

## 接下来阅读

- [语音模式功能参考](/docs/user-guide/features/voice-mode)
- [消息网关](/docs/user-guide/messaging)
- [Discord 设置](/docs/user-guide/messaging/discord)
- [Telegram 设置](/docs/user-guide/messaging/telegram)
- [配置](/docs/user-guide/configuration)
