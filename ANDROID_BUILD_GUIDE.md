# Android APK 构建指南

本项目使用 Capacitor + GitHub Actions 实现 Android APK 的云端自动打包。

## 🚀 快速开始

### 1. 推送代码自动构建

当代码推送到 `main` 分支时，会自动触发 GitHub Actions 构建 Debug APK。

```bash
git push origin main
```

### 2. 手动触发构建

在 GitHub 仓库的 Actions 页面，可以手动触发构建工作流。

### 3. 发布版本

推送标签时会构建 Release 版本：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 📱 APK 下载

构建完成后，APK 文件会作为 GitHub Actions 的 artifact 上传，可以在以下位置下载：

1. **Debug APK**: Actions -> Build Android APK -> Artifacts
2. **Release APK**: Actions -> Build and Release APK -> Artifacts 或 Releases 页面

## 🔧 配置说明

### 环境变量设置

在 GitHub 仓库的 Settings -> Secrets and variables -> Actions 中添加以下密钥：

#### 必需的环境变量

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名访问密钥

#### 可选的环境变量（用于发布签名版本）

- `KEYSTORE_BASE64`: Base64 编码的签名密钥文件
- `KEYSTORE_PASSWORD`: 密钥库密码
- `KEY_ALIAS`: 密钥别名
- `KEY_PASSWORD`: 密钥密码

### 签名密钥生成（可选）

如果需要发布签名的 Release APK，需要生成签名密钥：

```bash
# 生成签名密钥
keytool -genkey -v -keystore release.keystore -alias your-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 转换为 Base64
base64 -i release.keystore
```

将生成的 Base64 字符串添加到 GitHub Secrets 的 `KEYSTORE_BASE64` 中。

## 🛠️ 本地构建

也可以在本地构建 APK：

### 前置要求

- Node.js 18+
- Java 17+
- Android Studio 或 Android SDK

### 构建步骤

```bash
# 1. 构建静态文件
npm run build:app

# 2. 同步到 Android 项目
npx cap sync android

# 3. 打开 Android Studio（可选）
npm run cap:open

# 4. 或者直接使用命令行构建
cd android
./gradlew assembleDebug  # Debug 版本
./gradlew assembleRelease  # Release 版本（需要签名）
```

## 📁 项目结构

```
.
├── .github/workflows/
│   ├── build-apk.yml              # 基础构建工作流
│   └── build-and-release-apk.yml  # 发布构建工作流
├── android/                       # Android 原生项目
├── out-app/                       # 构建输出的静态文件
├── capacitor.config.ts            # Capacitor 配置
├── next.config.js                 # Web 部署配置
└── next.config.app.js             # App 构建配置
```

## 🔍 工作流说明

### build-apk.yml

- **触发条件**: 推送到 main 分支、手动触发
- **构建内容**: Debug APK
- **输出**: `app-debug.apk`
- **保存时间**: 30 天

### build-and-release-apk.yml

- **触发条件**: 推送标签、手动触发
- **构建内容**: Debug APK + Release APK（如果有签名）
- **输出**: `app-debug.apk`、`app-release.apk`
- **保存时间**: Debug 30 天，Release 90 天
- **自动发布**: 创建 GitHub Release

## 🐛 常见问题

### 1. 构建失败：环境变量未设置

确保在 GitHub Secrets 中添加了所有必需的环境变量。

### 2. 构建失败：Node.js 版本不兼容

确保使用 Node.js 18+ 版本。

### 3. APK 安装失败：签名问题

Debug APK 使用调试签名，可以正常安装。Release APK 需要正确的签名配置。

### 4. 网络请求失败：跨域问题

确保 Supabase 的 CORS 设置正确配置。

## 📱 App 功能特性

- ✅ 扫码签到功能
- ✅ 活动选择和管理
- ✅ 用户状态管理
- ✅ 离线本地存储
- ✅ vConsole 调试工具（移动端）
- ✅ 响应式设计
- ✅ 自动继续扫描

## 🔄 版本更新

1. 修改代码并提交
2. 创建新标签：`git tag v1.0.1`
3. 推送标签：`git push origin v1.0.1`
4. GitHub Actions 自动构建并发布新版本

## 📞 技术支持

如有问题，请检查：

1. GitHub Actions 的构建日志
2. 环境变量配置是否正确
3. 代码是否有语法错误
4. 依赖包版本是否兼容