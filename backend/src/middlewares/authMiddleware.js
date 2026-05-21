const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// 检查 JWT_SECRET 是否设置
if (!JWT_SECRET) {
  console.error('错误: JWT_SECRET 环境变量未设置');
  process.exit(1);
}

/**
 * JWT认证中间件
 * 从Authorization header提取token，验证并挂载user信息到req.user
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const authenticateToken = (req, res, next) => {
  try {
    // 从Authorization header提取token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    // 验证token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: '无效的访问令牌'
        });
      }

      // 挂载user信息到req.user
      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };

      next();
    });
  } catch (error) {
    console.error('认证失败:', error);
    return res.status(500).json({
      success: false,
      message: '认证过程发生错误'
    });
  }
};

module.exports = {
  authenticateToken
};
