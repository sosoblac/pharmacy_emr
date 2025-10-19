// /pages/api/admin/overview.js
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
    const client = await pool.connect();

    const facilitiesQuery = await client.query(`SELECT COUNT(*) FROM facilities`);
    const drugsQuery = await client.query(`SELECT COUNT(*) FROM drugs`);
    const stockCountQuery = await client.query(`SELECT COUNT(*) FROM stock`);
    const stockSumQuery = await client.query(`
      SELECT COALESCE(SUM(quantity_assigned), 0) AS total_assigned FROM stock
    `);
    const expiringDrugsQuery = await client.query(`
      SELECT COUNT(*) 
      FROM drugs
      WHERE expiry_date <= NOW() + INTERVAL '14 days'
    `);

    client.release();

    res.status(200).json({
      facilities: parseInt(facilitiesQuery.rows[0].count, 10),
      totalDrugs: parseInt(drugsQuery.rows[0].count, 10),
      stockEntries: parseInt(stockCountQuery.rows[0].count, 10),
      totalQuantityAssigned: parseInt(stockSumQuery.rows[0].total_assigned, 10),
      expiringSoon: parseInt(expiringDrugsQuery.rows[0].count, 10),
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
}

