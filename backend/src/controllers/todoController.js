const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * 创建待办
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
const createTodo = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, recurrence, reminderOffset } = req.body;
    const userId = req.user.userId;

    // 参数校验
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '任务标题不能为空'
      });
    }

    // 创建待办
    const todo = await prisma.todo.create({
      data: {
        title,
        description: description || null,
        priority: priority || 'medium',
        category: category || '工作',
        dueDate: dueDate ? new Date(dueDate) : null,
        recurrence: recurrence || null,
        reminderOffset: reminderOffset ? parseInt(reminderOffset) : null,
        userId
      }
    });

    return res.status(201).json({
      success: true,
      message: '待办创建成功',
      data: todo
    });
  } catch (error) {
    console.error('创建待办失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取用户所有待办
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
const getTodos = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { completed, priority, category, search, page, limit } = req.query;

    // 构建查询条件
    const where = { userId };

    // 按完成状态筛选
    if (completed !== undefined) {
      where.completed = completed === 'true';
    }

    // 按优先级筛选（支持大小写）
    if (priority) {
      where.priority = priority.toLowerCase();
    }

    // 按分类筛选
    if (category) {
      where.category = category;
    }

    // 关键词搜索（标题和描述）
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // SQLite 不区分大小写，不需要 mode: 'insensitive'
      where.OR = [
        {
          title: {
            contains: searchTerm
          }
        },
        {
          description: {
            contains: searchTerm
          }
        }
      ];
    }

    // 分页参数处理
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // 查询总数
    const total = await prisma.todo.count({ where });

    // 查询待办列表（带分页）
    const todos = await prisma.todo.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip,
      take: limitNum
    });

    return res.status(200).json({
      success: true,
      message: '获取待办列表成功',
      data: {
        list: todos,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('获取待办列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 更新待办
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, description, completed, priority, category, dueDate } = req.body;

    // 检查待办是否存在且属于当前用户
    const existingTodo = await prisma.todo.findFirst({
      where: { id, userId }
    });

    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        message: '待办不存在或无权限'
      });
    }

    // 更新待办
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTodo.title,
        description: description !== undefined ? description : existingTodo.description,
        completed: completed !== undefined ? completed : existingTodo.completed,
        priority: priority !== undefined ? priority : existingTodo.priority,
        category: category !== undefined ? category : existingTodo.category,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingTodo.dueDate
      }
    });

    return res.status(200).json({
      success: true,
      message: '待办更新成功',
      data: todo
    });
  } catch (error) {
    console.error('更新待办失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

/**
 * 删除待办
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 检查待办是否存在且属于当前用户
    const existingTodo = await prisma.todo.findFirst({
      where: { id, userId }
    });

    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        message: '待办不存在或无权限'
      });
    }

    // 删除待办
    await prisma.todo.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: '待办删除成功'
    });
  } catch (error) {
    console.error('删除待办失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo
};
