---
sidebar_position: 99
title: "Honcho 记忆"
description: "通过 Honcho 实现 AI 原生持久化记忆 — 辩证推理、多代理用户建模和深度个性化"
---

# Honcho 记忆

[Honcho](https://github.com/plastic-labs/honcho) 是一个 AI 原生记忆后端，在 Hermes 内置记忆系统之上添加了辩证推理和深度用户建模。与简单的键值存储不同，Honcho 通过在对话发生后对对话进行推理来维护关于用户是谁的运行模型 — 他们的偏好、沟通风格、目标和模式。

:::info Honcho 是一个记忆 Provider 插件
Honcho 集成到[记忆 Provider](./memory-providers.md) 系统中。以下所有功能都通过统一的记忆 provider 接口可用。
:::

## Honcho 添加了什么

| 能力 | 内置记忆 | Honcho |
|-----------|----------------|--------|
| 跨会话持久化 | ✔ 基于文件的 MEMORY.md/USER.md | ✔ 服务器端带 API |
| 用户画像 | ✔ 手动代理策划 | ✔ 自动辩证推理 |
| 多代理隔离 | — | ✔ 每个对等体的配置文件分离 |
| 观察模式 | — | ✔ 统一或方向性观察 |
| 结论（派生洞察） | — | ✔ 关于模式的服务器端推理 |
| 历史搜索 | ✔ FTS5 会话搜索 | ✔ 对结论和观察的语义搜索 |

**辩证推理**：每次对话后，Honcho 分析交流并得出"结论" — 关于用户偏好、习惯和目标的洞察。这些结论随着时间的推移而积累，使代理能够深化理解，超出用户明确表达的内容。

**多代理画像**：当多个 Hermes 实例与同一用户交谈时（例如编码助手和个人助理），Honcho 维护单独的"对等体"画像。每个对等体只看到自己的观察和结论，防止上下文的交叉污染。

## 设置

```bash
hermes memory setup    # 从 provider 列表中选择 "honcho"
```

或手动配置：

```yaml
# ~/.hermes/config.yaml
memory:
  provider: honcho
```

```bash
echo "HONCHO_API_KEY=your-key" >> ~/.hermes/.env
```

在 [honcho.dev](https://honcho.dev) 获取 API 密钥。

## 配置选项

```yaml
# ~/.hermes/config.yaml
honcho:
  observation: directional    # "unified"（新安装默认）或 "directional"
  peer_name: ""               # 从平台自动检测，或手动设置
```

**观察模式：**
- `unified` — 所有观察进入单个池。更简单，适合单代理设置。
- `directional` — 观察带有方向标记（user→agent、agent→user）。支持更丰富的对话动态分析。

## 工具

当 Honcho 作为记忆 provider 处于活动状态时，四个额外的工具变得可用：

| 工具 | 功能 |
|------|---------|
| `honcho_conclude` | 在最近的对话上触发服务器端辩证推理 |
| `honcho_context` | 从 Honcho 的记忆中检索当前对话的相关上下文 |
| `honcho_profile` | 查看或更新用户的 Honcho 画像 |
| `honcho_search` | 在所有存储的结论和观察中进行语义搜索 |

## CLI 命令

```bash
hermes honcho status          # 显示连接状态和配置
hermes honcho peer            # 为多代理设置更新对等体名称
```

## 从 `hermes honcho` 迁移

如果您以前使用独立的 `hermes honcho setup`：

1. 您现有的配置（`honcho.json` 或 `~/.honcho/config.json`）被保留
2. 您的服务器端数据（记忆、结论、用户画像）完好无损
3. 在 config.yaml 中设置 `memory.provider: honcho` 以重新激活

无需重新登录或重新设置。运行 `hermes memory setup` 并选择"honcho" — 向导会检测您现有的配置。

## 完整文档

参见[记忆 Provider — Honcho](./memory-providers.md#honcho) 获取完整参考。
