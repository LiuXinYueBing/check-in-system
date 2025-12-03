'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Attendee, Event } from '@/types';
import { QrCode, BarChart3, Users, Calendar } from 'lucide-react';

export default function HomePage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // 这里使用固定的活动 ID，实际项目中可能需要从 URL 或配置中获取
      const EVENT_ID = '00000000-0000-0000-0000-000000000000';

      // 首先检查是否已经注册
      const { data: existingAttendee } = await supabase
        .from('attendees')
        .select('*')
        .eq('phone', formData.phone.trim())
        .eq('event_id', EVENT_ID)
        .single();

      if (existingAttendee) {
        // 如果已存在，直接跳转到凭证页
        router.push(`/ticket/${existingAttendee.id}`);
        return;
      }

      // 创建新的参会者记录
      const { data: newAttendee, error } = await supabase
        .from('attendees')
        .insert({
          event_id: EVENT_ID,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          status: 'registered'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // 跳转到凭证页
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

        {/* 工作人员快速入口 */}
        <div className="mt-8 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">工作人员入口</h3>
            <p className="text-sm text-gray-600 mb-4">快速访问管理功能</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => window.location.href = '/staff/scan'}
              variant="outline"
              className="h-16 flex-col space-y-1"
            >
              <QrCode className="w-6 h-6" />
              <span className="text-sm">扫码核销</span>
            </Button>

            <Button
              onClick={() => window.location.href = '/admin/dashboard'}
              variant="outline"
              className="h-16 flex-col space-y-1"
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm">数据看板</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="max-w-4xl mx-auto flex justify-around">
          <Button
            variant="default"
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center py-2 px-3 h-auto"
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-xs">注册</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.location.href = '/staff/scan'}
            className="flex flex-col items-center py-2 px-3 h-auto"
          >
            <QrCode className="w-5 h-5 mb-1" />
            <span className="text-xs">扫码</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.location.href = '/admin/dashboard'}
            className="flex flex-col items-center py-2 px-3 h-auto"
          >
            <BarChart3 className="w-5 h-5 mb-1" />
            <span className="text-xs">看板</span>
          </Button>
        </div>
      </div>
    </div>
  );
}