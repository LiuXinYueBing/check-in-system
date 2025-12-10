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
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="text-3xl mb-4">🚨</div>
              <h2 className="text-lg font-semibold mb-2">扫码组件发生错误</h2>
              <p className="text-gray-600 mb-4">
                扫码功能遇到了意外错误，请尝试重新加载或重启浏览器
              </p>

              {/* 开发环境下显示详细错误信息 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4 text-left">
                  <summary className="text-sm text-red-600 cursor-pointer mb-2">
                    查看错误详情
                  </summary>
                  <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                    <p className="font-mono text-red-800">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-gray-700">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col space-y-2">
                <Button
                  onClick={this.handleReset}
                  className="w-full"
                >
                  🔄 重试
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
                如果问题持续存在，请联系技术支持
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}