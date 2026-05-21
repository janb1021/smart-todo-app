const request = require('supertest');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('../src/routes/authRoutes');
const todoRoutes = require('../src/routes/todoRoutes');
const { authenticateToken } = require('../src/middlewares/authMiddleware');

// 创建测试用的 Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
});

// 创建测试应用
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // 路由
  app.use('/api/auth', authRoutes);
  app.use('/api/todos', authenticateToken, todoRoutes);

  return app;
};

describe('Todo CRUD Tests', () => {
  let app;
  let authToken;
  let testUser;

  beforeAll(async () => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // 清理数据库
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();

    // 创建测试用户
    const hashedPassword = await bcrypt.hash('TestPass123', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
      },
    });

    // 生成认证 token
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Create Todo', () => {
    test('should create a new todo successfully', async () => {
      const todoData = {
        title: 'Test Todo',
        description: 'This is a test todo',
        priority: 'high',
        category: 'Work',
        dueDate: '2026-12-31',
      };

      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(todoData.title);
      expect(response.body.data.description).toBe(todoData.description);
      expect(response.body.data.priority).toBe(todoData.priority);
      expect(response.body.data.category).toBe(todoData.category);
      expect(response.body.data.completed).toBe(false);
      expect(response.body.data.userId).toBe(testUser.id);
    });

    test('should return 400 when title is missing', async () => {
      const todoData = {
        description: 'This is a test todo without title',
      };

      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('任务标题不能为空');
    });

    test('should create todo with default values', async () => {
      const todoData = {
        title: 'Simple Todo',
      };

      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(todoData.title);
      expect(response.body.data.priority).toBe('medium');
      expect(response.body.data.category).toBe('工作');
      expect(response.body.data.completed).toBe(false);
    });

    test('should return 401 when not authenticated', async () => {
      const todoData = {
        title: 'Test Todo',
      };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Get Todos', () => {
    beforeEach(async () => {
      // 创建一些测试待办
      await prisma.todo.createMany({
        data: [
          {
            title: 'Todo 1',
            description: 'Description 1',
            priority: 'high',
            category: 'Work',
            completed: false,
            userId: testUser.id,
          },
          {
            title: 'Todo 2',
            description: 'Description 2',
            priority: 'medium',
            category: 'Life',
            completed: true,
            userId: testUser.id,
          },
          {
            title: 'Todo 3',
            description: 'Description 3',
            priority: 'low',
            category: 'Work',
            completed: false,
            userId: testUser.id,
          },
        ],
      });
    });

    test('should get all todos with pagination', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.list).toHaveLength(3);
      expect(response.body.data.pagination).toMatchObject({
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    test('should filter by completed status', async () => {
      const response = await request(app)
        .get('/api/todos?completed=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.list).toHaveLength(1);
      expect(response.body.data.list[0].completed).toBe(true);
    });

    test('should filter by priority', async () => {
      const response = await request(app)
        .get('/api/todos?priority=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.list).toHaveLength(1);
      expect(response.body.data.list[0].priority).toBe('high');
    });

    test('should filter by category', async () => {
      const response = await request(app)
        .get('/api/todos?category=Work')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.list).toHaveLength(2);
    });

    test('should search by keyword', async () => {
      const response = await request(app)
        .get('/api/todos?search=Todo 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.list).toHaveLength(1);
      expect(response.body.data.list[0].title).toBe('Todo 1');
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/todos?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.list).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
      });
    });

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Update Todo', () => {
    let todoId;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Original Todo',
          description: 'Original Description',
          priority: 'low',
          category: 'Work',
          completed: false,
          userId: testUser.id,
        },
      });
      todoId = todo.id;
    });

    test('should update todo successfully', async () => {
      const updateData = {
        title: 'Updated Todo',
        description: 'Updated Description',
        completed: true,
        priority: 'high',
      };

      const response = await request(app)
        .put(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.completed).toBe(updateData.completed);
      expect(response.body.data.priority).toBe(updateData.priority);
    });

    test('should return 404 for non-existent todo', async () => {
      const updateData = {
        title: 'Updated Todo',
      };

      const response = await request(app)
        .put('/api/todos/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('待办不存在或无权限');
    });

    test('should not update todo of other user', async () => {
      // 创建另一个用户
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: await bcrypt.hash('password', 10),
          name: 'Other User',
        },
      });

      // 创建属于另一个用户的待办
      const otherTodo = await prisma.todo.create({
        data: {
          title: 'Other User Todo',
          priority: 'medium',
          userId: otherUser.id,
        },
      });

      const updateData = {
        title: 'Trying to update',
      };

      const response = await request(app)
        .put(`/api/todos/${otherTodo.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('待办不存在或无权限');
    });
  });

  describe('Delete Todo', () => {
    let todoId;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Todo to Delete',
          priority: 'medium',
          userId: testUser.id,
        },
      });
      todoId = todo.id;
    });

    test('should delete todo successfully', async () => {
      const response = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('待办删除成功');

      // 验证数据库中已删除
      const deletedTodo = await prisma.todo.findUnique({
        where: { id: todoId },
      });
      expect(deletedTodo).toBeNull();
    });

    test('should return 404 for non-existent todo', async () => {
      const response = await request(app)
        .delete('/api/todos/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('待办不存在或无权限');
    });

    test('should not delete todo of other user', async () => {
      // 创建另一个用户
      const otherUser = await prisma.user.create({
        data: {
          email: 'other2@example.com',
          password: await bcrypt.hash('password', 10),
          name: 'Other User',
        },
      });

      // 创建属于另一个用户的待办
      const otherTodo = await prisma.todo.create({
        data: {
          title: 'Other User Todo',
          priority: 'medium',
          userId: otherUser.id,
        },
      });

      const response = await request(app)
        .delete(`/api/todos/${otherTodo.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('待办不存在或无权限');

      // 验证其他用户的待办仍然存在
      const stillExists = await prisma.todo.findUnique({
        where: { id: otherTodo.id },
      });
      expect(stillExists).not.toBeNull();
    });
  });

  describe('Full CRUD Flow', () => {
    test('should complete full CRUD operations', async () => {
      // 1. Create
      const createResponse = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Full Flow Todo',
          description: 'Test description',
          priority: 'high',
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const createdTodoId = createResponse.body.data.id;

      // 2. Read (Get by list)
      const getResponse = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data.list).toHaveLength(1);
      expect(getResponse.body.data.list[0].id).toBe(createdTodoId);

      // 3. Update
      const updateResponse = await request(app)
        .put(`/api/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Full Flow Todo',
          completed: true,
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.title).toBe('Updated Full Flow Todo');
      expect(updateResponse.body.data.completed).toBe(true);

      // 4. Delete
      const deleteResponse = await request(app)
        .delete(`/api/todos/${createdTodoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // 5. Verify deletion
      const finalGetResponse = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalGetResponse.body.data.list).toHaveLength(0);
      expect(finalGetResponse.body.data.pagination.total).toBe(0);
    });
  });
});
