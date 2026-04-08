---
sidebar_position: 10
title: "记忆提供者插件"
description: "如何为 Hermes Agent 构建自定义记忆提供者插件"
---

# 记忆提供者插件

Hermes Agent 的记忆系统支持插件架构，允许你插入自定义的持久化后端。

## 架构

```
MemoryStore
    ↓
MemoryProvider (ABC)
    ↓
Concrete implementations
```

### MemoryProvider 接口

```python
from abc import ABC, abstractmethod

class MemoryProvider(ABC):
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the provider."""
        pass

    @abstractmethod
    async def read(self, key: str) -> Optional[str]:
        """Read a memory value by key."""
        pass

    @abstractmethod
    async def write(self, key: str, value: str) -> None:
        """Write a memory value."""
        pass

    @abstractmethod
    async def delete(self, key: str) -> None:
        """Delete a memory value."""
        pass

    @abstractmethod
    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search memories."""
        pass

    @abstractmethod
    async def list_keys(self) -> List[str]:
        """List all memory keys."""
        pass
```

## 创建插件

### 目录结构

```
~/.hermes/plugins/memory/my_provider/
├── __init__.py
├── provider.py
└── config.yaml
```

### provider.py

```python
"""My Custom Memory Provider."""

from typing import Optional, List, Dict, Any
from agent.memory_provider import MemoryProvider

class MyMemoryProvider(MemoryProvider):
    name = "my_memory"

    async def initialize(self) -> None:
        # 连接到你选择的存储后端
        self.client = await connect_to_storage()

    async def read(self, key: str) -> Optional[str]:
        return await self.client.get(key)

    async def write(self, key: str, value: str) -> None:
        await self.client.set(key, value)

    async def delete(self, key: str) -> None:
        await self.client.delete(key)

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        results = await self.client.search(query, limit=limit)
        return [{"key": r.key, "snippet": r.snippet} for r in results]

    async def list_keys(self) -> List[str]:
        return await self.client.keys()
```

### 注册插件

在 `~/.hermes/config.yaml` 中：

```yaml
plugins:
  memory:
    provider: my_memory
    config:
      # 你的自定义配置
      connection_string: "..."
```

## 内置提供者

### SQLite MemoryProvider

默认的记忆提供者，使用 SQLite：

```yaml
plugins:
  memory:
    provider: sqlite
    config:
      path: ~/.hermes/memories/hermes_memory.db
```

### Honcho MemoryProvider

```yaml
plugins:
  memory:
    provider: honcho
    config:
      server_url: http://localhost:8080
```

## 搜索集成

自定义提供者可以实现 `search()` 方法来支持 `session_search` 工具：

```python
async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    返回匹配的内存条目。

    每个结果应该是一个包含至少 'key' 和 'snippet' 的字典。
    snippet 用于在结果中显示。
    """
    pass
```

## 错误处理

提供者在初始化失败时应该抛出有意义的错误：

```python
async def initialize(self) -> None:
    try:
        self.client = await connect_to_storage()
    except ConnectionError as e:
        raise MemoryProviderError(
            f"Failed to connect to memory storage: {e}"
        )
```

## 测试

```python
import pytest

@pytest.mark.asyncio
async def test_memory_provider():
    provider = MyMemoryProvider()
    await provider.initialize()

    await provider.write("test_key", "test_value")
    result = await provider.read("test_key")

    assert result == "test_value"

    await provider.delete("test_key")
```

## 相关文档

- [架构](./architecture.md)
- [构建 Hermes 插件](../guides/build-a-hermes-plugin.md)
