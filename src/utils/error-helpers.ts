/**
 * 安全的错误处理工具函数
 * 用于处理 unknown 类型错误，提供安全的属性访问
 */

export interface SafeError {
  name?: string;
  message?: string;
  code?: string | number;
  stack?: string;
}

/**
 * 安全地获取错误对象的属性
 */
export function getSafeError(error: unknown): SafeError {
  if (error && typeof error === 'object') {
    return {
      name: 'name' in error ? String(error.name) : undefined,
      message: 'message' in error ? String(error.message) : undefined,
      code: 'code' in error ? (typeof error.code === 'string' || typeof error.code === 'number' ? error.code : undefined) : undefined,
      stack: 'stack' in error ? String(error.stack) : undefined,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  return {
    message: String(error),
  };
}

/**
 * 安全地获取错误消息
 */
export function getErrorMessage(error: unknown, fallback = '未知错误'): string {
  const safeError = getSafeError(error);
  return safeError.message || fallback;
}

/**
 * 安全地获取错误代码
 */
export function getErrorCode(error: unknown): string | number | undefined {
  const safeError = getSafeError(error);
  return safeError.code;
}

/**
 * 判断是否为特定错误代码
 */
export function hasErrorCode(error: unknown, expectedCode: string | number): boolean {
  const code = getErrorCode(error);
  return code === expectedCode;
}