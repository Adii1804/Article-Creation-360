require('dotenv').config();
const { Pool } = require('pg');

const conn = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!conn) {
  console.error('NO_DIRECT_OR_DATABASE_URL found in .env');
  process.exit(1);
}

console.log('Using connection string from env');

const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    console.log('Listing tables in public schema...');
    const tables = await pool.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
    console.log('TABLES:', tables.rows.map(r => r.table_name));

    console.log('\nChecking users table presence and admin@fashion.com...');
    const check = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users' LIMIT 1`);
    if (check.rowCount === 0) {
      console.log('users table NOT found in public schema');
    } else {
      console.log('users table FOUND — querying for admin@fashion.com');
      const res = await pool.query(`SELECT id, email, name, role, is_active FROM users WHERE email = $1 LIMIT 1`, ['admin@fashion.com']);
      if (res.rows.length) {
        console.log('FOUND');
        console.log(JSON.stringify(res.rows[0], null, 2));
      } else {
        console.log('NOT_FOUND');
      }
    }
  } catch (err) {
    console.error('QUERY_ERROR', err.message || err);
    if (err.stack) console.error(err.stack);
    process.exit(2);
  } finally {
    await pool.end();
  }
})();
