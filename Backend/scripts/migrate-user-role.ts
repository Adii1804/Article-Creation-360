
import { PrismaClient, UserRole } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration of users from USER role to CREATOR role...');

    // Find count of users to be migrated
    // We use 'USER' as string cast to any/UserRole because the client might have updated types
    // but if USER is in schema, it should be in UserRole enum.
    const usersToMigrate = await prisma.user.count({
        where: {
            role: 'USER' as UserRole
        }
    });

    console.log(`Found ${usersToMigrate} users with 'USER' role.`);

    if (usersToMigrate > 0) {
        const result = await prisma.user.updateMany({
            where: {
                role: 'USER' as UserRole
            },
            data: {
                role: 'CREATOR' as UserRole
            }
        });
        console.log(`Successfully updated ${result.count} users to 'CREATOR' role.`);
    } else {
        console.log('No users to migrate.');
    }
}

main()
    .catch((e) => {
        console.error('Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
