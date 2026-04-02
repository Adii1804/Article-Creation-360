require('dotenv').config();
const { parsePath } = require('./pathParser');
const cat = require('./categoryMapping.json');
const { WATCH_ROOT } = require('./config');

console.log('WATCH_ROOT:', WATCH_ROOT);

// Real path from the test folder
const testPath = 'C:\\Users\\Administrator\\Desktop\\ss\\2026\\APR\\MENS\\02.04.2026\\SUDHARMA KNITS - 200567\\M_TEES_HS\\1110115319.jpg';
console.log('Test path:', testPath);

const result = parsePath(testPath);
console.log('\nParsed result:', JSON.stringify(result, null, 2));

if (result) {
  const catEntry = cat[result.majorCategoryFolder];
  console.log('Category lookup:', JSON.stringify(catEntry));
  console.log('\n✅ Path parser working correctly!');
  console.log('  year:              ', result.year);
  console.log('  month:             ', result.month);
  console.log('  division:          ', result.division);
  console.log('  date:              ', result.date);
  console.log('  vendorName:        ', result.vendorName);
  console.log('  vendorCode:        ', result.vendorCode);
  console.log('  majorCategory:     ', result.majorCategoryFolder);
  console.log('  sub_division:      ', catEntry?.sub_division);
  console.log('  mc_code:           ', catEntry?.mc_code);
} else {
  console.log('\n❌ Path parser returned null');
}
