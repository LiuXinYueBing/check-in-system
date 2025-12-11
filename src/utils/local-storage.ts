/**
 * 安全的 localStorage 工具函数
 * 提供类型安全的 localStorage 读写操作
 */

/**
 * 检查是否支持 localStorage
 */
const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 安全地从 localStorage 获取数据
 * @param key - localStorage 键
 * @param defaultValue - 默认值（如果获取失败）
 * @returns 获取到的值或默认值
 */
export const safeLocalStorageGet = <T = string>(
  key: string,
  defaultValue: T
): T => {
  if (!isLocalStorageAvailable()) {
    return defaultValue;
  }

  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      return defaultValue;
    }

    // 尝试解析 JSON
    try {
      return JSON.parse(value) as T;
    } catch {
      // 如果不是 JSON，返回原始字符串值
      return value as unknown as T;
    }
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error);
    return defaultValue;
  }
};

/**
 * 安全地设置 localStorage 数据
 * @param key - localStorage 键
 * @param value - 要设置的值
 * @returns 是否设置成功
 */
export const safeLocalStorageSet = <T>(key: string, value: T): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
};

/**
 * 安全地从 localStorage 移除数据
 * @param key - localStorage 键
 * @returns 是否移除成功
 */
export const safeLocalStorageRemove = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
    return false;
  }
};

/**
 * 安全地清空 localStorage
 * @returns 是否清空成功
 */
export const safeLocalStorageClear = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
    return false;
  }
};