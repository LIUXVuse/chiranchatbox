/**
 * 回應產生器服務
 * 用於生成機器人的回應訊息
 */

import logger from '../utils/logger';

// 預設回應集
const defaultResponses = [
  '很抱歉，我目前沒有這方面的資訊。您可以嘗試輸入部門名稱（如「ICU」、「OR」、「ED」等）或特定教學關鍵詞（如「CVVH」）來查找相關知識。',
  '我無法回答這個問題。請嘗試輸入部門代碼（如「ICU」、「OPD」等）查看該部門所有可用的教學內容，或輸入特定關鍵詞查找具體知識。',
  '抱歉，我不太理解您的問題。您可以直接輸入部門名稱（例如「ICU」）來查看該部門的所有教學內容，或輸入具體的教學關鍵詞。',
  '這個問題超出了我的知識範圍。您可以嘗試輸入部門代碼或特定醫療設備的名稱來找到相關教學資訊。'
];

// 友好的回應前綴
const friendlyPrefixes = [
  '很高興收到您的問題！',
  '謝謝您的提問。',
  '我很樂意幫助您。',
  '感謝您向我諮詢。'
];

// 鼓勵性的回應後綴
const encouragingSuffixes = [
  '如果您有其他問題，請隨時提問。',
  '希望我的回答對您有所幫助。',
  '如果需要更多資訊，請告訴我。',
  '您還有其他問題嗎？我很樂意繼續為您服務。'
];

/**
 * 生成一般回應
 * @param {string} query 用戶查詢文字
 * @returns {string} 生成的回應
 */
async function generateGeneralResponse(query) {
  logger.debug('生成一般回應', { query });
  
  // 在實際環境中，可以考慮使用更先進的AI服務來生成回應
  // 這裡使用簡單的模式匹配和模板回應
  
  // 特殊關鍵詞處理
  const specialResponse = handleSpecialKeywords(query);
  if (specialResponse) {
    return specialResponse;
  }
  
  // 如果沒有特殊處理，則生成通用回應
  return generateDefaultResponse();
}

/**
 * 處理特殊關鍵詞
 * @param {string} query 用戶查詢文字
 * @returns {string|null} 特殊回應或null
 */
function handleSpecialKeywords(query) {
  // 處理問候語
  if (query.includes('你好') || query.includes('哈囉') || query.includes('嗨')) {
    return '您好！我是三總護理助手，很高興為您服務。有什麼我可以幫您的嗎？';
  }
  
  // 處理感謝語
  if (query.includes('謝謝') || query.includes('感謝')) {
    return '不客氣！很高興能幫到您。如果有其他問題，隨時告訴我。';
  }
  
  // 處理幫助請求
  if (query.includes('幫助') || query.includes('help') || query.includes('使用說明')) {
    return '您可以使用以下方式找到所需資訊：\n\n1. 輸入部門代碼（如「ICU」、「ED」、「OR」、「OPD」、「WARD」）查看該部門的所有教學內容\n\n2. 輸入特定關鍵詞（如「CVVH」、「透析」等）查找具體的教學資訊\n\n3. 也可輸入您想了解的醫療設備或流程名稱';
  }
  
  // 沒有匹配的特殊關鍵詞
  return null;
}

/**
 * 生成默認回應
 * @returns {string} 默認回應
 */
function generateDefaultResponse() {
  // 隨機選擇回應元素
  const prefix = friendlyPrefixes[Math.floor(Math.random() * friendlyPrefixes.length)];
  const response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  const suffix = encouragingSuffixes[Math.floor(Math.random() * encouragingSuffixes.length)];
  
  // 組合回應
  return `${prefix} ${response} ${suffix}`;
}

/**
 * 添加情感表達到回應中
 * @param {string} response 原始回應
 * @returns {string} 添加情感後的回應
 */
function addEmotionalExpression(response) {
  // 在實際應用中，可以根據回應內容添加適當的情感表達
  // 例如，對於表達關心的回應可以添加溫暖的表情符號
  
  // 這裡只是一個簡單的示例
  if (response.includes('抱歉')) {
    return `${response} 我會努力提升自己的知識庫，以便更好地為您服務。`;
  }
  
  return response;
}

export default {
  generateGeneralResponse,
  addEmotionalExpression
}; 