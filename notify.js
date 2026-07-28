"use strict";

const NTFY = CONFIG.ntfy;

// Publish a message to the ntfy topic (a push lands on the subscribed phone).
async function sendNotification(message) {
  const url = `${NTFY.server}/${NTFY.topic}`;
  const response = await fetch(url, {
    method: "POST",
    body: message,
    headers: {
      Title: NTFY.defaultTitle,
      Tags: "green_heart",
      Priority: "default",
    },
  });
  if (!response.ok) {
    throw new Error(`ntfy respondeu ${response.status}`);
  }
}

// Small transient feedback bubble.
function showToast(text, isError) {
  const toast = document.getElementById("notify-toast");
  toast.textContent = text;
  toast.className = `notify-toast show ${isError ? "error" : "ok"}`;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.className = "notify-toast";
  }, 3000);
}

async function handleSend(message, button) {
  if (!message || !message.trim()) return;
  const original = button ? button.textContent : null;
  if (button) {
    button.disabled = true;
  }
  try {
    await sendNotification(message.trim());
    showToast("Recadinho enviado! 💚", false);
  } catch (err) {
    showToast(`Ops, não rolou: ${err.message}`, true);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = original;
    }
  }
}

function renderNotify() {
  const panel = document.getElementById("notify");
  if (!panel || !NTFY) return;

  const quick = NTFY.quickMessages || [];
  const buttons = quick
    .map(
      (m, i) =>
        `<button class="notify-btn" data-index="${i}">${m.emoji} ${m.text}</button>`
    )
    .join("");

  panel.innerHTML = `
    <div class="notify-hero">🧑‍💻💚😎</div>
    <p class="notify-lead">Escolhe um recadinho ou escreve o seu:</p>
    <div class="notify-quick">${buttons}</div>
    <div class="notify-divider"><span>ou manda o seu</span></div>
    <div class="notify-custom">
      <input type="text" id="notify-input" placeholder="Escreve aqui..." maxlength="200" />
      <button class="btn btn-primary" id="notify-send">Enviar 💌</button>
    </div>
    <div class="notify-toast" id="notify-toast"></div>
  `;

  panel.querySelectorAll(".notify-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const msg = quick[Number(btn.dataset.index)].text;
      handleSend(msg, btn);
    });
  });

  const input = panel.querySelector("#notify-input");
  const sendBtn = panel.querySelector("#notify-send");
  sendBtn.addEventListener("click", () => {
    handleSend(input.value, sendBtn);
    input.value = "";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSend(input.value, sendBtn);
      input.value = "";
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderNotify);
} else {
  renderNotify();
}
