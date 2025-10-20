// // /pages/api/drugs/addDrug.js
// import { Pool } from "pg";

// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "pharmacy_emr",
//   password: "lamis",
//   port: 5432,
// });

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   try {
//     const { name, strength, unit, quantity, batch_id, expiry_date } = req.body;

//     // Validate input fields
//     if (!name || !strength || !unit || quantity == null || !batch_id || !expiry_date) {
//       return res.status(400).json({
//         error:
//           "Name, strength, unit, quantity, batch ID, and expiry date are required",
//       });
//     }

//     // Insert into database
//     const result = await pool.query(
//       `INSERT INTO drugs (name, strength, unit, quantity, batch_id, expiry_date, created_at)
//        VALUES ($1, $2, $3, $4, $5, $6, NOW())
//        RETURNING *;`,
//       [name, strength, unit, quantity, batch_id, expiry_date]
//     );

//     res.status(201).json({
//       message: "✅ Drug added successfully",
//       drug: result.rows[0],
//     });
//   } catch (error) {
//     console.error("Error adding drug:", error);
//     res.status(500).json({ error: "Failed to add drug" });
//   }
// }

// /pages/api/drugs/addDrug.js
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
    const { name, strength, quantity, batch_id, expiry_date } = req.body;

    // ✅ Validate input fields
    if (!name || !strength || quantity == null || !batch_id || !expiry_date) {
      return res.status(400).json({
        error: "Name, strength, quantity, batch ID, and expiry date are required",
      });
    }

    // ✅ Insert into database (without 'unit')
    const result = await pool.query(
      `INSERT INTO drugs (name, strength, quantity, batch_id, expiry_date, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *;`,
      [name, strength, quantity, batch_id, expiry_date]
    );

    res.status(201).json({
      message: "✅ Drug added successfully",
      drug: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding drug:", error);
    res.status(500).json({ error: "Failed to add drug" });
  }
}
