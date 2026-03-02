
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkAttributes() {
    try {
        const attributes = await prisma.masterAttribute.findMany({
            where: { isActive: true },
            include: {
                allowedValues: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' }
                }
            },
            orderBy: { displayOrder: 'asc' }
        });

        console.log(`Found ${attributes.length} active attributes.`);

        const attributesWithOptions = attributes.filter(a => a.allowedValues.length > 0);
        console.log(`Attributes with options: ${attributesWithOptions.length}`);

        attributesWithOptions.forEach(a => {
            console.log(`- ${a.key} (${a.label}): ${a.allowedValues.length} options`);
            console.log(`  Samples: ${a.allowedValues.slice(0, 3).map(v => v.fullForm).join(', ')}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAttributes();
