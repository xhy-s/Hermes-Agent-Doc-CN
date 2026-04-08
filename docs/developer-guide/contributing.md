---
sidebar_position: 4
title: "贡献指南"
description: "如何为 Hermes Agent 做贡献 — 开发设置、代码风格、PR 流程"
---

# 贡献指南

感谢你为 Hermes Agent 做贡献！本指南涵盖设置开发环境、了解代码库以及让你的 PR 合并。

## 贡献优先级

我们按以下顺序重视贡献：

1. **Bug 修复** — 崩溃、错误行为、数据丢失
2. **跨平台兼容性** — macOS、不同 Linux 发行版、WSL2
3. **安全加固** — shell 注入、prompt 注入、路径遍历
4. **性能和健壮性** — 重试逻辑、错误处理、优雅降级
5. **新 skills** — 广泛有用的（见 [创建 Skills](creating-skills.md)）
6. **新工具** — 很少需要；大多数能力应该是 skills
7. **文档** — 修复、澄清、新示例

## 常见贡献路径

- 构建新工具？从 [添加工具](./adding-tools.md) 开始
- 构建新 skill？从 [创建 Skills](./creating-skills.md) 开始
- 构建新推理 provider？从 [添加 Providers](./adding-providers.md) 开始

## 开发设置

### 前置要求

| 要求 | 说明 |
|-------------|-------|
| **Git** | 支持 `--recurse-submodules` |
| **Python 3.11+** | uv 会在缺失时安装 |
| **uv** | 快速 Python 包管理器（[安装](https://docs.astral.sh/uv/)） |
| **Node.js 18+** | 可选 — 需要浏览器工具和 WhatsApp bridge |

### 克隆和安装

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git
cd hermes-agent

# 使用 Python 3.11 创建 venv
uv venv venv --python 3.11
export VIRTUAL_ENV="$(pwd)/venv"

# 安装所有额外依赖（消息、cron、CLI 菜单、开发工具）
uv pip install -e ".[all,dev]"
uv pip install -e "./tinker-atropos"

# 可选：浏览器工具
npm install
```

### 配置开发

```bash
mkdir -p ~/.hermes/{cron,sessions,logs,memories,skills}
cp cli-config.yaml.example ~/.hermes/config.yaml
touch ~/.hermes/.env

# 至少添加一个 LLM provider 密钥：
echo 'OPENROUTER_API_KEY=sk-or-v1-your-key' >> ~/.hermes/.env
```

### 运行

```bash
# 创建全局访问符号链接
mkdir -p ~/.local/bin
ln -sf "$(pwd)/venv/bin/hermes" ~/.local/bin/hermes

# 验证
hermes doctor
hermes chat -q "Hello"
```

### 运行测试

```bash
pytest tests/ -v
```

## 代码风格

- **PEP 8**，有实际例外（无严格行长度强制）
- **注释**：仅在解释非显而易见的意图、权衡或 API 怪癖时
- **错误处理**：捕获特定异常。对意外错误使用 `logger.warning()`/`logger.error()` 并带 `exc_info=True`
- **跨平台**：永远不要假设 Unix（见下文）
- **Profile 安全路径**：永远不要硬编码 `~/.hermes` — 使用 `hermes_constants` 的 `get_hermes_home()` 用于代码路径，使用 `display_hermes_home()` 用于面向用户的消息。见 [AGENTS.md](https://github.com/NousResearch/hermes-agent/blob/main/AGENTS.md#profiles-multi-instance-support) 获取完整规则。

## 跨平台兼容性

Hermes 正式支持 Linux、macOS 和 WSL2。本机 Windows **不受支持**，但代码库包含一些防御性编码模式以避免边缘情况下的硬崩溃。关键规则：

### 1. `termios` 和 `fcntl` 是 Unix 专用

始终同时捕获 `ImportError` 和 `NotImplementedError`：

```python
try:
    from simple_term_menu import TerminalMenu
    menu = TerminalMenu(options)
    idx = menu.show()
except (ImportError, NotImplementedError):
    # 回退：编号菜单
    for i, opt in enumerate(options):
        print(f"  {i+1}. {opt}")
    idx = int(input("Choice: ")) - 1
```

### 2. 文件编码

某些环境可能以非 UTF-8 编码保存 `.env` 文件：

```python
try:
    load_dotenv(env_path)
except UnicodeDecodeError:
    load_dotenv(env_path, encoding="latin-1")
```

### 3. 进程管理

`os.setsid()`、`os.killpg()` 和信号处理在不同平台不同：

```python
import platform
if platform.system() != "Windows":
    kwargs["preexec_fn"] = os.setsid
```

### 4. 路径分隔符

使用 `pathlib.Path` 而不是带 `/` 的字符串连接。

## 安全注意事项

Hermes 有终端访问权限。安全很重要。

### 现有保护

| 层 | 实现 |
|-------|---------------|
| **Sudo 密码管道** | 使用 `shlex.quote()` 防止 shell 注入 |
| **危险命令检测** | `tools/approval.py` 中的正则表达式模式，带用户批准流程 |
| **Cron prompt 注入** | 扫描器阻止指令覆盖模式 |
| **写入拒绝列表** | 通过 `os.path.realpath()` 解析保护路径以防止符号链接绕过 |
| **Skills 防护** | Hub 安装的 skills 安全扫描器 |
| **代码执行沙箱** | 子进程运行时剥离 API 密钥 |
| **容器加固** | Docker：丢弃所有能力、无权限提升、PID 限制 |

### 贡献安全敏感代码

- 将用户输入插入 shell 命令时始终使用 `shlex.quote()`
- 在访问控制检查之前使用 `os.path.realpath()` 解析符号链接
- 不要记录 secrets
- 在工具执行周围捕获广泛异常
- 如果你的更改涉及文件路径或进程，在所有平台上测试

## Pull Request 流程

### 分支命名

```
fix/description        # Bug 修复
feat/description       # 新功能
docs/description       # 文档
test/description       # 测试
refactor/description   # 代码重构
```

### 提交前

1. **运行测试**：`pytest tests/ -v`
2. **手动测试**：运行 `hermes` 并使用你更改的代码路径
3. **检查跨平台影响**：考虑 macOS 和不同 Linux 发行版
4. **保持 PR 专注**：每个 PR 一个逻辑更改

### PR 描述

包括：
- **什么**改变了以及**为什么**
- **如何测试**它
- **你在哪些平台**上测试过
- 引用任何相关 issues

### 提交消息

我们使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <description>
```

| 类型 | 用于 |
|------|------|
| `fix` | Bug 修复 |
| `feat` | 新功能 |
| `docs` | 文档 |
| `test` | 测试 |
| `refactor` | 代码重构 |
| `chore` | 构建、CI、依赖更新 |

作用域：`cli`、`gateway`、`tools`、`skills`、`agent`、`install`、`whatsapp`、`security`

示例：
```
fix(cli): prevent crash in save_config_value when model is a string
feat(gateway): add WhatsApp multi-user session isolation
fix(security): prevent shell injection in sudo password piping
```

## 报告 Issues

- 使用 [GitHub Issues](https://github.com/NousResearch/hermes-agent/issues)
- 包括：OS、Python 版本、Hermes 版本（`hermes version`）、完整错误追踪
- 包括重现步骤
- 在创建重复项之前检查现有 issues
- 对于安全漏洞，请私下报告

## 社区

- **Discord**：[discord.gg/NousResearch](https://discord.gg/NousResearch)
- **GitHub Discussions**：用于设计提案和架构讨论
- **Skills Hub**：上传专门的 skills 并与社区分享

## 许可证

通过贡献，你同意你的贡献将根据 [MIT 许可证](https://github.com/NousResearch/hermes-agent/blob/main/LICENSE) 获得许可。
