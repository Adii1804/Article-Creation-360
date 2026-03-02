import { PrismaClient, GarmentType } from '../src/generated/prisma';

const prisma = new PrismaClient();

// Classification rules based on sub-department codes and category patterns
const garmentTypeMapping: Record<string, GarmentType> = {
  // UPPER garment keywords
  'TEES': 'UPPER',
  'TOP': 'UPPER',
  'SHIRT': 'UPPER',
  'SWEATER': 'UPPER',
  'SWTR': 'UPPER',
  'JACKET': 'UPPER',
  'VEST': 'UPPER',
  'CROP': 'UPPER',
  'KURTI': 'UPPER',
  'KURTA': 'UPPER',
  'THERMAL_UPPER': 'UPPER',
  'THRM_UPPER': 'UPPER',
  'TIGHTS_HS': 'UPPER', // Half sleeve tights
  'TIGHTS_FS': 'UPPER', // Full sleeve tights
  'SKEEVY': 'UPPER',
  'FLC_TOP': 'UPPER',
  
  // LOWER garment keywords
  'PYJAMA': 'LOWER',
  'TRSR': 'LOWER', // Trouser
  'JEANS': 'LOWER',
  'PANTS': 'LOWER',
  'SHORTS': 'LOWER',
  'BERMUDA': 'LOWER',
  'CARGO': 'LOWER',
  'CAPRI': 'LOWER',
  'JAMAICAN': 'LOWER',
  'LEGGING': 'LOWER',
  'SKIRT': 'LOWER',
  'BRIEF': 'LOWER',
  'BOXER': 'LOWER',
  'PANTY': 'LOWER',
  'BLOOMER': 'LOWER',
  'HOT_PANT': 'LOWER',
  'THERMAL_L': 'LOWER',
  'THRM_L': 'LOWER',
  
  // ALL_IN_ONE garments
  'FROCK': 'ALL_IN_ONE',
  'DRESS': 'ALL_IN_ONE',
  'SUIT': 'ALL_IN_ONE',
  'NIGHTY': 'ALL_IN_ONE',
  'SLIPS': 'ALL_IN_ONE', // Full slip
  'JUMPSUIT': 'ALL_IN_ONE',
  'ROMPER': 'ALL_IN_ONE',
  'KURTA_ST': 'ALL_IN_ONE', // Kurta set
  'B_SUIT': 'ALL_IN_ONE', // Baby suit
  'DNGR_SUIT': 'ALL_IN_ONE', // Dungaree suit
  
  // Accessories/Others - classify based on context
  'BRA': 'LOWER', // Lingerie treated as lower
  'CAP': 'LOWER',
  'GLOVES': 'LOWER',
  'SCARF': 'UPPER',
  'BIB': 'UPPER',
  'MODI_JKT': 'UPPER', // Modi jacket
};

async function classifyCategories() {
  console.log('🔍 Starting category classification...\n');
  
  const categories = await prisma.category.findMany({
    include: {
      subDepartment: {
        include: {
          department: true
        }
      }
    }
  });
  
  console.log(`📊 Total categories to classify: ${categories.length}\n`);
  
  let upperCount = 0;
  let lowerCount = 0;
  let allInOneCount = 0;
  
  for (const category of categories) {
    let garmentType: GarmentType = 'UPPER'; // Default
    
    const code = category.code.toUpperCase();
    const name = category.name.toUpperCase();
    const desc = category.merchandiseDesc?.toUpperCase() || '';
    const subDeptName = category.subDepartment.description?.toUpperCase() || '';
    
    // Check for keywords in order of specificity
    let matched = false;
    
    // First check for ALL_IN_ONE patterns (most specific)
    for (const [keyword, type] of Object.entries(garmentTypeMapping)) {
      if (type === 'ALL_IN_ONE') {
        if (code.includes(keyword) || name.includes(keyword) || desc.includes(keyword)) {
          garmentType = 'ALL_IN_ONE';
          matched = true;
          break;
        }
      }
    }
    
    // Then check for LOWER patterns
    if (!matched) {
      for (const [keyword, type] of Object.entries(garmentTypeMapping)) {
        if (type === 'LOWER') {
          if (code.includes(keyword) || name.includes(keyword) || desc.includes(keyword)) {
            garmentType = 'LOWER';
            matched = true;
            break;
          }
        }
      }
    }
    
    // Finally check for UPPER patterns
    if (!matched) {
      for (const [keyword, type] of Object.entries(garmentTypeMapping)) {
        if (type === 'UPPER') {
          if (code.includes(keyword) || name.includes(keyword) || desc.includes(keyword)) {
            garmentType = 'UPPER';
            matched = true;
            break;
          }
        }
      }
    }
    
    // Sub-department based fallback
    if (!matched) {
      if (subDeptName.includes('UPPER') || subDeptName.includes('-U')) {
        garmentType = 'UPPER';
      } else if (subDeptName.includes('LOWER') || subDeptName.includes('-L')) {
        garmentType = 'LOWER';
      } else if (subDeptName.includes('SETS') || subDeptName.includes('SET')) {
        garmentType = 'ALL_IN_ONE';
      }
    }
    
    // Update category
    await prisma.category.update({
      where: { id: category.id },
      data: { garmentType }
    });
    
    // Count
    if (garmentType === 'UPPER') upperCount++;
    else if (garmentType === 'LOWER') lowerCount++;
    else allInOneCount++;
    
    console.log(`✅ ${category.code.padEnd(20)} → ${garmentType.padEnd(12)} (${category.subDepartment.department.name}/${category.subDepartment.name})`);
  }
  
  console.log('\n📈 Classification Summary:');
  console.log(`   UPPER:       ${upperCount} categories`);
  console.log(`   LOWER:       ${lowerCount} categories`);
  console.log(`   ALL_IN_ONE:  ${allInOneCount} categories`);
  console.log(`   TOTAL:       ${categories.length} categories`);
  console.log('\n✨ Classification complete!');
}

classifyCategories()
  .catch((error) => {
    console.error('❌ Classification failed:', error);
    (globalThis as any).process.exit(1);
  })
  .finally(() => prisma.$disconnect());
