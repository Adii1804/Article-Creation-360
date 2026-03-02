import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function checkDepartments() {
  const departments = await prisma.department.findMany({
    include: {
      subDepartments: {
        include: {
          categories: {
            select: { 
              code: true, 
              name: true, 
              merchandiseDesc: true 
            },
            take: 5  // Just first 5 categories per sub-dept
          }
        }
      }
    }
  });
  
  console.log(JSON.stringify(departments, null, 2));
}

checkDepartments()
  .finally(() => prisma.$disconnect());
