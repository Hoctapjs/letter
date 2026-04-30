function sendJson(response, statusCode, data) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(data));
}

function sendError(response, statusCode, message, details) {
  sendJson(response, statusCode, {
    error: {
      message,
      details,
    },
  });
}

function setCors(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Edit-Token");
}

async function readBody(request) {
  try {
    if (request.body && typeof request.body === "object") {
      return request.body;
    }

    if (typeof request.body === "string") {
      return JSON.parse(request.body || "{}");
    }

    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }

    const rawBody = Buffer.concat(chunks).toString("utf8");
    return rawBody ? JSON.parse(rawBody) : {};
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

async function handleApiError(response, error) {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Internal server error." : error.message;
  sendError(response, statusCode, message, error.details);
}

module.exports = {
  handleApiError,
  readBody,
  sendError,
  sendJson,
  setCors,
};
