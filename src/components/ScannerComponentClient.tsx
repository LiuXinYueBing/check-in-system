'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScannerComponentProps {
  onScanSuccess: (uuid: string) => void;
  isActive: boolean;
}

let Html5Qrcode: any = null;
let isLoadingLibrary = false;
let libraryLoadPromise: Promise<any> | null = null;

// 懒加载 html5-qrcode 库
const loadHtml5Qrcode = async (): Promise<any> => {
  if (Html5Qrcode) return Html5Qrcode;

  if (libraryLoadPromise) return libraryLoadPromise;

  if (isLoadingLibrary) {
    // 等待加载完成
    while (isLoadingLibrary) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return Html5Qrcode;
  }

  isLoadingLibrary = true;
  libraryLoadPromise = import('html5-qrcode')
    .then((module) => {
      Html5Qrcode = module.Html5Qrcode;
      isLoadingLibrary = false;
      return Html5Qrcode;
    })
    .catch((error) => {
      isLoadingLibrary = false;
      libraryLoadPromise = null;
      throw error;
    });

  return libraryLoadPromise;
};

export default function ScannerComponentClient({ onScanSuccess, isActive }: ScannerComponentProps) {
  // 扫描器相关状态
  const scannerRef = useRef<any>(null);
  const containerId = 'qr-scanner-container';
  const [isScannerInitialized, setIsScannerInitialized] = useState(false);
  const [hasActiveCamera, setHasActiveCamera] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{id: string, label: string}>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
  const [runtimeError, setRuntimeError] = useState<string>('');
  const [isLibraryReady, setIsLibraryReady] = useState(false);
  const [libraryError, setLibraryError] = useState<string>('');

  // 组件挂载状态和资源锁
  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);
  const cleanupRef = useRef<Promise<void> | null>(null);

  // 🔥 安全的资源清理函数
  const cleanupScanner = useCallback(async () => {
    if (cleanupRef.current) {
      await cleanupRef.current;
    }

    cleanupRef.current = (async () => {
      console.log('🧹 开始清理扫码器资源...');

      if (scannerRef.current) {
        try {
          // 停止扫描
          await scannerRef.current.stop();
          console.log('✅ 摄像头已停止');
        } catch (error: any) {
          console.warn('⚠️ 停止摄像头时出错:', error.message);
        }

        try {
          // 清理资源
          await scannerRef.current.clear();
          console.log('✅ 扫描器资源已清理');
        } catch (error: any) {
          console.warn('⚠️ 清理扫描器时出错:', error.message);
        }

        scannerRef.current = null;
      }

      // 清空容器
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }

      if (isMountedRef.current) {
        setIsScannerInitialized(false);
        setHasActiveCamera(false);
        setCameraError('');
        setRuntimeError('');
      }

      console.log('✅ 扫码器资源清理完成');
      cleanupRef.current = null;
    })();

    await cleanupRef.current;
  }, []);

  // 🔥 组件挂载时初始化
  useEffect(() => {
    // 确保只在客户端运行
    if (typeof window === 'undefined') return;

    const initializeComponent = async () => {
      try {
        console.log('🔄 初始化扫码组件...');

        // 预加载库
        await loadHtml5Qrcode();

        if (isMountedRef.current) {
          setIsLibraryReady(true);
          setLibraryError('');
          console.log('✅ 扫码库预加载完成');
        }
      } catch (error: any) {
        console.error('❌ 扫码库加载失败:', error);
        if (isMountedRef.current) {
          setLibraryError(`扫码库加载失败: ${error?.message || '未知错误'}`);
          setIsLibraryReady(false);
        }
      }
    };

    initializeComponent();

    // 组件卸载时清理
    return () => {
      console.log('🗑️ ScannerComponentClient 卸载');
      isMountedRef.current = false;
      cleanupScanner().catch(console.error);
    };
  }, [cleanupScanner]);

  // 🔥 扫描器控制逻辑 - 修复依赖循环问题
  useEffect(() => {
    if (!isMountedRef.current || !isLibraryReady) return;

    const controlScanner = async () => {
      // 防止重复初始化
      if (isInitializingRef.current) {
        console.log('⏳ 扫描器正在初始化中，跳过...');
        return;
      }

      try {
        if (isActive && !isScannerInitialized) {
          console.log('🎯 扫描器激活，开始初始化...');
          isInitializingRef.current = true;
          await startScanner();
        } else if (!isActive && isScannerInitialized) {
          console.log('⏹️ 扫描器停用，开始清理...');
          isInitializingRef.current = true;
          await cleanupScanner();
        }
      } catch (error: any) {
        console.error('❌ 扫描器状态管理错误:', error);
        if (isMountedRef.current) {
          setRuntimeError(`扫描器状态管理错误: ${error?.message || '未知错误'}`);
        }
      } finally {
        isInitializingRef.current = false;
      }
    };

    controlScanner();
  }, [isActive, isLibraryReady]); // 移除 isScannerInitialized 避免循环

  // 🔥 增强的扫描器启动函数
  const startScanner = async () => {
    // 防止重复初始化
    if (!isMountedRef.current || !isLibraryReady) {
      console.log('❌ 组件未准备好，跳过启动');
      return;
    }

    if (isInitializingRef.current) {
      console.log('⏳ 扫描器正在初始化中，跳过启动');
      return;
    }

    if (isScannerInitialized) {
      console.log('⚠️ 扫描器已初始化，跳过重复启动');
      return;
    }

    try {
      console.log('🔍 开始启动扫描器...');
      setRuntimeError('');
      setCameraError('');

      // 获取 Html5Qrcode 类
      const Html5QrcodeClass = await loadHtml5Qrcode();
      if (!Html5QrcodeClass || !isMountedRef.current) return;

      // 检查容器
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error('扫描器容器不存在，请刷新页面重试');
      }

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能，请使用现代浏览器如Chrome、Firefox或Edge');
      }

      // 获取摄像头列表
      console.log('📹 获取摄像头列表...');
      let cameras;
      try {
        cameras = await Html5QrcodeClass.getCameras();
        console.log('✅ 成功获取摄像头列表:', cameras);
      } catch (camerasError: any) {
        console.error('❌ 获取摄像头列表失败:', camerasError);

        // 提供具体的错误信息
        let errorMessage = '无法访问摄像头';
        if (camerasError.name === 'NotAllowedError') {
          errorMessage = '摄像头权限被拒绝，请点击地址栏左侧的摄像头图标并选择"允许"';
        } else if (camerasError.name === 'NotFoundError') {
          errorMessage = '未找到摄像头设备，请确保设备有可用的摄像头';
        } else if (camerasError.name === 'NotReadableError') {
          errorMessage = '摄像头被其他应用占用，请关闭其他使用摄像头的应用';
        } else if (camerasError.name === 'NotSupportedError') {
          errorMessage = '浏览器不支持摄像头功能，请使用Chrome、Firefox或Edge浏览器';
        } else {
          errorMessage = `无法访问摄像头: ${camerasError.message}`;
        }

        throw new Error(errorMessage);
      }

      if (!cameras || cameras.length === 0) {
        throw new Error('未找到可用的摄像头设备');
      }

      // 处理摄像头列表
      const cameraList = cameras.map((camera: any, index: number) => {
        try {
          let label = camera.label || `摄像头 ${index + 1}`;

          if (camera.label) {
            const lowerLabel = camera.label.toLowerCase();
            if (lowerLabel.includes('back') || lowerLabel.includes('environment')) {
              label = `后置摄像头 ${index + 1}`;
            } else if (lowerLabel.includes('front') || lowerLabel.includes('user')) {
              label = `前置摄像头 ${index + 1}`;
            }
          }

          return {
            id: camera.id,
            label: label
          };
        } catch (e: any) {
          console.warn('⚠️ 处理摄像头信息时出错:', e);
          return {
            id: camera.id || `camera-${index}`,
            label: `摄像头 ${index + 1}`
          };
        }
      });

      if (isMountedRef.current) {
        setAvailableCameras(cameraList);
      }

      // 选择摄像头
      let cameraId = selectedCameraId;
      if (!cameraId) {
        const backCamera = cameras.find((camera: any) =>
          camera.label?.toLowerCase().includes('back') ||
          camera.label?.toLowerCase().includes('environment') ||
          camera.label?.toLowerCase().includes('后置')
        );
        cameraId = backCamera?.id || cameras[0].id;
        if (isMountedRef.current) {
          setSelectedCameraId(cameraId);
        }
      }

      // 创建Html5Qrcode实例
      console.log('📹 创建Html5Qrcode实例...');
      const scanner = new Html5QrcodeClass(containerId);
      scannerRef.current = scanner;

      // 启动扫描
      console.log('📹 启动摄像头, cameraId:', cameraId);
      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText: string) => {
          try {
            console.log('✅ 扫描成功:', decodedText);
            if (isMountedRef.current && !isInitializingRef.current) {
              onScanSuccess(decodedText);
            }
          } catch (e: any) {
            console.error('❌ 处理扫描结果时出错:', e);
            if (isMountedRef.current) {
              setRuntimeError(`处理扫描结果失败: ${e?.message || '未知错误'}`);
            }
          }
        },
        (error: any) => {
          // 只记录重要的扫描警告
          if (error && !error.includes('No QR code found') && !error.includes('NotFoundException')) {
            console.warn('⚠️ 扫描警告:', error);
          }
        }
      );

      if (isMountedRef.current) {
        setIsScannerInitialized(true);
        setHasActiveCamera(true);
        console.log('✅ 状态更新完成 - isScannerInitialized: true, hasActiveCamera: true');
      }
      console.log('✅ 扫描器启动成功！');

    } catch (error: any) {
      console.error('❌ 扫描器启动失败:', error);

      // 清理失败的实例
      if (scannerRef.current) {
        try {
          await scannerRef.current.clear();
        } catch (clearError: any) {
          console.warn('⚠️ 清理失败的扫描器实例时出错:', clearError);
        }
        scannerRef.current = null;
      }

      if (isMountedRef.current) {
        setIsScannerInitialized(false);
        setHasActiveCamera(false);
        setCameraError(error.message || '扫描器启动失败，请检查摄像头权限设置');
      }
    }
  };

  // 🔥 安全的摄像头切换函数
  const handleCameraSwitch = async (newCameraId: string) => {
    if (!isMountedRef.current || isInitializingRef.current) return;

    try {
      console.log('🔄 切换摄像头到:', newCameraId);
      setSelectedCameraId(newCameraId);
      setHasActiveCamera(false);

      await cleanupScanner();

      // 延迟后重新启动
      setTimeout(() => {
        if (isMountedRef.current && !isInitializingRef.current) {
          startScanner();
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ 切换摄像头失败:', error);
      if (isMountedRef.current) {
        setRuntimeError(`切换摄像头失败: ${error?.message || '未知错误'}`);
      }
    }
  };

  // 🔥 权限请求函数
  const handlePermissionRequest = async () => {
    if (!isMountedRef.current) return;

    try {
      console.log('🔐 手动请求摄像头权限...');
      setRuntimeError('');
      setCameraError('');

      // 重置状态
      setIsScannerInitialized(false);
      setHasActiveCamera(false);
      isInitializingRef.current = false;

      const Html5QrcodeClass = await loadHtml5Qrcode();
      if (!Html5QrcodeClass || !isMountedRef.current) return;

      console.log('📹 获取摄像头列表...');
      const cameras = await Html5QrcodeClass.getCameras();
      console.log('✅ 成功获取摄像头列表:', cameras);

      if (cameras && cameras.length > 0 && isMountedRef.current) {
        console.log('✅ 权限获取成功，启动扫描器...');

        // 更新摄像头列表
        const cameraList = cameras.map((camera: any, index: number) => {
          let label = camera.label || `摄像头 ${index + 1}`;
          if (camera.label) {
            const lowerLabel = camera.label.toLowerCase();
            if (lowerLabel.includes('back') || lowerLabel.includes('environment')) {
              label = `后置摄像头 ${index + 1}`;
            } else if (lowerLabel.includes('front') || lowerLabel.includes('user')) {
              label = `前置摄像头 ${index + 1}`;
            }
          }
          return { id: camera.id, label };
        });
        setAvailableCameras(cameraList);

        // 延迟启动扫描器
        setTimeout(() => {
          if (isMountedRef.current && isActive) {
            startScanner();
          }
        }, 100);
      } else if (isMountedRef.current) {
        setCameraError('未找到可用的摄像头设备');
      }
    } catch (error: any) {
      console.error('❌ 权限请求失败:', error);
      let errorMessage = '无法访问摄像头';
      if (error.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝，请点击地址栏左侧的摄像头图标并选择"允许"';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未找到摄像头设备，请确保设备有可用的摄像头';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '摄像头被其他应用占用，请关闭其他使用摄像头的应用';
      } else {
        errorMessage = `权限请求失败: ${error?.message || '未知错误'}`;
      }

      if (isMountedRef.current) {
        setCameraError(errorMessage);
      }
    }
  };

  // 🔥 重启函数
  const handleRestart = async () => {
    if (!isMountedRef.current) return;

    try {
      console.log('🔄 重启扫描器...');
      setRuntimeError('');
      setCameraError('');

      // 强制重置状态
      setIsScannerInitialized(false);
      setHasActiveCamera(false);
      isInitializingRef.current = false;

      await cleanupScanner();

      setTimeout(() => {
        if (isMountedRef.current && isActive && !isInitializingRef.current) {
          console.log('🔄 延迟重启扫描器...');
          startScanner();
        }
      }, 500);

    } catch (error: any) {
      console.error('❌ 重启扫描器失败:', error);
      if (isMountedRef.current) {
        setRuntimeError(`重启扫描器失败: ${error?.message || '未知错误'}`);
      }
    }
  };

  // 错误重置函数
  const clearErrors = () => {
    if (isMountedRef.current) {
      setCameraError('');
      setRuntimeError('');
    }
  };

  // 库加载失败状态
  if (libraryError) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <div className="text-center">
            <div className="text-3xl mb-4">❌</div>
            <h2 className="text-lg font-semibold mb-2">扫码功能加载失败</h2>
            <p className="text-gray-600 mb-4">{libraryError}</p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              🔄 刷新页面
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 库加载中状态
  if (!isLibraryReady) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载扫码功能...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 运行时错误显示 */}
      {runtimeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">❌</div>
            <div className="flex-1">
              <h4 className="text-red-800 font-medium">运行时错误</h4>
              <p className="text-red-600 text-sm">{runtimeError}</p>
            </div>
            <Button
              onClick={clearErrors}
              variant="outline"
              size="sm"
              className="ml-3"
            >
              ✖️
            </Button>
          </div>
        </div>
      )}

      <Card className="shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-center">
            扫码核验
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isActive ? (
            <div className="flex flex-col items-center space-y-4">
              {/* 摄像头选择器 */}
              {availableCameras.length > 1 && (
                <div className="w-full max-w-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择摄像头
                  </label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => handleCameraSwitch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableCameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 扫描器容器 */}
              <div id={containerId} className="w-full max-w-sm relative">
                {/* 错误状态 */}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg border-2 border-red-200 z-10">
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2">❌</div>
                      <p className="text-sm text-red-800 mb-4">{cameraError}</p>
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={handleRestart}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          🔄 重试
                        </Button>
                        <Button
                          onClick={handlePermissionRequest}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          🔐 重新请求权限
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 等待状态 */}
                {!hasActiveCamera && !isScannerInitialized && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center p-4">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-sm text-gray-600 mb-4">等待摄像头启动...</p>
                      <Button
                        onClick={handlePermissionRequest}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        🔐 手动请求摄像头权限
                      </Button>
                    </div>
                  </div>
                )}

                {/* 初始化状态 */}
                {isScannerInitialized && !hasActiveCamera && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2">⚠️</div>
                      <p className="text-sm text-yellow-800">摄像头初始化中...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 控制按钮 */}
              <div className="flex space-x-2 w-full max-w-sm">
                <Button
                  onClick={handleRestart}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  🔧 重启扫描器
                </Button>
                {availableCameras.length > 1 && (
                  <Button
                    onClick={handlePermissionRequest}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    📹 刷新摄像头
                  </Button>
                )}
              </div>

              {/* 调试信息 */}
              <div className="w-full max-w-sm text-xs text-gray-500 space-y-1">
                <p>• 库加载状态: {isLibraryReady ? '✅' : '❌'}</p>
                <p>• 扫描器状态: {isScannerInitialized ? '✅ 已初始化' : '❌ 未初始化'}</p>
                <p>• 摄像头状态: {hasActiveCamera ? '✅ 活跃' : '❌ 未活跃'}</p>
                <p>• 可用摄像头: {availableCameras.length} 个</p>
                {selectedCameraId && <p>• 当前摄像头: {selectedCameraId}</p>}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">扫描器未激活</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}