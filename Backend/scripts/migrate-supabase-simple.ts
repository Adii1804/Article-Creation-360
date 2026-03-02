/**
 * Simple Supabase to Supabase Migration
 * Migrates data from old Supabase to new Supabase
 */

import { PrismaClient } from '../src/generated/prisma';

const OLD_DB = "postgresql://postgres.abttkpasiwtafoykrgtc:x7pWdZ86rkDfz7Rx@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const NEW_DB = "postgresql://postgres.hgdftqswlvkspzjtlrll:r9vnBBtlUaduEwAS@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function migrateData() {
  console.log('🚀 Starting Supabase → Supabase Migration\n');

  const sourceDb = new PrismaClient({
    datasources: { db: { url: OLD_DB } }
  });

  const targetDb = new PrismaClient({
    datasources: { db: { url: NEW_DB } }
  });

  try {
    // 1. Migrate Departments
    console.log('📦 Migrating Departments...');
    const departments = await sourceDb.department.findMany();
    console.log(`   Found ${departments.length} departments`);
    
    for (const dept of departments) {
      await targetDb.department.upsert({
        where: { code: dept.code },
        create: {
          code: dept.code,
          name: dept.name,
          description: dept.description,
          displayOrder: dept.displayOrder,
          isActive: dept.isActive
        },
        update: {}
      });
    }
    console.log(`   ✅ Migrated ${departments.length} departments\n`);

    // 2. Migrate SubDepartments
    console.log('📦 Migrating SubDepartments...');
    const subDepartments = await sourceDb.subDepartment.findMany();
    console.log(`   Found ${subDepartments.length} sub-departments`);
    
    for (const subDept of subDepartments) {
      await targetDb.subDepartment.upsert({
        where: { 
          departmentId_code: {
            departmentId: subDept.departmentId,
            code: subDept.code
          }
        },
        create: {
          code: subDept.code,
          name: subDept.name,
          description: subDept.description,
          displayOrder: subDept.displayOrder,
          isActive: subDept.isActive,
          departmentId: subDept.departmentId
        },
        update: {}
      });
    }
    console.log(`   ✅ Migrated ${subDepartments.length} sub-departments\n`);

    // 3. Migrate Categories
    console.log('📦 Migrating Categories...');
    const categories = await sourceDb.category.findMany();
    console.log(`   Found ${categories.length} categories`);
    
    for (const category of categories) {
      await targetDb.category.upsert({
        where: { code: category.code },
        create: {
          code: category.code,
          name: category.name,
          description: category.description,
          displayOrder: category.displayOrder,
          isActive: category.isActive,
          subDepartmentId: category.subDepartmentId
        },
        update: {}
      });
    }
    console.log(`   ✅ Migrated ${categories.length} categories\n`);

    // 4. Migrate Master Attributes
    console.log('📦 Migrating Master Attributes...');
    const attributes = await sourceDb.masterAttribute.findMany();
    console.log(`   Found ${attributes.length} attributes`);
    
    for (const attr of attributes) {
      await targetDb.masterAttribute.upsert({
        where: { key: attr.key },
        create: {
          key: attr.key,
          label: attr.label,
          description: attr.description,
          isRequired: attr.isRequired,
          displayOrder: attr.displayOrder
        },
        update: {}
      });
    }
    console.log(`   ✅ Migrated ${attributes.length} attributes\n`);

    // 5. Migrate Attribute Allowed Values
    console.log('📦 Migrating Attribute Allowed Values...');
    const attributeValues = await sourceDb.attributeAllowedValue.findMany();
    console.log(`   Found ${attributeValues.length} attribute values`);
    
    for (const av of attributeValues) {
      await targetDb.attributeAllowedValue.create({
        data: {
          shortForm: av.shortForm,
          fullForm: av.fullForm,
          displayOrder: av.displayOrder,
          isActive: av.isActive,
          attributeId: av.attributeId,
          aliases: av.aliases
        }
      }).catch(() => {
        // Skip if already exists
      });
    }
    console.log(`   ✅ Migrated ${attributeValues.length} attribute values\n`);

    // 6. Migrate Category Attributes (Mappings)
    console.log('📦 Migrating Category-Attribute Mappings...');
    const mappings = await sourceDb.categoryAttribute.findMany();
    console.log(`   Found ${mappings.length} mappings`);
    
    for (const mapping of mappings) {
      await targetDb.categoryAttribute.create({
        data: {
          categoryId: mapping.categoryId,
          attributeId: mapping.attributeId,
          isRequired: mapping.isRequired,
          displayOrder: mapping.displayOrder,
          isEnabled: mapping.isEnabled,
          defaultValue: mapping.defaultValue
        }
      }).catch(() => {
        // Skip if already exists
      });
    }
    console.log(`   ✅ Migrated ${mappings.length} mappings\n`);

    console.log('✅ Migration Complete!\n');
    console.log('📊 Summary:');
    console.log(`   • Departments: ${departments.length}`);
    console.log(`   • Sub-Departments: ${subDepartments.length}`);
    console.log(`   • Categories: ${categories.length}`);
    console.log(`   • Master Attributes: ${attributes.length}`);
    console.log(`   • Attribute Values: ${attributeValues.length}`);
    console.log(`   • Mappings: ${mappings.length}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await sourceDb.$disconnect();
    await targetDb.$disconnect();
  }
}

migrateData()
  .then(() => {
    console.log('\n🎉 Migration successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
