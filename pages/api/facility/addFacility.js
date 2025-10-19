import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "pharmacy_emr",
  password: "lamis",
  port: 5432,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, location, contact } = req.body;
    if (!name) return res.status(400).json({ error: "Facility name is required" });

    await pool.query(
      "INSERT INTO facilities (name, location, contact) VALUES ($1, $2, $3)",
      [name, location, contact]
    );

    res.status(201).json({ message: "Facility added successfully" });
  } catch (err) {
    console.error("Error adding facility:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
