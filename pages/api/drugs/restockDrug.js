// /pages/api/drugs/restockDrug.js
import { Pool } from "pg";

// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "pharmacy_emr",
//   password: "lamis",
//   port: 5432,
// });

// ✅ Use Neon connection (via environment variable)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id, amount } = req.body;

    if (!id || !amount) {
      return res.status(400).json({ error: "Drug ID and amount are required" });
    }

    const result = await pool.query(
      `UPDATE drugs
       SET quantity = quantity + $1
       WHERE id = $2
       RETURNING *;`,
      [amount, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Drug not found" });
    }

    res
      .status(200)
      .json({ message: "Drug restocked successfully", drug: result.rows[0] });
  } catch (error) {
    console.error("Error restocking drug:", error);
    res.status(500).json({ error: "Failed to restock drug" });
  }
}
