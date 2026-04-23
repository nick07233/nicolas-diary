const STORAGE_KEY = "nicolas-diary.entries";

const form = document.querySelector("#entry-form");
const idInput = document.querySelector("#entry-id");
const dateInput = document.querySelector("#entry-date");
const titleInput = document.querySelector("#entry-title");
const moodInput = document.querySelector("#entry-mood");
const reflectionInput = document.querySelector("#entry-reflection");
const completedList = document.querySelector("#completed-list");
const planList = document.querySelector("#plan-list");
const addCompletedButton = document.querySelector("#add-completed-button");
const addPlanButton = document.querySelector("#add-plan-button");
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
const readerCompleted = document.querySelector("#reader-completed");
const readerPlans = document.querySelector("#reader-plans");
const readerReflection = document.querySelector("#reader-reflection");
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

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      id: item.id || createId(),
      text: String(item.text || "").trim(),
      done: Boolean(item.done),
    }))
    .filter((item) => item.text);
}

function collectItems(listElement) {
  return [...listElement.querySelectorAll(".checklist-row")]
    .map((row) => ({
      id: row.dataset.id || createId(),
      text: row.querySelector(".checklist-input").value.trim(),
      done: row.querySelector(".checklist-check")?.checked || false,
    }))
    .filter((item) => item.text);
}

function createChecklistRow(listElement, item = {}, shouldFocus = false) {
  const row = document.createElement("div");
  row.className = "checklist-row";
  row.dataset.id = item.id || createId();
  row.innerHTML = `
    <input class="checklist-check" type="checkbox" aria-label="Mark item as done" />
    <input class="checklist-input" type="text" placeholder="Add an item" maxlength="120" />
    <button class="icon-button remove-item" type="button" aria-label="Remove item" title="Remove item">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14" />
      </svg>
    </button>
  `;

  const hasDoneValue = Object.prototype.hasOwnProperty.call(item, "done");
  row.querySelector(".checklist-check").checked = hasDoneValue
    ? Boolean(item.done)
    : listElement === completedList;
  row.querySelector(".checklist-input").value = item.text || "";
  listElement.append(row);

  if (shouldFocus) {
    row.querySelector(".checklist-input").focus();
  }
}

function ensureEmptyChecklistRows() {
  if (!completedList.children.length) {
    createChecklistRow(completedList);
  }

  if (!planList.children.length) {
    createChecklistRow(planList);
  }
}

function clearChecklist(listElement) {
  listElement.innerHTML = "";
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
  reflectionInput.value = "";
  clearChecklist(completedList);
  clearChecklist(planList);
  ensureEmptyChecklistRows();
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
    const completedCount = normalizeItems(entry.completedItems).length;
    const planCount = normalizeItems(entry.planItems).length;
    button.querySelector("span").textContent =
      `${formatDate(entry.date)} · ${entry.mood} · ${completedCount} done · ${planCount} planned`;
    entriesList.append(button);
  });
}

function renderReaderList(listElement, items, emptyText) {
  listElement.innerHTML = "";

  if (!items.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "reader-list-empty";
    emptyItem.textContent = emptyText;
    listElement.append(emptyItem);
    return;
  }

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.className = item.done ? "is-done" : "";
    listItem.textContent = item.text;
    listElement.append(listItem);
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
  renderReaderList(readerCompleted, normalizeItems(entry.completedItems), "No completed items saved.");
  renderReaderList(readerPlans, normalizeItems(entry.planItems), "No plan items saved.");
  readerReflection.textContent = entry.reflection || entry.body || "No reflection saved.";
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
  reflectionInput.value = entry.reflection || entry.body || "";
  clearChecklist(completedList);
  clearChecklist(planList);
  normalizeItems(entry.completedItems).forEach((item) => createChecklistRow(completedList, item));
  normalizeItems(entry.planItems).forEach((item) => createChecklistRow(planList, item));
  ensureEmptyChecklistRows();
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
    completedItems: collectItems(completedList),
    planItems: collectItems(planList),
    reflection: reflectionInput.value.trim(),
  };

  const hasDailyContent =
    entryData.completedItems.length || entryData.planItems.length || entryData.reflection;

  if (!entryData.title || !hasDailyContent) {
    window.alert("Add at least one completed item, one plan item, or a reflection before saving.");
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

document.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-item");

  if (!removeButton) return;

  const row = removeButton.closest(".checklist-row");
  const listElement = row.parentElement;
  row.remove();

  if (!listElement.children.length) {
    createChecklistRow(listElement, {}, true);
  }
});

form.addEventListener("submit", saveEntry);
addCompletedButton.addEventListener("click", () => createChecklistRow(completedList, {}, true));
addPlanButton.addEventListener("click", () => createChecklistRow(planList, {}, true));
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
