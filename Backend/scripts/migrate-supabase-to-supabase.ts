/**
 * Migration Script: Old Supabase → New Supabase
 * 
 * This script exports all data from old Supabase and imports to new Supabase
 * 
 * Usage:
 * 1. Set OLD_DATABASE_URL in .env (your old Supabase connection)
 * 2. Set DATABASE_URL in .env (your new Supabase connection)
 * 3. Run: npx ts-node scripts/migrate-supabase-to-supabase.ts
 */

import { PrismaClient } from '../src/generated/prisma';

async function migrateDatabase() {
  console.log('🚀 Starting Database Migration: Old Supabase → New Supabase\n');

  // Source database (Old Supabase)
  const oldDbUrl = process.env.OLD_DATABASE_URL;
  if (!oldDbUrl) {
    throw new Error('OLD_DATABASE_URL not set in .env');
  }
  
  const sourceDb = new PrismaClient({
    datasources: { db: { url: oldDbUrl } }
  });

  // Target database (New Supabase)
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

    // Step 3: Export Users (skip admin@fashion.com and user@fashion.com as they already exist)
    console.log('📦 Exporting Users...');
    const users = await sourceDb.user.findMany({
      where: {
        email: {
          notIn: ['admin@fashion.com', 'user@fashion.com']
        }
      }
    });
    console.log(`   Found ${users.length} users to migrate`);

    // Step 4: Import to New Supabase
    console.log('\n📥 Importing to New Supabase...\n');

    // Import Departments
    console.log('💾 Importing Departments...');
    for (const dept of departments) {
      const existing = await targetDb.department.findUnique({ where: { code: dept.code } });
      if (existing) {
        console.log(`   ⏭️  Department ${dept.code} already exists, skipping...`);
        continue;
      }
      
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
        // Get the target department ID
        const targetDept = await targetDb.department.findUnique({ where: { code: dept.code } });
        if (!targetDept) continue;
        
        const existing = await targetDb.subDepartment.findFirst({
          where: {
            departmentId: targetDept.id,
            code: subDept.code
          }
        });
        
        if (existing) {
          console.log(`   ⏭️  SubDepartment ${subDept.code} already exists, skipping...`);
          continue;
        }
        
        await targetDb.subDepartment.create({
          data: {
            code: subDept.code,
            name: subDept.name,
            description: subDept.description,
            displayOrder: subDept.displayOrder,
            isActive: subDept.isActive,
            departmentId: targetDept.id
          }
        });
        subDeptCount++;
      }
    }
    console.log(`   ✅ Imported ${subDeptCount} sub-departments`);

    // Import Master Attributes
    console.log('💾 Importing Master Attributes...');
    let attrCount = 0;
    for (const attr of attributes) {
      const existing = await targetDb.masterAttribute.findUnique({ where: { key: attr.key } });
      if (existing) {
        console.log(`   ⏭️  Attribute ${attr.key} already exists, skipping...`);
        continue;
      }
      
      await targetDb.masterAttribute.create({
        data: {
          key: attr.key,
          label: attr.label,
          fullForm: attr.fullForm,
          type: attr.type,
          category: attr.category,
          description: attr.description,
          isRequired: attr.isRequired,
          displayOrder: attr.displayOrder,
          isActive: attr.isActive,
          aiExtractable: attr.aiExtractable,
          visibleFromDistance: attr.visibleFromDistance,
          extractionPriority: attr.extractionPriority,
          confidenceThreshold: attr.confidenceThreshold,
          hasRangeDetection: attr.hasRangeDetection,
          rangeType: attr.rangeType,
          rangeConfig: attr.rangeConfig as any,
          validationRules: attr.validationRules as any,
          allowedValues: {
            create: attr.allowedValues.map(av => ({
              shortForm: av.shortForm,
              fullForm: av.fullForm,
              aliases: av.aliases,
              displayOrder: av.displayOrder,
              isActive: av.isActive
            }))
          }
        }
      });
      attrCount++;
    }
    console.log(`   ✅ Imported ${attrCount} attributes`);

    // Import Categories and Mappings
    console.log('💾 Importing Categories and Mappings...');
    let categoryCount = 0;
    let mappingCount = 0;
    
    for (const dept of departments) {
      const targetDept = await targetDb.department.findUnique({ where: { code: dept.code } });
      if (!targetDept) continue;
      
      for (const subDept of dept.subDepartments) {
        const targetSubDept = await targetDb.subDepartment.findFirst({
          where: {
            departmentId: targetDept.id,
            code: subDept.code
          }
        });
        if (!targetSubDept) continue;
        
        for (const category of subDept.categories) {
          // Check if category exists
          const existingCategory = await targetDb.category.findUnique({ where: { code: category.code } });
          if (existingCategory) {
            console.log(`   ⏭️  Category ${category.code} already exists, skipping...`);
            continue;
          }
          
          // Create category
          const newCategory = await targetDb.category.create({
            data: {
              code: category.code,
              name: category.name,
              fullForm: category.fullForm,
              description: category.description,
              merchandiseCode: category.merchandiseCode,
              merchandiseDesc: category.merchandiseDesc,
              fabricDivision: category.fabricDivision,
              garmentType: category.garmentType,
              displayOrder: category.displayOrder,
              isActive: category.isActive,
              subDepartmentId: targetSubDept.id
            }
          });
          categoryCount++;

          // Create attribute mappings
          for (const mapping of category.attributes) {
            // Get the target attribute by finding from source
            const sourceAttr = await sourceDb.masterAttribute.findUnique({
              where: { id: mapping.attributeId }
            });
            if (!sourceAttr) continue;
            
            const targetAttr = await targetDb.masterAttribute.findUnique({
              where: { key: sourceAttr.key }
            });
            if (!targetAttr) continue;
            
            await targetDb.categoryAttribute.create({
              data: {
                categoryId: newCategory.id,
                attributeId: targetAttr.id,
                isEnabled: mapping.isEnabled,
                isRequired: mapping.isRequired,
                displayOrder: mapping.displayOrder,
                defaultValue: mapping.defaultValue
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
    let userCount = 0;
    for (const user of users) {
      const existing = await targetDb.user.findUnique({ where: { email: user.email } });
      if (existing) {
        console.log(`   ⏭️  User ${user.email} already exists, skipping...`);
        continue;
      }
      
      await targetDb.user.create({
        data: {
          email: user.email,
          password: user.password, // Already hashed
          name: user.name,
          role: user.role,
          isActive: user.isActive
        }
      });
      userCount++;
    }
    console.log(`   ✅ Imported ${userCount} users`);

    console.log('\n✅ Migration Complete!\n');
    console.log('📊 Summary:');
    console.log(`   • Departments: ${departments.length}`);
    console.log(`   • Sub-Departments: ${subDeptCount}`);
    console.log(`   • Categories: ${categoryCount}`);
    console.log(`   • Attributes: ${attrCount}`);
    console.log(`   • Attribute Mappings: ${mappingCount}`);
    console.log(`   • Users: ${userCount}`);

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
    console.log('\n🎉 All done! Your data is now in the new Supabase database.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
