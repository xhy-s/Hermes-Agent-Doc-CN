---
sidebar_position: 7
title: "会话存储"
description: "Hermes Agent 如何存储和管理会话历史：SQLite schema、FTS5 全文搜索和会话谱系"
---

# 会话存储

Hermes Agent 使用 SQLite 存储会话数据，支持全文搜索和高效的历史管理。

## 存储架构

### 主要表

#### sessions 表

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    user_id TEXT NOT NULL,
    thread_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model TEXT,
    provider TEXT,
    system_prompt_hash TEXT,
    metadata TEXT,
    parent_id TEXT,
    lineage_depth INTEGER DEFAULT 0
);
```

关键字段：
- `id`：唯一会话标识符
- `platform`：消息平台（telegram、discord 等）
- `user_id`：平台上的用户 ID
- `thread_id`：线程/频道 ID（用于群组消息）
- `parent_id`：压缩时创建的父会话（用于谱系跟踪）
- `lineage_depth`：压缩链中的深度

#### messages 表

```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    tool_calls TEXT,
    tool_results TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

#### message_tokens 表

```sql
CREATE TABLE message_tokens (
    message_id INTEGER PRIMARY KEY,
    session_id TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id)
);
```

### 索引

```sql
CREATE INDEX idx_sessions_platform_user ON sessions(platform, user_id);
CREATE INDEX idx_sessions_updated ON sessions(updated_at);
CREATE INDEX idx_messages_session ON messages(session_id, created_at);
```

## FTS5 全文搜索

Hermes 使用 SQLite FTS5 进行会话历史搜索：

```sql
CREATE VIRTUAL TABLE messages_fts USING fts5(
    content,
    content='messages',
    content_rowid='id'
);
```

### 搜索查询

```python
def search_sessions(query: str, platform: str = None, limit: int = 20):
    """Search across session messages."""
    sql = """
        SELECT s.*, snippet(messages_fts, 0, '[', ']', '...', 32) as snippet
        FROM sessions s
        JOIN messages_fts ON s.id = messages_fts.rowid
        WHERE messages_fts MATCH ?
    """
    params = [query]

    if platform:
        sql += " AND s.platform = ?"
        params.append(platform)

    sql += " ORDER BY rank LIMIT ?"
    params.append(limit)

    return cursor.execute(sql, params).fetchall()
```

## 会话谱系

当上下文压缩发生时，会创建一个新的"子"会话：

```
Original session (depth=0)
    │
    └── Compressed session 1 (depth=1, parent_id=original)
            │
            └── Compressed session 2 (depth=2, parent_id=compressed1)
```

### 压缩行为

```python
def compress_session(session_id: str, summary: str, preserved_messages: list):
    # 1. 创建新的压缩会话
    compressed = Session(
        id=generate_id(),
        parent_id=session_id,
        lineage_depth=session.lineage_depth + 1,
        # 复制其他元数据...
    )

    # 2. 保存摘要和保留的消息
    for msg in preserved_messages:
        compressed.add_message(msg)

    compressed.add_message({
        "role": "system",
        "content": f"[Context compaction occurred]\n\n{summary}"
    })

    return compressed
```

### 谱系查询

```python
def get_session_lineage(session_id: str):
    """Get the full lineage of a session."""
    lineage = []
    current = get_session(session_id)

    while current:
        lineage.append(current)
        if current.parent_id:
            current = get_session(current.parent_id)
        else:
            current = None

    return lineage
```

## 消息管理

### 添加消息

```python
def add_message(session_id: str, message: dict):
    """Add a message to a session."""
    with get_connection() as conn:
        cursor.execute("""
            INSERT INTO messages (session_id, role, content, tool_calls, tool_results)
            VALUES (?, ?, ?, ?, ?)
        """, (
            session_id,
            message["role"],
            message.get("content"),
            json.dumps(message.get("tool_calls")),
            json.dumps(message.get("tool_results"))
        ))

        # 更新会话的 updated_at
        cursor.execute("""
            UPDATE sessions SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (session_id,))
```

### Token 跟踪

```python
def record_tokens(message_id: int, usage: dict):
    """Record token usage for a message."""
    cursor.execute("""
        INSERT INTO message_tokens (message_id, input_tokens, output_tokens, total_tokens)
        VALUES (?, ?, ?, ?)
    """, (
        message_id,
        usage.get("input_tokens", 0),
        usage.get("output_tokens", 0),
        usage.get("total_tokens", 0)
    ))
```

## 存储限制

### 默认限制

```yaml
session:
  max_messages: 1000      # 每个会话最大消息数
  max_age_days: 30       # 自动删除超过此天数的不活动会话
  compress_at: 50        # 上下文百分比触发压缩
```

### 清理

```python
def cleanup_old_sessions(days: int = 30):
    """Delete sessions older than specified days."""
    cursor.execute("""
        DELETE FROM sessions
        WHERE updated_at < datetime('now', '-' || ? || ' days')
    """, (days,))
```

## 跨会话搜索

### session_search 工具

```python
def session_search(query: str, session_id: str = None, limit: int = 10):
    """
    Search across session history.

    Args:
        query: Search query string
        session_id: Optional specific session to search
        limit: Maximum number of results

    Returns:
        List of matching messages with session context
    """
    if session_id:
        # 搜索特定会话
        sql = """
            SELECT m.*, s.platform, s.user_id
            FROM messages m
            JOIN sessions s ON m.session_id = s.id
            WHERE m.session_id = ?
            AND messages_fts MATCH ?
            ORDER BY m.created_at DESC
            LIMIT ?
        """
        results = cursor.execute(sql, (session_id, query, limit)).fetchall()
    else:
        # 搜索所有会话
        sql = """
            SELECT m.*, s.platform, s.user_id
            FROM messages m
            JOIN sessions s ON m.session_id = s.id
            WHERE messages_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        """
        results = cursor.execute(sql, (query, limit)).fetchall()

    return [format_result(r) for r in results]
```

## 备份和导出

### 导出会话

```python
def export_session(session_id: str, format: str = "json"):
    """Export a session to file."""
    session = get_session(session_id)
    messages = get_session_messages(session_id)

    if format == "json":
        return json.dumps({
            "session": session.__dict__,
            "messages": messages
        }, indent=2)
```

### 批量导出

```python
def export_all_sessions(output_dir: str):
    """Export all sessions to separate files."""
    sessions = get_all_sessions()

    for session in sessions:
        messages = get_session_messages(session.id)
        path = Path(output_dir) / f"{session.id}.json"
        path.write_text(json.dumps({
            "session": session.__dict__,
            "messages": messages
        }))
```

## 性能优化

### 批量插入

```python
def add_messages_batch(session_id: str, messages: list):
    """Add multiple messages in a single transaction."""
    with get_connection() as conn:
        cursor.executemany("""
            INSERT INTO messages (session_id, role, content, tool_calls, tool_results)
            VALUES (?, ?, ?, ?, ?)
        """, [
            (session_id, m["role"], m.get("content"),
             json.dumps(m.get("tool_calls")),
             json.dumps(m.get("tool_results")))
            for m in messages
        ])
```

### 连接池

```python
# 使用连接池避免 SQLite 锁定
_pool = sqlite3.connect(
    str(HERMES_DB_PATH),
    check_same_thread=False
).cursor()
```

## 相关文档

- [架构](./architecture.md)
- [上下文压缩与缓存](./context-compression-and-caching.md)
- [Agent 循环内部原理](./agent-loop.md)
