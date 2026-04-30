const { getSql } = require("../_lib/db");
const { handleApiError, readBody, sendError, sendJson, setCors } = require("../_lib/http");
const { createEditToken, hashEditToken, mapLetterRow, validateLetterPayload } = require("../_lib/letters");

module.exports = async function handler(request, response) {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  try {
    if (request.method === "GET") {
      await listLetters(response);
      return;
    }

    if (request.method === "POST") {
      const body = await readBody(request);
      await createLetter(response, body);
      return;
    }

    sendError(response, 405, "Method not allowed.");
  } catch (error) {
    await handleApiError(response, error);
  }
};

async function listLetters(response) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, to_name, message, closing, author_name, meta, created_at, updated_at
    FROM letters
    ORDER BY created_at DESC
    LIMIT 100
  `;

  sendJson(response, 200, {
    letters: rows.map(mapLetterRow),
  });
}

async function createLetter(response, body) {
  const sql = getSql();
  const letter = validateLetterPayload(body);
  const editToken = createEditToken();
  const editTokenHash = hashEditToken(editToken);
  const rows = await sql`
    INSERT INTO letters (
      id,
      to_name,
      message,
      closing,
      author_name,
      meta,
      edit_token_hash
    )
    VALUES (
      ${letter.id},
      ${letter.to},
      ${letter.message},
      ${letter.closing},
      ${letter.name},
      ${letter.meta},
      ${editTokenHash}
    )
    RETURNING id, to_name, message, closing, author_name, meta, created_at, updated_at
  `;

  sendJson(response, 201, {
    letter: mapLetterRow(rows[0]),
    editToken,
  });
}
