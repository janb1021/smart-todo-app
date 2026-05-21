const {
  generateToken,
  verifyToken,
  decodeToken,
  JWT_SECRET,
  JWT_EXPIRES_IN,
} = require('../jwt');

const jwt = require('jsonwebtoken');

describe('JWT 工具函数', () => {
  const testPayload = { userId: 'test-user-123', email: 'test@example.com' };

  describe('generateToken', () => {
    test('应成功生成 JWT Token', () => {
      const token = generateToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // JWT 由三部分组成，用 . 分隔
      expect(token.split('.').length).toBe(3);
    });

    test('生成的 Token 应包含正确的载荷', () => {
      const token = generateToken(testPayload);
      const decoded = decodeToken(token);

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.iat).toBeDefined(); // 签发时间
      expect(decoded.exp).toBeDefined(); // 过期时间
    });

    test('不同载荷应生成不同的 Token', () => {
      const token1 = generateToken({ userId: 'user-1' });
      const token2 = generateToken({ userId: 'user-2' });

      expect(token1).not.toBe(token2);
    });

    test('空载荷也应能生成 Token', () => {
      const token = generateToken({});
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    let validToken;

    beforeEach(() => {
      validToken = generateToken(testPayload);
    });

    test('应成功验证有效的 Token', () => {
      const decoded = verifyToken(validToken);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    test('应返回 null 对于无效的 Token', () => {
      const result = verifyToken('invalid.token.here');

      expect(result).toBeNull();
    });

    test('应返回 null 对于空字符串', () => {
      const result = verifyToken('');

      expect(result).toBeNull();
    });

    test('应返回 null 对于被篡改的 Token', () => {
      // 篡改 Token 的最后一部分（签名）
      const parts = validToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tamperedsignature`;

      const result = verifyToken(tamperedToken);

      expect(result).toBeNull();
    });

    test('应返回 null 对于过期的 Token', () => {
      // 创建一个已过期的 Token (-1秒)
      const expiredToken = jwt.sign(
        testPayload,
        JWT_SECRET,
        { expiresIn: -1 }
      );

      const result = verifyToken(expiredToken);

      expect(result).toBeNull();
    });
  });

  describe('decodeToken', () => {
    test('应解码有效的 Token', () => {
      const token = generateToken(testPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
    });

    test('应解码无效格式的 Token 而不抛出异常', () => {
      const decoded = decodeToken('not-a-valid-jwt');

      expect(decoded).toBeNull();
    });

    test('应解码被篡改签名的 Token（不验证签名）', () => {
      const token = generateToken(testPayload);
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tamperedsignature`;

      const decoded = decodeToken(tamperedToken);

      // decode 不验证签名，所以应该能解码载荷
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
    });
  });

  describe('Token 结构', () => {
    test('Token 应包含 Header 部分', () => {
      const token = generateToken(testPayload);
      const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());

      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');
    });

    test('Token 应包含 Payload 部分', () => {
      const token = generateToken(testPayload);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      expect(payload.userId).toBe(testPayload.userId);
      expect(payload.email).toBe(testPayload.email);
    });
  });
});
