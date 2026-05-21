// 加载测试环境变量
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const { PrismaClient } = require('@prisma/client');

// 创建测试用的 Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db',
    },
  },
});

// 全局变量供测试使用
global.prisma = prisma;
global.testUser = null;
global.testToken = null;

// 所有测试完成后断开连接
process.on('exit', async () => {
  await prisma.$disconnect();
});
