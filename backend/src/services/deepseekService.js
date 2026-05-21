const axios = require('axios');

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

/**
 * 调用 DeepSeek API 解析自然语言为待办数据
 * @param {string} text - 用户输入的自然语言文本
 * @returns {Promise<{title: string, dueDate: string|null, priority: string}>}
 */
async function parseTodoWithDeepSeek(text) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API 密钥未配置');
  }

  const today = new Date().toISOString().split('T')[0]; // 获取当前日期 YYYY-MM-DD

  const systemPrompt = `你是一个智能待办事项解析助手。请将用户的自然语言输入解析为结构化的待办数据。

请严格按照以下 JSON 格式返回，不要包含任何其他内容：
{
  "title": "待办事项标题（简洁明了，去除时间信息）",
  "dueDate": "截止日期（格式：YYYY-MM-DD，仅日期部分。如果无法确定则返回 null）",
  "priority": "优先级（high/medium/low，根据紧急程度判断）",
  "recurrence": "重复规则（daily/weekly/monthly/yearly/null）",
  "reminderOffset": "提前提醒时间（分钟数：0=准时,5=提前5分钟,15=提前15分钟,30=提前30分钟,60=提前1小时,null=不提醒）"
}

重要规则：
1. 今天的日期是 ${today}
2. "明天" = ${today} 的后一天
3. "后天" = ${today} 的后两天
4. "下周" = ${today} 的下一个周一
5. "月底" = 本月最后一天
6. dueDate 必须是纯日期格式（如 "2024-12-31"），不要包含时间
7. title 中不要包含日期和时间信息，只保留核心事项内容

重复规则解析：
- daily: 每天、每日、每天一次、每天都要、每天早上/下午等
- weekly: 每周、每周一/二/三...、每星期、每周一次等
- monthly: 每月、每月一次、每个月、每月底等
- yearly: 每年、每年一次、每年这个时候等
- null: 不重复（默认）

提醒时间解析：
- 0: 准时、到点提醒、按时提醒等
- 5: 提前5分钟、5分钟前等
- 15: 提前15分钟、15分钟前、提前一刻钟等
- 30: 提前30分钟、半小时前、半小时提醒等
- 60: 提前1小时、一小时前、1小时提醒等
- null: 无特殊要求（默认）

优先级判断规则：
- high: 紧急、重要、马上、今天、立刻、尽快、截止日期很近等
- medium: 普通、一般、明天、近期、一周内等
- low: 不紧急、以后、有空、随意、没有明确截止日期等

示例输入："每周一上午开例会，提前15分钟提醒"
示例输出：{"title":"开例会","dueDate":"${today}","priority":"medium","recurrence":"weekly","reminderOffset":15}`;

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 秒超时
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('DeepSeek API 返回内容为空');
    }

    // 清理响应内容，提取 JSON 部分
    let jsonContent = content.trim();
    
    // 如果响应包含 markdown 代码块，提取其中的 JSON
    const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
    }
    
    // 解析 JSON 响应
    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('JSON 解析失败，原始内容:', content);
      throw new Error('AI 返回格式不正确，请重试');
    }

    // 验证必需字段
    if (!parsed.title) {
      throw new Error('解析结果缺少标题字段');
    }

    // 规范化优先级
    const validPriorities = ['high', 'medium', 'low'];
    if (!parsed.priority || !validPriorities.includes(parsed.priority.toLowerCase())) {
      parsed.priority = 'medium';
    } else {
      parsed.priority = parsed.priority.toLowerCase();
    }

    // 规范化重复规则
    const validRecurrence = ['daily', 'weekly', 'monthly', 'yearly'];
    if (parsed.recurrence && validRecurrence.includes(parsed.recurrence.toLowerCase())) {
      parsed.recurrence = parsed.recurrence.toLowerCase();
    } else {
      parsed.recurrence = null;
    }

    // 规范化提醒时间（必须是数字或 null）
    const validReminderOffsets = [0, 5, 15, 30, 60];
    const offsetNum = parseInt(parsed.reminderOffset);
    if (!isNaN(offsetNum) && validReminderOffsets.includes(offsetNum)) {
      parsed.reminderOffset = offsetNum;
    } else {
      parsed.reminderOffset = null;
    }

    // 处理日期
    if (parsed.dueDate && parsed.dueDate !== 'null') {
      try {
        const date = new Date(parsed.dueDate);
        if (isNaN(date.getTime())) {
          parsed.dueDate = null;
        } else {
          parsed.dueDate = date.toISOString().split('T')[0];
        }
      } catch {
        parsed.dueDate = null;
      }
    } else {
      parsed.dueDate = null;
    }

    return {
      title: parsed.title.trim(),
      dueDate: parsed.dueDate,
      priority: parsed.priority,
      recurrence: parsed.recurrence,
      reminderOffset: parsed.reminderOffset,
    };

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('DeepSeek API 请求超时，请稍后重试');
    }
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || '未知错误';
      if (status === 401) {
        throw new Error('DeepSeek API 密钥无效');
      } else if (status === 429) {
        throw new Error('DeepSeek API 请求过于频繁，请稍后重试');
      } else {
        throw new Error(`DeepSeek API 错误: ${message}`);
      }
    }
    throw error;
  }
}

/**
 * 健康检查 - 验证 DeepSeek API 是否可用
 * @returns {Promise<boolean>}
 */
async function healthCheck() {
  if (!DEEPSEEK_API_KEY) {
    return false;
  }
  try {
    await axios.post(
      DEEPSEEK_API_URL,
      {
        model: DEEPSEEK_MODEL,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  parseTodoWithDeepSeek,
  healthCheck
};
