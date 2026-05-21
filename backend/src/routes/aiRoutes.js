const express = require('express');
const { parseTodo, checkHealth } = require('../controllers/aiController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/ai/parse
 * @desc    解析自然语言为待办数据
 * @access  Private
 * @body    { text: string }
 * @returns { success: boolean, message: string, data: { title, dueDate, priority } }
 */
router.post('/parse', authenticateToken, parseTodo);

/**
 * @route   POST /api/ai/parse-todo
 * @desc    解析自然语言为待办数据（别名端点）
 * @access  Private
 * @body    { text: string }
 * @returns { success: boolean, message: string, data: { title, dueDate, priority } }
 */
router.post('/parse-todo', authenticateToken, parseTodo);

/**
 * @route   GET /api/ai/health
 * @desc    检查 AI 服务健康状态
 * @access  Public
 * @returns { success: boolean, message: string, data: { status, provider } }
 */
router.get('/health', checkHealth);

module.exports = router;
