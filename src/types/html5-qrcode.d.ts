// html5-qrcode 库类型声明
// 为第三方库添加类型定义

declare module 'html5-qrcode' {
  export interface Html5QrcodeScannerConfig {
    fps?: number;
    qrbox?: number | { width: number; height: number };
    aspectRatio?: number;
    disableFlip?: boolean;
    supportedScanTypes?: number[];
    rememberLastUsedCamera?: boolean;
    facingMode?: 'environment' | 'user';
  }

  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config?: Html5QrcodeScannerConfig,
      verbose?: boolean
    );

    render(
      onScanSuccess: (decodedText: string, result: any) => void,
      onScanFailure?: (error: string | any) => void
    ): void;

    clear(): Promise<void>;

    pause(): Promise<void>;

    resume(): Promise<void>;

    destroy(): void;
  }

  export class Html5Qrcode {
    constructor(
      elementId: string,
      verbose?: boolean
    );

    start(
      cameraId: string,
      config: Html5QrcodeScannerConfig,
      onScanSuccess: (decodedText: string, result: any) => void,
      onScanFailure?: (error: string | any) => void
    ): Promise<void>;

    stop(): Promise<void>;

    clear(): Promise<void>;

    scanFile(
      imageFile: File,
      onSuccess: (decodedText: string) => void,
      onError?: (errorMessage: string) => void
    ): Promise<void>;

    getRunningTrackCapabilities(): Promise<MediaTrackCapabilities>;

    getRunningTrackSettings(): Promise<MediaTrackSettings>;

    static getCameras(): Promise<Array<{
      id: string;
      label: string;
      kind: string;
    }>>;
  }

  export enum Html5QrcodeScanType {
    SCAN_TYPE_CAMERA = 0,
    SCAN_TYPE_FILE = 1
  }

  export interface CameraDevice {
    id: string;
    label: string;
    kind: string;
  }
}

// 扩展 Window 接口以包含 html5-qrcode 的全局对象（如果存在）
declare global {
  interface Window {
    Html5QrcodeScanner?: typeof import('html5-qrcode').Html5QrcodeScanner;
    Html5Qrcode?: typeof import('html5-qrcode').Html5Qrcode;
  }
}