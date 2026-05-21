const { validateEnv } = require('./src/config/env');

// 验证环境变量（必须在其他模块之前）
if (!validateEnv()) {
  process.exit(1);
}

const express = require('express');
const cors = require('cors');

// 导入限流中间件
const { apiLimiter, authLimiter, aiLimiter } = require('./src/middlewares/rateLimit');

// 导入路由
const authRoutes = require('./src/routes/authRoutes');
const todoRoutes = require('./src/routes/todoRoutes');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./src/routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 全局 API 限流（每 15 分钟最多 200 次）
app.use('/api', apiLimiter);

// 路由（带特定限流）
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);

// 健康检查
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '智能代办助手 API 服务运行中',
    version: '1.0.0'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
