"use strict";

/**
 * Central configuration for the whole app.
 * Edit everything here: players, odds, dashboard dates and the raffle boxes.
 * Both the Dashboard and the Raffle pages read from this single object.
 */
window.CONFIG = {
  // The two contestants.
  players: {
    cleber: { name: "Cleber", emoji: "😎", cls: "cleber" },
    fabio: { name: "Fabio", emoji: "🧑‍💻", cls: "fabio" },
  },

  // Fabio's chance of being drawn (0 to 1). 0.5 = totally fair.
  fabioChance: 0.5,

  // Important dates. Use the format "YYYY-MM-DD".
  dates: {
    // When you started dating.
    relationshipStart: "2026-05-20",

    // Your vacation together in November (adjust the exact day!).
    vacation: "2026-11-01",

    // Cleber's weekend off: works 2 weekends, then 1 off (a 3-week cycle).
    // `referenceSaturday` is any known Saturday he had off.
    cleberFolga: {
      referenceSaturday: "2026-07-25",
      periodDays: 21,
    },
  },

  // Open to-dos shown on the dashboard. Set `done: true` to check one off.
  pendings: [
    { who: "Fabio", text: "Confirmar as férias", done: false },
  ],

  // Interactive family photo. Hotspots use x/y as % of the image
  // (x from the left, y from the top). Tweak them to fine-tune positions.
  photo: {
    src: "assets/familia.png",
    caption: "Toque em cada um pra ver quem é 👇",
    hotspots: [
      { label: "Fabio", emoji: "🧑‍💻", x: 37, y: 40, cls: "fabio" },
      { label: "Cleber", emoji: "😎", x: 74, y: 38, cls: "cleber" },
      { label: "Fifi", emoji: "🐱", x: 36, y: 64, cls: "" },
      { label: "Joio", emoji: "🐈", x: 58, y: 64, cls: "" },
    ],
  },

  // Default mood for each person (used until they change it on the site;
  // their choice is then saved in the browser).
  feelings: {
    cleber: { emoji: "😐", mood: "Meio normal" },
    fabio: { emoji: "😐", mood: "Meio normal" },
  },

  // Mood options offered when someone taps their card to change it.
  moodOptions: [
    { emoji: "😐", mood: "Meio normal" },
    { emoji: "🥰", mood: "Apaixonado" },
    { emoji: "🥳", mood: "Animado" },
    { emoji: "😴", mood: "Com sono" },
    { emoji: "🍔", mood: "Com fome" },
    { emoji: "🤢", mood: "Meio enjoado" },
    { emoji: "😤", mood: "Estressado" },
    { emoji: "😔", mood: "Pra baixo" },
    { emoji: "🧟", mood: "Morto" },
    { emoji: "😏", mood: "Safado" },
  ],

  // The couple's favorites. Add as many as you want.
  favorites: [
    { emoji: "🍛", label: "Comida favorita", value: "Baião de dois" },
    { emoji: "🐉", label: "Série favorita", value: "Game of Thrones" },
  ],

  // Secret wheel (Roleta): it never shows the options. Each spin has a low
  // chance to win the prize; otherwise it shows a "keep trying" message.
  roulette: {
    // Chance of winning on each spin (0 to 1). Low on purpose.
    winChance: 0.05,
    prize: "🍽️ Escolher qualquer restaurante em São Paulo pra eu te levar pra jantar hoje!",
    winTitle: "VOCÊ GANHOU! 🎉",
    // Shown when the spin doesn't win (picked at random).
    tryAgain: [
      "Quase! Tenta de novo 👀",
      "Não foi dessa vez... 🌀",
      "Roda mais uma!",
      "Tá esquentando... 🔥",
      "Continua tentando 😏",
      "Hmm... de novo!",
    ],
  },

  // Push notifications via ntfy.sh.
  // 1) Install the "ntfy" app on your phone.
  // 2) Subscribe to the SAME topic below (pick a hard-to-guess name!).
  // 3) When Cleber taps a button, you get a push on your phone.
  ntfy: {
    server: "https://ntfy.sh",
    topic: "clebinho_jr",
    defaultTitle: "Um corvo do Cleber 🐦‍⬛",
    // One-tap preset messages ("corvos").
    quickMessages: [
      { emoji: "❤️", text: "Te amo!" },
      { emoji: "🥺", text: "Tô com saudade..." },
      { emoji: "😮‍💨", text: "Tô cansado" },
      { emoji: "🧟", text: "Tô morto" },
      { emoji: "🍔", text: "Tô com fome" },
      { emoji: "📞", text: "Me liga quando puder" },
      { emoji: "🏠", text: "Chega logo em casa!" },
      { emoji: "😏", text: "Tem surpresa te esperando 😏" },
      {
        emoji: "🚿",
        text: "Faz a chuca 😏",
        // This one never sends: it triggers a (fake) fatal error instead.
        fatal: {
          title: "ERRO FATAL",
          message: "Fábio é macho. Fábio JAMAIS faz a chuca.",
        },
      },
    ],
  },

  // The raffle boxes.
  // Each box may have an optional `extra` that raffles a second detail
  // (a dish, a position, a genre...). Just edit the `options` lists.
  boxes: [
    { emoji: "🍽️", question: "Quem vai lavar a louça hoje?" },
    {
      emoji: "😏",
      question: "Quem vai *** hoje?",
      // Fábio is a top: this one is always Cleber.
      forceWinner: "cleber",
      extra: {
        label: "Posição",
        emoji: "🔥",
        options: ["Papai-e-mamãe", "De ladinho", "Cachorrinho", "Sentado", "De pé", "Surpresa 😏"],
      },
    },
    {
      emoji: "🍳",
      question: "Quem vai fazer o jantar hoje?",
      extra: {
        label: "Prato",
        emoji: "🍝",
        options: ["Macarrão", "Pizza", "Hambúrguer", "Strogonoff", "Sushi", "Risoto", "Comida japonesa"],
      },
    },
    { emoji: "🗑️", question: "Quem vai levar o lixo hoje?" },
    { emoji: "🛏️", question: "Quem vai arrumar a cama hoje?" },
    {
      emoji: "🍰",
      question: "Quem vai fazer uma sobremesa hoje?",
      extra: {
        label: "Sobremesa",
        emoji: "🧁",
        options: ["Brigadeiro", "Pudim", "Mousse de chocolate", "Sorvete", "Bolo", "Petit gâteau"],
      },
    },
  ],
};
