/**
 * ISO文件知識庫上傳工具
 * 此腳本用於將ISO文件知識庫數據上傳到Cloudflare KV存儲
 * 使用方法:
 * 1. 添加ISO知識條目到下方的isoKnowledge陣列中
 * 2. 運行腳本: node upload-knowledge.js
 * 3. 運行產生的wrangler命令上傳到KV存儲
 */

const fs = require('fs');

// 這裡添加ISO文件知識條目
const isoKnowledge = [
  // ICU部門 - CVVH手動裝置教學
  {
    id: 'icu-cvvh-setup',
    keywords: ['CVVH', '連續性靜脈靜脈血液過濾', 'CVVH裝置', 'CVVH安裝', 'CVVH設定', '血液透析', 'ICU透析', '重症透析'],
    text: `# CVVH 手動裝置教學步驟指引

#### Step 1：Set 組件裝入
- 操作指示：整個 set 依箭頭方向⬇️向下卡入固定槽。
- 圖片輔助：提供實際照片標示箭頭方向。

#### Step 2：粗軟管安裝
- 操作指示：將粗軟管卡入四個齒輪⚙️中，對應顏色放置。
- 提示：對錯誤放置提供警示訊息。

#### Step 3：右側管路安裝
- 操作指示：將右側管路自上而下塞入導槽固定。

#### Step 4：病人管路對接
- 操作指示：與病人端管路對接後，掛上機器右側掛鉤。

#### Step 5：VAPU 管路安裝
- 操作指示：四根管子對應插入四個指定洞口（名稱標示清楚），並旋緊固定。

#### Step 6：過濾器接合
- 操作指示：
  - 左側過濾器安裝。
  - EKG line 接上藍頭端。
  - 另一端接上濾器外管連接點。
  - 紅頭凸點無需接線。

#### Step 7：底部設備安裝
- 操作指示：
  - 放置廢液桶、補充液至正確位置。
  - 圖片輔助：顯示實物放置位置。

#### Step 8：加溫管纏繞
- 操作指示：
  - 細長軟管由後往前逆時針纏繞。
  - 預留 5 公分空間避免卡住。

#### Step 9：夾具固定
- 操作指示：確認機器左上、右上兩側夾具 Lock 住。

#### Step 10：啟動 priming
- 操作指示：確認所有步驟完成後，啟動 priming 程序。

#### 注意事項
- 整個安裝過程須保持無菌操作。
- 確保所有連接處都已確實固定，避免漏液。
- 遇到警示訊息請勿忽略，應立即檢查並排除故障。

#### 教學影片參考
- 可觀看教學影片以獲得更直觀的指導：https://www.youtube.com/watch?v=CXmG1o3RjQk`,
    imageUrl: '',  // 移除圖片URL
    videoUrl: 'https://www.youtube.com/watch?v=CXmG1o3RjQk'
  },
  
  // 示例格式（請使用實際ISO文件內容替換）:
  /*
  {
    id: 'iso-document-id',               // 文件唯一標識符
    keywords: ['關鍵詞1', '關鍵詞2'],     // 用於查詢匹配的關鍵詞
    text: `ISO文件內容...`,               // 文件主要內容
    imageUrl: 'https://example.com/images/image.jpg',  // 可選：相關圖片URL
    videoUrl: 'https://example.com/videos/video.mp4',  // 可選：相關影片URL
    videoPreviewUrl: 'https://example.com/images/preview.jpg'  // 可選：影片預覽圖URL
  }
  */
];

// 為方便開發與測試，生成臨時JSON文件
function generateJsonFiles() {
  // 建立關鍵詞索引
  const keywordIndex = {};
  
  // 添加部門標記，用於處理部門查詢
  const departments = [
    { code: 'icu', name: 'ICU加護病房' },
    { code: 'er', name: 'ER急診' },
    { code: 'ward', name: 'Ward病房' },
    { code: 'or', name: 'OR手術室' },
    { code: 'opd', name: 'OPD門診' },
    { code: 'nurse', name: 'Nurse護理部通用' }
  ];
  
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
      if (departments.includes(lowerKeyword)) {
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
function generateUploadCommands() {
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
  if (isoKnowledge.length === 0) {
    console.log('尚未添加任何ISO文件知識條目。請先在isoKnowledge陣列中添加內容再運行此腳本。');
    return;
  }
  
  const { keywordIndex } = generateJsonFiles();
  generateUploadCommands();
  showImageUploadGuide();
}

// 執行主函數
main(); 