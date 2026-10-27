/* ============================================================
   GEO MUNDO — app.js
   Inicialização geral, navegação entre telas
   ============================================================ */

let bancoPaises = {};

async function init() {
  renderizarRanking("ranking-list", carregarRanking());

  let perguntasOk = true;
  try {
    await carregarPerguntas();
  } catch (err) {
    console.error("Erro ao carregar perguntas:", err);
    perguntasOk = false;
  }

  try {
    if (window.location?.protocol === "file:" && window.GEO_MUNDO_LOCAL) bancoPaises = window.GEO_MUNDO_LOCAL.countries;
    else { const resp = await fetch("data/countries.json"); bancoPaises = await resp.json(); }
  } catch (err) {
    console.error("Erro ao carregar países:", err);
  }

  if (!perguntasOk && window.GEO_MUNDO_LOCAL) { bancoPerguntas=window.GEO_MUNDO_LOCAL.questions;perguntasOk=true; }
  if (!Object.keys(bancoPaises).length && window.GEO_MUNDO_LOCAL) bancoPaises=window.GEO_MUNDO_LOCAL.countries;
  if (!perguntasOk) {
    el("btn-jogar").disabled=true;
    el("question-text").textContent =
      "Não foi possível carregar as perguntas. Rode o projeto com um servidor local.";
  }

  initMap();
  ligarEventos();
  updateRankingDisplay();
  el("btn-jogar").disabled = !perguntasOk;
}

function ligarEventos() {
  // Botão principal - INICIAR JOGO
  el("btn-jogar").addEventListener("click", () => {
    abrirModalNome((nome) => startGame(nome));
  });

  // COMO JOGAR
  el("btn-como-jogar").addEventListener("click", () => {
    document.getElementById("mundoHelp").showModal();
  });

  // Controles do jogo
  el("btn-continuar").addEventListener("click", () => nextQuestion());
  el("btn-hint").addEventListener("click", () => usarDica());

  el("btn-jogar-novamente").addEventListener("click", () => {
    fecharOverlays();
    abrirModalNome((nome) => startGame(nome));
  });

  // Ranking
  ligarBotaoLimparRanking("btn-limpar-ranking", "ranking-list");
  ligarBotaoLimparRanking("btn-limpar-ranking-go", "go-ranking-list");

  // Navegação
  el("btn-menu-principal").addEventListener("click", voltarAoMenu);
  el("btn-vitoria-menu").addEventListener("click", voltarAoMenu);
  el("btn-proximo-nivel").addEventListener("click", () => {
    fecharOverlays();
    goToNextLevel();
  });

  // Botão VOLTAR
  el("btn-voltar-menu").addEventListener("click", function() {
    if (estado.progress && estado.progress.perguntasRespondidas > 0) {
      abrirModalSalvar();
    } else {
      voltarAoMenu();
    }
  });

  // Botões do modal de salvar
  el("btn-salvar-sim").addEventListener("click", function() {
    salvarProgressoAtual();
    document.getElementById("overlay-salvar").classList.add("hidden");
    voltarAoMenu();
  });

  el("btn-salvar-nao").addEventListener("click", function() {
    document.getElementById("overlay-salvar").classList.add("hidden");
    voltarAoMenu();
  });
}

function ligarBotaoLimparRanking(botaoId, containerId) {
  const btn = el(botaoId);
  if (!btn) return;
  btn.addEventListener("click", () => {
    const confirmado = confirm("Tem certeza que deseja apagar todo o ranking? Essa ação não pode ser desfeita.");
    if (!confirmado) return;
    limparRanking();
    renderizarRanking(containerId, []);
    const outroContainer = containerId === "ranking-list" ? "go-ranking-list" : "ranking-list";
    if (el(outroContainer)) renderizarRanking(outroContainer, []);
  });
}

function abrirModalNome(callback) {
  const overlay = el("overlay-nome");
  const input = el("input-nome-jogador");
  input.value = "";
  el("mundoNomeErro").textContent = "";
  input.removeAttribute("aria-invalid");
  overlay.classList.remove("hidden");
  el("screen-menu").classList.add("hidden");el("screen-game").classList.add("hidden");
  setView("setup");
  input.focus();

  const confirmar = () => {
    if (!input.value.trim()) {
      el("mundoNomeErro").textContent = "Digite seu nome para continuar.";
      input.setAttribute("aria-invalid", "true"); input.focus(); return;
    }
    limpar(); overlay.classList.add("hidden"); input.removeAttribute("aria-invalid");
    el("mundoNomeErro").textContent = "";
    callback(input.value.trim());
  };
  const cancelar = () => {
    limpar();
    overlay.classList.add("hidden");
    mostrarTela("screen-menu");
  };
  const onEnter = (e) => {
    if (e.key === "Enter") confirmar();
  };

  function limpar() {
    el("btn-confirmar-nome").removeEventListener("click", confirmar);
    el("btn-cancelar-nome").removeEventListener("click", cancelar);
    input.removeEventListener("keydown", onEnter);
  }

  el("btn-confirmar-nome").addEventListener("click", confirmar);
  el("btn-cancelar-nome").addEventListener("click", cancelar);
  input.addEventListener("keydown", onEnter);
}

function abrirModalSalvar() {
  const xp = estado.progress ? estado.progress.xp : 0;
  document.getElementById("salvar-xp").textContent = xp;
  document.getElementById("overlay-salvar").classList.remove("hidden");
}

function salvarProgressoAtual() {
  if (estado.progress) {
    salvarSessaoMundo();
    updateRankingDisplay();
  }
}

function updateRankingDisplay() {
  const ranking = carregarRanking();
  renderizarRanking("ranking-list", ranking);
  renderizarRanking("go-ranking-list", ranking);
}

function voltarAoMenu() {
  clearInterval(estado.countdownTimer); clearTimeout(estado.autoAvancoTimer); clearTimeout(estado.answerDelay);
  estado.respondendo = false;
  fecharOverlays();
  const painel = document.getElementById("explore-panel");
  if (painel) painel.remove();
  updateRankingDisplay();
  mostrarTela("screen-menu");
}

document.addEventListener("DOMContentLoaded", init);