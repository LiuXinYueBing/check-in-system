'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Attendee } from '@/types';
import { QrCode, User, Clock, CheckCircle, XCircle, Gift } from 'lucide-react';

export default function StaffScanPage() {
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerId = 'qr-scanner-container';
  const { toast } = useToast();

  useEffect(() => {
    if (scanning) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [scanning]);

  const startScanner = () => {
    try {
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
          handleScanSuccess(decodedText);
        },
        (error) => {
          // 忽略扫描错误
          console.warn('Scan error:', error);
        }
      );

      scannerRef.current = scanner;
    } catch (error) {
      console.error('Scanner start error:', error);
      toast({
        title: "扫描器启动失败",
        description: "请确保摄像头权限已开启",
        variant: "destructive",
      });
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (error) {
        console.warn('Scanner stop error:', error);
      }
      scannerRef.current = null;
    }
  };

  const handleScanSuccess = async (uuid: string) => {
    setScanning(false);
    await fetchAttendee(uuid);
  };

  const fetchAttendee = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select(`
          *,
          event:events (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setAttendee(data);
    } catch (err: any) {
      console.error('Fetch attendee error:', err);
      toast({
        title: "用户不存在",
        description: "该二维码无效，请重新扫描",
        variant: "destructive",
      });
      setTimeout(() => setScanning(true), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!attendee) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('attendees')
        .update({
          status: 'checked_in',
          check_in_time: new Date().toISOString()
        })
        .eq('id', attendee.id);

      if (error) throw error;

      toast({
        title: "入场成功",
        description: `${attendee.name} 已成功入场`,
        variant: "success",
      });

      // 刷新数据
      await fetchAttendee(attendee.id);
    } catch (err: any) {
      console.error('Check-in error:', err);
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!attendee) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('attendees')
        .update({
          status: 'redeemed',
          redeem_time: new Date().toISOString()
        })
        .eq('id', attendee.id);

      if (error) throw error;

      toast({
        title: "核销成功",
        description: `${attendee.name} 已完成核销`,
        variant: "success",
      });

      // 刷新数据
      await fetchAttendee(attendee.id);
    } catch (err: any) {
      console.error('Redeem error:', err);
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'registered':
        return {
          text: '待入场',
          color: 'registered',
          icon: Clock,
          description: '请确认用户入场',
          action: 'confirmCheckIn',
          actionText: '确认入场',
          actionColor: 'bg-green-600 hover:bg-green-700',
        };
      case 'checked_in':
        return {
          text: '已入场',
          color: 'checkedIn',
          icon: CheckCircle,
          description: '可以核销抵用券',
          action: 'redeem',
          actionText: '核销抵用券',
          actionColor: 'bg-orange-600 hover:bg-orange-700',
        };
      case 'redeemed':
        return {
          text: '已核销',
          color: 'redeemed',
          icon: XCircle,
          description: '该用户已完成核销',
          action: null,
          actionText: '',
          actionColor: '',
        };
      default:
        return {
          text: '未知状态',
          color: 'default',
          icon: Clock,
          description: '请联系工作人员',
          action: null,
          actionText: '',
          actionColor: '',
        };
    }
  };

  const resetScanner = () => {
    setAttendee(null);
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">扫码核销</h1>
          <p className="text-gray-600">扫描用户二维码进行签到或核销</p>
        </div>

        {/* 扫描区域 */}
        {!attendee && (
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-center">
                {scanning ? '请扫描二维码' : '扫描完成'}
              </CardTitle>
              <CardDescription className="text-center">
                {scanning
                  ? '将用户二维码对准扫描框'
                  : '扫描成功，正在获取用户信息'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scanning ? (
                <div className="flex justify-center">
                  <div id={containerId} className="w-full max-w-sm" />
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">正在处理...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 用户信息区域 */}
        {attendee && (
          <div className="space-y-4">
            {/* 用户信息卡片 */}
            <Card className="shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{attendee.name}</CardTitle>
                      <CardDescription className="text-base">{attendee.phone}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={getStatusInfo(attendee.status).color as any}>
                    {getStatusInfo(attendee.status).text}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* 状态信息 */}
                <div className="space-y-3">
                  {(() => {
                    const statusInfo = getStatusInfo(attendee.status);
                    return (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {statusInfo.icon && (
                          <statusInfo.icon className="w-5 h-5 text-gray-600" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {statusInfo.description}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 时间信息 */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-600 text-xs mb-1">报名时间</p>
                      <p className="font-medium text-blue-900">
                        {new Date(attendee.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    {attendee.check_in_time && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-green-600 text-xs mb-1">入场时间</p>
                        <p className="font-medium text-green-900">
                          {new Date(attendee.check_in_time).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="space-y-3">
                  {getStatusInfo(attendee.status).action === 'confirmCheckIn' && (
                    <Button
                      onClick={handleCheckIn}
                      disabled={loading}
                      className={`w-full h-14 text-base font-medium shadow-lg ${getStatusInfo(attendee.status).actionColor}`}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {loading ? '处理中...' : '确认入场 (Check In)'}
                    </Button>
                  )}

                  {getStatusInfo(attendee.status).action === 'redeem' && (
                    <Button
                      onClick={handleRedeem}
                      disabled={loading}
                      className={`w-full h-14 text-base font-medium shadow-lg ${getStatusInfo(attendee.status).actionColor}`}
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      {loading ? '处理中...' : '核销抵用券 (Redeem Voucher)'}
                    </Button>
                  )}

                  <Button
                    onClick={resetScanner}
                    variant="outline"
                    className="w-full h-12"
                  >
                    继续扫描
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 底部导航 */}
        <div className="flex space-x-3">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="flex-1"
          >
            返回首页
          </Button>
          <Button
            onClick={() => window.location.href = '/admin/dashboard'}
            className="flex-1"
          >
            数据看板
          </Button>
        </div>
      </div>
    </div>
  );
}