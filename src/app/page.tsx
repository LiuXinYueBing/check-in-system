'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Attendee } from '@/types';
import { QrCode } from 'lucide-react';

export default function HomePage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentEventId, setCurrentEventId] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🔥 核心逻辑1: URL参数绑定场次
  useEffect(() => {
    // 优先读取URL参数中的event_id
    const urlEventId = searchParams.get('event_id');

    if (urlEventId) {
      setCurrentEventId(urlEventId);
    } else {
      // 如果没有参数，使用默认ID
      const defaultEventId = '00000000-0000-0000-0000-000000000000';
      setCurrentEventId(defaultEventId);
    }
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
        .single();

      if (queryError) {
        console.error('Query error:', queryError);
        // 如果查询出错，尝试创建新记录
        throw new Error('查询失败');
      }

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

    } catch (err: any) {
      console.error('Registration error:', err);
      setError('注册失败，请稍后重试');
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
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    提交中...
                  </div>
                ) : (
                  '提交报名'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500 mb-20">
          <p>提交后将生成您的专属电子凭证</p>
        </div>

        </div>

      </div>
  );
}