const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../src/middlewares/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { filter = 'all', priority, category } = req.query;
    
    let where = { userId: req.user.userId };
    
    if (filter === 'completed') {
      where.completed = true;
    } else if (filter === 'pending') {
      where.completed = false;
    } else if (filter === 'overdue') {
      where.completed = false;
      where.dueDate = { lt: new Date() };
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (category) {
      where.category = category;
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { dueDate: 'asc' }
      ]
    });

    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await prisma.todo.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true } } }
    });

    if (!todo) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (todo.userId !== req.user.userId) {
      return res.status(403).json({ error: '无权访问此任务' });
    }

    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, priority = 'medium', dueDate, category = '工作' } = req.body;

    if (!title) {
      return res.status(400).json({ error: '任务标题不能为空' });
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        category,
        userId: req.user.userId
      }
    });

    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed, priority, dueDate, category } = req.body;

    const existingTodo = await prisma.todo.findUnique({ where: { id } });
    if (!existingTodo) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (existingTodo.userId !== req.user.userId) {
      return res.status(403).json({ error: '无权修改此任务' });
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        title,
        description,
        completed,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        category
      }
    });

    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existingTodo = await prisma.todo.findUnique({ where: { id } });
    if (!existingTodo) {
      return res.status(404).json({ error: '任务不存在' });
    }

    if (existingTodo.userId !== req.user.userId) {
      return res.status(403).json({ error: '无权删除此任务' });
    }

    await prisma.todo.delete({ where: { id } });

    res.json({ message: '任务已删除' });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;