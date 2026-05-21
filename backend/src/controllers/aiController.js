const { parseTodoWithDeepSeek, healthCheck } = require('../services/deepseekService');

/**
 * 解析自然语言为待办数据
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
const parseTodo = async (req, res) => {
  try {
    const { text } = req.body;

    // 参数校验
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '请输入待办事项描述'
      });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: '描述内容过长，请控制在 500 字以内'
      });
    }

    // 调用 DeepSeek 服务解析
    const parsed = await parseTodoWithDeepSeek(text.trim());

    return res.status(200).json({
      success: true,
      message: '解析成功',
      data: parsed
    });

  } catch (error) {
    console.error('AI 解析失败:', error.message);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'AI 解析服务暂时不可用，请稍后重试'
    });
  }
};

/**
 * 检查 AI 服务健康状态
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
const checkHealth = async (req, res) => {
  try {
    const isHealthy = await healthCheck();
    
    if (isHealthy) {
      return res.status(200).json({
        success: true,
        message: 'AI 服务正常运行',
        data: { status: 'healthy', provider: 'deepseek' }
      });
    } else {
      return res.status(503).json({
        success: false,
        message: 'AI 服务不可用',
        data: { status: 'unhealthy', provider: 'deepseek' }
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '检查服务状态失败',
      data: { status: 'error', error: error.message }
    });
  }
};

module.exports = {
  parseTodo,
  checkHealth
};
