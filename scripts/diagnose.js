/**
 * 诊断脚本 - 测试云函数连接和上传
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 加载配置
const config = require('./config');

console.log('=================================');
console.log('   云函数连接诊断工具');
console.log('=================================\n');

// 1. 检查配置
console.log('1. 检查配置文件');
console.log(`   云函数URL: ${config.cloudFunction.url}`);
console.log(`   超时设置: ${config.cloudFunction.timeout}ms`);
console.log(`   日志级别: ${config.logLevel}\n`);

// 2. 检查测试文件
const testFile = path.join(__dirname, config.kmlDirectory, 'test-route.kml');
console.log('2. 检查测试文件');
if (fs.existsSync(testFile)) {
  console.log(`   ✓ 文件存在: ${testFile}`);
  const stats = fs.statSync(testFile);
  console.log(`   文件大小: ${stats.size} bytes\n`);
} else {
  console.log(`   ✗ 文件不存在: ${testFile}`);
  console.log('   提示: 请先运行 npm install 或创建测试文件\n');
  process.exit(1);
}

// 3. 解析测试文件
console.log('3. 解析KML文件');
const xml2js = require('xml2js');
const parser = new xml2js.Parser({ explicitArray: false, trim: true });

try {
  const content = fs.readFileSync(testFile, 'utf-8');
  const result = await parser.parseStringPromise(content);
  const doc = result?.kml?.Document || {};
  const name = doc.name || '未命名路线';
  
  console.log(`   ✓ 解析成功`);
  console.log(`   路线名称: ${name}\n`);
} catch (err) {
  console.log(`   ✗ 解析失败: ${err.message}\n`);
  process.exit(1);
}

// 4. 准备测试数据
console.log('4. 准备测试数据');
const testData = {
  name: '测试路线',
  points: [
    [116.397428, 39.90923, 50],
    [116.397528, 39.90933, 51],
    [116.397628, 39.90943, 52]
  ],
  length_km: 0.05,
  source: '2bulu'
};

const testDataStr = JSON.stringify(testData);
console.log(`   ✓ 测试数据准备完成`);
console.log(`   数据大小: ${Buffer.byteLength(testDataStr)} bytes`);
console.log(`   数据预览: ${JSON.stringify(testData, null, 2)}\n`);

// 5. 测试网络连接
console.log('5. 测试网络连接');
const url = new URL(config.cloudFunction.url);
console.log(`   目标主机: ${url.hostname}`);
console.log(`   目标端口: ${url.port || 443}`);
console.log(`   目标路径: ${url.pathname}\n`);

// 6. 发送测试请求
console.log('6. 发送测试请求...');

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testDataStr)
  },
  timeout: 10000 // 10秒超时
};

console.log('   请求详情:');
console.log(`   - 方法: ${options.method}`);
console.log(`   - Headers: ${JSON.stringify(options.headers, null, 2)}`);
console.log('   正在发送...\n');

const req = https.request(options, (res) => {
  let responseData = '';
  
  console.log('   收到响应:');
  console.log(`   - HTTP状态码: ${res.statusCode}`);
  console.log(`   - 状态消息: ${res.statusMessage}`);
  console.log(`   - 响应头: ${JSON.stringify(res.headers, null, 2)}\n`);
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('   响应内容:');
    console.log(`   - 大小: ${responseData.length} bytes`);
    console.log(`   - 内容: ${responseData}\n`);
    
    try {
      const result = JSON.parse(responseData);
      
      if (result.success) {
        console.log('✅ 测试成功！');
        console.log(`   记录ID: ${result.recordId}`);
        console.log(`   路线名称: ${result.name}`);
        console.log(`   轨迹点数: ${result.pointCount}`);
        console.log(`   路线长度: ${result.length_km} km\n`);
        
        console.log('=================================');
        console.log('云函数连接正常，可以正常使用');
        console.log('=================================\n');
        
        process.exit(0);
      } else {
        console.log('❌ 云函数返回错误:');
        console.log(`   错误信息: ${result.error}\n`);
        
        console.log('可能的原因:');
        console.log('   1. 云函数未正确部署');
        console.log('   2. 云函数代码有错误');
        console.log('   3. 数据库权限问题');
        console.log('   4. 云函数URL配置错误\n');
        
        console.log('建议操作:');
        console.log('   1. 在微信开发者工具中查看云函数日志');
        console.log('   2. 重新部署云函数');
        console.log('   3. 检查云开发控制台中的数据库配置\n');
        
        process.exit(1);
      }
    } catch (err) {
      console.log('❌ 解析响应失败:');
      console.log(`   错误: ${err.message}`);
      console.log(`   原始响应: ${responseData}\n`);
      
      console.log('可能的原因:');
      console.log('   1. 云函数返回的不是JSON格式');
      console.log('   2. 网络传输错误');
      console.log('   3. 云函数URL错误\n');
      
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.log('❌ 网络错误:');
  console.log(`   错误类型: ${err.code}`);
  console.log(`   错误信息: ${err.message}\n`);
  
  console.log('可能的原因:');
  if (err.code === 'ECONNREFUSED') {
    console.log('   1. 云函数未部署');
    console.log('   2. 云函数URL错误');
    console.log('   3. 防火墙阻止连接');
  } else if (err.code === 'ENOTFOUND') {
    console.log('   1. 域名解析失败');
    console.log('   2. 网络连接问题');
    console.log('   3. 云函数URL错误');
  } else if (err.code === 'ETIMEDOUT') {
    console.log('   1. 网络连接超时');
    console.log('   2. 云函数响应慢');
    console.log('   3. 防火墙问题');
  } else {
    console.log('   1. 网络连接问题');
    console.log('   2. 云函数配置错误');
  }
  
  console.log('\n建议操作:');
  console.log('   1. 检查网络连接');
  console.log('   2. 确认云函数URL正确');
  console.log('   3. 在微信开发者工具中部署云函数');
  console.log('   4. 查看云函数日志排查问题\n');
  
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ 请求超时\n');
  console.log('可能的原因:');
  console.log('   1. 网络连接慢');
  console.log('   2. 云函数处理时间长');
  console.log('   3. 云函数未响应\n');
  
  console.log('建议操作:');
  console.log('   1. 检查网络连接');
  console.log('   2. 增加超时时间');
  console.log('   3. 查看云函数日志\n');
  
  process.exit(1);
});

req.write(testDataStr);
req.end();

console.log('请求已发送，等待响应...\n');
