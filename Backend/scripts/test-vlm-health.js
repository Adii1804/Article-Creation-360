require('dotenv').config();
const { VLMService } = require('../src/services/vlm/vlmService.ts');

(async () => {
  console.log('\n🔍 Testing VLM Provider Health...\n');
  
  const { VLMService: VLM } = require('../src/services/vlm/vlmService');
  
  const service = new VLM();
  const health = await service.checkProviderHealth();
  
  console.log('\n📊 Final Health Status:');
  Object.entries(health).forEach(([provider, healthy]) => {
    console.log(`  ${healthy ? '✅' : '❌'} ${provider}: ${healthy ? 'READY' : 'UNAVAILABLE'}`);
  });
  
  const healthyCount = Object.values(health).filter(Boolean).length;
  console.log(`\n🎯 ${healthyCount}/${Object.keys(health).length} providers ready for extraction\n`);
})();
