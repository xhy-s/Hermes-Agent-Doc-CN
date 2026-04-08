---
sidebar_position: 3
sidebar_label: "Git Worktrees"
title: "Git Worktrees"
description: "使用 git worktree 和隔离检出在同一个仓库上安全运行多个 Hermes 代理"
---

# Git Worktrees

Hermes Agent 常用于大型、长期存在的仓库。当你想：

- 在同一项目上**并行运行多个代理**，或
- 将实验性重构与你的主分支隔离，

Git **worktree** 是为每个代理提供自己检出而不复制整个仓库的最安全方式。

本页展示如何将 worktree 与 Hermes 结合，以便每个会话都有干净、隔离的工作目录。

## 为什么将 Worktree 与 Hermes 结合使用？

Hermes 将**当前工作目录**视为项目根目录：

- CLI：你运行 `hermes` 或 `hermes chat` 的目录
- 消息网关：由 `MESSAGING_CWD` 设置的目录

如果你在**同一检出**中运行多个代理，它们的更改可能会相互干扰：

- 一个代理可能删除或重写另一个正在使用的文件。
- 越来越难以理解哪些更改属于哪个实验。

使用 worktree，每个代理获得：

- 自己的**分支和工作目录**
- 自己的**检查点管理器历史**，用于 `/rollback`

另请参见：[检查点和 /rollback](./checkpoints-and-rollback.md)。

## 快速开始：创建 Worktree

从包含 `.git/` 的主仓库中，为功能分支创建新的 worktree：

```bash
# 从主仓库根目录
cd /path/to/your/repo

# 在 ../repo-feature 中创建新分支和 worktree
git worktree add ../repo-feature feature/hermes-experiment
```

这会创建：

- 新目录：`../repo-feature`
- 新分支：`feature/hermes-experiment` 在该目录中检出

现在你可以进入新的 worktree 并在那里运行 Hermes：

```bash
cd ../repo-feature

# 在 worktree 中启动 Hermes
hermes
```

Hermes 会：

- 将 `../repo-feature` 视为项目根目录。
- 使用该目录进行上下文文件、代码编辑和工具。
- 使用绑定到这个 worktree 的**单独检查点历史**用于 `/rollback`。

## 并行运行多个代理

你可以创建多个 worktree，每个都有自己的分支：

```bash
cd /path/to/your/repo

git worktree add ../repo-experiment-a feature/hermes-a
git worktree add ../repo-experiment-b feature/hermes-b
```

在单独的终端中：

```bash
# 终端 1
cd ../repo-experiment-a
hermes

# 终端 2
cd ../repo-experiment-b
hermes
```

每个 Hermes 进程：

- 在自己的分支上工作（`feature/hermes-a` vs `feature/hermes-b`）。
- 在不同的影子仓库哈希下写入检查点（来自 worktree 路径）。
- 可以独立使用 `/rollback` 而不影响另一个。

这在以下情况下特别有用：

- 运行批量重构。
- 尝试同一任务的不同方法。
- 将 CLI + 网关会话配对到同一个上游仓库。

## 安全清理 Worktree

当你完成实验时：

1. 决定是保留还是丢弃工作。
2. 如果要保留：
   - 像往常一样将分支合并到主分支。
3. 移除 worktree：

```bash
cd /path/to/your/repo

# 移除 worktree 目录及其引用
git worktree remove ../repo-feature
```

注意：

- `git worktree remove` 除非你强制它，否则会拒绝移除有未提交更改的 worktree。
- 移除 worktree **不会自动删除分支**；你可以使用正常的 `git branch` 命令删除或保留分支。
- 当你移除 worktree 时，`~/.hermes/checkpoints/` 下的 Hermes 检查点数据不会自动清理，但通常很小。

## 最佳实践

- **每个 Hermes 实验一个 worktree**
  - 为每个实质性更改创建专用分支/worktree。
  - 这保持差异集中，PR 精简且可审查。
- **用实验名称命名分支**
  - 例如 `feature/hermes-checkpoints-docs`、`feature/hermes-refactor-tests`。
- **频繁提交**
  - 使用 git 提交作为高级里程碑。
  - 使用 [检查点和 /rollback](./checkpoints-and-rollback.md) 作为工具驱动编辑之间的安全网。
- **使用 worktree 时避免从裸仓库根目录运行 Hermes**
  - 优先使用 worktree 目录，以便每个代理都有清晰的范围。

## 使用 `hermes -w`（自动 Worktree 模式）

Hermes 有一个内置的 `-w` 标志，**自动创建带有自己分支的 disposable git worktree**。你不需要手动设置 worktree——只需进入你的仓库并运行：

```bash
cd /path/to/your/repo
hermes -w
```

Hermes 会：

- 在你的仓库内的 `.worktrees/` 下创建临时 worktree。
- 检出隔离分支（例如 `hermes/hermes-<hash>`）。
- 在该 worktree 内运行完整的 CLI 会话。

这是获得 worktree 隔离的最简单方法。你也可以将它与单次查询结合：

```bash
hermes -w -q "Fix issue #123"
```

对于并行代理，打开多个终端并分别在每个中运行 `hermes -w`——每次调用自动获得自己的 worktree 和分支。

## 总结

- 使用 **git worktree** 给予每个 Hermes 会话自己干净的检出。
- 使用 **分支** 捕获你实验的高级历史。
- 使用 **检查点 + `/rollback`** 在每个 worktree 内从错误编辑中恢复。

这个组合给你：

- 不同代理和实验不会相互影响的强力保证。
- 快速迭代周期和从错误编辑中的轻松恢复。
- 干净、可审查的拉取请求。
