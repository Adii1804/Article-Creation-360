/**
 * UNIVERSAL DATABASE MIGRATION SCRIPT
 * 
 * Exports all data from current DATABASE_URL and imports to any target database.
 * Handles field mapping, table names, and relationships correctly.
 * 
 * Usage:
 * 1. EXPORT: Set DATABASE_URL to source DB, run: node simple-migration.js export
 * 2. IMPORT: Set DATABASE_URL to target DB, run: node simple-migration.js import
 * 
 * The script creates a complete backup JSON file with all hierarchy, users, and logs.
 */

const { PrismaClient } = require('./src/generated/prisma');
const fs = require('fs');
const path = require('path');

const MODE = process.argv[2] || 'export'; // 'export' or 'import'
const BACKUP_FILE = path.join(__dirname, 'database-backup.json');

async function exportData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📤 EXPORTING DATABASE...\n');
    console.log(`📍 Source: ${process.env.DATABASE_URL?.substring(0, 50)}...\n`);

    // Export all data with proper ordering for relationships
    console.log('1️⃣  Fetching Departments...');
    const departments = await prisma.department.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('2️⃣  Fetching Sub-Departments...');
    const subDepartments = await prisma.subDepartment.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('3️⃣  Fetching Categories...');
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('4️⃣  Fetching Master Attributes...');
    const attributes = await prisma.masterAttribute.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('5️⃣  Fetching Allowed Values...');
    const allowedValues = await prisma.attributeAllowedValue.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('6️⃣  Fetching Category-Attribute Mappings...');
    const categoryAttributes = await prisma.categoryAttribute.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('7️⃣  Fetching Users...');
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('8️⃣  Fetching Audit Logs...');
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { id: 'asc' }
    });

    const data = {
      exportedAt: new Date().toISOString(),
      source: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown',
      departments,
      subDepartments,
      categories,
      attributes,
      allowedValues,
      categoryAttributes,
      users,
      auditLogs
    };

    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2));
    
    console.log('\n✅ EXPORT COMPLETE!\n');
    console.log('📊 DATA SUMMARY:');
    console.log(`   • Departments:        ${departments.length}`);
    console.log(`   • Sub-Departments:    ${subDepartments.length}`);
    console.log(`   • Categories:         ${categories.length}`);
    console.log(`   • Master Attributes:  ${attributes.length}`);
    console.log(`   • Allowed Values:     ${allowedValues.length}`);
    console.log(`   • Attribute Mappings: ${categoryAttributes.length}`);
    console.log(`   • Users:              ${users.length}`);
    console.log(`   • Audit Logs:         ${auditLogs.length}`);
    console.log(`\n💾 Backup saved to: ${BACKUP_FILE}\n`);
    console.log('🔄 Next step: Update DATABASE_URL to target DB and run: node simple-migration.js import\n');
    
  } catch (error) {
    console.error('\n❌ EXPORT FAILED:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function importData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📥 IMPORTING DATABASE...\n');
    console.log(`📍 Target: ${process.env.DATABASE_URL?.substring(0, 50)}...\n`);

    if (!fs.existsSync(BACKUP_FILE)) {
      throw new Error(`Backup file not found: ${BACKUP_FILE}\nRun 'node simple-migration.js export' first!`);
    }

    const data = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    
    console.log('📋 BACKUP INFO:');
    console.log(`   Exported: ${new Date(data.exportedAt).toLocaleString()}`);
    console.log(`   Source: ${data.source}\n`);

    // Import in correct order (respecting foreign key constraints)
    
    console.log('1️⃣  Importing Departments...');
    for (const dept of data.departments) {
      await prisma.department.upsert({
        where: { code: dept.code },
        update: {
          name: dept.name,
          description: dept.description,
          displayOrder: dept.displayOrder,
          isActive: dept.isActive
        },
        create: {
          code: dept.code,
          name: dept.name,
          description: dept.description,
          displayOrder: dept.displayOrder,
          isActive: dept.isActive
        }
      });
    }
    console.log(`   ✅ ${data.departments.length} departments`);

    console.log('2️⃣  Importing Sub-Departments...');
    for (const subDept of data.subDepartments) {
      await prisma.subDepartment.upsert({
        where: { code: subDept.code },
        update: {
          name: subDept.name,
          description: subDept.description,
          displayOrder: subDept.displayOrder,
          isActive: subDept.isActive,
          departmentId: subDept.departmentId
        },
        create: {
          code: subDept.code,
          name: subDept.name,
          description: subDept.description,
          displayOrder: subDept.displayOrder,
          isActive: subDept.isActive,
          departmentId: subDept.departmentId
        }
      });
    }
    console.log(`   ✅ ${data.subDepartments.length} sub-departments`);

    console.log('3️⃣  Importing Categories...');
    for (const category of data.categories) {
      await prisma.category.upsert({
        where: { code: category.code },
        update: {
          name: category.name,
          description: category.description,
          displayOrder: category.displayOrder,
          isActive: category.isActive,
          subDepartmentId: category.subDepartmentId
        },
        create: {
          code: category.code,
          name: category.name,
          description: category.description,
          displayOrder: category.displayOrder,
          isActive: category.isActive,
          subDepartmentId: category.subDepartmentId
        }
      });
    }
    console.log(`   ✅ ${data.categories.length} categories`);

    console.log('4️⃣  Importing Master Attributes...');
    for (const attr of data.attributes) {
      await prisma.masterAttribute.upsert({
        where: { key: attr.key },
        update: {
          label: attr.label,
          description: attr.description,
          isRequired: attr.isRequired,
          displayOrder: attr.displayOrder
        },
        create: {
          key: attr.key,
          label: attr.label,
          description: attr.description,
          isRequired: attr.isRequired,
          displayOrder: attr.displayOrder
        }
      });
    }
    console.log(`   ✅ ${data.attributes.length} attributes`);

    console.log('5️⃣  Importing Allowed Values...');
    for (const av of data.allowedValues) {
      await prisma.attributeAllowedValue.upsert({
        where: { id: av.id },
        update: {
          shortForm: av.shortForm,
          fullForm: av.fullForm,
          displayOrder: av.displayOrder,
          isActive: av.isActive,
          attributeId: av.attributeId,
          aliases: av.aliases || []
        },
        create: {
          id: av.id,
          shortForm: av.shortForm,
          fullForm: av.fullForm,
          displayOrder: av.displayOrder,
          isActive: av.isActive,
          attributeId: av.attributeId,
          aliases: av.aliases || []
        }
      });
    }
    console.log(`   ✅ ${data.allowedValues.length} allowed values`);

    console.log('6️⃣  Importing Category-Attribute Mappings...');
    for (const mapping of data.categoryAttributes) {
      await prisma.categoryAttribute.upsert({
        where: { id: mapping.id },
        update: {
          categoryId: mapping.categoryId,
          attributeId: mapping.attributeId,
          isRequired: mapping.isRequired,
          displayOrder: mapping.displayOrder,
          isEnabled: mapping.isEnabled,
          defaultValue: mapping.defaultValue
        },
        create: {
          id: mapping.id,
          categoryId: mapping.categoryId,
          attributeId: mapping.attributeId,
          isRequired: mapping.isRequired,
          displayOrder: mapping.displayOrder,
          isEnabled: mapping.isEnabled,
          defaultValue: mapping.defaultValue
        }
      });
    }
    console.log(`   ✅ ${data.categoryAttributes.length} mappings`);

    console.log('7️⃣  Importing Users...');
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          password: user.password,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        },
        create: {
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        }
      });
    }
    console.log(`   ✅ ${data.users.length} users`);

    console.log('8️⃣  Importing Audit Logs...');
    let auditCount = 0;
    for (const log of data.auditLogs) {
      try {
        await prisma.auditLog.create({
          data: {
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            changes: log.changes,
            userId: log.userId,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent
          }
        });
        auditCount++;
      } catch (error) {
        // Skip duplicate audit logs (they're historical records)
        if (!error.message?.includes('Unique constraint')) {
          console.warn(`   ⚠️  Skipped audit log ${log.id}: ${error.message}`);
        }
      }
    }
    console.log(`   ✅ ${auditCount} audit logs (${data.auditLogs.length - auditCount} skipped duplicates)`);

    console.log('\n✅ IMPORT COMPLETE!\n');
    console.log('📊 FINAL SUMMARY:');
    console.log(`   • Departments:        ${data.departments.length}`);
    console.log(`   • Sub-Departments:    ${data.subDepartments.length}`);
    console.log(`   • Categories:         ${data.categories.length}`);
    console.log(`   • Master Attributes:  ${data.attributes.length}`);
    console.log(`   • Allowed Values:     ${data.allowedValues.length}`);
    console.log(`   • Attribute Mappings: ${data.categoryAttributes.length}`);
    console.log(`   • Users:              ${data.users.length}`);
    console.log(`   • Audit Logs:         ${auditCount}`);
    console.log('\n🎉 Database migration successful!\n');
    
  } catch (error) {
    console.error('\n❌ IMPORT FAILED:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (MODE === 'export') {
  exportData();
} else if (MODE === 'import') {
  importData();
} else {
  console.error('Usage: node simple-migration.js [export|import]');
  process.exit(1);
}
