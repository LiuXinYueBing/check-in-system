# 🚀 活动签到系统 - 完整部署指南

## 📋 部署前准备

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git 账号
- Supabase 账号

### 部署方式
- **推荐**: Vercel (一键部署，免费额度)
- **备选**: Netlify, Railway, DigitalOcean 等

---

## 🗄️ 第一步：Supabase 数据库设置

### 1.1 创建 Supabase 项目
1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 **"Start your project"** 或 **"New Project"**
3. 选择组织，如果没有则创建一个
4. 填写项目信息：
   - **项目名称**: `event-checkin-system`
   - **数据库密码**: 设置强密码并保存
   - **区域**: 选择距离最近的区域（如 East Asia）
5. 点击 **"Create new project"**，等待 1-2 分钟

### 1.2 获取必要的连接信息
项目创建完成后：
1. 进入项目仪表板
2. 点击左侧菜单 **"Settings"** → **"API"**
3. 复制以下两个信息：
   - **Project URL**（格式：`https://your-project-id.supabase.co`）
   - **anon public**（格式：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`）

### 1.3 设置数据库表结构
1. 在 Supabase 项目中，点击左侧菜单 **"SQL Editor"**
2. 点击 **"New query"**
3. 复制以下完整 SQL 代码并粘贴：
4. 点击 **"Run"** 执行（预计 30 秒）

```sql
-- ========================================
-- 活动签到系统 - 完整数据库设置脚本
-- ========================================

-- 1. 创建活动表
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建参会者状态枚举
DROP TYPE IF EXISTS attendee_status CASCADE;
CREATE TYPE attendee_status AS ENUM ('registered', 'checked_in', 'redeemed');

-- 3. 创建参会者表
CREATE TABLE IF NOT EXISTS attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    status attendee_status DEFAULT 'registered' NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    redeem_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_attendees_status ON attendees(status);
CREATE INDEX IF NOT EXISTS idx_attendees_phone ON attendees(phone);

-- 5. 插入示例活动数据
INSERT INTO events (id, name, date, location, description) VALUES
('demo-event-2024', '2024年度技术创新峰会', '2024-12-25', '北京国际会议中心', '汇聚行业精英，探讨前沿技术趋势与未来发展方向')
ON CONFLICT (id) DO NOTHING;

-- 6. 批量生成参会者演示数据 (50条)
INSERT INTO attendees (id, event_id, name, phone, status, created_at, check_in_time, redeem_time) VALUES
-- 待入场用户 (30人)
('reg-001', 'demo-event-2024', '张伟', '13800138001', 'registered', NOW() - INTERVAL '2 days 3 hours', NULL, NULL),
('reg-002', 'demo-event-2024', '王秀英', '13800138002', 'registered', NOW() - INTERVAL '2 days 1 hours', NULL, NULL),
('reg-003', 'demo-event-2024', '李强', '13800138003', 'registered', NOW() - INTERVAL '1 days 23 hours', NULL, NULL),
('reg-004', 'demo-event-2024', '刘敏', '13800138004', 'registered', NOW() - INTERVAL '1 days 21 hours', NULL, NULL),
('reg-005', 'demo-event-2024', '陈勇', '13800138005', 'registered', NOW() - INTERVAL '1 days 19 hours', NULL, NULL),
('reg-006', 'demo-event-2024', '杨丽', '13800138006', 'registered', NOW() - INTERVAL '1 days 17 hours', NULL, NULL),
('reg-007', 'demo-event-2024', '赵建国', '13800138007', 'registered', NOW() - INTERVAL '1 days 15 hours', NULL, NULL),
('reg-008', 'demo-event-2024', '黄秀英', '13800138008', 'registered', NOW() - INTERVAL '1 days 13 hours', NULL, NULL),
('reg-009', 'demo-event-2024', '周建华', '13800138009', 'registered', NOW() - INTERVAL '1 days 11 hours', NULL, NULL),
('reg-010', 'demo-event-2024', '吴敏', '13800138010', 'registered', NOW() - INTERVAL '1 days 9 hours', NULL, NULL),
('reg-011', 'demo-event-2024', '徐强', '13800138011', 'registered', NOW() - INTERVAL '1 days 7 hours', NULL, NULL),
('reg-012', 'demo-event-2024', '孙丽华', '13800138012', 'registered', NOW() - INTERVAL '1 days 5 hours', NULL, NULL),
('reg-013', 'demo-event-2024', '马勇', '13800138013', 'registered', NOW() - INTERVAL '1 days 3 hours', NULL, NULL),
('reg-014', 'demo-event-2024', '朱秀兰', '13800138014', 'registered', NOW() - INTERVAL '1 days 1 hours', NULL, NULL),
('reg-015', 'demo-event-2024', '胡建华', '13800138015', 'registered', NOW() - INTERVAL '23 hours', NULL, NULL),
('reg-016', 'demo-event-2024', '林敏', '13800138016', 'registered', NOW() - INTERVAL '21 hours', NULL, NULL),
('reg-017', 'demo-event-2024', '何强', '13800138017', 'registered', NOW() - INTERVAL '19 hours', NULL, NULL),
('reg-018', 'demo-event-2024', '高丽华', '13800138018', 'registered', NOW() - INTERVAL '17 hours', NULL, NULL),
('reg-019', 'demo-event-2024', '郑勇', '13800138019', 'registered', NOW() - INTERVAL '15 hours', NULL, NULL),
('reg-020', 'demo-event-2024', '谢秀英', '13800138020', 'registered', NOW() - INTERVAL '13 hours', NULL, NULL),
('reg-021', 'demo-event-2024', '唐建华', '13800138021', 'registered', NOW() - INTERVAL '11 hours', NULL, NULL),
('reg-022', 'demo-event-2024', '冯敏', '13800138022', 'registered', NOW() - INTERVAL '9 hours', NULL, NULL),
('reg-023', 'demo-event-2024', '曹强', '13800138023', 'registered', NOW() - INTERVAL '7 hours', NULL, NULL),
('reg-024', 'demo-event-2024', '彭丽华', '13800138024', 'registered', NOW() - INTERVAL '5 hours', NULL, NULL),
('reg-025', 'demo-event-2024', '萧勇', '13800138025', 'registered', NOW() - INTERVAL '3 hours', NULL, NULL),
('reg-026', 'demo-event-2024', '曾秀英', '13800138026', 'registered', NOW() - INTERVAL '2 hours', NULL, NULL),
('reg-027', 'demo-event-2024', '邓建华', '13800138027', 'registered', NOW() - INTERVAL '1 hours', NULL, NULL),
('reg-028', 'demo-event-2024', '蔡敏', '13800138028', 'registered', NOW() - INTERVAL '45 minutes', NULL, NULL),
('reg-029', 'demo-event-2024', '丁强', '13800138029', 'registered', NOW() - INTERVAL '30 minutes', NULL, NULL),
('reg-030', 'demo-event-2024', '田丽华', '13800138030', 'registered', NOW() - INTERVAL '15 minutes', NULL, NULL),

-- 已入场用户 (15人)
('check-001', 'demo-event-2024', '王伟', '13800138031', 'checked_in', NOW() - INTERVAL '3 days 2 hours', NOW() - INTERVAL '2 days 8 hours', NULL),
('check-002', 'demo-event-2024', '李秀英', '13800138032', 'checked_in', NOW() - INTERVAL '2 days 22 hours', NOW() - INTERVAL '2 days 6 hours', NULL),
('check-003', 'demo-event-2024', '张强', '13800138033', 'checked_in', NOW() - INTERVAL '2 days 20 hours', NOW() - INTERVAL '2 days 4 hours', NULL),
('check-004', 'demo-event-2024', '刘敏华', '13800138034', 'checked_in', NOW() - INTERVAL '2 days 18 hours', NOW() - INTERVAL '2 days 2 hours', NULL),
('check-005', 'demo-event-2024', '陈建华', '13800138035', 'checked_in', NOW() - INTERVAL '2 days 16 hours', NOW() - INTERVAL '1 days 23 hours', NULL),
('check-006', 'demo-event-2024', '杨勇', '13800138036', 'checked_in', NOW() - INTERVAL '2 days 14 hours', NOW() - INTERVAL '1 days 21 hours', NULL),
('check-007', 'demo-event-2024', '赵丽', '13800138037', 'checked_in', NOW() - INTERVAL '2 days 12 hours', NOW() - INTERVAL '1 days 19 hours', NULL),
('check-008', 'demo-event-2024', '黄强华', '13800138038', 'checked_in', NOW() - INTERVAL '2 days 10 hours', NOW() - INTERVAL '1 days 17 hours', NULL),
('check-009', 'demo-event-2024', '周敏', '13800138039', 'checked_in', NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '1 days 15 hours', NULL),
('check-010', 'demo-event-2024', '吴建华', '13800138040', 'checked_in', NOW() - INTERVAL '2 days 6 hours', NOW() - INTERVAL '1 days 13 hours', NULL),
('check-011', 'demo-event-2024', '徐勇华', '13800138041', 'checked_in', NOW() - INTERVAL '2 days 4 hours', NOW() - INTERVAL '1 days 11 hours', NULL),
('check-012', 'demo-event-2024', '孙敏', '13800138042', 'checked_in', NOW() - INTERVAL '2 days 2 hours', NOW() - INTERVAL '1 days 9 hours', NULL),
('check-013', 'demo-event-2024', '马强华', '13800138043', 'checked_in', NOW() - INTERVAL '1 days 22 hours', NOW() - INTERVAL '1 days 7 hours', NULL),
('check-014', 'demo-event-2024', '朱丽', '13800138044', 'checked_in', NOW() - INTERVAL '1 days 20 hours', NOW() - INTERVAL '1 days 5 hours', NULL),
('check-015', 'demo-event-2024', '胡建华', '13800138045', 'checked_in', NOW() - INTERVAL '1 days 18 hours', NOW() - INTERVAL '1 days 3 hours', NULL),

-- 已核销用户 (5人)
('redm-001', 'demo-event-2024', '林伟', '13800138046', 'redeemed', NOW() - INTERVAL '3 days 1 hours', NOW() - INTERVAL '2 days 12 hours', NOW() - INTERVAL '2 days 6 hours'),
('redm-002', 'demo-event-2024', '何秀英', '13800138047', 'redeemed', NOW() - INTERVAL '3 days 0 hours', NOW() - INTERVAL '2 days 10 hours', NOW() - INTERVAL '2 days 4 hours'),
('redm-003', 'demo-event-2024', '高强', '13800138048', 'redeemed', NOW() - INTERVAL '2 days 23 hours', NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '2 days 2 hours'),
('redm-004', 'demo-event-2024', '郑丽华', '13800138049', 'redeemed', NOW() - INTERVAL '2 days 21 hours', NOW() - INTERVAL '2 days 6 hours', NOW() - INTERVAL '2 days 0 hours'),
('redm-005', 'demo-event-2024', '谢伟', '13800138050', 'redeemed', NOW() - INTERVAL '2 days 19 hours', NOW() - INTERVAL '2 days 4 hours', NOW() - INTERVAL '1 days 22 hours')
ON CONFLICT (id) DO NOTHING;

-- 数据统计验证
SELECT
    COUNT(*) as 总报名人数,
    COUNT(CASE WHEN status = 'registered' THEN 1 END) as 待入场人数,
    COUNT(CASE WHEN status = 'checked_in' THEN 1 END) as 已入场人数,
    COUNT(CASE WHEN status = 'redeemed' THEN 1 END) as 已核销人数,
    ROUND(COUNT(CASE WHEN status = 'redeemed' THEN 1 END) * 100.0 / COUNT(*), 2) as 核销率百分比
FROM attendees
WHERE event_id = 'demo-event-2024';
```

### 1.4 验证数据库设置
1. SQL 执行成功后，点击左侧菜单 **"Table Editor"**
2. 应该能看到 `events` 和 `attendees` 两个表
3. 点击 `attendees` 表查看是否包含 50 条数据
4. 数据统计应该显示：
   - 总报名人数：50
   - 待入场人数：30
   - 已入场人数：15
   - 已核销人数：5

---

## 💻 第二步：本地环境配置

### 2.1 克隆或下载代码
```bash
# 如果使用 Git
git clone [你的代码仓库地址]
cd event-checkin

# 或者直接下载解压项目文件
```

### 2.2 安装依赖
```bash
npm install
# 或
yarn install
```

### 2.3 配置环境变量
1. 在项目根目录创建 `.env.local` 文件
2. 复制以下内容并填入你的 Supabase 信息：

```env
# Supabase 配置
# 从 Supabase 项目设置 -> API 中获取
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.4 本地测试
```bash
npm run dev
```
打开浏览器访问：
- 用户注册页：http://localhost:3000
- 数据看板：http://localhost:3000/admin/dashboard
- 扫码核销：http://localhost:3000/staff/scan

---

## 🚀 第三步：Vercel 部署（推荐）

### 3.1 准备 Git 仓库
```bash
# 初始化 Git 仓库（如果还没有）
git init
git add .
git commit -m "Initial commit: Event Checkin System"

# 推送到 GitHub/GitLab
git remote add origin https://github.com/yourusername/event-checkin.git
git push -u origin main
```

### 3.2 连接 Vercel
1. 访问 [https://vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 **"New Project"** 或 **"Add New..."** → **"Project"**
4. 导入你的 GitHub 仓库
5. 选择项目仓库：`event-checkin`

### 3.3 配置 Vercel 项目
1. **Framework Preset**: 选择 `Next.js`（自动检测）
2. **Root Directory**: 保持默认 `/`
3. **Build and Output Settings**: 使用默认 Next.js 配置

### 3.4 添加环境变量
在 Vercel 项目设置中添加环境变量：
1. 点击 **"Build & Development Settings"** → **"Environment Variables"**
2. 添加以下变量：

| Name | Value | Environment |
|-------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase Anon Key | Production, Preview, Development |

### 3.5 部署
1. 点击 **"Deploy"** 开始部署
2. 等待 1-3 分钟，部署完成后会显示：
   - **Production URL**: `https://your-project-name.vercel.app`
   - **Preview URLs**: 每次部署的预览链接

---

## ✅ 第四步：部署后验证

### 4.1 功能测试清单
- [ ] 访问首页，注册新用户成功
- [ ] 数据看板显示 50+ 演示数据
- [ ] 扫码功能正常（需要 HTTPS 环境）
- [ ] 状态流转正确（待入场→已入场→已核销）
- [ ] 移动端显示正常
- [ ] 底部导航栏工作正常

### 4.2 移动端扫码测试
1. 用手机访问部署的 URL
2. 进入 `/staff/scan` 页面
3. 允许摄像头权限
4. 扫描用户凭证页的二维码
5. 测试状态更新功能

### 4.3 实时数据测试
1. 在一个设备上注册新用户
2. 在另一个设备上扫码处理
3. 在数据看板查看实时更新

---

## 🔧 常见问题解决

### Q1: 扫码功能无法启动？
**解决方案**:
- 确保使用 HTTPS 或 localhost
- 检查浏览器摄像头权限
- 更新到最新版 Chrome/Safari

### Q2: Supabase 连接失败？
**解决方案**:
- 检查 `.env.local` 中的 URL 和 Key 是否正确
- 确认 Supabase 项目状态为 Active
- 检查网络连接

### Q3: 部署后 404 错误？
**解决方案**:
- 确保 `next.config.js` 配置正确
- 检查 Vercel 构建日志
- 重新部署项目

### Q4: 移动端显示异常？
**解决方案**:
- 检查 Tailwind CSS 配置
- 测试响应式断点设置
- 使用移动端调试工具

---

## 📞 技术支持

### 部署过程中的问题
1. **数据库问题**: 检查 Supabase 项目设置
2. **部署问题**: 查看 Vercel 部署日志
3. **功能问题**: 浏览器开发者工具检查错误

### 联系方式
- GitHub Issues: [提交 Issue](https://github.com/yourusername/event-checkin/issues)
- 邮箱: your-email@example.com

---

## 🎉 部署成功！

完成以上步骤后，您的活动签到系统已成功上线！

### 系统功能总结：
✅ **用户注册**: 简洁表单，生成二维码凭证
✅ **扫码核销**: 工作人员扫码处理签到和核销
✅ **数据看板**: 实时统计数据和参会人员管理
✅ **移动端优化**: 完美适配手机操作体验
✅ **状态流转**: 严格的业务逻辑保证数据准确性

### 演示建议：
1. 展示数据看板的丰富统计数据
2. 演示移动端扫码的流畅体验
3. 测试状态变化的实时更新
4. 介绍系统的高扩展性（多活动支持、统计分析等）

**🎯 恭喜！现在您可以向客户完美展示这个专业的活动签到系统了！**