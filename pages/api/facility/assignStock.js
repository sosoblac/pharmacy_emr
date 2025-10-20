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
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    facility_id,
    drug_id,
    batch_no,
    quantity_assigned,
    expiry_date,
    assigned_by,
  } = req.body;

  // Validate inputs
  if (!facility_id || !drug_id || !batch_no || !quantity_assigned) {
    return res.status(400).json({
      message:
        "facility_id, drug_id, batch_no, and quantity_assigned are required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Lock the drug row to avoid race conditions
    const drugRes = await client.query(
      "SELECT id, name, quantity FROM drugs WHERE id = $1 FOR UPDATE",
      [drug_id]
    );

    if (drugRes.rows.length === 0) {
      throw new Error("Drug not found");
    }

    const availableQty = Number(drugRes.rows[0].quantity);
    const assignQty = Number(quantity_assigned);

    if (availableQty < assignQty) {
      throw new Error("Not enough stock in central inventory");
    }

    // 2️⃣ Deduct assigned quantity from central stock
    const updateDrugRes = await client.query(
      "UPDATE drugs SET quantity = quantity - $1 WHERE id = $2 RETURNING quantity",
      [assignQty, drug_id]
    );

    const newCentralQty = updateDrugRes.rows[0].quantity;

    // 3️⃣ Record the assignment in the stock table
    const insertText = `
      INSERT INTO stock
        (facility_id, drug_id, batch_no, quantity_assigned, quantity_remaining, expiry_date, assigned_by, assigned_at)
      VALUES
        ($1, $2, $3, $4, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const insertVals = [
      facility_id,
      drug_id,
      batch_no,
      assignQty,
      expiry_date || null,
      assigned_by || null,
    ];

    const insertRes = await client.query(insertText, insertVals);

    await client.query("COMMIT");

    // ✅ Return full response
    return res.status(201).json({
      message: "Stock assigned successfully",
      assignment: insertRes.rows[0],
      remaining_central_stock: newCentralQty,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("assignStock error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Error assigning stock" });
  } finally {
    client.release();
  }
}
