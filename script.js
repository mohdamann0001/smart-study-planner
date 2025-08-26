/* =========================
   Smart Study Planner JS
   Theme: Red & Black
   Features: Tasks (search/filter/sort/edit/delete), Flashcards (create/delete/grid), Study Mode modal (shuffle/next/prev/flip/mark/delete/export)
   ========================= */

/* ---------- Helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = k => JSON.parse(localStorage.getItem(k) || "null");

/* ---------- State ---------- */
let tasks = load("ssp_tasks") || [];
let flashcards = load("ssp_flashcards") || [];

/* ---------- TASKS: elements ---------- */
const taskForm = $("#taskForm");
const taskInput = $("#taskInput");
const deadlineInput = $("#deadline");
const taskCategory = $("#taskCategory");
const taskPriority = $("#taskPriority");
const taskList = $("#taskList");
const progressText = $("#progressText");
const progressFill = $("#progressFill");
const searchTask = $("#searchTask");
const filterCategory = $("#filterCategory");
const sortBy = $("#sortBy");
const clearCompleted = $("#clearCompleted");

/* ---------- FLASHCARDS: elements ---------- */
const flashForm = $("#flashForm");
const questionInput = $("#questionInput");
const answerInput = $("#answerInput");
const flashCategory = $("#flashCategory");
const flashGrid = $("#flashcardGrid");
const openStudyModeBtn = $("#openStudyMode");
const shuffleFlashBtn = $("#shuffleFlash");
const filterFlashCategory = $("#filterFlashCategory");
const exportFlashBtn = $("#exportFlash");

/* ---------- MODAL: elements ---------- */
const studyModal = $("#studyModal");
const closeModal = $("#closeModal");
const studyCard = $("#studyCard");
const studyCounter = $("#studyCounter");
const prevCard = $("#prevCard");
const nextCard = $("#nextCard");
const flipCard = $("#flipCard");
const markKnown = $("#markKnown");
const markReview = $("#markReview");
const deleteCurrent = $("#deleteCurrent");
const modalShuffle = $("#modalShuffle");
const modalToggleShow = $("#modalToggleShow");

/* ---------- UTIL ---------- */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function sortPriority(a,b){ const map = { "High":1, "Medium":2, "Low":3 }; return map[a.priority] - map[b.priority]; }

/* ---------- RENDER TASKS ---------- */
function renderTasks(){
  // create array with original indices
  let list = tasks.map((t,i)=>({ ...t, _i:i }));
  const q = (searchTask.value || "").toLowerCase().trim();
  if(q) list = list.filter(t => t.text.toLowerCase().includes(q));
  if(filterCategory.value !== "All") list = list.filter(t => t.category === filterCategory.value);
  if(sortBy.value === "deadline"){
    list.sort((a,b) => new Date(a.deadline || "2100-01-01") - new Date(b.deadline || "2100-01-01"));
  } else if(sortBy.value === "priority"){
    list.sort((a,b) => ({High:1,Medium:2,Low:3})[a.priority] - ({High:1,Medium:2,Low:3})[b.priority]);
  }

  taskList.innerHTML = "";
  let doneCount = 0;
  list.forEach(item => {
    if(item.done) doneCount++;
    const li = document.createElement("li");
    li.className = "task-item";
    if(item.done) li.classList.add("done");
    const priorityClass = item.priority === "High" ? "high" : item.priority === "Medium" ? "medium" : "low";

    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" class="chk" data-i="${item._i}" ${item.done ? "checked" : ""}/>
        <div>
          <div class="task-title">${escapeHtml(item.text)}</div>
          <div class="task-meta">${escapeHtml(item.category)} • ${item.deadline || "No deadline"}</div>
        </div>
      </div>
      <div class="task-right">
        <span class="chip ${priorityClass}">${item.priority}</span>
        <button class="btn small edit" data-i="${item._i}" title="Edit">✏️</button>
        <button class="btn small del" data-i="${item._i}" title="Delete">🗑️</button>
      </div>
    `;
    taskList.appendChild(li);
  });

  const percent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  progressText.textContent = `Progress: ${percent}%`;
  progressFill.style.width = percent + "%";
  save("ssp_tasks", tasks);
}

/* ---------- TASKS: actions ---------- */
taskForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if(!text) return;
  tasks.push({ id: uid(), text, category: taskCategory.value, priority: taskPriority.value, deadline: deadlineInput.value || "", done: false });
  taskForm.reset();
  renderTasks();
});

taskList.addEventListener("click", e => {
  const i = e.target.dataset.i;
  if(!i) return;
  if(e.target.classList.contains("chk")){
    tasks[i].done = e.target.checked;
    renderTasks();
  } else if(e.target.classList.contains("edit")){
    const t = tasks[i];
    const newText = prompt("Edit task title:", t.text);
    if(newText !== null){
      tasks[i].text = newText.trim() || t.text;
      renderTasks();
    }
  } else if(e.target.classList.contains("del")){
    if(confirm("Delete this task?")){
      tasks.splice(i,1);
      renderTasks();
    }
  }
});

searchTask.addEventListener("input", renderTasks);
filterCategory.addEventListener("change", renderTasks);
sortBy.addEventListener("change", renderTasks);
clearCompleted.addEventListener("click", () => {
  tasks = tasks.filter(t => !t.done);
  renderTasks();
});

/* ---------- RENDER FLASHCARDS ---------- */
function renderFlashcards(){
  // show cards (filtered)
  const fc = flashcards.map((f,i)=>({...f, _i:i}));
  const cat = filterFlashCategory.value;
  const filtered = cat === "All" ? fc : fc.filter(c => c.category === cat);
  flashGrid.innerHTML = "";
  if(filtered.length === 0){
    flashGrid.innerHTML = `<div class="card muted">No flashcards (create some!)</div>`;
    save("ssp_flashcards", flashcards);
    return;
  }

  filtered.forEach(card => {
    const div = document.createElement("div");
    div.className = "flashcard";
    div.innerHTML = `
      <button class="del" data-i="${card._i}" title="Delete">✕</button>
      <div class="q">${escapeHtml(card.question)}</div>
      <div class="meta">${escapeHtml(card.category)}</div>
    `;
    // click to flip view (small temporary reveal)
    div.addEventListener("click", (ev) => {
      if(ev.target && ev.target.classList.contains("del")) return;
      // flip: show answer in a transient overlay
      const overlay = document.createElement("div");
      overlay.className = "study-card";
      overlay.style.position = "absolute";
      overlay.style.inset = "8px";
      overlay.style.background = "rgba(0,0,0,0.9)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.borderRadius = "8px";
      overlay.textContent = card.answer;
      div.appendChild(overlay);
      setTimeout(()=> overlay.remove(), 2500);
    });
    flashGrid.appendChild(div);
  });

  // deletion via delegation
  $$(".flashcard .del").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const i = e.currentTarget.dataset.i;
      if(confirm("Delete this flashcard?")) {
        flashcards.splice(i,1);
        renderFlashcards();
      }
    });
  });

  save("ssp_flashcards", flashcards);
}

/* ---------- FLASHCARDS: actions ---------- */
$("#flashForm").addEventListener("submit", e => {
  e.preventDefault();
  const q = questionInput.value.trim();
  const a = answerInput.value.trim();
  if(!q || !a) return;
  flashcards.push({ id: uid(), question: q, answer: a, category: flashCategory.value, known: false });
  flashForm.reset();
  renderFlashcards();
});

shuffleFlashBtn.addEventListener("click", () => {
  flashcards = shuffleArray(flashcards);
  renderFlashcards();
});
filterFlashCategory.addEventListener("change", renderFlashcards);

/* export */
exportFlashBtn.addEventListener("click", () => {
  const data = JSON.stringify(flashcards, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "flashcards.json";
  a.click();
  URL.revokeObjectURL(url);
});

/* ---------- STUDY MODE ---------- */
let studyOrder = []; // indices of flashcards
let currentIndex = 0;
let showingAnswer = false;

function openStudyMode(){
  if(flashcards.length === 0){
    alert("No flashcards — create some first.");
    return;
  }
  buildStudyOrder();
  currentIndex = 0;
  showingAnswer = false;
  updateStudyView();
  studyModal.setAttribute("open","");
  studyModal.style.display = "flex";
}
openStudyModeBtn.addEventListener("click", openStudyMode);

closeModal.addEventListener("click", closeStudyMode);
studyModal.addEventListener("click", e => { if(e.target === studyModal) closeStudyMode(); });

function closeStudyMode(){
  studyModal.style.display = "none";
  studyModal.removeAttribute("open");
}

/* STUDY ORDER build */
function buildStudyOrder(){
  // apply filter category from the flash filter
  const cat = filterFlashCategory.value;
  studyOrder = flashcards.map((f,i)=>({i,f})).filter(x => cat === "All" ? true : x.f.category === cat).map(x => x.i);
  if(studyOrder.length === 0) studyOrder = flashcards.map((_,i)=>i);
}

/* update view */
function updateStudyView(){
  if(studyOrder.length === 0){
    studyCard.textContent = "No cards in this selection.";
    studyCounter.textContent = "0 / 0";
    return;
  }
  const idx = studyOrder[currentIndex];
  const card = flashcards[idx];
  studyCounter.textContent = `${currentIndex + 1} / ${studyOrder.length}`;
  studyCard.textContent = showingAnswer ? card.answer : card.question;
}

/* modal controls */
prevCard.addEventListener("click", () => {
  if(studyOrder.length === 0) return;
  currentIndex = (currentIndex - 1 + studyOrder.length) % studyOrder.length;
  showingAnswer = false;
  updateStudyView();
});
nextCard.addEventListener("click", () => {
  if(studyOrder.length === 0) return;
  currentIndex = (currentIndex + 1) % studyOrder.length;
  showingAnswer = false;
  updateStudyView();
});
flipCard.addEventListener("click", () => {
  showingAnswer = !showingAnswer;
  updateStudyView();
});
modalShuffle.addEventListener("click", () => {
  studyOrder = shuffleArray(studyOrder);
  currentIndex = 0;
  showingAnswer = false;
  updateStudyView();
});
modalToggleShow.addEventListener("click", () => {
  showingAnswer = true;
  updateStudyView();
});

/* Mark known: mark card. For demo we flag known = true and optionally remove from deck if user wants. */
markKnown.addEventListener("click", () => {
  if(studyOrder.length === 0) return;
  const idx = studyOrder[currentIndex];
  flashcards[idx].known = true;
  alert("Marked as known ✅");
  // move to next
  currentIndex = (currentIndex + 1) % studyOrder.length;
  showingAnswer = false;
  renderFlashcards();
  updateStudyView();
});
markReview.addEventListener("click", () => {
  alert("Keep practicing ❌");
  showingAnswer = false;
  updateStudyView();
});
deleteCurrent.addEventListener("click", () => {
  if(!confirm("Delete this flashcard from deck?")) return;
  if(studyOrder.length === 0) return;
  const idx = studyOrder[currentIndex];
  flashcards.splice(idx,1);
  buildStudyOrder();
  if(currentIndex >= studyOrder.length) currentIndex = Math.max(0, studyOrder.length - 1);
  renderFlashcards();
  updateStudyView();
});

/* ---------- Utility functions ---------- */
function shuffleArray(arr){
  // return new shuffled array (non-destructive for arrays of objects)
  const a = Array.from(arr);
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------- INITIALIZE ---------- */
renderTasks();
renderFlashcards();

/* ---------- TAB SWITCHING ---------- */
$$(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".tab-btn").forEach(b => b.classList.remove("active"));
    $$(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});
