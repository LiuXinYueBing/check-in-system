'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { getErrorMessage, getSafeError } from '@/utils/error-helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SCAN_CONFIG, CAMERA_CONFIG } from '@/lib/constants';

interface ScannerComponentProps {
  onScanSuccess: (uuid: string) => void;
  isActive: boolean;
}

// 全局单例模式 - 确保整个应用只有一个扫描器实例
let globalScannerInstance: any = null;
let globalContainerId: string | null = null;
let globalIsInitialized = false;

export default function ScannerComponentClient({ onScanSuccess, isActive }: ScannerComponentProps) {
  const scannerRef = useRef<any>(null);
  const containerIdRef = useRef(`qr-scanner-${Date.now()}-${Math.random()}`);
  const isMountedRef = useRef(true);
  const isCleaningUpRef = useRef(false);
  const isStartingRef = useRef(false);
  const isTransitioningRef = useRef(false); // 🔒 添加状态锁
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 🔒 状态锁超时

  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{id: string, label: string}>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
  const [isLibraryReady, setIsLibraryReady] = useState(false);
  const [libraryError, setLibraryError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [criticalError, setCriticalError] = useState<string>(''); // 🚨 关键错误状态

  // 🔒 状态锁超时保护
  const setTransitionLock = useCallback((locked: boolean, timeout: number = 5000) => {
    if (locked) {
      isTransitioningRef.current = true;
      logger.log('🔒 状态锁已锁定');

      // 设置超时强制释放
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      transitionTimeoutRef.current = setTimeout(() => {
        if (isTransitioningRef.current) {
          logger.warn('⚠️ 状态锁超时，强制释放');
          isTransitioningRef.current = false;
        }
      }, timeout);
    } else {
      isTransitioningRef.current = false;
      logger.log('🔓 状态锁已释放');

      // 清除超时定时器
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    }
  }, []);

  // 强制清理全局扫描器实例
  const forceCleanupGlobalScanner = useCallback(async () => {
    if (globalScannerInstance) {
      try {
        logger.log('🧹 强制清理全局扫描器实例...');
        const state = globalScannerInstance.getState();
        if (state === 2) {
          await globalScannerInstance.stop();
        }
        await globalScannerInstance.clear();
      } catch (e) {
        // 忽略所有清理错误
        logger.warn('⚠️ 清理全局扫描器时出错:', getErrorMessage(e));
      }
      globalScannerInstance = null;
      globalContainerId = null;
      globalIsInitialized = false;
    }
  }, []);

  // 安全的清理函数 - 增强版
  const cleanupScanner = useCallback(async () => {
    logger.log('🧹 开始清理扫描器，当前状态锁:', isTransitioningRef.current);

    // 🔒 使用新的状态锁机制
    if (isTransitioningRef.current) {
      logger.log('⏸️ 正在状态转换中，跳过清理');
      return;
    }

    setTransitionLock(true, 3000); // 🔒 设置3秒超时

    try {
      // 清除所有定时器
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }

      if (isCleaningUpRef.current) {
        logger.log('⏸️ 已经在清理中，跳过');
        return;
      }

      const scanner = scannerRef.current;
      if (!scanner) {
        setIsScanning(false);
        return;
      }

      isCleaningUpRef.current = true;
      scannerRef.current = null;
      logger.log('🧹 开始清理扫描器实例...');

      // 🛡️ 检查组件是否还挂载
      if (!isMountedRef.current) {
        logger.log('⚠️ 组件已卸载，跳过清理');
        return;
      }

      // 获取当前状态
      const state = scanner.getState();
      logger.log('📊 扫描器状态:', state);

      // 先停止扫描
      if (state === 2) { // SCANNING
        await scanner.stop();
        logger.log('✅ 扫描器已停止');
      }

      // 清理容器内容 - 立即清理
      const container = document.getElementById(containerIdRef.current);
      if (container) {
        try {
          container.innerHTML = '';
        } catch (domError) {
          const domErrorMsg = getErrorMessage(domError);
          logger.warn('⚠️ DOM清理出错:', domErrorMsg);
        }
      }

      // 清理扫描器实例
      try {
        await scanner.clear();
        logger.log('✅ 扫描器已清理');
      } catch (clearError) {
        const msg = getErrorMessage(clearError);
        if (!msg.includes('removeChild') && !msg.includes('Node') && !msg.includes('DOMException')) {
          logger.warn('⚠️ clear() 出错:', msg);
        }
      }

    } catch (e) {
      logger.warn('⚠️ 清理过程出错:', getErrorMessage(e));
      if (isMountedRef.current) {
        setCriticalError('扫描器清理失败，请点击重试');
      }
    } finally {
      // 🔒 确保状态锁一定释放
      isCleaningUpRef.current = false;
      setTransitionLock(false); // 释放状态锁
      scannerRef.current = null;
      if (isMountedRef.current) {
        setIsScanning(false);
      }
      logger.log('🧹 清理函数完成，状态锁已释放');
    }
  }, [setTransitionLock]);

  // 启动扫描器 - 增强版
  const startScanner = useCallback(async () => {
    logger.log('🔍 开始启动扫描器，当前状态:', {
      isMounted: isMountedRef.current,
      isActive,
      isStarting: isStartingRef.current,
      isCleaning: isCleaningUpRef.current,
      isTransitioning: isTransitioningRef.current
    });

    if (!isMountedRef.current || !isActive) {
      logger.log('⏸️ 组件未挂载或未激活，跳过启动');
      return;
    }

    if (isStartingRef.current || isCleaningUpRef.current || isTransitioningRef.current) {
      logger.log('⏸️ 正在启动、清理或状态转换中，跳过');
      return;
    }

    // 🔒 设置状态锁
    setTransitionLock(true, 5000); // 5秒超时

    try {
      // 🛡️ 强制清理之前的实例
      try {
        await forceCleanupGlobalScanner();
      } catch (e) {
        logger.warn('⚠️ 强制清理失败，继续启动:', getErrorMessage(e));
      }

      isStartingRef.current = true;
      logger.log('🔍 开始启动扫描器...');
      setCameraError('');
      setCriticalError(''); // 🚨 清除关键错误

      // 动态导入 html5-qrcode
      const html5QrcodeModule = await import('html5-qrcode');
      const Html5QrcodeClass = html5QrcodeModule.Html5Qrcode;

      if (!isMountedRef.current || !isActive) {
        logger.log('⏸️ 组件状态变化，退出启动');
        return;
      }

      const container = document.getElementById(containerIdRef.current);
      if (!container) {
        throw new Error('扫描器容器不存在');
      }

      // 清空容器
      container.innerHTML = '';

      // 获取摄像头
      const cameras = await Html5QrcodeClass.getCameras();
      if (!cameras || cameras.length === 0) {
        throw new Error('未找到可用的摄像头设备');
      }

      const cameraList = cameras.map((camera, index) => ({
        id: camera.id,
        label: camera.label || `摄像头 ${index + 1}`
      }));
      setAvailableCameras(cameraList);

      // 选择摄像头
      let cameraId = selectedCameraId;
      if (!cameraId) {
        const backCamera = cameras.find(c =>
          c.label?.toLowerCase().includes('back') ||
          c.label?.toLowerCase().includes('environment')
        );
        cameraId = backCamera?.id || cameras[0].id;
        setSelectedCameraId(cameraId);
      }

      // 创建新的扫描器实例
      logger.log('📹 创建扫描器实例...');
      const scanner = new Html5QrcodeClass(containerIdRef.current);

      // 保存到全局变量
      globalScannerInstance = scanner;
      globalContainerId = containerIdRef.current;
      globalIsInitialized = true;

      scannerRef.current = scanner;

      // 启动扫描
      logger.log('📹 启动摄像头, cameraId:', cameraId);
      await scanner.start(
        cameraId,
        {
          fps: CAMERA_CONFIG.FPS,
          qrbox: { width: CAMERA_CONFIG.QRBOX_WIDTH, height: CAMERA_CONFIG.QRBOX_HEIGHT }
        },
        (decodedText) => {
          if (isMountedRef.current) {
            logger.log('✅ 扫描成功:', decodedText);
            onScanSuccess(decodedText);
          }
        },
        (error) => {
          // 忽略未找到二维码的错误
          const errorString = typeof error === 'string' ? error : String(error);
          if (!errorString.includes('No QR code found') && !errorString.includes('NotFoundException')) {
            logger.warn('⚠️ 扫描警告:', error);
          }
        }
      );

      setIsScanning(true);
      setRetryCount(0);
      logger.log('✅ 扫描器启动成功');

    } catch (error) {
      logger.error('❌ 扫描器启动失败:', error);
      scannerRef.current = null;
      globalScannerInstance = null;
      globalIsInitialized = false;

      const errorObj = error as any;
      let msg = getErrorMessage(error);

      if (errorObj?.name === 'NotAllowedError') {
        msg = '摄像头权限被拒绝，请允许访问摄像头';
      } else if (errorObj?.name === 'NotFoundError') {
        msg = '未找到摄像头设备';
      } else if (errorObj?.name === 'NotReadableError') {
        msg = '摄像头被其他应用占用';
      } else if (errorObj?.name === 'NotSupportedError') {
        msg = '浏览器不支持摄像头功能';
      }

      // 🚨 检查是否是关键错误
      if (msg.includes('transition') || msg.includes('removeChild') || msg.includes('DOMException')) {
        logger.error('🚨 关键错误，设置关键错误状态:', msg);
        setCriticalError(`扫描器故障: ${msg}`);
      } else {
        setCameraError(msg);
      }

      setIsScanning(false);

      // 如果是状态转换错误，尝试重试
      if (msg.includes('transition') && retryCount < 3) {
        logger.log(`🔄 状态转换错误，尝试第 ${retryCount + 1} 次重试...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          if (isMountedRef.current && isActive) {
            startScanner();
          }
        }, 1000);
      }
    } finally {
      // 🔒 确保状态锁一定释放
      isStartingRef.current = false;
      setTransitionLock(false);
      logger.log('🔍 启动函数完成，状态锁已释放');
    }
  }, [isActive, selectedCameraId, onScanSuccess, retryCount, forceCleanupGlobalScanner, setTransitionLock]);

  // 切换摄像头 - 安全版
  const handleCameraSwitch = useCallback(async (newCameraId: string) => {
    logger.log('🔄 开始切换摄像头:', newCameraId);

    // 🔒 使用新的状态锁机制
    if (isTransitioningRef.current) {
      logger.log('⏸️ 正在状态转换中，跳过摄像头切换');
      return;
    }

    if (!scannerRef.current || newCameraId === selectedCameraId) {
      logger.log('⏸️ 无扫描器实例或相同摄像头，跳过切换');
      return;
    }

    setTransitionLock(true, 3000); // 3秒超时

    try {
      logger.log('🔄 切换摄像头到:', newCameraId);
      setSelectedCameraId(newCameraId);
      setCriticalError(''); // 🚨 清除关键错误

      // 🛡️ 安全停止并清理当前扫描器
      await cleanupScanner();
    } catch (e) {
      logger.warn('⚠️ 切换摄像头时清理失败:', getErrorMessage(e));
      // 继续执行，不阻止切换
    } finally {
      // 🔒 确保状态锁释放
      setTransitionLock(false);

      // 等待一段时间再重新启动
      scanTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && isActive) {
          startScanner();
        }
      }, 600); // 增加延迟确保完全清理
    }
  }, [cleanupScanner, isActive, selectedCameraId, setTransitionLock, startScanner]);

  // 重启扫描器 - 安全版
  const handleRestart = useCallback(async () => {
    logger.log('🔄 开始重启扫描器...');

    // 🔒 使用新的状态锁机制
    if (isTransitioningRef.current) {
      logger.log('⏸️ 正在状态转换中，跳过重启');
      return;
    }

    setTransitionLock(true, 3000); // 3秒超时

    try {
      logger.log('🔄 重启扫描器...');
      setCriticalError(''); // 🚨 清除关键错误
      setCameraError(''); // 清除普通错误
      setRetryCount(0); // 重置重试次数

      // 🛡️ 安全清理
      await cleanupScanner();
    } catch (e) {
      logger.warn('⚠️ 重启时清理失败:', getErrorMessage(e));
      // 继续执行，不阻止重启
    } finally {
      // 🔒 确保状态锁释放
      setTransitionLock(false);

      // 再重启
      scanTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && isActive) {
          startScanner();
        }
      }, 600); // 增加延迟确保完全清理
    }
  }, [cleanupScanner, isActive, setTransitionLock, startScanner]);

  // 🚨 处理关键错误重试
  const handleCriticalErrorRetry = useCallback(async () => {
    logger.log('🔄 处理关键错误重试...');
    setCriticalError('');
    setCameraError('');
    setRetryCount(0);

    // 🔒 重置所有状态锁
    isStartingRef.current = false;
    isCleaningUpRef.current = false;
    setTransitionLock(false); // 使用新的机制释放锁

    await handleRestart();
  }, [handleRestart, setTransitionLock]);

  // 初始化库
  useEffect(() => {
    isMountedRef.current = true;

    // 预加载 html5-qrcode 库
    import('html5-qrcode')
      .then(() => {
        if (isMountedRef.current) {
          setIsLibraryReady(true);
        }
      })
      .catch((error) => {
        if (isMountedRef.current) {
          setLibraryError(getErrorMessage(error));
        }
      });

    // 页面卸载时清理
    const handleBeforeUnload = () => {
      forceCleanupGlobalScanner();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // 清理定时器
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // 🔒 确保状态锁释放
      setTransitionLock(false);

      cleanupScanner();
      forceCleanupGlobalScanner();
    };
  }, [cleanupScanner, forceCleanupGlobalScanner, setTransitionLock]);

  // 控制扫描器启停
  useEffect(() => {
    if (!isLibraryReady) return;

    if (isActive && !scannerRef.current && !isStartingRef.current) {
      startScanner();
    } else if (!isActive && scannerRef.current) {
      cleanupScanner();
    }
  }, [isActive, isLibraryReady, startScanner, cleanupScanner]);

  if (libraryError) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="text-center py-8">
          <div className="text-3xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{libraryError}</p>
          <Button onClick={() => window.location.reload()}>🔄 刷新页面</Button>
        </CardContent>
      </Card>
    );
  }

  // 🚨 关键错误显示 - 防止白屏
  if (criticalError) {
    return (
      <Card className="shadow-xl border-0 border-red-200">
        <CardHeader>
          <CardTitle className="text-center text-red-600">🚨 扫描器故障</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-4">💥</div>
            <p className="text-red-800 font-medium mb-2">{criticalError}</p>
            <p className="text-sm text-gray-600 mb-6">扫描器遇到了严重错误，但可以安全重试</p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleCriticalErrorRetry}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              🔄 安全重试扫描器
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              🔃 刷新整个页面
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-red-50 p-3 rounded-lg">
            <p>💡 提示：如果持续出现此错误，可能是：</p>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>摄像头被其他应用占用</li>
              <li>浏览器权限设置问题</li>
              <li>设备兼容性问题</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLibraryReady) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载扫码功能...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0">
      <CardHeader>
        <CardTitle className="text-center">扫码核验</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 摄像头选择 */}
        {availableCameras.length > 1 && (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">选择摄像头</label>
            <select
              value={selectedCameraId}
              onChange={(e) => handleCameraSwitch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableCameras.map((camera) => (
                <option key={camera.id} value={camera.id}>{camera.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* 扫描器容器 */}
        <div className="relative w-full" style={{ minHeight: '300px' }}>
          <div
            id={containerIdRef.current}
            className="w-full"
            style={{ backgroundColor: '#000' }}
          />

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">❌</div>
                <p className="text-sm text-red-800 mb-4">{cameraError}</p>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Button onClick={handleRestart} variant="outline" size="sm">🔄 重试</Button>
                    <Button onClick={() => {
                      setCameraError('');
                      setRetryCount(0);
                      startScanner();
                    }} variant="outline" size="sm">🔧 强制重启</Button>
                  </div>
                  {retryCount >= 2 && (
                    <Button
                      onClick={handleCriticalErrorRetry}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      🚨 深度重置
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isScanning && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center p-4">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm text-gray-600">正在启动摄像头...</p>
              </div>
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="flex space-x-2">
          <Button onClick={handleRestart} variant="outline" size="sm" className="flex-1">
            🔧 重启扫描器
          </Button>
          <Button onClick={() => {
            forceCleanupGlobalScanner();
            setTimeout(() => {
              if (isMountedRef.current) {
                startScanner();
              }
            }, 100);
          }} variant="outline" size="sm" className="flex-1">
            📹 强制刷新
          </Button>
        </div>

        {/* 状态信息 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• 库加载状态: {isLibraryReady ? '✅' : '❌'}</p>
          <p>• 扫描器状态: {isScanning ? '✅ 正在扫描' : '❌ 未扫描'}</p>
          <p>• 可用摄像头: {availableCameras.length} 个</p>
          <p>• 重试次数: {retryCount}</p>
          <p>• 状态锁: {isTransitioningRef.current ? '🔒 锁定' : '🔓 就绪'}</p>
          {criticalError && <p className="text-red-600">• 🚨 关键错误: {criticalError}</p>}
          {selectedCameraId && <p>• 当前摄像头: {selectedCameraId}</p>}
        </div>
      </CardContent>
    </Card>
  );
}