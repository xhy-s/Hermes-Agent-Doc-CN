---
sidebar_position: 10
title: "皮肤与主题"
description: "使用内置和用户定义的皮肤自定义 Hermes CLI"
---

# 皮肤与主题

皮肤控制 Hermes CLI 的**视觉呈现**：横幅颜色、微调器面孔和动词、响应框标签、品牌文字和工具活动前缀。

会话风格和视觉风格是分开的概念：

- **个性** 改变代理的语气和措辞。
- **皮肤** 改变 CLI 的外观。

## 更改皮肤

```bash
/skin                # 显示当前皮肤并列出可用皮肤
/skin ares           # 切换到内置皮肤
/skin mytheme        # 切换到 ~/.hermes/skins/mytheme.yaml 的自定义皮肤
```

或在 `~/.hermes/config.yaml` 中设置默认皮肤：

```yaml
display:
  skin: default
```

## 内置皮肤

| 皮肤 | 描述 | 代理品牌 | 视觉特征 |
|------|-------------|----------------|------------------|
| `default` | 经典 Hermes — 金色和 kawaii | `Hermes Agent` | 暖金色边框、玉米丝文字、kawaii 微调器面孔。熟悉的卡牌斯基横幅。简洁而温馨。 |
| `ares` | 战神主题 — 深红和青铜 | `Ares Agent` | 深红边框配青铜点缀。积极的微调器动词（"forging"、"marching"、"tempering steel"）。定制剑与盾 ASCII 艺术横幅。 |
| `mono` | 单色 — 干净灰阶 | `Hermes Agent` | 全部灰度 — 无颜色。边框为 `#555555`，文字为 `#c9d1d9`。适合最小化终端设置或屏幕录制。 |
| `slate` | 冷蓝 — 开发者聚焦 | `Hermes Agent` | 宝蓝色边框（`#4169e1`），柔和蓝色文字。冷静和专业。无自定义微调器 — 使用默认面孔。 |
| `poseidon` | 海神主题 — 深蓝和海沫 | `Poseidon Agent` | 深蓝到海沫渐变。海洋主题微调器（"charting currents"、"sounding the depth"）。三叉戟 ASCII 艺术横幅。 |
| `sisyphus` | 西西弗斯主题 — 带坚持的朴素灰阶 | `Sisyphus Agent` | 浅灰与鲜明对比。巨石主题微调器（"pushing uphill"、"resetting the boulder"、"enduring the loop"）。岩石和山丘 ASCII 艺术横幅。 |
| `charizard` | 喷火龙主题 — 焦橙和余烬 | `Charizard Agent` | 暖焦橙到余烬渐变。火主题微调器（"banking into the draft"、"measuring burn"）。龙剪影 ASCII 艺术横幅。 |

## 可配置键的完整列表

### 颜色（`colors:`）

控制 CLI 中所有颜色值。值是十六进制颜色字符串。

| 键 | 描述 | 默认值（`default` 皮肤） |
|-----|-------------|--------------------------|
| `banner_border` | 启动横幅周围的面板边框 | `#CD7F32`（青铜） |
| `banner_title` | 横幅中的标题文字颜色 | `#FFD700`（金色） |
| `banner_accent` | 横幅中的章节标题（Available Tools 等） | `#FFBF00`（琥珀） |
| `banner_dim` | 横幅中的柔和文字（分隔符、次要标签） | `#B8860B`（暗金合欢） |
| `banner_text` | 横幅中的正文文字（工具名称、技能名称） | `#FFF8DC`（玉米丝） |
| `ui_accent` | 通用 UI 强调色（高亮、活跃元素） | `#FFBF00` |
| `ui_label` | UI 标签和标签 | `#4dd0e1`（青色） |
| `ui_ok` | 成功指示器（勾选、完成） | `#4caf50`（绿色） |
| `ui_error` | 错误指示器（失败、阻止） | `#ef5350`（红色） |
| `ui_warn` | 警告指示器（ caution、审批提示） | `#ffa726`（橙色） |
| `prompt` | 交互式提示文字颜色 | `#FFF8DC` |
| `input_rule` | 输入区域上方的水平线 | `#CD7F32` |
| `response_border` | 代理响应框周围的边框（ANSI 转义） | `#FFD700` |
| `session_label` | 会话标签颜色 | `#DAA520` |
| `session_border` | 会话 ID 暗淡边框颜色 | `#8B8682` |

### 微调器（`spinner:`）

控制等待 API 响应时显示的动画微调器。

| 键 | 类型 | 描述 | 示例 |
|-----|------|-------------|---------|
| `waiting_faces` | 字符串列表 | 等待 API 响应时循环的面孔 | `["(⚔)", "(⛨)", "(▲)"]` |
| `thinking_faces` | 字符串列表 | 模型推理期间循环的面孔 | `["(⚔)", "(⌁)", "(<>)"]` |
| `thinking_verbs` | 字符串列表 | 微调器消息中显示的动词 | `["forging", "plotting", "hammering plans"]` |
| `wings` | [左、右] 对的列表 | 微调器周围的装饰括号 | `[["⟪⚔", "⚔⟫"], ["⟪▲", "▲⟫"]]` |

当微调器值为空时（如 `default` 和 `mono`），使用 `display.py` 中的硬编码默认值。

### 品牌（`branding:`）

整个 CLI 界面使用的文本字符串。

| 键 | 描述 | 默认值 |
|-----|-------------|---------|
| `agent_name` | 横幅标题和状态显示中显示的名称 | `Hermes Agent` |
| `welcome` | CLI 启动时显示的欢迎消息 | `Welcome to Hermes Agent! Type your message or /help for commands.` |
| `goodbye` | 退出时显示的消息 | `Goodbye! ⚕` |
| `response_label` | 响应框标题上的标签 | ` ⚕ Hermes ` |
| `prompt_symbol` | 用户输入提示前的符号 | `❯ ` |
| `help_header` | `/help` 命令输出的标题文字 | `(^_^)? Available Commands` |

### 其他顶级键

| 键 | 类型 | 描述 | 默认值 |
|-----|------|-------------|---------|
| `tool_prefix` | 字符串 | CLI 中工具输出行开头的字符 | `┊` |
| `tool_emojis` | 字典 | 微调器和进度的每工具表情覆盖（`{tool_name: emoji}`） | `{}` |
| `banner_logo` | 字符串 | 富文本 ASCII 艺术标识（替换默认 HERMES_AGENT 横幅） | `""` |
| `banner_hero` | 字符串 | 富文本英雄艺术（替换默认卡牌斯基艺术） | `""` |

## 自定义皮肤

在 `~/.hermes/skins/` 下创建 YAML 文件。用户皮肤从内置 `default` 皮肤继承缺失的值，因此您只需要指定要更改的键。

### 完整自定义皮肤 YAML 模板

```yaml
# ~/.hermes/skins/mytheme.yaml
# 完整皮肤模板 — 显示所有键。删除任何您不需要的；
# 缺失值自动从 'default' 皮肤继承。

name: mytheme
description: My custom theme

colors:
  banner_border: "#CD7F32"
  banner_title: "#FFD700"
  banner_accent: "#FFBF00"
  banner_dim: "#B8860B"
  banner_text: "#FFF8DC"
  ui_accent: "#FFBF00"
  ui_label: "#4dd0e1"
  ui_ok: "#4caf50"
  ui_error: "#ef5350"
  ui_warn: "#ffa726"
  prompt: "#FFF8DC"
  input_rule: "#CD7F32"
  response_border: "#FFD700"
  session_label: "#DAA520"
  session_border: "#8B8682"

spinner:
  waiting_faces:
    - "(⚔)"
    - "(⛨)"
    - "(▲)"
  thinking_faces:
    - "(⚔)"
    - "(⌁)"
    - "(<>)"
  thinking_verbs:
    - "processing"
    - "analyzing"
    - "computing"
    - "evaluating"
  wings:
    - ["⟪⚡", "⚡⟫"]
    - ["⟪●", "●⟫"]

branding:
  agent_name: "My Agent"
  welcome: "Welcome to My Agent! Type your message or /help for commands."
  goodbye: "See you later! ⚡"
  response_label: " ⚡ My Agent "
  prompt_symbol: "⚡ ❯ "
  help_header: "(⚡) Available Commands"

tool_prefix: "┊"

# 每工具表情覆盖（可选）
tool_emojis:
  terminal: "⚔"
  web_search: "🔮"
  read_file: "📄"

# 自定义 ASCII 艺术横幅（可选，支持 Rich 标记）
# banner_logo: |
#   [bold #FFD700] MY AGENT [/]
# banner_hero: |
#   [#FFD700]  Custom art here  [/]
```

### 最小自定义皮肤示例

由于一切从 `default` 继承，最小皮肤只需要更改不同的内容：

```yaml
name: cyberpunk
description: Neon terminal theme

colors:
  banner_border: "#FF00FF"
  banner_title: "#00FFFF"
  banner_accent: "#FF1493"

spinner:
  thinking_verbs: ["jacking in", "decrypting", "uploading"]
  wings:
    - ["⟨⚡", "⚡⟩"]

branding:
  agent_name: "Cyber Agent"
  response_label: " ⚡ Cyber "

tool_prefix: "▏"
```

## 操作说明

- 内置皮肤从 `hermes_cli/skin_engine.py` 加载。
- 未知皮肤自动回退到 `default`。
- `/skin` 立即为当前会话更新活动 CLI 主题。
- `~/.hermes/skins/` 中的用户皮肤优先于具有相同名称的内置皮肤。
- 通过 `/skin` 的皮肤更改仅适用于当前会话。要使皮肤成为永久默认，在 config.yaml 中设置。
- `banner_logo` 和 `banner_hero` 字段支持 Rich 控制台标记（例如 `[bold #FF0000]text[/]`）用于彩色 ASCII 艺术。
