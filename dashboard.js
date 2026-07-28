"use strict";

const DATES = CONFIG.dates;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Parse "YYYY-MM-DD" as a local date at midnight (no timezone surprises).
function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysBetween(from, to) {
  return Math.round((to - from) / MS_PER_DAY);
}

// Whole days elapsed since a past date (0 = the day itself).
function daysSince(dateStr) {
  return daysBetween(parseDate(dateStr), startOfToday());
}

// Whole days remaining until a future date.
function daysUntil(dateStr) {
  return daysBetween(startOfToday(), parseDate(dateStr));
}

// Cleber's day off repeats every `periodDays`, starting on a known Saturday.
// Returns whether it is happening now, and how many days until the next one.
function computeFolga(cfg) {
  const today = startOfToday();
  let sat = parseDate(cfg.referenceSaturday);

  // Walk to the most recent folga Saturday that is not in the future.
  while (daysBetween(sat, today) >= cfg.periodDays) {
    sat = new Date(sat.getTime() + cfg.periodDays * MS_PER_DAY);
  }
  while (sat > today) {
    sat = new Date(sat.getTime() - cfg.periodDays * MS_PER_DAY);
  }

  const sun = new Date(sat.getTime() + MS_PER_DAY);
  if (today.getTime() === sat.getTime() || today.getTime() === sun.getTime()) {
    return { ongoing: true };
  }

  const nextSat = new Date(sat.getTime() + cfg.periodDays * MS_PER_DAY);
  return { ongoing: false, days: daysBetween(today, nextSat), date: nextSat };
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
  }).format(date);
}

function renderToday() {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  document.getElementById("today").textContent = `📅 ${formatted}`;
}

// Build the list of dashboard cards from the config dates.
function buildCards() {
  const cards = [];

  cards.push({
    emoji: "❤️",
    title: "Namorando há",
    big: daysSince(DATES.relationshipStart),
    unit: "dias",
    sub: `desde ${formatDate(parseDate(DATES.relationshipStart))}`,
    cls: "cleber",
  });

  const vac = daysUntil(DATES.vacation);
  cards.push({
    emoji: "✈️",
    title: "Férias juntos em",
    big: vac > 0 ? vac : "🎉",
    unit: vac > 0 ? "dias" : "chegou!",
    sub: `${formatDate(parseDate(DATES.vacation))}`,
    cls: "cleber",
  });

  const folga = computeFolga(DATES.cleberFolga);
  cards.push({
    emoji: "😴",
    title: "Próxima folga de fim de semana do Cleber",
    big: folga.ongoing ? "🎉" : folga.days,
    unit: folga.ongoing ? "é agora!" : "dias",
    sub: folga.ongoing ? "aproveita o fim de semana!" : `fim de semana de ${formatDate(folga.date)}`,
    cls: "fabio",
  });

  return cards;
}

function renderDashboard() {
  const grid = document.getElementById("dashboard");
  grid.innerHTML = "";
  buildCards().forEach((c) => {
    const card = document.createElement("article");
    card.className = `box stat ${c.cls}-border`;
    card.innerHTML = `
      <div class="box-emoji">${c.emoji}</div>
      <h2 class="stat-title">${c.title}</h2>
      <div class="stat-number ${c.cls}-text">${c.big}</div>
      <div class="stat-unit">${c.unit}</div>
      <div class="stat-sub">${c.sub}</div>
    `;
    grid.appendChild(card);
  });
}

function renderFavorites() {
  const favs = CONFIG.favorites || [];
  const grid = document.getElementById("dashboard");
  favs.forEach((f) => {
    const card = document.createElement("article");
    card.className = "box stat favorite";
    card.innerHTML = `
      <div class="box-emoji">${f.emoji}</div>
      <h2 class="stat-title">${f.label}</h2>
      <div class="stat-fav">${f.value}</div>
    `;
    grid.appendChild(card);
  });
}

function renderPendings() {
  const pendings = CONFIG.pendings || [];
  const section = document.getElementById("pendings");
  if (!pendings.length) {
    section.innerHTML = "";
    return;
  }
  const items = pendings
    .map(
      (p) => `
      <li class="pending-item ${p.done ? "done" : ""}">
        <span class="pending-check">${p.done ? "✅" : "⏳"}</span>
        <span class="pending-text"><strong>${p.who}:</strong> ${p.text}</span>
      </li>`
    )
    .join("");
  section.innerHTML = `
    <h2 class="pending-title">📌 Pendências</h2>
    <ul class="pending-list">${items}</ul>
  `;
}

// Re-render the date-dependent parts. Favorites/pendings don't change daily.
function renderAll() {
  renderToday();
  renderDashboard();
  renderFavorites();
  renderPendings();
}

// Keep the counters fresh: if the calendar day changes while the tab is
// open, recompute everything automatically (checked once per minute).
function watchDayChange() {
  let currentDay = new Date().toDateString();
  setInterval(() => {
    const today = new Date().toDateString();
    if (today !== currentDay) {
      currentDay = today;
      renderAll();
    }
  }, 60 * 1000);
}

function init() {
  renderAll();
  watchDayChange();
}

// Run now if the DOM is already parsed (scripts are loaded dynamically),
// otherwise wait for it.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
