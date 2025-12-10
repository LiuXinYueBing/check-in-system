'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ScannerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error: error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 你同样可以将错误日志上报给服务器
    console.error('🚨 ScannerErrorBoundary 捕获到错误:', error, errorInfo);

    // 检查是否是SSR相关错误
    const isSSRError = error.message.includes('window is not defined') ||
                      error.message.includes('navigator is not defined') ||
                      error.message.includes('document is not defined') ||
                      error.message.includes('localStorage is not defined');

    if (isSSRError) {
      console.warn('⚠️ 检测到SSR相关错误，这通常是正常的，因为扫码组件仅在客户端运行');
    }

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 这里可以添加错误上报逻辑
    // reportError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI 并渲染
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-64">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-4">
            <div className="text-center">
              <div className="text-3xl mb-4">🚨</div>
              <h2 className="text-lg font-semibold mb-2">扫码组件发生错误</h2>

              {/* 总是显示错误详情 */}
              {this.state.error && (
                <div className="mb-4 text-left">
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">错误信息:</h3>
                    <p className="font-mono text-sm text-red-700 break-all">
                      {this.state.error.toString()}
                    </p>

                    {/* 错误类型分析 */}
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-xs text-red-600">
                        错误类型: {this.state.error.name || 'Unknown'}
                      </p>
                      {this.state.error.message && (
                        <p className="text-xs text-red-600 mt-1">
                        详细信息: {this.state.error.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 组件堆栈信息 */}
              {this.state.errorInfo && (
                <details className="mb-4 text-left">
                  <summary className="text-sm text-blue-600 cursor-pointer mb-2">
                    📋 查看组件堆栈
                  </summary>
                  <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* 错误分析和建议 */}
              {this.state.error && (
                <div className="mb-4 text-left bg-blue-50 border border-blue-200 rounded p-3">
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">💡 可能的原因:</h3>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {this.state.error.toString().includes('window is not defined') && (
                      <li>• SSR环境冲突 - 正常情况，扫码组件仅在客户端运行</li>
                    )}
                    {this.state.error.toString().includes('navigator') && (
                      <li>• 浏览器API访问问题 - 请使用现代浏览器</li>
                    )}
                    {this.state.error.toString().includes('Camera') && (
                      <li>• 摄像头权限或设备问题 - 请检查摄像头设置</li>
                    )}
                    {this.state.error.toString().includes('html5-qrcode') && (
                      <li>• 扫码库加载问题 - 可能是网络或兼容性问题</li>
                    )}
                    {!this.state.error.toString().includes('window') &&
                     !this.state.error.toString().includes('navigator') &&
                     !this.state.error.toString().includes('Camera') &&
                     !this.state.error.toString().includes('html5-qrcode') && (
                      <li>• 组件渲染或逻辑错误 - 需要进一步调试</li>
                    )}
                  </ul>
                </div>
              )}

              <p className="text-gray-600 mb-4 text-sm">
                请尝试以下解决方案:
              </p>

              <div className="flex flex-col space-y-2">
                <Button
                  onClick={this.handleReset}
                  className="w-full"
                >
                  🔄 重试组件
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  🔄 刷新页面
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                如果问题持续存在，请截图此错误页面联系技术支持
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}