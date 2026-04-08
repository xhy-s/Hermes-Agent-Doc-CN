---
sidebar_position: 5
title: "添加提供者"
description: "如何为 Hermes Agent 添加新的推理提供者 — auth、运行时解析、CLI 流程、适配器、测试和文档"
---

# 添加提供者

Hermes 已经可以通过自定义 provider 路径与任何 OpenAI 兼容端点通信。除非你想要该服务的第一类 UX，否则不要添加内置 provider：

- provider 特定的 auth 或 token 刷新
- 精选的模型目录
- setup / `hermes model` 菜单条目
- `provider:model` 语法的 provider 别名
- 需要适配器的非 OpenAI API 形状

如果 provider 只是"另一个 OpenAI 兼容 base URL 和 API 密钥"，命名自定义 provider 可能就足够了。

## 心理模型

内置 provider 必须在多个层上对齐：

1. `hermes_cli/auth.py` 决定如何找到凭证。
2. `hermes_cli/runtime_provider.py` 将其转换为运行时数据：
   - `provider`
   - `api_mode`
   - `base_url`
   - `api_key`
   - `source`
3. `run_agent.py` 使用 `api_mode` 决定如何构建和发送请求。
4. `hermes_cli/models.py` 和 `hermes_cli/main.py` 使 provider 出现在 CLI 中。（`hermes_cli/setup.py` 自动委托给 `main.py` —那里不需要更改。）
5. `agent/auxiliary_client.py` 和 `agent/model_metadata.py` 保持辅助任务和 token 预算工作。

重要的抽象是 `api_mode`。

- 大多数 provider 使用 `chat_completions`。
- Codex 使用 `codex_responses`。
- Anthropic 使用 `anthropic_messages`。
- 新的非 OpenAI 协议通常意味着添加新适配器和新 `api_mode` 分支。

## 首先选择实现路径

### 路径 A — OpenAI 兼容 provider

当 provider 接受标准 chat-completions 风格请求时使用此。

典型工作：

- 添加 auth 元数据
- 添加模型目录 / 别名
- 添加运行时解析
- 添加 CLI 菜单接线
- 添加 aux-model 默认值
- 添加测试和用户文档

你通常不需要新适配器或新 `api_mode`。

### 路径 B — 原生 provider

当 provider 的行为不像 OpenAI chat completions 时使用。

当前树中的示例：

- `codex_responses`
- `anthropic_messages`

此路径包括路径 A 的所有内容加上：

- 在 `agent/` 中的 provider 适配器
- `run_agent.py` 中用于请求构建、分发、使用提取、中断处理和响应规范化的分支
- 适配器测试

## 文件检查清单

### 每个内置 provider 都需要

1. `hermes_cli/auth.py`
2. `hermes_cli/models.py`
3. `hermes_cli/runtime_provider.py`
4. `hermes_cli/main.py`
5. `agent/auxiliary_client.py`
6. `agent/model_metadata.py`
7. tests
8. `website/docs/` 下的用户文档

:::tip
`hermes_cli/setup.py` **不需要**更改。设置向导委托 provider/model 选择到 `main.py` 中的 `select_provider_and_model()` — 那里添加的任何 provider 自动在 `hermes setup` 中可用。
:::

### 原生 / 非 OpenAI provider 额外添加

10. `agent/<provider>_adapter.py`
11. `run_agent.py`
12. `pyproject.toml`（如果需要 provider SDK）

## 步骤 1：选择一个规范 provider id

选择一个 provider id 并在各处使用。

树中的示例：

- `openai-codex`
- `kimi-coding`
- `minimax-cn`

相同的 id 应该出现在：

- `hermes_cli/auth.py` 中的 `PROVIDER_REGISTRY`
- `hermes_cli/models.py` 中的 `_PROVIDER_LABELS`
- `hermes_cli/auth.py` 和 `hermes_cli/models.py` 中的 `_PROVIDER_ALIASES`
- `hermes_cli/main.py` 中的 CLI `--provider` 选项
- setup / model 选择分支
- aux-model 默认值
- tests

如果 id 在这些文件之间不同，provider 会感觉像是半接线的：auth 可能工作而 `/model`、setup 或运行时解析静默错过。

## 步骤 2：在 `hermes_cli/auth.py` 中添加 auth 元数据

对于 API 密钥 provider，在 `PROVIDER_REGISTRY` 中添加 `ProviderConfig` 条目，包含：

- `id`
- `name`
- `auth_type="api_key"`
- `inference_base_url`
- `api_key_env_vars`
- 可选的 `base_url_env_var`

还要添加别名到 `_PROVIDER_ALIASES`。

使用现有 provider 作为模板：

- 简单 API 密钥路径：Z.AI、MiniMax
- 带端点检测的 API 密钥路径：Kimi、Z.AI
- 原生 token 解析：Anthropic
- OAuth / auth-store 路径：Nous、OpenAI Codex

这里要回答的问题：

- Hermes 应该检查哪些 env vars，优先级顺序是什么？
- Provider 需要 base URL 覆盖吗？
- 它需要端点探测或 token 刷新吗？
- 凭证缺失时 auth 错误应该说什么？

如果 provider 需要不仅仅是"查找 API 密钥"，添加专用凭证解析器而不是将逻辑塞进无关分支。

## 步骤 3：在 `hermes_cli/models.py` 中添加模型目录和别名

更新 provider 目录以使 provider 在菜单和 `provider:model` 语法中工作。

典型编辑：

- `_PROVIDER_MODELS`
- `_PROVIDER_LABELS`
- `_PROVIDER_ALIASES`
- `list_available_providers()` 中的 provider 显示顺序
- 如果 provider 支持 live `/models` 获取，则为 `provider_model_ids()`

如果 provider 暴露 live 模型列表，优先使用它并将 `_PROVIDER_MODELS` 作为静态回退保留。

这个文件也使这些输入工作：

```text
anthropic:claude-sonnet-4-6
kimi:model-name
```

如果别名这里缺失，provider 可能正确认证但在 `/model` 解析中仍然静默失败。

## 步骤 4：在 `hermes_cli/runtime_provider.py` 中解析运行时数据

`resolve_runtime_provider()` 是 CLI、gateway、cron、ACP 和辅助客户端使用的共享路径。

添加一个分支返回至少包含以下内容的字典：

```python
{
    "provider": "your-provider",
    "api_mode": "chat_completions",  # 或你的原生模式
    "base_url": "https://...",
    "api_key": "...",
    "source": "env|portal|auth-store|explicit",
    "requested_provider": requested_provider,
}
```

如果 provider 是 OpenAI 兼容的，`api_mode` 通常应该保持 `chat_completions`。

小心 API 密钥优先级。Hermes 已经包含逻辑避免将 OpenRouter 密钥泄露到无关端点。新 provider 应该同样明确哪个密钥发送到哪个 base URL。

## 步骤 5：在 `hermes_cli/main.py` 中接线 CLI

除非 provider 显示在交互式 `hermes model` 流程中，否则它是不可发现的。

在 `hermes_cli/main.py` 中更新这些：

- `provider_labels` 字典
- `select_provider_and_model()` 中的 `providers` 列表
- provider 分发（`if selected_provider == ...`）
- `--provider` 参数选项
- 如果 provider 支持这些流程则添加 login/logout 选项
- `_model_flow_<provider>()` 函数，或者如果适合则重用 `_model_flow_api_key_provider()`

:::tip
`hermes_cli/setup.py` 不需要更改 — 它从 `main.py` 调用 `select_provider_and_model()`，所以你的新 provider 自动在 `hermes model` 和 `hermes setup` 中都出现。
:::

## 步骤 6：保持辅助调用工作

这里有两个重要文件：

### `agent/auxiliary_client.py`

如果这是直接 API 密钥 provider，添加一个廉价/快速默认 aux 模型到 `_API_KEY_PROVIDER_AUX_MODELS`。

辅助任务包括：

- 视觉摘要
- Web 提取摘要
- 上下文压缩摘要
- 会话搜索摘要
- 记忆刷新

如果 provider 没有合理的 aux 默认，辅助任务可能回退糟糕或意外使用昂贵的主模型。

### `agent/model_metadata.py`

添加 provider 模型的上下文长度以使 token 预算、压缩阈值和限制保持正常。

## 步骤 7：如果 provider 是原生的，添加适配器和 `run_agent.py` 支持

如果 provider 不是普通 chat completions，在 `agent/<provider>_adapter.py` 中隔离 provider 特定逻辑。

保持 `run_agent.py` 专注于编排。它应该调用适配器辅助函数，而不是在线到处内联构建 provider 负载。

原生 provider 通常在这些地方需要工作：

### 新适配器文件

典型职责：

- 构建 SDK / HTTP 客户端
- 解析 token
- 将 OpenAI 风格的对话消息转换为 provider 的请求格式
- 如需要则转换工具 schema
- 将 provider 响应规范化为 `run_agent.py` 期望的格式
- 提取 usage 和 finish-reason 数据

### `run_agent.py`

搜索 `api_mode` 并审计每个切换点。至少验证：

- `__init__` 选择新的 `api_mode`
- 客户端构建适用于 provider
- `_build_api_kwargs()` 知道如何格式化请求
- `_api_call_with_interrupt()` 分发到正确的客户端调用
- 中断 / 客户端重建路径工作
- 响应验证接受 provider 的形状
- finish-reason 提取正确
- token 使用提取正确
- 回退模型激活可以干净地切换到新 provider
- 摘要生成和记忆刷新路径仍然工作

还要搜索 `run_agent.py` 中的 `self.client.`。任何假设标准 OpenAI 客户端存在的代码路径在原生 provider 使用不同客户端对象或 `self.client = None` 时可能崩溃。

### Prompt 缓存和 provider 特定请求字段

Prompt 缓存和 provider 特定旋钮容易回归。

树中已有的示例：

- Anthropic 有原生 prompt 缓存路径
- OpenRouter 获取 provider 路由字段
- 不是每个 provider 都应该接收每个请求侧选项

当你添加原生 provider 时，仔细检查 Hermes 只发送该 provider 实际理解的字段。

## 步骤 8：测试

至少触及守卫 provider 接线的测试。

常见位置：

- `tests/test_runtime_provider_resolution.py`
- `tests/test_cli_provider_resolution.py`
- `tests/test_cli_model_command.py`
- `tests/test_setup_model_selection.py`
- `tests/test_provider_parity.py`
- `tests/test_run_agent.py`
- 原生 provider 的 `tests/test_<provider>_adapter.py`

对于仅文档的示例，确切的测试文件集可能不同。要点是覆盖：

- auth 解析
- CLI 菜单 / provider 选择
- 运行时 provider 解析
- agent 执行路径
- provider:model 解析
- 任何适配器特定的消息转换

使用禁用的 xdist 运行测试：

```bash
source venv/bin/activate
python -m pytest tests/test_runtime_provider_resolution.py tests/test_cli_provider_resolution.py tests/test_cli_model_command.py tests/test_setup_model_selection.py -n0 -q
```

推送前运行完整套件：

```bash
source venv/bin/activate
python -m pytest tests/ -n0 -q
```

## 步骤 9：Live 验证

测试后，运行真实冒烟测试。

```bash
source venv/bin/activate
python -m hermes_cli.main chat -q "Say hello" --provider your-provider --model your-model
```

如果你改了菜单，也测试交互流程：

```bash
source venv/bin/activate
python -m hermes_cli.main model
python -m hermes_cli.main setup
```

对于原生 provider，至少验证一个工具调用，而不仅仅是纯文本响应。

## 步骤 10：更新用户文档

如果 provider 旨在作为第一类选项发布，也要更新用户文档：

- `website/docs/getting-started/quickstart.md`
- `website/docs/user-guide/configuration.md`
- `website/docs/reference/environment-variables.md`

开发者可能完美接线 provider 但仍然让用户无法发现所需的 env vars 或设置流程。

## OpenAI 兼容 provider 检查清单

如果 provider 是标准 chat completions，使用此。

- [ ] `hermes_cli/auth.py` 中的 `ProviderConfig` 已添加
- [ ] `hermes_cli/auth.py` 和 `hermes_cli/models.py` 中的别名已添加
- [ ] `hermes_cli/models.py` 中的模型目录已添加
- [ ] `hermes_cli/runtime_provider.py` 中的运行时分支已添加
- [ ] `hermes_cli/main.py` 中的 CLI 接线已添加（setup.py 自动继承）
- [ ] `agent/auxiliary_client.py` 中的 aux 模型已添加
- [ ] `agent/model_metadata.py` 中的上下文长度已添加
- [ ] 运行时 / CLI 测试已更新
- [ ] 用户文档已更新

## 原生 provider 检查清单

当 provider 需要新协议路径时使用。

- [ ] OpenAI 兼容检查清单中的所有内容
- [ ] `agent/<provider>_adapter.py` 中的适配器已添加
- [ ] `run_agent.py` 中支持新的 `api_mode`
- [ ] 中断 / 重建路径工作
- [ ] usage 和 finish-reason 提取工作
- [ ] 回退路径工作
- [ ] 适配器测试已添加
- [ ] live 冒烟测试通过

## 常见陷阱

### 1. 添加 provider 到 auth 但不添加到模型解析

这使得凭证正确解析而 `/model` 和 `provider:model` 输入失败。

### 2. 忘记 `config["model"]` 可以是字符串或字典

很多 provider 选择代码必须规范化两种形式。

### 3. 假设内置 provider 是必需的

如果服务只是 OpenAI 兼容的，自定义 provider 可能已经用更少的维护解决了用户问题。

### 4. 忘记辅助路径

主聊天路径可能工作而摘要、记忆刷新或视觉辅助失败，因为 aux 路由从未更新。

### 5. `run_agent.py` 中隐藏的原生 provider 分支

搜索 `api_mode` 和 `self.client.`。不要假设明显的请求路径是唯一的。

### 6. 向其他 provider 发送 OpenRouter 专用旋钮

像 provider 路由这样的字段只属于支持它们的 provider。

### 7. 更新 `hermes model` 但不更新 `hermes setup`

两个流程都需要知道 provider。

## 实现时的好搜索目标

如果你在追踪 provider 触及的所有地方，搜索这些符号：

- `PROVIDER_REGISTRY`
- `_PROVIDER_ALIASES`
- `_PROVIDER_MODELS`
- `resolve_runtime_provider`
- `_model_flow_`
- `select_provider_and_model`
- `api_mode`
- `_API_KEY_PROVIDER_AUX_MODELS`
- `self.client.`

## 相关文档

- [提供者运行时解析](./provider-runtime.md)
- [架构](./architecture.md)
- [贡献](./contributing.md)
