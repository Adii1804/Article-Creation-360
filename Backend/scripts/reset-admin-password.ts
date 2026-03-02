/**
 * 🔑 Reset Admin Password
 * Resets the password for admin@fashion.com
 */

import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
    const email = 'admin@fashion.com';
    const newPassword = 'admin123';

    console.log(`🔑 Resetting password for ${email}...\n`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
    });

    console.log(`✅ Password reset successfully for: ${user.email}`);
    console.log('\n📋 Updated Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 ADMIN:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

resetAdminPassword()
    .catch((e) => {
        console.error('❌ Error resetting password:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
