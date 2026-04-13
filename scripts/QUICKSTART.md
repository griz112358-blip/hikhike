# 快速开始指南

## 第一步：准备环境

```bash
# 1. 进入scripts目录
cd /Users/htao/github/htao/hikhike/scripts

# 2. 安装依赖（已完成）
npm install
```

## 第二步：部署云函数

在使用脚本前，需要先部署云函数：

```bash
# 在微信开发者工具中部署
# 1. 右键点击 cloudfunctions/saveRoute
# 2. 选择"上传并部署：云端安装依赖"
```

**注意**：云函数 `saveRoute` 负责接收结构化数据并存储到数据库，不处理KML解析。

## 第三步：准备KML文件

将你的KML文件放入 `scripts/kml_files` 目录。

**提示**：脚本会自动修复文件名编码问题，例如：
- `2025-07-27ÙÜÉ½ (1).kml` → `2025-07-27庐山 (1).kml`

## 第四步：运行脚本

```bash
node upload-kml.js
```

脚本会在本地解析KML文件，然后只将结构化数据发送到云函数。

## 第五步：选择数据来源

脚本会显示以下选项：

```
请选择数据来源：
  1. 2bulu
  2. wikiloc
  3. Waymarked
  4. Overpass

请输入选项 (1-4):
```

输入对应的数字并按Enter。

## 第六步：开始处理

按Enter开始处理文件，脚本会实时显示进度。

## 第七步：查看结果

处理完成后，查看 `upload-result.json` 文件了解详细结果。

## 第四步：选择数据来源

脚本会显示以下选项：

```
请选择数据来源：
  1. 2bulu
  2. wikiloc
  3. Waymarked
  4. Overpass

请输入选项 (1-4):
```

输入对应的数字并按Enter。

## 第五步：开始处理

按Enter开始处理文件，脚本会实时显示进度。

## 第六步：查看结果

处理完成后，查看 `upload-result.json` 文件了解详细结果。

## 常见问题

**Q: 提示"缺少依赖包"怎么办？**
A: 运行 `npm install xml2js iconv-lite`

**Q: 云函数连接失败怎么办？**
A: 检查 `config.js` 中的 `cloudFunction.url` 是否正确

**Q: 文件名还是乱码怎么办？**
A: 在 `config.js` 的 `encodingFixes` 中添加自定义映射

**Q: 如何查看处理历史？**
A: 查看 `upload-result.json` 文件

## 测试

使用提供的测试文件测试：

```bash
# 测试文件已在 kml_files/test-route.kml
node upload-kml.js
# 选择 1 (2bulu)
# 按 Enter 开始处理
```

**预期输出**：
```
[1/1] 处理: test-route.kml
  路线名称: 测试路线
  轨迹点数: 5
  路线长度: 0.09 km
  ✓ 上传成功!
  记录ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 下一步

- 批量上传你的KML文件
- 在小程序中查看路线数据
- 根据需要调整脚本配置

## 技术支持

如遇问题，请检查：
1. 依赖是否正确安装
2. 云函数是否已部署
3. 网络连接是否正常
4. KML文件格式是否正确

更多详细信息请参阅 `README.md` 和 `EXAMPLES.md`。
