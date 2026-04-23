const STORAGE_KEY = "nicolas-diary.entries";

const form = document.querySelector("#entry-form");
const idInput = document.querySelector("#entry-id");
const dateInput = document.querySelector("#entry-date");
const titleInput = document.querySelector("#entry-title");
const moodInput = document.querySelector("#entry-mood");
const bodyInput = document.querySelector("#entry-body");
const clearButton = document.querySelector("#clear-button");
const newEntryButton = document.querySelector("#new-entry-button");
const saveButton = document.querySelector("#save-button");
const saveButtonLabel = document.querySelector("#save-button-label");
const editorTitle = document.querySelector("#editor-title");

const entriesList = document.querySelector("#entries-list");
const entryCount = document.querySelector("#entry-count");

const readerEmpty = document.querySelector("#reader-empty");
const readerEntry = document.querySelector("#reader-entry");
const readerDate = document.querySelector("#reader-date");
const readerMood = document.querySelector("#reader-mood");
const readerEntryTitle = document.querySelector("#reader-entry-title");
const readerBody = document.querySelector("#reader-body");
const editButton = document.querySelector("#edit-button");
const deleteButton = document.querySelector("#delete-button");

let entries = loadEntries();
let selectedEntryId = entries[0]?.id || null;

function loadEntries() {
  try {
    const savedEntries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return Array.isArray(savedEntries) ? savedEntries.sort(compareEntries) : [];
  } catch {
    return [];
  }
}

function compareEntries(a, b) {
  return (
    (b.date || "").localeCompare(a.date || "") ||
    (b.updatedAt || "").localeCompare(a.updatedAt || "")
  );
}

function persistEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sortEntries() {
  entries.sort(compareEntries);
}

function resetForm() {
  idInput.value = "";
  dateInput.value = today();
  titleInput.value = "";
  moodInput.value = "Calm";
  bodyInput.value = "";
  editorTitle.textContent = "New entry";
  saveButtonLabel.textContent = "Save entry";
}

function getSelectedEntry() {
  return entries.find((entry) => entry.id === selectedEntryId) || null;
}

function renderEntries() {
  entryCount.textContent = String(entries.length);
  entriesList.innerHTML = "";

  if (!entries.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-list";
    emptyState.textContent = "No entries yet. Save your first note to start the archive.";
    entriesList.append(emptyState);
    return;
  }

  entries.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `entry-item${entry.id === selectedEntryId ? " active" : ""}`;
    button.dataset.id = entry.id;
    button.innerHTML = `
      <strong></strong>
      <span></span>
    `;
    button.querySelector("strong").textContent = entry.title;
    button.querySelector("span").textContent = `${formatDate(entry.date)} · ${entry.mood}`;
    entriesList.append(button);
  });
}

function renderReader() {
  const entry = getSelectedEntry();

  if (!entry) {
    readerEmpty.classList.remove("hidden");
    readerEntry.classList.add("hidden");
    return;
  }

  readerDate.textContent = formatDate(entry.date);
  readerMood.textContent = entry.mood;
  readerEntryTitle.textContent = entry.title;
  readerBody.textContent = entry.body;
  readerEmpty.classList.add("hidden");
  readerEntry.classList.remove("hidden");
}

function render() {
  sortEntries();
  renderEntries();
  renderReader();
}

function startEditing(entry) {
  idInput.value = entry.id;
  dateInput.value = entry.date;
  titleInput.value = entry.title;
  moodInput.value = entry.mood;
  bodyInput.value = entry.body;
  editorTitle.textContent = "Edit entry";
  saveButtonLabel.textContent = "Update entry";
  titleInput.focus();
}

function saveEntry(event) {
  event.preventDefault();

  const existingId = idInput.value;
  const now = new Date().toISOString();
  const entryData = {
    date: dateInput.value,
    title: titleInput.value.trim(),
    mood: moodInput.value,
    body: bodyInput.value.trim(),
  };

  if (!entryData.title || !entryData.body) {
    return;
  }

  if (existingId) {
    entries = entries.map((entry) =>
      entry.id === existingId
        ? {
            ...entry,
            ...entryData,
            updatedAt: now,
          }
        : entry,
    );
    selectedEntryId = existingId;
  } else {
    const newEntry = {
      id: createId(),
      ...entryData,
      createdAt: now,
      updatedAt: now,
    };
    entries.unshift(newEntry);
    selectedEntryId = newEntry.id;
  }

  persistEntries();
  resetForm();
  render();
}

function deleteSelectedEntry() {
  const entry = getSelectedEntry();

  if (!entry) return;

  const confirmed = window.confirm(`Delete "${entry.title}"? This cannot be undone.`);

  if (!confirmed) return;

  entries = entries.filter((savedEntry) => savedEntry.id !== entry.id);
  selectedEntryId = entries[0]?.id || null;
  persistEntries();
  resetForm();
  render();
}

entriesList.addEventListener("click", (event) => {
  const entryButton = event.target.closest(".entry-item");

  if (!entryButton) return;

  selectedEntryId = entryButton.dataset.id;
  render();
});

form.addEventListener("submit", saveEntry);
clearButton.addEventListener("click", resetForm);
newEntryButton.addEventListener("click", () => {
  resetForm();
  titleInput.focus();
});
editButton.addEventListener("click", () => {
  const entry = getSelectedEntry();
  if (entry) startEditing(entry);
});
deleteButton.addEventListener("click", deleteSelectedEntry);

resetForm();
render();
