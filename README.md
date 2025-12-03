# 活动签到与核销系统

基于 Next.js 14 和 Supabase 开发的移动端优先活动签到与核销系统。

## 🚀 功能特性

- **移动端优先设计**: 专为手机竖屏体验优化
- **双重核销状态管理**: 已报名 → 已入场 → 已核销的严格状态流转
- **二维码生成与识别**: 用户注册后生成唯一二维码凭证
- **实时状态更新**: 支持实时查看签到和核销状态
- **高端简约界面**: 类似原生 App 的用户体验

## 📋 业务流程

### 用户状态流转
1. **已报名 (Registered)**: 用户填写姓名手机号后的初始状态
2. **已入场 (Checked In)**: 工作人员在门口扫码，将状态从"已报名"改为"已入场"
3. **已核销 (Redeemed)**: 工作人员在礼品区扫码，将状态从"已入场"改为"已核销"

### 业务规则
- 如果用户未入场直接去领礼品，系统拦截并提示"未签到"
- 如果用户已核销再次扫码，系统提示"重复领取"

## 🛠️ 技术栈

### 前端
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn UI** (UI 组件)
- **Lucide React** (图标)
- **react-qr-code** (二维码生成)

### 后端/数据库
- **Supabase** (PostgreSQL)

## 📱 页面功能

### 用户端
#### 用户注册页 (/)
- 简洁的表单设计，输入姓名和手机号
- 支持重复注册检测（基于手机号）
- 表单验证和错误提示
- 提交后自动跳转到电子凭证页
- 工作人员快速入口按钮

#### 电子凭证页 (/ticket/[id])
- 显示用户姓名、手机号和当前状态
- 大尺寸二维码供扫描设备识别
- 状态可视化展示（待入场/已入场/已核销）
- 时间记录显示（报名时间、入场时间等）

### 管理端
#### 工作人员扫码页 (/staff/scan)
- 调用手机摄像头扫描二维码
- 智能状态判断与操作按钮：
  - **待入场**: 显示【确认入场】绿色按钮
  - **已入场**: 显示【核销抵用券】橙色按钮
  - **已核销**: 显示"已完成核销"，无操作按钮
- 实时 Toast 反馈和用户信息展示
- 扫描完成后可继续扫描

#### 后台数据看板页 (/admin/dashboard)
- 实时数据统计卡片（总报名、待入场、已入场、已核销）
- 参会人员列表展示
- 按状态筛选功能
- 响应式表格设计
- 详细的报名时间和入场时间记录

## 🗄️ 数据库结构

### Events 表
```sql
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Attendees 表
```sql
CREATE TYPE attendee_status AS ENUM ('registered', 'checked_in', 'redeemed');

CREATE TABLE attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status attendee_status DEFAULT 'registered' NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    redeem_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 快速开始

### 1. 环境准备
- Node.js 18+
- npm 或 yarn
- Supabase 账号

### 2. 安装依赖
```bash
npm install
```

### 3. 配置 Supabase
1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在 SQL Editor 中运行上述数据库结构代码
3. 获取项目 URL 和 anon key
4. 更新 `.env.local` 文件：
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 📱 移动端优化

- **响应式设计**: 完全适配各种移动设备屏幕
- **触摸优化**: 按钮和交互元素针对触摸操作优化
- **性能优化**: 快速加载和流畅的动画效果
- **防止误操作**: 防止双击缩放等移动端常见问题

## 🔧 开发指南

### 项目结构
```
src/
├── app/
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局
│   ├── page.tsx            # 用户注册页
│   └── ticket/
│       └── [id]/
│           └── page.tsx    # 电子凭证页
├── components/
│   └── ui/                 # UI 组件库
├── lib/
│   ├── supabase.ts         # Supabase 客户端
│   └── utils.ts            # 工具函数
└── types/
    └── index.ts            # TypeScript 类型定义
```

### 扩展功能
- **扫码核销功能**: 可扩展添加工作人员扫码页面
- **数据统计**: 添加活动数据统计页面
- **多活动支持**: 支持管理多个活动
- **消息通知**: 集成推送通知功能

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题或建议，请联系开发团队。