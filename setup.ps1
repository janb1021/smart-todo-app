# 智能代办助手 - PowerShell 初始化脚本

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  智能代办助手 - 项目初始化脚本" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 创建目录结构
Write-Host ""
Write-Host "[1/6] 创建目录结构..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "frontend\src\components\Layout" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend\src\pages\Auth" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend\src\pages\Todos" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend\src\pages\Dashboard" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend\src\context" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend\src\api" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\routes" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\middleware" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\config" | Out-Null
New-Item -ItemType Directory -Force -Path "prisma" | Out-Null
Write-Host "✅ 目录结构创建完成" -ForegroundColor Green

# 初始化后端项目
Write-Host ""
Write-Host "[2/6] 初始化后端项目..." -ForegroundColor Yellow
Set-Location backend
npm install
Write-Host "✅ 后端依赖安装完成" -ForegroundColor Green

# 初始化前端项目
Write-Host ""
Write-Host "[3/6] 初始化前端项目..." -ForegroundColor Yellow
Set-Location ..\frontend
npm install
Write-Host "✅ 前端依赖安装完成" -ForegroundColor Green

# 安装 Prisma
Write-Host ""
Write-Host "[4/6] 安装 Prisma..." -ForegroundColor Yellow
Set-Location ..
npm install -D prisma@5.14.0
Write-Host "✅ Prisma 安装完成" -ForegroundColor Green

# 生成 Prisma 客户端
Write-Host ""
Write-Host "[5/6] 生成 Prisma 客户端..." -ForegroundColor Yellow
npx prisma generate
Write-Host "✅ Prisma 客户端生成完成" -ForegroundColor Green

# 运行数据库迁移
Write-Host ""
Write-Host "[6/6] 运行数据库迁移..." -ForegroundColor Yellow
npx prisma migrate dev --name init
Write-Host "✅ 数据库迁移完成" -ForegroundColor Green

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  项目初始化完成！" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "启动命令：" -ForegroundColor Yellow
Write-Host "  后端: cd backend; npm start" -ForegroundColor White
Write-Host "  前端: cd frontend; npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "访问地址：" -ForegroundColor Yellow
Write-Host "  前端: http://localhost:5173" -ForegroundColor White
Write-Host "  后端: http://localhost:3000" -ForegroundColor White