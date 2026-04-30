const DRAFT_KEY = "dearLetters.draft";
const TOKEN_STORAGE_KEY = "dearLetters.editTokens";
const LETTER_SCHEMA_VERSION = 1;
const API_BASE = "/api/letters";

const elements = {
  form: document.querySelector("#letterForm"),
  formTitle: document.querySelector("#formTitle"),
  formSubtitle: document.querySelector("#formSubtitle"),
  to: document.querySelector("#toInput"),
  message: document.querySelector("#messageInput"),
  closing: document.querySelector("#closingInput"),
  name: document.querySelector("#nameInput"),
  meta: document.querySelector("#metaInput"),
  agree: document.querySelector("#agreeInput"),
  status: document.querySelector("#statusText"),
  previewLocation: document.querySelector("#previewLocation"),
  previewDate: document.querySelector("#previewDate"),
  previewTo: document.querySelector("#previewTo"),
  previewMessage: document.querySelector("#previewMessage"),
  previewClosing: document.querySelector("#previewClosing"),
  previewName: document.querySelector("#previewName"),
  wallSearchInput: document.querySelector("#wallSearchInput"),
  lettersGrid: document.querySelector("#lettersGrid"),
  letterCount: document.querySelector("#letterCount"),
  template: document.querySelector("#letterCardTemplate"),
  submitButton: document.querySelector("#submitButton"),
  newButton: document.querySelector("#newButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  consentWrap: document.querySelector("#consentWrap"),
  downloadImageButton: document.querySelector("#downloadImageButton"),
  openJsonButton: document.querySelector("#openJsonButton"),
  saveJsonButton: document.querySelector("#saveJsonButton"),
  exportJsonButton: document.querySelector("#exportJsonButton"),
  jsonFileInput: document.querySelector("#jsonFileInput"),
  composeSection: document.querySelector("#compose"),
  wallSection: document.querySelector("#wall"),
  letterRouteSection: document.querySelector("#letterRoute"),
  routeMode: document.querySelector("#routeMode"),
  routeTitle: document.querySelector("#routeTitle"),
  routeDescription: document.querySelector("#routeDescription"),
  routePrimaryLink: document.querySelector("#routePrimaryLink"),
  routeSecondaryLink: document.querySelector("#routeSecondaryLink"),
  viewPaperWrap: document.querySelector("#viewPaperWrap"),
  viewLocation: document.querySelector("#viewLocation"),
  viewDate: document.querySelector("#viewDate"),
  viewTo: document.querySelector("#viewTo"),
  viewMessage: document.querySelector("#viewMessage"),
  viewClosing: document.querySelector("#viewClosing"),
  viewName: document.querySelector("#viewName"),
  copyLinkButton: document.querySelector("#copyLinkButton"),
  downloadViewImageButton: document.querySelector("#downloadViewImageButton"),
  shareModal: document.querySelector("#shareModal"),
  viewLinkInput: document.querySelector("#viewLinkInput"),
  editLinkInput: document.querySelector("#editLinkInput"),
  copyViewLinkButton: document.querySelector("#copyViewLinkButton"),
  copyEditLinkButton: document.querySelector("#copyEditLinkButton"),
  closeShareModalButton: document.querySelector("#closeShareModalButton"),
  doneShareModalButton: document.querySelector("#doneShareModalButton"),
  openCreatedLetterLink: document.querySelector("#openCreatedLetterLink"),
  navLinks: document.querySelectorAll("[data-route-link]"),
};

let letters = [];
let fileHandle = null;
let activeViewLetter = null;
let editingLetterId = null;
let lastCreatedShare = null;

const todayText = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(new Date());

function createEmptyDraft() {
  return {
    to: "",
    message: "",
    closing: "With love",
    name: "",
    meta: `Today, from my heart - ${todayText}`,
  };
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `letter-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTimestamp(offset = 0) {
  return new Date(Date.now() + offset).toISOString();
}

function normalizeLetter(rawLetter = {}, index = 0) {
  const createdAt = rawLetter.createdAt || rawLetter.created_at || createTimestamp(index);
  const updatedAt = rawLetter.updatedAt || rawLetter.updated_at || null;

  return {
    id: String(rawLetter.id || createId()),
    to: String(rawLetter.to || rawLetter.toName || rawLetter.to_name || ""),
    message: String(rawLetter.message || ""),
    closing: String(rawLetter.closing || "With love"),
    name: String(rawLetter.name || rawLetter.authorName || rawLetter.author_name || ""),
    meta: String(rawLetter.meta || `Today, from my heart - ${todayText}`),
    createdAt,
    updatedAt,
  };
}

function normalizeLettersPayload(data) {
  const imported = Array.isArray(data) ? data : data && data.letters;
  if (!Array.isArray(imported)) {
    throw new Error("JSON file must be an array or contain a letters array.");
  }

  return imported.map((letter, index) => normalizeLetter(letter, index));
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readEditTokens() {
  return readJson(TOKEN_STORAGE_KEY, {});
}

function writeEditTokens(tokens) {
  writeJson(TOKEN_STORAGE_KEY, tokens);
}

function getEditToken(letterId) {
  return readEditTokens()[letterId] || "";
}

function saveEditToken(letterId, editToken) {
  if (!letterId || !editToken) return;
  const tokens = readEditTokens();
  tokens[letterId] = editToken;
  writeEditTokens(tokens);
}

function removeEditToken(letterId) {
  const tokens = readEditTokens();
  delete tokens[letterId];
  writeEditTokens(tokens);
}

async function apiRequest(path = "", options = {}) {
  const { headers = {}, ...requestOptions } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error && data.error.message ? data.error.message : "API request failed.");
    error.statusCode = response.status;
    error.details = data.error && data.error.details;
    throw error;
  }

  return data;
}

async function fetchLettersFromApi() {
  const data = await apiRequest();
  return normalizeLettersPayload(data);
}

async function fetchLetterByIdFromApi(letterId) {
  const data = await apiRequest(`/${encodeURIComponent(letterId)}`);
  return normalizeLetter(data.letter);
}

async function createLetterViaApi(draft) {
  const data = await apiRequest("", {
    method: "POST",
    body: JSON.stringify(draft),
  });
  const letter = normalizeLetter(data.letter);
  saveEditToken(letter.id, data.editToken);
  return {
    letter,
    editToken: data.editToken,
  };
}

async function updateLetterViaApi(letterId, draft) {
  const editToken = getEditToken(letterId);
  if (!editToken) {
    const error = new Error("Missing edit token for this letter in this browser.");
    error.statusCode = 403;
    throw error;
  }

  const data = await apiRequest(`/${encodeURIComponent(letterId)}`, {
    method: "PATCH",
    headers: {
      "X-Edit-Token": editToken,
    },
    body: JSON.stringify(draft),
  });
  return normalizeLetter(data.letter);
}

async function deleteLetterViaApi(letterId) {
  const editToken = getEditToken(letterId);
  if (!editToken) {
    const error = new Error("Missing edit token for this letter in this browser.");
    error.statusCode = 403;
    throw error;
  }

  await apiRequest(`/${encodeURIComponent(letterId)}`, {
    method: "DELETE",
    headers: {
      "X-Edit-Token": editToken,
    },
  });
  removeEditToken(letterId);
}

function getDraftFromForm() {
  return {
    to: elements.to.value.trim(),
    message: elements.message.value.trim(),
    closing: elements.closing.value.trim(),
    name: elements.name.value.trim(),
    meta: elements.meta.value.trim(),
  };
}

function setForm(draft) {
  elements.to.value = draft.to || "";
  elements.message.value = draft.message || "";
  elements.closing.value = draft.closing || "With love";
  elements.name.value = draft.name || "";
  elements.meta.value = draft.meta || `Today, from my heart - ${todayText}`;
  updatePreview();
}

function findLetterById(letterId) {
  return letters.find((letter) => letter.id === letterId);
}

function splitMeta(meta) {
  const value = meta || `Today, from my heart - ${todayText}`;
  const parts = value.split(" - ");
  if (parts.length > 1) {
    return {
      location: parts.slice(0, -1).join(" - "),
      date: parts.at(-1),
    };
  }
  return {
    location: value,
    date: todayText,
  };
}

function parseRoute(hash = window.location.hash) {
  const cleanHash = hash.replace(/^#\/?/, "").trim();
  const [pathPart, queryPart = ""] = cleanHash.split("?");
  const params = new URLSearchParams(queryPart);
  const parts = pathPart.split("/").filter(Boolean);

  if (!parts.length || parts[0] === "compose") {
    return { name: "compose", id: null, token: "" };
  }

  if (parts[0] === "wall") {
    return { name: "wall", id: null, token: "" };
  }

  if (parts[0] === "letter" && parts[1]) {
    return {
      name: parts[2] === "edit" ? "letter-edit" : "letter-view",
      id: decodeURIComponent(parts[1]),
      token: params.get("token") || "",
    };
  }

  return { name: "not-found", id: null, token: "" };
}

function setActiveRouteLink(routeName) {
  elements.navLinks.forEach((link) => {
    const isActive = link.dataset.routeLink === routeName;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function setVisibleSection(sectionName) {
  elements.composeSection.classList.toggle("is-hidden", sectionName !== "compose");
  elements.wallSection.classList.toggle("is-hidden", sectionName !== "wall");
  elements.letterRouteSection.classList.toggle("is-hidden", sectionName !== "letter");
}

function setEditMode(letter = null) {
  editingLetterId = letter ? letter.id : null;
  const isEditing = Boolean(letter);

  elements.formTitle.textContent = isEditing ? "Edit Your Letter" : "Compose Your Letter";
  elements.formSubtitle.textContent = isEditing
    ? "Make a gentle change, then save it back to your wall"
    : "Express your thoughts with elegance";
  elements.submitButton.textContent = isEditing ? "Save Changes" : "Post to Letters Wall";
  elements.newButton.classList.toggle("is-hidden", isEditing);
  elements.cancelEditButton.classList.toggle("is-hidden", !isEditing);
  elements.consentWrap.classList.toggle("is-hidden", isEditing);

  if (isEditing) {
    elements.agree.checked = true;
  } else {
    elements.agree.checked = false;
  }
}

function getLetterUrl(letterId) {
  const url = new URL(window.location.href);
  url.hash = `#/letter/${encodeURIComponent(letterId)}`;
  return url.toString();
}

function getEditLetterUrl(letterId, editToken) {
  const url = new URL(window.location.href);
  url.hash = `#/letter/${encodeURIComponent(letterId)}/edit?token=${encodeURIComponent(editToken)}`;
  return url.toString();
}

function setRouteActionsVisible(isVisible) {
  elements.copyLinkButton.classList.toggle("is-hidden", !isVisible);
  elements.downloadViewImageButton.classList.toggle("is-hidden", !isVisible);
}

function renderViewPaper(letter) {
  const meta = splitMeta(letter.meta);

  elements.viewLocation.textContent = meta.location || "Location";
  elements.viewDate.textContent = meta.date || todayText;
  elements.viewTo.textContent = `Dear ${letter.to || "..."} ,`;
  elements.viewMessage.textContent = letter.message || "";
  elements.viewClosing.textContent = letter.closing ? `${letter.closing},` : "With love,";
  elements.viewName.textContent = letter.name || "";
}

async function renderLetterRoute(route) {
  let letter = findLetterById(route.id);

  setVisibleSection("letter");
  setActiveRouteLink("");

  if (route.token) {
    saveEditToken(route.id, route.token);
  }

  if (!letter) {
    elements.viewPaperWrap.classList.add("is-hidden");
    setRouteActionsVisible(false);
    elements.routeMode.textContent = "Loading";
    elements.routeTitle.textContent = "Loading letter";
    elements.routeDescription.textContent = "Fetching this letter from the database.";

    try {
      letter = await fetchLetterByIdFromApi(route.id);
      letters = [letter, ...letters.filter((item) => item.id !== letter.id)];
      renderLetters();
    } catch {
      letter = null;
    }
  }

  activeViewLetter = letter || null;

  if (!letter) {
    setEditMode(null);
    elements.viewPaperWrap.classList.add("is-hidden");
    setRouteActionsVisible(false);
    elements.routeMode.textContent = "Not found";
    elements.routeTitle.textContent = "Letter not found";
    elements.routeDescription.textContent = "This link does not match any letter saved in this browser yet.";
    elements.routePrimaryLink.textContent = "Back to wall";
    elements.routePrimaryLink.href = "#/wall";
    elements.routeSecondaryLink.textContent = "Compose";
    elements.routeSecondaryLink.href = "#/compose";
    return;
  }

  const isEditRoute = route.name === "letter-edit";
  if (isEditRoute) {
    setVisibleSection("compose");
    setActiveRouteLink("");
    setEditMode(letter);
    setForm(letter);
    elements.message.focus();
    return;
  }

  setEditMode(null);
  elements.viewPaperWrap.classList.toggle("is-hidden", isEditRoute);
  setRouteActionsVisible(!isEditRoute);
  renderViewPaper(letter);

  elements.routeMode.textContent = isEditRoute ? "Edit route" : "Letter";
  elements.routeTitle.textContent = `Dear ${letter.to || "..."}`;
  elements.routeDescription.textContent = isEditRoute
    ? "This edit route is ready. The full editing screen will be implemented in step 4."
    : "A quiet page for reading and sharing this letter.";
  elements.routePrimaryLink.textContent = isEditRoute ? "Open compose" : "Back to wall";
  elements.routePrimaryLink.href = isEditRoute ? "#/compose" : "#/wall";
  elements.routeSecondaryLink.textContent = isEditRoute ? "Back to wall" : "Edit";
  elements.routeSecondaryLink.href = isEditRoute ? "#/wall" : `#/letter/${encodeURIComponent(letter.id)}/edit`;
}

async function renderRoute() {
  const route = parseRoute();

  if (window.location.hash === "#compose") {
    window.location.replace("#/compose");
    return;
  }

  if (window.location.hash === "#wall") {
    window.location.replace("#/wall");
    return;
  }

  if (route.name === "compose") {
    setEditMode(null);
    setVisibleSection("compose");
    setActiveRouteLink("compose");
    return;
  }

  if (route.name === "wall") {
    setEditMode(null);
    setVisibleSection("wall");
    setActiveRouteLink("wall");
    return;
  }

  if (route.name === "letter-view" || route.name === "letter-edit") {
    await renderLetterRoute(route);
    return;
  }

  setVisibleSection("letter");
  setActiveRouteLink("");
  setEditMode(null);
  activeViewLetter = null;
  elements.viewPaperWrap.classList.add("is-hidden");
  setRouteActionsVisible(false);
  elements.routeMode.textContent = "Unknown route";
  elements.routeTitle.textContent = "This page does not exist";
  elements.routeDescription.textContent = "Use the main navigation to return to a known area.";
  elements.routePrimaryLink.textContent = "Home";
  elements.routePrimaryLink.href = "#/compose";
  elements.routeSecondaryLink.textContent = "Letters Wall";
  elements.routeSecondaryLink.href = "#/wall";
}

function updatePreview() {
  const draft = getDraftFromForm();
  const meta = splitMeta(draft.meta);

  elements.previewLocation.textContent = meta.location || "Location";
  elements.previewDate.textContent = meta.date || "Date";
  elements.previewTo.textContent = `Dear ${draft.to || "..."} ,`;
  elements.previewMessage.textContent = draft.message;
  elements.previewClosing.textContent = draft.closing ? `${draft.closing},` : "With love,";
  elements.previewName.textContent = draft.name;

  writeJson(DRAFT_KEY, draft);
}

function persistLetters() {
  letters = letters.map((letter, index) => normalizeLetter(letter, index));
  renderLetters();
  renderRoute();
}

function showStatus(message) {
  elements.status.textContent = message;
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    elements.status.textContent = "";
  }, 3600);
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function renderLetters() {
  elements.lettersGrid.innerHTML = "";
  const query = elements.wallSearchInput.value.trim().toLowerCase();
  const filteredLetters = letters.filter((letter) =>
    [letter.to, letter.message, letter.closing, letter.name, letter.meta]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
  const countText = `${letters.length} ${letters.length === 1 ? "letter" : "letters"}`;
  elements.letterCount.textContent = query ? `${filteredLetters.length} of ${countText}` : countText;

  if (!letters.length || !filteredLetters.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const title = document.createElement("h3");
    const message = document.createElement("p");
    const action = document.createElement("a");

    title.textContent = query ? "No matching letters" : "No letters yet";
    message.textContent = query
      ? "Try another name, recipient, location, or phrase from the message."
      : "Start with a small note. Your saved letters will appear here.";
    action.textContent = query ? "Clear search" : "Write a letter";
    action.href = query ? "#/wall" : "#/compose";
    action.addEventListener("click", (event) => {
      if (!query) return;
      event.preventDefault();
      elements.wallSearchInput.value = "";
      renderLetters();
      elements.wallSearchInput.focus();
    });

    empty.append(title, message, action);
    elements.lettersGrid.append(empty);
    return;
  }

  filteredLetters
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((letter) => {
      const card = elements.template.content.firstElementChild.cloneNode(true);
      const editedBadge = card.querySelector(".edited-badge");
      card.querySelector(".card-to").textContent = `Dear ${letter.to || "..."}`;
      card.querySelector(".card-message").textContent = letter.message || "";
      card.querySelector(".card-name").textContent = letter.name || "Anonymous";
      card.querySelector(".card-date").textContent = new Intl.DateTimeFormat("vi-VN").format(new Date(letter.createdAt));
      card.querySelector(".card-date").dateTime = letter.createdAt;
      editedBadge.classList.toggle("is-hidden", !letter.updatedAt);
      card.querySelector(".view-card").addEventListener("click", () => {
        location.hash = `#/letter/${encodeURIComponent(letter.id)}`;
      });
      card.querySelector(".edit-card").addEventListener("click", () => {
        location.hash = `#/letter/${encodeURIComponent(letter.id)}/edit`;
      });
      card.querySelector(".delete-card").addEventListener("click", () => {
        const confirmed = window.confirm("Delete this letter? This cannot be undone.");
        if (!confirmed) return;
        deleteLetterViaApi(letter.id)
          .then(() => {
            letters = letters.filter((item) => item.id !== letter.id);
            persistLetters();
            showStatus("Letter removed.");
          })
          .catch((error) => {
            window.alert(error.message || "Could not delete this letter.");
          });
      });
      card.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;
        location.hash = `#/letter/${encodeURIComponent(letter.id)}`;
      });
      elements.lettersGrid.append(card);
    });
}

async function loadInitialLetters() {
  try {
    letters = await fetchLettersFromApi();
  } catch {
    try {
      const response = await fetch("letters.json", { cache: "no-store" });
      if (!response.ok) throw new Error("No seed file.");
      const data = await response.json();
      letters = normalizeLettersPayload(data);
    } catch {
      letters = [];
    }
  }
}

function normalizeImportedData(data) {
  return normalizeLettersPayload(data);
}

function exportJsonFile() {
  const blob = new Blob([JSON.stringify({ schemaVersion: LETTER_SCHEMA_VERSION, letters }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "letters.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function saveToPickedFile() {
  const data = JSON.stringify({ schemaVersion: LETTER_SCHEMA_VERSION, letters }, null, 2);

  if ("showSaveFilePicker" in window) {
    if (!fileHandle) {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: "letters.json",
        types: [
          {
            description: "JSON file",
            accept: { "application/json": [".json"] },
          },
        ],
      });
    }
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
    showStatus("Saved to JSON file.");
    return;
  }

  exportJsonFile();
  showStatus("Browser downloaded a JSON copy.");
}

async function openJsonWithPicker() {
  if ("showOpenFilePicker" in window) {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "JSON file",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    fileHandle = handle;
    const file = await handle.getFile();
    return file.text();
  }

  return new Promise((resolve, reject) => {
    elements.jsonFileInput.onchange = () => {
      const [file] = elements.jsonFileInput.files;
      if (!file) {
        reject(new Error("No file selected."));
        return;
      }
      file.text().then(resolve, reject);
      elements.jsonFileInput.value = "";
    };
    elements.jsonFileInput.click();
  });
}

async function importJsonFile() {
  try {
    const raw = await openJsonWithPicker();
    const importedLetters = normalizeImportedData(JSON.parse(raw));
    const createdLetters = [];
    for (const letter of importedLetters) {
      const created = await createLetterViaApi(letter);
      createdLetters.push(created.letter);
    }
    letters = await fetchLettersFromApi();
    persistLetters();
    showStatus(`${createdLetters.length} letters imported.`);
  } catch (error) {
    showStatus(error.message || "Could not open JSON file.");
  }
}

function getWrappedCanvasLines(context, text, maxWidth) {
  const paragraphs = (text || "").split("\n");
  const lines = [];

  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";

    if (!words.length) {
      lines.push("");
      return;
    }

    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });

    lines.push(line);
  });

  return lines;
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
  const lines = getWrappedCanvasLines(context, text, maxWidth);
  let cursorY = y;

  lines.forEach((line) => {
    context.fillText(line, x, cursorY);
    cursorY += lineHeight;
  });

  return cursorY;
}

function downloadLetterImage(source = getDraftFromForm()) {
  const letter = normalizeLetter(source);
  const meta = splitMeta(letter.meta);
  const canvas = document.createElement("canvas");
  const scale = 2;
  const width = 1080;
  const marginX = 132;
  const paperX = 70;
  const paperY = 58;
  const lineHeight = 44;
  const messageTop = 304;
  const maxTextWidth = width - marginX * 2;

  const measuringCanvas = document.createElement("canvas");
  const measuringContext = measuringCanvas.getContext("2d");
  measuringContext.font = "32px 'Times New Roman', serif";
  const messageLines = getWrappedCanvasLines(measuringContext, letter.message, maxTextWidth);
  const messageHeight = Math.max(messageLines.length, 1) * lineHeight;
  const signatureTop = messageTop + messageHeight + 42;
  const height = Math.max(760, signatureTop + 170);

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#f1f3f7";
  ctx.fillRect(0, 0, width, height);

  ctx.shadowColor = "rgba(36, 43, 60, 0.22)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#ffffff";
  drawRoundRect(ctx, paperX, paperY, width - paperX * 2, height - paperY * 2, 18);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#e9eef7";
  ctx.lineWidth = 2;
  for (let y = 128; y < height - 86; y += 44) {
    ctx.beginPath();
    ctx.moveTo(110, y);
    ctx.lineTo(width - 110, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#58515c";
  ctx.textAlign = "right";
  ctx.font = "italic 30px 'Times New Roman', serif";
  ctx.fillText(meta.location || "Location", width - 132, 112);
  ctx.font = "italic 26px 'Times New Roman', serif";
  ctx.fillText(meta.date || todayText, width - 132, 154);

  ctx.textAlign = "left";
  ctx.fillStyle = "#323137";
  ctx.font = "italic 44px 'Times New Roman', serif";
  ctx.fillText(`Dear ${letter.to || "..."} ,`, marginX, 230);

  ctx.font = "32px 'Times New Roman', serif";
  wrapCanvasText(ctx, letter.message, marginX, messageTop, maxTextWidth, lineHeight);

  ctx.textAlign = "right";
  ctx.font = "italic 32px 'Times New Roman', serif";
  ctx.fillText(letter.closing ? `${letter.closing},` : "With love,", width - marginX, signatureTop);
  ctx.font = "bold italic 34px 'Times New Roman', serif";
  ctx.fillText(letter.name || "", width - marginX, signatureTop + 44);

  const link = document.createElement("a");
  link.download = `dear-letter-${letter.id}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function copyActiveLetterLink() {
  if (!activeViewLetter) return;

  const link = getLetterUrl(activeViewLetter.id);
  await copyTextWithButtonFeedback(link, elements.copyLinkButton);
}

async function copyTextWithButtonFeedback(text, button) {
  const originalLabel = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const fallbackInput = document.createElement("input");
    fallbackInput.value = text;
    document.body.append(fallbackInput);
    fallbackInput.select();
    document.execCommand("copy");
    fallbackInput.remove();
  }

  button.textContent = "Copied";
  window.clearTimeout(button.copyTimer);
  button.copyTimer = window.setTimeout(() => {
    button.textContent = originalLabel;
  }, 1800);
}

function openShareModal(letter, editToken) {
  const viewLink = getLetterUrl(letter.id);
  const editLink = getEditLetterUrl(letter.id, editToken);

  lastCreatedShare = {
    letter,
    viewLink,
    editLink,
  };

  elements.viewLinkInput.value = viewLink;
  elements.editLinkInput.value = editLink;
  elements.openCreatedLetterLink.href = `#/letter/${encodeURIComponent(letter.id)}`;
  elements.shareModal.classList.remove("is-hidden");
  elements.copyViewLinkButton.focus();
}

function closeShareModal() {
  elements.shareModal.classList.add("is-hidden");
}

elements.form.addEventListener("input", updatePreview);

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const draft = getDraftFromForm();

  if (!draft.message) {
    showStatus("Please write a message before posting.");
    elements.message.focus();
    return;
  }

  if (editingLetterId) {
    const letter = findLetterById(editingLetterId);
    if (!letter) {
      showStatus("This letter could not be found.");
      return;
    }

    elements.submitButton.disabled = true;
    try {
      const updatedLetter = await updateLetterViaApi(editingLetterId, draft);
      const updatedLetterId = editingLetterId;
      letters = letters.map((item) => (item.id === editingLetterId ? updatedLetter : item));
      persistLetters();
      showStatus("Letter updated.");
      location.hash = `#/letter/${encodeURIComponent(updatedLetterId)}`;
    } catch (error) {
      showStatus(error.message || "Could not update this letter.");
    } finally {
      elements.submitButton.disabled = false;
    }
    return;
  }

  if (!elements.agree.checked) {
    showStatus("Please agree before keeping this letter on the wall.");
    elements.agree.focus();
    return;
  }

  elements.submitButton.disabled = true;
  try {
    const created = await createLetterViaApi(draft);
    const createdLetter = created.letter;
    letters = [createdLetter, ...letters.filter((letter) => letter.id !== createdLetter.id)];
    persistLetters();
    showStatus("Letter saved.");
    elements.agree.checked = false;
    openShareModal(createdLetter, created.editToken);
    location.hash = "#/wall";
  } catch (error) {
    showStatus(error.message || "Could not save this letter.");
  } finally {
    elements.submitButton.disabled = false;
  }
});

elements.newButton.addEventListener("click", () => {
  setEditMode(null);
  setForm(createEmptyDraft());
  elements.agree.checked = false;
  showStatus("Fresh paper is ready.");
});

elements.cancelEditButton.addEventListener("click", () => {
  const letterId = editingLetterId;
  setEditMode(null);
  location.hash = letterId ? `#/letter/${encodeURIComponent(letterId)}` : "#/wall";
});

elements.wallSearchInput.addEventListener("input", renderLetters);
elements.downloadImageButton.addEventListener("click", () => downloadLetterImage());
elements.downloadViewImageButton.addEventListener("click", () => {
  if (activeViewLetter) downloadLetterImage(activeViewLetter);
});
elements.copyLinkButton.addEventListener("click", copyActiveLetterLink);
elements.copyViewLinkButton.addEventListener("click", () => {
  if (lastCreatedShare) copyTextWithButtonFeedback(lastCreatedShare.viewLink, elements.copyViewLinkButton);
});
elements.copyEditLinkButton.addEventListener("click", () => {
  if (lastCreatedShare) copyTextWithButtonFeedback(lastCreatedShare.editLink, elements.copyEditLinkButton);
});
elements.closeShareModalButton.addEventListener("click", closeShareModal);
elements.doneShareModalButton.addEventListener("click", closeShareModal);
elements.shareModal.addEventListener("click", (event) => {
  if (event.target === elements.shareModal) closeShareModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.shareModal.classList.contains("is-hidden")) {
    closeShareModal();
  }
});
elements.openJsonButton.addEventListener("click", importJsonFile);
elements.saveJsonButton.addEventListener("click", () => {
  saveToPickedFile().catch((error) => showStatus(error.message || "Could not save JSON file."));
});
elements.exportJsonButton.addEventListener("click", () => {
  exportJsonFile();
  showStatus("JSON exported.");
});

window.addEventListener("hashchange", renderRoute);

loadInitialLetters().then(() => {
  setForm(readJson(DRAFT_KEY, createEmptyDraft()));
  renderLetters();
  renderRoute();
});
