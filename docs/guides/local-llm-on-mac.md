---
sidebar_position: 2
title: "在 Mac 上运行本地 LLM"
description: "在 macOS 上使用 llama.cpp 或 MLX 设置本地 OpenAI 兼容 LLM 服务器，包括模型选择、内存优化和 Apple Silicon 上的真实基准测试"
---

# 在 Mac 上运行本地 LLM

本指南带你在 macOS 上使用 OpenAI 兼容 API 运行本地 LLM 服务器。获得完全隐私、零 API 成本和在 Apple Silicon 上令人惊讶的良好性能。

我们涵盖两个后端：

| 后端 | 安装 | 专长 | 格式 |
|---------|---------|---------|--------|
| **llama.cpp** | `brew install llama.cpp` | 首次 token 最快、量化 KV 缓存低内存 | GGUF |
| **omlx** | [omlx.ai](https://omlx.ai) | Token 生成最快、原生 Metal 优化 | MLX (safetensors) |

两者都暴露 OpenAI 兼容的 `/v1/chat/completions` 端点。Hermes 与任一者配合使用——只需将其指向 `http://localhost:8080` 或 `http://localhost:8000`。

:::info 仅 Apple Silicon
本指南针对配备 Apple Silicon（M1 及更高版本）的 Mac。Intel Mac 可以使用 llama.cpp 但没有 GPU 加速——性能会明显较慢。
:::

---

## 选择模型

对于入门，我们推荐 **Qwen3.5-9B**——这是一个强大的推理模型，在量化情况下可舒适地放入 8GB+ 统一内存。

| 变体 | 磁盘大小 | 所需 RAM（128K 上下文） | 后端 |
|---------|-------------|---------------------------|---------|
| Qwen3.5-9B-Q4_K_M (GGUF) | 5.3 GB | ~10 GB（量化 KV 缓存） | llama.cpp |
| Qwen3.5-9B-mlx-lm-mxfp4 (MLX) | ~5 GB | ~12 GB | omlx |

**内存经验法则：** 模型大小 + KV 缓存。9B Q4 模型约 5 GB。Q4 量化的 128K 上下文 KV 缓存增加约 4-5 GB。使用默认（f16）KV 缓存，这会膨胀到约 16 GB。llama.cpp 中的量化 KV 缓存标志是内存受限系统的关键技巧。

对于更大的模型（27B、35B），你需要 32 GB+ 统一内存。9B 是 8-16 GB 机器的最佳选择。

---

## 选项 A: llama.cpp

llama.cpp 是最具可移植性的本地 LLM 运行时。在 macOS 上它开箱即用 Metal 进行 GPU 加速。

### 安装

```bash
brew install llama.cpp
```

这给你全局的 `llama-server` 命令。

### 下载模型

你需要 GGUF 格式的模型。最简单的来源是通过 `huggingface-cli` 从 Hugging Face 下载：

```bash
brew install huggingface-cli
```

然后下载：

```bash
huggingface-cli download unsloth/Qwen3.5-9B-GGUF Qwen3.5-9B-Q4_K_M.gguf --local-dir ~/models
```

:::tip 受限模型
Hugging Face 上的一些模型需要身份验证。如果收到 401 或 404 错误，先运行 `huggingface-cli login`。
:::

### 启动服务器

```bash
llama-server -m ~/models/Qwen3.5-9B-Q4_K_M.gguf \
  -ngl 99 \
  -c 131072 \
  -np 1 \
  -fa on \
  --cache-type-k q4_0 \
  --cache-type-v q4_0 \
  --host 0.0.0.0
```

每个标志的作用：

| 标志 | 用途 |
|------|---------|
| `-ngl 99` | 将所有层卸载到 GPU（Metal）。使用高数字确保没有什么留在 CPU 上。 |
| `-c 131072` | 上下文窗口大小（128K tokens）。如果内存不足，减少这个值。 |
| `-np 1` | 并行槽数量。对于单用户使用保持为 1——更多槽会分割你的内存预算。 |
| `-fa on` | Flash attention。减少内存使用并加速长上下文推理。 |
| `--cache-type-k q4_0` | 将 key 缓存量化为 4 位。**这是大内存节省器。** |
| `--cache-type-v q4_0` | 将 value 缓存量化为 4 位。与上述一起，这比 f16 减少约 75% 的 KV 缓存内存。 |
| `--host 0.0.0.0` | 监听所有接口。如果不需要网络访问，使用 `127.0.0.1`。 |

当你看到以下内容时服务器就绪：

```
main: server is listening on http://0.0.0.0:8080
srv  update_slots: all slots are idle
```

### 内存优化（受限系统）

`--cache-type-k q4_0 --cache-type-v q4_0` 标志是内存受限系统最重要的优化。128K 上下文的影响：

| KV 缓存类型 | KV 缓存内存（128K 上下文，9B 模型） |
|---------------|--------------------------------------|
| f16（默认） | ~16 GB |
| q8_0 | ~8 GB |
| **q4_0** | **~4 GB** |

在 8 GB Mac 上，使用 `q4_0` KV 缓存并将上下文减少到 `-c 32768`（32K）。在 16 GB 上，你可以舒适地使用 128K 上下文。在 32 GB+ 上，你可以运行更大的模型或多个并行槽。

如果仍然内存不足，首先减少上下文大小（`-c`），然后尝试更小的量化（Q3_K_M 而不是 Q4_K_M）。

### 测试它

```bash
curl -s http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen3.5-9B-Q4_K_M.gguf",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 50
  }' | jq .choices[0].message.content
```

### 获取模型名称

如果忘记了模型名称，查询 models 端点：

```bash
curl -s http://localhost:8080/v1/models | jq '.data[].id'
```

---

## 选项 B: MLX via omlx

[omlx](https://omlx.ai) 是一个 macOS 原生应用，管理和服务 MLX 模型。MLX 是 Apple 自己的机器学习框架，针对 Apple Silicon 的统一内存架构进行了优化。

### 安装

从 [omlx.ai](https://omlx.ai) 下载并安装。它提供模型管理的 GUI 和内置服务器。

### 下载模型

使用 omlx 应用浏览和下载模型。搜索 `Qwen3.5-9B-mlx-lm-mxfp4` 并下载。模型本地存储（通常在 `~/.omlx/models/`）。

### 启动服务器

omlx 默认在 `http://127.0.0.1:8000` 上服务模型。从应用 UI 启动服务，或使用 CLI（如果有）。

### 测试它

```bash
curl -s http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen3.5-9B-mlx-lm-mxfp4",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 50
  }' | jq .choices[0].message.content
```

### 列出可用模型

omlx 可以同时服务多个模型：

```bash
curl -s http://127.0.0.1:8000/v1/models | jq '.data[].id'
```

---

## 基准测试：llama.cpp vs MLX

两个后端在同一台机器上测试（Apple M5 Max，128 GB 统一内存），运行相同模型（Qwen3.5-9B），量化级别相当（GGUF 的 Q4_K_M，MLX 的 mxfp4）。五个不同提示，每个三次运行，后端顺序测试以避免资源争用。

### 结果

| 指标 | llama.cpp (Q4_K_M) | MLX (mxfp4) | 胜者 |
|--------|-------------------|-------------|--------|
| **TTFT（平均）** | **67 ms** | 289 ms | llama.cpp（4.3 倍快） |
| **TTFT（p50）** | **66 ms** | 286 ms | llama.cpp（4.3 倍快） |
| **生成（平均）** | 70 tok/s | **96 tok/s** | MLX（37% 快） |
| **生成（p50）** | 70 tok/s | **96 tok/s** | MLX（37% 快） |
| **总时间（512 tokens）** | 7.3s | **5.5s** | MLX（25% 快） |

### 这意味着什么

- **llama.cpp** 在提示处理方面表现出色——其 flash attention + 量化 KV 缓存流水线让你在约 66ms 内获得第一个 token。如果你在构建交互式应用程序，其中感知响应能力很重要（聊天机器人、自动完成），这是有意义的优势。

- **MLX** 一旦开始生成 token 约 37% 更快。对于批处理工作负载、长篇生成或任何总完成时间比初始延迟更重要的任务，MLX 更早完成。

- 两个后端都**非常一致**——跨运行的差异可以忽略不计。你可以依赖这些数字。

### 你应该选择哪个？

| 用例 | 推荐 |
|----------|---------------|
| 交互式聊天、低延迟工具 | llama.cpp |
| 长篇生成、批量处理 | MLX (omlx) |
| 内存受限（8-16 GB） | llama.cpp（量化 KV 缓存无与伦比） |
| 同时服务多个模型 | omlx（内置多模型支持） |
| 最大兼容性（也支持 Linux） | llama.cpp |

---

## 连接到 Hermes

本地服务器运行后：

```bash
hermes model
```

选择**自定义端点**并按照提示操作。它会询问基本 URL 和模型名称——使用你上面设置的任一后端对应的值。
