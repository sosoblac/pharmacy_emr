// import { Pool } from "pg";

// let pool;

// if (!pool) {
//   pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//   });

//   pool.on("connect", () => {
//     console.log("✅ Connected to PostgreSQL database");
//   });

//   pool.on("error", (err) => {
//     console.error("❌ Database connection error:", err);
//   });
// }

// export default pool;

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("✅ Connected to Neon PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ Database error:", err);
});

export default pool;

