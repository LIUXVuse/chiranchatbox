/**
 * 對話服務模組
 * 管理用戶與機器人之間的對話流程和上下文
 */

import logger from '../utils/logger';

// 用戶對話上下文緩存
// 在真實環境中應該使用KV存儲或資料庫
const userContexts = new Map();

// 對話記錄的最大長度
const MAX_DIALOG_HISTORY = 10;

/**
 * 獲取用戶對話上下文
 * @param {string} userId 用戶ID
 * @returns {Object} 用戶對話上下文
 */
function getUserContext(userId) {
  if (!userContexts.has(userId)) {
    // 初始化新用戶的對話上下文
    userContexts.set(userId, {
      history: [],
      lastInteraction: new Date().toISOString()
    });
  }
  
  // 更新最後互動時間
  const context = userContexts.get(userId);
  context.lastInteraction = new Date().toISOString();
  
  return context;
}

/**
 * 記錄用戶訊息
 * @param {string} userId 用戶ID
 * @param {string} message 用戶訊息
 */
async function recordUserMessage(userId, message) {
  const context = getUserContext(userId);
  
  // 添加用戶訊息到對話歷史
  context.history.push({
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  });
  
  // 限制對話歷史長度
  if (context.history.length > MAX_DIALOG_HISTORY) {
    context.history.shift();
  }
  
  logger.debug(`記錄用戶 ${userId} 的訊息`, { message });
  
  // 在實際環境中，這裡可以將對話記錄保存到KV存儲或資料庫
  try {
    // 假設我們有一個NURSING_KNOWLEDGE.put方法來存儲數據
    // await NURSING_KNOWLEDGE.put(`dialog:${userId}`, JSON.stringify(context));
  } catch (error) {
    logger.error('保存用戶對話上下文失敗', { userId, error });
  }
}

/**
 * 記錄用戶圖片
 * @param {string} userId 用戶ID
 * @param {string} imageId 圖片ID
 */
async function recordUserImage(userId, imageId) {
  const context = getUserContext(userId);
  
  // 添加用戶圖片到對話歷史
  context.history.push({
    role: 'user',
    content: `[圖片: ${imageId}]`,
    timestamp: new Date().toISOString()
  });
  
  // 限制對話歷史長度
  if (context.history.length > MAX_DIALOG_HISTORY) {
    context.history.shift();
  }
  
  logger.debug(`記錄用戶 ${userId} 的圖片`, { imageId });
  
  // 在實際環境中，這裡可以將對話記錄保存到KV存儲或資料庫
}

/**
 * 記錄用戶影片
 * @param {string} userId 用戶ID
 * @param {string} videoId 影片ID
 */
async function recordUserVideo(userId, videoId) {
  const context = getUserContext(userId);
  
  // 添加用戶影片到對話歷史
  context.history.push({
    role: 'user',
    content: `[影片: ${videoId}]`,
    timestamp: new Date().toISOString()
  });
  
  // 限制對話歷史長度
  if (context.history.length > MAX_DIALOG_HISTORY) {
    context.history.shift();
  }
  
  logger.debug(`記錄用戶 ${userId} 的影片`, { videoId });
  
  // 在實際環境中，這裡可以將對話記錄保存到KV存儲或資料庫
}

/**
 * 記錄機器人訊息
 * @param {string} userId 用戶ID
 * @param {string|Array} message 機器人訊息或訊息陣列
 */
async function recordBotMessage(userId, message) {
  const context = getUserContext(userId);
  
  // 將訊息格式化為字符串
  let messageStr = '';
  
  if (typeof message === 'string') {
    messageStr = message;
  } else if (Array.isArray(message)) {
    // 如果是消息數組（比如包含文本、圖片等的複合消息）
    messageStr = JSON.stringify(message);
  } else {
    // 如果是單個消息對象
    messageStr = JSON.stringify(message);
  }
  
  // 添加機器人訊息到對話歷史
  context.history.push({
    role: 'bot',
    content: messageStr,
    timestamp: new Date().toISOString()
  });
  
  // 限制對話歷史長度
  if (context.history.length > MAX_DIALOG_HISTORY) {
    context.history.shift();
  }
  
  logger.debug(`記錄機器人對用戶 ${userId} 的回應`);
  
  // 在實際環境中，這裡可以將對話記錄保存到KV存儲或資料庫
}

/**
 * 獲取用戶對話歷史
 * @param {string} userId 用戶ID
 * @returns {Array} 對話歷史陣列
 */
function getDialogHistory(userId) {
  const context = getUserContext(userId);
  return context.history;
}

/**
 * 清除用戶對話上下文
 * @param {string} userId 用戶ID
 */
function clearUserContext(userId) {
  userContexts.delete(userId);
  logger.debug(`清除用戶 ${userId} 的對話上下文`);
  
  // 在實際環境中，這裡可以從KV存儲或資料庫中刪除用戶上下文
}

export default {
  getUserContext,
  recordUserMessage,
  recordUserImage,
  recordUserVideo,
  recordBotMessage,
  getDialogHistory,
  clearUserContext
}; 