'use client';

import { Button } from '@/components/ui/button';
import { Home, QrCode, BarChart3, Users } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isActive = (path: string) => pathname === path;

  const handleNavigate = (path: string) => {
    // 保持当前的URL参数
    const currentParams = searchParams.toString();

    const newUrl = path + (currentParams ? `?${currentParams}` : '');
    router.push(newUrl);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="max-w-4xl mx-auto flex justify-around">
        <Button
          variant={isActive('/') ? 'default' : 'ghost'}
          onClick={() => handleNavigate('/')}
          className="flex flex-col items-center py-2 px-3 h-auto"
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-xs">注册</span>
        </Button>

        <Button
          variant={isActive('/staff/scan') ? 'default' : 'ghost'}
          onClick={() => handleNavigate('/staff/scan')}
          className="flex flex-col items-center py-2 px-3 h-auto"
        >
          <QrCode className="w-5 h-5 mb-1" />
          <span className="text-xs">扫码</span>
        </Button>

        <Button
          variant={isActive('/admin/dashboard') ? 'default' : 'ghost'}
          onClick={() => handleNavigate('/admin/dashboard')}
          className="flex flex-col items-center py-2 px-3 h-auto"
        >
          <BarChart3 className="w-5 h-5 mb-1" />
          <span className="text-xs">看板</span>
        </Button>
      </div>
    </div>
  );
}