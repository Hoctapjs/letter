const crypto = require("crypto");

const MAX_SHORT_TEXT = 240;
const MAX_URL = 2000;
const MAX_MESSAGE = 12000;

function createId() {
  return crypto.randomUUID();
}

function createEditToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashEditToken(editToken) {
  if (!process.env.TOKEN_SECRET) {
    const error = new Error("TOKEN_SECRET is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return crypto.createHmac("sha256", process.env.TOKEN_SECRET).update(editToken).digest("hex");
}

function verifyEditToken(editToken, editTokenHash) {
  if (!editToken || !editTokenHash) return false;

  const candidateHash = hashEditToken(editToken);
  const candidateBuffer = Buffer.from(candidateHash, "hex");
  const storedBuffer = Buffer.from(editTokenHash, "hex");

  if (candidateBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
}

function normalizeText(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function validateLetterPayload(payload, options = {}) {
  const data = payload || {};
  const message = normalizeText(data.message);
  const to = normalizeText(data.to);
  const closing = normalizeText(data.closing, "With love") || "With love";
  const name = normalizeText(data.name);
  const meta = normalizeText(data.meta);
  const musicId = normalizeText(data.musicId || data.music_id);
  const musicTitle = normalizeText(data.musicTitle || data.music_title);
  const musicUrl = normalizeText(data.musicUrl || data.music_url);
  const errors = [];

  if (!message) {
    errors.push("message is required.");
  }

  if (message.length > MAX_MESSAGE) {
    errors.push(`message must be ${MAX_MESSAGE} characters or less.`);
  }

  [
    ["to", to],
    ["closing", closing],
    ["name", name],
    ["meta", meta],
    ["musicId", musicId],
    ["musicTitle", musicTitle],
  ].forEach(([field, value]) => {
    if (value.length > MAX_SHORT_TEXT) {
      errors.push(`${field} must be ${MAX_SHORT_TEXT} characters or less.`);
    }
  });

  if (musicUrl.length > MAX_URL) {
    errors.push(`musicUrl must be ${MAX_URL} characters or less.`);
  }

  if (errors.length) {
    const error = new Error("Invalid letter payload.");
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  return {
    to,
    message,
    closing,
    name,
    meta,
    musicId,
    musicTitle,
    musicUrl,
    id: options.id || createId(),
  };
}

function mapLetterRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    to: row.to_name || "",
    message: row.message || "",
    closing: row.closing || "With love",
    name: row.author_name || "",
    meta: row.meta || "",
    musicId: row.music_id || "",
    musicTitle: row.music_title || "",
    musicUrl: row.music_url || "",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

module.exports = {
  createEditToken,
  hashEditToken,
  mapLetterRow,
  validateLetterPayload,
  verifyEditToken,
};
