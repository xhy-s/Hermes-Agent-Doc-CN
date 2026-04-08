---
sidebar_position: 5
title: "技能目录"
description: "Hermes Agent 内置技能目录"
---

# 技能目录

Hermes 随附一个大型内置技能库，在安装时复制到 `~/.hermes/skills/`。本页面目录位于仓库 `skills/` 下的内置技能。

## apple

Apple/macOS 专用技能——iMessage、提醒事项、备忘录、查找我的设备和 macOS 自动化。这些技能仅在 macOS 系统上加载。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `apple-notes` | 通过 macOS 上的 memo CLI 管理 Apple 备忘录（创建、查看、搜索、编辑）。 | `apple/apple-notes` |
| `apple-reminders` | 通过 remindctl CLI 管理 Apple 提醒事项（列表、添加、完成、删除）。 | `apple/apple-reminders` |
| `findmy` | 通过 macOS 上的 FindMy.app 使用 AppleScript 和屏幕捕获追踪 Apple 设备和 AirTags。 | `apple/findmy` |
| `imessage` | 通过 macOS 上的 imsg CLI 发送和接收 iMessage/SMS。 | `apple/imessage` |

## autonomous-ai-agents

用于生成和编排自主 AI 编码代理和多代理工作流程的技能——运行独立代理进程、委托任务和协调并行工作流。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `claude-code` | 将编码任务委托给 Claude Code（Anthropic 的 CLI 代理）。用于构建功能、重构、PR 审查和迭代编码。需要 claude CLI 已安装。 | `autonomous-ai-agents/claude-code` |
| `codex` | 将编码任务委托给 OpenAI Codex CLI 代理。用于构建功能、重构、PR 审查和批量问题修复。需要 codex CLI 和 git 仓库。 | `autonomous-ai-agents/codex` |
| `hermes-agent-spawning` | 生成额外的 Hermes Agent 实例作为自主子进程，用于独立的长期运行任务。支持非交互式单次模式（-q）和交互式 PTY 模式用于多轮协作。与 delegate_task 不同——这运行一个完整的独立 hermes 进程。 | `autonomous-ai-agents/hermes-agent` |
| `opencode` | 将编码任务委托给 OpenCode CLI 代理，用于功能实现、重构、PR 审查和长期自主会话。需要 opencode CLI 已安装并认证。 | `autonomous-ai-agents/opencode` |

## data-science

数据科学工作流程技能——交互式探索、Jupyter 笔记本、数据分析和可视化。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `jupyter-live-kernel` | 通过 hamelnb 使用实时 Jupyter 内核进行有状态、迭代式 Python 执行。当任务涉及探索、迭代或检查中间结果时加载此技能。 | `data-science/jupyter-live-kernel` |

## creative

创意内容生成——ASCII 艺术、手绘风格图表和视觉设计工具。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `ascii-art` | 使用 pyfiglet（571 种字体）、cowsay、boxes、toilet、image-to-ascii、远程 API（asciified、ascii.co.uk）和 LLM 回退生成 ASCII 艺术。无需 API 密钥。 | `creative/ascii-art` |
| `ascii-video` | "ASCII 艺术视频生产流水线——任何格式。将视频/音频/图像/生成输入转换为彩色 ASCII 字符视频输出（MP4、GIF、图像序列）。涵盖：视频转 ASCII 转换、音频响应音乐可视化器、生成式 ASCII 艺术动画、混合… | `creative/ascii-video` |
| `excalidraw` | 使用 Excalidraw JSON 格式创建手绘风格图表。生成 .excalidraw 文件用于架构图、流程图、序列图、概念图等。文件可在 excalidraw.com 打开或上传获取分享链接。 | `creative/excalidraw` |
| `p5js` | 使用 p5.js 进行交互式和生成式视觉艺术的生产流水线。创建草图、通过无头浏览器将草图渲染为图像/视频，并提供实时预览。支持画布动画、数据可视化。 | `creative/p5js` |

## devops

DevOps 和基础设施自动化技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `webhook-subscriptions` | 为事件驱动的代理激活创建和管理 webhook 订阅。外部服务（GitHub、Stripe、CI/CD、IoT）POST 事件来触发代理运行。需要 webhook 平台已启用。 | `devops/webhook-subscriptions` |

## dogfood

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `dogfood` | 对 Web 应用进行系统化探索性 QA 测试——发现 bug、捕获证据并生成结构化报告。 | `dogfood/dogfood` |
| `hermes-agent-setup` | 帮助用户配置 Hermes Agent——CLI 用法、设置向导、模型/提供商选择、工具、技能、语音/STT/TTS、网关和故障排除。 | `dogfood/hermes-agent-setup` |

## email

从终端发送、接收、搜索和管理电子邮件的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `himalaya` | 通过 IMAP/SMTP 管理邮件的 CLI。使用 himalaya 列出、读取、编写、回复、转发、搜索和组织邮件。支持多账户和 MML（MIME Meta Language）消息编写。 | `email/himalaya` |

## gaming

用于设置、配置和管理游戏服务器、modpack 和游戏相关基础设施的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `minecraft-modpack-server` | 从 CurseForge/Modrinth 服务器包 zip 设置 modded Minecraft 服务器。涵盖 NeoForge/Forge 安装、Java 版本、JVM 调优、防火墙、LAN 配置、备份和启动脚本。 | `gaming/minecraft-modpack-server` |
| `pokemon-player` | 通过无头模拟自主玩宝可梦游戏。启动游戏服务器、从 RAM 读取结构化游戏状态、做出战略决策并发送按钮输入——全部从终端完成。 | `gaming/pokemon-player` |

## github

使用 gh CLI 和 git 管理仓库、pull requests、代码审查、issues 和 CI/CD 流水线的 GitHub 工作流程技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `codebase-inspection` | 使用 pygount 检查和分析代码库，进行 LOC 计数、语言分解和代码/注释比例分析。当被要求检查代码行数、仓库大小、语言组成或代码库统计时使用。 | `github/codebase-inspection` |
| `github-auth` | 使用 git（普遍可用）或 gh CLI 设置 GitHub 身份验证。涵盖 HTTPS token、SSH 密钥、凭证辅助工具和 gh auth——带有自动检测流程以选择正确方法。 | `github/github-auth` |
| `github-code-review` | 通过分析 git diffs、在 PR 上留下内联评论和进行彻底的预推送审查来审查代码更改。使用 gh CLI 或回退到 git + GitHub REST API。 | `github/github-code-review` |
| `github-issues` | 创建、管理、分类和关闭 GitHub issues。搜索现有 issues、添加标签、分配人员并链接到 PR。使用 gh CLI 或回退到 git + GitHub REST API。 | `github/github-issues` |
| `github-pr-workflow` | 完整的 pull request 生命周期——创建分支、提交更改、打开 PR、监控 CI 状态、自动修复失败和合并。使用 gh CLI 或回退到 git + GitHub REST API。 | `github/github-pr-workflow` |
| `github-repo-management` | 克隆、创建、分叉、配置和管理 GitHub 仓库。管理 remotes、secrets、releases 和 workflows。使用 gh CLI 或回退到 git + GitHub REST API。 | `github/github-repo-management` |

## inference-sh

通过 inference.sh 云平台执行 AI 应用的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `inference-sh-cli` | 通过 inference.sh CLI (infsh) 运行 150+ AI 应用——图像生成、视频创建、LLM、搜索、3D 和社交自动化。 | `inference-sh/cli` |

## leisure

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `find-nearby` | 使用 OpenStreetMap 查找附近地点（餐厅、咖啡馆、酒吧、药房等）。可通过坐标、地址、城市、邮政编码或 Telegram 位置标记工作。无需 API 密钥。 | `leisure/find-nearby` |

## mcp

用于处理 MCP（Model Context Protocol）服务器、工具和集成的技能。包括内置原生 MCP 客户端（在 config.yaml 中配置服务器以进行自动工具发现）和用于临时服务器交互的 mcporter CLI 桥接。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `mcporter` | 使用 mcporter CLI 直接列出、配置、认证和调用 MCP 服务器/工具（HTTP 或 stdio），包括临时服务器、配置编辑和 CLI/类型生成。 | `mcp/mcporter` |
| `native-mcp` | 内置 MCP（Model Context Protocol）客户端，连接到外部 MCP 服务器、发现其工具并将它们注册为原生 Hermes Agent 工具。支持 stdio 和 HTTP 传输，具有自动重连、安全过滤和零配置工具注入。 | `mcp/native-mcp` |

## media

处理媒体内容的技能——YouTube 字幕、GIF 搜索、音乐生成和音频可视化。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `gif-search` | 使用 curl 从 Tenor 搜索和下载 GIF。不依赖 curl 和 jq 之外的任何东西。可用于查找 reaction GIF、创建视觉内容和在聊天中发送 GIF。 | `media/gif-search` |
| `heartmula` | 设置和运行 HeartMuLa，开源音乐生成模型系列（Suno 风格）。通过歌词 + 标签生成完整歌曲，支持多语言。 | `media/heartmula` |
| `songsee` | 通过 CLI 从音频文件生成频谱图和音频特征可视化（mel、chroma、MFCC、tempogram 等）。用于音频分析、音乐制作调试和视觉文档。 | `media/songsee` |
| `youtube-content` | 获取 YouTube 视频字幕并将其转换为结构化内容（章节、摘要、线程、博客文章）。 | `media/youtube-content` |

## mlops

通用 ML 操作工具——模型中心管理、数据集操作和工作流程编排。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `huggingface-hub` | Hugging Face Hub CLI (hf)——搜索、下载和上传模型和数据集、管理 repos、部署推理端点。 | `mlops/huggingface-hub` |

## mlops/cloud

用于 ML 工作负载的 GPU 云提供商和无服务器计算平台。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `lambda-labs-gpu-cloud` | 用于 ML 训练和推理的预留和按需 GPU 云实例。需要专用 GPU 实例、简单 SSH 访问、持久文件系统或高性能多节点集群进行大规模训练时使用。 | `mlops/cloud/lambda-labs` |
| `modal-serverless-gpu` | 用于运行 ML 工作负载的无服务器 GPU 云平台。需要按需 GPU 访问但不想管理基础设施、将 ML 模型部署为 API 或运行具有自动扩展的批处理作业时使用。 | `mlops/cloud/modal` |

## mlops/evaluation

模型评估基准、实验跟踪、数据整理、分词器和可解释性工具。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `evaluating-llms-harness` | 在 60+ 学术基准（MMLU、HumanEval、GSM8K、TruthfulQA、HellaSwag）上评估 LLM。用于基准测试模型质量、比较模型、报告学术结果或跟踪训练进度。行业标准，被 EleutherAI、HuggingFace 和主要实验室使用。 | `mlops/evaluation/lm-evaluation-harness` |
| `huggingface-tokenizers` | 用于研究和生产的快速分词器。Rust 实现，20 秒内分词 1GB。支持 BPE、WordPiece 和 Unigram 算法。训练自定义词汇表、跟踪对齐、处理填充/截断。与 transformers 无缝集成。 | `mlops/evaluation/huggingface-tokenizers` |
| `nemo-curator` | 用于 LLM 训练的 GPU 加速数据整理。支持文本/图像/视频/音频。功能：模糊去重（16 倍快）、质量过滤（30+ 启发式）、语义去重、PII 清理、NSFW 检测。使用 RAPIDS 跨 GPU 扩展。用于准备高质量训练数据。 | `mlops/evaluation/nemo-curator` |
| `sparse-autoencoder-training` | 提供使用 SAELens 训练和分析稀疏自编码器（SAE）的指导，将神经网络激活分解为可解释特征。在发现可解释特征、分析叠加或研究语言模型中的单语义表示时使用。 | `mlops/evaluation/saelens` |
| `weights-and-biases` | 使用自动日志记录跟踪 ML 实验、实时可视化训练、使用超参数扫描优化和管理模型注册表——协作式 MLOps 平台 | `mlops/evaluation/weights-and-biases` |

## mlops/inference

模型服务、量化（GGUF/GPTQ）、结构化输出、推理优化和模型手术工具，用于部署和运行 LLM。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `gguf-quantization` | GGUF 格式和 llama.cpp 量化，用于高效的 CPU/GPU 推理。在消费者硬件、Apple Silicon 或需要灵活量化（2-8 位）且不需要 GPU 时部署模型时使用。 | `mlops/inference/gguf` |
| `guidance` | 使用 regex 和 grammar 控制 LLM 输出，保证有效的 JSON/XML/code 生成、强制结构化格式，并使用 Guidance 构建多步骤工作流程——Microsoft Research 的约束生成框架 | `mlops/inference/guidance` |
| `instructor` | 使用 Pydantic 验证从 LLM 响应中提取结构化数据，自动重试失败的提取、解析复杂 JSON 并通过 Instructor 流式传输部分结果——久经考验的结构化输出库 | `mlops/inference/instructor` |
| `llama-cpp` | 在 CPU、Apple Silicon 和消费级 GPU（无 NVIDIA 硬件）上运行 LLM 推理。用于边缘部署、M1/M2/M3 Mac、AMD/Intel GPU 或 CUDA 不可用时。支持 GGUF 量化（1.5-8 位）以降低内存和在 CPU 上比 PyTorch 快 4-10 倍。 | `mlops/inference/llama-cpp` |
| `obliteratus` | 使用 OBLITERATUS 从开放权重 LLM 中移除拒绝行为——使用机械可解释性技术（diff-in-means、SVD、whitened SVD、LEACE、SAE 分解等）切除安全guardrails，同时保留推理能力。9 个 CLI 方法、28 个分析模块、116 个模型预设 | `mlops/inference/obliteratus` |
| `outlines` | 在生成期间保证有效的 JSON/XML/code 结构，使用 Pydantic 模型进行类型安全输出、支持本地模型（Transformers、vLLM），并使用 Outlines 最大化推理速度——dottxt.ai 的结构化生成库 | `mlops/inference/outlines` |
| `serving-llms-vllm` | 使用 vLLM 的 PagedAttention 和连续批处理高吞吐量服务 LLM。用于部署生产 LLM API、优化推理延迟/吞吐量或在有限 GPU 内存下服务模型。支持 OpenAI 兼容端点、量化（GPTQ/AWQ/FP8）和 | `mlops/inference/vllm` |
| `tensorrt-llm` | 使用 NVIDIA TensorRT 优化 LLM 推理以获得最大吞吐量和最低延迟。用于在 NVIDIA GPU（A100/H100）上进行生产部署、需要比 PyTorch 快 10-100 倍的推理时，或使用量化（FP8/INT4）、飞行批处理和多… | `mlops/inference/tensorrt-llm` |

## mlops/models

特定模型架构和工具——计算机视觉（CLIP、SAM、Stable Diffusion）、语音（Whisper）、音频生成（AudioCraft）和多模态模型（LLaVA）。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `audiocraft-audio-generation` | 用于音频生成的 PyTorch 库，包括文本转音乐（MusicGen）和文本转声音（AudioGen）。需要从文本描述生成音乐、创建音效或执行旋律条件音乐生成时使用。 | `mlops/models/audiocraft` |
| `clip` | 连接视觉和语言的 OpenAI 模型。支持零样本图像分类、图像-文本匹配和跨模态检索。在 4 亿图像-文本对上训练。用于图像搜索、内容审核或无需微调的视觉-语言任务。 | `mlops/models/clip` |
| `llava** | 大语言和视觉助手。支持视觉指令调优和基于图像的对话。结合 CLIP 视觉编码器与 Vicuna/LLaMA 语言模型。支持多轮图像聊天、视觉问答和指令跟随。用于视觉-语言聊… | `mlops/models/llava` |
| `segment-anything-model` | 用于图像分割的基础模型，具有零样本迁移能力。使用点、框或掩码作为提示分割图像中的任何对象时使用，或自动生成图像中所有对象的掩码。 | `mlops/models/segment-anything` |
| `stable-diffusion-image-generation` | 使用 Stable Diffusion 模型通过 HuggingFace Diffusers 进行最先进的文本到图像生成。用于从文本提示生成图像、执行图像到图像翻译、inpainting 或构建自定义扩散流水线。 | `mlops/models/stable-diffusion` |
| `whisper` | OpenAI 的通用语音识别模型。支持 99 种语言、转录、翻译成英语和语言识别。六个模型大小，从 tiny（39M 参数）到 large（1550M 参数）。用于语音转文本、播客转录或多语言音频处理。 | `mlops/models/whisper` |

## mlops/research

用于使用声明式编程构建和优化 AI 系统的 ML 研究框架。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `dspy` | 使用声明式编程构建复杂 AI 系统，自动优化 prompts，使用 DSPy 创建模块化 RAG 系统和代理——Stanford NLP 的系统性 LM 编程框架 | `mlops/research/dspy` |

## mlops/training

用于微调 LLMs 和其他模型的 RLHF/DPO/GRPO 训练、分布式训练框架和优化工具。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `axolotl` | 使用 Axolotl 微调 LLMs 的专家指导——YAML 配置、100+ 模型、LoRA/QLoRA、DPO/KTO/ORPO/GRPO、多模态支持 | `mlops/training/axolotl` |
| `distributed-llm-pretraining-torchtitan` | 提供使用 torchtitan 进行 PyTorch 原生分布式 LLM 预训练，具有 4D 并行性（FSDP2、TP、PP、CP）。在 8 到 512+ GPU 上使用 Float8、torch.compile 和分布式检查点预训练 Llama 3.1、DeepSeek V3 或自定义模型。 | `mlops/training/torchtitan` |
| `fine-tuning-with-trl` | 使用 TRL 通过强化学习微调 LLMs——SFT 用于指令调优、DPO 用于偏好对齐、PPO/GRPO 用于奖励优化和奖励模型训练。需要 RLHF、根据偏好对齐模型或根据人类反馈训练时使用。 | `mlops/training/trl-fine-tuning` |
| `grpo-rl-training` | 使用 TRL 进行 GRPO/RL 微调的专家指导，用于推理和特定任务模型训练 | `mlops/training/grpo-rl-training` |
| `hermes-atropos-environments` | 为 Atropos 训练构建、测试和调试 Hermes Agent RL 环境。涵盖 HermesAgentBaseEnv 接口、奖励函数、代理循环集成、使用工具评估、wandb 日志记录和三个 CLI 模式（serve/process/evaluate）。创建、审查或完善 Atropos 训练环境时使用。 | `mlops/training/hermes-atropos-environments` |
| `huggingface-accelerate` | 最简单的分布式训练 API。仅需 4 行代码即可为任何 PyTorch 脚本添加分布式支持。DeepSpeed/FSDP/Megatron/DDP 统一 API。自动设备放置、混合精度（FP16/BF16/FP8）。交互式配置、单次启动命令。HuggingFace 生态系统标准。 | `mlops/training/accelerate` |
| `optimizing-attention-flash` | 使用 Flash Attention 优化 transformer attention，实现 2-4 倍加速和 10-20 倍内存降低。在长序列（>512 tokens）上训练/运行 transformers、遇到 GPU 内存问题时使用。 | `mlops/training/flash-attention` |
| `peft-fine-tuning` | 使用 LoRA、QLoRA 和 25+ 方法对 LLMs 进行参数高效微调。在 GPU 内存有限时微调大模型（7B-70B）、需要训练 <1% 参数且精度损失最小时使用。 | `mlops/training/peft` |
| `pytorch-fsdp` | 使用 PyTorch FSDP 进行完全分片数据并行训练的专家指导——参数分片、混合精度、CPU 卸载、FSDP2 | `mlops/training/pytorch-fsdp` |
| `pytorch-lightning` | 高层次 PyTorch 框架，带 Trainer 类、自动分布式训练（DDP/FSDP/DeepSpeed）、回调系统和最小样板。从笔记本扩展到超级计算机，代码相同。需要内置最佳实践的清晰训练循环时使用。 | `mlops/training/pytorch-lightning` |
| `simpo-training` | LLM 对齐的简单偏好优化。比 DPO 更好的无参考模型替代方案（AlpacaEval 2.0 上高 6.4 分）。无需参考模型，比 DPO/PPO 更高效。在想要比 DPO/PPO 更简单、更快的训练进行偏好对齐时使用。 | `mlops/training/simpo` |
| `slime-rl-training` | 提供使用 slime（Megatron+SGLang 框架）进行 LLM 后训练 RL 的指导。用于训练 GLM 模型、实现自定义数据生成工作流或需要紧密的 Megatron-LM 集成进行 RL 扩展。 | `mlops/training/slime` |
| `unsloth` | 使用 Unsloth 进行快速微调的专家指导——2-5 倍更快训练、50-80% 更少内存、LoRA/QLoRA 优化 | `mlops/training/unsloth` |

## mlops/vector-databases

用于 RAG、语义搜索和 AI 应用后端的向量相似性搜索和嵌入数据库。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `chroma` | 用于 AI 应用的开源嵌入数据库。存储嵌入和元数据、执行向量和全文搜索、按元数据过滤。简单 4 函数 API。从笔记本扩展到生产集群。用于语义搜索、RAG 应用或文档检索。 | `mlops/vector-databases/chroma` |
| `faiss` | Facebook 的高效相似性搜索和稠密向量聚类库。支持数十亿向量、GPU 加速和各种索引类型（Flat、IVF、HNSW）。用于快速 k-NN 搜索、大规模向量检索或需要纯相似性搜索时。 | `mlops/vector-databases/faiss` |
| `pinecone` | 用于生产 AI 应用的托管向量数据库。完全托管、自动扩展，具有混合搜索（稠密 + 稀疏）、元数据过滤和命名空间。低延迟（<100ms p95）。用于生产 RAG、推荐系统或大规模语义搜索。 | `mlops/vector-databases/pinecone` |
| `qdrant-vector-search` | 用于 RAG 和语义搜索的高性能向量相似性搜索引擎。用于构建需要快速最近邻搜索、带过滤的混合搜索或 Rust 驱动性能的可扩展向量存储的生产 RAG 系统。 | `mlops/vector-databases/qdrant` |

## note-taking

笔记技能，用于保存信息、协助研究以及在多会话规划和信息共享方面进行协作。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `obsidian` | 在 Obsidian 保管库中读取、搜索和创建笔记。 | `note-taking/obsidian` |

## productivity

用于文档创建、演示文稿、电子表格和其他生产力工作流程的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `google-workspace` | Gmail、日历、Drive、联系人、Sheets 和 Docs 集成，通过 Python 实现。使用带自动刷新令牌的 OAuth2。无需外部二进制文件——完全使用 Google 的 Python 客户端库在 Hermes 虚拟环境中运行。 | `productivity/google-workspace` |
| `linear` | 通过 GraphQL API 管理 Linear issues、项目和团队。创建、更新、搜索和组织 issues。 | `productivity/linear` |
| `nano-pdf` | 使用自然语言指令编辑 PDF，通过 nano-pdf CLI。修改文本、修复错别字、更新标题以及对特定页面进行内容更改，无需手动编辑。 | `productivity/nano-pdf` |
| `notion` | 通过 curl 使用 Notion API 创建和管理页面、数据库和块。直接从终端搜索、创建、更新和查询 Notion 工作区。 | `productivity/notion` |
| `ocr-and-documents` | 从 PDF 和扫描文档中提取文本。远程 URL 使用 web_extract，本地基于文本的 PDF 使用 pymupdf，OCR/扫描文档使用 marker-pdf。DOCX 使用 python-docx，PPTX 参见 powerpoint 技能。 | `productivity/ocr-and-documents` |
| `powerpoint` | "任何时候涉及 .pptx 文件都使用此技能——作为输入、输出或两者兼有。这包括：创建幻灯片、pitch deck 或演示文稿；读取、解析或从任何 .pptx 文件提取文本（即使提取的内容将在其他地方使用，例如在 a… | `productivity/powerpoint` |

## research

用于学术研究、论文发现、文献综述、领域侦察、市场数据、内容监控和科学知识检索的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `arxiv` | 使用免费的 REST API 搜索和检索 arXiv 上的学术论文。无需 API 密钥。按关键词、作者、类别或 ID 搜索。结合 web_extract 或 ocr-and-documents 技能阅读完整论文内容。 | `research/arxiv` |
| `blogwatcher` | 使用 blogwatcher CLI 监控博客和 RSS/Atom 订阅更新。添加博客、扫描新文章并跟踪已读内容。 | `research/blogwatcher` |
| `llm-wiki` | Karpathy 的 LLM Wiki——构建和维护持久的互联 markdown 知识库。摄取源、查询编译知识并检查一致性。与 RAG 不同，wiki 会编译知识一次并保持最新。可作为 Obsidian 保管库使用。通过 `skills.config.wiki.path` 配置。 | `research/llm-wiki` |
| `domain-intel` | 使用 Python stdlib 进行被动域名侦察。子域名发现、SSL 证书检查、WHOIS 查询、DNS 记录、域名可用性检查和批量多域名分析。无需 API 密钥。 | `research/domain-intel` |
| `duckduckgo-search` | 通过 DuckDuckGo 进行免费网络搜索——文本、新闻、图片、视频。无需 API 密钥。优先使用安装的 `ddgs` CLI；仅在验证当前运行时 `ddgs` 可用后才使用 Python DDGS 库。 | `research/duckduckgo-search` |
| `ml-paper-writing` | 为 NeurIPS、ICML、ICLR、ACL、AAAI、COLM 撰写可发表的 ML/AI 论文。在从研究 repos 起草论文、组织论证、验证引用或准备相机ready 提交时使用。包括 LaTeX 模板、审稿人指南和引用验证。 | `research/ml-paper-writing` |
| `polymarket` | 查询 Polymarket 预测市场数据——搜索市场、获取价格、订单簿和价格历史。通过公共 REST API 只读访问，无需 API 密钥。 | `research/polymarket` |

## red-teaming

用于 LLM 红队、越狱和安全过滤器绕过研究的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `godmode` | 使用 G0DM0D3 技术对 API 服务的 LLM 进行越狱——Parseltongue 输入混淆（33 种技术）、GODMODE CLASSIC 系统提示模板、ULTRAPLINIAN 多模型竞速、编码升级和 Hermes 原生 prefill/系统提示集成。适用于任何可通过 API 访问的模型，包括闭源模型。 | `red-teaming/godmode` |

## smart-home

用于控制智能家居设备——灯、开关、传感器和家庭自动化系统的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `openhue` | 通过 OpenHue CLI 控制飞利浦 Hue 灯、房间和场景。开关灯、调节亮度、颜色、色温和激活场景。 | `smart-home/openhue` |

## social-media

用于与社交平台互动——发帖、阅读、监控和账户操作的技能。

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `xitter` | 使用官方 X API 凭证通过 x-cli 终端客户端与 X/Twitter 互动。 | `social-media/xitter` |

## software-development

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `code-review` | 进行以安全和质量为重点的彻底代码审查的指南 | `software-development/code-review` |
| `plan` | Hermes 的计划模式——检查上下文、将 markdown 计划写入活动 workspace/backend 工作目录中的 `.hermes/plans/`，但不执行工作。 | `software-development/plan` |
| `requesting-code-review` | 在完成任务、实现主要功能或合并前使用。通过系统化审查流程验证工作是否符合要求。 | `software-development/requesting-code-review` |
| `subagent-driven-development` | 在执行具有独立任务的实现计划时使用。每个任务通过两阶段审查（规范合规性然后代码质量）分派新的 delegate_task。 | `software-development/subagent-driven-development` |
| `systematic-debugging` | 在遇到任何 bug、测试失败或意外行为时使用。4 阶段根本原因调查——在理解问题之前不进行任何修复。 | `software-development/systematic-debugging` |
| `test-driven-development` | 在实现任何功能或 bug 修复时、编写实现代码之前使用。强制执行 RED-GREEN-REFACTOR 循环和测试优先方法。 | `software-development/test-driven-development` |
| `writing-plans` | 在有多步骤任务规范或需求时使用。创建包含小任务、准确文件路径和完整代码示例的全面实现计划。 | `software-development/writing-plans` |

---

# 可选技能

可选技能随仓库一起发布，位于 `optional-skills/` 下，但**默认不激活**。它们涵盖较重或小众的用例。使用以下命令安装：

```bash
hermes skills install official/<category>/<skill>
```

## autonomous-ai-agents

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `blackbox` | 将编码任务委托给 Blackbox AI CLI 代理。多模型代理，内置 judge 通过多个 LLM 运行任务并选择最佳结果。需要 blackbox CLI 和 Blackbox AI API 密钥。 | `autonomous-ai-agents/blackbox` |

## blockchain

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `base` | 查询 Base（以太坊 L2）区块链数据，包含 USD 价格——钱包余额、代币信息、交易详情、gas 分析、合约检查、鲸鱼检测和实时网络统计。使用 Base RPC + CoinGecko。无需 API 密钥。 | `blockchain/base` |
| `solana` | 查询 Solana 区块链数据，包含 USD 价格——钱包余额、代币组合（带估值）、交易详情、NFT、鲸鱼检测和实时网络统计。使用 Solana RPC + CoinGecko。无需 API 密钥。 | `blockchain/solana` |

## creative

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `blender-mcp` | 通过 socket 连接 blender-mcp 插件直接从 Hermes 控制 Blender。创建 3D 对象、材质、动画，并运行任意 Blender Python (bpy) 代码。 | `creative/blender-mcp` |
| `meme-generation` | 通过选择模板并使用 Pillow 叠加文字生成真实 meme 图像。生成实际的 .png meme 文件。 | `creative/meme-generation` |

## devops

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `docker-management` | 管理 Docker 容器、镜像、卷、网络和 Compose 堆栈——生命周期操作、调试、清理和 Dockerfile 优化。 | `devops/docker-management` |

## email

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `agentmail` | 通过 AgentMail 为代理提供专属邮箱。通过代理拥有的邮箱地址（例如 hermes-agent@agentmail.to）自主发送、接收和管理邮件。 | `email/agentmail` |

## health

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `neuroskill-bci` | 连接到运行的 NeuroSkill 实例并将用户实时认知和情绪状态（专注、放松、情绪、认知负荷、困倦、心率、HRV、睡眠分期和 40+ 衍生 EXG 分数）纳入响应。需要 BCI 可穿戴设备（Muse 2/S 或 OpenBCI）和 NeuroSkill 桌面应用。 | `health/neuroskill-bci` |

## mcp

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `fastmcp` | 使用 FastMCP 在 Python 中构建、测试、检查、安装和部署 MCP 服务器。在创建新 MCP 服务器、将 API 或数据库包装为 MCP 工具、暴露资源或 prompts 或准备 HTTP 部署的 FastMCP 服务器时使用。 | `mcp/fastmcp` |

## migration

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `openclaw-migration` | 将用户的 OpenClaw 自定义足迹迁移到 Hermes Agent。从 ~/.openclaw 导入与 Hermes 兼容的 memories、SOUL.md、命令允许列表、用户技能和选定的 workspace 资源，然后报告无法迁移的内容及原因。 | `migration/openclaw-migration` |

## productivity

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `telephony` | 为 Hermes 提供电话能力——配置和保持 Twilio 号码、发送和接收 SMS/MMS、进行直接通话，并通过 Bland.ai 或 Vapi 进行 AI 驱动的外呼。 | `productivity/telephony` |

## research

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `bioinformatics` | 通往 400+ 生物信息学技能的网关，来自 bioSkills 和 ClawBio。涵盖基因组学、转录组学、单细胞、变异调用、药物基因组学、宏基因组学、结构生物学等。 | `research/bioinformatics` |
| `qmd` | 使用 qmd 本地搜索个人知识库、笔记、文档和会议记录——具有 BM25、向量搜索和 LLM 重排的混合检索引擎。支持 CLI 和 MCP 集成。 | `research/qmd` |

## security

| 技能 | 描述 | 路径 |
|-------|-------------|------|
| `1password` | 设置和使用 1Password CLI (op)。在安装 CLI、启用桌面应用集成、登录以及读取/注入命令密钥时使用。 | `security/1password` |
| `oss-forensics` | 供应链调查、证据恢复和 GitHub 仓库取证分析。涵盖已删除提交恢复、force-push 检测、IOC 提取、多源证据收集和结构化取证报告。 | `security/oss-forensics` |
| `sherlock` | 在 400+ 社交网络上进行 OSINT 用户名搜索。通过用户名追踪社交媒体账号。 | `security/sherlock` |