# 🚀 活动签到系统 - 快速启动指南

## ⚡ 5分钟快速演示

### 第1步：Supabase 设置 (2分钟)
1. 访问 [supabase.com](https://supabase.com) 并登录
2. 点击 **"New Project"** → 输入项目信息 → 创建
3. 项目创建后，点击 **"Settings"** → **"API"**
4. 复制 **Project URL** 和 **anon public** key
5. 点击左侧菜单 **"SQL Editor"** → **"New query"**
6. 复制 `scripts/setup-database.sql` 的内容并粘贴
7. 点击 **"Run"** 执行（约30秒）

### 第2步：本地配置 (1分钟)
1. 复制 `.env.example` 为 `.env.local`
2. 填入刚才复制的 Supabase 配置：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的公开密钥
   ```

### 第3步：启动项目 (2分钟)
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 第4步：测试功能 (即时)
打开浏览器访问：
- **用户注册**: http://localhost:3000
- **数据看板**: http://localhost:3000/admin/dashboard
- **扫码核销**: http://localhost:3000/staff/scan

---

## 🎯 演示数据统计

运行 `scripts/setup-database.sql` 后，系统将包含：
- **总报名人数**: 50人
- **待入场**: 30人
- **已入场**: 15人
- **已核销**: 5人
- **核销率**: 10%

## 📱 移动端演示

### 测试用户注册流程：
1. 手机访问 http://localhost:3000
2. 填写姓名和手机号
3. 查看生成的电子凭证页面
4. 测试二维码显示效果

### 测试扫码核销流程：
1. 手机访问 http://localhost:3000/staff/scan
2. 允许摄像头权限
3. 扫描刚才生成的二维码
4. 根据状态进行相应操作

### 测试数据看板：
1. 访问 http://localhost:3000/admin/dashboard
2. 查看实时统计数据
3. 使用状态筛选功能
4. 观察扫码后的数据变化

---

## ⚡ 一键部署到 Vercel

### 前置条件：
- Git 仓库（GitHub/GitLab）
- Vercel 账号
- Supabase 项目已创建

### 部署步骤：
1. 推送代码到 Git 仓库
2. 访问 [vercel.com](https://vercel.com)
3. 点击 **"New Project"** → 导入仓库
4. Vercel 自动检测为 Next.js 项目
5. 在环境变量中添加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. 点击 **"Deploy"** 完成

### 部署后访问：
- 你的应用将部署到: `https://your-app-name.vercel.app`
- 所有功能与本地开发环境完全一致

---

## 🔧 常见问题快速解决

### ❌ 扫码功能无法启动？
**解决方案**:
- 确保使用 `localhost` 或 `https`
- 检查浏览器摄像头权限
- 更新到最新版浏览器

### ❌ Supabase 连接失败？
**解决方案**:
- 检查 `.env.local` 中的 URL 和 Key
- 确认 Supabase 项目状态为 Active
- 查看浏览器开发者工具的错误信息

### ❌ 部署后页面空白？
**解决方案**:
- 检查 Vercel 构建日志
- 确认环境变量配置正确
- 尝试重新部署

### ❌ 移动端显示异常？
**解决方案**:
- 检查 Tailwind CSS 响应式断点
- 使用浏览器移动端调试工具
- 确认 meta viewport 设置正确

---

## 🎉 演示就绪！

完成以上步骤后，您已经拥有：

✅ **完整的活动签到系统**
✅ **50条真实演示数据**
✅ **移动端优化的用户体验**
✅ **实时数据统计和看板**
✅ **专业的扫码核销功能**

### 推荐演示流程：
1. 展示数据看板的丰富统计
2. 演示用户注册的简洁体验
3. 展示电子凭证的专业设计
4. 演示扫码核销的流畅操作
5. 展示数据的实时更新效果

**🚀 现在您可以向宇哥完美展示这个系统了！**

---

### 📞 技术支持
如遇到任何问题，请：
1. 检查 `DEPLOY.md` 详细文档
2. 查看浏览器开发者工具
3. 检查 Supabase 项目设置

### 🔗 相关文档
- [完整部署指南](DEPLOY.md)
- [数据库设置](scripts/setup-database.sql)
- [环境变量配置](.env.example)