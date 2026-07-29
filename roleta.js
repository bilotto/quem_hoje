"use strict";

const CFG = CONFIG.roulette || {};
const WIN_CHANCE = typeof CFG.winChance === "number" ? CFG.winChance : 0.1;
const PRIZE = CFG.prize || "🎁 Prêmio";
const WIN_TITLE = CFG.winTitle || "VOCÊ GANHOU!";
const TRY_AGAIN = CFG.tryAgain || ["Tenta de novo!"];

const WHEEL_COLORS = ["#7b2ff7", "#ff6ec7", "#4dd0ff", "#ffd166", "#8dff9e", "#ff8d5c"];
const SEGMENTS = 8; // decorative only: the wheel is secret, no labels
const SPIN_DURATION_MS = 4200;
const TWO_PI = Math.PI * 2;
const SPINS_STORAGE_KEY = "roulette_spins";

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const size = canvas.width;
const center = size / 2;
const radius = center - 6;
const segAngle = TWO_PI / SEGMENTS;

let rotation = 0;
let spinning = false;

// Draw a mysterious wheel: colored segments with "?" instead of options.
function drawWheel(angle) {
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(angle);

  for (let i = 0; i < SEGMENTS; i++) {
    const start = i * segAngle;
    const end = start + segAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + segAngle / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(15,10,30,0.55)";
    ctx.font = "bold 22px Fredoka, sans-serif";
    ctx.fillText("?", radius - 18, 0);
    ctx.restore();
  }

  ctx.restore();

  // Hub in the center.
  ctx.beginPath();
  ctx.arc(center, center, 22, 0, TWO_PI);
  ctx.fillStyle = "#0f0a1e";
  ctx.fill();
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function easeOutCubic(p) {
  return 1 - Math.pow(1 - p, 3);
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getSpins() {
  try {
    return Number(localStorage.getItem(SPINS_STORAGE_KEY) || "0");
  } catch (e) {
    return 0;
  }
}

function addSpin() {
  const n = getSpins() + 1;
  try {
    localStorage.setItem(SPINS_STORAGE_KEY, String(n));
  } catch (e) {
    /* ignore */
  }
  return n;
}

function renderSpins() {
  const el = document.getElementById("roulette-spins");
  if (el) el.textContent = `Rodadas: ${getSpins()}`;
}

function spin() {
  if (spinning) return;
  spinning = true;

  const result = document.getElementById("roulette-result");
  result.className = "roulette-result";
  result.textContent = "🎡 girando...";

  // The landing angle is irrelevant (secret wheel); it's just for show.
  const fullTurns = (5 + Math.floor(Math.random() * 3)) * TWO_PI;
  const extra = Math.random() * TWO_PI;
  const startRotation = rotation;
  const finalRotation = rotation + fullTurns + extra;

  const won = Math.random() < WIN_CHANCE;

  const t0 = performance.now();
  function frame(now) {
    const p = Math.min((now - t0) / SPIN_DURATION_MS, 1);
    rotation = startRotation + (finalRotation - startRotation) * easeOutCubic(p);
    drawWheel(rotation);
    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      rotation = finalRotation % TWO_PI;
      spinning = false;
      addSpin();
      renderSpins();
      showResult(won);
    }
  }
  requestAnimationFrame(frame);
}

function showResult(won) {
  const result = document.getElementById("roulette-result");
  if (won) {
    result.className = "roulette-result win";
    result.textContent = `${WIN_TITLE} ${PRIZE}`;
    partyTime(PRIZE);
  } else {
    result.className = "roulette-result miss";
    result.textContent = pickRandom(TRY_AGAIN);
  }
}

// Full-screen celebration: rays, emoji rain, confetti bursts and a fanfare.
function partyTime(prize) {
  const existing = document.getElementById("party-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "party-overlay";
  overlay.className = "party-overlay";
  overlay.innerHTML = `
    <div class="party-rays" aria-hidden="true"></div>
    <div class="party-emoji" id="party-emoji" aria-hidden="true"></div>
    <div class="party-card">
      <div class="party-trophy">🏆</div>
      <h1 class="party-title">VOCÊ GANHOU!</h1>
      <p class="party-prize">${prize}</p>
      <button class="btn btn-primary" id="party-close">Aeee! 🎉</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const timers = [];
  const stop = () => {
    timers.forEach(clearInterval);
    overlay.remove();
  };
  overlay.querySelector("#party-close").addEventListener("click", stop);

  // Repeated confetti bursts.
  let bursts = 0;
  timers.push(
    setInterval(() => {
      burstConfetti();
      if (++bursts >= 8) timers.forEach(clearInterval);
    }, 420)
  );

  // Emoji rain.
  const rainBox = overlay.querySelector("#party-emoji");
  const emojis = ["🎉", "🎊", "🥳", "❤️", "🍽️", "😍", "🍷", "✨", "🎆", "💥"];
  const rain = setInterval(() => spawnEmoji(rainBox, emojis), 160);
  timers.push(rain);
  setTimeout(() => clearInterval(rain), 6500);

  playFanfare();
}

function spawnEmoji(box, emojis) {
  const span = document.createElement("span");
  span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  span.style.left = `${Math.random() * 100}%`;
  span.style.fontSize = `${1.4 + Math.random() * 1.8}rem`;
  span.style.animationDuration = `${2 + Math.random() * 2}s`;
  box.appendChild(span);
  setTimeout(() => span.remove(), 4200);
}

// Tiny ascending fanfare via WebAudio (best-effort; ignored if blocked).
function playFanfare() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audio = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = audio.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.42);
    });
  } catch (e) {
    /* audio not allowed: ignore */
  }
}

function burstConfetti() {
  const box = document.getElementById("confetti");
  if (!box) return;
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("span");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = WHEEL_COLORS[Math.floor(Math.random() * WHEEL_COLORS.length)];
    piece.style.animationDuration = `${1 + Math.random() * 1.2}s`;
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    box.appendChild(piece);
    setTimeout(() => piece.remove(), 2600);
  }
}

function init() {
  drawWheel(rotation);
  renderSpins();
  document.getElementById("spin").addEventListener("click", spin);
  canvas.addEventListener("click", spin);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
