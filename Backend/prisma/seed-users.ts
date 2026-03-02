/**
 * 🔐 Seed Admin Users
 * Creates default admin and user accounts
 */

import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🔐 Seeding users...\n');

  const users = [
    {
      email: 'admin@fashion.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'ADMIN' as const,
    },
    {
      email: 'user@fashion.com',
      password: 'user123',
      name: 'Regular User',
      role: 'USER' as const,
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      console.log(`⚠️  User ${user.email} already exists, skipping...`);
      continue;
    }

    await prisma.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
        name: user.name,
        role: user.role,
        isActive: true,
      },
    });

    console.log(`✅ Created ${user.role}: ${user.email} (password: ${user.password})`);
  }

  console.log('\n✅ User seeding complete!\n');
  console.log('📋 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 ADMIN:');
  console.log('   Email:    admin@fashion.com');
  console.log('   Password: admin123');
  console.log('');
  console.log('👤 USER:');
  console.log('   Email:    user@fashion.com');
  console.log('   Password: user123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

seedUsers()
  .catch((e) => {
    console.error('❌ Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
