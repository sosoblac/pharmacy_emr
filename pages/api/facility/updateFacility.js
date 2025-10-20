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
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id, name, location, contact } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Facility ID is required" });
    }

    await pool.query(
      `UPDATE facilities
       SET name = $1, location = $2, contact = $3
       WHERE id = $4`,
      [name, location, contact, id]
    );

    res.status(200).json({ message: "Facility updated successfully" });
  } catch (err) {
    console.error("Error updating facility:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
