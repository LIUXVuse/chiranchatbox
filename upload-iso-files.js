/**
 * ISO文件知識庫上傳工具（改進版）
 * 此腳本從iso-documents目錄讀取ISO文件並上傳到Cloudflare KV存儲
 * 使用方法:
 * 1. 將ISO知識條目JSON文件放入iso-documents/部門/文件名.json
 * 2. 運行腳本: node upload-iso-files.js
 * 3. 運行產生的wrangler命令上傳到KV存儲
 */

const fs = require('fs');
const path = require('path');

// 部門配置
const departments = [
  { code: 'icu', name: 'ICU加護病房' },
  { code: 'er', name: 'ER急診' },
  { code: 'ward', name: 'Ward病房' },
  { code: 'or', name: 'OR手術室' },
  { code: 'opd', name: 'OPD門診' },
  { code: 'nurse', name: 'Nurse護理部通用' }
];

// ISO文件目錄
const ISO_DIR = 'iso-documents';

// 讀取ISO文件
function readIsoFiles() {
  const isoKnowledge = [];
  const departmentFolders = departments.map(dept => dept.code);
  
  // 遍歷每個部門文件夾
  departmentFolders.forEach(deptFolder => {
    const deptPath = path.join(ISO_DIR, deptFolder);
    
    // 檢查部門目錄是否存在
    if (fs.existsSync(deptPath)) {
      // 讀取部門目錄中的所有JSON文件
      const files = fs.readdirSync(deptPath);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(deptPath, file);
          try {
            // 讀取JSON文件內容
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const knowledge = JSON.parse(fileContent);
            
            // 驗證知識條目格式
            if (knowledge && knowledge.id && knowledge.keywords && knowledge.text) {
              // 確保ID以部門名稱開頭
              if (!knowledge.id.startsWith(`${deptFolder}-`)) {
                console.warn(`警告: 文件 ${filePath} 的ID不是以 "${deptFolder}-" 開頭，這可能會導致部門分類錯誤。`);
              }
              
              isoKnowledge.push(knowledge);
              console.log(`成功讀取 ${filePath}`);
            } else {
              console.error(`錯誤: 文件 ${filePath} 格式無效，缺少必要欄位(id, keywords, text)`);
            }
          } catch (error) {
            console.error(`錯誤: 無法讀取或解析 ${filePath}`, error);
          }
        }
      });
    } else {
      console.warn(`警告: 部門目錄 ${deptPath} 不存在，已跳過`);
    }
  });
  
  console.log(`總共讀取了 ${isoKnowledge.length} 個ISO文件知識條目`);
  return isoKnowledge;
}

// 生成臨時JSON文件
function generateJsonFiles(isoKnowledge) {
  // 建立關鍵詞索引
  const keywordIndex = {};
  
  // 添加部門標記到關鍵詞索引
  departments.forEach(dept => {
    keywordIndex[dept.code] = `Department:${dept.code}`;
    console.log(`添加部門標記: ${dept.code} -> Department:${dept.code} (${dept.name})`);
  });
  
  // 添加知識條目關鍵詞
  isoKnowledge.forEach(entry => {
    console.log(`處理知識條目: ${entry.id}`);
    
    // 添加所有關鍵詞
    entry.keywords.forEach(keyword => {
      // 確保關鍵詞不會與部門代碼衝突
      const lowerKeyword = keyword.toLowerCase();
      if (departments.some(dept => dept.code === lowerKeyword)) {
        console.log(`警告: 關鍵詞 "${keyword}" 與部門名稱衝突，保留部門標記優先`);
        return;
      }
      keywordIndex[keyword] = entry.id;
      console.log(`添加關鍵詞: ${keyword} -> ${entry.id}`);
    });
  });

  console.log('正在生成臨時JSON文件...');
  
  // 為每個知識條目創建一個文件
  isoKnowledge.forEach(knowledge => {
    fs.writeFileSync(`${knowledge.id}.json`, JSON.stringify(knowledge, null, 2));
    console.log(`已創建臨時文件: ${knowledge.id}.json`);
  });

  // 為關鍵詞索引創建一個文件
  fs.writeFileSync('keyword-index.json', JSON.stringify(keywordIndex, null, 2));
  console.log('已創建臨時文件: keyword-index.json');
  console.log(`關鍵詞索引包含 ${Object.keys(keywordIndex).length} 個條目`);
  
  // 檢查部門關鍵詞設置
  departments.forEach(dept => {
    if (keywordIndex[dept.code] && keywordIndex[dept.code].startsWith('Department:')) {
      console.log(`✅ 部門關鍵詞設置正確: ${dept.code} -> ${keywordIndex[dept.code]} (${dept.name})`);
    } else {
      console.warn(`❌ 部門關鍵詞設置錯誤: ${dept.code} -> ${keywordIndex[dept.code] || '未設置'}`);
    }
  });

  return { keywordIndex };
}

// 生成上傳命令
function generateUploadCommands(isoKnowledge) {
  console.log('\n要上傳ISO知識庫數據，請執行以下命令:');
  
  // 生產環境命名空間ID
  const productionNamespaceId = '4303fd77b4754fd2aa994ec132087533';
  
  // 預覽環境命名空間ID（測試用）
  const previewNamespaceId = '53f0fc23f85c418e9fa2f5cba659fddf';
  
  console.log('\n# 上傳到預覽環境（測試用）:');
  isoKnowledge.forEach(knowledge => {
    console.log(`npx wrangler kv:key put --namespace-id=${previewNamespaceId} "knowledge:${knowledge.id}" --path="${knowledge.id}.json"`);
  });
  console.log(`npx wrangler kv:key put --namespace-id=${previewNamespaceId} "keyword-index" --path="keyword-index.json"`);
  
  console.log('\n# 確認無誤後，上傳到生產環境:');
  isoKnowledge.forEach(knowledge => {
    console.log(`npx wrangler kv:key put --namespace-id=${productionNamespaceId} "knowledge:${knowledge.id}" --path="${knowledge.id}.json"`);
  });
  console.log(`npx wrangler kv:key put --namespace-id=${productionNamespaceId} "keyword-index" --path="keyword-index.json"`);
  
  console.log('\n上傳完成後，可以刪除臨時文件:');
  console.log('del *.json');
}

// ISO文件模板指南
function showIsoTemplateGuide() {
  console.log('\n=== ISO文件模板指南 ===');
  console.log('創建新的ISO文件時，請遵循以下JSON格式：');
  console.log(`{
  "id": "部門-文件標識",             // 例如: "icu-blood-pressure"
  "keywords": ["關鍵詞1", "關鍵詞2"], // 用戶可能會用來搜索此文件的關鍵詞
  "text": "# ISO文件標題\\n\\n正文內容...", // 使用Markdown格式
  "imageUrl": "圖片URL",             // 可選
  "videoUrl": "影片URL",             // 可選
  "videoPreviewUrl": "預覽圖URL"     // 可選
}`);
  console.log('\n將文件保存為：iso-documents/部門/文件標識.json');
}

// 圖片上傳指南
function showImageUploadGuide() {
  console.log('\n=== 圖片和影片上傳指南 ===');
  console.log('目前有兩種方式可以儲存與ISO文件相關的圖片和影片:');
  console.log('1. 使用外部存儲服務（如 Cloudflare R2、AWS S3、或圖床服務）');
  console.log('   - 將圖片上傳到這些服務');
  console.log('   - 獲取公開訪問URL');
  console.log('   - 在知識條目中使用該URL作為imageUrl或videoUrl');
  console.log('2. 使用 Cloudflare Pages 或 Workers 靜態資源');
  console.log('   - 上傳圖片到 Cloudflare Pages 項目');
  console.log('   - 使用 Pages 生成的URL作為圖片來源');
  console.log('請選擇適合您需求的方式來存儲和引用圖片資源。');
}

// 主函數
function main() {
  // 從ISO目錄讀取文件
  const isoKnowledge = readIsoFiles();
  
  if (isoKnowledge.length === 0) {
    console.log('沒有找到任何ISO文件知識條目。請先在iso-documents目錄下添加JSON文件再運行此腳本。');
    showIsoTemplateGuide();
    return;
  }
  
  generateJsonFiles(isoKnowledge);
  generateUploadCommands(isoKnowledge);
  showIsoTemplateGuide();
  showImageUploadGuide();
}

// 執行主函數
main(); 