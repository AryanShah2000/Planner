// ---- 1) Configure Supabase client ----
const SUPABASE_URL = "https://agbqjevohcvxhmnyodvk.supabase.co";        // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnFqZXZvaGN2eGhtbnlvZHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjU4OTAsImV4cCI6MjA3MDgwMTg5MH0.PkyFEmqJO03xofTSEaRh2576xsYJk_UF1Gz-JV8-KA0";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- 2) Grab DOM elements ----
const loginCard    = document.getElementById("loginCard");
const itemsSection = document.getElementById("itemsSection");
const loginBtn     = document.getElementById("loginBtn");
const signOutBtn   = document.getElementById("signOutBtn");
const loginMsg     = document.getElementById("loginMsg");
const authArea     = document.getElementById("authArea");
const itemsList    = document.getElementById("itemsList");
const emptyState   = document.getElementById("emptyState");

// ---- 3) Helpers ----
function fmtDate(d) {
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}
function fmtTime(t) {
  if (!t) return "";
  // Expecting 'HH:MM:SS' from Postgres TIME
  const [H, M] = t.split(":");
  const d = new Date();
  d.setHours(Number(H), Number(M) || 0, 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function setAuthedUI(email) {
  authArea.textContent = email ? `Signed in as ${email}` : "";
  loginCard.classList.toggle("hidden", !!email);
  itemsSection.classList.toggle("hidden", !email);
}

// ---- 4) Render list ----
function renderItems(items) {
  itemsList.innerHTML = "";
  if (!items || items.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "rounded-xl border border-zinc-800 bg-zinc-900/60 p-3";
    const color =
      item.type === "event" ? "text-sky-300"
      : item.type === "homework" ? "text-fuchsia-300"
      : "text-amber-300";
    const when = [fmtDate(item.date), fmtTime(item.time)].filter(Boolean).join(" • ");

    li.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm ${color} font-medium">${item.type.toUpperCase()}</div>
          <div class="font-semibold">${item.title}</div>
          <div class="text-sm text-zinc-400">${when}</div>
          ${item.notes ? `<div class="text-sm text-zinc-300 mt-1">${item.notes}</div>` : ""}
        </div>
        <div class="text-xs px-2 py-1 rounded-lg border border-zinc-700 ${item.status === "completed" ? "bg-zinc-800 text-zinc-300" : "text-zinc-400"}">
          ${item.status}
        </div>
      </div>
    `;
    itemsList.appendChild(li);
  }
}

// ---- 5) Fetch items ----
async function loadItems() {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true, nullsFirst: true });

  if (error) {
    console.error(error);
    loginMsg.textContent = "Error loading items. Check console.";
    return;
  }
  renderItems(data);
}

// ---- 6) Check existing session on load ----
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    setAuthedUI(session.user.email);
    await loadItems();
  } else {
    setAuthedUI(null);
  }
})();

// ---- 7) Login + Sign out ----
loginBtn?.addEventListener("click", async () => {
  loginMsg.textContent = "Signing in…";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(error);
    loginMsg.textContent = error.message;
    return;
  }
  loginMsg.textContent = "Signed in.";
  setAuthedUI(data.user.email);
  await loadItems();
});

signOutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  setAuthedUI(null);
});
