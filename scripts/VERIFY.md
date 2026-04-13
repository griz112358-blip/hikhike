# 如何验证测试是否成功

## 快速检查清单

运行 `node upload-kml.js` 后，检查以下几点：

### ✅ 1. 脚本输出显示成功

查看控制台输出，应该看到：
```
✓ 上传成功!
记录ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**关键指标**：
- ✓ 绿色的 "✓ 上传成功!" 标记
- 返回了 `recordId`（记录ID）
- 成功数量 > 0，失败数量 = 0

### ✅ 2. 检查 upload-result.json

运行后会在脚本目录生成 `upload-result.json` 文件：

```bash
cat upload-result.json
```

**成功的响应示例**：
```json
{
  "timestamp": "2026-04-13T15:30:00.000Z",
  "source": "2bulu",
  "total": 1,
  "success": 1,          ← 成功数量
  "failed": 0,          ← 失败数量
  "totalLength": "0.09",
  "results": [
    {
      "success": true,
      "filename": "test-route.kml",
      "routeName": "测试路线",
      "result": {
        "success": true,
        "name": "测试路线",
        "pointCount": 5,
        "length_km": 0.09,
        "recordId": "abc123-def456-ghi789"
      }
    }
  ]
}
```

### ✅ 3. 在微信小程序中查看

1. 打开微信开发者工具
2. 进入你的小程序项目
3. 打开云开发控制台
4. 进入"数据库" → "routes" 集合
5. 查看是否新增了一条记录

**应该看到的数据**：
```json
{
  "_id": "abc123-def456-ghi789",
  "source": "2bulu",
  "name": "测试路线",
  "points": [
    [116.397428, 39.90923, 50],
    [116.397528, 39.90933, 51],
    ...
  ],
  "length_km": 0.09,
  "pointCount": 5,
  "imported_at": "2026-04-13T15:30:00.000Z",
  "import_type": "pc_script"
}
```

### ✅ 4. 测试路线数据是否正确

检查 `points` 数组中的数据：
- 点数量应该与KML文件中的轨迹点一致（测试文件是5个点）
- 坐标格式：`[经度, 纬度, 海拔]`
- 测试路线的坐标在北京附近：`116.397xxx, 39.909xxx`

## 常见错误及处理

### ❌ 错误1：云函数未部署

**症状**：
```
✗ 失败: connect ECONNREFUSED
```

**解决**：
```bash
# 需要先部署云函数
# 在微信开发者工具中右键 cloudfunctions/saveRoute
# 选择"上传并部署：云端安装依赖"
```

### ❌ 错误2：云函数URL错误

**症状**：
```
✗ 失败: 404 Not Found
```

**解决**：
检查 `config.js` 中的云函数URL：
```javascript
url: 'https://cloud1-1g6k23o45e657c65.service.tcloudbase.com/cloud1-1g6k23o45e657c65/saveRoute'
```

确保最后一个路径是 `saveRoute`（不是 parseKML）

### ❌ 错误3：网络超时

**症状**：
```
✗ 失败: 请求超时
```

**解决**：
- 检查网络连接
- 在 `config.js` 中增加超时时间：
```javascript
timeout: 60000 // 改为60秒
```

## 验证成功的完整流程

```bash
# 1. 运行脚本
cd /Users/htao/github/htao/hikhike/scripts
node upload-kml.js

# 2. 选择数据来源
输入: 1 (选择 2bulu)

# 3. 等待处理完成
# 观察控制台输出

# 4. 检查结果文件
cat upload-result.json | jq .  # 如果安装了 jq

# 5. 在小程序中验证
# 打开微信开发者工具 → 云开发 → 数据库 → routes
```

## 预期的测试结果

对于 `test-route.kml`，应该得到：

| 字段 | 预期值 |
|------|--------|
| name | 测试路线 |
| pointCount | 5 |
| length_km | ~0.09 |
| source | 2bulu（如果你选择了1） |
| success | true |

如果所有指标都符合预期，说明测试成功！

## 下一步

测试成功后，就可以：

1. 批量上传你的KML文件
2. 在小程序地图上查看路线
3. 根据需要调整配置和脚本
