
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function listCategories() {
    try {
        const categories = await prisma.category.findMany({
            include: { subDepartment: { include: { department: true } } }
        });
        console.log("Total Categories:", categories.length);
        console.log(JSON.stringify(categories, null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

listCategories();
