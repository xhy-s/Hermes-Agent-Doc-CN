---
title: "图像生成"
description: "使用 FLUX 2 Pro 生成高质量图像，通过 FAL.ai 自动升级"
sidebar_label: "图像生成"
sidebar_position: 6
---

# 图像生成

Hermes Agent 可以使用 FAL.ai 的 **FLUX 2 Pro** 模型根据文本提示生成图像，并通过 **Clarity Upscaler** 自动 2 倍升级以增强质量。

## 设置

### 获取 FAL API 密钥

1. 在 [fal.ai](https://fal.ai/) 注册
2. 从您的仪表板生成 API 密钥

### 配置密钥

```bash
# 添加到 ~/.hermes/.env
FAL_KEY=your-fal-api-key-here
```

### 安装客户端库

```bash
pip install fal-client
```

:::info
当设置 `FAL_KEY` 时，图像生成工具自动可用。不需要额外的工具集配置。
:::

## 工作原理

当您要求 Hermes 生成图像时：

1. **生成** — 您的提示被发送到 FLUX 2 Pro 模型（`fal-ai/flux-2-pro`）
2. **升级** — 生成的图像使用 Clarity Upscaler（`fal-ai/clarity-upscaler`）自动 2 倍升级
3. **传递** — 返回升级后的图像 URL

如果升级因任何原因失败，原始图像作为回退返回。

## 使用

简单要求 Hermes 创建图像：

```
Generate an image of a serene mountain landscape with cherry blossoms
```

```
Create a portrait of a wise old owl perched on an ancient tree branch
```

```
Make me a futuristic cityscape with flying cars and neon lights
```

## 参数

`image_generate_tool` 接受这些参数：

| 参数 | 默认值 | 范围 | 描述 |
|-----------|---------|-------|-------------|
| `prompt` | *（必需）* | — | 所需图像的文本描述 |
| `aspect_ratio` | `"landscape"` | `landscape`、`square`、`portrait` | 图像宽高比 |
| `num_inference_steps` | `50` | 1–100 | 去噪步数（越多 = 质量越高、越慢） |
| `guidance_scale` | `4.5` | 0.1–20.0 | 与提示的贴合程度 |
| `num_images` | `1` | 1–4 | 要生成的图像数量 |
| `output_format` | `"png"` | `png`、`jpeg` | 图像文件格式 |
| `seed` | *（随机）* | 任意整数 | 可重现结果的随机种子 |

## 宽高比

该工具使用简化的宽高比名称，映射到 FLUX 2 Pro 图像尺寸：

| 宽高比 | 映射到 | 适合 |
|-------------|---------|----------|
| `landscape` | `landscape_16_9` | 壁纸、横幅、场景 |
| `square` | `square_hd` | 头像、社交媒体帖子 |
| `portrait` | `portrait_16_9` | 角色艺术、手机壁纸 |

:::tip
您也可以直接使用原始 FLUX 2 Pro 尺寸预设：`square_hd`、`square`、`portrait_4_3`、`portrait_16_9`、`landscape_4_3`、`landscape_16_9`。还支持最大 2048x2048 的自定义尺寸。
:::

## 自动升级

每个生成的图像使用 FAL.ai 的 Clarity Upscaler 自动 2 倍升级， settings：

| 设置 | 值 |
|---------|-------|
| 升级倍数 | 2x |
| 创造力 | 0.35 |
| 相似度 | 0.6 |
| 引导比例 | 4 |
| 推理步数 | 18 |
| 正面提示 | `"masterpiece, best quality, highres"` + 您的原始提示 |
| 负面提示 | `"(worst quality, low quality, normal quality:2)"` |

升级器在保留原始构图的同时增强细节和分辨率。如果升级器失败（网络问题、速率限制），自动返回原始分辨率图像。

## 示例提示

以下是一些有效的提示可以尝试：

```
A candid street photo of a woman with a pink bob and bold eyeliner
```

```
Modern architecture building with glass facade, sunset lighting
```

```
Abstract art with vibrant colors and geometric patterns
```

```
Portrait of a wise old owl perched on ancient tree branch
```

```
Futuristic cityscape with flying cars and neon lights
```

## 调试

为图像生成启用调试日志：

```bash
export IMAGE_TOOLS_DEBUG=true
```

调试日志保存到 `./logs/image_tools_debug_<session_id>.json`，包含每个生成请求的参数、时间安排和任何错误的详细信息。

## 安全设置

图像生成工具默认在安全检查禁用的状态下运行（`safety_tolerance: 5`，最宽松的设置）。这是在代码级别配置的，用户无法调整。

## 平台传递

生成的图像根据平台以不同方式传递：

| 平台 | 传递方式 |
|----------|----------------|
| **CLI** | 图像 URL 作为 markdown `![description](url)` 打印 — 点击在浏览器中打开 |
| **Telegram** | 图像作为照片消息发送，提示作为标题 |
| **Discord** | 图像嵌入在消息中 |
| **Slack** | 消息中的图像 URL（Slack 会展开） |
| **WhatsApp** | 图像作为媒体消息发送 |
| **其他平台** | 纯文本中的图像 URL |

代理在响应中使用 `MEDIA:<url>` 语法，平台适配器将其转换为适当格式。

## 限制

- **需要 FAL API 密钥** — 图像生成会产生您 FAL.ai 账户的 API 成本
- **无图像编辑** — 仅支持文本到图像，不支持修复或 img2img
- **基于 URL 的传递** — 图像作为临时 FAL.ai URL 返回，不保存到本地。URL 通常在数小时后过期
- **升级增加延迟** — 自动 2 倍升级步骤增加处理时间
- **每次请求最多 4 张图像** — `num_images` 上限为 4
