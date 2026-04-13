# KML 文件解析上传工具

这个工具用于批量解析本地 KML 文件，并将解析后的路线数据上传到微信小程序的云数据库。

## 架构说明

工具分为两部分：
1. **本地Node脚本** (`upload-kml.js`): 负责解析KML文件、修复文件名编码、计算路线长度
2. **云函数** (`saveRoute`): 只负责接收结构化数据并存储到数据库

## 功能特性

- ✅ 自动修复文件名编码问题（GBK/UTF-8 转换）
- ✅ 支持多种数据来源：2bulu、wikiloc、Waymarked、Overpass
- ✅ 批量处理 KML 文件
- ✅ 实时显示处理进度和结果
- ✅ 支持多种 KML 格式（gx:Track、LineString）
- ✅ 自动计算路线长度和轨迹点数量（使用Haversine公式）
- ✅ 本地解析，云端存储，减少网络传输

## 安装依赖

```bash
cd scripts
npm install
```

或手动安装：

```bash
npm install xml2js iconv-lite
```

## 使用方法

### 基本使用

1. 将 KML 文件放入 `scripts/kml_files` 目录（脚本会自动创建）
2. 运行脚本：

```bash
node upload-kml.js
```

3. 按照提示选择数据来源
4. 按 Enter 开始处理

### 指定KML文件目录

```bash
node upload-kml.js /path/to/your/kml/files
```

## 文件说明

- `upload-kml.js` - 主脚本
- `config.js` - 配置文件
- `package.json` - 依赖管理

## 配置说明

编辑 `config.js` 可以修改：

- **cloudFunction.url** - 云函数URL
- **kmlDirectory** - 默认KML文件目录
- **encodingFixes** - 文件名编码修复映射
- **logLevel** - 日志级别（debug/info/warn/error）

## 输出

处理完成后会生成 `upload-result.json` 文件，包含：

```json
{
  "timestamp": "2026-04-13T...",
  "source": "2bulu",
  "total": 10,
  "success": 9,
  "failed": 1,
  "totalLength": "123.45",
  "results": [...]
}
```

## 云函数

云函数位于 `cloudfunctions/saveRoute/index.js`，负责：

- 接收结构化路线数据（已解析的轨迹点、路线名称等）
- 验证数据格式
- 存储到云数据库 `routes` 集合

**注意**：云函数不处理KML解析，所有KML解析逻辑都在本地Node脚本中完成。

### 云函数调用格式

```javascript
{
  "name": "路线名称",
  "points": [[116.397428, 39.90923, 50], [116.397528, 39.90933, 51]],
  "length_km": 15.23,
  "source": "2bulu"
}
```

## 常见问题

### 1. 文件名乱码

脚本会自动修复常见的文件名编码问题。如果仍有问题，可以在 `config.js` 中的 `encodingFixes` 添加自定义映射。

### 2. 上传失败

检查：
- 云函数URL是否正确
- 网络连接是否正常
- 云函数是否已部署

### 3. 依赖安装失败

尝试使用国内镜像：

```bash
npm install --registry=https://registry.npmmirror.com
```

## 技术栈

- Node.js
- xml2js - XML解析（本地脚本）
- iconv-lite - 字符编码转换（本地脚本）
- 微信云开发 - 云函数和数据库

## 注意事项

1. 确保云函数 `saveRoute` 已部署到微信云开发环境
2. 确保云函数URL配置正确
3. KML文件需要包含有效的轨迹数据
4. 建议单次处理不超过100个文件
5. 云函数只接收结构化数据，不处理KML解析

## 云函数部署

```bash
# 在微信开发者工具中部署
# 1. 右键点击 cloudfunctions/saveRoute
# 2. 选择"上传并部署：云端安装依赖"

# 或使用命令行（需要安装tcb-cli）
tcb functions:deploy saveRoute
```

## 下一步

1. 部署云函数 `saveRoute` 到微信云开发
2. 测试单个KML文件上传
3. 批量处理所有KML文件
4. 在小程序中查看上传的路线数据
