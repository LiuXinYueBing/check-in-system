'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Attendee, AttendeeStatus, Event } from '@/types';
import { Users, UserCheck, Gift, TrendingUp, Calendar, Clock, QrCode, X, Plus, Settings, Trash2, Copy } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function AdminDashboardPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showEventQRDialog, setShowEventQRDialog] = useState(false);
  const [selectedEventForQR, setSelectedEventForQR] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    location: '',
    date: ''
  });
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    redeemed: 0,
    registered: 0
  });

  useEffect(() => {
    fetchEvents();
    fetchAttendees();
  }, []);

  useEffect(() => {
    // 当 eventFilter 变化时，同步更新 selectedEvent
    if (eventFilter !== 'all' && events.length > 0) {
      const selected = events.find(e => e.id === eventFilter);
      setSelectedEvent(selected || null);
    } else if (eventFilter === 'all') {
      setSelectedEvent(events.length > 0 ? events[0] : null);
    }

    filterAttendees();
  }, [attendees, statusFilter, eventFilter, events]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, date, location, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);

      // 如果没有选择活动，默认选择第一个
      if (data && data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
        setEventFilter(data[0].id);
      }
    } catch (err: any) {
      console.error('Fetch events error:', err);
    }
  };

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttendees(data || []);
    } catch (err: any) {
      console.error('Fetch attendees error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAttendees = () => {
    let filtered = [...attendees];

    // 按状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(attendee => attendee.status === statusFilter);
    }

    // 按活动过滤 - 修复逻辑
    if (eventFilter !== 'all') {
      filtered = filtered.filter(attendee => attendee.event_id === eventFilter);
    }

    setFilteredAttendees(filtered);
  };

  useEffect(() => {
    const newStats = filteredAttendees.reduce((acc, attendee) => {
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
    }, { total: 0, checkedIn: 0, redeemed: 0, registered: 0 });

    setStats(newStats);
  }, [filteredAttendees]);

  const getStatusBadge = (status: AttendeeStatus) => {
    const variants = {
      registered: 'registered',
      checked_in: 'checkedIn',
      redeemed: 'redeemed'
    } as const;

    const labels = {
      registered: '待入场',
      checked_in: '已入场',
      redeemed: '已核销'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
  };

  // 生成应急报名链接
  const generateEmergencyLink = () => {
    if (!selectedEvent) return '';

    const baseUrl = window.location.origin;
    return `${baseUrl}?event_id=${selectedEvent.id}`;
  };

  // 创建新活动
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEvent.name.trim()) {
      alert('请填写活动名称');
      return;
    }

    setLoadingCreate(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          name: newEvent.name.trim(),
          location: newEvent.location.trim(),
          date: newEvent.date.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // 刷新活动列表
      await fetchEvents();

      // 清空表单
      setNewEvent({ name: '', location: '', date: '' });

      // 显示新活动的二维码
      setSelectedEventForQR(data);
      setShowManageDialog(false);
      setShowEventQRDialog(true);

    } catch (err: any) {
      console.error('Create event error:', err);
      alert('创建活动失败，请重试');
    } finally {
      setLoadingCreate(false);
    }
  };

  // 删除活动
  const handleDeleteEvent = async (event: Event) => {
    if (!confirm(`确认删除活动"${event.name}"？\n\n删除活动将同时删除该活动下所有的报名数据，此操作不可恢复！`)) {
      return;
    }

    setLoadingDelete(event.id);
    try {
      // 先删除该活动的所有报名数据
      const { error: deleteAttendeesError } = await supabase
        .from('attendees')
        .delete()
        .eq('event_id', event.id);

      if (deleteAttendeesError) throw deleteAttendeesError;

      // 再删除活动
      const { error: deleteEventError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (deleteEventError) throw deleteEventError;

      // 刷新活动列表和参与者列表
      await fetchEvents();
      await fetchAttendees();

      alert('活动删除成功');

    } catch (err: any) {
      console.error('Delete event error:', err);
      alert('删除活动失败，请重试');
    } finally {
      setLoadingDelete('');
    }
  };

  // 显示活动二维码
  const handleShowEventQR = (event: Event) => {
    setSelectedEventForQR(event);
    setShowManageDialog(false);
    setShowEventQRDialog(true);
  };

  // 生成活动报名链接
  const generateEventLink = (event: Event) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?event_id=${event.id}`;
  };

  // 复制链接到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('链接已复制到剪贴板');
    }).catch(() => {
      alert('复制失败，请手动复制');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 头部 */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">数据看板</h1>
          <p className="text-gray-600">活动签到与核销数据统计</p>
        </div>

        {/* 活动选择器 */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex-1">
                <CardTitle className="text-lg">活动筛选</CardTitle>
                <CardDescription>
                  {eventFilter === 'all'
                    ? '显示所有活动的数据'
                    : selectedEvent
                      ? `当前显示：${selectedEvent.name} (${selectedEvent.location})`
                      : '选择一个活动查看数据'
                  }
                </CardDescription>
              </div>
              <div className="flex items-center space-x-3">
                {/* 活动选择下拉 */}
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="选择活动" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部活动</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} - {event.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 活动管理按钮 */}
                <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      活动管理
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-center">活动管理</DialogTitle>
                      <DialogDescription className="text-center">
                        创建新活动或管理现有活动
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* 创建新活动表单 */}
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Plus className="w-5 h-5 mr-2" />
                          创建新活动
                        </h3>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              活动名称 <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={newEvent.name}
                              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                              placeholder="请输入活动名称"
                              disabled={loadingCreate}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              活动地点
                            </label>
                            <Input
                              value={newEvent.location}
                              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                              placeholder="请输入活动地点"
                              disabled={loadingCreate}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              活动日期
                            </label>
                            <Input
                              type="date"
                              value={newEvent.date}
                              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                              disabled={loadingCreate}
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={loadingCreate}
                          >
                            {loadingCreate ? '创建中...' : '创建活动'}
                          </Button>
                        </form>
                      </div>

                      {/* 现有活动列表 */}
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          现有活动
                        </h3>
                        {events.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">暂无活动</p>
                        ) : (
                          <div className="space-y-3">
                            {events.map((event) => (
                              <div key={event.id} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{event.name}</h4>
                                    <p className="text-sm text-gray-500">
                                      {event.location && <span>📍 {event.location}</span>}
                                      {event.date && <span className="ml-2">📅 {event.date}</span>}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleShowEventQR(event)}
                                    >
                                      <QrCode className="w-4 h-4 mr-1" />
                                      链接
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteEvent(event)}
                                      disabled={loadingDelete === event.id}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      {loadingDelete === event.id ? '删除中...' : '删除'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* 应急二维码按钮 */}
                {selectedEvent && (
                  <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <QrCode className="w-4 h-4 mr-2" />
                        应急二维码
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-center">应急报名二维码</DialogTitle>
                        <DialogDescription className="text-center">
                          用户扫描此二维码可直接进入当前活动的报名页面
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center space-y-4 p-4">
                        <div className="text-center space-y-2">
                          <p className="font-semibold text-gray-900">{selectedEvent.name}</p>
                          <p className="text-sm text-gray-600 flex items-center justify-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {selectedEvent.location}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-inner">
                          <QRCode
                            value={generateEmergencyLink()}
                            size={200}
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          {generateEmergencyLink()}
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-xl border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总报名数</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <p className="text-xs text-blue-600 mt-1">活动总报名人数</p>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待入场</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{stats.registered}</div>
              <p className="text-xs text-yellow-600 mt-1">已报名待入场</p>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已入场</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.checkedIn}</div>
              <p className="text-xs text-green-600 mt-1">已完成签到入场</p>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已核销</CardTitle>
              <Gift className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.redeemed}</div>
              <p className="text-xs text-orange-600 mt-1">已核销抵用券</p>
            </CardContent>
          </Card>
        </div>

        {/* 数据表格 */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-lg">参会人员列表</CardTitle>
                <CardDescription>
                  共 {filteredAttendees.length} 条记录
                  {eventFilter !== 'all' && selectedEvent && (
                    <span className="ml-2 text-blue-600">
                      (活动：{selectedEvent.name})
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">筛选状态：</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="registered">待入场</SelectItem>
                    <SelectItem value="checked_in">已入场</SelectItem>
                    <SelectItem value="redeemed">已核销</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>手机号</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>活动</TableHead>
                    <TableHead>报名时间</TableHead>
                    <TableHead>入场时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {statusFilter === 'all' && eventFilter === 'all' ? '暂无数据' : '该筛选条件下暂无数据'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttendees.map((attendee) => (
                      <TableRow key={attendee.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{attendee.name}</TableCell>
                        <TableCell>{attendee.phone}</TableCell>
                        <TableCell>{getStatusBadge(attendee.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {attendee.event?.name || '未知活动'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {attendee.event?.location || ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{formatDate(attendee.created_at)}</div>
                            <div className="text-xs text-gray-500">{formatTime(attendee.created_at)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {attendee.check_in_time ? (
                            <div className="space-y-1">
                              <div className="text-sm">{formatDate(attendee.check_in_time)}</div>
                              <div className="text-xs text-gray-500">{formatTime(attendee.check_in_time)}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 活动二维码弹窗 */}
        {selectedEventForQR && (
          <Dialog open={showEventQRDialog} onOpenChange={setShowEventQRDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">活动报名二维码</DialogTitle>
                <DialogDescription className="text-center">
                  用户扫描此二维码可直接进入活动报名页面
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4 p-4">
                <div className="text-center space-y-2">
                  <p className="font-semibold text-gray-900">{selectedEventForQR.name}</p>
                  <p className="text-sm text-gray-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {selectedEventForQR.location || '未指定地点'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-inner">
                  <QRCode
                    value={generateEventLink(selectedEventForQR)}
                    size={200}
                  />
                </div>
                <div className="space-y-2 w-full">
                  <p className="text-xs text-gray-500 text-center">
                    报名链接：
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={generateEventLink(selectedEventForQR)}
                      className="flex-1 text-xs p-2 border rounded bg-gray-50"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateEventLink(selectedEventForQR))}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* 底部导航 */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="flex-1"
          >
            返回首页
          </Button>
          <Button
            onClick={() => window.location.href = '/staff/scan'}
            className="flex-1"
          >
            开始扫码
          </Button>
        </div>
      </div>
    </div>
  );
}