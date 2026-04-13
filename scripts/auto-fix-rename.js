#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const kmlDir = path.join(__dirname, 'kml_files');
const files = fs.readdirSync(kmlDir).filter(f => f.endsWith('.kml'));

console.log('自动修复文件名...\n');

let fixedCount = 0;

files.forEach(filename => {
  const filePath = path.join(kmlDir, filename);

  // 读取KML中的名称
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const nameMatch = content.match(/<name>([^<]+)<\/name>/);

    if (nameMatch) {
      const kmlName = nameMatch[1].trim();
      const ext = path.extname(filename);
      const newName = kmlName + ext;

      // 如果KML中的名称和当前文件名不同
      if (newName !== filename) {
        const newPath = path.join(kmlDir, newName);

        try {
          // 如果目标文件已存在，删除它
          if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
          }

          fs.renameSync(filePath, newPath);
          console.log(`✅ ${filename}`);
          console.log(`   → ${newName}\n`);
          fixedCount++;
        } catch (err) {
          console.log(`❌ 修复失败: ${filename}`);
          console.log(`   错误: ${err.message}\n`);
        }
      } else {
        console.log(`✓ ${filename} (已经是正确的名称)\n`);
      }
    } else {
      console.log(`? ${filename} (无法在KML中找到名称)\n`);
    }
  } catch (err) {
    console.log(`❌ 读取失败: ${filename}`);
    console.log(`   错误: ${err.message}\n`);
  }
});

console.log(`\n完成！共修复 ${fixedCount} 个文件`);
