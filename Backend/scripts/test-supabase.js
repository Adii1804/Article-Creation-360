const { PrismaClient } = require('../src/generated/prisma');

async function testSupabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Testing Supabase connection...\n');
    
    // Test connection
    const userCount = await prisma.user.count();
    console.log('✅ Connected to Supabase!');
    console.log(`📊 Users in database: ${userCount}\n`);
    
    // List tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('📋 Tables created:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

await testSupabaseConnection();
