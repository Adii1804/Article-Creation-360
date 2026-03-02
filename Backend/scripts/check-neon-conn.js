const { Pool } = require('pg');

const conn = process.argv[2];
if (!conn) {
  console.error('Usage: node check-neon-conn.js <connection_string>');
  process.exit(1);
}

console.log('Connecting with:', conn);

const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    const tables = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log('TABLES:', tables.rows.map(r => r.table_name));

    const checkTable = await pool.query("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users' LIMIT 1");
    if (checkTable.rowCount === 0) {
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
