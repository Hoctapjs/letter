const { getSql } = require("../_lib/db");
const { handleApiError, sendError, sendJson, setCors } = require("../_lib/http");
const { mapLetterRow } = require("../_lib/letters");

module.exports = async function handler(request, response) {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  const id = getId(request);
  if (!id) {
    sendError(response, 400, "Letter id is required.");
    return;
  }

  try {
    if (request.method === "GET") {
      await getLetter(response, id);
      return;
    }

    if (request.method === "PATCH" || request.method === "DELETE") {
      sendError(response, 501, "Edit token support will be enabled in step 9.");
      return;
    }

    sendError(response, 405, "Method not allowed.");
  } catch (error) {
    await handleApiError(response, error);
  }
};

function getId(request) {
  if (request.query && request.query.id) {
    return Array.isArray(request.query.id) ? request.query.id[0] : request.query.id;
  }

  const parts = (request.url || "").split("?")[0].split("/").filter(Boolean);
  return parts.at(-1);
}

async function getLetter(response, id) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, to_name, message, closing, author_name, meta, created_at, updated_at
    FROM letters
    WHERE id = ${id}
    LIMIT 1
  `;

  const letter = mapLetterRow(rows[0]);
  if (!letter) {
    sendError(response, 404, "Letter not found.");
    return;
  }

  sendJson(response, 200, {
    letter,
  });
}
