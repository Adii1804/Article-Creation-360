import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

const SUB_DIVISIONS = [
    // Format: [Short Form, Full Form]
    ['KB-L', 'KID BOYS LOWER'],
    ['KG-L', 'KID GIRLS LOWER'],
    ['KB-SETS', 'KID BOYS SETS'],
    ['KB-U', 'KID BOYS UPPER'],
    ['ML', 'MEN LOWER'],
    ['MU', 'MEN UPPER'],
    ['MS-L', 'MEN SPORTS LOWER'],
    ['MS-U', 'MEN SPORTS UPPER'],
    ['KG-U', 'KID GIRLS UPPER'],
    ['LK&L', 'LADIES KURTI AND LEGGINGS'],
    ['LL', 'LADIES LOWER'],
    ['LU', 'LADIES UPPER'],
    ['IB', 'INFANT BOYS'],
    ['IG', 'INFANT GIRLS'],
    ['LN&L', 'LADIES NIGHTY AND LINGERIE'],
    ['MS-IW', 'MEN INNERWEAR']
];

async function main() {
    console.log('🌱 Seeding Sub-Division (Major Category) values...');

    // 1. Find the master attribute for 'major_category'
    // Note: key is usually lowercase 'major_category'
    const attributeKey = 'major_category';
    let masterAttribute = await prisma.masterAttribute.findUnique({
        where: { key: attributeKey }
    });

    if (!masterAttribute) {
        console.log(`⚠️ Attribute '${attributeKey}' not found. Creating it...`);
        masterAttribute = await prisma.masterAttribute.create({
            data: {
                key: attributeKey,
                label: 'Sub Division', // Updated label
                type: 'SELECT', // Assuming SELECT type
                description: 'Major category / Sub Division of the item',
                isActive: true,
                displayOrder: 1
            }
        });
    }

    console.log(`✅ Using Master Attribute: ${masterAttribute.label} (ID: ${masterAttribute.id})`);

    // 2. Clear existing values for this attribute (Optional? User said "add those", but simplified workflow might need clean slate.
    // Let's upsert instead to be safe, or delete if we want to enforce ONLY these values.
    // Given "Simplified Extraction Page", sticking to exactly these values is safer.)

    // Checking if we should wipe old values. The user said "add those".
    // But to ensure the dropdown shows *only* these if we switch to them, maybe we should deactivate others?
    // For now, let's just ADD them.

    let insertedCount = 0;
    let updatedCount = 0;

    for (const [index, [shortForm, fullForm]] of SUB_DIVISIONS.entries()) {
        // Check if value exists
        const existing = await prisma.attributeAllowedValue.findFirst({
            where: {
                attributeId: masterAttribute.id,
                shortForm: shortForm
            }
        });

        if (existing) {
            // Update full form if needed
            await prisma.attributeAllowedValue.update({
                where: { id: existing.id },
                data: {
                    fullForm: fullForm,
                    isActive: true,
                    displayOrder: index // Update order to match user list
                }
            });
            updatedCount++;
        } else {
            // Create new
            await prisma.attributeAllowedValue.create({
                data: {
                    attributeId: masterAttribute.id,
                    shortForm: shortForm,
                    fullForm: fullForm,
                    isActive: true,
                    displayOrder: index
                }
            });
            insertedCount++;
        }
    }

    console.log(`🎉 Seeding Complete!`);
    console.log(`   Added: ${insertedCount}`);
    console.log(`   Updated: ${updatedCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
