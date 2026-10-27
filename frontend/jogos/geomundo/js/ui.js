/* ============================================================
   GEO MUNDO — ui.js
   Funções responsáveis por atualizar o DOM.
   ============================================================ */

const el = (id) => document.getElementById(id);

function mostrarTela(nomeTela) {
  ["screen-menu", "screen-game"].forEach((id) => el(id).classList.add("hidden"));
  el(nomeTela).classList.remove("hidden");
  setView(nomeTela === "screen-game" ? "quiz" : "home");

  if (nomeTela === "screen-game" && typeof geoMap !== "undefined" && geoMap) {
    geoMap.invalidateSize();
  }
}

function fecharOverlays() {
  ["overlay-result", "overlay-gameover", "overlay-vitoria", "overlay-salvar"].forEach((id) =>
    el(id).classList.add("hidden")
  );
}

function renderizarRanking(containerId, ranking, nomeDestaque) {
  const container = el(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (!ranking || ranking.length === 0) {
    container.innerHTML = '<div class="ranking-empty">Nenhuma partida registrada ainda. Jogue para entrar no ranking!</div>';
    return;
  }

  ranking.forEach((entrada, i) => {
    const row = document.createElement("div");
    row.className = "ranking-row" + (nomeDestaque && entrada.nome === nomeDestaque && i === 0 ? " destaque" : "");
    row.innerHTML = `
      <span class="ranking-pos">${i + 1}°</span>
      <span class="ranking-nome">${escapeAtlas(entrada.nome)}</span>
      <span class="ranking-xp">${entrada.xp} XP</span>
    `;
    container.appendChild(row);
  });
}

function atualizarRankingGlobal() {
  const ranking = carregarRanking();
  renderizarRanking("ranking-list", ranking);
  renderizarRanking("go-ranking-list", ranking);
}

// HEADER SIMPLIFICADA
function atualizarHudJogo(progress, regiao) {
  // Nome do jogador
  el("hud-nome").textContent = progress.nome;
  
  // Nível
  const nivelTexto = "Nível " + progress.nivel + (regiao.nomeNivel ? " · " + regiao.nomeNivel : "");
  el("hud-nivel").textContent = nivelTexto;
  
  // XP
  el("hud-xp").textContent = progress.xp + " XP";
  el("mundoEtapa").textContent = `Etapa ${regiao.nivel} de ${REGIOES.length} · ${regiao.nome}`;
  el("mundoAcertosNivel").textContent = `${estado.acertosNoNivel} de ${PERGUNTAS_POR_NIVEL} acertos`;
  el("mundoEtapaFill").style.width = `${estado.acertosNoNivel / PERGUNTAS_POR_NIVEL * 100}%`;
  el("mundoHudAvatar").src = `assets/personagens/${personagemMundo}_2.webp`;
}

function renderizarPergunta(pergunta) {
  el("question-text").textContent = pergunta.pergunta;
  el("question-text").focus({preventScroll:true});
  el("hint-box-wrap").innerHTML = "";

  const letras = ["A", "B", "C", "D"];
  const container = el("answers");
  container.innerHTML = "";

  pergunta.alternativas.forEach((texto, i) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.dataset.index = i;
    btn.innerHTML = `<span class="answer-letter">${letras[i]}</span><span>${texto}</span>`;
    container.appendChild(btn);
  });
}

function marcarRespostaSelecionada(index) {
  document.querySelectorAll(".answer-btn").forEach((btn) => {
    btn.classList.toggle("selected", Number(btn.dataset.index) === index);
  });
}

function revelarResposta(indexCorreta, indexEscolhida) {
  document.querySelectorAll(".answer-btn").forEach((btn) => {
    const i = Number(btn.dataset.index);
    btn.disabled = true;
    if (i === indexCorreta) btn.classList.add("correct");
    else if (i === indexEscolhida) btn.classList.add("wrong");
  });
}

function renderizarVidas(vidasAtuais, vidasMax) {
  const container = el("lives");
  container.setAttribute("aria-label", `${vidasAtuais} vidas`);
  container.innerHTML = "";
  for (let i = 0; i < vidasMax; i++) {
    const span = document.createElement("span");
    span.className = "life" + (i >= vidasAtuais ? " lost" : "");
    span.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 21 3 12C-3 5 6-2 12 5c6-7 15 0 9 7Z"/></svg>';
    container.appendChild(span);
  }
}

function atualizarStreakUI(streak) {
  el("streak-value").textContent = streak;
}

function mostrarDica(texto) {
  const wrap = el("hint-box-wrap");
  const box = document.createElement("div");
  box.className = "hint-box";
  box.textContent = texto;
  wrap.appendChild(box);
}

function mostrarResultado({ acertou, pergunta, xpGanho, progress, regiaoNome }) {
  const panel = el("result-panel");
  panel.className = "result-panel " + (acertou ? "correct" : "wrong");

  el("result-icon").textContent = acertou ? "✓" : "×";
  el("result-icon").className = "result-icon " + (acertou ? "correct" : "wrong");
  el("result-title").textContent = acertou ? "Boa descoberta!" : "Vamos aprender?";
  el("result-title").className = "result-title " + (acertou ? "correct" : "wrong");

  if (acertou) {
    el("result-desc").innerHTML = `Parabéns! A resposta certa era <strong>${pergunta.alternativas[pergunta.resposta]}</strong>.`;
  } else {
    el("result-desc").innerHTML = `A resposta correta é <strong>${pergunta.alternativas[pergunta.resposta]}</strong>.`;
  }

  el("result-xp").textContent = (xpGanho >= 0 ? "+" : "") + xpGanho + " XP";
  el("result-xp").className = "result-xp " + (acertou ? "correct" : "wrong");

  el("status-xp").textContent = progress.xp;
  el("status-streak").textContent = progress.streakAtual;
  el("status-nivel").textContent = progress.nivel;
  el("status-regiao").textContent = regiaoNome;
  el("status-paises").textContent = progress.paisesDescobertos.length;

  document.querySelectorAll(".status-row").forEach((row) => row.classList.remove("correct", "wrong"));

  el("mundoFeedbackAvatar").src = acertou ? `assets/celebracao/${personagemMundo}.webp` : `assets/personagens/${personagemMundo}_3.webp`;
  el("overlay-result").classList.remove("hidden");
  el("btn-continuar").focus({preventScroll:true});
}

function atualizarContador(valor) {
  el("countdown-ring").textContent = valor;
}

function mostrarGameOver(stats, ranking) {
  el("go-precisao").textContent = `${stats.perguntasRespondidas ? Math.round(stats.acertos / stats.perguntasRespondidas * 100) : 0}%`;
  el("mundoFimAvatar").src = `assets/personagens/${personagemMundo}_2.webp`;
  el("go-nome").textContent = stats.nome + ", sua jornada terminou";
  el("go-xp").textContent = stats.xp;
  el("go-respondidas").textContent = stats.perguntasRespondidas;
  el("go-acertos").textContent = stats.acertos;
  el("go-erros").textContent = stats.erros;
  el("go-streak").textContent = stats.maiorSequencia;
  renderizarRanking("go-ranking-list", ranking || carregarRanking(), stats.nome);
  el("overlay-gameover").classList.remove("hidden");
  el("screen-game").classList.add("hidden");setView("result");
  el("go-paises").textContent = stats.paisesDescobertos.length;
  el("worldOverTitle").focus({preventScroll:true});
}

function mostrarVitoria({ regiaoNome, xpGanho, acertos, total }) {
  el("mundoVitoriaAvatar").src = `assets/celebracao/${personagemMundo}.webp`;
  const index = estado.regiaoAtualIndex;
  el("mundoVitoriaTitulo").textContent = index === REGIOES.length - 1 ? "Jornada concluída!" : `${regiaoNome} concluída!`;
  el("mundoProximaEtapa").textContent = REGIOES[index + 1] ? `Próxima etapa: ${REGIOES[index + 1].nome}` : "Você completou as sete etapas desta jornada.";
  el("btn-proximo-nivel").textContent = index === REGIOES.length - 1 ? "Concluir jornada →" : "Próxima etapa →";
  const journey = el("mundoJourney"); journey.replaceChildren();
  REGIOES.forEach((region, i) => {
    const li = document.createElement("li"); li.className = i <= index ? "complete" : i === index + 1 ? "next" : "";
    const number = document.createElement("strong"); number.textContent = String(i + 1);
    const name = document.createElement("span"); name.textContent = region.nome;
    li.append(number, name); journey.append(li);
  });
  el("vitoria-regiao").textContent = regiaoNome;
  el("vitoria-xp").textContent = "+" + xpGanho + " XP";
  el("vitoria-acertos").textContent = acertos + "/" + total;
  el("overlay-vitoria").classList.remove("hidden");
  el("screen-game").classList.add("hidden");setView("result");
  el("mundoVitoriaTitulo").focus({preventScroll:true});
}

function renderizarPainelExploracao(nome, dados) {
  const mapColumn = document.querySelector(".map-column");
  let painel = document.getElementById("explore-panel");
  if (painel) painel.remove();

  painel = document.createElement("div");
  painel.id = "explore-panel";
  painel.className = "explore-panel";
  painel.innerHTML = `
    <div class="explore-flag">${dados.bandeira}</div>
    <div class="explore-name">${nome.toUpperCase()}</div>
    <div class="explore-row"><span>Continente</span><span>${dados.continente}</span></div>
    <div class="explore-row"><span>Capital</span><span>${dados.capital}</span></div>
    <div class="explore-row"><span>Idioma</span><span>${dados.idioma}</span></div>
    <div class="explore-row"><span>Moeda</span><span>${dados.moeda}</span></div>
    <button class="btn btn-primary" id="btn-desafiar-pais" style="width:100%; margin-top:6px;">DESAFIAR ESTE PAÍS</button>
  `;
  mapColumn.appendChild(painel);
  return painel;
}