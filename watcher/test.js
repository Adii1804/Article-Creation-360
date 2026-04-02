/**
 * Watcher Test Script
 * Run: node test.js
 *
 * Tests each part independently so you know exactly what's working and what's not.
 */

require('dotenv').config();

const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { API_BASE_URL, WATCHER_API_KEY, WATCH_ROOT, VALID_DIVISIONS } = require('./config');
const { parsePath } = require('./pathParser');
const categoryMapping = require('./categoryMapping.json');

let passed = 0;
let failed = 0;

function ok(label)  { console.log(`  ✅ ${label}`); passed++; }
function fail(label, reason) { console.log(`  ❌ ${label}`); console.log(`     → ${reason}`); failed++; }
function section(title) { console.log(`\n─── ${title} ───`); }

// ─────────────────────────────────────────────
// 1. CONFIG CHECK
// ─────────────────────────────────────────────
section('1. Config');

if (WATCHER_API_KEY) ok(`WATCHER_API_KEY is set (${WATCHER_API_KEY.slice(0,4)}...)`);
else fail('WATCHER_API_KEY', 'Not set in .env — watcher cannot authenticate with backend');

if (API_BASE_URL) ok(`API_BASE_URL = ${API_BASE_URL}`);
else fail('API_BASE_URL', 'Not set in .env');

if (WATCH_ROOT) ok(`WATCH_ROOT = ${WATCH_ROOT}`);
else fail('WATCH_ROOT', 'Not set in .env');

// ─────────────────────────────────────────────
// 2. CATEGORY MAPPING CHECK
// ─────────────────────────────────────────────
section('2. Category Mapping');

const totalEntries = Object.keys(categoryMapping).length;
if (totalEntries > 0) ok(`categoryMapping.json loaded — ${totalEntries} entries`);
else fail('categoryMapping.json', 'Empty or missing');

// Spot-check a few known entries
const spots = ['MW_TXT_JKT_FS', 'L_SHIRTS', 'JB_SHIRT_FS'];
spots.forEach(key => {
  const entry = categoryMapping[key];
  if (entry && entry.sub_division && entry.mc_code)
    ok(`  ${key} → sub_division=${entry.sub_division}, mc_code=${entry.mc_code}`);
  else
    fail(`Lookup: ${key}`, 'Not found in categoryMapping.json');
});

// ─────────────────────────────────────────────
// 3. PATH PARSER CHECK
// ─────────────────────────────────────────────
section('3. Path Parser');

// Build a fake path using WATCH_ROOT
const sep = '\\';
const fakePath = [
  WATCH_ROOT,
  '2026', 'MAR', 'MENS', '26.03.2026',
  'AR ENTERPRISES-200605',
  'MW_TXT_JKT_FS',
  'test_image.jpg'
].join(sep);

const parsed = parsePath(fakePath);
if (parsed) {
  ok(`Path parsed successfully`);
  ok(`  division   = ${parsed.division}`);
  ok(`  vendorName = ${parsed.vendorName}`);
  ok(`  vendorCode = ${parsed.vendorCode}`);
  ok(`  majorCategoryFolder = ${parsed.majorCategoryFolder}`);

  const catEntry = categoryMapping[parsed.majorCategoryFolder];
  if (catEntry) ok(`  category lookup → sub_division=${catEntry.sub_division}, mc_code=${catEntry.mc_code}`);
  else fail('Category lookup for parsed path', `"${parsed.majorCategoryFolder}" not in categoryMapping.json`);
} else {
  fail('Path parser', `Could not parse: ${fakePath}`);
}

// Test WOMENS → LADIES normalization
const womensPath = [WATCH_ROOT, '2026', 'MAR', 'WOMENS', '01.04.2026', 'VENDOR-999', 'L_SHIRTS', 'img.jpg'].join(sep);
const womens = parsePath(womensPath);
if (womens && womens.division === 'LADIES') ok(`WOMENS folder correctly normalized → division=LADIES`);
else fail('WOMENS normalization', `Got division="${womens?.division}" — expected "LADIES"`);

// ─────────────────────────────────────────────
// 4. BACKEND HEALTH CHECK
// ─────────────────────────────────────────────
section('4. Backend Connectivity');

async function testBackend() {
  // 4a. Health endpoint (no auth needed)
  try {
    const res = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
    if (res.data?.status === 'ok') ok(`Backend is reachable at ${API_BASE_URL}`);
    else fail('Backend health', `Unexpected response: ${JSON.stringify(res.data)}`);
  } catch (e) {
    fail('Backend health', `Cannot reach ${API_BASE_URL}/api/health — is the backend running? (${e.message})`);
    return; // No point continuing if backend is down
  }

  // 4b. Watcher key check (send a request with correct key — expect 400 "no image", not 401)
  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/watcher/extract/upload`,
      new FormData(), // empty form — will fail with 400, but proves auth passed
      { headers: { 'X-Watcher-Key': WATCHER_API_KEY }, timeout: 5000, validateStatus: () => true }
    );
    if (res.status === 401) {
      fail('Watcher API key', `Got 401 — WATCHER_API_KEY in .env doesn't match backend WATCHER_API_KEY`);
    } else if (res.status === 500 && String(res.data?.error).includes('not configured')) {
      fail('Watcher API key', `Backend WATCHER_API_KEY env var is not set`);
    } else {
      ok(`Watcher API key accepted by backend (status: ${res.status})`);
    }
  } catch (e) {
    fail('Watcher API key test', e.message);
  }

  // 4c. Wrong key check — should get 401
  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/watcher/extract/upload`,
      new FormData(),
      { headers: { 'X-Watcher-Key': 'wrong-key-12345' }, timeout: 5000, validateStatus: () => true }
    );
    if (res.status === 401) ok(`Wrong key correctly rejected with 401`);
    else fail('Wrong key rejection', `Expected 401 but got ${res.status}`);
  } catch (e) {
    fail('Wrong key test', e.message);
  }

  // ─────────────────────────────────────────────
  // 5. FULL END-TO-END TEST (real image)
  // ─────────────────────────────────────────────
  section('5. End-to-End: Submit a real image');

  // Find any .jpg on desktop to use as a test image
  const testImageCandidates = [
    'C:\\Users\\Administrator\\Desktop\\1110115319.jpg',
    path.join(process.env.USERPROFILE || 'C:\\Users\\Administrator', 'Desktop', '1110115319.jpg'),
  ];

  const testImage = testImageCandidates.find(p => fs.existsSync(p));

  if (!testImage) {
    console.log('  ⚠️  No test image found — skipping end-to-end test');
    console.log('     Put any .jpg file at C:\\Users\\Administrator\\Desktop\\1110115319.jpg to enable this test');
  } else {
    ok(`Test image found: ${testImage}`);

    const form = new FormData();
    form.append('image', fs.createReadStream(testImage), { filename: 'test_image.jpg', contentType: 'image/jpeg' });
    form.append('schema', '[]');
    form.append('categoryName', 'MW_TXT_JKT_FS');
    form.append('source', 'WATCHER');
    form.append('image_unc_path', `\\\\File\\0-v2\\TEST\\${Date.now()}\\test_image.jpg`); // unique path so it's not a duplicate
    form.append('watcher_division',          'MENS');
    form.append('watcher_vendor_name',       'TEST VENDOR');
    form.append('watcher_vendor_code',       'TEST001');
    form.append('watcher_major_category',    'MW_TXT_JKT_FS');
    form.append('watcher_sub_division',      'MW');
    form.append('watcher_mc_code',           '117140101');

    try {
      console.log('  Submitting to backend... (this may take 10-30 seconds for Gemini extraction)');
      const res = await axios.post(
        `${API_BASE_URL}/api/watcher/extract/upload`,
        form,
        {
          headers: { ...form.getHeaders(), 'X-Watcher-Key': WATCHER_API_KEY },
          timeout: 60_000,
          validateStatus: () => true,
        }
      );

      if (res.data?.success) {
        ok(`Image submitted and processed successfully!`);
        ok(`  jobId  = ${res.data.data?.persistence?.jobId}`);
        ok(`  flatId = ${res.data.data?.persistence?.flatId}`);
        console.log('  → Check your approver dashboard — a new record should appear.');
      } else if (res.status === 409) {
        ok(`Backend correctly returned DUPLICATE (image already in DB)`);
      } else {
        fail('End-to-end submit', `Status ${res.status} — ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      fail('End-to-end submit', e.message);
    }
  }

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log('\n══════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('  🎉 Everything is working!');
  else              console.log('  Fix the ❌ items above before running the watcher.');
  console.log('══════════════════════════════════\n');
}

testBackend().catch(err => {
  console.error('\nUnexpected error during tests:', err.message);
});
