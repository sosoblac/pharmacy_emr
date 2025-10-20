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
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { id } = req.query;
    await pool.query(`DELETE FROM drugs WHERE id=$1`, [id]);
    res.status(200).json({ message: "Drug deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete drug" });
  }
}
