'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function TestQRPage() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerId = 'qr-test-container';
  const styleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🔍 测试页面加载，初始化扫描器...');

    // 等待组件挂载
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      stopScanner();
      stopStyleFixInterval();
    };
  }, []);

  // 🔥 修复摄像头选择器文字旋转问题 - 强化版本
  const fixCameraSelectorStyles = () => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('⚠️ 扫描器容器未找到:', containerId);
      return;
    }

    console.log('🔧 开始修复扫描器样式 (测试页面)...');

    // 扩大选择范围：查找所有可能的元素
    const selectors = [
      'select', 'button', 'div', 'span', 'a', 'p', 'label', 'option',
      '#qr-reader *', '[id*="qr"] *', '[class*="qr"] *',
      'html5-qrcode-component *'
    ];

    let totalElementsFixed = 0;

    selectors.forEach(selector => {
      try {
        const elements = container.querySelectorAll(selector);
        console.log(`🔍 选择器 "${selector}" 找到 ${elements.length} 个元素`);

        elements.forEach((element, index) => {
          const el = element as HTMLElement;
          const tagName = el.tagName.toLowerCase();
          const textContent = el.textContent?.trim().substring(0, 30) || '';

          // 应用所有必要的样式
          el.style.setProperty('transform', 'none', 'important');
          el.style.setProperty('animation', 'none', 'important');
          el.style.setProperty('transition', 'none', 'important');
          el.style.setProperty('-webkit-transform', 'none', 'important');
          el.style.setProperty('-webkit-animation', 'none', 'important');
          el.style.setProperty('-webkit-transition', 'none', 'important');
          el.style.setProperty('position', 'static', 'important');
          el.style.setProperty('display', '', 'important'); // 不覆盖display

          // 检查是否有computed样式仍然包含动画
          const computedStyle = window.getComputedStyle(el);
          const hasTransform = computedStyle.transform !== 'none' && computedStyle.transform !== 'matrix(1, 0, 0, 1, 0, 0)';
          const hasAnimation = computedStyle.animation !== 'none' && computedStyle.animationDuration !== '0s';

          if (hasTransform || hasAnimation) {
            console.warn(`⚠️ 元素仍有动画/变换: ${tagName} - ${textContent}`, {
              transform: computedStyle.transform,
              animation: computedStyle.animation,
              element: el
            });
          }

          // 特别关注可能包含"Select Camera"、"Stop Scanning"等文字的元素
          if (textContent.includes('Select') || textContent.includes('Camera') ||
              textContent.includes('Stop') || textContent.includes('Scanning')) {
            console.log(`✅ 修复关键元素: ${tagName} - "${textContent}"`, el);
          }

          totalElementsFixed++;
        });
      } catch (error) {
        console.error(`❌ 选择器 "${selector}" 执行失败:`, error);
      }
    });

    console.log(`✅ 测试页面样式修复完成，总共处理了 ${totalElementsFixed} 个元素`);
  };

  // 启动定时器持续修复样式
  const startStyleFixInterval = () => {
    // 立即执行一次
    fixCameraSelectorStyles();

    // 每500ms执行一次，持续修复样式
    styleIntervalRef.current = setInterval(() => {
      fixCameraSelectorStyles();
    }, 500);
  };

  // 停止样式修复定时器
  const stopStyleFixInterval = () => {
    if (styleIntervalRef.current) {
      clearInterval(styleIntervalRef.current);
      styleIntervalRef.current = null;
    }
  };

  const startScanner = () => {
    console.log('🚀 开始启动扫描器...');

    try {
      // 检查容器是否存在
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('❌ 容器不存在:', containerId);
        return;
      }

      console.log('✅ 容器存在，创建扫描器...');

      const scanner = new Html5QrcodeScanner(
        containerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [0], // 0 for camera
        },
        false
      );

      scanner.render(
        (decodedText) => {
          console.log('✅ 扫描成功:', decodedText);
          alert(`扫描成功: ${decodedText}`);
        },
        (error) => {
          if (error && !error.includes('No QR code found')) {
            console.warn('⚠️ 扫描错误:', error);
          }
        }
      );

      scannerRef.current = scanner;
      console.log('✅ 扫描器创建成功');

      // 启动样式修复定时器
      setTimeout(() => {
        startStyleFixInterval();
      }, 1000); // 延迟1秒启动，确保扫描器完全初始化

    } catch (error) {
      console.error('❌ 扫描器启动失败:', error);
    }
  };

  const stopScanner = () => {
    // 停止样式修复定时器
    stopStyleFixInterval();

    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        console.log('🛑 扫描器已停止');
      } catch (error) {
        console.warn('⚠️ 停止扫描器时出错:', error);
      }
      scannerRef.current = null;
    }
  };

  const handleRestart = () => {
    console.log('🔄 重启扫描器');
    stopScanner();
    setTimeout(() => {
      startScanner();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4">
          📱 摄像头扫码测试
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              这是一个最简单的扫码测试页面，用于验证摄像头功能是否正常
            </p>
          </div>

          {/* 扫描器容器 */}
          <div className="mb-4">
            <div
              id={containerId}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg"
              style={{ minHeight: '300px' }}
            />
          </div>

          {/* 控制按钮 */}
          <div className="flex space-x-2">
            <button
              onClick={handleRestart}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              🔄 重启扫描器
            </button>
            <button
              onClick={stopScanner}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              🛑 停止扫描
            </button>
          </div>

          {/* 调试信息 */}
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <p><strong>调试信息:</strong></p>
            <p>• 容器ID: {containerId}</p>
            <p>• 请打开浏览器控制台查看详细日志</p>
            <p>• 如果看不到扫描界面，点击重启按钮</p>
            <p>• 确保已授权摄像头权限</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <a
            href="/staff/scan"
            className="text-blue-500 underline text-sm"
          >
            ← 返回原扫码页面
          </a>
        </div>
      </div>
    </div>
  );
}