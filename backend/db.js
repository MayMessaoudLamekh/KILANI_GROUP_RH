const sql = require('mssql');

const DB_SERVER = process.env.DB_SERVER || '127.0.0.1';
const DB_PORT   = parseInt(process.env.DB_PORT || '1433', 10);
const DB_USER   = process.env.DB_USER || 'sa';
const DB_PASS   = process.env.DB_PASSWORD || 'MotDePasse123!';
const DB_NAME   = process.env.DB_NAME || 'KilaniHRDB';

const config = {
  user: DB_USER,
  password: DB_PASS,
  server: DB_SERVER,
  port: DB_PORT,
  database: DB_NAME,
  options: {
    encrypt: false,           // Azure SQL Edge en local ne nécessite pas TLS
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Singleton pool — créé une seule fois
let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('✅ Connexion SQL Server établie');
  }
  return pool;
}

/**
 * Execute a SQL SELECT query — returns array of row objects.
 * @param {string} sqlText  — query text (NO semicolons at end needed)
 * @param {Object} [params] — named parameters { name: value }
 */
async function query(sqlText, params = {}) {
  try {
    const p = await getPool();
    const request = p.request();
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    const result = await request.query(sqlText);
    return result.recordset;
  } catch (err) {
    console.error('DB Query Error:', err.message);
    throw err;
  }
}

/**
 * Execute a SQL INSERT / UPDATE / DELETE command.
 * @param {string} sqlText  — command text
 * @param {Object} [params] — named parameters { name: value }
 */
async function execute(sqlText, params = {}) {
  try {
    const p = await getPool();
    const request = p.request();
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
    const result = await request.query(sqlText);
    return result;
  } catch (err) {
    console.error('DB Execute Error:', err.message);
    throw err;
  }
}

module.exports = { query, execute, sql };
