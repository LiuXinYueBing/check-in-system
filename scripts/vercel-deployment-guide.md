# 🚀 Vercel 部署指南

## 📋 当前状态
✅ Git 仓库已初始化
✅ Supabase 数据库已准备就绪
✅ 项目代码已提交完成
✅ Vercel CLI 已安装但需要认证

## 🎯 推荐部署方案

### 方案一：通过 Vercel Web 界面（推荐）

#### 第1步：推送代码到 GitHub
如果您还没有推送代码到 GitHub，请先按以下步骤操作：

1. **访问 GitHub**: https://github.com/new
2. **创建仓库**:
   - Repository name: `yuge-checkin-system`
   - Visibility: `Private`（推荐私有）
3. **推送代码**:
   ```bash
   # 添加远程仓库（替换 YOUR_USERNAME）
   git remote add origin https://github.com/YOUR_USERNAME/yuge-checkin-system.git

   # 推送代码
   git push -u origin main
   ```

#### 第2步：Vercel 部署
1. **访问 Vercel**: https://vercel.com/dashboard
2. **登录 GitHub 账户**
3. **点击 "Add New..."** 或 **"New Project"**
4. **选择 "Import Git Repository"**
5. **选择刚才创建的仓库** `yuge-checkin-system`
6. **自动检测项目配置**:
   - Framework: `Next.js`（自动检测）
   - Root Directory: `/`（保持默认）
   - Build Command: `npm run build`（自动）
   - Output Directory: `.next`（自动）
7. **添加环境变量**（重要）:
   - 进入 "Environment Variables" 选项卡
   - 添加以下变量：
     ```
     NEXT_PUBLIC_SUPABASE_URL = 您的 Supabase URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY = 您的 Supabase Anon Key
     ```
8. **点击 "Deploy"** 开始部署
9. **等待 1-3 分钟** 部署完成

### 方案二：通过 CLI 登录部署

#### 第1步：获取 Vercel 认证
运行以下命令并按提示操作：

```bash
# 尝试登录（需要浏览器认证）
npx vercel login

# 访问显示的链接进行认证
# 认证完成后继续
```

#### 第2步：执行部署
认证成功后运行：
```bash
npx vercel --prod
```

## ⚙️ 环境变量配置

### 获取 Supabase 配置
1. **访问 Supabase**: https://supabase.com
2. **选择项目**: 点击进入您的项目
3. **获取 API 信息**: 点击左侧菜单 **"Settings"** → **"API"**
4. **复制以下信息**:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Vercel 环境变量设置
在 Vercel 项目设置的 **"Environment Variables"** 中添加：
- `NEXT_PUBLIC_SUPABASE_URL`: 您的 Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 您的 Supabase Anon Key

**重要**: 确保所有部署环境（Production, Preview, Development）都添加了环境变量！

## 🔧 部署后验证

### 功能测试清单
部署完成后，请测试以下功能：

#### ✅ 基础功能
- [ ] 访问主页：`https://your-app.vercel.app`
- [ ] 用户注册功能正常
- [ ] 电子凭证页面显示二维码
- [ ] 数据看板显示统计数据（总50人，待30人，已15人，核5人）

#### ✅ 移动端功能
- [ ] 手机浏览器访问正常
- [ ] 触摸操作流畅
- [ ] 扫码功能需要 HTTPS 环境（Vercel 提供）
- [ ] 响应式设计适配各种屏幕

#### ✅ 实时功能
- [ ] 在手机上注册新用户
- [ ] 在另一设备上扫码处理
- [ ] 数据看板实时更新显示

## 🔧 常见问题解决

### Q1: 部署后显示 "Application Error"
**解决方案**:
1. 检查 Vercel 部署日志
2. 确认环境变量配置正确
3. 验证 Supabase 项目状态为 Active
4. 尝试重新部署项目

### Q2: Supabase 连接失败
**解决方案**:
1. 确认环境变量名称完全正确（注意大小写）
2. 检查 Supabase 项目 URL 格式
3. 验证 Anon Key 是否正确且未过期
4. 确认 Supabase 项目设置中的 RLS（行级安全）配置

### Q3: 扫码功能无法使用
**解决方案**:
1. 确保使用 HTTPS 访问（Vercel 自动提供）
2. 检查浏览器摄像头权限
3. 尝试使用最新版 Chrome 或 Safari
4. 测试不同的移动设备

### Q4: 数据看板显示空白
**解决方案**:
1. 检查网络连接
2. 查看浏览器控制台错误信息
3. 确认 Supabase 数据库连接
4. 尝试刷新页面

## 📊 部署成功指标

### 预期结果
- ✅ **生产环境访问**: `https://your-app-name.vercel.app`
- ✅ **所有页面正常**: 主页、凭证、扫码、看板
- ✅ **数据同步**: Supabase 数据正常显示
- ✅ **移动端优化**: 触摸友好的用户体验
- ✅ **实时更新**: 扫码后数据看板立即反映

### 性能指标
- ⚡ **首屏加载时间**: < 3 秒
- 📱 **移动端体验**: Lighthouse 分数 > 90
- 🔄 **API 响应时间**: < 500ms
- 📊 **数据准确性**: 100% 状态同步

## 🎉 部署完成

一旦部署成功，您将获得：
- 🔗 **生产环境网址**: `https://your-app-name.vercel.app`
- 📊 **完整的管理看板**: 实时监控活动数据
- 📱 **移动端扫码应用**: 现场即时处理签到核销
- 🛡️ **可靠的业务系统**: 严格的状态管理防止错误
- 🚀 **一键部署能力**: 后续更新可自动部署

---

## 📞 技术支持

如遇到部署问题，请：
1. 查看 Vercel 部署日志
2. 检查 Supabase 项目设置
3. 参考 [DEPLOY.md](DEPLOY.md) 详细文档
4. 联系技术支持团队

---

**🚀 现在请按照上述方案进行部署，您的活动签到系统即将上线！**