
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkCategories() {
    try {
        console.log("Checking for 'ML' category...");
        const ml = await prisma.category.findFirst({
            where: {
                OR: [
                    { code: { equals: 'ML', mode: 'insensitive' } },
                    { name: { contains: 'Mens', mode: 'insensitive' } }
                ]
            },
            include: { subDepartment: { include: { department: true } } }
        });
        console.log("Found ML or Mens Category:", JSON.stringify(ml, null, 2));

        console.log("Checking all categories with 'ML' in code or name...");
        const allMl = await prisma.category.findMany({
            where: {
                OR: [
                    { code: { contains: 'ML', mode: 'insensitive' } },
                    { name: { contains: 'ML', mode: 'insensitive' } }
                ]
            },
            include: { subDepartment: { include: { department: true } } }
        });
        console.log("All matching categories:", JSON.stringify(allMl, null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCategories();
