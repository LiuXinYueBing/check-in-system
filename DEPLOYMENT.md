# 部署指南

## 🚀 快速开始

### 1. 环境准备
- Node.js 18+
- npm 或 yarn
- Supabase 账号

### 2. 安装依赖
```bash
npm install
# 或
yarn install
```

### 3. 配置 Supabase

#### 3.1 创建 Supabase 项目
1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 在项目设置中获取 **Project URL** 和 **Anon Key**

#### 3.2 设置数据库
1. 在 Supabase 项目的 **SQL Editor** 中执行以下 SQL：

```sql
-- 创建活动表
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建参会者状态枚举
CREATE TYPE attendee_status AS ENUM ('registered', 'checked_in', 'redeemed');

-- 创建参会者表
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

-- 创建索引以提高查询性能
CREATE INDEX idx_attendees_event_id ON attendees(event_id);
CREATE INDEX idx_attendees_status ON attendees(status);
CREATE INDEX idx_attendees_phone ON attendees(phone);
```

#### 3.3 插入测试数据（可选）
执行 `src/scripts/seed-data.sql` 中的内容来创建测试数据。

#### 3.4 配置环境变量
创建 `.env.local` 文件：
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

访问 http://localhost:3000 查看应用。

## 📱 测试流程

### 1. 用户注册测试
1. 访问 http://localhost:3000
2. 填写姓名和手机号
3. 提交后会跳转到电子凭证页
4. 二维码中包含用户的 UUID

### 2. 工作人员扫码测试
1. 访问 http://localhost:3000/staff/scan
2. 允许摄像头权限
3. 使用手机扫描凭证页面的二维码
4. 根据状态进行相应操作：
   - **待入场**: 点击"确认入场"
   - **已入场**: 点击"核销抵用券"
   - **已核销**: 显示已完成提示

### 3. 数据看板测试
1. 访问 http://localhost:3000/admin/dashboard
2. 查看实时统计数据
3. 使用筛选功能查看不同状态的参会者
4. 验证数据实时更新

## 🔧 生产环境部署

### Vercel 部署（推荐）

1. **准备部署**
   ```bash
   npm run build
   npm run start
   ```

2. **部署到 Vercel**
   - 连接 GitHub 仓库到 Vercel
   - 在 Vercel 中添加环境变量：
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 自动部署

### 其他部署选项

#### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### 自定义服务器
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🔒 安全注意事项

1. **Supabase RLS 策略**
   - 在生产环境中，请设置 Row Level Security (RLS) 策略
   - 限制数据访问权限

2. **环境变量安全**
   - 永远不要在客户端代码中暴露敏感的 API 密钥
   - 使用 Anon Key 而不是 Service Role Key

3. **HTTPS 部署**
   - 生产环境必须使用 HTTPS
   - Supabase API 调用需要安全连接

## 📊 监控和维护

1. **性能监控**
   - 使用 Vercel Analytics 或类似工具
   - 监控 Supabase 的使用情况

2. **数据备份**
   - 定期备份 Supabase 数据库
   - 设置自动备份策略

3. **日志监控**
   - 配置错误日志收集
   - 监控 API 调用失败情况

## 🚨 故障排除

### 常见问题

1. **摄像头权限问题**
   - 确保使用 HTTPS 或 localhost
   - 检查浏览器摄像头权限设置

2. **Supabase 连接问题**
   - 验证环境变量配置
   - 检查网络连接
   - 确认 Supabase 项目状态

3. **扫码失败问题**
   - 确保二维码清晰可读
   - 检查光线条件
   - 尝试缓慢移动二维码

### 调试工具

1. **浏览器开发者工具**
   - 查看控制台错误
   - 检查网络请求

2. **Supabase 仪表板**
   - 查看 API 调用日志
   - 检查数据库查询性能

## 📞 技术支持

如遇到部署问题，请：
1. 检查本文档的故障排除部分
2. 查看 GitHub Issues
3. 联系开发团队

---

**注意**: 本系统为演示版本，生产部署前请进行充分的测试和安全评估。