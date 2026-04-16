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

// 安全输出文件名，避免终端编码问题
function safeFilename(filename) {
  try {
    // 只对确实包含乱码的文件名进行 GBK 解码
    if (hasGarbledText(filename)) {
      try {
        const buffer = Buffer.from(filename, 'binary');
        const decoded = require('iconv-lite').decode(buffer, 'gbk');
        return decoded + (filename !== decoded ? ` (原始: ${filename})` : '');
      } catch (e) {
        return filename;
      }
    }
    return filename;
  } catch (err) {
    return filename;
  }
}

// GBK 解码函数
function fixGBKFilename(filename) {
  const iconv = require('iconv-lite');

  try {
    // 1. 先把被错误解码的字符串转回字节（使用 binary 保持原始字节）
    const buffer = Buffer.from(filename, 'binary');

    // 2. 用 GBK 正确解码这些字节
    let fixed = iconv.decode(buffer, 'gbk');

    // 3. 清理可能的异常字符（保险起见）
    fixed = fixed.replace(/\uFFFD/g, ''); // 移除解码失败的替换字符
    fixed = fixed.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // 移除控制字符
    fixed = fixed.replace(/\x00/g, ''); // 移除 null bytes

    return fixed;
  } catch (err) {
    // 如果解码失败，返回原文件名
    if (process.env.DEBUG === 'true') {
      log(`  GBK解码失败: ${err.message}`, 'yellow');
    }
    return filename;
  }
}

// 检查文件名是否包含乱码
function hasGarbledText(filename) {
  // 更严格的乱码检测：只检测典型的 GBK 乱码字符
  // 这些字符通常出现在 GBK 编码被错误解释为其他编码时
  const gbkGarbledPattern = /[ÙÜÉ½ÐÄÏßÀÅþ²ª°®µ÷£¬»¨¾§Ÿ¹º»¼½¿]/;

  // 检查是否包含明显的控制字符（除了常见的换行符等）
  const controlChars = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/;

  // 检查是否包含大量的解码失败字符
  const replacementChars = (filename.match(/\uFFFD/g) || []).length;
  if (replacementChars > 2) {
    return true;
  }

  return gbkGarbledPattern.test(filename) || controlChars.test(filename);
}

// 从 KML 文件内容中提取正确的名称
function extractNameFromKML(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 优先匹配 CDATA 格式
    const cdataMatch = content.match(/<name[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/name>/);
    if (cdataMatch) {
      return cdataMatch[1].trim().replace(/\s+/g, ' ');
    }

    // 如果没有 CDATA，匹配普通格式
    const nameMatch = content.match(/<name[^>]*>([^<]+)<\/name>/);
    if (nameMatch) {
      return nameMatch[1].trim();
    }

    return null;
  } catch (err) {
    return null;
  }
}

// 重命名KML文件
function renameKMLFiles(directory) {
  // 使用 buffer encoding 获取原始文件名（避免 NFD 归一化问题）
  const files = fs.readdirSync(directory, { encoding: 'buffer' });
  const kmlFiles = files
    .map(f => f.toString('utf8'))
    .filter(f => f.toLowerCase().endsWith('.kml'));

  log(`\n找到 ${kmlFiles.length} 个 KML 文件`, 'cyan');

  let renamedCount = 0;
  kmlFiles.forEach(filename => {
    const oldPath = path.join(directory, filename);

    try {
      // 1. 优先尝试 GBK 解码文件名（这是最可靠的方式）
      const fixedFilename = fixGBKFilename(filename);

      if (fixedFilename !== filename && hasGarbledText(filename)) {
        const ext = path.extname(fixedFilename);
        const newName = fixedFilename.replace(/\.[^.]+$/, '');
        const newFilename = newName + ext;

        const newPath = path.join(directory, newFilename);
        try {
          if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
          }

          fs.renameSync(oldPath, newPath);
          log(`  重命名 (GBK): ${safeFilename(filename)}`, 'yellow');
          log(`     -> ${newFilename}`, 'cyan');
          renamedCount++;
        } catch (err) {
          log(`  重命名失败: ${safeFilename(filename)} - ${err.message}`, 'red');
        }
      } else {
        // 2. 如果文件名没有乱码，尝试从 KML 内容中提取正确的名称
        const kmlName = extractNameFromKML(oldPath);

        if (kmlName) {
          const ext = path.extname(filename);
          const newName = kmlName + ext;

          // 将文件名和 KML 名称都转换为 NFC 后比较
          const filenameNFC = filename.normalize('NFC');
          const newNameNFC = newName.normalize('NFC');

          // 只有当 KML 中的名称和当前文件名不同时才重命名
          if (newNameNFC !== filenameNFC) {
            const newPath = path.join(directory, newName);
            try {
              // 如果目标文件已存在，删除它
              if (fs.existsSync(newPath)) {
                fs.unlinkSync(newPath);
              }

              fs.renameSync(oldPath, newPath);
              log(`  重命名: ${safeFilename(filename)}`, 'yellow');
              log(`     -> ${newName}`, 'cyan');
              renamedCount++;
            } catch (err) {
              log(`  重命名失败: ${safeFilename(filename)} - ${err.message}`, 'red');
            }
          } else {
            log(`  跳过: ${filename} (名称已正确)`, 'green');
          }
        } else {
          log(`  跳过: ${filename} (无法在KML中找到名称且无乱码)`, 'yellow');
        }
      }
    } catch (err) {
      log(`  读取失败: ${safeFilename(filename)} - ${err.message}`, 'red');
    }
  });

  if (renamedCount > 0) {
    log(`\n共修复 ${renamedCount} 个文件名编码问题`, 'green');
  } else {
    log('\n所有文件名均已正确', 'green');
  }

  return fs.readdirSync(directory, { encoding: 'buffer' })
    .map(f => f.toString('utf8'))
    .filter(f => f.toLowerCase().endsWith('.kml'));
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
