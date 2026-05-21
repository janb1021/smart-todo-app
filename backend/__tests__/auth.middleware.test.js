// 加载测试环境变量
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const request = require('supertest');
const express = require('express');
const { authenticateToken } = require('../src/middlewares/authMiddleware');

// 创建一个测试用的 Express 应用
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // 受保护的路由
  app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({
      success: true,
      message: 'Access granted',
      user: req.user
    });
  });

  return app;
};

describe('Auth Middleware Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Invalid Token Scenarios', () => {
    test('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/protected')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('访问令牌缺失');
    });

    test('should return 401 when token format is invalid', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('访问令牌缺失');
    });

    test('should return 401 when token is malformed', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('无效的访问令牌');
    });

    test('should return 401 when token has wrong signature', async () => {
      // 使用正确的格式但错误的签名
      const wrongToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE2MDAwMDAwMDB9.wrong_signature';

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${wrongToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('无效的访问令牌');
    });
  });

  describe('Valid Token Scenario', () => {
    test('should allow access with valid token', async () => {
      // 使用有效的 JWT token
      const jwt = require('jsonwebtoken');
      const validToken = jwt.sign(
        { userId: 'test-user-id', email: 'test@test.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Access granted');
      expect(response.body.user).toHaveProperty('userId', 'test-user-id');
      expect(response.body.user).toHaveProperty('email', 'test@test.com');
    });
  });

  describe('Edge Cases', () => {
    test('should handle token with Bearer prefix but empty token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('访问令牌缺失');
    });

    test('should handle case-insensitive authorization header', async () => {
      const jwt = require('jsonwebtoken');
      const validToken = jwt.sign(
        { userId: 'test-user-id', email: 'test@test.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // 使用小写的 authorization
      const response = await request(app)
        .get('/api/protected')
        .set('authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
