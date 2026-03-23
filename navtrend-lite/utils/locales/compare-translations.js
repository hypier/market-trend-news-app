const fs = require('fs');
const path = require('path');

// 读取并解析TypeScript语言文件
function parseLanguageFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 移除TypeScript类型导入和导出
    const cleanContent = content
      .replace(/import.*from.*;\n/g, '')
      .replace(/export const \w+: LanguageStrings = /, '')
      .replace(/;\s*$/, '');
    
    // 使用eval解析对象（注意：这在生产环境中不安全，仅用于开发工具）
    const langObject = eval(`(${cleanContent})`);
    return langObject;
  } catch (error) {
    console.error(`解析文件失败 ${filePath}:`, error.message);
    return null;
  }
}

// 递归获取对象的所有键路径
function getObjectPaths(obj, prefix = '') {
  const paths = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        paths.push(...getObjectPaths(obj[key], currentPath));
      } else {
        paths.push(currentPath);
      }
    }
  }
  
  return paths.sort();
}

// 检查路径是否存在于对象中
function hasPath(obj, pathStr) {
  const keys = pathStr.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }
  
  return true;
}

// 主比较函数
function compareTranslations() {
  const localesDir = __dirname;
  const languages = ['zh', 'de', 'ja', 'ko', 'id', 'ms'];
  const baseLanguage = 'en';
  
  console.log('🔍 开始比较翻译文件完整性...\n');
  
  // 读取基准文件（英文）
  const baseFilePath = path.join(localesDir, `${baseLanguage}.ts`);
  const baseObject = parseLanguageFile(baseFilePath);
  
  if (!baseObject) {
    console.error('❌ 无法解析基准文件（英文）');
    return;
  }
  
  const basePaths = getObjectPaths(baseObject);
  console.log(`📊 英文基准文件包含 ${basePaths.length} 个翻译键\n`);
  
  // 比较每个语言文件
  const results = {};
  
  for (const lang of languages) {
    const langFilePath = path.join(localesDir, `${lang}.ts`);
    const langObject = parseLanguageFile(langFilePath);
    
    if (!langObject) {
      results[lang] = { error: '解析失败' };
      continue;
    }
    
    const langPaths = getObjectPaths(langObject);
    const missingPaths = [];
    const extraPaths = [];
    
    // 检查缺失的键
    for (const path of basePaths) {
      if (!hasPath(langObject, path)) {
        missingPaths.push(path);
      }
    }
    
    // 检查多余的键
    for (const path of langPaths) {
      if (!hasPath(baseObject, path)) {
        extraPaths.push(path);
      }
    }
    
    results[lang] = {
      totalKeys: langPaths.length,
      missingKeys: missingPaths,
      extraKeys: extraPaths,
      completeness: ((basePaths.length - missingPaths.length) / basePaths.length * 100).toFixed(2)
    };
  }
  
  // 输出结果
  console.log('📋 翻译完整性报告：');
  console.log('='.repeat(60));
  
  for (const [lang, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${lang.toUpperCase()}: ${result.error}`);
      continue;
    }
    
    const status = result.missingKeys.length === 0 ? '✅' : '⚠️';
    console.log(`${status} ${lang.toUpperCase()}: ${result.completeness}% 完整 (${result.totalKeys}/${basePaths.length} 键)`);
    
    if (result.missingKeys.length > 0) {
      console.log(`   缺失 ${result.missingKeys.length} 个键:`);
      result.missingKeys.slice(0, 10).forEach(key => {
        console.log(`     - ${key}`);
      });
      if (result.missingKeys.length > 10) {
        console.log(`     ... 还有 ${result.missingKeys.length - 10} 个`);
      }
    }
    
    if (result.extraKeys.length > 0) {
      console.log(`   多余 ${result.extraKeys.length} 个键:`);
      result.extraKeys.slice(0, 5).forEach(key => {
        console.log(`     + ${key}`);
      });
      if (result.extraKeys.length > 5) {
        console.log(`     ... 还有 ${result.extraKeys.length - 5} 个`);
      }
    }
    console.log('');
  }
  
  // 生成详细报告
  const detailedReport = {
    baseLanguage,
    totalBaseKeys: basePaths.length,
    results,
    timestamp: new Date().toISOString()
  };
  
  const reportPath = path.join(localesDir, 'translation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
  console.log(`📄 详细报告已保存到: ${reportPath}`);
}

// 运行比较
compareTranslations(); 