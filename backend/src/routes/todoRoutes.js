const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo
} = require('../controllers/todoController');

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * @route   POST /api/todos
 * @desc    创建待办
 * @access  Private
 */
router.post('/', createTodo);

/**
 * @route   GET /api/todos
 * @desc    获取用户所有待办，支持筛选
 * @access  Private
 */
router.get('/', getTodos);

/**
 * @route   PUT /api/todos/:id
 * @desc    更新待办
 * @access  Private
 */
router.put('/:id', updateTodo);

/**
 * @route   DELETE /api/todos/:id
 * @desc    删除待办
 * @access  Private
 */
router.delete('/:id', deleteTodo);

module.exports = router;
