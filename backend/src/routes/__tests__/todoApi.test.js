// ============================================================
// 重要：必须在所有 import 之前设置环境变量！
// ============================================================

// 设置数据库路径 - 使用项目实际的数据库文件
const path = require('path');
// 测试文件位置: backend/src/routes/__tests__/
// 数据库位置: prisma/dev.db
// 需要向上4级: __tests__ → routes → src → backend → 项目根 → prisma
process.env.DATABASE_URL = `file:${path.resolve(__dirname, '../../../../prisma/dev.db')}`;
process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests';

// 现在可以安全地导入其他模块了
const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// 创建 Express 应用实例
const app = express();
app.use(express.json());

// 导入路由（此时 todoController 会使用正确的 DATABASE_URL）
const todoRoutes = require('../todoRoutes');

// 挂载路由
app.use('/api/todos', todoRoutes);

// 创建 Prisma 客户端（用于测试数据准备/清理）
let prisma;

// 测试用户数据
const testUser = {
  id: 'test-user-integration-' + Date.now(),
  email: `test-integration-${Date.now()}@example.com`,
  name: 'Test Integration User',
  password: 'testPassword123', // 必填字段
};

// 生成有效的 JWT Token
function generateValidToken(user = testUser) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Todo API 集成测试', () => {
  let validToken;

  beforeAll(async () => {
    // 使用相同的数据库 URL 创建 Prisma 客户端
    prisma = new PrismaClient();
    await prisma.$connect();

    // 创建测试用户（如果不存在）
    try {
      const existingUser = await prisma.user.findUnique({ where: { id: testUser.id } });
      if (!existingUser) {
        await prisma.user.create({ data: testUser });
      }
    } catch (error) {
      console.error('Error creating test user:', error.message);
    }

    // 生成有效 token
    validToken = generateValidToken();
  });

  afterAll(async () => {
    // 清理测试用户创建的数据
    try {
      await prisma.todo.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    } catch (error) {}
    
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  describe('POST /api/todos - 创建待办', () => {
    test('应成功创建待办 - 返回 201', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: '测试待办事项',
          description: '这是一个测试描述',
          priority: 'high',
          category: '工作',
          dueDate: '2024-12-31',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('待办创建成功');
      expect(response.body.data.title).toBe('测试待办事项');
      expect(response.body.data.priority).toBe('high');
      expect(response.body.data.category).toBe('工作');
      expect(response.body.data.userId).toBe(testUser.id);
    });

    test('缺少标题应返回 400', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('任务标题不能为空');
    });

    test('无 Token 应返回 401', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: '未授权的待办' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('访问令牌缺失');
    });

    test('无效 Token 应返回 401', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', 'Bearer invalid-token-here')
        .send({ title: '测试' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的访问令牌');
    });

    test('过期 Token 应返回 401', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ title: '测试' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('使用默认值创建待办', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: '只有标题的待办' })
        .expect(201);

      expect(response.body.data.priority).toBe('medium');
      expect(response.body.data.category).toBe('工作');
      expect(response.body.data.description).toBeNull();
      expect(response.body.data.dueDate).toBeNull();
    });
  });

  describe('GET /api/todos - 获取待办列表', () => {
    let preparedTodos;

    beforeAll(async () => {
      preparedTodos = await Promise.all([
        prisma.todo.create({
          data: {
            title: '已完成的工作',
            completed: true,
            priority: 'low',
            category: '工作',
            userId: testUser.id,
          },
        }),
        prisma.todo.create({
          data: {
            title: '进行中的项目',
            completed: false,
            priority: 'high',
            category: '工作',
            dueDate: new Date('2025-01-15'),
            userId: testUser.id,
          },
        }),
        prisma.todo.create({
          data: {
            title: '个人学习计划',
            completed: false,
            priority: 'medium',
            category: '学习',
            userId: testUser.id,
          },
        }),
      ]);
    });

    afterAll(async () => {
      if (preparedTodos && preparedTodos.length > 0) {
        for (const todo of preparedTodos) {
          try { await prisma.todo.delete({ where: { id: todo.id } }); } catch (e) {}
        }
      }
    });

    test('应返回用户的待办列表', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.list)).toBe(true);
      expect(response.body.data.list.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(3);
    });

    test('按完成状态筛选 - completed=true', async () => {
      const response = await request(app)
        .get('/api/todos?completed=true')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      response.body.data.list.forEach((todo) => {
        expect(todo.completed).toBe(true);
      });
    });

    test('按优先级筛选 - priority=high', async () => {
      const response = await request(app)
        .get('/api/todos?priority=high')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      response.body.data.list.forEach((todo) => {
        expect(todo.priority).toBe('high');
      });
    });

    test('关键词搜索 - search=项目', async () => {
      const response = await request(app)
        .get('/api/todos?search=项目')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      response.body.data.list.forEach((todo) => {
        const matchesTitle = todo.title.includes('项目');
        const matchesDesc = todo.description && todo.description.includes('项目');
        expect(matchesTitle || matchesDesc).toBe(true);
      });
    });

    test('分页功能 - page=1, limit=2', async () => {
      const response = await request(app)
        .get('/api/todos?page=1&limit=2')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.data.list.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    test('无 Token 应返回 401', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/todos/:id - 更新待办', () => {
    let testTodoId;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          title: '原始标题',
          description: '原始描述',
          priority: 'medium',
          category: '工作',
          completed: false,
          userId: testUser.id,
        },
      });
      testTodoId = todo.id;
    });

    afterEach(async () => {
      try { await prisma.todo.delete({ where: { id: testTodoId } }); } catch (e) {}
    });

    test('应成功更新待办标题和优先级', async () => {
      const response = await request(app)
        .put(`/api/todos/${testTodoId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: '更新后的标题', priority: 'high' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('更新后的标题');
      expect(response.body.data.priority).toBe('high');
    });

    test('应成功标记待办为完成', async () => {
      const response = await request(app)
        .put(`/api/todos/${testTodoId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ completed: true })
        .expect(200);

      expect(response.body.data.completed).toBe(true);
    });

    test('更新不存在的待办应返回 404', async () => {
      const response = await request(app)
        .put('/api/todos/non-existent-id-12345')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: '测试' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不存在');
    });

    test('无 Token 应返回 401', async () => {
      const response = await request(app)
        .put(`/api/todos/${testTodoId}`)
        .send({ title: '测试' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/todos/:id - 删除待办', () => {
    let testTodoId;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: { title: '待删除的待办', priority: 'low', userId: testUser.id },
      });
      testTodoId = todo.id;
    });

    afterEach(async () => {
      try { await prisma.todo.delete({ where: { id: testTodoId } }); } catch (e) {}
    });

    test('应成功删除待办', async () => {
      const response = await request(app)
        .delete(`/api/todos/${testTodoId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('删除成功');

      const deletedTodo = await prisma.todo.findUnique({ where: { id: testTodoId } });
      expect(deletedTodo).toBeNull();
    });

    test('删除不存在的待办应返回 404', async () => {
      const response = await request(app)
        .delete('/api/todos/non-existent-id-12345')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('无 Token 应返回 401', async () => {
      const response = await request(app)
        .delete(`/api/todos/${testTodoId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('完整 CRUD 流程测试', () => {
    test('Create → Read → Update → Delete 完整流程', async () => {
      let todoId;

      // 1. CREATE
      const createRes = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'CRUD 测试待办', priority: 'high', category: '测试' })
        .expect(201);

      expect(createRes.body.success).toBe(true);
      todoId = createRes.body.data.id;
      expect(todoId).toBeDefined();

      // 2. READ
      const getRes = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const foundTodo = getRes.body.data.list.find((t) => t.id === todoId);
      expect(foundTodo).toBeDefined();
      expect(foundTodo.title).toBe('CRUD 测试待办');

      // 3. UPDATE
      const updateRes = await request(app)
        .put(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'CRUD 更新后', completed: true })
        .expect(200);

      expect(updateRes.body.data.title).toBe('CRUD 更新后');
      expect(updateRes.body.data.completed).toBe(true);

      // 4. DELETE
      const deleteRes = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(deleteRes.body.success).toBe(true);

      // 5. 验证删除后无法再获取
      const verifyRes = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(verifyRes.body.data.list.find((t) => t.id === todoId)).toBeUndefined();

      // 清理
      try { await prisma.todo.delete({ where: { id: todoId } }); } catch (e) {}
    });
  });

  describe('认证中间件安全测试', () => {
    test('无 Authorization header 应返回 401', async () => {
      const response = await request(app).get('/api/todos').expect(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('访问令牌缺失');
    });

    test('错误格式的 Authorization header 应返回 401', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);
      expect(response.body.success).toBe(false);
    });

    test('空的 Bearer Token 应返回 401', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', 'Bearer ')
        .expect(401);
      expect(response.body.success).toBe(false);
    });

    test('篡改的 Token 应返回 401', async () => {
      const parts = validToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tamperedsignature`;

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('无效的访问令牌');
    });
  });
});
