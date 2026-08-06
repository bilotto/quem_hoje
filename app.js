"use strict";

// All data comes from the central config (config.js).
const PLAYERS = CONFIG.players;
const FABIO_CHANCE = CONFIG.fabioChance;
const BOXES = CONFIG.boxes;

const SPIN_MS = 900;

// Fair coin: returns "fabio" 50% of the time, "cleber" otherwise.
// A box can override the outcome with `forceWinner` ("cleber" or "fabio").
function drawPlayer(box) {
  if (box && box.forceWinner && PLAYERS[box.forceWinner]) {
    return PLAYERS[box.forceWinner];
  }
  return Math.random() < FABIO_CHANCE ? PLAYERS.fabio : PLAYERS.cleber;
}

function renderToday() {
  const el = document.getElementById("today");
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  el.textContent = `📅 ${formatted}`;
}

function buildBox(box, index) {
  const card = document.createElement("article");
  card.className = "box";
  const extraHtml = box.extra
    ? `<div class="result-extra" id="extra-${index}"></div>`
    : "";
  card.innerHTML = `
    <div class="box-emoji">${box.emoji}</div>
    <h2 class="box-question">${box.question}</h2>
    <div class="result" id="result-${index}">🎲 quem será?</div>
    ${extraHtml}
    <button class="btn-draw" data-index="${index}">Sortear</button>
  `;
  card
    .querySelector(".btn-draw")
    .addEventListener("click", () => spinBox(index));
  return card;
}

function renderBoxes() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  BOXES.forEach((box, i) => grid.appendChild(buildBox(box, i)));
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Animate the result field then settle on the winner (and optional extra).
function spinBox(index) {
  return new Promise((resolve) => {
    const box = BOXES[index];
    const result = document.getElementById(`result-${index}`);
    const extraEl = document.getElementById(`extra-${index}`);
    result.className = "result spinning";
    if (extraEl) extraEl.textContent = "";

    const flick = setInterval(() => {
      const p = Math.random() < 0.5 ? PLAYERS.fabio : PLAYERS.cleber;
      result.textContent = `${p.emoji} ${p.name}`;
      if (extraEl && box.extra) {
        extraEl.textContent = `${box.extra.emoji} ${pickRandom(box.extra.options)}`;
      }
    }, 90);

    setTimeout(() => {
      clearInterval(flick);
      const winner = drawPlayer(box);
      result.className = `result ${winner.cls}`;
      result.textContent = `${winner.emoji} ${winner.name}`;

      // Joke: if this box lands on Fabio, the whole "site crashes".
      if (box.fatalIfFabio && winner.cls === "fabio") {
        setTimeout(showFatalCrash, 700);
        resolve(winner);
        return;
      }

      if (extraEl && box.extra) {
        const detail = pickRandom(box.extra.options);
        extraEl.className = "result-extra revealed";
        extraEl.textContent = `${box.extra.emoji} ${box.extra.label}: ${detail}`;
      }
      burstConfetti();
      resolve(winner);
    }, SPIN_MS);
  });
}

// Apocalyptic fake crash: a cascade of absurd errors, glitch, then reload.
const CRASH_LINES = [
  "> FATAL: ZeroDivisionError: divisão por zero detectada",
  "> reality.integrity_check() ......... FALHOU",
  "> ERRO: inconsistência no mundo (world_state != expected)",
  "> kernel panic - not syncing: o Fabio deu",
  "> tentando reverter o universo .......... FALHOU",
  "> propagando falha para dimensões vizinhas...",
  "> [WARN] leis da física comprometidas",
  "> [ERRO] causalidade perdida",
  "> [ERRO] gravidade retornou NaN",
  "> [CRÍTICO] o tempo começou a andar pra trás",
  "> desligando a realidade ............... ██████████ 100%",
];

function showFatalCrash() {
  const existing = document.getElementById("crash-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "crash-overlay";
  overlay.className = "crash-overlay";
  overlay.innerHTML = `
    <div class="crash-scanlines" aria-hidden="true"></div>
    <div class="crash-box">
      <div class="crash-header">
        <span class="crash-icon">💀</span>
        <span class="crash-title" data-text="ERRO FATAL">ERRO FATAL</span>
      </div>
      <pre class="crash-log" id="crash-log"></pre>
    </div>
  `;
  document.body.appendChild(overlay);

  const log = overlay.querySelector("#crash-log");
  let i = 0;
  const feed = setInterval(() => {
    if (i < CRASH_LINES.length) {
      log.textContent += CRASH_LINES[i] + "\n";
      i += 1;
      return;
    }
    clearInterval(feed);
    triggerApocalypse(overlay);
  }, 320);
}

function triggerApocalypse(overlay) {
  overlay.classList.add("apocalypse");
  const banner = document.createElement("div");
  banner.className = "crash-apocalypse";
  banner.innerHTML = `
    <div class="crash-end" data-text="FIM DE TUDO">FIM DE TUDO</div>
    <p class="crash-sub">A realidade foi corrompida.</p>
    <p class="crash-reload">Reconstruindo o universo em <span id="crash-count">3</span>...</p>
  `;
  overlay.appendChild(banner);

  let n = 3;
  const counter = banner.querySelector("#crash-count");
  const timer = setInterval(() => {
    n -= 1;
    if (counter) counter.textContent = String(Math.max(n, 0));
    if (n <= 0) {
      clearInterval(timer);
      location.reload();
    }
  }, 1000);
}

async function drawAll() {
  for (let i = 0; i < BOXES.length; i++) {
    await spinBox(i);
    await sleep(120);
  }
}

function resetAll() {
  BOXES.forEach((_, i) => {
    const result = document.getElementById(`result-${i}`);
    result.className = "result";
    result.textContent = "🎲 quem será?";
    const extraEl = document.getElementById(`extra-${i}`);
    if (extraEl) {
      extraEl.className = "result-extra";
      extraEl.textContent = "";
    }
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function burstConfetti() {
  const box = document.getElementById("confetti");
  const colors = ["#ffd166", "#ff6ec7", "#4dd0ff", "#7b2ff7", "#8dff9e"];
  for (let i = 0; i < 26; i++) {
    const piece = document.createElement("span");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1 + Math.random() * 1.2}s`;
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    box.appendChild(piece);
    setTimeout(() => piece.remove(), 2600);
  }
}

function init() {
  renderToday();
  renderBoxes();
  document.getElementById("drawAll").addEventListener("click", drawAll);
  document.getElementById("resetAll").addEventListener("click", resetAll);
}

// Run now if the DOM is already parsed (scripts are loaded dynamically),
// otherwise wait for it.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
