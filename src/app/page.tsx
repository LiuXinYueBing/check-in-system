'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { hasErrorCode } from '@/utils/error-helpers';
import { Attendee } from '@/types';
import { QrCode } from 'lucide-react';
import { EMPTY_UUID, API_CONFIG } from '@/lib/constants';

function HomePageContent() {
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentEventId, setCurrentEventId] = useState('');
  const [eventLoading, setEventLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🔥 核心逻辑1: URL参数绑定场次，如果没有参数则获取最新活动
  useEffect(() => {
    const initializeEventId = async () => {
      // 优先读取URL参数中的event_id
      const urlEventId = searchParams.get('event_id');

      if (urlEventId) {
        // 验证UUID格式
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(urlEventId)) {
          logger.error('Invalid event_id format:', urlEventId);
          setError('URL中的活动ID格式无效');
        }
        setCurrentEventId(urlEventId);
        setEventLoading(false);
        return;
      }

      // 如果没有参数，获取最新的活动ID
      try {
        const { data: events, error } = await supabase
          .from('events')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          logger.error('获取活动列表失败:', error);
          // 如果获取失败，使用空UUID
          setCurrentEventId(EMPTY_UUID);
          setEventLoading(false);
          return;
        }

        if (events && events.length > 0) {
          setCurrentEventId(events[0].id);
          logger.log('✅ 自动获取最新活动ID:', events[0].id);
        } else {
          // 如果没有活动，使用空UUID
          setCurrentEventId(EMPTY_UUID);
          logger.log('⚠️ 没有找到活动，使用空UUID');
        }
        setEventLoading(false);
      } catch (err) {
        logger.error('获取活动ID失败:', err);
        setCurrentEventId(EMPTY_UUID);
        setEventLoading(false);
      }
    };

    initializeEventId();
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('请输入姓名');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('请输入手机号');
      return false;
    }
    // 简单的手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setError('请输入正确的手机号');
      return false;
    }
    return true;
  };

  // 🔥 核心逻辑2: 智能提交 (先查询再决定操作)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // 🔍 智能查询：必须同时匹配 phone AND event_id (当前场次)
      const { data: existingAttendee, error: queryError } = await supabase
        .from('attendees')
        .select('*')
        .eq('phone', formData.phone.trim())
        .eq('event_id', currentEventId) // 关键：查询当前场次
        .maybeSingle(); // 修复：使用 maybeSingle() 而不是 single()

      // 📋 分支A (老用户)：查到了 -> 直接跳转
      if (existingAttendee) {
        router.push(`/ticket/${existingAttendee.id}`);
        return;
      }

      // 📝 分支B (新用户)：没查到 -> Insert后跳转
      const { data: newAttendee, error: insertError } = await supabase
        .from('attendees')
        .insert({
          event_id: currentEventId, // 使用URL参数或默认的event_id
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          status: 'registered'
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // 创建成功后跳转到凭证页
      router.push(`/ticket/${newAttendee.id}`);

    } catch (err: unknown) {
      logger.error('Registration error:', err);

      // 区分错误类型：如果是 406 Not Acceptable，说明查询逻辑有问题
      if (hasErrorCode(err, 'PGRST116')) {
        setError('系统错误，请联系工作人员');
      } else {
        setError('注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">活动签到</h1>
          <p className="text-gray-600">请填写您的信息完成活动报名</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg text-center">报名信息</CardTitle>
            <CardDescription className="text-center">
              请确保信息准确，将用于现场核验
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">正在获取活动信息...</p>
              </div>
            )}

            {!eventLoading && currentEventId && currentEventId !== EMPTY_UUID && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">✅ 已自动关联到当前活动</p>
              </div>
            )}

            {!eventLoading && (!currentEventId || currentEventId === EMPTY_UUID) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">⚠️ 请在URL中添加活动ID，或创建活动后再报名</p>
              </div>
            )}

            {!eventLoading && currentEventId && currentEventId !== EMPTY_UUID && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    姓名
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="请输入您的姓名"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading}
                    autoComplete="name"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    手机号
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="请输入您的手机号"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={loading}
                    autoComplete="tel"
                    className="h-12"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center">
                    <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-red-600">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium shadow-lg"
                  disabled={loading || eventLoading}
                >
                  {loading || eventLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {eventLoading ? '加载活动信息...' : '提交中...'}
                    </div>
                  ) : (
                    '提交报名'
                  )}
                </Button>
              </form>
            )}

            {!eventLoading && (!currentEventId || currentEventId === EMPTY_UUID) && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">没有可用的活动，请联系工作人员创建活动后再报名</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500 mb-20">
          <p>提交后将生成您的专属电子凭证</p>
        </div>

        </div>

      </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}