#!/bin/bash

# 国内部署脚本 - 宇哥扫码项目
# 使用方法: ./deploy.sh [server-ip] [domain]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ $# -lt 1 ]; then
    echo "使用方法: ./deploy.sh <服务器IP> [域名]"
    echo "示例: ./deploy.sh 123.456.789.0 yourdomain.com"
    exit 1
fi

SERVER_IP=$1
DOMAIN=${2:-""}

print_info "开始部署到服务器: $SERVER_IP"

# 检查本地环境
if ! command -v git &> /dev/null; then
    print_error "请先安装Git"
    exit 1
fi

if ! command -v ssh &> /dev/null; then
    print_error "请先安装SSH客户端"
    exit 1
fi

# 创建部署目录
DEPLOY_DIR="./deploy_temp"
if [ -d "$DEPLOY_DIR" ]; then
    rm -rf $DEPLOY_DIR
fi
mkdir $DEPLOY_DIR

print_info "准备部署文件..."

# 复制必要文件
cp -r src $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp package*.json $DEPLOY_DIR/
cp next.config.js $DEPLOY_DIR/
cp tailwind.config.ts $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/
cp postcss.config.js $DEPLOY_DIR/
cp .dockerignore $DEPLOY_DIR/
cp Dockerfile $DEPLOY_DIR/
cp docker-compose.yml $DEPLOY_DIR/
cp nginx.conf $DEPLOY_DIR/
cp DOMESTIC_DEPLOYMENT_GUIDE.md $DEPLOY_DIR/

# 创建部署脚本
cat > $DEPLOY_DIR/server-setup.sh << 'EOF'
#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info "开始服务器环境配置..."

# 更新系统
print_info "更新系统包..."
apt update && apt upgrade -y

# 安装Node.js
print_info "安装Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    print_warning "Node.js已安装"
fi

# 安装PM2
print_info "安装PM2..."
npm install -g pm2

# 安装Nginx
print_info "安装Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
else
    print_warning "Nginx已安装"
fi

# 配置防火墙
print_info "配置防火墙..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

print_info "服务器环境配置完成！"
EOF

chmod +x $DEPLOY_DIR/server-setup.sh

# 创建应用部署脚本
cat > $DEPLOY_DIR/app-deploy.sh << EOF
#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "\${GREEN}[INFO]\${NC} \$1"
}

print_warning() {
    echo -e "\${YELLOW}[WARNING]\${NC} \$1"
}

print_info "开始部署应用..."

# 停止现有应用
if pm2 list | grep -q "event-checkin"; then
    print_warning "停止现有应用..."
    pm2 stop event-checkin
    pm2 delete event-checkin
fi

# 备份现有代码
if [ -d "event-checkin" ]; then
    print_warning "备份现有代码..."
    mv event-checkin event-checkin-backup-\$(date +%Y%m%d%H%M%S)
fi

# 创建应用目录
mkdir -p event-checkin
cd event-checkin

# 复制应用文件
print_info "复制应用文件..."
cp -r ../src .
cp -r ../public .
cp ../package*.json .
cp ../next.config.js .
cp ../tailwind.config.ts .
cp ../tsconfig.json .
cp ../postcss.config.js .

# 配置环境变量
print_warning "请配置环境变量..."
cat > .env << EOFE
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://lpbkoksinwcmoniamsvq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYmtva3NpbndjbW9uaWFtc3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzAzNjEsImV4cCI6MjA4MDI0NjM2MX0.Be8NAJ8jdZtdl3cTwtsJbjphcePUf7gFHPbxEXjc1_Q
PORT=3000
EOFE

# 安装依赖
print_info "安装依赖..."
npm install --registry=https://registry.npmmirror.com/

# 构建应用
print_info "构建应用..."
npm run build

# 创建PM2配置
print_info "创建PM2配置..."
cat > ecosystem.config.js << 'EOFP'
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
EOFP

# 创建日志目录
mkdir -p logs

# 启动应用
print_info "启动应用..."
pm2 start ecosystem.config.js
pm2 save

# 配置PM2开机启动
pm2 startup

print_info "应用部署完成！"
print_info "应用状态: http://localhost:3000"
pm2 status
EOF

chmod +x $DEPLOY_DIR/app-deploy.sh

# 创建Nginx配置脚本
if [ ! -z "$DOMAIN" ]; then
    cat > $DEPLOY_DIR/nginx-setup.sh << EOF
#!/bin/bash

set -e

GREEN='\033[0;32m'
NC='\033[0m'

print_info() {
    echo -e "\${GREEN}[INFO]\${NC} \$1"
}

DOMAIN="$DOMAIN"

print_info "配置Nginx反向代理..."

# 创建Nginx站点配置
cat > /etc/nginx/sites-available/event-checkin << 'EOFN'
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOFN

# 启用站点
ln -sf /etc/nginx/sites-available/event-checkin /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重载Nginx
systemctl reload nginx

print_info "Nginx配置完成！"
print_info "访问地址: http://$DOMAIN"
EOF

    chmod +x $DEPLOY_DIR/nginx-setup.sh
fi

print_info "上传文件到服务器..."

# 上传文件到服务器
scp -r $DEPLOY_DIR/* root@$SERVER_IP:/tmp/

print_info "执行服务器环境配置..."

# 执行服务器配置
ssh root@$SERVER_IP "chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh"

print_info "部署应用..."

# 执行应用部署
ssh root@$SERVER_IP "chmod +x /tmp/app-deploy.sh && cd /root && /tmp/app-deploy.sh"

# 配置Nginx（如果有域名）
if [ ! -z "$DOMAIN" ]; then
    print_info "配置Nginx..."
    ssh root@$SERVER_IP "chmod +x /tmp/nginx-setup.sh && /tmp/nginx-setup.sh"
fi

# 清理临时文件
rm -rf $DEPLOY_DIR

print_info "部署完成！"
echo "----------------------------------------"
echo "服务器IP: $SERVER_IP"
if [ ! -z "$DOMAIN" ]; then
    echo "访问域名: http://$DOMAIN"
fi
echo "应用状态: ssh root@$SERVER_IP 'pm2 status'"
echo "查看日志: ssh root@$SERVER_IP 'pm2 logs'"
echo "----------------------------------------"
print_warning "请确保域名解析指向服务器IP（如果使用了域名）"
print_warning "建议配置SSL证书以启用HTTPS"