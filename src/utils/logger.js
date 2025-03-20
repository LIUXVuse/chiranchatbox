/**
 * 日誌工具模組
 * 提供應用程式的日誌記錄功能，方便追蹤和調試
 */

import config from './config';

// 日誌級別
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// 當前日誌級別
const currentLevel = config.isDevelopment() ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

/**
 * 格式化日誌消息
 * @param {string} level 日誌級別
 * @param {string} message 日誌消息
 * @param {Object} [data] 附加數據
 * @returns {string} 格式化後的日誌字符串
 */
function formatLogMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  const dataString = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  return `[${timestamp}] [${level}] ${message}${dataString}`;
}

/**
 * 記錄除錯日誌
 * @param {string} message 日誌消息
 * @param {Object} [data] 附加數據
 */
function debug(message, data) {
  if (currentLevel <= LOG_LEVELS.DEBUG) {
    console.debug(formatLogMessage('DEBUG', message, data));
  }
}

/**
 * 記錄信息日誌
 * @param {string} message 日誌消息
 * @param {Object} [data] 附加數據
 */
function info(message, data) {
  if (currentLevel <= LOG_LEVELS.INFO) {
    console.info(formatLogMessage('INFO', message, data));
  }
}

/**
 * 記錄警告日誌
 * @param {string} message 日誌消息
 * @param {Object} [data] 附加數據
 */
function warn(message, data) {
  if (currentLevel <= LOG_LEVELS.WARN) {
    console.warn(formatLogMessage('WARN', message, data));
  }
}

/**
 * 記錄錯誤日誌
 * @param {string} message 日誌消息
 * @param {Object} [data] 附加數據
 */
function error(message, data) {
  if (currentLevel <= LOG_LEVELS.ERROR) {
    console.error(formatLogMessage('ERROR', message, data));
  }
}

export default {
  debug,
  info,
  warn,
  error
}; 