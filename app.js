// ------------- CONFIG: replace these with YOUR values -------------
const SUPABASE_URL = "https://agbqjevohcvxhmnyodvk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnFqZXZvaGN2eGhtbnlvZHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjU4OTAsImV4cCI6MjA3MDgwMTg5MH0.PkyFEmqJO03xofTSEaRh2576xsYJk_UF1Gz-JV8-KA0";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------- DOM --------------------
const loginCard    = document.getElementById("loginCard");
const itemsSection = document.getElementById("itemsSection");
const loginBtn     = document.getElementById("loginBtn");
const signOutBtn   = document.getElementById("signOutBtn");
const loginMsg     = document.getElementById("loginMsg");
const authArea     = document.getElementById("authArea");

// Subject bar
const subjectBar = document.getElementById("subjectBar");

// Tabs & panes
const tabActive     = document.getElementById("tabActive");
const tabCompleted  = document.getElementById("tabCompleted");
const activePane    = document.getElementById("activePane");
const completedPane = document.getElementById("completedPane");

// Filters
const activeFilters           = document.getElementById("activeFilters");
const completedFilters        = document.getElementById("completedFilters");
const activeSubjectFilter     = document.getElementById("activeSubjectFilter");
const activeSearch            = document.getElementById("activeSearch");
const completedSubjectFilter  = document.getElementById("completedSubjectFilter");
const completedSearch         = document.getElementById("completedSearch");

// Active table
const activeTbody = document.getElementById("activeTbody");
const emptyState  = document.getElementById("emptyState");

// Completed table
const completedTbody = document.getElementById("completedTbody");
const completedEmpty = document.getElementById("completedEmpty");

// Modal
const addModal        = document.getElementById("addModal");
const addTitle        = document.getElementById("addTitle");
const addForm         = document.getElementById("addForm");
const addMsg          = document.getElementById("addMsg");
const editId          = document.getElementById("editId");
const subjectInput    = document.getElementById("subjectInput");
const typeInput       = document.getElementById("typeInput");
const startDateInput  = document.getElementById("startDateInput");
const dueDateInput    = document.getElementById("dueDateInput");
const timeInput       = document.getElementById("timeInput");
const titleInput      = document.getElementById("titleInput");
const notesInput      = document.getElementById("notesInput");
const closeAdd        = document.getElementById("closeAdd");
const cancelAdd       = document.getElementById("cancelAdd");

// Calendar
const calTitle     = document.getElementById("calTitle");
const calendarGrid = document.getElementById("calendarGrid");
const prevMonth    = document.getElementById("prevMonth");
const nextMonth    = document.getElementById("nextMonth");
const todayBtn     = document.getElementById("todayBtn");
const dayFilterBar = document.getElementById("dayFilterBar");
const filterLabel  = document.getElementById("filterLabel");
const clearFilter  = document.getElementById("clearFilter");

// -------------------- STATE --------------------
let allItems = [];
let currentMonth = new Date();
let activeDateFilter = null;   // 'YYYY-MM-DD'
let currentTab = "active";     // 'active' | 'completed'

// Subject colors
const subjectStyles = {
  "Tennis":     { btn: "bg-emerald-500/20 text-emerald-200 border-emerald-700/40", dot: "bg-emerald-400" },
  "GT":         { btn: "bg-cyan-500/20 text-cyan-200 border-cyan-700/40",         dot: "bg-cyan-400" },
  "AP Comp Sci":{ btn: "bg-indigo-500/20 text-indigo-200 border-indigo-700/40",   dot: "bg-indigo-400" },
  "AP Hum Geo": { btn: "bg-rose-500/20 text-rose-200 border-rose-700/40",         dot: "bg-rose-400" },
  "Spanish 3":  { btn: "bg-teal-500/20 text-teal-200 border-teal-700/40",         dot: "bg-teal-400" },
  "Bio":        { btn: "bg-lime-500/20 text-lime-200 border-lime-700/40",         dot: "bg-lime-400" },
  "PreCalc":    { btn: "bg-orange-500/20 text-orange-200 border-orange-700/40",   dot: "bg-orange-400" },
  "Other":      { btn: "bg-zinc-600/20 text-zinc-200 border-zinc-700/40",         dot: "bg-zinc-400" },
};

// Style subject buttons
subjectBar.querySelectorAll(".subjectBtn").forEach(btn => {
  const s = btn.getAttribute("data-subject");
  btn.classList.add(...subjectStyles[s].btn.split(" "), "border");
});

// -------------------- HELPERS --------------------
function fmtDate(d) { try { return new Date(d).toLocaleDateString(); } catch { return d; } }
function fmtTime(t) {
  if (!t) return "";
  const [H, M] = t.split(":");
  const d = new Date(); d.setHours(Number(H), Number(M)||0, 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function iso(d) { return new Date(d).toISOString().slice(0,10); }
function monthTitle(dateObj) { return dateObj.toLocaleString(undefined, { month: 'long', year: 'numeric' }); }
function setAuthedUI(email) {
  authArea.textContent = email ? `Signed in as ${email}` : "";
  loginCard.classList.toggle("hidden", !!email);
  itemsSection.classList.toggle("hidden", !email);
}
function setTab(tab) {
  currentTab = tab;
  const activeClasses = "rounded-lg px-3 py-1.5 text-sm border border-zinc-700 bg-zinc-800 text-white";
  const inactiveClasses = "rounded-lg px-3 py-1.5 text-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-800";
  tabActive.className = tab === "active" ? activeClasses : inactiveClasses;
  tabCompleted.className = tab === "completed" ? activeClasses : inactiveClasses;
  activePane.classList.toggle("hidden", tab !== "active");
  completedPane.classList.toggle("hidden", tab !== "completed");
  activeFilters.classList.toggle("hidden", tab !== "active");
  completedFilters.classList.toggle("hidden", tab !== "completed");
}

// -------------------- AUTH --------------------
loginBtn?.addEventListener("click", async () => {
  loginMsg.textContent = "Signing in…";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { loginMsg.textContent = error.message; return; }
  loginMsg.textContent = "Signed in ✅";
  setAuthedUI(data.user.email);
  await loadItems();
});
signOutBtn?.addEventListener("click", async () => { await supabase.auth.signOut(); setAuthedUI(null); });

// Restore session on load
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) { setAuthedUI(session.user.email); await loadItems(); } else { setAuthedUI(null); }
})();

// -------------------- DATA --------------------
async function loadItems() {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true, nullsFirst: true });

  if (error) { console.error(error); loginMsg.textContent = "Error loading items."; return; }
  allItems = data || [];
  renderCalendar();
  renderActiveTable();
  renderCompletedTable();
}

// -------------------- FILTERS --------------------
function applyFilters(list, subjectVal, queryVal) {
  const q = (queryVal || "").trim().toLowerCase();
  return list.filter(i => {
    const subjectOK = subjectVal ? i.subject === subjectVal : true;
    const qOK = q
      ? (i.title?.toLowerCase().includes(q) || i.notes?.toLowerCase().includes(q))
      : true;
    return subjectOK && qOK;
  });
}
activeSubjectFilter.addEventListener("input", renderActiveTable);
activeSearch.addEventListener("input", renderActiveTable);
completedSubjectFilter.addEventListener("input", renderCompletedTable);
completedSearch.addEventListener("input", renderCompletedTable);

// -------------------- RENDER: ACTIVE TABLE --------------------
function subjectDot(subject) {
  const dot = subjectStyles[subject]?.dot || "bg-zinc-400";
  return `<span class="inline-block size-2 rounded-full ${dot}"></span>`;
}

function renderActiveTable() {
  activeTbody.innerHTML = "";

  let list = allItems.filter(i => i.status !== "completed");
  if (activeDateFilter) list = list.filter(i => i.date === activeDateFilter);
  list = applyFilters(list, activeSubjectFilter.value, activeSearch.value);

  if (list.length === 0) { emptyState.classList.remove("hidden"); return; }
  emptyState.classList.add("hidden");

  for (const it of list) {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-zinc-900";
    tr.innerHTML = `
      <td class="p-3 align-top">${subjectDot(it.subject)}</td>
      <td class="p-3 align-top">${it.subject}</td>
      <td class="p-3 align-top">${it.type}</td>
      <td class="p-3 align-top font-medium">${it.title}</td>
      <td class="p-3 align-top">${fmtDate(it.start_date)}</td>
      <td class="p-3 align-top">${fmtDate(it.date)}</td>
      <td class="p-3 align-top">${fmtTime(it.time)}</td>
      <td class="p-3 align-top">${it.notes ?? ""}</td>
      <td class="p-3 align-top">
        <button class="btnDone text-xs rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800" data-id="${it.id}">Mark as Done</button>
        <button class="btnEdit text-xs rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800" data-id="${it.id}">Edit</button>
        <button class="btnDelete text-xs rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 hover:bg-red-900/40 border-red-900/40 text-red-300" data-id="${it.id}">Delete</button>
      </td>
    `;
    activeTbody.appendChild(tr);
  }
}

// Active table actions (delegation)
activeTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button"); if (!btn) return;
  const id = btn.getAttribute("data-id");
  const item = allItems.find(i => i.id === id); if (!item) return;

  if (btn.classList.contains("btnDone")) {
    const patch = { status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { error } = await supabase.from("items").update(patch).eq("id", id);
    if (error) { console.error(error); alert("Could not mark complete."); return; }
    item.status = "completed";
    item.completed_at = patch.completed_at;
    renderActiveTable(); renderCompletedTable(); renderCalendar();
  } else if (btn.classList.contains("btnEdit")) {
    openEdit(item);
  } else if (btn.classList.contains("btnDelete")) {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) { console.error(error); alert("Delete failed."); return; }
    allItems = allItems.filter(i => i.id !== id);
    renderActiveTable(); renderCalendar();
  }
});

// -------------------- RENDER: COMPLETED TABLE --------------------
function renderCompletedTable() {
  completedTbody.innerHTML = "";
  let list = allItems.filter(i => i.status === "completed");
  list = applyFilters(list, completedSubjectFilter.value, completedSearch.value);

  if (list.length === 0) { completedEmpty.classList.remove("hidden"); }
  else { completedEmpty.classList.add("hidden"); }

  for (const it of list) {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-zinc-900";
    tr.innerHTML = `
      <td class="p-3 align-top">${subjectDot(it.subject)}</td>
      <td class="p-3 align-top">${it.subject}</td>
      <td class="p-3 align-top">${it.type}</td>
      <td class="p-3 align-top font-medium">${it.title}</td>
      <td class="p-3 align-top">${fmtDate(it.start_date)}</td>
      <td class="p-3 align-top">${fmtDate(it.date)}</td>
      <td class="p-3 align-top">${fmtTime(it.time)}</td>
      <td class="p-3 align-top">${it.notes ?? ""}</td>
      <td class="p-3 align-top">
        <button class="btnUndo text-xs rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800" data-id="${it.id}">Undo</button>
        <button class="btnDelete text-xs rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 hover:bg-red-900/40 border-red-900/40 text-red-300" data-id="${it.id}">Delete</button>
      </td>
    `;
    completedTbody.appendChild(tr);
  }
}

// Completed table actions (delegation)
completedTbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button"); if (!btn) return;
  const id = btn.getAttribute("data-id");
  const item = allItems.find(i => i.id === id); if (!item) return;

  if (btn.classList.contains("btnUndo")) {
    const patch = { status: "pending", completed_at: null, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("items").update(patch).eq("id", id);
    if (error) { console.error(error); alert("Could not undo complete."); return; }
    item.status = "pending"; item.completed_at = null;
    setTab("active");
    renderCompletedTable(); renderActiveTable(); renderCalendar();
  } else if (btn.classList.contains("btnDelete")) {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) { console.error(error); alert("Delete failed."); return; }
    allItems = allItems.filter(i => i.id !== id);
    renderCompletedTable(); renderCalendar();
  }
});

// -------------------- CALENDAR (subject-colored counts) --------------------
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function daysInMonth(d)  { return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); }

function renderCalendar() {
  const base = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  calTitle.textContent = monthTitle(base);
  calendarGrid.innerHTML = "";

  const firstDow  = startOfMonth(base).getDay(); // 0 Sun..6 Sat
  const totalDays = daysInMonth(base);

  // Per-day counts by SUBJECT (only pending)
  const counts = {};
  for (const it of allItems.filter(i => i.status !== "completed")) {
    const d = new Date(it.date + "T00:00:00");
    if (d.getMonth() !== base.getMonth() || d.getFullYear() !== base.getFullYear()) continue;
    const k = iso(d);
    counts[k] ||= {};
    counts[k][it.subject] = (counts[k][it.subject] || 0) + 1;
  }

  // Leading blanks
  for (let i=0; i<firstDow; i++) {
    const cell = document.createElement("div");
    cell.className = "h-24 rounded-xl border border-transparent";
    calendarGrid.appendChild(cell);
  }

  const todayKey = iso(new Date());
  for (let day=1; day<=totalDays; day++) {
    const cellDate = new Date(base.getFullYear(), base.getMonth(), day);
    const key = iso(cellDate);
    const bySubject = counts[key] || {};
    const isToday = key === todayKey;

    const subjects = Object.keys(bySubject).sort((a,b)=>bySubject[b]-bySubject[a]);
    const topFour = subjects.slice(0,4);
    const more = subjects.length - topFour.length;

    const rows = topFour.map(s => {
      const dot = subjectStyles[s]?.dot || "bg-zinc-400";
      return `<div class="inline-flex items-center gap-1"><span class="inline-block size-2 rounded-full ${dot}"></span>${bySubject[s]} ${s}</div>`;
    }).join("");

    const cell = document.createElement("button");
    cell.className = [
      "h-24 rounded-xl border p-2 text-left hover:bg-zinc-900 transition",
      "border-zinc-800 bg-zinc-900/50",
      "flex flex-col",
      isToday ? "ring-2 ring-emerald-500/50 border-emerald-700/40" : ""
    ].join(" ");

    cell.innerHTML = `
      <div class="text-center">
        <div class="text-sm ${isToday ? "text-white font-semibold" : "text-zinc-300"}">${day}</div>
      </div>
      <div class="mt-2 space-y-1 text-xs">
        ${rows || ""}  <!-- blank if none -->
        ${more > 0 ? `<div class="text-zinc-400">+${more} more</div>` : ""}
      </div>
    `;

    cell.addEventListener("click", () => {
      activeDateFilter = key;
      filterLabel.textContent = new Date(key).toLocaleDateString();
      dayFilterBar.classList.remove("hidden");
      setTab("active");
      renderActiveTable();
    });

    calendarGrid.appendChild(cell);
  }
}

// Calendar controls (unstyled text)
prevMonth.addEventListener("click", () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1, 1); renderCalendar(); });
nextMonth.addEventListener("click", () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 1); renderCalendar(); });
todayBtn.addEventListener("click", () => { currentMonth = new Date(); renderCalendar(); });
clearFilter.addEventListener("click", () => { activeDateFilter = null; dayFilterBar.classList.add("hidden"); renderActiveTable(); });

// -------------------- ADD / EDIT --------------------
function openAdd(subject) {
  editId.value = "";
  addTitle.textContent = `Add to ${subject}`;
  addMsg.textContent = "";
  addForm.reset();

  subjectInput.value = subject;
  startDateInput.valueAsDate = new Date();
  dueDateInput.value = "";
  timeInput.value = "";
  titleInput.value = "";
  notesInput.value = "";

  addModal.classList.remove("hidden");
}
function openEdit(item) {
  editId.value = item.id;
  addTitle.textContent = `Edit ${item.subject}`;
  addMsg.textContent = "";

  subjectInput.value   = item.subject;
  typeInput.value      = item.type[0].toUpperCase() + item.type.slice(1);
  startDateInput.value = item.start_date;
  dueDateInput.value   = item.date;
  timeInput.value      = item.time ? item.time.slice(0,5) : "";
  titleInput.value     = item.title || "";
  notesInput.value     = item.notes || "";

  addModal.classList.remove("hidden");
}
function closeModal() { addModal.classList.add("hidden"); }
subjectBar.addEventListener("click", (e) => {
  const btn = e.target.closest(".subjectBtn");
  if (!btn) return;
  openAdd(btn.getAttribute("data-subject"));
});
closeAdd?.addEventListener("click", closeModal);
cancelAdd?.addEventListener("click", closeModal);

// Insert or update
addForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  addMsg.textContent = "Saving…";

  const titleVal = (titleInput.value || "").trim();
  if (!titleVal) { addMsg.textContent = "Please enter a Title."; return; }

  const payload = {
    subject:    subjectInput.value,
    type:       (typeInput.value || "Other").toLowerCase(),
    title:      titleVal,
    start_date: startDateInput.value || iso(new Date()),
    date:       dueDateInput.value,
    time:       timeInput.value ? `${timeInput.value}:00` : null,
    notes:      (notesInput.value || "").trim() || null,
  };

  if (!payload.subject || !payload.date) { addMsg.textContent = "Please select subject and due date."; return; }

  let error;
  if (editId.value) {
    ({ error } = await supabase.from("items").update(payload).eq("id", editId.value));
  } else {
    payload.status = "pending";
    ({ error } = await supabase.from("items").insert([payload]));
  }

  if (error) { addMsg.textContent = `Error: ${error.message}`; console.error(error); return; }

  addMsg.textContent = "Saved ✅";
  setTimeout(async () => { closeModal(); await loadItems(); }, 250);
});

// -------------------- TABS --------------------
tabActive.addEventListener("click", () => setTab("active"));
tabCompleted.addEventListener("click", () => setTab("completed"));
setTab("active");


