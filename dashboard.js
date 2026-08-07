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

// Interactive family photo: dots you can tap/hover to reveal each name.
function renderPhoto() {
  const photo = CONFIG.photo;
  const section = document.getElementById("photo");
  if (!section || !photo) return;

  const hotspots = (photo.hotspots || [])
    .map(
      (h, i) => `
      <button class="hotspot ${h.cls || ""}" style="left:${h.x}%;top:${h.y}%"
              data-index="${i}" aria-label="${h.label}">
        <span class="hotspot-dot"></span>
        <span class="hotspot-label">${h.emoji} ${h.label}</span>
      </button>`
    )
    .join("");

  section.innerHTML = `
    <div class="photo-wrap">
      <img class="photo-img" src="${photo.src}" alt="Fabio, Cleber, Fifi e Joio" />
      ${hotspots}
    </div>
    ${photo.caption ? `<p class="photo-caption">${photo.caption}</p>` : ""}
  `;

  const spots = section.querySelectorAll(".hotspot");
  spots.forEach((spot) => {
    spot.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = spot.classList.contains("open");
      spots.forEach((s) => s.classList.remove("open"));
      if (!wasOpen) spot.classList.add("open");
    });
  });
  section.addEventListener("click", () => {
    spots.forEach((s) => s.classList.remove("open"));
  });
}

const MOOD_STORAGE_PREFIX = "mood_";

// Current mood: the person's saved choice, or the config default.
function getMood(key) {
  try {
    const raw = localStorage.getItem(MOOD_STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore storage errors */
  }
  return CONFIG.feelings[key];
}

function setMood(key, mood) {
  try {
    localStorage.setItem(MOOD_STORAGE_PREFIX + key, JSON.stringify(mood));
  } catch (e) {
    /* ignore storage errors */
  }
}

// Fire a "corvo" (push) announcing the new mood. Never blocks the UI.
async function announceMood(key, mood) {
  const player = CONFIG.players[key] || { name: key };
  const message = `${player.name} agora está: ${mood.emoji} ${mood.mood}`;
  if (typeof sendNotification === "function") {
    try {
      await sendNotification(message, "Mudança de humor 🌡️");
    } catch (e) {
      /* offline or ntfy down: ignore */
    }
  }
}

// Editable "how are we feeling" cards (tap to change, saved locally).
function renderFeelings() {
  const feelings = CONFIG.feelings || {};
  const options = CONFIG.moodOptions || [];
  const section = document.getElementById("feelings");
  if (!section) return;

  const cards = Object.keys(feelings)
    .map((key) => {
      const player = CONFIG.players[key] || { name: key, cls: "" };
      const m = getMood(key);
      const menu = options
        .map(
          (o, i) =>
            `<button class="feeling-option" data-person="${key}" data-i="${i}">${o.emoji} ${o.mood}</button>`
        )
        .join("");
      return `
        <div class="feeling-card ${player.cls}-border" data-person="${key}">
          <div class="feeling-emoji">${m.emoji}</div>
          <div class="feeling-name ${player.cls}-text">${player.name}</div>
          <div class="feeling-mood">${m.mood}</div>
          <div class="feeling-hint">toque para mudar</div>
          <div class="feeling-menu">${menu}</div>
        </div>`;
    })
    .join("");

  section.innerHTML = `
    <h2 class="feelings-title">🌡️ Como estamos hoje</h2>
    <div class="feelings-cards">${cards}</div>
  `;

  wireFeelings(section);
}

function wireFeelings(section) {
  const cards = section.querySelectorAll(".feeling-card");

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".feeling-option")) return;
      e.stopPropagation();
      const wasOpen = card.classList.contains("open");
      cards.forEach((c) => c.classList.remove("open"));
      if (!wasOpen) card.classList.add("open");
    });
  });

  section.querySelectorAll(".feeling-option").forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = opt.dataset.person;
      const mood = CONFIG.moodOptions[Number(opt.dataset.i)];
      setMood(key, mood);
      announceMood(key, mood);
      renderFeelings();
    });
  });
}

// Whole months elapsed since a past date.
function monthsSince(dateStr) {
  const s = parseDate(dateStr);
  const t = startOfToday();
  let months = (t.getFullYear() - s.getFullYear()) * 12 + (t.getMonth() - s.getMonth());
  if (t.getDate() < s.getDate()) months -= 1;
  return Math.max(months, 0);
}

// Does today match an event's `when` rule?
function matchesToday(when) {
  if (!when) return false;
  const t = new Date();
  if (when.range) {
    const today = startOfToday();
    const from = when.range.from ? parseDate(when.range.from) : null;
    const until = when.range.until ? parseDate(when.range.until) : null;
    if (from && today < from) return false;
    if (until && today > until) return false;
    return true;
  }
  if (when.fullDate) {
    const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    return iso === when.fullDate;
  }
  if (when.date) {
    const mmdd = `${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    return mmdd === when.date;
  }
  if (typeof when.dayOfMonth === "number") return t.getDate() === when.dayOfMonth;
  if (typeof when.weekday === "number") return t.getDay() === when.weekday;
  return false;
}

// Show today's date-based events (anniversaries, etc.) with a celebration.
function renderEvents() {
  const events = CONFIG.events || [];
  const section = document.getElementById("events");
  if (!section) return;

  const active = events.filter((e) => matchesToday(e.when));
  if (!active.length) {
    section.innerHTML = "";
    return;
  }

  section.innerHTML = active
    .map((e, idx) => {
      let msg = e.message || "";
      if (e.countFrom && CONFIG.dates[e.countFrom]) {
        const m = monthsSince(CONFIG.dates[e.countFrom]);
        msg += ` (${m} ${m === 1 ? "mês" : "meses"} juntos!)`;
      }
      if (e.countdownTo) {
        const d = daysUntil(e.countdownTo);
        if (d > 0) msg += ` ⏳ Faltam ${d} ${d === 1 ? "dia" : "dias"}!`;
        else if (d === 0) msg += " 🎯 É HOJE!";
      }
      return `
        <div class="event-banner">
          <div class="event-emoji">${e.emoji || "🎉"}</div>
          <div class="event-text">
            <div class="event-title">${e.title || ""}</div>
            <div class="event-msg">${msg}</div>
          </div>
          <button class="btn btn-primary event-party-btn" data-idx="${idx}">🎉 Festa!</button>
        </div>`;
    })
    .join("");

  section.querySelectorAll(".event-party-btn").forEach((btn) => {
    btn.addEventListener("click", () => celebrate(active[Number(btn.dataset.idx)]));
  });

  if (active.some((e) => e.party !== false)) confettiBurst();

  // Mega events auto-open the big party once per browser session.
  active.forEach((e) => {
    if (!e.mega) return;
    const key = `megaParty_${e.id || e.title}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch (err) {
      /* ignore storage errors */
    }
    celebrate(e);
  });
}

function confettiBurst(count) {
  let box = document.getElementById("confetti");
  if (!box) {
    box = document.createElement("div");
    box.className = "confetti";
    box.id = "confetti";
    document.body.appendChild(box);
  }
  const colors = ["#ffd166", "#ff6ec7", "#4dd0ff", "#7b2ff7", "#8dff9e"];
  const total = count || 30;
  for (let i = 0; i < total; i++) {
    const piece = document.createElement("span");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1 + Math.random() * 1.2}s`;
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    box.appendChild(piece);
    setTimeout(() => piece.remove(), 2600);
  }
}

function spawnPartyEmoji(box, emojis) {
  const span = document.createElement("span");
  span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  span.style.left = `${Math.random() * 100}%`;
  span.style.fontSize = `${1.4 + Math.random() * 1.8}rem`;
  span.style.animationDuration = `${2 + Math.random() * 2}s`;
  box.appendChild(span);
  setTimeout(() => span.remove(), 4200);
}

// Full-screen celebration overlay for an event.
function celebrate(ev) {
  const existing = document.getElementById("event-party");
  if (existing) existing.remove();

  const mega = !!ev.mega;
  const overlay = document.createElement("div");
  overlay.id = "event-party";
  overlay.className = `party-overlay${mega ? " mega" : ""}`;
  overlay.innerHTML = `
    <div class="party-rays" aria-hidden="true"></div>
    <div class="fabio-storm" id="fabio-storm" aria-hidden="true"></div>
    <div class="party-emoji" id="event-party-emoji" aria-hidden="true"></div>
    <div class="party-card">
      <div class="party-trophy">${ev.emoji || "🎉"}</div>
      <h1 class="party-title">${ev.title || "Parabéns!"}</h1>
      <p class="party-prize">${ev.message || ""}</p>
      <button class="btn btn-primary" id="event-party-close">Aeee! 🎉</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const timers = [];
  const stop = () => {
    timers.forEach(clearInterval);
    overlay.remove();
  };
  overlay.querySelector("#event-party-close").addEventListener("click", stop);

  // Confetti is heavy, so it still runs for a limited number of bursts.
  // (Only its own timer is cleared - not the endless storm/rain below.)
  const perBurst = mega ? 60 : 30;
  const maxBursts = mega ? 20 : 8;
  const burstEvery = mega ? 300 : 420;
  let bursts = 0;
  const confTimer = setInterval(() => {
    confettiBurst(perBurst);
    if (++bursts >= maxBursts) clearInterval(confTimer);
  }, burstEvery);
  timers.push(confTimer);

  // Emoji rain: loops forever until the party is closed.
  const rainBox = overlay.querySelector("#event-party-emoji");
  const emojis = mega
    ? ["🎉", "🎊", "🥳", "❤️", "✨", "🎆", "💕", "🚗", "🧳", "🍾", "🏖️", "🔥"]
    : ["🎉", "🎊", "🥳", "❤️", "✨", "🎆", "💕"];
  timers.push(setInterval(() => spawnPartyEmoji(rainBox, emojis), mega ? 90 : 160));

  // Psychedelic Fabio storm: infinite loop of stickers until the party is
  // closed. It never stops on its own anymore.
  const stickers = (CONFIG.party && CONFIG.party.stickers) || [];
  if (stickers.length) {
    const stormBox = overlay.querySelector("#fabio-storm");
    const perTick = mega ? 4 : 2;
    timers.push(
      setInterval(() => {
        for (let i = 0; i < perTick; i++) spawnSticker(stormBox, stickers, mega);
      }, mega ? 70 : 150)
    );
  }
}

// One Fabio sticker: pops in somewhere, spins, hue-shifts, then fades.
function spawnSticker(box, stickers, mega) {
  const img = document.createElement("img");
  img.className = `fabio-sticker${mega ? " psycho" : ""}`;
  img.src = stickers[Math.floor(Math.random() * stickers.length)];
  img.style.left = `${Math.random() * 92}%`;
  img.style.top = `${Math.random() * 88}%`;
  // Wide size range: from tiny to huge.
  img.style.width = `${40 + Math.random() * 220}px`;
  img.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
  img.style.animationDuration = `${0.8 + Math.random() * 1.2}s`;
  box.appendChild(img);
  setTimeout(() => img.remove(), 2200);
}

function renderAll() {
  renderToday();
  renderEvents();
  renderPhoto();
  renderFeelings();
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
  document.addEventListener("click", () => {
    document
      .querySelectorAll(".feeling-card.open")
      .forEach((el) => el.classList.remove("open"));
  });
}

// Run now if the DOM is already parsed (scripts are loaded dynamically),
// otherwise wait for it.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
