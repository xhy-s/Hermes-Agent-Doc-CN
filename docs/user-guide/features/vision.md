---
title: 视觉 & 图片粘贴
description: "将剪贴板中的图片粘贴到 Hermes CLI 进行多模态视觉分析。"
sidebar_label: "视觉 & 图片粘贴"
sidebar_position: 7
---

# 视觉 & 图片粘贴

Hermes Agent 支持**多模态视觉** — 您可以直接将剪贴板中的图片粘贴到 CLI 中，并请代理进行分析、描述或处理。图片以 base64 编码的内容块形式发送给模型，因此任何具有视觉能力的模型都可以处理它们。

## 工作原理

1. 将图片复制到剪贴板（截图、浏览器图片等）
2. 使用以下方法之一附加图片
3. 输入您的问题并按 Enter
4. 图片显示为输入上方的 `[📎 Image #1]` 徽章
5. 提交时，图片以视觉内容块形式发送给模型

在发送之前，您可以附加多张图片 — 每张都会获得自己的徽章。按 `Ctrl+C` 清除所有附加的图片。

图片以带时间戳文件名的 PNG 格式保存到 `~/.hermes/images/`。

## 粘贴方法

附加图片的方式取决于您的终端环境。并非所有方法在所有地方都有效 — 下面是完整说明：

### `/paste` 命令

**最可靠的方法。处处有效。**

```
/paste
```

输入 `/paste` 并按 Enter。Hermes 检查剪贴板中是否有图片并附加它。这在所有环境中都有效，因为它显式调用剪贴板后端 — 无需担心终端按键绑定拦截。

### Ctrl+V / Cmd+V（括号粘贴）

当您粘贴剪贴板上已有的文本时，Hermes 也会自动检查是否有图片。仅当以下情况时有效：
- 您的剪贴板包含**文本和图片两者**（某些应用在复制时将两者都放入剪贴板）
- 您的终端支持括号粘贴（大多数现代终端都支持）

:::warning
如果您的剪贴板**只有图片**（没有文本），Ctrl+V 在大多数终端中无效。终端只能粘贴文本 — 没有粘贴二进制图片数据的标准机制。请改用 `/paste` 或 Alt+V。
:::

### Alt+V

Alt 键组合在大多数终端模拟器中直通（它们作为 ESC + 键发送而非被拦截）。按 `Alt+V` 检查剪贴板中是否有图片。

:::caution
**在 VSCode 的集成终端中无效。** VSCode 为其自己的 UI 拦截了许多 Alt+键组合。请改用 `/paste`。
:::

### Ctrl+V（原生 — 仅 Linux）

在 Linux 桌面终端（GNOME Terminal、Konsole、Alacritty 等）上，`Ctrl+V` **不是**粘贴快捷键，`Ctrl+Shift+V` 才是。因此 `Ctrl+V` 向应用程序发送原始字节，Hermes 捕获它以检查剪贴板。这仅适用于具有 X11 或 Wayland 剪贴板访问权限的 Linux 桌面终端。

## 平台兼容性

| 环境 | `/paste` | Ctrl+V 文本+图片 | Alt+V | 备注 |
|---|:---:|:---:|:---:|---|
| **macOS Terminal / iTerm2** | ✅ | ✅ | ✅ | 最佳体验 — `osascript` 始终可用 |
| **Linux X11 桌面** | ✅ | ✅ | ✅ | 需要 `xclip`（`apt install xclip`） |
| **Linux Wayland 桌面** | ✅ | ✅ | ✅ | 需要 `wl-paste`（`apt install wl-clipboard`） |
| **WSL2（Windows Terminal）** | ✅ | ✅¹ | ✅ | 使用 `powershell.exe` — 无需额外安装 |
| **VSCode Terminal（本地）** | ✅ | ✅¹ | ❌ | VSCode 拦截 Alt+键 |
| **VSCode Terminal（SSH）** | ❌² | ❌² | ❌ | 无法访问远程剪贴板 |
| **SSH 终端（任意）** | ❌² | ❌² | ❌² | 无法访问远程剪贴板 |

¹ 仅在剪贴板同时包含文本和图片时有效（仅图片剪贴板 = 无事发生）
² 参见下面的 [SSH 和远程会话](#ssh--remote-sessions)

## 平台特定设置

### macOS

**无需设置。** Herm 使用 `osascript`（macOS 内置）读取剪贴板。为获得更快性能，可选择安装 `pngpaste`：

```bash
brew install pngpaste
```

### Linux（X11）

安装 `xclip`：

```bash
# Ubuntu/Debian
sudo apt install xclip

# Fedora
sudo dnf install xclip

# Arch
sudo pacman -S xclip
```

### Linux（Wayland）

现代 Linux 桌面（Ubuntu 22.04+、Fedora 34+）默认使用 Wayland。安装 `wl-clipboard`：

```bash
# Ubuntu/Debian
sudo apt install wl-clipboard

# Fedora
sudo dnf install wl-clipboard

# Arch
sudo pacman -S wl-clipboard
```

:::tip 如何检查您是否在使用 Wayland
```bash
echo $XDG_SESSION_TYPE
# "wayland" = Wayland，"x11" = X11，"tty" = 无显示服务器
```
:::

### WSL2

**无需额外设置。** Herm 自动检测 WSL2（通过 `/proc/version`）并使用 `powershell.exe` 通过 .NET 的 `System.Windows.Forms.Clipboard` 访问 Windows 剪贴板。这是 WSL2 Windows 互操作的内置功能 — `powershell.exe` 默认可用。

剪贴板数据作为 base64 编码的 PNG 通过 stdout 传输，无需文件路径转换或临时文件。

:::info WSLg 备注
如果您运行的是 WSLg（带 GUI 支持的 WSL2），Herm 首先尝试 PowerShell 路径，然后回退到 `wl-paste`。WSLg 的剪贴板桥接仅支持 BMP 格式的图片 — Hermes 使用 Pillow（如果已安装）或 ImageMagick 的 `convert` 命令自动将 BMP 转换为 PNG。
:::

#### 验证 WSL2 剪贴板访问

```bash
# 1. 检查 WSL 检测
grep -i microsoft /proc/version

# 2. 检查 PowerShell 是否可访问
which powershell.exe

# 3. 复制一张图片，然后检查
powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::ContainsImage()"
# 应该打印 "True"
```

## SSH 和远程会话

**SSH 状态下剪贴板粘贴无效。** 当您 SSH 到远程机器时，Hermes CLI 在远程主机上运行。所有剪贴板工具（`xclip`、`wl-paste`、`powershell.exe`、`osascript`）都读取它们运行所在机器的剪贴板 — 即远程服务器，而非您的本地机器。您本地的剪贴板无法从远程端访问。

### SSH 的变通方案

1. **上传图片文件** — 将图片保存在本地，通过 `scp`、VSCode 的文件浏览器（拖放）或任何文件传输方法上传到远程服务器。然后按路径引用。（`/attach <filepath>` 命令计划在未来版本中添加。）

2. **使用 URL** — 如果图片可在线访问，只需在消息中粘贴 URL。代理可以使用 `vision_analyze` 直接查看任何图片 URL。

3. **X11 转发** — 使用 `ssh -X` 连接以转发 X11。这让远程机器上的 `xclip` 可以访问您的本地 X11 剪贴板。需要本地运行 X 服务器（macOS 上的 XQuartz、Linux X11 桌面上的内置）。大型图片会很慢。

4. **使用消息平台** — 通过 Telegram、Discord、Slack 或 WhatsApp 向 Hermes 发送图片。这些平台原生处理图片上传，不受剪贴板/终端限制影响。

## 为什么终端无法粘贴图片

这是一个常见的困惑来源，所以这里是技术解释：

终端是**基于文本的**接口。当您按 Ctrl+V（或 Cmd+V）时，终端模拟器：

1. 读取剪贴板的**文本内容**
2. 将其包装在[括号粘贴](https://en.wikipedia.org/wiki/Bracketed-paste)转义序列中
3. 通过终端文本流将其发送到应用程序

如果剪贴板只包含图片（没有文本），终端没有什么可发送的。没有标准的终端转义序列来处理二进制图片数据。终端干脆什么都不做。

这就是 Hermes 使用单独剪贴板检查的原因 — 它不是通过终端粘贴事件接收图片数据，而是通过子进程直接调用操作系统级工具（`osascript`、`powershell.exe`、`xclip`、`wl-paste`）来独立读取剪贴板。

## 支持的模型

图片粘贴适用于任何具有视觉能力的模型。图片以 OpenAI 视觉内容格式的 base64 编码数据 URL 形式发送：

```json
{
  "type": "image_url",
  "image_url": {
    "url": "data:image/png;base64,..."
  }
}
```

大多数现代模型都支持此格式，包括 GPT-4 Vision、Claude（带视觉）、Gemini，以及通过 OpenRouter 服务的开源多模态模型。
