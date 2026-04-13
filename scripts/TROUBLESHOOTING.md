# 脚本等待问题解决方案

## 问题描述

运行脚本后，看到：
```
找到 1 个 KML 文件
准备处理 1 个文件
按 Enter 继续，或 Ctrl+C 取消
```

然后就停住了，按 Enter 没有反应。

## 原因

这是脚本的**确认步骤**，需要你按 **Enter 键**来确认开始处理。这是为了防止误操作。

但之前使用的 `process.stdin.once('data')` 在某些情况下可能不工作。

## 解决方案

### 方法1：正常使用（推荐）

现在脚本已修复，应该可以正常工作：

```bash
node upload-kml.js
```

看到提示后，直接按 **Enter 键**即可继续。

### 方法2：使用非交互模式（跳过确认）

如果你想跳过所有确认步骤，使用 `--no-prompt` 参数：

```bash
node upload-kml.js --no-prompt
```

**特点**：
- 自动使用默认数据来源：2bulu
- 跳过"按 Enter 继续"的确认
- 直接开始处理所有文件

### 方法3：指定数据来源（配合非交互模式）

使用 `--source` 参数指定数据来源：

```bash
node upload-kml.js --no-prompt --source wikiloc
```

支持的来源：`2bulu`, `wikiloc`, `waymarked`, `overpass`

## 使用示例

### 交互模式（默认）
```bash
$ node upload-kml.js

请选择数据来源：
  1. 2bulu
  2. wikiloc
  3. Waymarked
  4. Overpass

请输入选项 (1-4): 1
已选择: 2bulu

找到 1 个 KML 文件
准备处理 1 个文件
按 Enter 继续，或 Ctrl+C 取消
[按 Enter]

[开始处理...]
```

### 非交互模式
```bash
$ node upload-kml.js --no-prompt

使用默认数据来源: 2bulu
非交互模式，直接开始处理...

[直接开始处理...]
```

## 如果仍然无法工作

### 检查终端输入

确保你的终端可以接收输入：

```bash
# 测试输入
echo "按 Enter 继续"
read
```

### 使用不同的终端

某些终端（如某些IDE的内置终端）可能不支持交互式输入。尝试：
- 系统终端（Terminal.app, iTerm2等）
- VS Code的集成终端
- 命令行工具

### 直接使用非交互模式

如果交互模式一直有问题，直接使用：

```bash
node upload-kml.js --no-prompt
```

## 总结

- ✅ **正常使用**：运行脚本 → 选择来源 → 按 Enter → 处理
- ⚡ **快速使用**：`--no-prompt` 跳过所有确认
- 🎯 **精确控制**：`--source` 指定数据来源

现在脚本已经修复了输入问题，应该可以正常使用！
