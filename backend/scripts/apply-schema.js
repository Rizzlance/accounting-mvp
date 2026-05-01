const fs = require("fs");
const path = require("path");
const db = require("../config/db");

async function applySchema() {
  const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  await db.query(sql);
  await db.end();

  console.log("Database schema applied successfully.");
}

applySchema().catch((err) => {
  console.error("Failed to apply database schema:", err.message);
  process.exit(1);
});
