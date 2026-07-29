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
