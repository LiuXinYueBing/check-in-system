'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Attendee, Event } from '@/types';
import { QrCode, User, Clock, CheckCircle, XCircle, Gift, MapPin, ChevronDown } from 'lucide-react';

export default function StaffScanPage() {
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventName, setSelectedEventName] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [eventStats, setEventStats] = useState({
    total: 0,
    registered: 0,
    checkedIn: 0,
    redeemed: 0,
    loading: true
  });
  const [globalNotification, setGlobalNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning';
    message: string;
  }>({
    show: false,
    type: 'error',
    message: ''
  });
  // 🔥 场次选择状态初始化和监听
  useEffect(() => {
    // 加载所有活动
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch events error:', error);
        showGlobalNotification('error', '无法获取活动列表');
        return;
      }

      setEvents(data || []);

      // 检查本地是否有缓存的活动
      const cachedEventId = localStorage.getItem('staff_selected_event_id');
      const cachedEventName = localStorage.getItem('staff_selected_event_name');

      if (cachedEventId && cachedEventName) {
        console.log('📋 找到缓存活动:', cachedEventName);
        setSelectedEventId(cachedEventId);
        setSelectedEventName(cachedEventName);
        setShowEventSelector(false);
        // 只有有缓存活动时才开始扫描
        setScanning(true);
        // 加载本场统计数据
        fetchEventStats(cachedEventId);
      } else {
        console.log('📋 未找到缓存活动，显示选择器');
        setShowEventSelector(true);
        setScanning(false);
      }
    } catch (err) {
      console.error('Fetch events error:', err);
      showGlobalNotification('error', '无法获取活动列表');
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleEventSelect = (eventId: string, eventName: string, location: string) => {
    console.log('🎯 选择活动:', eventName);
    setSelectedEventId(eventId);
    setSelectedEventName(eventName);
    setShowEventSelector(false);

    // 持久化到localStorage
    localStorage.setItem('staff_selected_event_id', eventId);
    localStorage.setItem('staff_selected_event_name', `${eventName} - ${location}`);

    // 选择活动后开始扫描
    setScanning(true);
    // 加载本场统计数据
    fetchEventStats(eventId);
  };

  const fetchEventStats = async (eventId: string) => {
    setEventStats(prev => ({ ...prev, loading: true }));
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;

      const stats = (data || []).reduce((acc, attendee) => {
        acc.total++;
        switch (attendee.status) {
          case 'registered':
            acc.registered++;
            break;
          case 'checked_in':
            acc.checkedIn++;
            break;
          case 'redeemed':
            acc.redeemed++;
            break;
        }
        return acc;
      }, { total: 0, registered: 0, checkedIn: 0, redeemed: 0 });

      setEventStats({ ...stats, loading: false });
    } catch (err: any) {
      console.error('Fetch event stats error:', err);
      setEventStats({ total: 0, registered: 0, checkedIn: 0, redeemed: 0, loading: false });
    }
  };

  const handleSwitchEvent = () => {
    console.log('🔄 切换活动，停止扫描');
    setScanning(false);
    setShowEventSelector(true);
    setEventStats({ total: 0, registered: 0, checkedIn: 0, redeemed: 0, loading: true });
  };

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerId = 'qr-scanner-container';
  const { toast } = useToast();

  // 全局通知函数
  const showGlobalNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setGlobalNotification({ show: true, type, message });
    setTimeout(() => {
      setGlobalNotification({ show: false, type: 'error', message: '' });
    }, 3000);
  };

  // 🔥 简化的摄像头权限检查
  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      // 检查浏览器是否支持getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('⚠️ 浏览器不支持 getUserMedia');
        return true; // 让扫描器自己处理错误
      }

      console.log('✅ 浏览器支持摄像头，让扫描器处理权限');
      return true; // 让 Html5QrcodeScanner 自己处理权限请求
    } catch (error: any) {
      console.warn('⚠️ 权限检查异常，让扫描器处理:', error);
      return true; // 让扫描器自己处理
    }
  };

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

  const startScanner = async () => {
    console.log('🔍 开始启动扫描器...');

    // 检查容器是否存在
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ 扫描器容器不存在:', containerId);
      return;
    }

    try {
      console.log('📹 检查摄像头权限...');
      // 🔥 首先检查摄像头权限
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        console.error('❌ 摄像头权限检查失败');
        return;
      }

      console.log('✅ 摄像头权限检查通过，初始化扫描器...');

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
          handleScanSuccess(decodedText);
        },
        (error) => {
          // 忽略扫描错误
          if (error && !error.includes('No QR code found')) {
            console.warn('⚠️ Scan error:', error);
          }
        }
      );

      scannerRef.current = scanner;
      console.log('✅ 扫描器初始化完成');
    } catch (error) {
      console.error('❌ Scanner start error:', error);
      showGlobalNotification('error', `扫描器启动失败：${error instanceof Error ? error.message : "请确保摄像头权限已开启"}`);
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

  // 🔍 核心校验逻辑：检查该用户的event_id是否等于员工当前选中的event_id
  const handleScanSuccess = async (uuid: string) => {
    setScanning(false);

    try {
      // 先查询用户信息
      const { data: scannedAttendee, error: fetchError } = await supabase
        .from('attendees')
        .select(`
          *,
          events (*)
        `)
        .eq('id', uuid)
        .single();

      if (fetchError) {
        console.error('Fetch attendee error:', fetchError);
        showGlobalNotification('error', '查询失败，无法查询用户信息');
        // 2秒后重新开始扫描
        setTimeout(() => setScanning(true), 2000);
        return;
      }

      // 🔴 验证：不匹配 -> 场次错误
      if (scannedAttendee.event_id !== selectedEventId) {
        showGlobalNotification('warning', '⚠️ 场次错误！该用户属于其他活动，请核实！');
        // 2秒后重新开始扫描
        setTimeout(() => setScanning(true), 2000);
        return;
      }

      // 🟢 验证：匹配 -> 显示用户信息和操作按钮
      setAttendee(scannedAttendee);
      // 刷新本场统计数据
      fetchEventStats(selectedEventId);

    } catch (err: any) {
      console.error('Scan fetch error:', err);
      showGlobalNotification('error', '查询失败，无法查询用户信息');
      // 2秒后重新开始扫描
      setTimeout(() => setScanning(true), 2000);
    }
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
      showGlobalNotification('error', '用户不存在，该二维码无效，请重新扫描');
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

      showGlobalNotification('success', `${attendee.name} 已成功入场`);

      // 刷新数据
      await fetchAttendee(attendee.id);
      // 刷新本场统计数据
      fetchEventStats(selectedEventId);
    } catch (err: any) {
      console.error('Check-in error:', err);
      showGlobalNotification('error', '操作失败，请稍后重试');
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

      showGlobalNotification('success', `${attendee.name} 已完成核销`);

      // 刷新数据
      await fetchAttendee(attendee.id);
      // 刷新本场统计数据
      fetchEventStats(selectedEventId);
    } catch (err: any) {
      console.error('Redeem error:', err);
      showGlobalNotification('error', '操作失败，请稍后重试');
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
    console.log('🔄 重置扫描器');
    setAttendee(null);
    setScanning(true);
  };

  const manualStartScanner = async () => {
    console.log('🔧 手动启动扫描器');
    stopScanner(); // 先停止现有扫描器
    await new Promise(resolve => setTimeout(resolve, 500)); // 等待 500ms
    setScanning(true); // 重新开始扫描
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">员工工作台</h1>
          <p className="text-gray-600">选择当前活动场次，扫码核验用户凭证</p>
        </div>

        {/* 🔥 场次选择弹窗 */}
        {showEventSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">选择活动场次</h3>
              <p className="text-sm text-gray-600 mb-4">请选择您要执行签到/核销的活动</p>

              {loadingEvents ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-gray-600">正在加载活动列表...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">暂无活动</p>
                  ) : (
                    events.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventSelect(event.id, event.name, event.location || '未指定地点')}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="font-medium text-gray-900">{event.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.location}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSwitchEvent}
                  variant="outline"
                  className="mt-4"
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 当前选中的活动 */}
        {selectedEventId && !showEventSelector && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-900">
                当前活动：{selectedEventName}
              </h3>
              <Button
                onClick={handleSwitchEvent}
                variant="outline"
                size="sm"
              >
                <ChevronDown className="w-4 h-4 mr-1" />
                切换活动
              </Button>
            </div>
          </div>
        )}

        {/* 🔍 功能B: 本场数据统计 */}
        {selectedEventId && !showEventSelector && (
          <div className="bg-white border rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">本场数据</h3>
            {eventStats.loading ? (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-sm text-gray-600">正在加载本场数据...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{eventStats.total}</div>
                  <div className="text-xs text-blue-600">总报名</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-900">{eventStats.registered}</div>
                  <div className="text-xs text-yellow-600">待入场</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{eventStats.checkedIn}</div>
                  <div className="text-xs text-green-600">已入场</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-900">{eventStats.redeemed}</div>
                  <div className="text-xs text-orange-600">已核销</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 扫描区域 */}
        {!attendee && !showEventSelector && (
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
                <div className="flex flex-col items-center space-y-4">
                  <div id={containerId} className="w-full max-w-sm" />
                  <Button
                    onClick={manualStartScanner}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    🔧 重启扫描器
                  </Button>
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

        {/* 如果没有选择活动，显示提示 */}
        {!attendee && showEventSelector === false && scanning === false && (
          <Card className="shadow-xl border-0">
            <CardContent className="text-center py-8">
              <p className="text-gray-600 mb-4">请先选择活动场次</p>
              <Button onClick={() => setShowEventSelector(true)}>
                选择活动
              </Button>
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

        {/* 底部导航 - 员工端不显示导航按钮 */}

      {/* 全局通知弹窗 */}
      {globalNotification.show && (
        <div className={`global-notification ${globalNotification.type}`}>
          <div className="global-notification-content">
            <div className="text-lg font-medium mb-2">
              {globalNotification.type === 'success' && '✅'}
              {globalNotification.type === 'error' && '❌'}
              {globalNotification.type === 'warning' && '⚠️'}
              {' '}
              {globalNotification.type === 'success' && '成功'}
              {globalNotification.type === 'error' && '错误'}
              {globalNotification.type === 'warning' && '警告'}
            </div>
            <div className="text-gray-700">
              {globalNotification.message}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}