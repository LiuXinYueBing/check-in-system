# 🇨🇳 国内部署指南

## 📋 部署方案对比

| 方案 | 优点 | 缺点 | 适用场景 | 成本 |
|------|------|------|----------|------|
| **云服务器+PM2** | 性能最佳、完全控制 | 需要运维知识 | 企业级应用 | 50-200元/月 |
| **Docker部署** | 环境一致、易于扩展 | 需要Docker知识 | 容器化部署 | 服务器费用 |
| **腾讯云轻量应用** | 一键部署、管理简单 | 灵活性稍差 | 快速上线 | 24-120元/月 |
| **阿里云ECS** | 稳定可靠、服务完善 | 成本较高 | 企业级部署 | 100-500元/月 |

---

### 1.1 服务器准备

```bash
# 1. 购买云服务器
# 推荐配置: 2核4G, Ubuntu 20.04 LTS
# 腾讯云: https://cloud.tencent.com/product/lighthouse
# 阿里云: https://www.aliyun.com/product/ecs

# 2. 连接服务器
ssh root@your-server-ip

# 3. 更新系统
sudo apt update && sudo apt upgrade -y

# 4. 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 5. 验证安装
node -v  # 应显示v18.x.x
npm -v   # 应显示9.x.x

# 6. 安装PM2进程管理器
sudo npm install -g pm2

# 7. 安装Nginx
sudo apt install nginx -y

# 8. 配置防火墙
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 1.2 部署应用

```bash
# 1. 克隆项目代码
git clone https://github.com/yourusername/event-checkin.git
cd event-checkin

# 2. 使用国内镜像安装依赖
npm install --registry=https://registry.npmmirror.com/

# 3. 配置环境变量
cp .env.example .env
nano .env

# 填入以下内容：
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 4. 构建应用
npm run build

# 5. 测试启动
npm start
# 访问 http://your-server-ip:3000 测试
```

### 1.3 PM2进程管理

```bash
# 1. 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'event-checkin',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# 2. 创建日志目录
mkdir -p logs

# 3. 启动应用
pm2 start ecosystem.config.js

# 4. 保存PM2配置
pm2 save
pm2 startup

# 5. 监控应用状态
pm2 status
pm2 monit
```

### 1.4 Nginx反向代理

```bash
# 1. 创建Nginx站点配置
sudo nano /etc/nginx/sites-available/event-checkin

# 2. 配置内容
server {
    listen 80;
    server_name yourdomain.com;  # 替换为你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# 3. 启用站点
sudo ln -s /etc/nginx/sites-available/event-checkin /etc/nginx/sites-enabled/

# 4. 删除默认站点
sudo rm /etc/nginx/sites-enabled/default

# 5. 测试配置
sudo nginx -t

# 6. 重载Nginx
sudo systemctl reload nginx
```

---

## 🐳 方案2: Docker部署

### 2.1 准备工作

```bash
# 1. 安装Docker
curl -fsSL https://get.docker.com | bash

# 2. 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2.2 构建和运行

```bash
# 1. 创建环境变量文件
cp .env.example .env
# 编辑.env文件，填入实际值

# 2. 构建镜像
docker build -t event-checkin .

# 3. 运行容器
docker run -d \
  --name event-checkin \
  -p 3000:3000 \
  --env-file .env \
  event-checkin

# 或使用docker-compose
docker-compose up -d
```

### 2.3 配置Nginx反向代理

```bash
# 1. 安装Nginx
sudo apt update
sudo apt install nginx

# 2. 配置站点
sudo cp nginx.conf /etc/nginx/sites-available/event-checkin
sudo ln -s /etc/nginx/sites-available/event-checkin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 3. 配置防火墙
sudo ufw allow 'Nginx Full'
```

### 2.4 SSL证书配置

```bash
# 使用Let's Encrypt免费证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## ☁️ 方案3: 腾讯云Webify

### 3.1 准备代码

```bash
# 1. 确保next.config.js配置正确
# output: 'export' 已设置

# 2. 推送到GitHub/Gitee
git add .
git commit -m "Ready for Webify deployment"
git push origin main
```

### 3.2 Webify部署步骤

1. **登录腾讯云控制台**
   - 访问: https://console.cloud.tencent.com/webify
   - 使用腾讯云账号登录

2. **创建应用**
   - 点击"新建应用"
   - 选择"静态网站"
   - 关联GitHub/Gitee仓库

3. **配置构建设置**
   - 框架: Next.js
   - 构建命令: `npm run build:static`
   - 输出目录: `out`
   - Node版本: 18

4. **设置环境变量**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

5. **部署**
   - 点击"部署"
   - 等待构建完成
   - 获得部署URL

---

## 🖥️ 方案4: 云服务器部署

### 4.1 服务器准备

```bash
# 1. 购买云服务器
# 推荐配置: 2核4G, CentOS/Ubuntu

# 2. 连接服务器
ssh root@your-server-ip

# 3. 更新系统
sudo apt update && sudo apt upgrade -y

# 4. 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 5. 安装PM2
sudo npm install -g pm2
```

### 4.2 部署应用

```bash
# 1. 克隆代码
git clone https://github.com/yourusername/event-checkin.git
cd event-checkin

# 2. 安装依赖
npm install --registry=https://registry.npmmirror.com/

# 3. 构建应用
npm run build

# 4. 配置环境变量
cp .env.example .env
nano .env
```

### 4.3 PM2进程管理

```bash
# 1. 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'event-checkin',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 2. 启动应用
pm2 start ecosystem.config.js

# 3. 保存PM2配置
pm2 save
pm2 startup
```

### 4.4 Nginx配置

```bash
# 1. 创建站点配置
sudo nano /etc/nginx/sites-available/event-checkin

# 2. 配置内容
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 3. 启用站点
sudo ln -s /etc/nginx/sites-available/event-checkin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔧 环境变量配置

### 开发环境 (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 生产环境
```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📱 国内CDN配置

### 腾讯云CDN
```bash
# 1. 登录腾讯云CDN控制台
# 2. 添加加速域名
# 3. 配置源站信息
# 4. 开启HTTPS
# 5. 配置缓存规则
```

### 阿里云CDN
```bash
# 1. 登录阿里云CDN控制台
# 2. 添加域名
# 3. 配置CNAME
# 4. 设置缓存策略
```

---

## 🔍 域名解析配置

### 域名解析记录
```dns
# A记录 (直接解析到服务器IP)
@ A 你的服务器IP

# CNAME记录 (解析到CDN)
www CNAME 你的CDN域名

# MX记录 (邮件服务)
@ MX 10 mx.qiye.aliyun.com
```

---

## 📊 监控和维护

### 1. 应用监控
```bash
# PM2监控
pm2 monit

# 查看日志
pm2 logs

# 重启应用
pm2 restart event-checkin
```

### 2. 服务器监控
```bash
# 系统资源
htop
df -h
free -m

# 网络状态
netstat -tulpn
ss -tulpn
```

### 3. 日志管理
```bash
# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 应用日志
tail -f logs/combined.log
```

---

## 🚨 故障排查

### 常见问题及解决方案

1. **端口被占用**
```bash
sudo lsof -i :3000
sudo kill -9 PID
```

2. **权限问题**
```bash
sudo chown -R $USER:$USER /path/to/app
chmod -R 755 /path/to/app
```

3. **防火墙问题**
```bash
sudo ufw allow 3000
sudo ufw allow 80
sudo ufw allow 443
```

4. **域名解析问题**
```bash
nslookup yourdomain.com
ping yourdomain.com
```

5. **SSL证书问题**
```bash
sudo certbot renew --dry-run
sudo systemctl reload nginx
```

---

## 📈 性能优化

### 1. 前端优化
- 启用Gzip压缩
- 配置CDN加速
- 优化图片资源
- 开启浏览器缓存

### 2. 后端优化
- 使用PM2集群模式
- 配置Redis缓存
- 数据库连接池
- 负载均衡

### 3. 网络优化
- 使用BGP线路
- 多地部署
- 智能DNS解析

---

## 💰 成本估算

### 静态托管
- **腾讯云COS**: 存储 0.12元/GB/月, 流量 0.5元/GB
- **阿里云OSS**: 存储 0.12元/GB/月, 流量 0.5元/GB
- **月费用预估**: 10-50元

### 云服务器
- **入门配置**: 2核2G, 50元/月
- **推荐配置**: 2核4G, 100元/月
- **高配方案**: 4核8G, 200元/月

### CDN费用
- **流量费用**: 0.2-0.5元/GB
- **月费用预估**: 20-100元

---

## 🎯 推荐方案

根据项目特点，推荐以下部署方案：

### 小团队/个人项目
**静态托管 + 腾讯云COS**
- 成本低
- 维护简单
- 性能良好

### 企业级项目
**云服务器 + Nginx + PM2 + CDN**
- 性能最佳
- 可靠性高
- 便于扩展

### 快速验证
**腾讯云Webify**
- 部署简单
- 免费额度
- 自动CI/CD

---

## 📞 技术支持

如遇到部署问题，可以：

1. 查看项目文档
2. 搜索GitHub Issues
3. 咨询云服务厂商技术支持
4. 寻求专业技术团队帮助

---

*部署完成后，请记得进行功能测试，确保所有功能正常运行！*