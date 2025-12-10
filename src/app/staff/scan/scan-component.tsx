'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScannerComponentProps {
  onScanSuccess: (uuid: string) => void;
  isActive: boolean;
}

export default function ScannerComponent({ onScanSuccess, isActive }: ScannerComponentProps) {
  // 客户端检查和动态导入状态
  const [isClient, setIsClient] = useState(false);
  const [html5QrcodeLoaded, setHtml5QrcodeLoaded] = useState(false);
  const [html5QrcodeError, setHtml5QrcodeError] = useState<string>('');
  const [Html5Qrcode, setHtml5Qrcode] = useState<any>(null);

  // 扫描器相关状态
  const scannerRef = useRef<any>(null);
  const containerId = 'qr-scanner-container';
  const [isScannerInitialized, setIsScannerInitialized] = useState(false);
  const [hasActiveCamera, setHasActiveCamera] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{id: string, label: string}>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
  const [runtimeError, setRuntimeError] = useState<string>('');

  // 组件挂载状态检查
  const isMountedRef = useRef(true);

  // 🔥 客户端检查和动态导入html5-qrcode - 增强错误处理
  useEffect(() => {
    try {
      setIsClient(typeof window !== 'undefined');

      if (typeof window !== 'undefined') {
        console.log('🔄 开始动态导入 html5-qrcode 库...');

        import('html5-qrcode')
          .then((module) => {
            if (!isMountedRef.current) return;

            console.log('✅ html5-qrcode库加载成功');
            setHtml5Qrcode(module.Html5Qrcode);
            setHtml5QrcodeLoaded(true);
            setHtml5QrcodeError('');
          })
          .catch((error) => {
            if (!isMountedRef.current) return;

            console.error('❌ html5-qrcode库加载失败:', error);
            setHtml5QrcodeLoaded(false);
            setHtml5QrcodeError(`扫码库加载失败: ${error?.message || '未知错误'}`);
          });
      }
    } catch (error: any) {
      console.error('❌ 初始化html5-qrcode时发生错误:', error);
      if (isMountedRef.current) {
        setHtml5QrcodeError(`初始化失败: ${error?.message || '未知错误'}`);
      }
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 🔥 增强的摄像头权限检查 - 全面错误处理
  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      console.log('🔍 开始检查摄像头权限...');

      if (!isClient || !html5QrcodeLoaded || !Html5Qrcode) {
        throw new Error('扫码功能尚未准备就绪，请稍后再试');
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能');
      }

      console.log('📹 调用 Html5Qrcode.getCameras()...');
      const cameras = await Html5Qrcode.getCameras();
      console.log('✅ 成功获取摄像头列表:', cameras);

      if (cameras && cameras.length > 0) {
        console.log('✅ 摄像头权限获取成功');
        return true;
      } else {
        console.log('❌ 未找到摄像头');
        return false;
      }
    } catch (error: any) {
      console.error('❌ 摄像头权限检查失败:', error);

      // 提供更具体的错误信息
      if (error.name === 'NotAllowedError') {
        throw new Error('摄像头权限被拒绝，请点击地址栏左侧的摄像头图标并选择"允许"');
      } else if (error.name === 'NotFoundError') {
        throw new Error('未找到摄像头设备，请确保设备有可用的摄像头');
      } else if (error.name === 'NotReadableError') {
        throw new Error('摄像头被其他应用占用，请关闭其他使用摄像头的应用');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('浏览器不支持摄像头功能，请使用现代浏览器');
      } else if (error.name === 'SecurityError') {
        throw new Error('安全限制：网页需要通过HTTPS访问才能使用摄像头');
      } else {
        throw new Error(`摄像头访问失败: ${error.message || '未知错误'}`);
      }
    }
  };

  // 🔥 扫描器控制逻辑 - 增强错误处理
  useEffect(() => {
    if (!isMountedRef.current) return;

    try {
      if (isActive && !isScannerInitialized) {
        console.log('🎯 扫描器激活，开始初始化...');
        startScanner();
      } else if (!isActive && isScannerInitialized) {
        console.log('⏹️ 扫描器停用，开始清理...');
        stopScanner().catch(console.error);
      }
    } catch (error: any) {
      console.error('❌ 扫描器状态管理错误:', error);
      setRuntimeError(`扫描器状态管理错误: ${error?.message || '未知错误'}`);
    }
  }, [isActive, isScannerInitialized]);

  // 🔥 组件卸载时清除资源
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      console.log('🧹 ScannerComponent 卸载，清理资源...');
      stopScanner().catch((error: any) => {
        console.error('⚠️ 组件卸载时停止扫描器失败:', error);
      });
    };
  }, []);

  // 🔥 增强的扫描器启动函数 - 全面错误处理
  const startScanner = async () => {
    if (!isMountedRef.current) return;

    try {
      console.log('🔍 开始启动扫描器...');
      setRuntimeError('');
      setCameraError('');

      // 步骤1: 检查客户端和库加载状态
      if (!isClient || !html5QrcodeLoaded || !Html5Qrcode) {
        const errorMsg = html5QrcodeError || '扫码功能正在加载中，请稍后再试';
        console.error('❌ 客户端或库检查失败:', errorMsg);
        setCameraError(errorMsg);
        return;
      }

      // 步骤2: 检查重复初始化
      if (scannerRef.current && isScannerInitialized) {
        console.warn('⚠️ 扫描器已经初始化，跳过重复初始化');
        return;
      }

      // 步骤3: 检查容器
      const container = document.getElementById(containerId);
      if (!container) {
        const errorMsg = '扫描器容器不存在，请刷新页面重试';
        console.error('❌ 容器检查失败:', errorMsg);
        setCameraError(errorMsg);
        return;
      }

      // 步骤4: 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = '浏览器不支持摄像头功能，请使用现代浏览器如Chrome、Firefox或Edge';
        console.error('❌ 浏览器支持检查失败:', errorMsg);
        setCameraError(errorMsg);
        return;
      }

      // 步骤5: 清理旧实例
      if (scannerRef.current) {
        try {
          console.log('🧹 清理旧扫描器实例...');
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (e: any) {
          console.warn('⚠️ 清理旧扫描器时出错:', e);
        }
        scannerRef.current = null;
      }

      // 清空容器
      container.innerHTML = '';

      // 步骤6: 获取摄像头列表
      console.log('📹 获取摄像头列表...');
      let cameras;
      try {
        cameras = await Html5Qrcode.getCameras();
        console.log('✅ 成功获取摄像头列表:', cameras);
      } catch (camerasError: any) {
        console.error('❌ 获取摄像头列表失败:', camerasError);

        // 根据错误类型提供具体提示
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

        setCameraError(errorMessage);
        return;
      }

      if (!cameras || cameras.length === 0) {
        const errorMsg = '未找到可用的摄像头设备';
        console.error('❌ 摄像头列表为空:', errorMsg);
        setCameraError(errorMsg);
        return;
      }

      // 步骤7: 处理摄像头列表
      const cameraList = cameras.map((camera: any, index: number) => {
        try {
          let label = camera.label || `摄像头 ${index + 1}`;

          if (camera.label) {
            const lowerLabel = camera.label.toLowerCase();
            if (lowerLabel.includes('back') || lowerLabel.includes('environment')) {
              label = `后置摄像头 ${index + 1}`;
            } else if (lowerLabel.includes('front') || lowerLabel.includes('user')) {
              label = `前置摄像头 ${index + 1}`;
            } else {
              label = camera.label;
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

      // 步骤8: 选择摄像头
      let cameraId = selectedCameraId;
      if (!cameraId) {
        try {
          const backCamera = cameras.find((camera: any) =>
            camera.label?.toLowerCase().includes('back') ||
            camera.label?.toLowerCase().includes('environment') ||
            camera.label?.toLowerCase().includes('后置')
          );
          cameraId = backCamera?.id || cameras[0].id;
          if (isMountedRef.current) {
            setSelectedCameraId(cameraId);
          }
        } catch (e: any) {
          console.warn('⚠️ 选择摄像头时出错:', e);
          cameraId = cameras[0]?.id;
        }
      }

      // 步骤9: 创建Html5Qrcode实例
      console.log('📹 创建Html5Qrcode实例...');
      let scanner;
      try {
        scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
      } catch (e: any) {
        console.error('❌ 创建Html5Qrcode实例失败:', e);
        setCameraError(`创建扫描器失败: ${e?.message || '未知错误'}`);
        return;
      }

      // 步骤10: 启动扫描
      console.log('📹 启动摄像头, cameraId:', cameraId);
      try {
        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText: string) => {
            try {
              console.log('✅ 扫描成功:', decodedText);
              if (isMountedRef.current) {
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
            // 只记录扫描警告，不影响正常扫描
            if (error && !error.includes('No QR code found') && !error.includes('NotFoundException')) {
              console.warn('⚠️ 扫描警告:', error);
            }
          }
        );

        if (isMountedRef.current) {
          setIsScannerInitialized(true);
          setHasActiveCamera(true);
        }
        console.log('✅ 扫描器启动成功！');

      } catch (startError: any) {
        console.error('❌ 启动扫描器失败:', startError);

        // 清理失败的实例
        try {
          await scanner.clear();
        } catch (clearError: any) {
          console.warn('⚠️ 清理失败的扫描器实例时出错:', clearError);
        }
        scannerRef.current = null;

        if (isMountedRef.current) {
          setIsScannerInitialized(false);
          setHasActiveCamera(false);

          let errorMessage = '扫描器启动失败，请检查摄像头权限设置';
          if (startError instanceof Error) {
            errorMessage = startError.message;
          }
          setCameraError(errorMessage);
        }
      }

    } catch (error: any) {
      console.error('❌ 扫描器启动过程中发生意外错误:', error);

      if (isMountedRef.current) {
        setIsScannerInitialized(false);
        setHasActiveCamera(false);
        scannerRef.current = null;

        let errorMessage = '扫描器启动失败，请检查摄像头权限设置';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        setCameraError(errorMessage);
      }
    }
  };

  // 🔥 增强的扫描器停止函数
  const stopScanner = async () => {
    try {
      console.log('🛑 停止扫描器...');

      if (scannerRef.current) {
        try {
          console.log('⏹️ 停止摄像头...');
          await scannerRef.current.stop();
          console.log('✅ 摄像头已停止');
        } catch (error: any) {
          console.warn('⚠️ 停止摄像头时出错:', error);
        }

        try {
          console.log('🧹 清理扫描器资源...');
          await scannerRef.current.clear();
          console.log('✅ 扫描器已清理');
        } catch (error: any) {
          console.warn('⚠️ 清理扫描器时出错:', error);
        }

        scannerRef.current = null;
      }

      if (isMountedRef.current) {
        setIsScannerInitialized(false);
        setHasActiveCamera(false);
        setCameraError('');
      }

      // 清空容器内容
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }

    } catch (error: any) {
      console.error('❌ 停止扫描器时发生意外错误:', error);

      // 即使停止失败也要强制清理状态，防止页面卡死
      scannerRef.current = null;
      if (isMountedRef.current) {
        setIsScannerInitialized(false);
        setHasActiveCamera(false);
      }
    }
  };

  // 🔥 安全的摄像头切换函数
  const handleCameraSwitch = async (newCameraId: string) => {
    try {
      console.log('🔄 切换摄像头到:', newCameraId);

      if (!isMountedRef.current) return;

      setSelectedCameraId(newCameraId);
      setHasActiveCamera(false);

      // 停止当前扫描器
      await stopScanner();

      // 短暂延迟后重新启动
      setTimeout(() => {
        if (isMountedRef.current) {
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

  // 🔥 安全的权限请求函数
  const handlePermissionRequest = async () => {
    try {
      console.log('🔐 手动请求摄像头权限...');
      setRuntimeError('');

      const hasPermission = await checkCameraPermission();
      if (hasPermission && isMountedRef.current) {
        console.log('✅ 权限获取成功，启动扫描器...');
        startScanner();
      } else if (isMountedRef.current) {
        setCameraError('无法获取摄像头权限，请检查浏览器设置');
      }
    } catch (error: any) {
      console.error('❌ 权限请求失败:', error);
      if (isMountedRef.current) {
        setCameraError(`权限请求失败: ${error?.message || '未知错误'}`);
      }
    }
  };

  // 🔥 安全的扫描器重启函数
  const handleRestartScanner = async () => {
    try {
      console.log('🔄 重启扫描器...');
      setRuntimeError('');

      await stopScanner();

      setTimeout(() => {
        if (isMountedRef.current) {
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

  // 🔥 错误重置函数
  const clearErrors = () => {
    if (isMountedRef.current) {
      setCameraError('');
      setRuntimeError('');
    }
  };

  // SSR保护
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载扫码功能...</p>
        </div>
      </div>
    );
  }

  // html5-qrcode加载错误
  if (html5QrcodeError) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <div className="text-center">
            <div className="text-3xl mb-4">❌</div>
            <h2 className="text-lg font-semibold mb-2">扫码功能加载失败</h2>
            <p className="text-gray-600 mb-4">{html5QrcodeError}</p>
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

  return (
    <div className="space-y-4">
      {/* 运行时错误显示 */}
      {runtimeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">❌</div>
            <div>
              <h4 className="text-red-800 font-medium">运行时错误</h4>
              <p className="text-red-600 text-sm">{runtimeError}</p>
            </div>
            <Button
              onClick={clearErrors}
              variant="outline"
              size="sm"
              className="ml-auto"
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
                          onClick={() => startScanner()}
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
                  onClick={handleRestartScanner}
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
                <p>• 客户端状态: {isClient ? '✅' : '❌'}</p>
                <p>• 库加载状态: {html5QrcodeLoaded ? '✅' : '❌'}</p>
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