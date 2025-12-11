'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Attendee } from '@/types';
import { EMPTY_UUID, ATTENDEE_STATUS } from '@/lib/constants';

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendee();
  }, [params.id]);

  const fetchAttendee = async () => {
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select(`
          *,
          event:events (*)
        `)
        .eq('id', params.id)
        .single();

      if (error) {
        throw error;
      }

      setAttendee(data);
    } catch (err: unknown) {
      logger.error('Error fetching attendee:', err);
      setError('无法获取凭证信息，请联系工作人员');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case ATTENDEE_STATUS.REGISTERED:
        return {
          text: '待入场',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: '请在活动入口处扫描二维码签到'
        };
      case ATTENDEE_STATUS.CHECKED_IN:
        return {
          text: '已入场',
          color: 'bg-green-100 text-green-800 border-green-200',
          description: '您已入场，请在礼品区核销二维码'
        };
      case ATTENDEE_STATUS.REDEEMED:
        return {
          text: '已核销',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: '感谢您的参与！'
        };
      default:
        return {
          text: '未知状态',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: '请联系工作人员'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !attendee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">凭证不存在</h2>
                <p className="text-gray-600 text-sm">{error || '请检查凭证链接是否正确'}</p>
              </div>
              <Button
                onClick={() => {
                  if (attendee?.event_id && attendee.event_id !== EMPTY_UUID) {
                    router.push(`/?event_id=${attendee.event_id}`);
                  } else {
                    router.push('/');
                  }
                }}
                className="w-full"
              >
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(attendee.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* 顶部信息 */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">电子凭证</h1>
          <p className="text-gray-600">{attendee.event?.name || '活动凭证'}</p>
        </div>

        {/* 主要凭证卡片 */}
        <Card className="shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-indigo-50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{attendee.name}</CardTitle>
                <CardDescription className="text-base mt-1">{attendee.phone}</CardDescription>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                {statusInfo.text}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 活动信息 */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 text-sm">活动信息</h3>
              {attendee.event && (
                <div className="space-y-1 text-sm text-gray-600">
                  <p>日期: {formatDate(attendee.event.date)}</p>
                  {attendee.event.location && (
                    <p>地点: {attendee.event.location}</p>
                  )}
                </div>
              )}
            </div>

            {/* 二维码 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-inner border-2 border-gray-100">
                <QRCode
                  value={attendee.id}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>
              <p className="text-xs text-gray-500 text-center max-w-xs">
                请将此二维码对准扫描设备
              </p>
            </div>

            {/* 状态说明 */}
            <div className={`p-4 rounded-xl ${statusInfo.color} border`}>
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-sm">{statusInfo.text}</p>
                  <p className="text-xs mt-1 opacity-80">{statusInfo.description}</p>
                </div>
              </div>
            </div>

            {/* 时间记录 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-xs mb-1">报名时间</p>
                <p className="font-medium text-gray-900">
                  {new Date(attendee.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
              {attendee.check_in_time && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
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
          </CardContent>
        </Card>

        {/* 底部按钮 */}
        <Button
          onClick={() => {
            if (attendee?.event_id && attendee.event_id !== EMPTY_UUID) {
              router.push(`/?event_id=${attendee.event_id}`);
            } else {
              router.push('/');
            }
          }}
          variant="outline"
          className="w-full"
        >
          返回首页
        </Button>

        {/* 帮助信息 */}
        <div className="text-center text-xs text-gray-500">
          <p>如有问题，请联系现场工作人员</p>
        </div>
      </div>
    </div>
  );
}