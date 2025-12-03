'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Attendee, AttendeeStatus } from '@/types';
import { Users, UserCheck, Gift, TrendingUp, Calendar, Clock } from 'lucide-react';

export default function AdminDashboardPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    redeemed: 0,
    registered: 0
  });

  useEffect(() => {
    fetchAttendees();
  }, []);

  useEffect(() => {
    filterAttendees();
  }, [attendees, statusFilter]);

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select(`
          *,
          event:events (*)
        `)
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

    if (statusFilter !== 'all') {
      filtered = filtered.filter(attendee => attendee.status === statusFilter);
    }

    setFilteredAttendees(filtered);
  };

  useEffect(() => {
    const newStats = attendees.reduce((acc, attendee) => {
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
  }, [attendees]);

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
                    <TableHead>报名时间</TableHead>
                    <TableHead>入场时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {statusFilter === 'all' ? '暂无数据' : '该状态下暂无数据'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttendees.map((attendee) => (
                      <TableRow key={attendee.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{attendee.name}</TableCell>
                        <TableCell>{attendee.phone}</TableCell>
                        <TableCell>{getStatusBadge(attendee.status)}</TableCell>
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