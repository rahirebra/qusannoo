(function () {
  "use strict";

  const STORAGE_KEY = "qusannoo_entries_v1";
  const BUDGET_KEY = "qusannoo_budgets_v1";
  const LANG_KEY = "qusannoo_lang_v1";
  const THEME_KEY = "qusannoo_theme_v1";

  const CATS = [
    { id: "food", en: "Food", om: "Nyaata", color: "#B5652E" },
    { id: "transport", en: "Transport", om: "Geejjiba", color: "#5F7A4E" },
    { id: "rent", en: "Rent", om: "Kiraa", color: "#4A2E1E" },
    { id: "utilities", en: "Utilities", om: "Bishaan/Ibsaa", color: "#C6902F" },
    { id: "airtime", en: "Airtime", om: "Kaardii Bilbilaa", color: "#7A5C8E" },
    { id: "family", en: "Family", om: "Maatii", color: "#A23E28" },
    { id: "health", en: "Health", om: "Fayyaa", color: "#3E7A8E" },
    { id: "other", en: "Other", om: "Kan Biraa", color: "#8A7B63" }
  ];

  const STR = {
    tagline: { en: "your daily ledger", om: "galmee guyyuu keessan" },
    today: { en: "Today", om: "Har'a" },
    week: { en: "This week", om: "Torban kana" },
    month: { en: "This month", om: "Ji'a kana" },
    addExpense: { en: "Add expense", om: "Baasii Galchi" },
    amount: { en: "Amount (ETB)", om: "Hanga (ETB)" },
    date: { en: "Date", om: "Guyyaa" },
    category: { en: "Category", om: "Ramaddii" },
    note: { en: "Note (optional)", om: "Yaada (filatamaa)" },
    addBtn: { en: "+ Add expense", om: "+ Baasii Galchi" },
    budgetRings: { en: "Budget rings", om: "Marsaa Baajata" },
    breakdown: { en: "Category breakdown", om: "Qooda Ramaddiin" },
    budgets: { en: "Category budgets (monthly)", om: "Baajata Ramaddii (ji'aan)" },
    recent: { en: "Recent entries", om: "Galmee Dhiyeenya" },
    export: { en: "Export CSV", om: "CSV Baasi" },
    footer: { en: "Qusannoo — all data stays on this device", om: "Qusannoo — daataan hundi meeshaa kana irratti hafa" },
    noEntries: { en: "No expenses yet. Add your first one above.", om: "Baasiin hin galfamne. Isa jalqabaa armaan olitti galchaa." },
    delete: { en: "Delete", om: "Haqi" },
    overBudget: { en: "over", om: "ol" }
  };

  let lang = localStorage.getItem(LANG_KEY) || "en";
  let theme = localStorage.getItem(THEME_KEY) || "light";

  function t(key) { return STR[key] ? STR[key][lang] : key; }
  function catName(cat) { return lang === "om" ? cat.om : cat.en; }

  function loadEntries() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveEntries(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

  function loadBudgets() {
    try { return JSON.parse(localStorage.getItem(BUDGET_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveBudgets(b) { localStorage.setItem(BUDGET_KEY, JSON.stringify(b)); }

  let entries = loadEntries();
  let budgets = loadBudgets();

  function fmt(n) {
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function todayStr() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function startOfWeek(d) {
    const dt = new Date(d);
    const day = dt.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    dt.setDate(dt.getDate() + diff);
    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  function applyTranslations() {
    document.querySelectorAll("[data-t]").forEach(el => {
      el.textContent = t(el.getAttribute("data-t"));
    });
    document.getElementById("langBtn").textContent = lang === "en" ? "EN" : "OM";
  }

  function populateCategorySelect() {
    const sel = document.getElementById("fCategory");
    sel.innerHTML = "";
    CATS.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = catName(c);
      sel.appendChild(opt);
    });
  }

  function renderBudgetGrid() {
    const grid = document.getElementById("budgetGrid");
    grid.innerHTML = "";
    CATS.forEach(c => {
      const row = document.createElement("div");
      row.className = "brow";
      const lbl = document.createElement("label");
      lbl.textContent = catName(c);
      const inp = document.createElement("input");
      inp.type = "number";
      inp.min = "0";
      inp.placeholder = "0";
      inp.value = budgets[c.id] || "";
      inp.addEventListener("change", () => {
        budgets[c.id] = Number(inp.value) || 0;
        saveBudgets(budgets);
        renderAll();
      });
      row.appendChild(lbl);
      row.appendChild(inp);
      grid.appendChild(row);
    });
  }

  function computeSums() {
    const now = new Date();
    const todayS = todayStr();
    const weekStart = startOfWeek(now);
    const monthPrefix = todayS.slice(0, 7);

    let today = 0, week = 0, month = 0;
    entries.forEach(e => {
      if (e.date === todayS) today += e.amount;
      const ed = new Date(e.date + "T00:00:00");
      if (ed >= weekStart) week += e.amount;
      if (e.date.slice(0, 7) === monthPrefix) month += e.amount;
    });
    return { today, week, month };
  }

  function categoryMonthTotals() {
    const monthPrefix = todayStr().slice(0, 7);
    const totals = {};
    CATS.forEach(c => totals[c.id] = 0);
    entries.forEach(e => {
      if (e.date.slice(0, 7) === monthPrefix) {
        totals[e.category] = (totals[e.category] || 0) + e.amount;
      }
    });
    return totals;
  }

  function renderSummary() {
    const s = computeSums();
    document.getElementById("sumToday").textContent = fmt(s.today);
    document.getElementById("sumWeek").textContent = fmt(s.week);
    document.getElementById("sumMonth").textContent = fmt(s.month);
  }

  function renderRings() {
    const totals = categoryMonthTotals();
    const wrap = document.getElementById("ringsScroll");
    wrap.innerHTML = "";
    const R = 42, CIRC = 2 * Math.PI * R;

    CATS.forEach(c => {
      const spent = totals[c.id] || 0;
      const budget = budgets[c.id] || 0;
      if (budget === 0 && spent === 0) return;
      const pct = budget > 0 ? Math.min(spent / budget, 1) : 0;
      const over = budget > 0 && spent > budget;

      const item = document.createElement("div");
      item.className = "ring-item";

      const ringDiv = document.createElement("div");
      ringDiv.className = "stain-ring";
      ringDiv.innerHTML = `
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle class="ring-bg" cx="48" cy="48" r="${R}"></circle>
          <circle class="ring-fg" cx="48" cy="48" r="${R}"
            stroke="${over ? '#A23E28' : c.color}"
            stroke-dasharray="${CIRC * pct} ${CIRC}"></circle>
        </svg>
        <div class="ring-label">
          <div class="ring-pct" style="${over ? 'color:#A23E28' : ''}">${budget > 0 ? Math.round(pct * 100) + '%' : fmt(spent)}</div>
          <div class="ring-cat">${catName(c)}</div>
        </div>`;
      item.appendChild(ringDiv);

      const sub = document.createElement("div");
      sub.style.fontSize = "10.5px";
      sub.style.color = "var(--ink-soft)";
      sub.style.fontFamily = "ui-monospace, monospace";
      if (budget > 0) {
        sub.innerHTML = over
          ? `<span class="over">+${fmt(spent - budget)} ${t('overBudget')}</span>`
          : `${fmt(spent)} / ${fmt(budget)}`;
      } else {
        sub.textContent = fmt(spent);
      }
      item.appendChild(sub);
      wrap.appendChild(item);
    });

    if (!wrap.children.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.style.padding = "10px";
      empty.textContent = t("noEntries");
      wrap.appendChild(empty);
    }
  }

  function renderDonut() {
    const totals = categoryMonthTotals();
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    const svg = document.getElementById("donut");
    const legend = document.getElementById("legend");
    svg.innerHTML = "";
    legend.innerHTML = "";

    if (total <= 0) {
      svg.innerHTML = `<circle cx="60" cy="60" r="46" fill="none" stroke="var(--paper-line)" stroke-width="14"/>`;
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.style.padding = "0";
      empty.textContent = t("noEntries");
      legend.appendChild(empty);
      return;
    }

    const R = 46, CIRC = 2 * Math.PI * R;
    let offset = 0;
    CATS.forEach(c => {
      const val = totals[c.id] || 0;
      if (val <= 0) return;
      const frac = val / total;
      const seg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      seg.setAttribute("cx", "60"); seg.setAttribute("cy", "60"); seg.setAttribute("r", R);
      seg.setAttribute("fill", "none");
      seg.setAttribute("stroke", c.color);
      seg.setAttribute("stroke-width", "14");
      seg.setAttribute("stroke-dasharray", `${CIRC * frac} ${CIRC}`);
      seg.setAttribute("stroke-dashoffset", `${-offset}`);
      seg.setAttribute("transform", "rotate(-90 60 60)");
      svg.appendChild(seg);
      offset += CIRC * frac;

      const row = document.createElement("div");
      row.className = "legend-row";
      row.innerHTML = `<span class="swatch" style="background:${c.color}"></span>
        <span class="lname">${catName(c)}</span>
        <span class="lval">${fmt(val)}</span>`;
      legend.appendChild(row);
    });
  }

  function renderEntries() {
    const list = document.getElementById("entriesList");
    list.innerHTML = "";
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = t("noEntries");
      list.appendChild(empty);
      return;
    }
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    let lastDate = null;
    sorted.forEach(e => {
      if (e.date !== lastDate) {
        lastDate = e.date;
        const head = document.createElement("div");
        head.className = "date-head";
        head.textContent = e.date;
        list.appendChild(head);
      }
      const cat = CATS.find(c => c.id === e.category) || CATS[CATS.length - 1];
      const row = document.createElement("div");
      row.className = "entry-row";
      row.innerHTML = `
        <span class="cat-dot" style="background:${cat.color}"></span>
        <div class="einfo">
          <div class="ecat">${catName(cat)}</div>
          ${e.note ? `<div class="enote">${escapeHtml(e.note)}</div>` : ""}
        </div>
        <div class="eamt">${fmt(e.amount)}</div>
        <button class="edel" title="${t('delete')}" data-id="${e.id}">✕</button>`;
      list.appendChild(row);
    });

    list.querySelectorAll(".edel").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        entries = entries.filter(e => e.id !== id);
        saveEntries(entries);
        renderAll();
      });
    });
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function renderAll() {
    applyTranslations();
    populateCategorySelect();
    renderBudgetGrid();
    renderSummary();
    renderRings();
    renderDonut();
    renderEntries();
  }

  document.getElementById("entryForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    const amount = Number(document.getElementById("fAmount").value);
    const date = document.getElementById("fDate").value || todayStr();
    const category = document.getElementById("fCategory").value;
    const note = document.getElementById("fNote").value.trim();
    if (!amount || amount <= 0) return;

    entries.push({ id: Date.now(), amount, date, category, note });
    saveEntries(entries);

    document.getElementById("fAmount").value = "";
    document.getElementById("fNote").value = "";
    document.getElementById("fDate").value = todayStr();

    renderAll();
  });

  document.getElementById("fDate").value = todayStr();

  document.getElementById("settingsToggle").addEventListener("click", () => {
    const grid = document.getElementById("budgetGrid");
    const caret = document.getElementById("settingsCaret");
    const open = grid.style.display !== "none";
    grid.style.display = open ? "none" : "flex";
    caret.textContent = open ? "▾" : "▴";
  });

  document.getElementById("langBtn").addEventListener("click", () => {
    lang = lang === "en" ? "om" : "en";
    localStorage.setItem(LANG_KEY, lang);
    renderAll();
  });

  function applyTheme() {
    document.body.setAttribute("data-theme", theme);
    document.getElementById("themeBtn").textContent = theme === "light" ? "☾" : "☀";
  }
  document.getElementById("themeBtn").addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, theme);
    applyTheme();
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    if (!entries.length) return;
    const rows = [["Date", "Category", "Amount(ETB)", "Note"]];
    [...entries].sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
      const cat = CATS.find(c => c.id === e.category);
      rows.push([e.date, cat ? cat.en : e.category, e.amount, (e.note || "").replace(/,/g, ";")]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qusannoo-export-${todayStr()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  applyTheme();
  renderAll();

  // Register service worker so the app works offline once installed
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }
})();
