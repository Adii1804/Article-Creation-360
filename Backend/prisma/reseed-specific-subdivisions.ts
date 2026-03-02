import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const DIVISIONS = {
    MEN: {
        description: 'Men\'s Fashion',
        subDivisions: [
            { code: 'ML', name: 'MEN LOWER' },
            { code: 'MU', name: 'MEN UPPER' },
            { code: 'MS-L', name: 'MEN SPORTS LOWER' },
            { code: 'MS-U', name: 'MEN SPORTS UPPER' },
            { code: 'MS-IW', name: 'MEN INNERWEAR' }
        ]
    },
    LADIES: {
        description: 'Ladies Fashion',
        subDivisions: [
            { code: 'LK&L', name: 'LADIES KURTI AND LEGGINGS' },
            { code: 'LL', name: 'LADIES LOWER' },
            { code: 'LU', name: 'LADIES UPPER' },
            { code: 'LN&L', name: 'LADIES NIGHTY AND LINGERIE' }
        ]
    },
    KIDS: {
        description: 'Kids Fashion',
        subDivisions: [
            { code: 'KB-L', name: 'KID BOYS LOWER' },
            { code: 'KG-L', name: 'KID GIRLS LOWER' },
            { code: 'KB-SETS', name: 'KID BOYS SETS' },
            { code: 'KB-U', name: 'KID BOYS UPPER' },
            { code: 'KG-U', name: 'KID GIRLS UPPER' },
            { code: 'IB', name: 'INFANT BOYS' },
            { code: 'IG', name: 'INFANT GIRLS' }
        ]
    }
};

async function main() {
    console.log('🌱 Starting Specific Hierarchy Seeding...');

    // 1. Ensure clean slate (Safe since we just ran delete script, but good practice)
    await prisma.category.deleteMany({});
    await prisma.subDepartment.deleteMany({});
    await prisma.department.deleteMany({});

    for (const [deptCode, deptData] of Object.entries(DIVISIONS)) {
        console.log(`\n📌 Creating Division: ${deptCode}`);

        // Create Division (Department)
        const department = await prisma.department.create({
            data: {
                code: deptCode,
                name: deptCode,
                description: deptData.description,
                isActive: true
            }
        });

        // Create Sub-Divisions (SubDepartments)
        for (const sub of deptData.subDivisions) {
            console.log(`   ↳ Sub-Division: ${sub.name} (${sub.code})`);

            const subDept = await prisma.subDepartment.create({
                data: {
                    departmentId: department.id,
                    code: sub.code,
                    name: sub.name,
                    isActive: true
                }
            });

            // Create "General" Category for compatibility
            await prisma.category.create({
                data: {
                    subDepartmentId: subDept.id,
                    code: `${deptCode}_${sub.code}_GENERAL`.toUpperCase(),
                    name: `${sub.name} General`,
                    isActive: true
                }
            });
        }
    }

    console.log('\n✅ Specific hierarchy seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
