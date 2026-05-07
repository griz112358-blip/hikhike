/**
 * 恢复被错误重命名的文件
 */

const fs = require('fs');
const path = require('path');

const kmlDir = path.join(__dirname, 'kml_files');

console.log('分析当前文件名...\n');

const files = fs.readdirSync(kmlDir).filter(f => f.endsWith('.kml'));

files.forEach(filename => {
  console.log(`文件: ${filename}`);

  // 检测是否是错误修复的文件（包含"功E椒创"这类明显错误的字符）
  if (/功E椒创/.test(filename)) {
    console.log(`  ⚠️  这个文件名看起来是错误修复的结果`);

    // 尝试从原始错误推断正确的文件名
    // "Ia功E椒创�" 应该是 "武功山·反穿"
    // 这些字符是被映射表错误替换的

    // 查找原始的KML文件中的名称
    const filePath = path.join(kmlDir, filename);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const nameMatch = content.match(/<name>([^<]+)<\/name>/);
      if (nameMatch) {
        const originalName = nameMatch[1];
        const newName = originalName + path.extname(filename);

        console.log(`  原始名称: ${originalName}`);
        console.log(`  建议新名称: ${newName}`);

        // 询问是否重命名
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        rl.question(`  是否重命名？(y/n): `, (answer) => {
          rl.close();
          if (answer.toLowerCase() === 'y') {
            const newPath = path.join(kmlDir, newName);
            fs.renameSync(filePath, newPath);
            console.log(`  ✅ 已重命名为: ${newName}\n`);
          } else {
            console.log(`  ❌ 跳过\n`);
          }
        });
      } else {
        console.log('  无法找到原始名称\n');
      }
    } catch (err) {
      console.log(`  ❌ 读取文件失败: ${err.message}\n`);
    }
  } else {
    console.log(`  ✅ 文件名看起来正常\n`);
  }
});

console.log('\n完成！');
