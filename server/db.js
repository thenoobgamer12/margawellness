// This module configures and exports a PostgreSQL connection pool.
// It uses environment variables for configuration for security and flexibility.
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

export const db = {
  // The query function is a simple wrapper around the pool's query method.
  query: (text, params) => pool.query(text, params),
};