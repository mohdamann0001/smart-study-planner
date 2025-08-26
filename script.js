// Tab Switching
const tabs = document.querySelectorAll(".tab-btn");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// Dark Mode
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// ------------------- Tasks -------------------
const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const progressText = document.getElementById("progressText");
const progressBar = document.querySelector(".progress");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function renderTasks() {
  taskList.innerHTML = "";
  let doneCount = 0;

  tasks.forEach((task, index) => {
    if (task.done) doneCount++;

    const li = document.createElement("li");
    li.classList.add("task-item");
    if (task.done) li.classList.add("done");

    li.innerHTML = `
      <div class="task-info">
        <span>${task.text}</span>
        <span class="task-meta">📂 ${task.category} | ⚡ ${task.priority} | ⏳ ${task.deadline || "No deadline"}</span>
      </div>
      <div class="task-actions">
        <button onclick="toggleTask(${index})">✔️</button>
        <button onclick="deleteTask(${index})">❌</button>
      </div>
    `;

    taskList.appendChild(li);
  });

  let percent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  progressText.textContent = `Progress: ${percent}%`;
  progressBar.style.width = percent + "%";

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

taskForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = document.getElementById("taskInput").value;
  const category = document.getElementById("category").value;
  const priority = document.getElementById("priority").value;
  const deadline = document.getElementById("deadline").value;

  tasks.push({ text, category, priority, deadline, done: false });
  taskForm.reset();
  renderTasks();
});

function toggleTask(i) {
  tasks[i].done = !tasks[i].done;
  renderTasks();
}

function deleteTask(i) {
  tasks.splice(i, 1);
  renderTasks();
}

renderTasks();

// ------------------- Flashcards -------------------
const flashForm = document.getElementById("flashForm");
const flashGrid = document.getElementById("flashcardGrid");

let flashcards = JSON.parse(localStorage.getItem("flashcards")) || [];

function renderFlashcards() {
  flashGrid.innerHTML = "";
  flashcards.forEach((card, index) => {
    const div = document.createElement("div");
    div.classList.add("flashcard");
    div.innerHTML = `
      <div class="flash-inner">
        <div class="flash-front">${card.question}</div>
        <div class="flash-back">${card.answer}</div>
      </div>
    `;
    div.addEventListener("click", () => div.classList.toggle("flip"));
    flashGrid.appendChild(div);
  });

  localStorage.setItem("flashcards", JSON.stringify(flashcards));
}

flashForm.addEventListener("submit", e => {
  e.preventDefault();
  const question = document.getElementById("questionInput").value;
  const answer = document.getElementById("answerInput").value;

  flashcards.push({ question, answer });
  flashForm.reset();
  renderFlashcards();
});

renderFlashcards();
