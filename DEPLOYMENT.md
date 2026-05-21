# 智能代办助手 - Render.com 部署指南

## 部署准备

### 1. 后端服务配置

**render.yaml 配置说明：**

```yaml
services:
  - type: web
    name: smart-todo-backend
    env: node
    plan: starter
    buildCommand: |
      npm install
      npx prisma generate
      npx prisma migrate deploy
    startCommand: npm start
```

### 2. 前端静态站点配置

```yaml
services:
  - type: web
    name: smart-todo-frontend
    env: static
    plan: starter
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
```

### 3. 数据库配置

```yaml
databases:
  - name: smart-todo-db
    databaseName: smarttodo
    user: smarttodo
    plan: starter
```

## 环境变量列表

| 变量名 | 说明 | 值来源 |
|--------|------|--------|
| `DATABASE_URL` | 数据库连接字符串 | Render 数据库服务自动提供 |
| `DATABASE_PROVIDER` | 数据库类型 | `postgresql` |
| `JWT_SECRET` | JWT 签名密钥 | Render 自动生成 |
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `10000` |
| `VITE_API_URL` | 后端 API 地址 | 自动引用后端服务 URL |

## 部署步骤

### 步骤 1：创建数据库

1. 登录 Render.com
2. 进入 Dashboard
3. 点击 "New" -> "PostgreSQL"
4. 配置数据库：
   - Name: `smart-todo-db`
   - Database Name: `smarttodo`
   - User: `smarttodo`
   - Plan: Starter

### 步骤 2：部署后端服务

1. 点击 "New" -> "Web Service"
2. 连接 GitHub 仓库
3. 配置：
   - Name: `smart-todo-backend`
   - Environment: Node
   - Build Command: 
     ```
     npm install
     npx prisma generate
     npx prisma migrate deploy
     ```
   - Start Command: `npm start`
4. 添加环境变量：
   - `DATABASE_URL`: 从数据库服务获取连接字符串
   - `DATABASE_PROVIDER`: `postgresql`
   - `JWT_SECRET`: 生成一个随机密钥
   - `NODE_ENV`: `production`
   - `PORT`: `10000`

### 步骤 3：部署前端服务

1. 点击 "New" -> "Static Site"
2. 连接 GitHub 仓库
3. 配置：
   - Name: `smart-todo-frontend`
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
4. 添加环境变量：
   - `VITE_API_URL`: 后端服务的 URL（格式：`https://smart-todo-backend.onrender.com/api`）

### 步骤 4：自动部署（使用 render.yaml）

推荐使用 `render.yaml` 一键部署：

1. 在项目根目录创建 `render.yaml`
2. 登录 Render.com
3. 点击 "New" -> "Blueprints"
4. 连接 GitHub 仓库并选择 `render.yaml`
5. Render 将自动创建数据库、后端和前端服务

## 数据库迁移命令

```bash
# 开发环境
npx prisma migrate dev

# 生产环境
npx prisma migrate deploy
```

## 注意事项

1. **数据库连接**: 确保 PostgreSQL 数据库已正确配置
2. **JWT_SECRET**: 使用安全的随机字符串，至少 32 位
3. **端口配置**: Render 使用 10000-10999 端口范围
4. **构建缓存**: Render 会自动缓存 `node_modules`，加快构建速度
5. **HTTPS**: Render 自动提供 SSL 证书，所有服务使用 HTTPS

## 健康检查

后端服务启动后，可以通过以下 URL 验证：
- 健康检查: `https://<your-backend-url>/`
- API 文档: `https://<your-backend-url>/api/auth/register`（POST）

## 故障排查

### 常见问题

1. **数据库连接失败**:
   - 检查 `DATABASE_URL` 是否正确
   - 确认数据库已启动
   - 检查防火墙设置

2. **构建失败**:
   - 检查 Node.js 版本（推荐 18+）
   - 检查依赖安装是否成功
   - 查看构建日志

3. **前端无法访问 API**:
   - 检查 `VITE_API_URL` 是否正确
   - 确认后端服务已启动
   - 检查 CORS 配置