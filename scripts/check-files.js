const fs = require('fs');
const path = require('path');

const kmlDir = path.join(__dirname, 'kml_files');
const files = fs.readdirSync(kmlDir).filter(f => f.endsWith('.kml'));

console.log('当前KML文件列表：\n');

files.forEach((filename, index) => {
  const filePath = path.join(kmlDir, filename);
  const stats = fs.statSync(filePath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  // 尝试读取KML中的名称
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const nameMatch = content.match(/<name>([^<]+)<\/name>/);
    const kmlName = nameMatch ? nameMatch[1] : '未知';

    console.log(`${index + 1}. ${filename}`);
    console.log(`   大小: ${sizeMB} MB`);
    console.log(`   KML中的名称: ${kmlName}\n`);
  } catch (err) {
    console.log(`${index + 1}. ${filename}`);
    console.log(`   大小: ${sizeMB} MB`);
    console.log(`   无法读取KML内容\n`);
  }
});

console.log('请告诉我这些文件的正确名称，我会帮你修复重命名问题。');
