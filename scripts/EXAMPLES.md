# 使用示例

## 示例1：基本使用流程

```bash
# 1. 进入scripts目录
cd /Users/htao/github/htao/hikhike/scripts

# 2. 创建kml_files目录并放入KML文件
mkdir -p kml_files
# 将你的KML文件复制到kml_files目录

# 3. 运行脚本
node upload-kml.js

# 4. 根据提示选择数据来源
#   1. 2bulu
#   2. wikiloc
#   3. Waymarked
#   4. Overpass

# 5. 按Enter开始处理
```

## 示例2：处理指定目录的KML文件

```bash
# 处理其他目录的KML文件
node upload-kml.js /Users/htao/Downloads/my-kml-files
```

## 示例3：查看处理结果

```bash
# 查看上传结果
cat upload-result.json

# 或者格式化查看（需要安装jq）
cat upload-result.json | jq '.'
```

## 文件名编码修复示例

### 修复前：
```
2025-07-27ÙÜÉ½ (1).kml
Ä¾·½徒步.kml
Î÷ºþ环线.kml
```

### 修复后：
```
2025-07-27庐山 (1).kml
木方徒步.kml
西湖环线.kml
```

## 示例输出

```
=================================
   KML 文件解析上传工具 v2
=================================

找到 3 个 KML 文件

[1/3] 处理: 2025-07-27庐山 (1).kml
  路线名称: 庐山环线
  ✓ 上传成功!
  记录ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  点数量: 1234
  长度: 15.23 km

[2/3] 处理: 木方徒步.kml
  路线名称: 木方徒步路线
  ✓ 上传成功!
  记录ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  点数量: 856
  长度: 8.45 km

[3/3] 处理: 西湖环线.kml
  路线名称: 西湖环线
  ✓ 上传成功!
  记录ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  点数量: 2341
  长度: 22.67 km

=================================
处理完成汇总
=================================

总耗时: 8.32 秒
成功: 3 个
失败: 0 个
总长度: 46.35 km

结果已保存到: upload-result.json
```

## 常见KML格式

### 格式1：2bulu (gx:Track)

```xml
<kml>
  <Document>
    <name>庐山环线</name>
    <Folder id="TbuluTrackFolder">
      <name>轨迹</name>
      <Placemark>
        <gx:Track>
          <when>...</when>
          <gx:coord>116.397428 39.90923 50</gx:coord>
          <gx:coord>116.397528 39.90933 51</gx:coord>
        </gx:Track>
      </Placemark>
    </Folder>
  </Document>
</kml>
```

### 格式2：wikiloc (LineString)

```xml
<kml>
  <Document>
    <name>西湖环线</name>
    <Placemark>
      <LineString>
        <coordinates>120.1536,30.2470,50 120.1537,30.2471,51</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
```

## 云函数测试

### 使用curl测试云函数

```bash
# 准备一个KML文件内容
KML_CONTENT=$(cat test.kml)

# 调用云函数
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"kmlContent\": \"$KML_CONTENT\",
    \"source\": \"2bulu\"
  }" \
  https://cloud1-1g6k23o45e657c65.service.tcloudbase.com/cloud1-1g6k23o45e657c65/parseKML
```

## 批量处理脚本

```bash
#!/bin/bash
# 批量处理多个来源

for source in "2bulu" "wikiloc" "waymarked" "overpass"; do
  echo "处理来源: $source"
  
  # 为每个来源创建目录
  mkdir -p "kml_files/$source"
  
  # 运行脚本（这里需要手动交互）
  # 可以考虑修改脚本支持命令行参数
done
```

## 故障排查

### 1. 依赖问题

```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

### 2. 云函数连接问题

```bash
# 测试云函数URL连通性
curl -I https://cloud1-1g6k23o45e657c65.service.tcloudbase.com/cloud1-1g6k23o45e657c65/parseKML
```

### 3. 文件权限问题

```bash
# 确保脚本有执行权限
chmod +x upload-kml-v2.js
```

## 性能优化建议

1. **批量上传**：建议单次处理不超过100个文件
2. **网络延迟**：脚本内置了500ms延迟，避免请求过快
3. **并发处理**：如果文件很多，可以考虑分批处理

## 下一步

1. 上传云函数到微信云开发
2. 测试单个KML文件上传
3. 批量处理所有KML文件
4. 在小程序中查看上传的路线数据
