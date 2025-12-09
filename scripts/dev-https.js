const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 检查是否安装了 mkcert
try {
  execSync('mkcert --version', { stdio: 'ignore' });
  console.log('✅ mkcert 已安装');
} catch (error) {
  console.log('❌ mkcert 未安装');
  console.log('请先安装 mkcert:');
  console.log('  Windows: choco install mkcert');
  console.log('  macOS: brew install mkcert');
  console.log('  Linux: sudo apt install mkcert');
  console.log('\n然后运行:');
  console.log('  mkcert -install');
  process.exit(1);
}

// 创建证书目录
const certDir = path.join(__dirname, '../certs');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

// 生成证书
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('🔐 生成本地 HTTPS 证书...');
  try {
    execSync(`mkcert -key-file "${keyPath}" -cert-file "${certPath}" localhost 127.0.0.1 192.168.1.157`, { stdio: 'inherit' });
    console.log('✅ 证书生成成功');
  } catch (error) {
    console.error('❌ 证书生成失败:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ 证书已存在');
}

// 更新 package.json 的 dev 脚本
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 备份原始脚本
if (!packageJson.scripts.devBackup) {
  packageJson.scripts.devBackup = packageJson.scripts.dev;
}

// 设置 HTTPS 开发脚本
packageJson.scripts.dev = `next dev -H 0.0.0.0 --experimental-https --experimental-https-key "${keyPath}" --experimental-https-cert "${certPath}"`;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ 开发脚本已更新为 HTTPS 模式');
console.log('\n🚀 现在可以运行: npm run dev');
console.log('📱 手机访问地址: https://192.168.1.157:3000');