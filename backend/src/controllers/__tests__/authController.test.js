// 模拟外部依赖
jest.mock('@prisma/client', () => {
  const mockUser = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({
      user: mockUser,
    })),
  };
});

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed_password')),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock_jwt_token'),
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 在模块加载前设置环境变量
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';

// 获取 PrismaClient 构造函数
const { PrismaClient } = require('@prisma/client');

// 创建 prisma 实例（使用 mock）
const prisma = new PrismaClient();

// 加载控制器（在 mock 之后）
const { register, login } = require('../authController');

describe('Auth Controller - register', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('注册成功 - 应返回 201 和用户数据', async () => {
    const userData = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date().toISOString(),
    };

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(userData);

    mockReq.body = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    await register(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: '注册成功',
        data: expect.objectContaining({
          user: userData,
          // token 由 jsonwebtoken 生成
        }),
      })
    );
  });

  test('注册失败 - 缺少邮箱和密码应返回 400', async () => {
    mockReq.body = {};

    await register(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: '邮箱和密码不能为空',
      })
    );
  });

  test('注册失败 - 邮箱格式不正确应返回 400', async () => {
    mockReq.body = {
      email: 'invalid-email',
      password: 'password123',
    };

    await register(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: '邮箱格式不正确',
      })
    );
  });

  test('注册失败 - 密码太短应返回 400', async () => {
    mockReq.body = {
      email: 'test@example.com',
      password: 'short',
    };

    await register(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: '密码长度至少为8位',
      })
    );
  });

  test('注册失败 - 密码缺少字母应返回 400', async () => {
    mockReq.body = {
      email: 'test@example.com',
      password: '12345678',
    };

    await register(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: '密码必须包含至少一个字母和一个数字',
      })
    );
  });

  test('注册失败 - 密码缺少数字应返回 400', async () => {
    mockReq.body = {
      email: 'test@example.com',
      password: 'abcdefgh',
    };

    await register(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: '密码必须包含至少一个字母和一个数字',
      })
    );
  });

  test('注册失败 - 邮箱已存在应返回 400', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    mockReq.body = {
      email: 'existing@example.com',
      password: 'password123',
    };

    await register(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: '该邮箱已被注册',
      })
    );
  });

  test('注册成功 - 不传 name 字段也应成功', async () => {
    const userData = {
      id: 'user-456',
      email: 'noname@example.com',
      name: null,
      createdAt: new Date().toISOString(),
    };

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(userData);

    mockReq.body = {
      email: 'noname@example.com',
      password: 'password123',
    };

    await register(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: null,
        }),
      })
    );
  });
});

describe('Auth Controller - login', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test('登录成功 - 应返回 200 和 Token', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      createdAt: new Date().toISOString(),
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    mockReq.body = {
      email: 'test@example.com',
      password: 'correct_password',
    };

    await login(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: '登录成功',
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          }),
          // token 由 jsonwebtoken 生成
        }),
      })
    );
  });

  test('登录失败 - 缺少邮箱和密码应返回 400', async () => {
    mockReq.body = {};

    await login(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: '邮箱和密码不能为空',
      })
    );
  });

  test('登录失败 - 用户不存在应返回 401', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    mockReq.body = {
      email: 'notexist@example.com',
      password: 'password123',
    };

    await login(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: '邮箱或密码错误',
      })
    );
  });

  test('登录失败 - 密码错误应返回 401', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed_password',
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    mockReq.body = {
      email: 'test@example.com',
      password: 'wrong_password',
    };

    await login(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: '邮箱或密码错误',
      })
    );
  });

  test('登录成功 - 返回的用户数据不应包含密码字段', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      createdAt: new Date().toISOString(),
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    mockReq.body = {
      email: 'test@example.com',
      password: 'correct_password',
    };

    await login(mockReq, mockRes);

    const responseData = mockRes.json.mock.calls[0][0];
    expect(responseData.data.user.password).toBeUndefined();
  });

  test('服务器内部错误 - 应返回 500', async () => {
    prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

    mockReq.body = {
      email: 'test@example.com',
      password: 'password123',
    };

    await login(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: '服务器内部错误',
      })
    );
  });
});
