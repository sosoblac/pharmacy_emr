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
    const result = await pool.query("SELECT * FROM facilities ORDER BY id DESC");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching facilities:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
