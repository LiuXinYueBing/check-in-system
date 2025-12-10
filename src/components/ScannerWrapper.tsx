'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// 动态导入扫码组件，禁用SSR
const ScannerComponentClient = dynamic(
  () => import('./ScannerComponentClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在加载扫码功能...</p>
        </div>
      </div>
    )
  }
);

interface ScannerWrapperProps {
  onScanSuccess: (uuid: string) => void;
  isActive: boolean;
}

export default function ScannerWrapper({ onScanSuccess, isActive }: ScannerWrapperProps) {
  return <ScannerComponentClient onScanSuccess={onScanSuccess} isActive={isActive} />;
}