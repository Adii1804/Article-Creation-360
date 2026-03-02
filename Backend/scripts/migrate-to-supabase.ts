/**
 * Migration Script: Neon → Supabase
 * 
 * This script exports all data from Neon and imports to Supabase
 * 
 * Usage:
 * 1. Set OLD_DATABASE_URL in .env (your Neon connection)
 * 2. Set DATABASE_URL in .env (your new Supabase connection)
 * 3. Run: npx ts-node scripts/migrate-to-supabase.ts
 */

import { PrismaClient } from '../src/generated/prisma';

async function migrateDatabase() {
  console.log('🚀 Starting Database Migration: Neon → Supabase\n');

  // Source database (Neon)
  const oldDbUrl = process.env.OLD_DATABASE_URL || process.env.DATABASE_URL;
  const sourceDb = new PrismaClient({
    datasources: { db: { url: oldDbUrl } }
  });

  // Target database (Supabase)
  const targetDb = new PrismaClient();

  try {
    // Step 1: Export Departments
    console.log('📦 Exporting Departments...');
    const departments = await sourceDb.department.findMany({
      include: {
        subDepartments: {
          include: {
            categories: {
              include: {
                attributes: true
              }
            }
          }
        }
      }
    });
    console.log(`   Found ${departments.length} departments`);

    // Step 2: Export Master Attributes
    console.log('📦 Exporting Master Attributes...');
    const attributes = await sourceDb.masterAttribute.findMany({
      include: {
        allowedValues: true
      }
    });
    console.log(`   Found ${attributes.length} attributes`);

    // Step 3: Export Users
    console.log('📦 Exporting Users...');
    const users = await sourceDb.user.findMany();
    console.log(`   Found ${users.length} users`);

    // Step 4: Import to Supabase
    console.log('\n📥 Importing to Supabase...\n');

    // Import Departments
    console.log('💾 Importing Departments...');
    for (const dept of departments) {
      await targetDb.department.create({
        data: {
          code: dept.code,
          name: dept.name,
          description: dept.description,
          displayOrder: dept.displayOrder,
          isActive: dept.isActive
        }
      });
    }
    console.log(`   ✅ Imported ${departments.length} departments`);

    // Import Sub-Departments
    console.log('💾 Importing Sub-Departments...');
    let subDeptCount = 0;
    for (const dept of departments) {
      for (const subDept of dept.subDepartments) {
        await targetDb.subDepartment.create({
          data: {
            code: subDept.code,
            name: subDept.name,
            description: subDept.description,
            displayOrder: subDept.displayOrder,
            isActive: subDept.isActive,
            department: {
              connect: { code: dept.code }
            }
          }
        });
        subDeptCount++;
      }
    }
    console.log(`   ✅ Imported ${subDeptCount} sub-departments`);

    // Import Master Attributes
    console.log('💾 Importing Master Attributes...');
    for (const attr of attributes) {
      await targetDb.masterAttribute.create({
        data: {
          key: attr.key,
          label: attr.label,
          description: attr.description,
          dataType: attr.dataType,
          isRequired: attr.isRequired,
          displayOrder: attr.displayOrder,
          categoryType: attr.categoryType,
          allowedValues: {
            create: attr.allowedValues.map(av => ({
              shortForm: av.shortForm,
              fullForm: av.fullForm,
              description: av.description,
              displayOrder: av.displayOrder
            }))
          }
        }
      });
    }
    console.log(`   ✅ Imported ${attributes.length} attributes`);

    // Import Categories and Mappings
    console.log('💾 Importing Categories and Mappings...');
    let categoryCount = 0;
    let mappingCount = 0;
    
    for (const dept of departments) {
      for (const subDept of dept.subDepartments) {
        for (const category of subDept.categories) {
          // Create category
          await targetDb.category.create({
            data: {
              code: category.code,
              name: category.name,
              description: category.description,
              displayOrder: category.displayOrder,
              isActive: category.isActive,
              subDepartment: {
                connect: { code: subDept.code }
              }
            }
          });
          categoryCount++;

          // Create attribute mappings
          for (const mapping of category.attributes) {
            await targetDb.categoryAttribute.create({
              data: {
                categoryCode: mapping.categoryCode,
                attributeKey: mapping.attributeKey,
                isRequired: mapping.isRequired,
                displayOrder: mapping.displayOrder
              }
            });
            mappingCount++;
          }
        }
      }
    }
    console.log(`   ✅ Imported ${categoryCount} categories`);
    console.log(`   ✅ Imported ${mappingCount} attribute mappings`);

    // Import Users
    console.log('💾 Importing Users...');
    for (const user of users) {
      await targetDb.user.create({
        data: {
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        }
      });
    }
    console.log(`   ✅ Imported ${users.length} users`);

    console.log('\n✅ Migration Complete!\n');
    console.log('📊 Summary:');
    console.log(`   • Departments: ${departments.length}`);
    console.log(`   • Sub-Departments: ${subDeptCount}`);
    console.log(`   • Categories: ${categoryCount}`);
    console.log(`   • Attributes: ${attributes.length}`);
    console.log(`   • Attribute Mappings: ${mappingCount}`);
    console.log(`   • Users: ${users.length}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await sourceDb.$disconnect();
    await targetDb.$disconnect();
  }
}

migrateDatabase()
  .then(() => {
    console.log('\n🎉 All done! Your data is now in Supabase.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
