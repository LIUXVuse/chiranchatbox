/**
 * 知識庫服務模組
 * 管理和提供護理知識庫的內容
 */

import logger from '../utils/logger';
import config from '../utils/config';

// 護理知識庫初始化為空陣列
// 實際數據將從 KV 存儲中獲取
const nursingKnowledge = [];

/**
 * 根據用戶輸入獲取知識庫回應
 * @param {string} query 用戶查詢文字
 * @returns {Object|null} 匹配的知識庫條目或null
 */
async function getResponse(query) {
  logger.debug('獲取知識庫回應', { query });
  
  try {
    // 從 KV 存儲中獲取關鍵詞索引
    const keywordIndex = await getKeywordIndex();
    
    if (!keywordIndex) {
      logger.debug('關鍵詞索引為空或未找到');
      return null;
    }
    
    // 查找匹配的知識條目ID
    const knowledgeId = findMatchingEntryId(query, keywordIndex);
    
    if (!knowledgeId) {
      logger.debug('未找到匹配的知識庫條目');
      return null;
    }
    
    // 處理部門查詢
    if (knowledgeId.startsWith('Department:')) {
      const department = knowledgeId.replace('Department:', '');
      logger.debug(`識別為部門查詢: ${department}`);
      
      const departmentEntries = await getDepartmentEntries(department);
      if (departmentEntries && departmentEntries.length > 0) {
        logger.debug(`找到${departmentEntries.length}個部門相關知識條目`, { department });
        return {
          isDepartmentListing: true,
          department: department,
          entries: departmentEntries
        };
      } else {
        logger.debug(`未找到 ${department} 部門的知識條目`);
        return {
          isDepartmentListing: true,
          department: department,
          entries: []
        };
      }
    }
    
    // 獲取知識條目詳細資訊
    const knowledgeEntry = await getKnowledgeById(knowledgeId);
    
    if (knowledgeEntry) {
      logger.debug('找到匹配的知識庫條目', { id: knowledgeEntry.id });
      return knowledgeEntry;
    }
    
    logger.debug('未能從KV獲取知識庫條目', { id: knowledgeId });
    return null;
  } catch (error) {
    logger.error('獲取知識庫回應時出錯', { error });
    return null;
  }
}

/**
 * 根據部門名稱獲取相關知識條目
 * @param {string} department 部門名稱
 * @returns {Array} 知識條目列表
 */
async function getDepartmentEntries(department) {
  try {
    const normalizedDepartment = department.trim().toLowerCase();
    
    // 獲取所有知識條目ID
    const allIds = await getAllKnowledgeIds();
    
    // 篩選出屬於該部門的知識條目ID
    const departmentIds = allIds.filter(id => id.startsWith(`${normalizedDepartment}-`));
    
    if (departmentIds.length === 0) {
      return [];
    }
    
    // 獲取所有部門相關知識條目的詳細資訊
    const entries = await Promise.all(
      departmentIds.map(async id => {
        const entry = await getKnowledgeById(id);
        if (entry) {
          // 僅返回列表顯示所需的簡略資訊
          return {
            id: entry.id,
            title: extractTitle(entry.text),
            description: extractDescription(entry.text)
          };
        }
        return null;
      })
    );
    
    // 過濾掉無效的條目
    return entries.filter(entry => entry !== null);
  } catch (error) {
    logger.error('獲取部門知識條目時出錯', { error, department });
    return [];
  }
}

/**
 * 從知識條目文本中提取標題
 * @param {string} text 知識條目文本
 * @returns {string} 標題
 */
function extractTitle(text) {
  const titleMatch = text.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : '未命名知識條目';
}

/**
 * 從知識條目文本中提取描述
 * @param {string} text 知識條目文本
 * @returns {string} 描述
 */
function extractDescription(text) {
  // 嘗試獲取第一個非標題段落作為描述
  const paragraphs = text.split('\n\n');
  let description = '';
  
  for (const paragraph of paragraphs) {
    if (!paragraph.startsWith('#') && paragraph.trim().length > 0) {
      description = paragraph.trim();
      break;
    }
  }
  
  // 如果描述太長，截斷它
  if (description.length > 50) {
    description = description.substring(0, 50) + '...';
  }
  
  return description || '無描述';
}

/**
 * 從 KV 存儲獲取關鍵詞索引
 * @returns {Object|null} 關鍵詞索引或null
 */
async function getKeywordIndex() {
  try {
    if (!config.kv.nursing_knowledge) {
      logger.error('KV命名空間未設置');
      return null;
    }
    
    const indexJson = await config.kv.nursing_knowledge.get('keyword-index');
    
    if (!indexJson) {
      logger.debug('關鍵詞索引不存在');
      return null;
    }
    
    return JSON.parse(indexJson);
  } catch (error) {
    logger.error('獲取關鍵詞索引時出錯', { error });
    return null;
  }
}

/**
 * 查找與查詢匹配的知識庫條目ID
 * @param {string} query 用戶查詢文字
 * @param {Object} keywordIndex 關鍵詞索引
 * @returns {string|null} 匹配的知識庫條目ID或null
 */
function findMatchingEntryId(query, keywordIndex) {
  // 將查詢轉為小寫以進行不區分大小寫的匹配
  const lowerQuery = query.toLowerCase().trim();
  
  // 先檢查是否精確匹配部門查詢
  // 例如用戶直接輸入 "ICU" 或 "ED"
  const departmentMatch = Object.entries(keywordIndex).find(([key, value]) => 
    key.toLowerCase() === lowerQuery && value.startsWith('Department:')
  );
  
  if (departmentMatch) {
    return departmentMatch[1];  // 返回部門標記
  }
  
  // 檢查每個關鍵詞是否包含在查詢中
  for (const [keyword, knowledgeId] of Object.entries(keywordIndex)) {
    // 跳過部門標記關鍵詞
    if (knowledgeId.startsWith('Department:')) {
      continue;
    }
    
    if (lowerQuery.includes(keyword.toLowerCase())) {
      return knowledgeId;
    }
  }
  
  return null;
}

/**
 * 根據ID從KV存儲中獲取知識庫條目
 * @param {string} id 知識庫條目ID
 * @returns {Object|null} 知識庫條目或null
 */
async function getKnowledgeById(id) {
  try {
    if (!config.kv.nursing_knowledge) {
      logger.error('KV命名空間未設置');
      return null;
    }
    
    const knowledgeJson = await config.kv.nursing_knowledge.get(`knowledge:${id}`);
    
    if (!knowledgeJson) {
      logger.debug(`知識庫條目不存在: ${id}`);
      return null;
    }
    
    return JSON.parse(knowledgeJson);
  } catch (error) {
    logger.error('獲取知識庫條目時出錯', { error, id });
    return null;
  }
}

/**
 * 獲取所有知識庫條目ID列表
 * @returns {Promise<Array>} 知識庫條目ID陣列
 */
async function getAllKnowledgeIds() {
  try {
    if (!config.kv.nursing_knowledge) {
      logger.error('KV命名空間未設置');
      return [];
    }
    
    const keys = await config.kv.nursing_knowledge.list({ prefix: 'knowledge:' });
    
    return keys.keys.map(key => key.name.replace('knowledge:', ''));
  } catch (error) {
    logger.error('獲取所有知識庫條目ID時出錯', { error });
    return [];
  }
}

/**
 * 檢查知識庫系統狀態
 * @returns {Promise<Object>} 系統狀態信息
 */
async function checkSystemStatus() {
  const status = {
    kvConfigured: !!config.kv.nursing_knowledge,
    keywordIndexExists: false,
    indexContents: null,
    knowledgeEntriesCount: 0,
    departmentEntries: {}
  };
  
  try {
    // 檢查 KV 是否配置
    if (!config.kv.nursing_knowledge) {
      logger.error('KV命名空間未設置');
      return status;
    }
    
    // 檢查關鍵詞索引
    const indexJson = await config.kv.nursing_knowledge.get('keyword-index');
    if (!indexJson) {
      logger.debug('關鍵詞索引不存在');
      return status;
    }
    
    status.keywordIndexExists = true;
    const keywordIndex = JSON.parse(indexJson);
    
    // 提取一部分索引內容作為樣本
    const indexSample = {};
    let count = 0;
    for (const [key, value] of Object.entries(keywordIndex)) {
      if (count < 10) {  // 只保留前10個作為樣本
        indexSample[key] = value;
        count++;
      }
    }
    status.indexContents = indexSample;
    
    // 獲取所有知識條目
    const allIds = await getAllKnowledgeIds();
    status.knowledgeEntriesCount = allIds.length;
    
    // 獲取部門分佈
    const departments = ['icu', 'er', 'ward', 'or', 'opd', 'nurse'];
    for (const dept of departments) {
      const entries = await getDepartmentEntries(dept);
      status.departmentEntries[dept] = entries.length;
    }
    
    return status;
  } catch (error) {
    logger.error('檢查系統狀態時出錯', { error });
    return status;
  }
}

/**
 * 搜索知識條目
 * @param {string} query 搜索關鍵詞
 * @returns {Promise<Array>} 匹配的知識條目簡介列表
 */
async function searchKnowledge(query) {
  try {
    if (!query || typeof query !== 'string') {
      return [];
    }
    
    const lowerQuery = query.toLowerCase();
    const allIds = await getAllKnowledgeIds();
    const matchingEntries = [];
    
    // 獲取所有知識條目並過濾匹配的內容
    for (const id of allIds) {
      const entry = await getKnowledgeById(id);
      if (entry) {
        // 檢查標題和內容是否包含搜索詞
        const title = extractTitle(entry.text);
        if (title.toLowerCase().includes(lowerQuery) || 
            entry.text.toLowerCase().includes(lowerQuery) ||
            entry.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))) {
          
          matchingEntries.push({
            id: entry.id,
            title: title,
            description: extractDescription(entry.text)
          });
        }
      }
    }
    
    return matchingEntries;
  } catch (error) {
    logger.error('搜索知識條目時出錯', { error, query });
    return [];
  }
}

export default {
  getResponse,
  getKnowledgeById,
  getAllKnowledgeIds,
  getDepartmentEntries,
  checkSystemStatus,
  searchKnowledge
}; 