#!/bin/bash

echo "=============================================="
echo "  智能代办助手 - 项目初始化脚本"
echo "=============================================="

# 创建目录结构
echo ""
echo "[1/5] 创建目录结构..."
mkdir -p frontend/src/{components/Layout,pages/{Auth,Todos,Dashboard},context,api}
mkdir -p backend/{routes,middleware,config}
mkdir -p prisma

# 初始化后端项目
echo ""
echo "[2/5] 初始化后端项目..."
cd backend
npm install
echo "✅ 后端依赖安装完成"

# 初始化前端项目
echo ""
echo "[3/5] 初始化前端项目..."
cd ../frontend
npm install
echo "✅ 前端依赖安装完成"

# 配置Prisma
echo ""
echo "[4/5] 配置Prisma..."
cd ..
npx prisma init
echo "✅ Prisma初始化完成"

# 配置环境变量
echo ""
echo "[5/5] 配置环境变量..."
cat > .env << EOF
DATABASE_URL="postgresql://username:password@localhost:5432/smart_todo?schema=public"
JWT_SECRET="your-secret-key-here"
PORT=3000
EOF
echo "✅ 环境变量配置完成"

echo ""
echo "=============================================="
echo "  项目初始化完成！"
echo "=============================================="
echo ""
echo "接下来请执行："
echo "1. 修改 .env 文件中的数据库连接信息"
echo "2. 创建数据库：createdb smart_todo"
echo "3. 运行数据库迁移：npx prisma migrate dev"
echo "4. 启动后端：cd backend && npm start"
echo "5. 启动前端：cd frontend && npm run dev"