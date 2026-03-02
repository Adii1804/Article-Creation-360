
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkSubDepartments() {
    try {
        console.log("Checking for 'ML' SubDepartment...");
        const mlSub = await prisma.subDepartment.findFirst({
            where: {
                code: { equals: 'ML', mode: 'insensitive' }
            },
            include: {
                department: true,
                categories: true
            }
        });

        if (mlSub) {
            console.log("Found SubDepartment 'ML':");
            console.log(`ID: ${mlSub.id}, Name: ${mlSub.name}, Department: ${mlSub.department.name}`);
            console.log("Categories under 'ML':");
            mlSub.categories.forEach(c => console.log(` - ID: ${c.id}, Code: ${c.code}, Name: ${c.name}`));
        } else {
            console.log("SubDepartment 'ML' NOT found.");
        }

        console.log("\nChecking for 'MEN' Department...");
        const menDept = await prisma.department.findFirst({
            where: { name: { contains: 'MEN', mode: 'insensitive' } },
            include: { subDepartments: true }
        });

        if (menDept) {
            console.log(`Found Department 'MEN' (ID: ${menDept.id}, Name: ${menDept.name})`);
            console.log("SubDepartments:");
            menDept.subDepartments.forEach(sd => console.log(` - ${sd.code} (${sd.name})`));
        } else {
            console.log("Department 'MEN' NOT found.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSubDepartments();
