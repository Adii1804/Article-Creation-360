/**
 * Migrate all data from Neon to Supabase
 * This will copy all records from your old Neon database to the new Supabase database
 */

const { PrismaClient } = require('../src/generated/prisma');

// Create two Prisma clients - one for each database
const neonClient = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_j8GdCil3MvLo@ep-falling-bird-adlx1mid-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

const supabaseClient = new PrismaClient(); // Uses .env DATABASE_URL (Supabase)

async function migrateData() {
  console.log('🚀 Starting data migration from Neon to Supabase\n');

  try {
    // 1. Migrate Departments
    console.log('📦 Migrating departments...');
    const departments = await neonClient.department.findMany();
    for (const dept of departments) {
      await supabaseClient.department.upsert({
        where: { id: dept.id },
        create: dept,
        update: dept
      });
    }
    console.log(`✅ Migrated ${departments.length} departments\n`);

    // 2. Migrate Sub-Departments
    console.log('📦 Migrating sub-departments...');
    const subDepts = await neonClient.subDepartment.findMany();
    for (const subDept of subDepts) {
      await supabaseClient.subDepartment.upsert({
        where: { id: subDept.id },
        create: subDept,
        update: subDept
      });
    }
    console.log(`✅ Migrated ${subDepts.length} sub-departments\n`);

    // 3. Migrate Categories
    console.log('📦 Migrating categories...');
    const categories = await neonClient.category.findMany();
    for (const category of categories) {
      await supabaseClient.category.upsert({
        where: { id: category.id },
        create: category,
        update: category
      });
    }
    console.log(`✅ Migrated ${categories.length} categories\n`);

    // 4. Migrate Master Attributes
    console.log('📦 Migrating master attributes...');
    const masterAttrs = await neonClient.masterAttribute.findMany();
    for (const attr of masterAttrs) {
      await supabaseClient.masterAttribute.upsert({
        where: { id: attr.id },
        create: attr,
        update: attr
      });
    }
    console.log(`✅ Migrated ${masterAttrs.length} master attributes\n`);

    // 5. Migrate Attribute Allowed Values
    console.log('📦 Migrating attribute allowed values...');
    const allowedValues = await neonClient.attributeAllowedValue.findMany();
    for (const value of allowedValues) {
      await supabaseClient.attributeAllowedValue.upsert({
        where: { id: value.id },
        create: value,
        update: value
      });
    }
    console.log(`✅ Migrated ${allowedValues.length} allowed values\n`);

    // 6. Migrate Category Attributes (relationships)
    console.log('📦 Migrating category attributes...');
    const categoryAttrs = await neonClient.categoryAttribute.findMany();
    for (const catAttr of categoryAttrs) {
      await supabaseClient.categoryAttribute.upsert({
        where: { id: catAttr.id },
        create: catAttr,
        update: catAttr
      });
    }
    console.log(`✅ Migrated ${categoryAttrs.length} category attributes\n`);

    // 7. Migrate Users (skip - already created admin user)
    console.log('⏭️  Skipping users (already seeded)\n');

    // 8. Count final records
    console.log('📊 Final counts in Supabase:');
    const counts = {
      departments: await supabaseClient.department.count(),
      subDepartments: await supabaseClient.subDepartment.count(),
      categories: await supabaseClient.category.count(),
      masterAttributes: await supabaseClient.masterAttribute.count(),
      allowedValues: await supabaseClient.attributeAllowedValue.count(),
      categoryAttributes: await supabaseClient.categoryAttribute.count(),
      users: await supabaseClient.user.count()
    };

    console.table(counts);

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await neonClient.$disconnect();
    await supabaseClient.$disconnect();
  }
}

// Run migration
migrateData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
