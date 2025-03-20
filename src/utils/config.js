/**
 * 配置管理模組
 * 用於集中管理所有的環境變數和配置信息
 */

// 環境變數配置
const config = {
  // 應用環境
  environment: typeof ENVIRONMENT !== 'undefined' ? ENVIRONMENT : 'development',
  
  // LINE配置
  line: {
    channelId: typeof LINE_CHANNEL_ID !== 'undefined' ? LINE_CHANNEL_ID : '',
    channelSecret: typeof LINE_CHANNEL_SECRET !== 'undefined' ? LINE_CHANNEL_SECRET : '',
    channelAccessToken: typeof LINE_CHANNEL_ACCESS_TOKEN !== 'undefined' ? LINE_CHANNEL_ACCESS_TOKEN : ''
  },
  
  // Cloudflare配置
  cloudflare: {
    accountId: typeof CLOUDFLARE_ACCOUNT_ID !== 'undefined' ? CLOUDFLARE_ACCOUNT_ID : '',
    apiKey: typeof CLOUDFLARE_API_KEY !== 'undefined' ? CLOUDFLARE_API_KEY : ''
  },
  
  // KV存儲
  kv: {
    nursing_knowledge: null
  }
};

/**
 * 設置環境變數
 * @param {Object} env Worker環境變數
 */
function setEnv(env) {
  config.environment = env.ENVIRONMENT || 'development';
  config.line.channelId = env.LINE_CHANNEL_ID || '';
  config.line.channelSecret = env.LINE_CHANNEL_SECRET || '';
  config.line.channelAccessToken = env.LINE_CHANNEL_ACCESS_TOKEN || '';
  
  // 設置KV存儲
  if (env.NURSING_KNOWLEDGE) {
    config.kv.nursing_knowledge = env.NURSING_KNOWLEDGE;
  }
}

/**
 * 檢查配置是否完整
 * @returns {boolean} 配置是否有效
 */
function isConfigValid() {
  return (
    config.line.channelId &&
    config.line.channelSecret &&
    config.line.channelAccessToken
  );
}

/**
 * 獲取當前環境
 * @returns {string} 當前環境名稱
 */
function getEnvironment() {
  return config.environment;
}

/**
 * 檢查是否為開發環境
 * @returns {boolean} 是否為開發環境
 */
function isDevelopment() {
  return config.environment === 'development';
}

/**
 * 檢查是否為生產環境
 * @returns {boolean} 是否為生產環境
 */
function isProduction() {
  return config.environment === 'production';
}

export default {
  ...config,
  setEnv,
  isConfigValid,
  getEnvironment,
  isDevelopment,
  isProduction
}; 