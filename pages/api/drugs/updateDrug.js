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
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { id, name, strength, unit, batch_id, quantity, expiry_date } = req.body;
    await pool.query(
      `UPDATE drugs SET name=$1, strength=$2, unit=$3, batch_id=$4, quantity=$5, expiry_date=$6 WHERE id=$7`,
      [name, strength, unit, batch_id, quantity, expiry_date, id]
    );
    res.status(200).json({ message: "Drug updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update drug" });
  }
}
