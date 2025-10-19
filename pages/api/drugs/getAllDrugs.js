// /pages/api/drugs/getAllDrugs.js
import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "pharmacy_emr",
  password: "lamis",
  port: 5432,
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, strength, unit, quantity, created_at
       FROM drugs
       ORDER BY name ASC;`
    );

    res.status(200).json({ drugs: result.rows });
  } catch (error) {
    console.error("Error fetching drugs:", error);
    res.status(500).json({ error: "Failed to fetch drugs" });
  }
}
