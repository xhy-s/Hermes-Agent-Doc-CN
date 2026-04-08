---
title: "Provider 路由"
description: "配置 OpenRouter provider 偏好以优化成本、速度或质量"
sidebar_label: "Provider 路由"
sidebar_position: 7
---

# Provider 路由

当使用 [OpenRouter](https://openrouter.ai) 作为您的 LLM provider 时，Hermes Agent 支持 **provider 路由** — 对哪个底层 AI provider 处理您的请求以及如何优先处理进行精细控制。

OpenRouter 将请求路由到许多 provider（例如 Anthropic、Google、AWS Bedrock、Together AI）。Provider 路由让您可以优化成本、速度、质量，或强制执行特定 provider 要求。

## 配置

在您的 `~/.hermes/config.yaml` 中添加 `provider_routing` 部分：

```yaml
provider_routing:
  sort: "price"           # 如何排名 provider
  only: []                # 白名单：仅使用这些 provider
  ignore: []              # 黑名单：永不使用这些 provider
  order: []               # 明确的 provider 优先级顺序
  require_parameters: false  # 仅使用支持所有参数的 provider
  data_collection: null   # 控制数据收集（"allow" 或 "deny"）
```

:::info
Provider 路由仅在使用 OpenRouter 时适用。它对直接 provider 连接（例如直接连接到 Anthropic API）没有影响。
:::

## 选项

### `sort`

控制 OpenRouter 如何为您的请求排名可用 provider。

| 值 | 描述 |
|-------|-------------|
| `"price"` | 最便宜的 provider 优先 |
| `"throughput"` | 每秒最快 token 优先 |
| `"latency"` | 首个 token 最低延迟优先 |

```yaml
provider_routing:
  sort: "price"
```

### `only`

Provider 名称的白名单。设置后，**仅**这些 provider 将被使用。所有其他都被排除。

```yaml
provider_routing:
  only:
    - "Anthropic"
    - "Google"
```

### `ignore`

Provider 名称的黑名单。这些 provider **永不使用**，即使它们提供最便宜或最快的选项。

```yaml
provider_routing:
  ignore:
    - "Together"
    - "DeepInfra"
```

### `order`

明确的优先级顺序。列在前面的 provider 优先。未列出的 provider 作为备用。

```yaml
provider_routing:
  order:
    - "Anthropic"
    - "Google"
    - "AWS Bedrock"
```

### `require_parameters`

当为 `true` 时，OpenRouter 将仅路由到支持您请求中**所有**参数的 provider（如 `temperature`、`top_p`、`tools` 等）。这避免静默参数丢弃。

```yaml
provider_routing:
  require_parameters: true
```

### `data_collection`

控制 provider 是否可以使用您的提示进行训练。选项为 `"allow"` 或 `"deny"`。

```yaml
provider_routing:
  data_collection: "deny"
```

## 实际示例

### 优化成本

路由到最便宜的可用 provider。适合高容量使用和开发：

```yaml
provider_routing:
  sort: "price"
```

### 优化速度

为交互使用优先选择低延迟 provider：

```yaml
provider_routing:
  sort: "latency"
```

### 优化吞吐量

适合长篇生成，其中每秒 token 很重要：

```yaml
provider_routing:
  sort: "throughput"
```

### 锁定到特定 Provider

确保所有请求通过特定 provider 以保持一致性：

```yaml
provider_routing:
  only:
    - "Anthropic"
```

### 避免特定 Provider

排除您不想使用的 provider（例如出于数据隐私）：

```yaml
provider_routing:
  ignore:
    - "Together"
    - "Lepton"
  data_collection: "deny"
```

### 首选顺序与备用

首先尝试您的首选 provider，如果不可用则回退到其他：

```yaml
provider_routing:
  order:
    - "Anthropic"
    - "Google"
  require_parameters: true
```

## 工作原理

Provider 路由偏好通过 `extra_body.provider` 字段在每个 API 调用时传递给 OpenRouter。这适用于两者：

- **CLI 模式** — 在 `~/.hermes/config.yaml` 中配置，启动时加载
- **网关模式** — 相同的配置文件，网关启动时加载

路由配置从 `config.yaml` 读取，并在创建 `AIAgent` 时作为参数传递：

```
providers_allowed  ← 来自 provider_routing.only
providers_ignored  ← 来自 provider_routing.ignore
providers_order    ← 来自 provider_routing.order
provider_sort      ← 来自 provider_routing.sort
provider_require_parameters ← 来自 provider_routing.require_parameters
provider_data_collection    ← 来自 provider_routing.data_collection
```

:::tip
您可以组合多个选项。例如，按价格排序但排除某些 provider 并要求参数支持：

```yaml
provider_routing:
  sort: "price"
  ignore: ["Together"]
  require_parameters: true
  data_collection: "deny"
```
:::

## 默认行为

当未配置 `provider_routing` 部分时（默认），OpenRouter 使用其自己的默认路由逻辑，通常自动平衡成本和可用性。

:::tip Provider 路由与备用模型
Provider 路由控制哪些**OpenRouter 内的 sub-provider** 处理您的请求。关于在您的首选模型失败时自动故障转移到完全不同 provider，参见[备用 Provider](/docs/user-guide/features/fallback-providers)。
:::
