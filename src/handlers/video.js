/**
 * 影片訊息處理器
 * 處理用戶發送的影片訊息
 */

import lineClient from '../line/client';
import dialogService from '../services/dialog';
import logger from '../utils/logger';

/**
 * 處理影片訊息
 * @param {Object} event LINE事件對象
 * @returns {Promise<any>} 處理結果
 */
async function handleVideo(event) {
  const { message, replyToken, source } = event;
  const userId = source.userId;
  
  logger.info(`收到來自用戶 ${userId} 的影片訊息`, { messageId: message.id });
  
  try {
    // 記錄對話
    await dialogService.recordUserVideo(userId, message.id);
    
    // 目前不處理影片分析，只回覆一個簡單的確認訊息
    const response = '謝謝您分享的影片。目前我無法分析影片內容，但我很樂意回答您的文字問題。';
    
    // 記錄機器人回應
    await dialogService.recordBotMessage(userId, response);
    
    // 發送回覆
    return await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: response
    });
  } catch (error) {
    logger.error('處理影片訊息時發生錯誤', { error });
    
    // 發送錯誤回應
    return await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '抱歉，我在處理您的影片時遇到了問題。請稍後再試。'
    });
  }
}

export default {
  handleVideo
}; 