'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Attendee, Event } from '@/types';
import { QrCode, User, Clock, CheckCircle, XCircle, Gift, MapPin, ChevronDown, Settings } from 'lucide-react';
import ScannerWrapper from '@/components/ScannerWrapper';
import { ScannerErrorBoundary } from '@/components/ScannerErrorBoundary';

export default function StaffScanPage() {
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
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

  // 自动继续扫描设置
  const [autoContinueScan, setAutoContinueScan] = useState(true);
  const [waitTime, setWaitTime] = useState(2);
  const [showSettings, setShowSettings] = useState(false);

  // 加载设置
  useEffect(() => {
    const savedAutoContinue = localStorage.getItem('staff_auto_continue_scan');
    const savedWaitTime = localStorage.getItem('staff_wait_time');

    if (savedAutoContinue !== null) {
      setAutoContinueScan(savedAutoContinue === 'true');
    }

    if (savedWaitTime !== null) {
      setWaitTime(parseInt(savedWaitTime, 10));
    }
  }, []);

  // 保存设置
  useEffect(() => {
    localStorage.setItem('staff_auto_continue_scan', autoContinueScan.toString());
  }, [autoContinueScan]);

  useEffect(() => {
    localStorage.setItem('staff_wait_time', waitTime.toString());
  }, [waitTime]);

  // 加载所有活动
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      console.log('🔄 开始获取活动列表...');
      setLoadingEvents(true);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Fetch events error:', error);
        showGlobalNotification('error', `无法获取活动列表: ${error.message}`);
        return;
      }

      console.log('✅ 成功获取活动列表，数量:', data?.length || 0);
      setEvents(data || []);

      // 检查本地是否有缓存的活动
      const cachedEventId = localStorage.getItem('staff_selected_event_id');
      const cachedEventName = localStorage.getItem('staff_selected_event_name');

      if (cachedEventId && cachedEventName) {
        console.log('📋 找到缓存活动:', cachedEventName);
        setSelectedEventId(cachedEventId);
        setSelectedEventName(cachedEventName);
        setShowEventSelector(false);
        setScanning(true);
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

    localStorage.setItem('staff_selected_event_id', eventId);
    localStorage.setItem('staff_selected_event_name', `${eventName} - ${location}`);

    setScanning(true);
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

  // 全局通知函数
  const showGlobalNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setGlobalNotification({ show: true, type, message });
    setTimeout(() => {
      setGlobalNotification({ show: false, type: 'error', message: '' });
    }, 3000);
  };

  // 处理扫描成功
  const handleScanSuccess = async (uuid: string) => {
    setScanning(false);

    try {
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
        setTimeout(() => {
          setScanning(true);
        }, 2000);
        return;
      }

      if (scannedAttendee.event_id !== selectedEventId) {
        showGlobalNotification('warning', '⚠️ 场次错误！该用户属于其他活动，请核实！');
        setTimeout(() => {
          setScanning(true);
        }, 2000);
        return;
      }

      setAttendee(scannedAttendee);
      fetchEventStats(selectedEventId);

    } catch (err: any) {
      console.error('Scan fetch error:', err);
      showGlobalNotification('error', '查询失败，无法查询用户信息');
      setTimeout(() => {
        setScanning(true);
      }, 2000);
    }
  };

  // 恢复扫描
  const resumeScanning = () => {
    console.log('🔄 恢复扫描状态');
    setAttendee(null);
    setScanning(true);
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

      const { data } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', attendee.id)
        .single();

      if (data) {
        setAttendee(data);
      }

      fetchEventStats(selectedEventId);

      // 自动继续扫描
      if (autoContinueScan) {
        setTimeout(() => {
          resumeScanning();
        }, waitTime * 1000);
      }
    } catch (err: any) {
      console.error('Check-in error:', err);
      showGlobalNotification('error', '操作失败，请稍后重试');

      setTimeout(() => {
        resumeScanning();
      }, 5000);
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

      const { data } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', attendee.id)
        .single();

      if (data) {
        setAttendee(data);
      }

      fetchEventStats(selectedEventId);

      // 自动继续扫描
      if (autoContinueScan) {
        setTimeout(() => {
          resumeScanning();
        }, waitTime * 1000);
      }
    } catch (err: any) {
      console.error('Redeem error:', err);
      showGlobalNotification('error', '操作失败，请稍后重试');

      setTimeout(() => {
        resumeScanning();
      }, 5000);
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

        {/* 场次选择弹窗 */}
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

        {/* 自动继续扫描设置 */}
        {selectedEventId && !showEventSelector && (
          <div className="bg-gray-50 border rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">自动继续扫描设置</h3>
              </div>
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                {showSettings ? '收起' : '展开'}
              </Button>
            </div>

            <div className={`space-y-3 ${showSettings ? 'block' : 'hidden'}`}>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">扫码后自动继续</label>
                <button
                  onClick={() => setAutoContinueScan(!autoContinueScan)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoContinueScan ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoContinueScan ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {autoContinueScan && (
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">等待时间</label>
                  <select
                    value={waitTime}
                    onChange={(e) => setWaitTime(parseInt(e.target.value, 10))}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1秒</option>
                    <option value={2}>2秒</option>
                    <option value={3}>3秒</option>
                    <option value={5}>5秒</option>
                  </select>
                </div>
              )}

              <div className="text-xs text-gray-500 bg-white rounded p-2">
                💡 {autoContinueScan
                  ? `操作完成后将等待${waitTime}秒自动继续扫描`
                  : '操作完成后需要手动点击"继续扫描"按钮'
                }
              </div>
            </div>
          </div>
        )}

        {/* 本场数据统计 */}
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
        {!attendee && !showEventSelector && scanning && (
          <ScannerErrorBoundary>
            <ScannerWrapper
              onScanSuccess={handleScanSuccess}
              isActive={scanning}
            />
          </ScannerErrorBoundary>
        )}

        {/* 如果没有选择活动，显示提示 */}
        {!attendee && !showEventSelector && !scanning && (
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
                    onClick={resumeScanning}
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