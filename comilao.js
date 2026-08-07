"use strict";

const GAME = CONFIG.game || {};
const FOODS = GAME.foods || ["🍖", "🍗", "🥩"];
const MAN_TRAPS = GAME.manTraps || ["🍆", "👨"]; // reserved for phase 2
const WOMAN_TRAPS = GAME.womanTraps || ["👩"]; // reserved for phase 2
const PINTO = GAME.trap || "🍆";
const DURATION = GAME.durationSec || 30;
const SPAWN_MS = GAME.spawnMs || 650;
const GOAL = GAME.goal || 60;
const FOOD_LIFETIME_MS = 2600;
const RECORD_KEY = "comilao_recorde";

// Difficulty ramp: the longer you play, the faster and trickier it gets.
const MIN_SPAWN_MS = 230;
const SPAWN_DECAY = 14; // ms shaved off the spawn interval per second played
const MIN_LIFETIME_MS = 1100;
const LIFETIME_DECAY = 45; // ms shaved off each food's lifetime per second
// Grace period at the start: only foods, no eggplant yet.
const TRAP_GRACE_SEC = 6;
// Phase 1: the eggplant becomes more and more common to bait a mistake.
const BASE_TRAP_CHANCE = 0.12;
const TRAP_GROWTH = 0.01;
const MAX_TRAP_CHANCE = 0.45;

let area, player, hudScore, hudTime, hudRecord, startBtn, hint;
let score = 0;
let timeLeft = DURATION;
let playing = false;
let px = 0;
let py = 0;
let startTime = 0;
const foods = [];
let spawnTimer = null;
let tickTimer = null;
let rafId = null;

function getRecord() {
  try {
    return Number(localStorage.getItem(RECORD_KEY) || "0");
  } catch (e) {
    return 0;
  }
}

function saveRecord(value) {
  try {
    localStorage.setItem(RECORD_KEY, String(value));
  } catch (e) {
    /* ignore */
  }
}

function renderHud() {
  hudScore.textContent = `${score} / ${GOAL}`;
  hudTime.textContent = String(Math.max(timeLeft, 0));
  hudRecord.textContent = String(getRecord());
}

function areaRect() {
  return area.getBoundingClientRect();
}

function movePlayer(clientX, clientY) {
  const rect = areaRect();
  px = Math.max(0, Math.min(clientX - rect.left, rect.width));
  py = Math.max(0, Math.min(clientY - rect.top, rect.height));
  player.style.left = `${px}px`;
  player.style.top = `${py}px`;
}

function onMouseMove(e) {
  movePlayer(e.clientX, e.clientY);
}

function onTouchMove(e) {
  if (!e.touches.length) return;
  e.preventDefault();
  movePlayer(e.touches[0].clientX, e.touches[0].clientY);
}

function elapsedSec() {
  return (performance.now() - startTime) / 1000;
}

function currentSpawnMs() {
  return Math.max(MIN_SPAWN_MS, SPAWN_MS - elapsedSec() * SPAWN_DECAY);
}

function currentLifetimeMs() {
  return Math.max(MIN_LIFETIME_MS, FOOD_LIFETIME_MS - elapsedSec() * LIFETIME_DECAY);
}

function trapChance() {
  const t = elapsedSec() - TRAP_GRACE_SEC;
  if (t < 0) return 0;
  return Math.min(MAX_TRAP_CHANCE, BASE_TRAP_CHANCE + t * TRAP_GROWTH);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function spawnFood() {
  const rect = areaRect();
  const pad = 40;
  const x = pad + Math.random() * (rect.width - pad * 2);
  const y = pad + Math.random() * (rect.height - pad * 2);

  const isTrap = Math.random() < trapChance();

  const el = document.createElement("span");
  el.className = isTrap ? "game-food game-trap" : "game-food";
  el.textContent = isTrap ? PINTO : pick(FOODS);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  area.appendChild(el);

  foods.push({
    el,
    x,
    y,
    kind: isTrap ? "man" : "food",
    pinto: true,
    dieAt: performance.now() + currentLifetimeMs(),
  });
}

function scheduleSpawn() {
  if (!playing) return;
  spawnFood();
  spawnTimer = setTimeout(scheduleSpawn, currentSpawnMs());
}

function eat(food, index) {
  food.el.classList.add("eaten");
  setTimeout(() => food.el.remove(), 180);
  foods.splice(index, 1);
  score += 1;
  renderHud();
  chomp();
  player.classList.remove("chomping");
  void player.offsetWidth; // restart animation
  player.classList.add("chomping");

  if (score >= GOAL) winPhase1();
}

function loop() {
  if (!playing) return;
  const now = performance.now();
  const threshold = player.offsetWidth / 2 + 22;

  for (let i = foods.length - 1; i >= 0; i--) {
    const food = foods[i];
    if (now > food.dieAt) {
      food.el.classList.add("gone");
      const el = food.el;
      setTimeout(() => el.remove(), 200);
      foods.splice(i, 1);
      continue;
    }
    const dx = food.x - px;
    const dy = food.y - py;
    if (Math.hypot(dx, dy) < threshold) {
      if (food.kind === "woman") {
        womanGameOver();
        return;
      }
      if (food.kind === "man") {
        manGameOver(food.pinto);
        return;
      }
      eat(food, i);
    }
  }
  rafId = requestAnimationFrame(loop);
}

function clearFoods() {
  foods.forEach((f) => f.el.remove());
  foods.length = 0;
}

function start() {
  if (playing) return;
  playing = true;
  score = 0;
  timeLeft = DURATION;
  clearFoods();
  renderHud();

  hint.style.display = "none";
  startBtn.style.display = "none";

  const rect = areaRect();
  px = rect.width / 2;
  py = rect.height / 2;
  player.style.left = `${px}px`;
  player.style.top = `${py}px`;

  startTime = performance.now();
  scheduleSpawn();
  tickTimer = setInterval(() => {
    timeLeft -= 1;
    renderHud();
    if (timeLeft <= 0) end();
  }, 1000);
  rafId = requestAnimationFrame(loop);
}

function stopEngine() {
  playing = false;
  clearTimeout(spawnTimer);
  clearInterval(tickTimer);
  cancelAnimationFrame(rafId);
}

function end() {
  stopEngine();
  clearFoods();

  const record = getRecord();
  const isRecord = score > record;
  if (isRecord) saveRecord(score);
  renderHud();

  showGameOver(score, isRecord);
}

function showGameOver(finalScore, isRecord) {
  const overlay = document.createElement("div");
  overlay.className = "gameover-overlay";
  overlay.innerHTML = `
    <div class="gameover-box">
      <div class="gameover-emoji">${isRecord ? "🏆" : "😋"}</div>
      <h2 class="gameover-title">${isRecord ? "NOVO RECORDE!" : "Fim!"}</h2>
      <p class="gameover-score">O Fabio comeu <b>${finalScore}</b> ${finalScore === 1 ? "comida" : "comidas"}!</p>
      <button class="btn btn-primary" id="gameover-again">Jogar de novo 😋</button>
    </div>
  `;
  area.appendChild(overlay);
  overlay.querySelector("#gameover-again").addEventListener("click", () => {
    overlay.remove();
    start();
  });
}

// Reaching the (nearly impossible) goal clears phase 1.
function winPhase1() {
  stopEngine();
  clearFoods();
  const isRecord = score > getRecord();
  if (isRecord) saveRecord(score);
  renderHud();

  const overlay = document.createElement("div");
  overlay.className = "gameover-overlay win";
  overlay.innerHTML = `
    <div class="gameover-box">
      <div class="gameover-emoji">🏆</div>
      <h2 class="gameover-title">FASE 1 COMPLETA!</h2>
      <p class="gameover-score">Inacreditável! O Fabio comeu <b>${GOAL}</b> sem escorregar na berinjela. 🍆🚫</p>
      <p class="gameover-note">Fase 2 em breve...</p>
      <button class="btn btn-primary" id="gameover-again">Jogar de novo 😋</button>
    </div>
  `;
  area.appendChild(overlay);
  overlay.querySelector("#gameover-again").addEventListener("click", () => {
    overlay.remove();
    start();
  });
}

// Eating a man/eggplant trap: Fabio's honor crashes the game.
function manGameOver(isPinto) {
  const lines = isPinto
    ? [
        "> FATAL: PintoError: objeto proibido ingerido 🍆",
        "> ERRO: o Fabio JAMAIS pegaria no pinto",
        "> validando a masculinidade ............ FALHOU",
        "> reality.integrity_check() ............ FALHOU",
        "> kernel panic - not syncing: pinto na boca do Fabio",
        "> tentando cuspir ..................... IMPOSSÍVEL",
        "> [CRÍTICO] honra do Fabio corrompida",
        "> desligando o jogo .................... ██████████ 100%",
      ]
    : [
        "> FATAL: HomemError: alvo masculino ingerido 👨",
        "> ERRO: o Fabio NÃO pega em homem",
        "> validando a masculinidade ............ FALHOU",
        "> reality.integrity_check() ............ FALHOU",
        "> kernel panic - not syncing: homem detectado",
        "> tentando cuspir ..................... IMPOSSÍVEL",
        "> [CRÍTICO] honra do Fabio corrompida",
        "> desligando o jogo .................... ██████████ 100%",
      ];
  runCrash({
    lines,
    endTitle: isPinto ? "O FABIO NÃO PEGA NO PINTO" : "O FABIO NÃO PEGA EM HOMEM",
    endSub: "Você perdeu. Isso ele JAMAIS comeria. 🚫",
  });
}

// Eating a woman trap: an absurd, reality-ending catastrophe.
function womanGameOver() {
  runCrash({
    lines: [
      "> FATAL: MulherError: paradoxo impossível 👩",
      "> ERRO: o Fabio olhou pra uma MULHER",
      "> checando as leis da natureza ......... VIOLADAS",
      "> [ERRO] causalidade perdida",
      "> [ERRO] gravidade retornou NaN",
      "> [CRÍTICO] o Sol começou a girar ao contrário",
      "> [CRÍTICO] os oceanos evaporaram",
      "> rasgando o tecido do espaço-tempo...",
      "> propagando o fim para todas as dimensões...",
      "> APAGANDO A REALIDADE ................. ██████████ 100%",
    ],
    endTitle: "O UNIVERSO ACABOU",
    endSub: "Fabio + mulher = fim de toda a existência. 🌍💥",
    mega: true,
  });
}

// Shared apocalyptic "fatal error" sequence, then reloads the page.
function runCrash({ lines, endTitle, endSub, mega }) {
  stopEngine();
  clearFoods();

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
    if (i < lines.length) {
      log.textContent += lines[i] + "\n";
      i += 1;
      return;
    }
    clearInterval(feed);
    crashApocalypse(overlay, endTitle, endSub, mega);
  }, mega ? 240 : 300);
}

function crashApocalypse(overlay, title, sub, mega) {
  overlay.classList.add("apocalypse");
  if (mega) overlay.classList.add("mega");
  const banner = document.createElement("div");
  banner.className = "crash-apocalypse";
  banner.innerHTML = `
    <div class="crash-end" data-text="${title}">${title}</div>
    <p class="crash-sub">${sub}</p>
    <p class="crash-reload">Reconstruindo a realidade em <span id="crash-count">3</span>...</p>
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

// Short "chomp" blip via WebAudio (best-effort).
function chomp() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!chomp._ctx) chomp._ctx = new AudioCtx();
    const audio = chomp._ctx;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "square";
    const t = audio.currentTime;
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.12);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  } catch (e) {
    /* ignore */
  }
}

function init() {
  area = document.getElementById("game-area");
  player = document.getElementById("player");
  hudScore = document.getElementById("score");
  hudTime = document.getElementById("time");
  hudRecord = document.getElementById("record");
  startBtn = document.getElementById("start");
  hint = document.getElementById("game-hint");

  player.src = GAME.sticker || "assets/fabio-sticker.png";
  renderHud();

  startBtn.addEventListener("click", start);
  area.addEventListener("mousemove", onMouseMove);
  area.addEventListener("touchmove", onTouchMove, { passive: false });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
