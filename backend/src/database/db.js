require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
      }
    : {
        user: process.env.DB_USER || "postgres",
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_NAME || "barberflow",
        password: process.env.DB_PASSWORD || "admin",
        port: Number(process.env.DB_PORT) || 5432,
      },
);

module.exports = pool;

pool
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL");
  })
  .catch((err) => {
    console.error("Connection error", err);
  });
