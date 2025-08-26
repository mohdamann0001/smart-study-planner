// Select elements
const taskName = document.getElementById("taskName");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskContainer = document.getElementById("taskContainer");
const searchBar = document.getElementById("searchBar");
const filterPriority = document.getElementById("filterPriority");

// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
renderTasks();

// Add Task
addTaskBtn.addEventListener("click", () => {
  if (taskName.value === "" || taskDate.value === "") {
    alert("Please fill in all fields!");
    return;
  }

  const newTask = {
    id: Date.now(),
    name: taskName.value,
    date: taskDate.value,
    priority: taskPriority.value,
    done: false
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();

  taskName.value = "";
  taskDate.value = "";
});

// Render Tasks
function renderTasks() {
  taskContainer.innerHTML = "";

  let searchText = searchBar.value.toLowerCase();
  let filter = filterPriority.value;

  tasks
    .filter(task => task.name.toLowerCase().includes(searchText))
    .filter(task => filter === "All" || task.priority === filter)
    .forEach(task => {
      const li = document.createElement("li");
      li.className = `task ${task.priority.toLowerCase()} ${task.done ? "done" : ""}`;
      li.innerHTML = `
        <div>
          <strong>${task.name}</strong> <br>
          <span>📅 ${task.date} | 🔔 ${task.priority}</span>
        </div>
        <div>
          <button class="done-btn" onclick="toggleDone(${task.id})">${task.done ? "Undo" : "Done"}</button>
          <button class="edit" onclick="editTask(${task.id})">Edit</button>
          <button class="delete" onclick="deleteTask(${task.id})">Delete</button>
        </div>
      `;
      taskContainer.appendChild(li);

      // Alert if deadline is today
      const today = new Date().toISOString().split("T")[0];
      if (task.date === today && !task.done) {
        console.log(`Reminder: Task "${task.name}" is due today!`);
      }
    });
}

// Delete Task
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
}

// Edit Task
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  taskName.value = task.name;
  taskDate.value = task.date;
  taskPriority.value = task.priority;
  deleteTask(id);
}

// Toggle Done
function toggleDone(id) {
  tasks = tasks.map(task => {
    if (task.id === id) task.done = !task.done;
    return task;
  });
  saveTasks();
  renderTasks();
}

// Save to LocalStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Search + Filter Events
searchBar.addEventListener("input", renderTasks);
filterPriority.addEventListener("change", renderTasks);
