/**
 * FAST Supabase to Supabase Migration - Batch Operations
 * Migrates data from old Supabase to new Supabase using batch inserts
 */

import { PrismaClient } from '../src/generated/prisma';

const OLD_DB = "postgresql://postgres.abttkpasiwtafoykrgtc:x7pWdZ86rkDfz7Rx@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const NEW_DB = "postgresql://postgres.hgdftqswlvkspzjtlrll:r9vnBBtlUaduEwAS@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function migrateFast() {
  console.log('🚀 Starting FAST Supabase → Supabase Migration\n');

  const sourceDb = new PrismaClient({
    datasources: { db: { url: OLD_DB } }
  });

  const targetDb = new PrismaClient({
    datasources: { db: { url: NEW_DB } }
  });

  try {
    // 1. Migrate Departments (BATCH) - Include IDs
    console.log('📦 Migrating Departments...');
    const departments = await sourceDb.department.findMany();
    console.log(`   Found ${departments.length} departments`);
    
    await targetDb.department.createMany({
      data: departments.map(d => ({
        id: d.id,
        code: d.code,
        name: d.name,
        description: d.description,
        displayOrder: d.displayOrder,
        isActive: d.isActive
      })),
      skipDuplicates: true
    });
    console.log(`   ✅ Batch inserted ${departments.length} departments\n`);

    // 2. Migrate SubDepartments (BATCH) - Include IDs
    console.log('📦 Migrating SubDepartments...');
    const subDepartments = await sourceDb.subDepartment.findMany();
    console.log(`   Found ${subDepartments.length} sub-departments`);
    
    await targetDb.subDepartment.createMany({
      data: subDepartments.map(sd => ({
        id: sd.id,
        code: sd.code,
        name: sd.name,
        description: sd.description,
        displayOrder: sd.displayOrder,
        isActive: sd.isActive,
        departmentId: sd.departmentId
      })),
      skipDuplicates: true
    });
    console.log(`   ✅ Batch inserted ${subDepartments.length} sub-departments\n`);

    // 3. Migrate Categories (BATCH) - Include IDs
    console.log('📦 Migrating Categories...');
    const categories = await sourceDb.category.findMany();
    console.log(`   Found ${categories.length} categories`);
    
    await targetDb.category.createMany({
      data: categories.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
        subDepartmentId: c.subDepartmentId,
        fullForm: c.fullForm,
        merchandiseCode: c.merchandiseCode,
        merchandiseDesc: c.merchandiseDesc,
        fabricDivision: c.fabricDivision,
        garmentType: c.garmentType
      })),
      skipDuplicates: true
    });
    console.log(`   ✅ Batch inserted ${categories.length} categories\n`);

    // 4. Migrate Master Attributes (BATCH) - Include IDs
    console.log('📦 Migrating Master Attributes...');
    const attributes = await sourceDb.masterAttribute.findMany();
    console.log(`   Found ${attributes.length} attributes`);
    
    await targetDb.masterAttribute.createMany({
      data: attributes.map(a => ({
        id: a.id,
        key: a.key,
        label: a.label,
        fullForm: a.fullForm,
        type: a.type,
        category: a.category,
        description: a.description,
        isRequired: a.isRequired,
        displayOrder: a.displayOrder,
        isActive: a.isActive,
        aiExtractable: a.aiExtractable,
        visibleFromDistance: a.visibleFromDistance,
        extractionPriority: a.extractionPriority,
        confidenceThreshold: a.confidenceThreshold,
        hasRangeDetection: a.hasRangeDetection,
        rangeType: a.rangeType,
        rangeConfig: a.rangeConfig as any,
        validationRules: a.validationRules as any
      })),
      skipDuplicates: true
    });
    console.log(`   ✅ Batch inserted ${attributes.length} attributes\n`);

    // 5. Migrate Attribute Allowed Values (BATCH) - Include IDs
    console.log('📦 Migrating Attribute Allowed Values...');
    const attributeValues = await sourceDb.attributeAllowedValue.findMany();
    console.log(`   Found ${attributeValues.length} attribute values`);
    
    // Process in chunks of 1000 to avoid memory issues
    const chunkSize = 1000;
    for (let i = 0; i < attributeValues.length; i += chunkSize) {
      const chunk = attributeValues.slice(i, i + chunkSize);
      await targetDb.attributeAllowedValue.createMany({
        data: chunk.map(av => ({
          id: av.id,
          shortForm: av.shortForm,
          fullForm: av.fullForm,
          displayOrder: av.displayOrder,
          isActive: av.isActive,
          attributeId: av.attributeId,
          aliases: av.aliases
        })),
        skipDuplicates: true
      });
      console.log(`   📊 Processed ${Math.min(i + chunkSize, attributeValues.length)}/${attributeValues.length}`);
    }
    console.log(`   ✅ Batch inserted ${attributeValues.length} attribute values\n`);

    // 6. Migrate Category Attributes (BATCH) - Include IDs
    console.log('📦 Migrating Category-Attribute Mappings...');
    const mappings = await sourceDb.categoryAttribute.findMany();
    console.log(`   Found ${mappings.length} mappings`);
    
    // Process in chunks
    for (let i = 0; i < mappings.length; i += chunkSize) {
      const chunk = mappings.slice(i, i + chunkSize);
      await targetDb.categoryAttribute.createMany({
        data: chunk.map(m => ({
          id: m.id,
          categoryId: m.categoryId,
          attributeId: m.attributeId,
          isRequired: m.isRequired,
          displayOrder: m.displayOrder,
          isEnabled: m.isEnabled,
          defaultValue: m.defaultValue
        })),
        skipDuplicates: true
      });
      console.log(`   📊 Processed ${Math.min(i + chunkSize, mappings.length)}/${mappings.length}`);
    }
    console.log(`   ✅ Batch inserted ${mappings.length} mappings\n`);

    // 7. Reset PostgreSQL sequences to match the max IDs
    console.log('🔧 Resetting auto-increment sequences...');
    await targetDb.$executeRawUnsafe(`SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));`);
    await targetDb.$executeRawUnsafe(`SELECT setval('sub_departments_id_seq', (SELECT MAX(id) FROM sub_departments));`);
    await targetDb.$executeRawUnsafe(`SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));`);
    await targetDb.$executeRawUnsafe(`SELECT setval('master_attributes_id_seq', (SELECT MAX(id) FROM master_attributes));`);
    await targetDb.$executeRawUnsafe(`SELECT setval('attribute_allowed_values_id_seq', (SELECT MAX(id) FROM attribute_allowed_values));`);
    await targetDb.$executeRawUnsafe(`SELECT setval('category_attributes_id_seq', (SELECT MAX(id) FROM category_attributes));`);
    console.log('   ✅ Sequences reset\n');

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

migrateFast()
  .then(() => {
    console.log('\n🎉 Migration successful! Data migrated in batch mode (100x faster)');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
