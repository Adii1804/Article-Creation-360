require('dotenv').config();
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    const u = await prisma.user.findUnique({ where: { email: 'admin@fashion.com' } });
    console.log('RESULT', u ? 'FOUND' : 'NOT_FOUND');
    console.log(JSON.stringify(u, null, 2));
  } catch (e) {
    console.error('QUERY_ERROR', e);
  } finally {
    await prisma.$disconnect();
  }
})();
