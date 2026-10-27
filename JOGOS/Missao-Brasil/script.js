"use strict";

// Keep the existing storage keys, XP curve, scoring and geographic dataset.
const patentes = [
  "EXPLORADOR",
  "CONHECEDOR",
  "ESPECIALISTA",
  "CARTÓGRAFO",
  "MESTRE DO BRASIL",
];
const xpThresholds = [0, 30, 100, 220, 420];
const personagens = [
  { id: "classic", nome: "Clássico", detalhe: "Seu primeiro companheiro" },
  { id: "escot", nome: "Explorador", detalhe: "Pronto para descobrir" },
  { id: "bone", nome: "Boné", detalhe: "Aventura no seu ritmo" },
  { id: "brasa", nome: "Brasa", detalhe: "O Brasil no coração" },
  { id: "maloka", nome: "Maloka", detalhe: "Estilo em cada missão" },
  { id: "terno", nome: "Agente", detalhe: "Uma missão especial" },
];
const conquistas = [
  {
    id: "firstHit",
    title: "Primeiro acerto",
    desc: "Acertar sua primeira pergunta",
  },
  {
    id: "fiveCombo",
    title: "Sequência de 5",
    desc: "Acertar 5 perguntas seguidas",
  },
  {
    id: "northComplete",
    title: "Região Norte",
    desc: "Descobrir os 7 estados do Norte",
    regiao: "Norte",
  },
  {
    id: "northeastComplete",
    title: "Região Nordeste",
    desc: "Descobrir os 9 estados do Nordeste",
    regiao: "Nordeste",
  },
  {
    id: "centerwestComplete",
    title: "Centro-Oeste",
    desc: "Descobrir os 3 estados e o Distrito Federal",
    regiao: "Centro-Oeste",
  },
  {
    id: "southeastComplete",
    title: "Sudeste",
    desc: "Descobrir os 4 estados do Sudeste",
    regiao: "Sudeste",
  },
  {
    id: "southComplete",
    title: "Sul",
    desc: "Descobrir os 3 estados do Sul",
    regiao: "Sul",
  },
  {
    id: "allFlags",
    title: "Coleção completa",
    desc: "Descobrir os 26 estados e o Distrito Federal",
  },
];
const modes = {
  bandeiras: {
    nome: "Bandeiras",
    descricao: "Reconheça bandeiras e descubra o Brasil.",
    categoria: "OLHE COM ATENÇÃO",
  },
  capitais: {
    nome: "Capitais",
    descricao: "Conecte cada estado à sua capital.",
    categoria: "CONECTE OS DESTINOS",
  },
  biomas: {
    nome: "Biomas",
    descricao: "Explore as paisagens e a diversidade do Brasil.",
    categoria: "DESCUBRA A NATUREZA",
  },
};
const $ = (id) => document.getElementById(id);
const personagemSrc = (id, expressao = 2) =>
  `assets/personagens/${id}_${expressao}.webp`;
const validCharacter = (id) =>
  personagens.some((personagem) => personagem.id === id);
const number = (value) =>
  Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
const freshPlayer = () => ({
  nome: "",
  serie: "",
  personagem: "classic",
  xp: 0,
  totalCorrect: 0,
  unlockedStates: Array(27).fill(false),
  levelIndex: 0,
  maxCombo: 0,
  modoAtual: "bandeiras",
  achievements: Object.fromEntries(conquistas.map((c) => [c.id, false])),
});
let player = freshPlayer();
let ranking = [];
let activeScreen = "telaInicial";
let editingProfile = false;
let toastTimeout;
let storageUnavailable = false;
let audioContext;
let preferences = { som: false, movimento: true };
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let albumPage = 0;
let achievementsPage = 0;
let layoutFrame;
let gameSession = {
  currentIndex: 0,
  shuffledIndices: [],
  score: 0,
  combo: 0,
  sessionMaxCombo: 0,
  answered: false,
  currentCorrect: "",
  modoJogo: "bandeiras",
  regionFilter: "all",
  tempoQuestao: 5,
  tempoRestante: 5,
  timerInterval: null,
  autoNextTimeout: null,
  startedAt: 0,
  xpStart: 0,
  deadline: 0,
};

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    if (!storageUnavailable)
      toast(
        "O navegador não permitiu salvar os dados. Seu progresso ficará disponível durante esta visita.",
      );
    storageUnavailable = true;
  }
}
function salvarLocal() {
  writeStorage("missaoBrasil_neo", {
    nome: player.nome,
    serie: player.serie,
    personagem: player.personagem,
    xp: player.xp,
    totalCorrect: player.totalCorrect,
    unlocked: player.unlockedStates,
    levelIdx: player.levelIndex,
    maxCombo: player.maxCombo,
    modoAtual: player.modoAtual,
    achievements: player.achievements,
  });
}
function carregarLocal() {
  const saved = readStorage("missaoBrasil_neo", {});
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    player.nome = typeof saved.nome === "string" ? saved.nome.slice(0, 30) : "";
    player.serie = typeof saved.serie === "string" ? saved.serie : "";
    player.personagem = validCharacter(saved.personagem)
      ? saved.personagem
      : "classic";
    player.xp = number(saved.xp);
    player.totalCorrect = number(saved.totalCorrect);
    player.maxCombo = number(saved.maxCombo);
    player.modoAtual = Object.hasOwn(modes, saved.modoAtual)
      ? saved.modoAtual
      : "bandeiras";
    player.unlockedStates = Array.from({ length: 27 }, (_, index) =>
      Boolean(Array.isArray(saved.unlocked) && saved.unlocked[index]),
    );
    for (const achievement of conquistas)
      player.achievements[achievement.id] = Boolean(
        saved.achievements?.[achievement.id],
      );
  }
  atualizarPatente();
  const savedRanking = readStorage("missaoBrasil_ranking", []);
  ranking = (Array.isArray(savedRanking) ? savedRanking : [])
    .filter(
      (item) =>
        item &&
        typeof item.nome === "string" &&
        item.nome.trim() &&
        !["undefined", "EXPLORADOR"].includes(item.nome),
    )
    .map((item) => ({
      nome: item.nome.slice(0, 30),
      serie: typeof item.serie === "string" ? item.serie : "",
      xp: number(item.xp),
      patente: typeof item.patente === "string" ? item.patente : patentes[0],
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);
  const savedPreferences = readStorage("missaoBrasil_preferences", {});
  preferences.som = savedPreferences?.som === true;
  preferences.movimento = savedPreferences?.movimento !== false;
}
function atualizarPatente() {
  player.levelIndex = xpThresholds.findLastIndex(
    (threshold) => player.xp >= threshold,
  );
}
function adicionarOuAtualizarRanking() {
  if (!player.nome) return;
  const item = {
    nome: player.nome,
    serie: player.serie,
    xp: player.xp,
    patente: patentes[player.levelIndex],
  };
  const index = ranking.findIndex(
    (p) => p.nome === player.nome && p.serie === player.serie,
  );
  if (index >= 0) ranking[index] = item;
  else ranking.push(item);
  ranking.sort((a, b) => b.xp - a.xp);
  ranking = ranking.slice(0, 5);
  writeStorage("missaoBrasil_ranking", ranking);
  atualizarRankingUI();
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function atualizarRankingUI() {
  for (const id of ["rankingList", "rankingFullList"]) {
    const list = $(id);
    list.replaceChildren();
    if (!ranking.length) {
      list.append(
        element(
          "p",
          "ranking-empty",
          "Sua jornada pode começar este ranking. Vamos explorar?",
        ),
      );
      continue;
    }
    const visible = id === "rankingList" ? ranking.slice(0, 1) : ranking;
    visible.forEach((item, index) => {
      const row = element("div", "ranking-item");
      row.append(
        element("span", "ranking-pos", String(index + 1).padStart(2, "0")),
        element("strong", "ranking-nome", item.nome),
        element("span", "ranking-serie", item.serie),
        element("span", "ranking-xp", `${item.xp} XP`),
      );
      list.append(row);
    });
  }
}
function atualizarUI() {
  const discovered = player.unlockedStates.filter(Boolean).length;
  $("homeMascot").src = `assets/celebracao/${player.personagem}.webp`;
  $("nivelJogador").textContent = patentes[player.levelIndex];
  $("totalXP").textContent = player.xp;
  $("totalAcertos").textContent = player.totalCorrect;
  $("maxCombo").textContent = player.maxCombo;
  const count = player.unlockedStates.filter(Boolean).length;
  $("bandeirasDesbloqueadas").textContent = `${count}/27`;
  $("albumCount").textContent = `${count}/27`;
  $("profileName").textContent = player.nome || "Seu perfil de explorador";
  $("profileAvatar").src = personagemSrc(player.personagem);
  $("quizNome").textContent = player.nome;
  $("quizMode").textContent = modes[player.modoAtual].nome;
  const current = xpThresholds[player.levelIndex];
  const next = xpThresholds[player.levelIndex + 1];
  $("barraXP").style.width = next
    ? `${Math.min(100, ((player.xp - current) / (next - current)) * 100)}%`
    : "100%";
  $("xpTexto").textContent = next
    ? `${player.xp - current} / ${next - current} XP`
    : `${player.xp} XP`;
  $("proximoNivel").textContent = next
    ? `PRÓXIMO: ${patentes[player.levelIndex + 1]}`
    : "MESTRE DO BRASIL";
}
function atualizarModoUI() {
  document.querySelectorAll(".neo-btn-modo").forEach((button) => {
    const selected = button.dataset.modo === player.modoAtual;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const biomas = player.modoAtual === "biomas";
  $("containerFiltro").classList.toggle("hidden", biomas);
  $("biomaNote").classList.toggle("hidden", !biomas);
  const region = biomas ? "all" : $("filtroRegiao").value;
  const count =
    region === "all"
      ? 27
      : estadosAPI.filter((state) => state.regiao === region).length;
  $("missionMeta").replaceChildren(
    document.createTextNode(`${count} perguntas `),
    element("span", "", "·"),
    document.createTextNode(" 5 segundos por resposta"),
  );
  $("setupSummary").textContent =
    `${modes[player.modoAtual].nome} · ${region === "all" ? "Todas as regiões" : region}`;
}
function mostrarTela(id, focus = true) {
  document.querySelectorAll(".screen").forEach((screen) => {
    const active = screen.id === id;
    screen.hidden = !active;
    screen.classList.toggle("active", active);
  });
  activeScreen = id;
  document.body.dataset.screen = id;
  $("optionsMenu").open = false;
  $("btnComoJogar").hidden = id === "telaJogo";
  updateMotion();
  if (focus) {
    window.scrollTo({ top: 0, behavior: "instant" });
    $(id).querySelector("h1")?.focus({ preventScroll: true });
    if (motionEnabled() && window.gsap)
      gsap.fromTo(
        $(id),
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.28,
          clearProps: "all",
          overwrite: true,
        },
      );
  }
}
function toast(message) {
  clearTimeout(toastTimeout);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimeout = setTimeout(() => {
    $("toast").hidden = true;
  }, 4200);
}
function openDialog(id) {
  const dialog = $(id);
  if (!dialog.open) dialog.showModal();
  updateMotion();
}
function closeDialog(dialog) {
  dialog.close();
  updateMotion();
}

// The six original mascot PNGs stay intact; expression 2 is the resting state.
function criarPersonagens() {
  const grid = $("characterGrid");
  personagens.forEach((character) => {
    const label = element("label", "character-option");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "personagem";
    radio.value = character.id;
    radio.id = `personagem-${character.id}`;
    radio.addEventListener("change", () => atualizarPreviewPersonagem(character.id));
    const img = document.createElement("img");
    img.src = personagemSrc(character.id);
    img.alt = "";
    img.width = 111;
    img.height = 111;
    const check = element("span", "selection-check", "✓");
    check.setAttribute("aria-hidden", "true");
    label.append(
      radio,
      check,
      img,
      element("strong", "", character.nome),
      element("small", "", character.detalhe),
    );
    grid.append(label);
  });
}
function atualizarPreviewPersonagem(id) {
  const character = personagens.find(item => item.id === id);
  $("characterGrid").setAttribute("aria-label", `Avatar selecionado: ${character?.nome || "Clássico"}`);
}
function abrirPersonagem(edit = false) {
  atualizarPreviewPersonagem(player.personagem);
  stopTimers();
  editingProfile = edit;
  $("alunoNome").value = player.nome;
  $("alunoNome").removeAttribute("aria-invalid");
  $("nomeErro").textContent = "";
  $(`personagem-${player.personagem}`).checked = true;
  $("btnComecar").replaceChildren(
    document.createTextNode(edit ? "Salvar perfil" : "Jogar"),
    element("span", "", "→"),
  );
  atualizarModoUI();
  if (edit) $("setupSummary").textContent = "Seu companheiro, sua jornada";
  mostrarTela("telaPersonagem");
}
function salvarAluno(event) {
  event.preventDefault();
  const nome = $("alunoNome").value.trim();
  if (!nome) {
    $("nomeErro").textContent = "Digite seu nome para continuar.";
    $("alunoNome").setAttribute("aria-invalid", "true");
    $("alunoNome").focus();
    return;
  }
  player.nome = nome.slice(0, 30);
  player.personagem =
    document.querySelector('input[name="personagem"]:checked')?.value ||
    "classic";
  salvarLocal();
  atualizarUI();
  if (editingProfile) {
    voltarMenu();
    toast("Seu perfil foi atualizado.");
  } else iniciarJogo();
}
function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function obterPergunta(index) {
  const state = estadosAPI[index];
  if (gameSession.modoJogo === "bandeiras")
    return {
      texto: "De qual estado é esta bandeira?",
      correta: state.name,
      imagem: state.flag_url,
      tipo: "bandeira",
    };
  if (gameSession.modoJogo === "capitais")
    return {
      texto: `Qual é a capital de ${state.name}?`,
      correta: state.capital,
      imagem: state.flag_url,
      tipo: "capital",
    };
  return {
    texto: `Qual é o bioma principal de ${state.name}?`,
    correta: state.bioma,
    imagem: state.bioma_img,
    tipo: "bioma",
  };
}
function obterAlternativas(correct, type) {
  const values =
    type === "bioma"
      ? biomasList
      : estadosAPI.map((state) =>
          type === "bandeira" ? state.name : state.capital,
        );
  const other = embaralhar(
    [...new Set(values)].filter((value) => value !== correct),
  ).slice(0, 3);
  return embaralhar([correct, ...other]);
}
function stopTimers() {
  clearInterval(gameSession.timerInterval);
  clearTimeout(gameSession.autoNextTimeout);
  gameSession.timerInterval = null;
  gameSession.autoNextTimeout = null;
}
function iniciarJogo() {
  stopTimers();
  gameSession = {
    ...gameSession,
    modoJogo: player.modoAtual,
    regionFilter:
      player.modoAtual === "biomas" ? "all" : $("filtroRegiao").value,
    currentIndex: 0,
    score: 0,
    combo: 0,
    sessionMaxCombo: 0,
    answered: false,
    startedAt: Date.now(),
    xpStart: player.xp,
  };
  gameSession.shuffledIndices = embaralhar(
    estadosAPI
      .map((_, i) => i)
      .filter(
        (i) =>
          gameSession.regionFilter === "all" ||
          estadosAPI[i].regiao === gameSession.regionFilter,
      ),
  );
  atualizarUI();
  mostrarTela("telaJogo", false);
  renderizarPergunta();
}
function atualizarTimer() {
  gameSession.tempoRestante = Math.max(
    0,
    Math.ceil((gameSession.deadline - performance.now()) / 1000),
  );
  $("timerSegundos").textContent = gameSession.tempoRestante;
  document
    .querySelector(".timer")
    .classList.toggle(
      "urgent",
      gameSession.tempoRestante <= 2 && !gameSession.answered,
    );
  if (gameSession.tempoRestante === 0 && !gameSession.answered)
    processarResposta(null);
}
function renderizarPergunta() {
  stopTimers();
  const question = obterPergunta(
    gameSession.shuffledIndices[gameSession.currentIndex],
  );
  gameSession.currentCorrect = question.correta;
  gameSession.answered = false;
  $("perguntaTexto").textContent = question.texto;
  $("questionCategory").textContent = modes[gameSession.modoJogo].categoria;
  $("quizAvatar").src = personagemSrc(player.personagem);
  $("quizAvatar").alt = "";
  const frame = $("containerImagem");
  frame.classList.toggle("bioma", question.tipo === "bioma");
  const img = document.createElement("img");
  img.id = "bandeiraImg";
  img.src = question.imagem;
  // Neutral alternative text must not disclose the answer.
  img.alt =
    question.tipo === "bioma"
      ? "Paisagem do bioma desta pergunta"
      : "Bandeira do estado desta pergunta";
  img.addEventListener(
    "error",
    () => {
      frame.replaceChildren(
        element(
          "p",
          "image-unavailable",
          "Não foi possível carregar esta imagem. Saia da missão e tente novamente.",
        ),
      );
      // An unavailable question is skipped without awarding XP or counting an error.
      if (!gameSession.answered && activeScreen === "telaJogo") {
        stopTimers();
        gameSession.answered = true;
        $("areaFeedback").textContent =
          "Imagem indisponível. Avance para continuar.";
        $("btnProxima").hidden = false;
        document.querySelectorAll(".answer-button").forEach((button) => {
          button.disabled = true;
        });
      }
    },
    { once: true },
  );
  frame.replaceChildren(img);
  $("containerAlternativas").replaceChildren();
  obterAlternativas(question.correta, question.tipo).forEach(
    (answer, index) => {
      const button = element("button", "answer-button");
      button.type = "button";
      button.dataset.resposta = answer;
      const letter = element("span", "answer-letter", "ABCD"[index]);
      letter.setAttribute("aria-hidden", "true");
      button.append(letter, element("span", "answer-text", answer));
      button.addEventListener("click", () => processarResposta(answer));
      $("containerAlternativas").append(button);
    },
  );
  $("areaFeedback").classList.remove("incorrect");
  $("areaFeedback").replaceChildren(
    element("p", "answer-hint", "Escolha uma das quatro alternativas."),
  );
  $("feedbackAvatar").hidden = true;
  $("btnProxima").hidden = true;
  $("btnProxima").replaceChildren(
    document.createTextNode(
      gameSession.currentIndex === gameSession.shuffledIndices.length - 1
        ? "Resultado"
        : "Próxima",
    ),
    element("span", "", "→"),
  );
  $("progressoAtual").textContent = gameSession.currentIndex + 1;
  $("totalPerguntas").textContent = gameSession.shuffledIndices.length;
  $("pontuacaoAtual").textContent = gameSession.score / 10;
  $("comboAtual").textContent = gameSession.combo;
  $("questionProgressFill").style.width =
    `${((gameSession.currentIndex + 1) / gameSession.shuffledIndices.length) * 100}%`;
  $("questionProgress").setAttribute(
    "aria-valuemax",
    gameSession.shuffledIndices.length,
  );
  $("questionProgress").setAttribute(
    "aria-valuenow",
    gameSession.currentIndex + 1,
  );
  window.scrollTo({ top: 0, behavior: "instant" });
  $("perguntaTexto").focus({ preventScroll: true });
  gameSession.deadline = performance.now() + gameSession.tempoQuestao * 1000;
  atualizarTimer();
  gameSession.timerInterval = setInterval(atualizarTimer, 100);
}
function verificarConquistas() {
  const newlyUnlocked = [];
  for (const achievement of conquistas) {
    const earned =
      achievement.id === "firstHit"
        ? player.totalCorrect >= 1
        : achievement.id === "fiveCombo"
          ? gameSession.sessionMaxCombo >= 5
          : achievement.id === "allFlags"
            ? player.unlockedStates.every(Boolean)
            : estadosAPI.every(
                (state, index) =>
                  state.regiao !== achievement.regiao ||
                  player.unlockedStates[index],
              );
    if (earned && !player.achievements[achievement.id]) {
      player.achievements[achievement.id] = true;
      newlyUnlocked.push(achievement.title);
    }
  }
  return newlyUnlocked;
}
function processarResposta(selected) {
  if (gameSession.answered || activeScreen !== "telaJogo") return;
  // A click arriving after the deadline is a timeout, even in a throttled tab.
  if (performance.now() >= gameSession.deadline) selected = null;
  stopTimers();
  gameSession.answered = true;
  const index = gameSession.shuffledIndices[gameSession.currentIndex];
  const state = estadosAPI[index];
  const correct = selected === gameSession.currentCorrect;
  document.querySelectorAll(".answer-button").forEach((button) => {
    button.disabled = true;
    const isCorrect = button.dataset.resposta === gameSession.currentCorrect;
    const isWrong = button.dataset.resposta === selected && !isCorrect;
    button.classList.toggle("correct", isCorrect);
    button.classList.toggle("wrong", isWrong);
    if (isCorrect || isWrong) {
      button.append(element("span", "answer-mark", isCorrect ? "✓" : "×"));
      button.setAttribute(
        "aria-label",
        `${button.dataset.resposta}, ${isCorrect ? "resposta correta" : "resposta incorreta"}`,
      );
    }
  });
  const previousLevel = player.levelIndex;
  $("feedbackAvatar").hidden = false;
  $("feedbackAvatar").src = correct ? `assets/celebracao/${player.personagem}.webp` : personagemSrc(player.personagem, selected === null ? 4 : 3);
  let xp;
  if (correct) {
    gameSession.combo++;
    gameSession.sessionMaxCombo = Math.max(
      gameSession.sessionMaxCombo,
      gameSession.combo,
    );
    player.maxCombo = Math.max(player.maxCombo, gameSession.sessionMaxCombo);
    xp = 10 + Math.min(gameSession.combo * 2, 18);
    gameSession.score += 10;
    player.totalCorrect++;
    player.unlockedStates[index] = true;
  } else {
    gameSession.combo = 0;
    xp = 2;
  }
  player.xp += xp;
  atualizarPatente();
  const achievements = verificarConquistas();
  const feedback = $("areaFeedback");
  feedback.classList.toggle("incorrect", !correct);
  const title = correct
    ? "Boa descoberta!"
    : selected === null
      ? "O tempo acabou. Vamos aprender?"
      : "Mais uma chance de aprender.";
  const description = correct
    ? `${state.name} está na sua coleção.`
    : `A resposta é ${gameSession.currentCorrect}. ${state.curiosidade}`;
  feedback.replaceChildren(
    element("strong", "", title),
    element("p", "", description),
    element("span", "xp-gain", `+${xp} XP`),
  );
  if (achievements.length || player.levelIndex > previousLevel) {
    const message = [
      ...(achievements.length > 1
        ? [`${achievements.length} novas conquistas desbloqueadas`]
        : achievements.map((name) => `Conquista: ${name}`)),
      ...(player.levelIndex > previousLevel
        ? [`Novo nível: ${patentes[player.levelIndex]}`]
        : []),
    ].join(" · ");
    feedback.append(element("p", "achievement-feedback", message));
  }
  $("quizAvatar").src = personagemSrc(
    player.personagem,
    correct ? 1 : selected === null ? 4 : 3,
  );
  $("quizAvatar").alt = correct
    ? "Seu mascote comemora o acerto"
    : "Seu mascote acompanha a resposta";
  $("pontuacaoAtual").textContent = gameSession.score / 10;
  $("comboAtual").textContent = gameSession.combo;
  document.querySelector(".timer").classList.remove("urgent");
  atualizarUI();
  salvarLocal();
  adicionarOuAtualizarRanking();
  playFeedback(correct);
  $("btnProxima").hidden = false;
  $("btnProxima").focus({ preventScroll: true });
  gameSession.autoNextTimeout = setTimeout(proximaPergunta, 5000);
}
function proximaPergunta() {
  if (!gameSession.answered || activeScreen !== "telaJogo") return;
  stopTimers();
  if (gameSession.currentIndex + 1 < gameSession.shuffledIndices.length) {
    gameSession.currentIndex++;
    renderizarPergunta();
  } else mostrarResultadoFinal();
}
function mostrarResultadoFinal() {
  stopTimers();
  const hits = gameSession.score / 10;
  const total = gameSession.shuffledIndices.length;
  const seconds = Math.floor((Date.now() - gameSession.startedAt) / 1000);
  $("finalAcertos").textContent = hits;
  $("finalTotal").textContent = `/${total}`;
  $("finalPrecisao").textContent = Math.round((hits / total) * 100);
  $("finalTempo").textContent =
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  $("finalPatente").textContent = patentes[player.levelIndex];
  $("finalMaxCombo").textContent = gameSession.sessionMaxCombo;
  $("sessionXP").textContent = player.xp - gameSession.xpStart;
  $("resultAvatar").src = `assets/celebracao/${player.personagem}.webp`;
  $("resultMessage").textContent =
    hits === total
      ? "Você conheceu cada destino desta missão. Que tal explorar mais?"
      : "Cada resposta é um novo passo pelo Brasil. Continue explorando!";
  mostrarTela("telaResultado");
}
function voltarMenu() {
  stopTimers();
  atualizarUI();
  atualizarRankingUI();
  atualizarModoUI();
  mostrarTela("telaInicial");
}
function abrirAlbum() {
  stopTimers();
  albumPage = 0;
  mostrarTela("telaAlbum");
  atualizarAlbumUI();
}
function atualizarAlbumUI() {
  const list = $("listaAlbum");
  list.replaceChildren();
  const columns = getComputedStyle(list).gridTemplateColumns.split(" ").length;
  const rows = Math.max(
    1,
    Math.min(3, Math.floor((list.clientHeight + 10) / 104)),
  );
  const size = columns * rows;
  const pages = Math.ceil(estadosAPI.length / size);
  albumPage = Math.min(albumPage, pages - 1);
  list.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
  $("albumPagina").textContent = `${albumPage + 1} / ${pages} · 27 destinos`;
  $("albumAnterior").disabled = albumPage === 0;
  $("albumProximo").disabled = albumPage === pages - 1;
  estadosAPI
    .slice(albumPage * size, (albumPage + 1) * size)
    .forEach((state, offset) => {
      const index = albumPage * size + offset;
      const unlocked = player.unlockedStates[index];
      const card = element("button", `state-card${unlocked ? "" : " locked"}`);
      const img = document.createElement("img");
      img.src = state.flag_url;
      img.alt = "";
      img.loading = "lazy";
      card.append(
        img,
        element("strong", "", state.name),
        element("small", "", state.regiao),
        element(
          "span",
          "lock-label",
          unlocked ? "Descoberto ↗" : "A descobrir",
        ),
      );
      card.addEventListener("click", () => {
        if (!unlocked) {
          toast(
            `Acerte uma pergunta sobre ${state.name} para revelar este destino.`,
          );
          return;
        }
        $("modalNomeEstado").textContent = state.name;
        $("modalBandeira").src = state.flag_url;
        $("modalBandeira").alt = `Bandeira de ${state.name}`;
        $("modalCapital").textContent = state.capital;
        $("modalRegiao").textContent = state.regiao;
        $("modalBioma").textContent = state.bioma;
        $("modalCuriosidade").textContent = state.curiosidade;
        openDialog("modalEstado");
      });
      list.append(card);
    });
  $("albumPatente").textContent = patentes[player.levelIndex];
}
function abrirConquistas() {
  const list = $("listaConquistas");
  list.replaceChildren();
  conquistas
    .slice(achievementsPage * 4, (achievementsPage + 1) * 4)
    .forEach((achievement) => {
      const unlocked = player.achievements[achievement.id];
      const item = element(
        "div",
        `achievement-item${unlocked ? "" : " locked"}`,
      );
      const info = element("div", "achievement-info");
      info.append(
        element(
          "div",
          "achievement-title",
          `${achievement.title}${unlocked ? " · Conquistada" : ""}`,
        ),
        element("div", "achievement-desc", achievement.desc),
      );
      item.append(
        element("span", "achievement-icon", unlocked ? "✓" : "○"),
        info,
      );
      list.append(item);
    });
  $("conquistasPagina").textContent = `${achievementsPage + 1} / 2`;
  $("conquistasAnterior").disabled = achievementsPage === 0;
  $("conquistasProximo").disabled = achievementsPage === 1;
  openDialog("modalConquistas");
}
function resetarProgresso() {
  player = {
    ...freshPlayer(),
    nome: player.nome,
    serie: player.serie,
    personagem: player.personagem,
  };
  salvarLocal();
  adicionarOuAtualizarRanking();
  atualizarUI();
  atualizarModoUI();
  closeDialog($("modalReset"));
  toast("Progresso reiniciado. Uma nova jornada começa aqui.");
}

// GSAP drives only decoration. The game remains usable without it.
function motionEnabled() {
  return preferences.movimento && !reducedMotion.matches;
}
function resizeLayout() {
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(() => {
    if (activeScreen === "telaAlbum") atualizarAlbumUI();
  });
}
function updateMotion() {
  const enabled = motionEnabled();
  document.body.classList.toggle("motion-paused", !enabled);
  $("btnMovimento").setAttribute("aria-pressed", String(enabled));
  $("btnMovimento").setAttribute("aria-label", enabled ? "Pausar animações" : "Ativar animações");
  $("btnMovimento").querySelector("path").setAttribute("d", enabled ? "M9 5v14M15 5v14" : "m8 5 11 7-11 7V5");
}
function updateSound() {
  $("btnSom").setAttribute("aria-pressed", String(preferences.som));
  $("btnSom").setAttribute(
    "aria-label",
    preferences.som ? "Desativar som" : "Ativar som",
  );
  $("somEstado").textContent = preferences.som ? "on" : "off";
}
function playFeedback(correct) {
  if (!preferences.som) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audioContext ||= new Audio();
    if (audioContext.state === "suspended") audioContext.resume();
    const time = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(correct ? 520 : 240, time);
    oscillator.frequency.exponentialRampToValueAtTime(
      correct ? 780 : 180,
      time + 0.12,
    );
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.06, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.21);
  } catch {
    /* Sound is optional, even when an audio device is unavailable. */
  }
}

$("brandHome").addEventListener("click", (event) => {
  event.preventDefault();
  voltarMenu();
});
$("btnIniciarJogo").addEventListener("click", () => abrirPersonagem());
$("formPersonagem").addEventListener("submit", salvarAluno);
$("alunoNome").addEventListener("input", () => {
  $("alunoNome").removeAttribute("aria-invalid");
  $("nomeErro").textContent = "";
});
$("btnVoltarPersonagem").addEventListener("click", voltarMenu);
$("btnVoltarMenu").addEventListener("click", voltarMenu);
$("btnProxima").addEventListener("click", proximaPergunta);
$("btnJogarNovamente").addEventListener("click", iniciarJogo);
$("btnResultadoInicio").addEventListener("click", voltarMenu);
$("btnAbrirAlbum").addEventListener("click", abrirAlbum);
$("btnVerAlbum").addEventListener("click", abrirAlbum);
$("btnFecharAlbum").addEventListener("click", voltarMenu);
$("btnComoJogar").addEventListener("click", () => openDialog("modalAjuda"));
$("optionsMenu").addEventListener("click", (event) => {
  if (event.target.closest("button")) $("optionsMenu").open = false;
});
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest("#optionsMenu")) $("optionsMenu").open = false;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $("optionsMenu").open) {
    $("optionsMenu").open = false;
    $("optionsMenu").querySelector("summary").focus();
  }
});
$("btnProgresso").addEventListener("click", () => {
  atualizarUI();
  openDialog("modalProgresso");
});
$("btnTrocarNome").addEventListener("click", () => {
  closeDialog($("modalProgresso"));
  abrirPersonagem(true);
});
$("btnAbrirConquistas").addEventListener("click", () => {
  closeDialog($("modalProgresso"));
  abrirConquistas();
});
$("btnResetarProgresso").addEventListener("click", () => {
  closeDialog($("modalProgresso"));
  openDialog("modalReset");
});
$("btnConfirmarReset").addEventListener("click", resetarProgresso);
$("btnVerRanking").addEventListener("click", () => {
  atualizarRankingUI();
  openDialog("modalRanking");
});
$("albumAnterior").addEventListener("click", () => {
  albumPage--;
  atualizarAlbumUI();
});
$("albumProximo").addEventListener("click", () => {
  albumPage++;
  atualizarAlbumUI();
});
$("conquistasAnterior").addEventListener("click", () => {
  achievementsPage = 0;
  abrirConquistas();
});
$("conquistasProximo").addEventListener("click", () => {
  achievementsPage = 1;
  abrirConquistas();
});
$("btnResetarRanking").addEventListener("click", () => {
  closeDialog($("modalRanking"));
  $("senhaResetRanking").value = "";
  $("rankingErro").textContent = "";
  openDialog("modalResetRanking");
});
$("formResetRanking").addEventListener("submit", (event) => {
  event.preventDefault();
  // Compatibility with the existing teacher gate; this is a local ranking only.
  if (!["professor", "admin", "1234"].includes($("senhaResetRanking").value)) {
    $("rankingErro").textContent = "Senha incorreta. Tente novamente.";
    $("senhaResetRanking").focus();
    return;
  }
  ranking = [];
  writeStorage("missaoBrasil_ranking", ranking);
  atualizarRankingUI();
  closeDialog($("modalResetRanking"));
  toast("Ranking deste navegador limpo.");
});
document.querySelectorAll(".neo-btn-modo").forEach((button) =>
  button.addEventListener("click", () => {
    player.modoAtual = button.dataset.modo;
    salvarLocal();
    atualizarModoUI();
  }),
);
$("filtroRegiao").addEventListener("change", atualizarModoUI);
$("btnSom").addEventListener("click", () => {
  preferences.som = !preferences.som;
  updateSound();
  writeStorage("missaoBrasil_preferences", preferences);
  if (preferences.som) playFeedback(true);
});
$("btnMovimento").addEventListener("click", () => {
  if (reducedMotion.matches) {
    toast(
      "As animações estão reduzidas pela preferência de acessibilidade do dispositivo.",
    );
    return;
  }
  preferences.movimento = !preferences.movimento;
  writeStorage("missaoBrasil_preferences", preferences);
  updateMotion();
});
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog
    .querySelectorAll("[data-close]")
    .forEach((button) =>
      button.addEventListener("click", () => closeDialog(dialog)),
    );
  dialog.addEventListener("close", updateMotion);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        closeDialog(dialog);
    }
  });
});
window.addEventListener("resize", resizeLayout);
window.visualViewport?.addEventListener("resize", resizeLayout);
new ResizeObserver(resizeLayout).observe($("listaAlbum"));
document.addEventListener("visibilitychange", updateMotion);
reducedMotion.addEventListener("change", updateMotion);
carregarLocal();
criarPersonagens();
atualizarModoUI();
atualizarUI();
atualizarRankingUI();
updateMotion();
updateSound();
// Preload local question images; the five-second timer shouldn't wait on a network.
[
  ...new Set(estadosAPI.flatMap((state) => [state.flag_url, state.bioma_img])),
].forEach((src) => {
  const img = new Image();
  img.src = src;
});
