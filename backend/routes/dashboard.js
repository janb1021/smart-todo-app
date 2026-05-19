const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const total = await prisma.todo.count({ where: { userId: req.user.userId } });
    const completed = await prisma.todo.count({ where: { userId: req.user.userId, completed: true } });
    const pending = await prisma.todo.count({ where: { userId: req.user.userId, completed: false } });
    const overdue = await prisma.todo.count({
      where: {
        userId: req.user.userId,
        completed: false,
        dueDate: { lt: today }
      }
    });

    res.json({
      total,
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/trend', async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }

    const trendData = await Promise.all(days.map(async (date) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const created = await prisma.todo.count({
        where: {
          userId: req.user.userId,
          createdAt: { gte: date, lt: nextDate }
        }
      });

      const completed = await prisma.todo.count({
        where: {
          userId: req.user.userId,
          completed: true,
          updatedAt: { gte: date, lt: nextDate }
        }
      });

      return {
        date: date.toISOString().split('T')[0],
        created,
        completed
      };
    }));

    res.json(trendData);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = ['工作', '生活', '学习', '娱乐', '健康'];
    
    const categoryStats = await Promise.all(categories.map(async (category) => {
      const count = await prisma.todo.count({
        where: { userId: req.user.userId, category }
      });
      const completed = await prisma.todo.count({
        where: { userId: req.user.userId, category, completed: true }
      });
      
      return {
        category,
        count,
        completed,
        pending: count - completed
      };
    }));

    res.json(categoryStats);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/priorities', async (req, res) => {
  try {
    const priorities = ['high', 'medium', 'low'];
    
    const priorityStats = await Promise.all(priorities.map(async (priority) => {
      const count = await prisma.todo.count({
        where: { userId: req.user.userId, priority }
      });
      const completed = await prisma.todo.count({
        where: { userId: req.user.userId, priority, completed: true }
      });
      
      return {
        priority,
        count,
        completed,
        pending: count - completed
      };
    }));

    res.json(priorityStats);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;