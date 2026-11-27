(() => {
  "use strict";
  const rios = window.HidroRios;
  const el = (id) => document.getElementById(id);
  const telas = { inicio: el("inicio"), partida: el("partida"), resultado: el("resultado") };
  const estado = { acertos: 0, respondida: false, concluida: false, atual: null, opcoes: [], escolha: null, nivel: 1, tempoAcumulado: 0, iniciouEm: 0, timer: null, fila: { 1: [], 2: [], 3: [] }, anterior: { 1: null, 2: null, 3: null }, historico: [] };
  const embaralhar = (itens) => {
    const copia = [...itens];
    for (let i = copia.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copia[i], copia[j]] = [copia[j], copia[i]]; }
    return copia;
  };
  const nivelPara = (n) => n < 2 ? 1 : n < 4 ? 2 : 3;
  const segundos = () => Math.floor(estado.tempoAcumulado / 1000);
  const formatarTempo = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  const tituloNivel = (n) => ["", "fácil", "médio", "desafio"][n];
  function mostrarTela(nome) {
    Object.entries(telas).forEach(([k, tela]) => { tela.hidden = k !== nome; });
    document.body.dataset.screen = nome;
  }
  function iniciarRelogio() {
    estado.iniciouEm = performance.now();
    clearInterval(estado.timer);
    estado.timer = window.setInterval(() => {
      if (!estado.respondida && !estado.concluida) el("tempo").textContent = formatarTempo(segundos() + Math.floor((performance.now() - estado.iniciouEm) / 1000));
    }, 250);
  }
  function pausarRelogio() {
    if (estado.iniciouEm) estado.tempoAcumulado += performance.now() - estado.iniciouEm;
    estado.iniciouEm = 0;
    el("tempo").textContent = formatarTempo(segundos());
  }
  function selecionarRio(nivel) {
    if (!estado.fila[nivel].length) {
      estado.fila[nivel] = embaralhar(rios);
      if (estado.fila[nivel].length > 1 && estado.fila[nivel][0].id === estado.anterior[nivel]) estado.fila[nivel].push(estado.fila[nivel].shift());
    }
    const rio = estado.fila[nivel].shift();
    estado.anterior[nivel] = rio.id;
    return rio;
  }
  function obterOpcoes(nivel, rio) {
    if (nivel === 3) return embaralhar([rio, ...embaralhar(rios.filter((r) => r.id !== rio.id)).slice(0, 3)]).map((r) => ({ texto: r.nome, rio: r, correta: r.id === rio.id }));
    const distratores = embaralhar(rios.filter((r) => r.id !== rio.id)).slice(0, nivel);
    return embaralhar([rio, ...distratores].map((r) => ({ texto: r[nivel === 1 ? "facil" : "medio"], rio: r, correta: r.id === rio.id })));
  }
  function desenharEtapas() {
    estado.nivel = nivelPara(estado.acertos);
    for (let n = 1; n <= 3; n++) {
      const li = el("etapa-" + n);
      li.removeAttribute("aria-current");
      li.classList.toggle("completa", n < estado.nivel);
      if (n === estado.nivel) li.setAttribute("aria-current", "step");
    }
    el("acertos").innerHTML = estado.acertos + " <small>de 5</small>";
    el("placar").innerHTML = (estado.acertos * 10) + " <small>de 50 pontos</small>";
  }
  function novaPergunta() {
    if (estado.acertos >= 5) return finalizar();
    estado.respondida = false;
    estado.nivel = nivelPara(estado.acertos);
    estado.atual = selecionarRio(estado.nivel);
    estado.opcoes = obterOpcoes(estado.nivel, estado.atual);
    estado.escolha = null;
    desenharEtapas();
    el("rodada-numero").textContent = "Pergunta " + (estado.acertos + 1) + " de 5";
    el("numero-opcoes").textContent = estado.opcoes.length + " alternativas";
    el("rio-rotulo").textContent = estado.nivel === 3 ? "Pista do rio" : "Rio em destaque";
    el("rio-titulo").textContent = estado.nivel === 3 ? "Descubra o rio" : estado.atual.nome;
    el("rio-titulo").classList.toggle("titulo-desafio", estado.nivel === 3);
    el("rio-pista").textContent = estado.nivel === 3 ? estado.atual.medio : (estado.nivel === 2 ? "Leia a pista com atenção e escolha a característica correta." : "");
    el("pergunta").textContent = estado.nivel === 3 ? "Qual rio corresponde à pista?" : "Qual característica corresponde a este rio?";
    el("dica-area").hidden = estado.nivel === 3;
    el("dica").hidden = true;
    el("dica").textContent = estado.atual.dica;
    el("ver-dica").setAttribute("aria-expanded", "false");
    el("ver-dica").textContent = "Ver uma dica";
    const grupo = el("opcoes");
    grupo.replaceChildren();
    estado.opcoes.forEach((opcao, i) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "opcao"; button.dataset.index = String(i);
      const letra = document.createElement("span"); letra.className = "letra"; letra.setAttribute("aria-hidden", "true"); letra.textContent = String.fromCharCode(65 + i);
      const texto = document.createElement("span"); texto.textContent = opcao.texto;
      button.append(letra, texto);
      button.addEventListener("click", () => responder(i));
      grupo.append(button);
    });
    el("feedback-area").hidden = true;
    iniciarRelogio();
  }
  function responder(indice) {
    if (estado.respondida || estado.concluida) return;
    pausarRelogio();
    estado.respondida = true;
    estado.escolha = estado.opcoes[indice];
    const acertou = estado.escolha.correta;
    if (acertou) estado.acertos++;
    estado.historico.push({ rio: estado.atual, nivel: estado.nivel, escolha: estado.escolha.texto, acertou });
    [...el("opcoes").querySelectorAll("button")].forEach((button, i) => {
      button.disabled = true;
      if (estado.opcoes[i].correta) button.classList.add("correta");
      if (i === indice && !acertou) button.classList.add("errada");
    });
    if (estado.nivel === 3) el("rio-titulo").textContent = estado.atual.nome;
    el("feedback").textContent = acertou ? "Acertou! +10 pontos" : "Ainda não. Vamos aprender com a pista.";
    el("feedback").className = acertou ? "certo" : "erro";
    el("explicacao").textContent = estado.atual.resumo;
    if (!acertou) el("mensagem-nivel").textContent = "A dificuldade continua no nível " + tituloNivel(estado.nivel) + ". Tente outra pista.";
    else if (estado.acertos === 2) el("mensagem-nivel").textContent = "Boa! Agora as perguntas ficam um pouco mais desafiadoras.";
    else if (estado.acertos === 4) el("mensagem-nivel").textContent = "Você chegou ao desafio final: descubra o nome do rio.";
    else if (estado.acertos === 5) el("mensagem-nivel").textContent = "Você completou as cinco etapas. Seu resultado está pronto.";
    else el("mensagem-nivel").textContent = "Mais um passo na sua viagem pelas águas do Brasil.";
    el("proximo").textContent = estado.acertos >= 5 ? "Ver resultado" : "Próximo rio";
    el("feedback-area").hidden = false;
    desenharEtapas();
  }
  function nomeJogador() {
    for (const key of ["geoeduca_user", "geoeduca_usuario", "user", "nome", "usuario"]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try { const value = JSON.parse(raw); const name = typeof value === "string" ? value : value.nome || value.name || value.usuario; if (name) return String(name); }
      catch { if (raw.length < 100) return raw; }
    }
    return "Explorador(a)";
  }
  function salvarResultado(tempo) {
    const resultado = { gameId: 6, nome: nomeJogador(), sala: localStorage.getItem("geoeduca_sala") || localStorage.getItem("sala") || "", pontuacao: estado.acertos * 10, tempo: tempo, data: new Date().toISOString(), pct: estado.acertos * 20 };
    try {
      const lista = JSON.parse(localStorage.getItem("geoeduca_results") || "[]");
      if (!Array.isArray(lista)) throw new Error("Formato de ranking inesperado");
      lista.push(resultado); localStorage.setItem("geoeduca_results", JSON.stringify(lista)); el("aviso-salvar").hidden = true;
    } catch (error) { console.warn("Não foi possível salvar o resultado no navegador.", error); el("aviso-salvar").hidden = false; }
  }
  function finalizar() {
    if (estado.concluida) return;
    if (estado.iniciouEm) pausarRelogio();
    estado.concluida = true; clearInterval(estado.timer);
    const tempo = formatarTempo(segundos());
    el("pontos-final").textContent = String(estado.acertos * 10);
    el("acertos-final").textContent = String(estado.acertos);
    el("tempo-final").textContent = tempo;
    const erros = estado.historico.filter((item) => !item.acertou).length;
    el("resumo-final").textContent = erros ? "Você respondeu " + estado.historico.length + " perguntas, acertou " + estado.acertos + " e revisou " + erros + " pista" + (erros === 1 ? "" : "s") + " pelo caminho." : "Cinco acertos e uma grande viagem pelas águas brasileiras.";
    salvarResultado(tempo); mostrarTela("resultado");
  }
  function abrirRevisao() {
    const mapa = new Map();
    estado.historico.forEach((item) => {
      const antigo = mapa.get(item.rio.id) || { rio: item.rio, acertou: false, tentativas: 0 };
      antigo.tentativas++; if (item.acertou) antigo.acertou = true; mapa.set(item.rio.id, antigo);
    });
    const itens = [...mapa.values()].sort((a, b) => Number(a.acertou) - Number(b.acertou));
    el("resumo-revisao").textContent = itens.length + " rio" + (itens.length === 1 ? "" : "s") + " apareceu" + (itens.length === 1 ? "" : "ram") + " na sua viagem. Os que tiveram erro ficam primeiro.";
    const lista = el("lista-revisao"); lista.replaceChildren();
    itens.forEach(({ rio, acertou, tentativas }) => {
      const li = document.createElement("li"); li.className = acertou ? "aprendido" : "rever";
      const title = document.createElement("strong"); title.textContent = rio.nome + (acertou ? " — aprendido" : " — para rever");
      const p = document.createElement("p"); p.textContent = rio.resumo + (tentativas > 1 ? " Você encontrou esta pista " + tentativas + " vezes." : "");
      li.append(title, p); lista.append(li);
    });
    el("revisao").showModal();
  }
  function reiniciar() {
    clearInterval(estado.timer);
    estado.acertos = 0; estado.respondida = false; estado.concluida = false; estado.atual = null; estado.opcoes = []; estado.escolha = null; estado.nivel = 1; estado.tempoAcumulado = 0; estado.iniciouEm = 0;
    estado.fila = { 1: [], 2: [], 3: [] }; estado.anterior = { 1: null, 2: null, 3: null }; estado.historico = [];
    el("tempo").textContent = "00:00"; mostrarTela("partida"); novaPergunta();
  }
  el("iniciar").addEventListener("click", reiniciar);
  el("proximo").addEventListener("click", () => { if (estado.acertos >= 5) finalizar(); else novaPergunta(); });
  el("ver-dica").addEventListener("click", () => {
    const aberta = el("ver-dica").getAttribute("aria-expanded") === "true";
    el("ver-dica").setAttribute("aria-expanded", String(!aberta)); el("ver-dica").textContent = aberta ? "Ver uma dica" : "Esconder dica"; el("dica").hidden = aberta;
  });
  el("repetir").addEventListener("click", reiniciar);
  el("revisar").addEventListener("click", abrirRevisao);
  el("fechar-revisao").addEventListener("click", () => el("revisao").close());
  el("revisao").addEventListener("click", (event) => { if (event.target === el("revisao")) el("revisao").close(); });
  window.addEventListener("pagehide", () => {
    if (!telas.partida.hidden && !estado.respondida && !estado.concluida) pausarRelogio();
    clearInterval(estado.timer);
  });
  window.addEventListener("pageshow", () => { if (!telas.partida.hidden && !estado.respondida && !estado.concluida) iniciarRelogio(); });
})();
