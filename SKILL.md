# 智能待办助手项目规则

## 代码风格

### 后端
- 使用 **2空格** 缩进
- 使用 ES6+ 语法
- 优先使用 `async/await` 处理异步操作
- 变量命名使用 **驼峰命名法**（camelCase）
- 函数命名使用 **驼峰命名法**（camelCase）
- 常量命名使用 **全大写+下划线**（UPPER_CASE）
- 文件名使用 **小写+连字符**（kebab-case）

### 前端
- 使用 **函数组件 + Hooks**
- 使用 **Tailwind CSS** 进行样式开发
- 使用 **ESLint** 进行代码检查
- 使用 **Prettier** 进行代码格式化
- 组件命名使用 **帕斯卡命名法**（PascalCase）
- 文件名使用 **帕斯卡命名法**（PascalCase）

---

## 架构约束

### 后端架构
遵循 **MVC模式**：`Controller → Service → Model`

**目录结构：**
```
backend/
├── server.js          # 服务器入口
├── routes/            # Controller层 - 路由处理
├── middleware/        # 中间件
├── config/            # 配置文件
└── node_modules/      # 依赖包
```

### API响应格式
所有API响应格式统一：
```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

### 错误处理
- 所有错误必须包含 **日志记录**
- 错误响应必须包含明确的错误信息
- HTTP状态码规范：
  - 400: 请求参数错误
  - 401: 未授权（令牌缺失）
  - 403: 禁止访问（权限不足）
  - 404: 资源不存在
  - 500: 服务器内部错误

---

## 安全规范

### 密码安全
- 使用 **bcrypt** 加密密码，强度为 **10**
- 禁止存储明文密码
- 密码长度至少 **6位**

### JWT安全
- JWT有效期为 **7天**
- Token必须存储在 **localStorage**
- 请求时在 **Authorization** 头部携带Token

### 敏感信息保护
- 禁止在前端存储敏感信息（密码、密钥等）
- API密钥必须通过环境变量配置
- 禁止在日志中记录敏感信息

---

## 测试要求

### 后端测试
- 关键API必须有 **单元测试**（使用 Jest）
- 测试覆盖率至少达到 **80%**
- 测试文件与源码文件同级，命名为 `*.test.js`

### 前端测试
- 核心组件必须有 **快照测试**
- 使用 **React Testing Library** 进行组件测试
- 测试文件放在 `__tests__/` 目录下

---

## 开发流程

### Git工作流
- 使用 **Git Flow** 工作流
- 分支命名规范：
  - `feature/xxx`: 功能开发分支
  - `bugfix/xxx`: Bug修复分支
  - `hotfix/xxx`: 紧急修复分支

### 代码提交规范
提交信息格式：
```
<类型>(<模块>): <描述>

<详细说明（可选）>
```

**类型说明：**
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不新增功能也不修复Bug）
- `test`: 测试相关
- `chore`: 构建/工具相关

---

## 环境配置

### 开发环境
- Node.js 版本 >= 20.x
- 数据库使用 **PostgreSQL 16.x**
- 前端开发服务器端口：**5173**
- 后端开发服务器端口：**3000**

### 环境变量
后端必须配置以下环境变量：
```env
DATABASE_URL="postgresql://username:password@localhost:5432/smart_todo?schema=public"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

---

## 部署规范

### 构建要求
- 前端构建命令：`npm run build`
- 后端无需构建，直接运行
- 构建产物必须放在 `dist/` 目录

### 生产环境
- 使用 **Docker** 容器化部署
- 配置 **Nginx** 作为反向代理
- 启用 **HTTPS**
- 配置 **CDN** 加速静态资源