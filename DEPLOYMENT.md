# 部署方案

## 架构概述

本项目采用前后端分离架构：

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                            │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   前端（静态托管）                            │
│  - GitHub Pages (免费)                                      │
│  - Cloudflare Pages (免费)                                  │
│  - Vercel (免费套餐)                                        │
│  - Netlify (免费套餐)                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │ API 请求 (需要配置 CORS)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   后端 API (Node.js)                        │
│  - 云服务器 (AWS, GCP, Azure, DigitalOcean)                │
│  - Railway (Node.js 托管)                                   │
│  - Render (免费套餐)                                         │
│  - Fly.io (免费配额)                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   SQLite 数据库 (文件)                        │
│  - 随着数据增长可迁移到 PostgreSQL/MySQL                     │
└─────────────────────────────────────────────────────────────┘
```

## 方案一：GitHub Pages + 独立后端（推荐）

### 前端部署到 GitHub Pages

1. 在 GitHub 创建仓库
2. 推送代码到仓库
3. 在仓库 Settings > Pages 中选择 `gh-pages` 分支
4. 访问 `https://yourusername.github.io/repository-name`

### 后端部署

#### 选项 A: Railway（最简单）

1. 注册 [Railway](https://railway.app)
2. 连接 GitHub 仓库
3. 选择 `backend` 文件夹作为根目录
4. 设置环境变量：
   - `PORT=8000`
   - `ENCRYPTION_KEY=your-32-char-strong-key`
   - `ONCHAINOS_PATH=/usr/local/bin/onchainos`
5. 部署后获得 URL: `https://your-app.railway.app`

#### 选项 B: DigitalOcean App Platform

1. 创建 DigitalOcean 账号
2. 创建 App，选择 GitHub 仓库
3. 设置构建命令：`cd backend && npm install`
4. 设置运行命令：`cd backend && node server.js`
5. 添加环境变量
6. 部署获得 URL

#### 选项 C: 手动部署到 VPS

```bash
# 在服务器上安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 克隆并安装
git clone https://github.com/yourusername/blockchain-dashboard.git
cd blockchain-dashboard/backend
npm install

# 设置环境变量
export ENCRYPTION_KEY="your-32-char-strong-key-here"
export PORT=8000

# 使用 PM2 运行
npm install -g pm2
pm2 start server.js --name blockchain-dashboard

# 配置 Nginx 反向代理
```

### 前端配置后端 URL

在 `src/webapp/.env.production` 文件中设置：

```
VITE_API_BASE_URL=https://your-backend.railway.app/api
```

然后重新构建部署。

## 方案二：Vercel 前端 + Railway 后端

### 前端部署到 Vercel

1. 注册 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库
3. 设置 Root Directory 为 `src/webapp`
4. 设置 Environment Variables:
   - `VITE_API_BASE_URL=https://your-backend.railway.app/api`
5. Deploy

## 方案三：Docker 部署

### 使用 Docker Compose（适合 VPS）

```bash
# 克隆代码
git clone https://github.com/yourusername/blockchain-dashboard.git
cd blockchain-dashboard

# 启动服务
docker-compose up -d
```

### 使用 Docker 单独部署后端

```bash
# 构建镜像
docker build -t blockchain-dashboard-backend .

# 运行容器
docker run -d \
  -p 8000:8000 \
  -e ENCRYPTION_KEY="your-32-char-strong-key" \
  -e PORT=8000 \
  blockchain-dashboard-backend
```

## 环境变量配置

### 必须设置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `ENCRYPTION_KEY` | 加密密钥（至少32字符） | `MyStr0ng!Encrypti0nKey#2026` |
| `PORT` | 服务端口 | `8000` |

### 可选设置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `ONCHAINOS_PATH` | onchainos CLI 路径 | (必须设置才能使用 meme 功能) |
| `NODE_ENV` | 运行环境 | `development` |
| `DATABASE_URL` | 数据库连接字符串 | `sqlite:///database.db` |

## CORS 配置

后端已配置允许以下来源的 CORS 请求：

- `http://localhost:3000` (开发)
- `http://localhost:5173` (Vite 开发)
- GitHub Pages 域名
- Vercel 域名

如需添加其他域名，修改 `backend/server.js` 中的 CORS 配置。

## 数据库迁移

首次部署后运行迁移脚本：

```bash
cd backend
npm install

# 导出浏览器数据后运行迁移
node migrate-data.js
```

## 监控和日志

### PM2 监控

如果使用 PM2 部署：

```bash
pm2 monit          # 查看实时监控
pm2 logs blockchain-dashboard  # 查看日志
pm2 status         # 查看状态
```

### 健康检查

部署后访问：`https://your-backend.railway.app/api/health`

## 故障排除

### CORS 错误

确保后端的 CORS 配置包含你的前端域名。

### 数据库连接错误

检查 `DATABASE_URL` 环境变量是否正确。

### 加密密钥错误

确保 `ENCRYPTION_KEY` 至少 32 字符，包含大小写字母、数字和特殊字符。

## 更新部署

### 前端更新

重新部署 GitHub Actions 会自动构建和部署。

### 后端更新

使用 PM2：
```bash
git pull
cd backend && npm install
pm2 restart blockchain-dashboard
```

使用 Docker：
```bash
docker pull yourusername/blockchain-dashboard-backend
docker-compose up -d
```