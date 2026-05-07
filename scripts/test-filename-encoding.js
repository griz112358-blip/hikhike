const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'kml_files');
const files = fs.readdirSync(directory);

const targetFile = files.find(f => f.includes('¶«'));
console.log('找到文件:', JSON.stringify(targetFile));

// 测试不同的 Buffer.from 参数
const filename = targetFile;
console.log('\n原始文件名:', filename);

const encodings = ['utf-8', 'binary', 'latin1', 'hex'];
encodings.forEach(enc => {
  try {
    const buf = Buffer.from(filename, enc);
    console.log(`\n${enc} 编码:`);
    console.log('  长度:', buf.length);
    console.log('  字节:', Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join(' '));
  } catch (err) {
    console.log(`\n${enc} 失败:`, err.message);
  }
});

// 测试 fs.readFileSync 的 encoding 选项
console.log('\n\n测试文件读取:');
const testDir = fs.readdirSync(directory, { encoding: 'buffer' });
console.log('Buffer 编码的文件名列表:');
const testTarget = testDir.find(f => {
  const s = f.toString();
  return s.includes('¶«');
});
if (testTarget) {
  console.log('目标文件 Buffer:', Array.from(testTarget).map(b => b.toString(16).padStart(2, '0')).join(' '));
}
