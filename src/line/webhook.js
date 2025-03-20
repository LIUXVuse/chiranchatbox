/**
 * LINE Webhook處理模組
 * 處理LINE的webhook請求和事件分發
 */

import lineClient from './client';
import logger from '../utils/logger';
import textHandler from '../handlers/text';
import imageHandler from '../handlers/image';
import videoHandler from '../handlers/video';

/**
 * 處理webhook事件
 * @param {Object} event LINE事件對象
 * @returns {Promise<any>} 處理結果
 */
async function handleEvent(event) {
  logger.debug('收到LINE事件', event);

  try {
    // 根據事件類型分派給不同的處理器
    switch (event.type) {
      case 'message':
        return await handleMessageEvent(event);
      
      case 'follow':
        return await handleFollowEvent(event);
      
      case 'unfollow':
        return await handleUnfollowEvent(event);
        
      case 'postback':
        return await handlePostbackEvent(event);
        
      default:
        logger.warn(`未處理的事件類型: ${event.type}`, event);
        return null;
    }
  } catch (error) {
    logger.error('處理事件時發生錯誤', { event, error });
    
    // 嘗試發送錯誤回應
    if (event.replyToken) {
      try {
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: '抱歉，我現在遇到了一些問題，請稍後再試。'
        });
      } catch (replyError) {
        logger.error('發送錯誤回應失敗', { replyError });
      }
    }
    
    throw error;
  }
}

/**
 * 處理消息事件
 * @param {Object} event 消息事件
 * @returns {Promise<any>} 處理結果
 */
async function handleMessageEvent(event) {
  const { message, replyToken } = event;
  
  // 根據消息類型分派給不同的處理器
  switch (message.type) {
    case 'text':
      return await textHandler.handleText(event);
      
    case 'image':
      return await imageHandler.handleImage(event);
      
    case 'video':
      return await videoHandler.handleVideo(event);
      
    default:
      logger.warn(`未處理的消息類型: ${message.type}`, message);
      
      // 對於未處理的消息類型，發送溫和的回應
      return await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: '抱歉，我還不知道如何處理這種類型的訊息。請嘗試發送文字訊息給我。'
      });
  }
}

/**
 * 處理關注事件
 * @param {Object} event 關注事件
 * @returns {Promise<any>} 處理結果
 */
async function handleFollowEvent(event) {
  const { replyToken, source } = event;
  const userId = source.userId;
  
  logger.info(`用戶 ${userId} 開始關注機器人`);
  
  // 發送歡迎訊息
  return await lineClient.replyMessage(replyToken, {
    type: 'text',
    text: '您好！我是三總護理助手，很高興為您服務。我可以回答您在護理工作中遇到的問題，也可以提供護理知識。請隨時向我提問，我會盡力幫助您。'
  });
}

/**
 * 處理取消關注事件
 * @param {Object} event 取消關注事件
 * @returns {Promise<void>} 處理結果
 */
async function handleUnfollowEvent(event) {
  const { source } = event;
  const userId = source.userId;
  
  logger.info(`用戶 ${userId} 取消關注機器人`);
  
  // 這裡可以添加用戶取消關注的清理邏輯
  return;
}

/**
 * 處理回傳事件
 * @param {Object} event 回傳事件
 * @returns {Promise<any>} 處理結果
 */
async function handlePostbackEvent(event) {
  const { postback, replyToken } = event;
  const { data } = postback;
  
  logger.debug(`收到回傳事件`, { data });
  
  // 處理回傳數據
  // 這裡可以根據data的內容進行不同的業務邏輯處理
  
  return await lineClient.replyMessage(replyToken, {
    type: 'text',
    text: `已收到您的選擇。`
  });
}

/**
 * 處理來自LINE的webhook請求
 * @param {Request} request 請求對象
 * @returns {Promise<Response>} 回應對象
 */
async function handleWebhook(request) {
  // 驗證請求簽名
  const signature = request.headers.get('x-line-signature');
  if (!signature) {
    logger.warn('缺少LINE簽名');
    return new Response('Forbidden', { status: 403 });
  }
  
  // 獲取請求體
  const body = await request.text();
  
  // 驗證簽名
  if (!lineClient.validateSignature(body, signature)) {
    logger.warn('無效的LINE簽名');
    return new Response('Forbidden', { status: 403 });
  }
  
  // 解析事件
  let events;
  try {
    events = JSON.parse(body).events;
  } catch (error) {
    logger.error('解析LINE事件失敗', { body, error });
    return new Response('Bad Request', { status: 400 });
  }
  
  // 處理所有事件
  await Promise.all(events.map(handleEvent));
  
  // 回傳成功
  return new Response('OK', { status: 200 });
}

export default {
  handleWebhook,
  handleEvent
}; 