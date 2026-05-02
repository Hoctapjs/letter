const { getSql } = require("../_lib/db");
const { handleApiError, readBody, sendError, sendJson, setCors } = require("../_lib/http");
const { mapLetterRow, validateLetterPayload, verifyEditToken } = require("../_lib/letters");

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

    if (request.method === "PATCH") {
      const body = await readBody(request);
      await updateLetter(request, response, id, body);
      return;
    }

    if (request.method === "DELETE") {
      const body = await readBody(request);
      await deleteLetter(request, response, id, body);
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
    SELECT id, to_name, message, closing, author_name, meta, music_id, music_title, music_url, created_at, updated_at
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

async function updateLetter(request, response, id, body) {
  const sql = getSql();
  const editToken = getEditToken(request, body);
  const existing = await getLetterForMutation(sql, id);

  if (!existing) {
    sendError(response, 404, "Letter not found.");
    return;
  }

  if (!verifyEditToken(editToken, existing.edit_token_hash)) {
    sendError(response, 403, "Invalid edit token.");
    return;
  }

  const letter = validateLetterPayload(body, { id });
  const rows = await sql`
    UPDATE letters
    SET
      to_name = ${letter.to},
      message = ${letter.message},
      closing = ${letter.closing},
      author_name = ${letter.name},
      meta = ${letter.meta},
      music_id = ${letter.musicId},
      music_title = ${letter.musicTitle},
      music_url = ${letter.musicUrl},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, to_name, message, closing, author_name, meta, music_id, music_title, music_url, created_at, updated_at
  `;

  sendJson(response, 200, {
    letter: mapLetterRow(rows[0]),
  });
}

async function deleteLetter(request, response, id, body) {
  const sql = getSql();
  const editToken = getEditToken(request, body);
  const existing = await getLetterForMutation(sql, id);

  if (!existing) {
    sendError(response, 404, "Letter not found.");
    return;
  }

  if (!verifyEditToken(editToken, existing.edit_token_hash)) {
    sendError(response, 403, "Invalid edit token.");
    return;
  }

  await sql`
    DELETE FROM letters
    WHERE id = ${id}
  `;

  sendJson(response, 200, {
    deleted: true,
    id,
  });
}

async function getLetterForMutation(sql, id) {
  const rows = await sql`
    SELECT id, edit_token_hash
    FROM letters
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows[0] || null;
}

function getEditToken(request, body) {
  const headerToken = request.headers["x-edit-token"];
  const queryToken = request.query && request.query.token;
  const bodyToken = body && body.editToken;
  const token = Array.isArray(queryToken) ? queryToken[0] : queryToken || bodyToken || headerToken;
  return typeof token === "string" ? token.trim() : "";
}
