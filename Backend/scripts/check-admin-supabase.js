require('dotenv').config();
const { Pool } = require('pg');

const conn = process.env.OLD_DATABASE_URL;
if (!conn) {
  console.error('NO_OLD_DATABASE_URL found in .env');
  process.exit(1);
}

// Use ssl:false by default; if the connection string requires ssl, Pool will still negotiate
const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    const res = await pool.query(
      `SELECT id, email, name, role, is_active FROM users WHERE email = $1 LIMIT 1`,
      ['admin@fashion.com']
    );

    if (res.rows.length) {
      console.log('FOUND');
      console.log(JSON.stringify(res.rows[0], null, 2));
    } else {
      console.log('NOT_FOUND');
    }
  } catch (err) {
    console.error('QUERY_ERROR', err.message || err);
    if (err.stack) console.error(err.stack);
    process.exit(2);
  } finally {
    await pool.end();
  }
})();
