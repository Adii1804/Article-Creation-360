import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const FINAL_SUBDIVISIONS: Array<{ departmentCodes: string[]; code: string; name: string; displayOrder: number }> = [
  { departmentCodes: ['MEN', 'MENS'], code: 'MU', name: 'MEN UPPER', displayOrder: 0 },
  { departmentCodes: ['MEN', 'MENS'], code: 'MS-U', name: 'MEN SPORTS UPPER', displayOrder: 1 },
  { departmentCodes: ['MEN', 'MENS'], code: 'MS-L', name: 'MEN SPORTS LOWER', displayOrder: 2 },
  { departmentCodes: ['MEN', 'MENS'], code: 'MW', name: 'MW', displayOrder: 3 },
  { departmentCodes: ['MEN', 'MENS'], code: 'MO', name: 'MO', displayOrder: 4 },
  { departmentCodes: ['MEN', 'MENS'], code: 'MS-IW', name: 'MEN INNERWEAR', displayOrder: 5 },
  { departmentCodes: ['MEN', 'MENS'], code: 'ML', name: 'MEN LOWER', displayOrder: 6 },

  { departmentCodes: ['LADIES', 'WOMEN'], code: 'LU', name: 'LADIES UPPER', displayOrder: 0 },
  { departmentCodes: ['LADIES', 'WOMEN'], code: 'LL', name: 'LADIES LOWER', displayOrder: 1 },
  { departmentCodes: ['LADIES', 'WOMEN'], code: 'LK&L', name: 'LADIES KURTI AND LEGGINGS', displayOrder: 2 },
  { departmentCodes: ['LADIES', 'WOMEN'], code: 'LN&L', name: 'LADIES NIGHTY AND LINGERIE', displayOrder: 3 },
  { departmentCodes: ['LADIES', 'WOMEN'], code: 'LW', name: 'LW', displayOrder: 4 },

  { departmentCodes: ['KIDS', 'KID'], code: 'KB-SETS', name: 'KID BOYS SETS', displayOrder: 0 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KB-L', name: 'KID BOYS LOWER', displayOrder: 1 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KB-U', name: 'KID BOYS UPPER', displayOrder: 2 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KBW-U', name: 'KBW-U', displayOrder: 3 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KBW-L', name: 'KBW-L', displayOrder: 4 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KBW-SETS', name: 'KBW-SETS', displayOrder: 5 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KG-L', name: 'KID GIRLS LOWER', displayOrder: 6 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KG-U', name: 'KID GIRLS UPPER', displayOrder: 7 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KGW-U', name: 'KGW-U', displayOrder: 8 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KGW-L', name: 'KGW-L', displayOrder: 9 },
  { departmentCodes: ['KIDS', 'KID'], code: 'IB', name: 'INFANT BOYS', displayOrder: 10 },
  { departmentCodes: ['KIDS', 'KID'], code: 'IG', name: 'INFANT GIRLS', displayOrder: 11 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KI', name: 'KI', displayOrder: 12 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KIW', name: 'KIW', displayOrder: 13 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KB', name: 'KB', displayOrder: 14 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KBW', name: 'KBW', displayOrder: 15 },
  { departmentCodes: ['KIDS', 'KID'], code: 'KG', name: 'KG', displayOrder: 16 },
];

async function main() {
  console.log('Upserting final sub-division list...');

  const departments = await prisma.department.findMany({
    select: { id: true, code: true, name: true }
  });

  for (const entry of FINAL_SUBDIVISIONS) {
    const department = departments.find((dept) => {
      const candidates = [String(dept.code || '').toUpperCase(), String(dept.name || '').toUpperCase()];
      return entry.departmentCodes.some((code) => candidates.includes(code));
    });

    if (!department) {
      console.warn(`Skipping ${entry.code}: no matching department found for ${entry.departmentCodes.join('/')}`);
      continue;
    }

    const existing = await prisma.subDepartment.findFirst({
      where: {
        departmentId: department.id,
        code: entry.code
      }
    });

    if (existing) {
      await prisma.subDepartment.update({
        where: { id: existing.id },
        data: {
          name: entry.name,
          isActive: true,
          displayOrder: entry.displayOrder
        }
      });
      console.log(`Updated ${department.code} -> ${entry.code}`);
    } else {
      await prisma.subDepartment.create({
        data: {
          departmentId: department.id,
          code: entry.code,
          name: entry.name,
          isActive: true,
          displayOrder: entry.displayOrder
        }
      });
      console.log(`Inserted ${department.code} -> ${entry.code}`);
    }
  }

  console.log('Final sub-division upsert complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
