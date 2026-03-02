require('dotenv').config();
const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@fashion.com' } });
    if (!user) return console.log('USER_NOT_FOUND');
    console.log('USER_FOUND, checking password...');
    const match = await bcrypt.compare('admin123', user.password);
    console.log('PASSWORD_MATCH:', match);
  } catch (e) {
    console.error('ERROR', e.message || e);
    if (e.stack) console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
})();
