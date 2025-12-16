import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.checkin.scan',
  appName: '扫码签到',
  webDir: 'out-app',
  server: {
    // 在 App 中默认加载扫码页面
    url: '/staff/scan'
  }
};

export default config;
