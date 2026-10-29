const { Pool, types } = require("pg");

types.setTypeParser(1082, (valeur) => valeur);
types.setTypeParser(1700, (valeur) => Number(valeur));
types.setTypeParser(1114, (valeur) => valeur);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;
