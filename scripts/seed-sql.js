
require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const pool = require("../src/config/db");

async function executer(fichier) {
  const sql = fs.readFileSync(path.join(__dirname, "..", "database", fichier), "utf8");
  await pool.query(sql); 
  console.log(`PostgreSQL : ${fichier} exécuté`);
}

async function main() {
  if (process.argv.includes("--schema")) await executer("schema.sql");
  await executer("seed.sql");
}

main()
  .catch((err) => {
    console.error("Seed PostgreSQL impossible :", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
