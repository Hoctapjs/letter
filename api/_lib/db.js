const postgres = require("postgres");

let sqlClient;

function getSql() {
  if (!process.env.DATABASE_URL) {
    const error = new Error("DATABASE_URL is not configured.");
    error.statusCode = 500;
    throw error;
  }

  if (!sqlClient) {
    sqlClient = postgres(process.env.DATABASE_URL, {
      max: 1,
      prepare: false,
      ssl: "require",
    });
  }

  return sqlClient;
}

module.exports = {
  getSql,
};
