import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdminPassword() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@fashion.com' },
    });

    if (!user) {
        console.log('❌ User admin@fashion.com not found!');
        return;
    }

    const passwordToCheck = 'admin123';
    const match = await bcrypt.compare(passwordToCheck, user.password);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Admin Password Verification');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email  : ${user.email}`);
    console.log(`   Role   : ${user.role}`);
    console.log(`   Active : ${user.isActive}`);
    console.log(`   Password is "admin123": ${match ? '✅ YES - Password matches!' : '❌ NO - Password does NOT match'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

checkAdminPassword()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
