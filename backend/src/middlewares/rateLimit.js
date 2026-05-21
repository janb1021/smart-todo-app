const rateLimit = require('express-rate-limit');

const rateLimitConfig = {
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    retryAfter: 60,
  },
  headers: true,
  standardHeaders: true,
  legacyHeaders: false,
};

const createLimiter = (options = {}) => {
  return rateLimit({
    ...rateLimitConfig,
    ...options,
  });
};

const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: '登录/注册请求过于频繁，请 15 分钟后重试',
    retryAfter: 900,
  },
});

const aiLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'AI 解析请求过于频繁，每分钟最多 5 次',
    retryAfter: 60,
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  createLimiter,
};
