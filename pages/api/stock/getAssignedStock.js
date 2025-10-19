// pages/api/stock/getAssignedStock.js
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
    // Join to get facility name and drug name if available
    const q = `
      SELECT s.*, f.name as facility_name, d.name as drug_name, d.batch_id as drug_batch_id
      FROM stock s
      LEFT JOIN facilities f ON f.id = s.facility_id
      LEFT JOIN drugs d ON d.id = s.drug_id
      ORDER BY s.assigned_at DESC
      LIMIT 200;
    `;
    const result = await pool.query(q);
    res.status(200).json({ assignments: result.rows });
  } catch (err) {
    console.error("getAssignedStock error:", err);
    res.status(500).json({ error: "Failed to fetch assigned stock" });
  }
}
