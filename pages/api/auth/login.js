// import { Pool } from "pg";
// import bcrypt from "bcryptjs";

// // PostgreSQL connection
// const pool = new Pool({
//   user: "postgres",        // your username
//   host: "localhost",
//   database: "pharmacy_emr", // your database name
//   password: "lamis",       // your password
//   port: 5432,
// });

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   const { username, password } = req.body;

//   if (!username || !password) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     // Find user by username
//     const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

//     if (result.rows.length === 0) {
//       return res.status(401).json({ error: "Invalid username or password" });
//     }

//     const user = result.rows[0];

//     // Compare password
//     const passwordMatch = await bcrypt.compare(password, user.password);
//     if (!passwordMatch) {
//       return res.status(401).json({ error: "Invalid username or password" });
//     }

//     // Remove password before sending user info
//     delete user.password;

//     res.status(200).json({ message: "Login successful", user });
//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Query the Neon database
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    delete user.password; // remove sensitive data

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
