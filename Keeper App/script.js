document.addEventListener("DOMContentLoaded", () => {
  const titleInput = document.getElementById("titleInput");
  const contentInput = document.getElementById("contentInput");
  const addBtn = document.getElementById("addBtn");
  const notesContainer = document.getElementById("notesContainer");
  const searchInput = document.getElementById("searchInput");
  const themeToggle = document.getElementById("themeToggle");

  /* ---------------- THEME ---------------- */

  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButton(savedTheme);

  themeToggle.addEventListener("click", () => {
    const newTheme =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "dark"
        : "light";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeButton(newTheme);
  });

  function updateThemeButton(theme) {
    themeToggle.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
  }

  /* ---------------- NOTES ---------------- */

  let notes = JSON.parse(localStorage.getItem("keeperNotes")) || [];

  function saveNotes() {
    localStorage.setItem("keeperNotes", JSON.stringify(notes));
  }

  function renderNotes() {
    notesContainer.innerHTML = "";

    const searchText = searchInput.value.toLowerCase();

    const filtered = notes.filter(
      note =>
        note.title.toLowerCase().includes(searchText) ||
        note.content.toLowerCase().includes(searchText)
    );

    filtered.forEach(note => {
      const noteDiv = document.createElement("div");
      noteDiv.className = "note fade-in";

      noteDiv.innerHTML = `
        <h3>${note.title}</h3>
        <p>${note.content}</p>
        <small>${note.date}</small>
        <button class="delete-btn">Delete</button>
      `;

      noteDiv.querySelector(".delete-btn").addEventListener("click", () => {
        deleteNote(note.id);
      });

      notesContainer.appendChild(noteDiv);
    });
  }

  function addNote() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title && !content) return;

    notes.unshift({
      id: Date.now(),
      title: title || "Untitled",
      content,
      date: new Date().toLocaleDateString()
    });

    saveNotes();
    renderNotes();

    titleInput.value = "";
    contentInput.value = "";
  }

  function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    saveNotes();
    renderNotes();
  }

  addBtn.addEventListener("click", addNote);
  searchInput.addEventListener("input", renderNotes);

  renderNotes();
});
