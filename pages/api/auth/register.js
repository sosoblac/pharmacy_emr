import { Pool } from "pg";
import bcrypt from "bcryptjs";

// 🔹 Configure PostgreSQL connection
const pool = new Pool({
  user: "postgres",        // your PostgreSQL username
  host: "localhost",       // change if using another host
  database: "pharmacy_emr", // your database name
  password: "lamis",       // your PostgreSQL password
  port: 5432,              // default PostgreSQL port
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fullname, username, password, role, facility_id } = req.body;

  if (!fullname || !username || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // 🔒 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔍 Check if username already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // 🧾 Insert new user
    const insertQuery = `
      INSERT INTO users (fullname, username, password, role, facility_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, fullname, username, role, facility_id;
    `;
    const values = [fullname, username, hashedPassword, role, facility_id || null];
    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
