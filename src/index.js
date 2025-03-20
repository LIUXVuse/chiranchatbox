/**
 * 三總護理人員聊天機器人
 * 主程序入口點
 */

import { Router } from 'itty-router';
import lineWebhook from './line/webhook';
import knowledgeService from './services/knowledge';
import config from './utils/config';
import logger from './utils/logger';

// 創建路由器
const router = Router();

// 健康檢查路由
router.get('/', async () => {
  return new Response('三總護理人員聊天機器人正常運行中！', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
});

// 診斷端點 - 只在非生產環境中啟用
router.get('/system-check', async ({ env }) => {
  // 檢查是否在生產環境
  if (config.environment === "production") {
    return new Response(JSON.stringify({ error: "此端點在生產環境中不可用" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // 返回系統狀態
  return new Response(JSON.stringify({
    status: "healthy",
    environment: config.environment,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});

// 知識庫搜索端點 - 只在非生產環境中啟用
router.get('/search', async ({ request, env }) => {
  // 檢查是否在生產環境
  if (config.environment === "production") {
    return new Response(JSON.stringify({ error: "此端點在生產環境中不可用" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // 獲取查詢參數
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  
  if (!query) {
    return new Response(JSON.stringify({ error: "必須提供查詢參數 'q'" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  try {
    // 搜索知識庫
    const keywordIndex = await env.NURSING_KNOWLEDGE.get("keyword-index", { type: "json" });
    if (!keywordIndex) {
      throw new Error("找不到關鍵詞索引");
    }
    
    // 準備結果
    const result = {
      query,
      matches: {},
      departments: {}
    };
    
    // 搜索部門標記
    for (const [keyword, value] of Object.entries(keywordIndex)) {
      if (value.startsWith("Department:") && 
          (keyword.toLowerCase() === query.toLowerCase() || query.toLowerCase().includes(keyword.toLowerCase()))) {
        const department = value.replace("Department:", "");
        result.departments[keyword] = department;
      }
    }
    
    // 搜索關鍵詞匹配
    for (const [keyword, value] of Object.entries(keywordIndex)) {
      if (!value.startsWith("Department:") && 
          (keyword.toLowerCase() === query.toLowerCase() || 
           keyword.toLowerCase().includes(query.toLowerCase()) || 
           query.toLowerCase().includes(keyword.toLowerCase()))) {
        result.matches[keyword] = value;
      }
    }
    
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("搜索知識庫時出錯", error);
    return new Response(JSON.stringify({ error: "搜索知識庫時出錯: " + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

// LINE Webhook路由
router.post('/webhook', async (request) => {
  try {
    return await lineWebhook.handleWebhook(request);
  } catch (error) {
    logger.error('處理webhook時發生錯誤', { error });
    return new Response('Internal Server Error', { status: 500 });
  }
});

// 處理404路由
router.all('*', () => {
  return new Response('找不到該路徑', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
});

// 檢查配置是否有效
if (!config.isConfigValid()) {
  logger.error('配置無效，請檢查環境變數設置');
}

// ES Module格式導出
export default {
  async fetch(request, env, ctx) {
    // 設置環境變數到全局配置
    config.setEnv(env);
    
    // 啟動日誌
    logger.info('三總護理人員聊天機器人請求處理', {
      environment: config.getEnvironment(),
      url: request.url
    });
    
    return router.handle(request);
  }
}; 