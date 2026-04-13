#!/usr/bin/env node

/**
 * 手动修复被错误重命名的文件
 */

const fs = require('fs');
const path = require('path');

const kmlDir = path.join(__dirname, 'kml_files');

// 手动映射：错误修复的文件名 -> 正确的文件名
const manualFixes = {
  'Ia功E椒创� (1).kml': '2025-07-27武功山·反穿 (1).kml',
  'Ia功E椒创�.kml': '2025-07-27武功山·反穿.kml',
  '2025-07-27ÙÜÉ½ (1).kml': '2025-07-27武功山·反穿 (1).kml',
  '2025-07-27ÙÜÉ½.kml': '2025-07-27武功山·反穿.kml'
};

console.log('正在修复文件名...\n');

let fixedCount = 0;

for (const [wrong, correct] of Object.entries(manualFixes)) {
  const wrongPath = path.join(kmlDir, wrong);
  const correctPath = path.join(kmlDir, correct);

  if (fs.existsSync(wrongPath)) {
    try {
      // 如果目标文件已存在，删除它
      if (fs.existsSync(correctPath)) {
        fs.unlinkSync(correctPath);
        console.log(`  删除已存在的文件: ${correct}`);
      }

      fs.renameSync(wrongPath, correctPath);
      console.log(`✅ ${wrong}`);
      console.log(`   → ${correct}\n`);
      fixedCount++;
    } catch (err) {
      console.log(`❌ 修复失败: ${wrong}`);
      console.log(`   错误: ${err.message}\n`);
    }
  }
}

console.log(`\n完成！共修复 ${fixedCount} 个文件`);
