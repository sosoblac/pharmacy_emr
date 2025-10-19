import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "pharmacy_emr",
  password: "lamis",
  port: 5432,
});

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Facility ID is required" });
    }

    await pool.query("DELETE FROM facilities WHERE id = $1", [id]);
    res.status(200).json({ message: "Facility deleted successfully" });
  } catch (err) {
    console.error("Error deleting facility:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
