import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://ph_user:ph_pass@localhost:5432/ph_gestion",
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}
