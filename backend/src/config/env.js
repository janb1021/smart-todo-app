const dotenv = require('dotenv');

// 加载 .env 文件
dotenv.config();

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'DEEPSEEK_API_KEY',
];

const optionalEnvVars = {
  PORT: '3000',
  DEEPSEEK_API_URL: 'https://api.deepseek.com/v1/chat/completions',
  DEEPSEEK_MODEL: 'deepseek-chat',
  AI_TIMEOUT: '30000',
  AI_MAX_RETRIES: '3',
};

function validateEnv() {
  const missing = [];
  const warnings = [];

  // 检查必需的环境变量
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // 检查 JWT_SECRET 强度
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET 长度不足 32 位，建议使用更强的密钥');
  }

  // 检查是否使用了默认值
  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
    warnings.push('JWT_SECRET 使用了默认值，生产环境请更改');
  }

  // 设置可选变量的默认值
  for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
    }
  }

  // 输出结果
  if (missing.length > 0) {
    console.error('\n❌ 缺少必需的环境变量:');
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error('\n请创建 .env 文件并配置这些变量');
    console.error('参考 .env.example 文件\n');
    return false;
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  安全警告:');
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn('');
  }

  return true;
}

module.exports = { validateEnv };
