/**
 * 訊息處理模組
 * 用於建立和組裝LINE訊息物件
 */

/**
 * 創建文字訊息物件
 * @param {string} text 訊息文字
 * @returns {Object} 文字訊息物件
 */
function createTextMessage(text) {
  return {
    type: 'text',
    text: text
  };
}

/**
 * 創建圖片訊息物件
 * @param {string} originalContentUrl 原始圖片URL
 * @param {string} previewImageUrl 預覽圖片URL
 * @returns {Object} 圖片訊息物件
 */
function createImageMessage(originalContentUrl, previewImageUrl) {
  return {
    type: 'image',
    originalContentUrl,
    previewImageUrl: previewImageUrl || originalContentUrl
  };
}

/**
 * 創建影片訊息物件
 * @param {string} originalContentUrl 影片URL
 * @param {string} previewImageUrl 預覽圖片URL
 * @returns {Object} 影片訊息物件
 */
function createVideoMessage(originalContentUrl, previewImageUrl) {
  return {
    type: 'video',
    originalContentUrl,
    previewImageUrl
  };
}

/**
 * 創建按鈕模板訊息
 * @param {string} altText 替代文字
 * @param {string} title 標題
 * @param {string} text 內容
 * @param {Array<Object>} actions 按鈕動作陣列
 * @param {string} [thumbnailImageUrl] 縮圖URL
 * @returns {Object} 按鈕模板訊息物件
 */
function createButtonMessage(altText, title, text, actions, thumbnailImageUrl) {
  return {
    type: 'template',
    altText: altText,
    template: {
      type: 'buttons',
      thumbnailImageUrl: thumbnailImageUrl,
      title: title,
      text: text,
      actions: actions
    }
  };
}

/**
 * 創建確認模板訊息
 * @param {string} altText 替代文字
 * @param {string} text 內容
 * @param {Object} confirmAction 確認動作
 * @param {Object} cancelAction 取消動作
 * @returns {Object} 確認模板訊息物件
 */
function createConfirmMessage(altText, text, confirmAction, cancelAction) {
  return {
    type: 'template',
    altText: altText,
    template: {
      type: 'confirm',
      text: text,
      actions: [confirmAction, cancelAction]
    }
  };
}

/**
 * 創建輪播模板訊息
 * @param {string} altText 替代文字
 * @param {Array<Object>} columns 欄位資料陣列
 * @returns {Object} 輪播模板訊息物件
 */
function createCarouselMessage(altText, columns) {
  return {
    type: 'template',
    altText: altText,
    template: {
      type: 'carousel',
      columns: columns
    }
  };
}

/**
 * 創建一個訊息物件陣列
 * @param {...Object} messages 訊息物件
 * @returns {Array<Object>} 訊息物件陣列
 */
function createMessages(...messages) {
  return messages;
}

/**
 * 創建一個按鈕動作
 * @param {string} label 按鈕標籤
 * @param {string} data 回傳資料
 * @returns {Object} 按鈕動作物件
 */
function createPostbackAction(label, data) {
  return {
    type: 'postback',
    label: label,
    data: data
  };
}

/**
 * 創建一個網址動作
 * @param {string} label 按鈕標籤
 * @param {string} uri 網址
 * @returns {Object} 網址動作物件
 */
function createUriAction(label, uri) {
  return {
    type: 'uri',
    label: label,
    uri: uri
  };
}

/**
 * 創建一個訊息動作
 * @param {string} label 按鈕標籤
 * @param {string} text 訊息文字
 * @returns {Object} 訊息動作物件
 */
function createMessageAction(label, text) {
  return {
    type: 'message',
    label: label,
    text: text
  };
}

export default {
  createTextMessage,
  createImageMessage,
  createVideoMessage,
  createButtonMessage,
  createConfirmMessage,
  createCarouselMessage,
  createMessages,
  createPostbackAction,
  createUriAction,
  createMessageAction
}; 