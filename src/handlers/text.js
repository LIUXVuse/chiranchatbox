/**
 * 文字訊息處理器
 * 處理用戶發送的文字訊息
 */

import lineClient from '../line/client';
import lineMessage from '../line/message';
import dialogService from '../services/dialog';
import knowledgeService from '../services/knowledge';
import responseService from '../services/response';
import logger from '../utils/logger';

/**
 * 處理文字訊息
 * @param {Object} event LINE事件對象
 * @returns {Promise<any>} 處理結果
 */
async function handleText(event) {
  const { message, replyToken, source } = event;
  const { text } = message;
  const userId = source.userId;
  
  logger.info(`收到來自用戶 ${userId} 的文字訊息`, { text });
  
  try {
    // 記錄對話
    await dialogService.recordUserMessage(userId, text);

    // 獲取知識庫回應
    const response = await knowledgeService.getResponse(text);
    
    if (response) {
      // 如果有匹配的知識庫回應
      logger.debug('找到知識庫回應', { response });
      
      // 生成回覆訊息
      const replyMessages = await generateReplyMessages(response);
      
      // 記錄機器人回應
      await dialogService.recordBotMessage(userId, replyMessages);
      
      // 發送回覆
      return await lineClient.replyMessage(replyToken, replyMessages);
    } else {
      // 如果沒有匹配的知識庫回應，則生成一般回應
      logger.debug('未找到知識庫回應，生成一般回應');
      
      // 生成一般回應
      const generalResponse = await responseService.generateGeneralResponse(text);
      
      // 記錄機器人回應
      await dialogService.recordBotMessage(userId, generalResponse);
      
      // 發送回覆
      return await lineClient.replyMessage(replyToken, {
        type: 'text',
        text: generalResponse
      });
    }
  } catch (error) {
    logger.error('處理文字訊息時發生錯誤', { error });
    
    // 發送錯誤回應
    return await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '抱歉，我在處理您的訊息時遇到了問題。請稍後再試。'
    });
  }
}

/**
 * 根據知識庫回應生成回覆訊息
 * @param {Object} response 知識庫回應
 * @returns {Array} 回覆訊息陣列
 */
async function generateReplyMessages(response) {
  const messages = [];
  
  // 判斷是否為部門列表顯示
  if (response.isDepartmentListing) {
    // 生成部門知識條目列表訊息
    return generateDepartmentListMessages(response);
  }
  
  // 添加文字回應
  if (response.text) {
    messages.push(lineMessage.createTextMessage(response.text));
  }
  
  // 添加圖片（如果有）
  if (response.imageUrl) {
    messages.push(lineMessage.createImageMessage(response.imageUrl, response.imageUrl));
  }
  
  // 添加影片（如果有）
  if (response.videoUrl) {
    const previewUrl = response.videoPreviewUrl || 'https://img.youtube.com/vi/' + extractYoutubeId(response.videoUrl) + '/maxresdefault.jpg';
    messages.push(lineMessage.createVideoMessage(response.videoUrl, previewUrl));
  }
  
  return messages;
}

/**
 * 從YouTube URL提取視頻ID
 * @param {string} url YouTube URL
 * @returns {string} YouTube視頻ID
 */
function extractYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : '';
}

/**
 * 生成部門知識條目列表訊息
 * @param {Object} response 包含部門和知識條目列表的響應
 * @returns {Array} 回覆訊息陣列
 */
function generateDepartmentListMessages(response) {
  const { department, entries } = response;
  const messages = [];
  
  // 部門名稱映射
  const departmentNames = {
    'icu': 'ICU加護病房',
    'er': 'ER急診',
    'ward': 'Ward病房',
    'or': 'OR手術室',
    'opd': 'OPD門診',
    'nurse': 'Nurse護理部通用'
  };
  
  const departmentName = departmentNames[department] || department.toUpperCase();
  
  // 添加標題訊息
  const titleMessage = lineMessage.createTextMessage(`${departmentName} 現有的知識條目：`);
  messages.push(titleMessage);
  
  // 如果沒有找到任何條目
  if (entries.length === 0) {
    const noEntriesMessage = lineMessage.createTextMessage(`目前 ${departmentName} 尚未有任何知識條目。`);
    messages.push(noEntriesMessage);
    return messages;
  }
  
  // 使用按鈕模板創建可點擊的條目列表
  // LINE限制：每個按鈕模板最多支持4個按鈕
  // 因此需要將條目分組，每組最多4個
  const entriesGroups = [];
  for (let i = 0; i < entries.length; i += 4) {
    entriesGroups.push(entries.slice(i, i + 4));
  }
  
  // 為每組條目創建一個按鈕模板訊息
  entriesGroups.forEach((group, groupIndex) => {
    // 標題文字
    const title = `${departmentName} 知識條目 ${groupIndex + 1}`;
    // 描述文字
    const text = `點擊下方按鈕直接查看相關知識`;
    
    // 創建按鈕動作列表
    const actions = group.map(entry => {
      return lineMessage.createMessageAction(
        entry.title.length > 20 ? entry.title.substring(0, 17) + '...' : entry.title,
        entry.title
      );
    });
    
    // 創建按鈕模板訊息
    const buttonMessage = lineMessage.createButtonMessage(
      `${departmentName} 知識條目`, // altText
      title, // title
      text, // text
      actions // actions
    );
    
    messages.push(buttonMessage);
  });
  
  return messages;
}

/**
 * 處理特殊關鍵詞
 * @param {string} text 用戶輸入文字
 * @returns {string|null} 特殊回應或null
 */
function handleSpecialKeywords(text) {
  const keywords = {
    '你好': '您好！我是三總護理助手，很高興為您服務。有什麼我可以幫您的嗎？',
    '謝謝': '不客氣！很高興能幫到您。',
    '幫助': '您可以使用以下方式找到所需資訊：\n\n1. 輸入部門代碼查看該部門的所有教學內容：\n　• ICU - ICU加護病房\n　• ER - 急診\n　• Ward - 病房\n　• OR - 手術室\n　• OPD - 門診\n　• Nurse - 護理部通用\n\n2. 輸入特定關鍵詞（如「CVVH」、「透析」等）查找具體的教學資訊\n\n3. 也可輸入您想了解的醫療設備或流程名稱'
  };
  
  // 檢查是否匹配任何特殊關鍵詞
  for (const [keyword, response] of Object.entries(keywords)) {
    if (text.includes(keyword)) {
      return response;
    }
  }
  
  return null;
}

export default {
  handleText
}; 