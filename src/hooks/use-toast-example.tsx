'use client';

import React from 'react';
import { useToast } from './use-toast';
import { Button } from '@/components/ui/button';

// Toast 使用示例组件
export const ToastExample: React.FC = () => {
  const { addToast } = useToast();

  const showSuccess = () => {
    addToast({
      type: 'success',
      title: '操作成功',
      message: '数据已成功保存到数据库',
    });
  };

  const showError = () => {
    addToast({
      type: 'error',
      title: '操作失败',
      message: '网络连接异常，请检查您的网络设置',
      duration: 5000, // 显示5秒
    });
  };

  const showWarning = () => {
    addToast({
      type: 'warning',
      title: '注意',
      message: '您即将离开当前页面，未保存的更改将会丢失',
    });
  };

  const showInfo = () => {
    addToast({
      type: 'info',
      title: '提示',
      message: '新版本已经发布，建议您更新到最新版本',
    });
  };

  const showCustom = () => {
    addToast({
      type: 'success',
      message: '这是一个没有标题的通知',
      duration: 2000,
    });
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold mb-4">Toast 通知示例</h2>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <Button onClick={showSuccess} variant="default">
          成功通知
        </Button>

        <Button onClick={showError} variant="destructive">
          错误通知
        </Button>

        <Button onClick={showWarning} variant="outline">
          警告通知
        </Button>

        <Button onClick={showInfo} variant="outline">
          信息通知
        </Button>

        <Button onClick={showCustom} variant="secondary" className="col-span-2">
          自定义通知（无标题）
        </Button>
      </div>

      <div className="text-sm text-gray-600 mt-4">
        <p>• 通知会自动在3秒后消失（可自定义duration）</p>
        <p>• 可以点击关闭按钮手动关闭</p>
        <p>• 支持四种类型：success、error、warning、info</p>
        <p>• 显示在页面右上角，有滑入滑出动画</p>
      </div>
    </div>
  );
};

// 在组件中使用 Toast 的完整示例
export const ExampleComponent: React.FC = () => {
  const { addToast, clearAllToasts } = useToast();

  const handleSaveData = async () => {
    try {
      // 模拟保存操作
      addToast({
        type: 'info',
        message: '正在保存数据...',
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      addToast({
        type: 'success',
        title: '保存成功',
        message: '您的数据已成功保存',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: '保存失败',
        message: '保存数据时发生错误，请重试',
      });
    }
  };

  return (
    <div className="p-6">
      <Button onClick={handleSaveData}>
        保存数据
      </Button>
      <Button
        onClick={clearAllToasts}
        variant="outline"
        className="ml-2"
      >
        清除所有通知
      </Button>
    </div>
  );
};