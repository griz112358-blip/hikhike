#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 重命名KML文件
function renameKMLFiles(directory) {
  const files = fs.readdirSync(directory);
  const kmlFiles = files.filter(f => f.toLowerCase().endsWith('.kml'));

  log(`\n找到 ${kmlFiles.length} 个 KML 文件`, 'cyan');

  let renamedCount = 0;
  kmlFiles.forEach(filename => {
    const oldPath = path.join(directory, filename);

    try {
      const content = fs.readFileSync(oldPath, 'utf-8');
      // 支持两种格式:
      // 1. <name><![CDATA[走马岗 2025-11-22]]></name>
      // 2. <name>走马岗 2025-11-22</name>
      let kmlName = null;

      // 优先匹配 CDATA 格式
      const cdataMatch = content.match(/<name[^>]*><!\[CDATA\[([^\]]+)\]\]><\/name>/);
      if (cdataMatch) {
        kmlName = cdataMatch[1].trim();
      } else {
        // 如果没有 CDATA，匹配普通格式
        const nameMatch = content.match(/<name[^>]*>([^<]+)<\/name>/);
        if (nameMatch) {
          kmlName = nameMatch[1].trim();
        }
      }

      if (kmlName) {
        const ext = path.extname(filename);
        const newName = kmlName + ext;

        if (newName !== filename) {
          const newPath = path.join(directory, newName);
          try {
            if (fs.existsSync(newPath)) {
              fs.unlinkSync(newPath);
            }

            fs.renameSync(oldPath, newPath);
            log(`  重命名: ${filename}`, 'yellow');
            log(`     -> ${newName}`, 'cyan');
            renamedCount++;
          } catch (err) {
            log(`  重命名失败: ${filename} - ${err.message}`, 'red');
          }
        } else {
          log(`  跳过: ${filename} (名称已正确)`, 'green');
        }
      } else {
        log(`  跳过: ${filename} (无法在KML中找到名称)`, 'yellow');
      }
    } catch (err) {
      log(`  读取失败: ${filename} - ${err.message}`, 'red');
    }
  });

  if (renamedCount > 0) {
    log(`\n共修复 ${renamedCount} 个文件名编码问题`, 'green');
  } else {
    log('\n所有文件名均已正确', 'green');
  }

  return fs.readdirSync(directory).filter(f => f.toLowerCase().endsWith('.kml'));
}

// 主函数
async function main() {
  console.log(colors.cyan + '=================================');
  console.log('   KML 文件重命名工具');
  console.log('=================================' + colors.reset);

  const kmlDirectory = path.resolve(process.argv[2] || path.join(__dirname, 'kml_files'));

  if (!fs.existsSync(kmlDirectory)) {
    log(`\n目录不存在: ${kmlDirectory}`, 'red');
    log('请指定正确的 KML 文件目录', 'yellow');
    process.exit(1);
  }

  const kmlFiles = renameKMLFiles(kmlDirectory);

  log(`\n当前目录共有 ${kmlFiles.length} 个 KML 文件`, 'cyan');
}

if (require.main === module) {
  main().catch(err => {
    log(`\n错误: ${err.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { renameKMLFiles };
