/**
 * 统一日志工具
 * 开发环境：输出所有日志信息
 * 生产环境：只输出 error 级别日志
 */

type LogLevel = 'log' | 'error' | 'warn' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const emoji = this.getEmoji(level);
    return `${emoji} [${timestamp}] ${message}`;
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'log':
        return '🔍';
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'debug':
        return '🐛';
      default:
        return '📝';
    }
  }

  log(message: string, data?: any): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('log', message, data);
      console.log(formattedMessage, data || '');
    }
  }

  error(message: string, error?: any): void {
    // error 级别在所有环境都输出
    const formattedMessage = this.formatMessage('error', message, error);
    console.error(formattedMessage, error || '');
  }

  warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('warn', message, data);
      console.warn(formattedMessage, data || '');
    }
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('debug', message, data);
      console.debug(formattedMessage, data || '');
    }
  }

  // 分组日志
  group(label: string, collapsed = false): void {
    if (this.isDevelopment) {
      if (collapsed) {
        console.groupCollapsed(`📁 ${label}`);
      } else {
        console.group(`📁 ${label}`);
      }
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  // 性能计时
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(`⏱️ ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }

  // 表格输出
  table(data: any[], columns?: string[]): void {
    if (this.isDevelopment) {
      console.table(data, columns);
    }
  }
}

export const logger = new Logger();
export default logger;