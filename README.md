# 護理知識庫聊天機器人

本專案是一個基於LINE的護理知識庫聊天機器人，用於提供護理相關的ISO文件和知識查詢服務。

## 功能特點

- 支援多部門ISO文件管理
- 關鍵詞智能匹配
- 部門分類查詢
- 圖文影音整合
- 即時回應

## 系統架構

- 前端：LINE Bot介面
- 後端：Cloudflare Workers
- 存儲：Cloudflare KV
- 部署：Wrangler CLI

## ISO文件管理

### 目錄結構

```
iso-documents/
  ├── icu/          # ICU加護病房
  │   ├── cvvh-setup.json
  │   └── blood-pressure.json
  ├── er/           # ER急診
  │   └── medication-admin.json
  ├── ward/         # Ward病房
  ├── or/           # OR手術室
  ├── opd/          # OPD門診
  └── nurse/        # Nurse護理部通用
```

### 添加新的ISO文件

1. 在對應部門目錄下創建JSON文件，例如 `iso-documents/icu/new-protocol.json`：

```json
{
  "id": "icu-new-protocol",
  "keywords": ["關鍵詞1", "關鍵詞2"],
  "text": "# 標題\n\n正文內容...",
  "imageUrl": "圖片URL",
  "videoUrl": "影片URL",
  "videoPreviewUrl": "預覽圖URL"
}
```

2. 運行上傳腳本：
```bash
node upload-iso-files.js
```

3. 執行生成的上傳命令：
```bash
# 上傳到預覽環境（測試用）
npx wrangler kv:key put --namespace-id=53f0fc23f85c418e9fa2f5cba659fddf "knowledge:icu-new-protocol" --path="icu-new-protocol.json"

# 確認無誤後，上傳到生產環境
npx wrangler kv:key put --namespace-id=4303fd77b4754fd2aa994ec132087533 "knowledge:icu-new-protocol" --path="icu-new-protocol.json"
```

### 部門代碼

目前支援的部門代碼：
- `icu` - ICU加護病房
- `er` - ER急診
- `ward` - Ward病房
- `or` - OR手術室
- `opd` - OPD門診
- `nurse` - Nurse護理部通用

## 開發指南

### 環境設置

1. 安裝依賴：
```bash
npm install
```

2. 配置環境變數：
```bash
# LINE Bot設置
npx wrangler secret put LINE_CHANNEL_SECRET
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN

# KV命名空間綁定
npx wrangler kv:namespace create nursing_knowledge
npx wrangler kv:namespace create nursing_knowledge_preview --preview
```

### 本地開發

```bash
npm run dev
```

### 部署

```bash
npm run deploy
```

## 維護與更新

本專案採用模組化設計，便於擴展和維護：

1. 管理ISO文件知識庫：
   - 使用 `upload-iso-files.js` 工具上傳新的ISO文件
   - ISO文件存放在 `iso-documents` 目錄下對應部門文件夾中

2. 調整對話流程：修改 `src/services/dialog.js`
3. 自定義回應格式：修改 `src/handlers/text.js`

## 敏感資訊管理

所有API密鑰和敏感資訊均存放在Cloudflare Workers環境變數中，並通過 `wrangler.toml` 配置進行管理。敏感資訊請勿公開或提交至版本控制系統。

## Cloudflare部署資訊

- Workers網域：https://chiran-nursing-chatbot.liupony2000.workers.dev
- Webhook URL：https://chiran-nursing-chatbot.liupony2000.workers.dev/webhook

## 知識庫系統

知識庫系統使用Cloudflare KV存儲來管理護理知識條目。

### 關鍵字索引

關鍵字索引（`keyword-index`）是一個映射表，將各種關鍵詞映射到相應的知識條目。另外，它也包含部門標記，格式為「Department:部門名稱」。

### 更新知識庫

1. 在適當的部門目錄下添加新的ISO文件JSON
2. 運行上傳腳本：`node upload-iso-files.js`
3. 執行生成的上傳命令
4. 刪除臨時JSON文件：`del *.json`

### 診斷端點

在非生產環境中，系統提供了以下診斷端點：

1. `/system-check` - 檢查系統狀態
   - 返回：系統狀態、環境和時間戳

2. `/search?q=關鍵詞` - 搜索知識庫
   - 參數：`q` - 搜索關鍵詞
   - 返回：匹配的關鍵詞和部門標記

這些端點在生產環境中不可用，僅供開發和測試使用。 