import mysql from "mysql2/promise";

const globalForMySQL = globalThis;

const pool = globalForMySQL.mysqlPool ?? mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT) || 17065,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: {
    rejectUnauthorized: false
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForMySQL.mysqlPool = pool;
}

export default pool;