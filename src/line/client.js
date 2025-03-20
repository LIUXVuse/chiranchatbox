/**
 * LINE客戶端模組
 * 處理LINE訊息API的調用
 */

import { Client } from '@line/bot-sdk';
import config from '../utils/config';
import logger from '../utils/logger';

// LINE SDK客戶端實例
let lineClient = null;

/**
 * 獲取LINE客戶端
 * @returns {Client} LINE SDK客戶端
 */
function getClient() {
  if (!lineClient) {
    lineClient = new Client({
      channelSecret: config.line.channelSecret,
      channelAccessToken: config.line.channelAccessToken
    });
    logger.debug('LINE客戶端已初始化', {
      channelId: config.line.channelId
    });
  }
  return lineClient;
}

/**
 * 發送文字訊息
 * @param {string} userId 用戶ID
 * @param {string} text 文字內容
 * @returns {Promise<any>} LINE API回應
 */
async function sendTextMessage(userId, text) {
  try {
    logger.debug(`發送文字訊息給用戶 ${userId}`, { text });
    return await getClient().pushMessage(userId, {
      type: 'text',
      text: text
    });
  } catch (error) {
    logger.error('發送文字訊息失敗', { userId, text, error });
    throw error;
  }
}

/**
 * 發送圖片訊息
 * @param {string} userId 用戶ID
 * @param {string} originalContentUrl 原始圖片URL
 * @param {string} previewImageUrl 預覽圖片URL
 * @returns {Promise<any>} LINE API回應
 */
async function sendImageMessage(userId, originalContentUrl, previewImageUrl) {
  try {
    logger.debug(`發送圖片訊息給用戶 ${userId}`, { originalContentUrl, previewImageUrl });
    return await getClient().pushMessage(userId, {
      type: 'image',
      originalContentUrl,
      previewImageUrl: previewImageUrl || originalContentUrl
    });
  } catch (error) {
    logger.error('發送圖片訊息失敗', { userId, originalContentUrl, error });
    throw error;
  }
}

/**
 * 發送影片訊息
 * @param {string} userId 用戶ID
 * @param {string} originalContentUrl 影片URL
 * @param {string} previewImageUrl 預覽圖片URL
 * @returns {Promise<any>} LINE API回應
 */
async function sendVideoMessage(userId, originalContentUrl, previewImageUrl) {
  try {
    logger.debug(`發送影片訊息給用戶 ${userId}`, { originalContentUrl, previewImageUrl });
    return await getClient().pushMessage(userId, {
      type: 'video',
      originalContentUrl,
      previewImageUrl
    });
  } catch (error) {
    logger.error('發送影片訊息失敗', { userId, originalContentUrl, error });
    throw error;
  }
}

/**
 * 回覆訊息
 * @param {string} replyToken 回覆令牌
 * @param {Array|Object} messages 訊息或訊息陣列
 * @returns {Promise<any>} LINE API回應
 */
async function replyMessage(replyToken, messages) {
  try {
    logger.debug(`回覆訊息 ${replyToken}`, { messages });
    return await getClient().replyMessage(replyToken, messages);
  } catch (error) {
    logger.error('回覆訊息失敗', { replyToken, messages, error });
    throw error;
  }
}

/**
 * 驗證LINE請求簽名
 * @param {string} body 請求體
 * @param {string} signature 簽名
 * @returns {boolean} 是否有效
 */
function validateSignature(body, signature) {
  try {
    // 使用LINE SDK的驗證方法
    const crypto = require('node:crypto');
    const hmac = crypto.createHmac('SHA256', config.line.channelSecret);
    const digest = hmac.update(body).digest('base64');
    return digest === signature;
  } catch (error) {
    logger.error('驗證簽名失敗', { error });
    return false;
  }
}

export default {
  getClient,
  sendTextMessage,
  sendImageMessage,
  sendVideoMessage,
  replyMessage,
  validateSignature
}; 