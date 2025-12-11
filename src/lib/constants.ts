/**
 * 应用程序常量定义
 * 避免硬编码值，提高代码可维护性
 */

// ==================== UUID 相关常量 ====================
/** 空UUID，用作默认值或占位符 */
export const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

// ==================== localStorage 键名 ====================
/** 员工扫码自动继续扫描设置键 */
export const LS_KEYS = {
  /** 员工自动继续扫描设置 */
  STAFF_AUTO_CONTINUE_SCAN: 'staff_auto_continue_scan',
  /** 员工等待时间设置 */
  STAFF_WAIT_TIME: 'staff_wait_time',
  /** 员工选择的活动ID */
  STAFF_SELECTED_EVENT_ID: 'staff_selected_event_id',
  /** 员工选择的活动名称 */
  STAFF_SELECTED_EVENT_NAME: 'staff_selected_event_name',
} as const;

// ==================== 扫码相关配置 ====================
/** 扫码配置常量 */
export const SCAN_CONFIG = {
  /** 默认等待时间（秒） */
  DEFAULT_WAIT_TIME: 2,
  /** 最小等待时间（秒） */
  MIN_WAIT_TIME: 1,
  /** 最大等待时间（秒） */
  MAX_WAIT_TIME: 10,
  /** 摄像头重试延迟（毫秒） */
  CAMERA_RETRY_DELAY: 1000,
  /** 扫描器重启延迟（毫秒） */
  SCANNER_RESTART_DELAY: 500,
} as const;

// ==================== API 相关常量 ====================
/** API配置常量 */
export const API_CONFIG = {
  /** 错误代码 */
  ERROR_CODES: {
    /** PostgreSQL 错误码 */
    PGRST116: 'PGRST116',
  },
  /** 请求超时时间（毫秒） */
  TIMEOUT: 10000,
} as const;

// ==================== UI 相关常量 ====================
/** UI配置常量 */
export const UI_CONFIG = {
  /** 通知显示时间（毫秒） */
  NOTIFICATION_DURATION: 3000,
  /** 扫描结果延迟（毫秒） */
  SCAN_RESULT_DELAY: 2000,
  /** 错误重试延迟（毫秒） */
  ERROR_RETRY_DELAY: 5000,
  /** Toast 通知自动关闭延迟（毫秒） */
  TOAST_AUTO_CLOSE_DELAY: 5000,
} as const;

// ==================== 状态相关常量 ====================
/** 参与者状态常量 */
export const ATTENDEE_STATUS = {
  /** 已注册 */
  REGISTERED: 'registered',
  /** 已签到 */
  CHECKED_IN: 'checked_in',
  /** 已核销 */
  REDEEMED: 'redeemed',
} as const;

/** 通知类型常量 */
export const NOTIFICATION_TYPES = {
  /** 成功 */
  SUCCESS: 'success',
  /** 错误 */
  ERROR: 'error',
  /** 警告 */
  WARNING: 'warning',
  /** 信息 */
  INFO: 'info',
} as const;

// ==================== 摄像头相关常量 ====================
/** 摄像头配置常量 */
export const CAMERA_CONFIG = {
  /** 扫描帧率 */
  FPS: 10,
  /** 二维码扫描框宽度 */
  QRBOX_WIDTH: 250,
  /** 二维码扫描框高度 */
  QRBOX_HEIGHT: 250,
  /** 摄像头标签关键词 */
  CAMERA_LABELS: {
    BACK: ['back', 'environment', '后置'],
    FRONT: ['front', 'user', '前置'],
  },
} as const;

// ==================== 错误消息常量 ====================
/** 错误消息常量 */
export const ERROR_MESSAGES = {
  /** localStorage 不可用 */
  LOCALSTORAGE_UNAVAILABLE: 'localStorage is not defined',
  /** 摄像头权限被拒绝 */
  CAMERA_PERMISSION_DENIED: '摄像头权限被拒绝，请点击地址栏左侧的摄像头图标并选择"允许"',
  /** 未找到摄像头 */
  CAMERA_NOT_FOUND: '未找到摄像头设备，请确保设备有可用的摄像头',
  /** 摄像头被占用 */
  CAMERA_IN_USE: '摄像头被其他应用占用，请关闭其他使用摄像头的应用',
  /** 浏览器不支持摄像头 */
  CAMERA_NOT_SUPPORTED: '浏览器不支持摄像头功能，请使用现代浏览器',
  /** 网络连接错误 */
  NETWORK_ERROR: '网络连接错误，请检查网络连接',
  /** 数据加载失败 */
  DATA_LOAD_FAILED: '数据加载失败，请稍后重试',
  /** 操作失败 */
  OPERATION_FAILED: '操作失败，请稍后重试',
  /** 验证失败 */
  VALIDATION_FAILED: '输入验证失败，请检查输入内容',
} as const;

// ==================== 成功消息常量 ====================
/** 成功消息常量 */
export const SUCCESS_MESSAGES = {
  /** 入场成功 */
  CHECK_IN_SUCCESS: '已成功入场',
  /** 核销成功 */
  REDEEM_SUCCESS: '已完成核销',
  /** 复制成功 */
  COPY_SUCCESS: '链接已复制到剪贴板',
  /** 保存成功 */
  SAVE_SUCCESS: '保存成功',
  /** 删除成功 */
  DELETE_SUCCESS: '删除成功',
} as const;