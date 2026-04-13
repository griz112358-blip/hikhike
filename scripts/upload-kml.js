#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');
const { URL } = require('url');

// 加载配置
const config = require('./config');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查依赖
function checkDependencies() {
  const required = ['xml2js', 'iconv-lite'];
  const missing = [];
  
  for (const dep of required) {
    try {
      require(dep);
    } catch (err) {
      missing.push(dep);
    }
  }
  
  if (missing.length > 0) {
    log(`缺少依赖包: ${missing.join(', ')}`, 'red');
    log('请运行: npm install ' + missing.join(' '), 'yellow');
    return false;
  }
  
  return true;
}

// 解析KML文件
async function parseKMLFile(filePath) {
  const xml2js = require('xml2js');
  const parser = new xml2js.Parser({ explicitArray: false, trim: true });
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = await parser.parseStringPromise(content);
  const doc = result?.kml?.Document || {};
  
  const name = doc.name || path.basename(filePath, '.kml');
  const description = doc.description || '';
  
  // 提取轨迹点（支持多种格式）
  let points = [];
  const folders = Array.isArray(doc.Folder) ? doc.Folder : (doc.Folder ? [doc.Folder] : []);
  
  // 1. 优先查找 gx:Track 格式（2bulu等）
  const trackFolder = folders.find(f => f.id === 'TbuluTrackFolder' || f.name === '轨迹');
  
  if (trackFolder && trackFolder.Placemark) {
    const placemarks = Array.isArray(trackFolder.Placemark) ? trackFolder.Placemark : [trackFolder.Placemark];
    const trackPlacemark = placemarks.find(p => p['gx:Track']);

    if (trackPlacemark && trackPlacemark['gx:Track']) {
      const track = trackPlacemark['gx:Track'];
      const coords = Array.isArray(track['gx:coord']) ? track['gx:coord'] : [track['gx:coord'] || ''];

      points = coords.map(coordStr => {
        if (!coordStr) return null;
        const [lng, lat, ele = 0] = String(coordStr).trim().split(/\s+/).map(Number);
        return [lng, lat, Number(ele.toFixed(2))];
      }).filter(p => p && !isNaN(p[0]) && !isNaN(p[1]));
    }
  }
  
  // 2. 如果没有 gx:Track，尝试 LineString 格式（wikiloc等）
  if (points.length === 0 && doc.Placemark) {
    const placemarks = Array.isArray(doc.Placemark) ? doc.Placemark : [doc.Placemark];
    const linePlacemark = placemarks.find(p => p.LineString);
    
    if (linePlacemark && linePlacemark.LineString && linePlacemark.LineString.coordinates) {
      const coordStr = linePlacemark.LineString.coordinates;
      const coords = coordStr.trim().split(/\s+/);
      
      points = coords.map(coordStr => {
        const [lng, lat, ele = 0] = coordStr.split(',').map(Number);
        return [lng, lat, Number(ele.toFixed(2))];
      }).filter(p => p && !isNaN(p[0]) && !isNaN(p[1]));
    }
  }

  // 计算长度（公里）- 使用Haversine公式
  let length_km = 0;
  if (points.length >= 2) {
    for (let i = 1; i < points.length; i++) {
      const [lng1, lat1] = points[i - 1];
      const [lng2, lat2] = points[i];
      const R = 6371; // 地球半径（公里）
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      length_km += R * c;
    }
  }
  
  return {
    name: name,
    description: description,
    points: points,
    length_km: parseFloat(length_km.toFixed(2)),
    pointCount: points.length,
    originalFilename: path.basename(filePath)
  };
}

// 上传到云函数
async function uploadToCloudFunction(routeData, source) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.cloudFunction.url);
    
    // 微信云开发HTTP API：直接传递参数，不需要包装event
    // HTTP API会自动将请求体作为event传递给云函数
    const requestData = {
      name: routeData.name,
      points: routeData.points,
      length_km: routeData.length_km,
      source: source
    };
    
    const data = JSON.stringify(requestData);
    
    // 调试日志
    if (config.logLevel === 'debug') {
      log(`  请求URL: ${config.cloudFunction.url}`, 'yellow');
      log(`  请求数据大小: ${Buffer.byteLength(data)} bytes`, 'yellow');
      log(`  请求数据: ${data.substring(0, 200)}...`, 'yellow');
    }
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: config.cloudFunction.timeout
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.success) {
            resolve(result);
          } else {
            // 云函数返回了错误
            reject(new Error(result.error || '上传失败'));
          }
        } catch (err) {
          // JSON解析失败，返回原始响应
          reject(new Error(`解析响应失败 (HTTP ${res.statusCode}): ${responseData.substring(0, 200)}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(new Error(`网络错误: ${err.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时（30秒）'));
    });
    
    req.write(data);
    req.end();
  });
}

// 询问数据来源
function askSource(noPrompt = false, defaultSource = '2bulu') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    if (noPrompt) {
      // 非交互模式，使用默认来源
      log(`使用默认数据来源: ${defaultSource}\n`, 'green');
      resolve(defaultSource);
      return;
    }
    
    log('\n请选择数据来源：', 'cyan');
    console.log('  1. 2bulu');
    console.log('  2. wikiloc');
    console.log('  3. Waymarked');
    console.log('  4. Overpass');
    
    rl.question('\n请输入选项 (1-4): ', (answer) => {
      rl.close();
      const source = config.sources[answer] || 'unknown';
      log(`已选择: ${source}\n`, 'green');
      resolve(source);
    });
  });
}

// 处理单个文件
async function processFile(filePath, source, index, total) {
  try {
    log(`\n[${index + 1}/${total}] 处理: ${path.basename(filePath)}`, 'blue');
    
    const parsed = await parseKMLFile(filePath);
    log(`  路线名称: ${parsed.name}`, 'cyan');
    log(`  轨迹点数: ${parsed.pointCount}`, 'cyan');
    log(`  路线长度: ${parsed.length_km} km`, 'cyan');
    
    if (config.logLevel === 'debug') {
      log(`  原始文件名: ${parsed.originalFilename}`, 'yellow');
      log(`  前3个点: ${JSON.stringify(parsed.points.slice(0, 3))}`, 'yellow');
    }
    
    const result = await uploadToCloudFunction(parsed, source);
    
    log(`  ✓ 上传成功!`, 'green');
    log(`  记录ID: ${result.recordId}`, 'cyan');
    
    return { 
      success: true, 
      filename: path.basename(filePath), 
      routeName: parsed.name,
      result 
    };
  } catch (err) {
    log(`  ✗ 失败: ${err.message}`, 'red');
    return { 
      success: false, 
      filename: path.basename(filePath), 
      error: err.message 
    };
  }
}

// 主函数
async function main() {
  console.log(colors.cyan + '=================================');
  console.log('   KML 文件解析上传工具');
  console.log('=================================' + colors.reset);
  
  // 检查依赖
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  // 检查是否是非交互模式（命令行参数 --no-prompt）
  const noPrompt = process.argv.includes('--no-prompt');
  
  // 获取KML文件目录
  const kmlDirectory = path.resolve(process.argv[2] || path.join(__dirname, config.kmlDirectory));
  
  // 创建目录如果不存在
  if (!fs.existsSync(kmlDirectory)) {
    log(`\n创建目录: ${kmlDirectory}`, 'cyan');
    fs.mkdirSync(kmlDirectory, { recursive: true });
    log(`请将 KML 文件放入目录: ${kmlDirectory}`, 'yellow');
    log('然后重新运行此脚本\n');
    process.exit(0);
  }
  
  // 询问数据来源
  const source = await askSource(noPrompt);

  // 获取KML文件列表（不进行重命名）
  const kmlFiles = fs.readdirSync(kmlDirectory).filter(f => f.toLowerCase().endsWith('.kml'));

  if (kmlFiles.length === 0) {
    log('未找到 KML 文件', 'yellow');
    log('提示: 请先运行 node scripts/rename-kml.js 来重命名文件', 'yellow');
    process.exit(0);
  }

  log(`找到 ${kmlFiles.length} 个 KML 文件`, 'cyan');
  
  // 确认处理
  log(`准备处理 ${kmlFiles.length} 个文件`, 'cyan');
  
  if (!noPrompt) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise(resolve => {
      rl.question('按 Enter 继续，或 Ctrl+C 取消: ', resolve);
    });
    
    rl.close();
    log('', 'cyan'); // 换行
  } else {
    log('非交互模式，直接开始处理...', 'yellow');
  }
  
  // 处理所有文件
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < kmlFiles.length; i++) {
    const filePath = path.join(kmlDirectory, kmlFiles[i]);
    const result = await processFile(filePath, source, i, kmlFiles.length);
    results.push(result);
    
    // 短暂延迟，避免请求过快
    if (i < kmlFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // 汇总结果
  console.log(colors.cyan + '\n=================================');
  console.log('处理完成汇总');
  console.log('=================================' + colors.reset);
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const totalLength = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.result.length_km, 0)
    .toFixed(2);
  
  log(`\n总耗时: ${duration} 秒`, 'cyan');
  log(`成功: ${successCount} 个`, 'green');
  log(`失败: ${failCount} 个`, failCount > 0 ? 'red' : 'cyan');
  log(`总长度: ${totalLength} km`, 'cyan');
  
  if (failCount > 0) {
    log('\n失败的文件:', 'red');
    results.filter(r => !r.success).forEach(r => {
      log(`  - ${r.filename}: ${r.error}`, 'yellow');
    });
  }
  
  // 保存结果到文件
  const resultFile = path.join(__dirname, 'upload-result.json');
  fs.writeFileSync(resultFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    source: source,
    total: results.length,
    success: successCount,
    failed: failCount,
    totalLength: totalLength,
    results: results
  }, null, 2), 'utf-8');
  
  log(`\n结果已保存到: ${resultFile}`, 'cyan');
}

if (require.main === module) {
  main().catch(err => {
    log(`\n错误: ${err.message}`, 'red');
    if (config.logLevel === 'debug') {
      console.error(err);
    }
    process.exit(1);
  });
}

module.exports = { parseKMLFile, uploadToCloudFunction };
