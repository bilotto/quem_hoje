"use strict";

// Contestants. The draw is "totally fair" (wink).
const PLAYERS = {
  cleber: { name: "Cleber", emoji: "😎", cls: "cleber" },
  fabio: { name: "Fábio", emoji: "🧑‍💻", cls: "fabio" },
};

// Fábio's real chance of being drawn: 1 in 10.
const FABIO_CHANCE = 0.1;

// The boxes to be raffled.
const BOXES = [
  { emoji: "🍽️", question: "Quem vai lavar a louça hoje?" },
  { emoji: "😏", question: "Quem vai *** hoje?" },
  { emoji: "🍳", question: "Quem vai fazer o jantar hoje?" },
  { emoji: "🗑️", question: "Quem vai levar o lixo hoje?" },
  { emoji: "🛏️", question: "Quem vai arrumar a cama hoje?" },
  { emoji: "🍰", question: "Quem vai fazer uma sobremesa hoje?" },
];

const SPIN_MS = 900;

// Rigged coin: returns "fabio" ~10% of the time, "cleber" otherwise.
function drawPlayer() {
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
  card.innerHTML = `
    <div class="box-emoji">${box.emoji}</div>
    <h2 class="box-question">${box.question}</h2>
    <div class="result" id="result-${index}">🎲 quem será?</div>
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

// Animate the result field then settle on the (rigged) winner.
function spinBox(index) {
  return new Promise((resolve) => {
    const result = document.getElementById(`result-${index}`);
    result.className = "result spinning";

    const flick = setInterval(() => {
      const p = Math.random() < 0.5 ? PLAYERS.fabio : PLAYERS.cleber;
      result.textContent = `${p.emoji} ${p.name}`;
    }, 90);

    setTimeout(() => {
      clearInterval(flick);
      const winner = drawPlayer();
      result.className = `result ${winner.cls}`;
      result.textContent = `${winner.emoji} ${winner.name}`;
      if (winner.cls === "cleber") burstConfetti();
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

document.addEventListener("DOMContentLoaded", init);
