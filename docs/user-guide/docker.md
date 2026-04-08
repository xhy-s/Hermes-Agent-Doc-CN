---
sidebar_position: 7
title: "Docker"
description: "在 Docker 中运行 Hermes Agent 并使用 Docker 作为终端后端"
---

# Hermes Agent — Docker

Docker 与 Hermes Agent 有两种不同的交叉方式：

1. **在 Docker 中运行 Hermes** — 代理本身在容器内运行（这是本页的主要焦点）
2. **Docker 作为终端后端** — 代理在你的主机上运行，但在 Docker 沙箱内执行命令（参见 [配置 → terminal.backend](./configuration.md)）

本页涵盖选项 1。容器将所有用户数据（配置、API key、会话、技能、记忆）存储在从主机挂载到 `/opt/data` 的单个目录中。镜像本身是无状态的，可以通过拉取新版本进行升级而不会丢失任何配置。

## 快速开始

如果这是你第一次运行 Hermes Agent，在主机上创建数据目录并以交互方式启动容器以运行设置向导：

```sh
mkdir -p ~/.hermes
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent setup
```

这会让你进入设置向导，它会提示你输入 API key 并将它们写入 `~/.hermes/.env`。你只需做一次。此时高度推荐设置聊天系统以使网关工作。

## 在网关模式下运行

配置后，在后台作为持久化网关运行容器（Telegram、Discord、Slack、WhatsApp 等）：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

## 交互式运行（CLI 聊天）

对运行的数据目录打开交互式聊天会话：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent
```

## 持久化卷

`/opt/data` 卷是所有 Hermes 状态的单一真实来源。它映射到你主机的 `~/.hermes/` 目录，包含：

| 路径 | 内容 |
|------|-------------|
| `.env` | API key 和密钥 |
| `config.yaml` | 所有 Hermes 配置 |
| `SOUL.md` | 代理人格/身份 |
| `sessions/` | 对话历史 |
| `memories/` | 持久化记忆存储 |
| `skills/` | 已安装技能 |
| `cron/` | 计划任务定义 |
| `hooks/` | 事件钩子 |
| `logs/` | 运行时日志 |
| `skins/` | 自定义 CLI 皮肤 |

:::warning
永远不要同时对同一数据目录运行两个 Hermes 容器——会话文件 和记忆存储不是为并发访问设计的。
:::

## 环境变量转发

API key 从容器内的 `/opt/data/.env` 读取。你也可以直接传递环境变量：

```sh
docker run -it --rm \
  -v ~/.hermes:/opt/data \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -e OPENAI_API_KEY="sk-..." \
  nousresearch/hermes-agent
```

直接的 `-e` 标志覆盖 `.env` 中的值。这对 CI/CD 或你不希望在磁盘上有 key 的密钥管理器集成很有用。

## Docker Compose 示例

对于持久化网关部署，`docker-compose.yaml` 很方便：

```yaml
version: "3.8"
services:
  hermes:
    image: nousresearch/hermes-agent:latest
    container_name: hermes
    restart: unless-stopped
    command: gateway run
    volumes:
      - ~/.hermes:/opt/data
    # 取消注释以转发特定 env var 而不是使用 .env 文件：
    # environment:
    #   - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    #   - OPENAI_API_KEY=${OPENAI_API_KEY}
    #   - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"
```

用 `docker compose up -d` 启动，用 `docker compose logs -f hermes` 查看日志。

## 资源限制

Hermes 容器需要中等资源。推荐最小值：

| 资源 | 最小 | 推荐 |
|----------|---------|-------------|
| 内存 | 1 GB | 2-4 GB |
| CPU | 1 核心 | 2 核心 |
| 磁盘（数据卷） | 500 MB | 2+ GB（随会话/技能增长） |

浏览器自动化（Playwright/Chromium）是最占用内存的功能。如果你不需要浏览器工具，1 GB 就够了。启用浏览器工具时，至少分配 2 GB。

在 Docker 中设置限制：

```sh
docker run -d \
  --name hermes \
  --restart unless-stopped \
  --memory=4g --cpus=2 \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

## Dockerfile 做了什么

官方镜像基于 `debian:13.4`，包含：

- Python 3 和所有 Hermes 依赖（`pip install -e ".[all]"`）
- Node.js + npm（用于浏览器自动化和 WhatsApp 桥接）
- Playwright 和 Chromium（`npx playwright install --with-deps chromium`）
- ripgrep 和 ffmpeg 作为系统工具
- WhatsApp 桥接（`scripts/whatsapp-bridge/`）

入口点脚本（`docker/entrypoint.sh`）在首次运行时引导数据卷：
- 创建目录结构（`sessions/`、`memories/`、`skills/` 等）
- 如果不存在 `.env`，则复制 `.env.example` → `.env`
- 如果缺失则复制默认 `config.yaml`
- 如果缺失则复制默认 `SOUL.md`
- 使用基于清单的方法同步捆绑技能（保留用户编辑）
- 然后用你传递的任何参数运行 `hermes`

## 升级

拉取最新镜像并重新创建容器。你的数据目录不变。

```sh
docker pull nousresearch/hermes-agent:latest
docker rm -f hermes
docker run -d \
  --name hermes \
  --restart unless-stopped \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

或使用 Docker Compose：

```sh
docker compose pull
docker compose up -d
```

## 技能和凭证文件

当使用 Docker 作为执行环境时（不是上面的方法，而是代理在 Docker 沙箱内运行命令时），Hermes 自动绑定挂载技能目录（`~/.hermes/skills/`）和技能声明的任何凭证文件到容器中作为只读卷。这意味着技能脚本、模板和引用在沙箱内可用，无需手动配置。

SSH 和 Modal 后端发生相同的同步——技能和凭证文件在每个命令之前通过 rsync 或 Modal 挂载 API 上传。

## 故障排除

### 容器立即退出

检查日志：`docker logs hermes`。常见原因：
- 缺失或无效的 `.env` 文件——首先交互式运行完成设置
- 如果使用暴露端口则端口冲突

### "Permission denied" 错误

容器默认以 root 运行。如果你的主机 `~/.hermes/` 是由非 root 用户创建的，权限应该没问题。如果出错，确保数据目录可写：

```sh
chmod -R 755 ~/.hermes
```

### 浏览器工具不工作

Playwright 需要共享内存。在 Docker run 命令中添加 `--shm-size=1g`：

```sh
docker run -d \
  --name hermes \
  --shm-size=1g \
  -v ~/.hermes:/opt/data \
  nousresearch/hermes-agent gateway run
```

### 网关在网络问题后不重连

`--restart unless-stopped` 标志处理大多数瞬时故障。如果网关卡住，重启容器：

```sh
docker restart hermes
```

### 检查容器健康状态

```sh
docker logs --tail 50 hermes          # 最近日志
docker exec hermes hermes version     # 验证版本
docker stats hermes                    # 资源使用
```
