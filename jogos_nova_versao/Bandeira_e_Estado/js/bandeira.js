(() => {
  const porId = id => document.getElementById(id);
  const abertura = porId('abertura');
  const partida = porId('partida');
  const resultado = porId('resultado');
  const jogo = porId('game-container');
  const revisao = porId('revisao');
  const meta = 60;
  const valorAcerto = 10;
  // Pistas adaptadas do atlas do GeoBR. Capitais, nomes e regiões vêm do motor original.
  const pistas = {
    AC: 'Sua capital é Rio Branco, no oeste da Amazônia brasileira.',
    AL: 'Abriga as lagoas Mundaú e Manguaba e as praias de Maragogi.',
    AP: 'A Linha do Equador passa por sua capital, Macapá.',
    AM: 'É o maior estado do Brasil em área. Lá acontece o Encontro das Águas.',
    BA: 'O acarajé é tradicional em Salvador, a primeira capital do Brasil.',
    CE: 'As dunas e praias de Jericoacoara ficam neste estado do Nordeste.',
    DF: 'Abriga Brasília, a sede do governo federal.',
    ES: 'Abriga o Convento da Penha e as praias de Guarapari.',
    GO: 'As águas termais de Caldas Novas ficam neste estado do Centro-Oeste.',
    MA: 'Dunas e lagoas de água doce formam a paisagem de um de seus parques nacionais.',
    MT: 'Tem Cuiabá como capital e abriga parte do Pantanal.',
    MS: 'É onde fica Bonito, conhecido pelos rios de águas transparentes.',
    MG: 'O pão de queijo é um clássico deste estado, cuja capital é Belo Horizonte.',
    PA: 'O mercado Ver-o-Peso e o Círio de Nazaré são referências de sua capital.',
    PB: 'A Ponta do Seixas fica em João Pessoa, capital deste estado.',
    PR: 'Abriga as Cataratas do Iguaçu, na fronteira com a Argentina.',
    PE: 'O frevo é uma tradição do Carnaval em Recife e Olinda.',
    PI: 'Abriga o Parque Nacional da Serra da Capivara, conhecido pelas pinturas rupestres.',
    RJ: 'O Cristo Redentor fica na capital deste estado.',
    RN: 'Abriga as dunas de Genipabu e o cajueiro de Pirangi.',
    RS: 'A cultura gaúcha tem forte presença neste estado, que faz fronteira com o Uruguai.',
    RO: 'A Estrada de Ferro Madeira-Mamoré tem origem em sua capital, Porto Velho.',
    RR: 'É o estado brasileiro na tríplice fronteira com a Venezuela e a Guiana.',
    SC: 'A Oktoberfest de Blumenau acontece neste estado do Sul.',
    SP: 'Abriga a cidade mais populosa do Brasil e o Parque Ibirapuera.',
    SE: 'É o menor dos 26 estados brasileiros em área.',
    TO: 'É o estado mais novo do país, criado pela Constituição de 1988.'
  };
  const estadosVistos = new Map();
  let fila = [];
  let acertos = 0;
  let tentativas = 0;
  let tempoAtivo = 0;

  function embaralhar(lista) {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  function mostrar(tela) {
    abertura.hidden = tela !== 'telaInicial';
    partida.hidden = tela !== 'telaJogo';
    resultado.hidden = tela !== 'telaResultado';
    document.body.dataset.screen = tela;
    window.scrollTo(0, 0);
  }

  function atualizarPlacar() {
    porId('placar').textContent = currentScore;
    porId('questionProgressFill').style.width = (currentScore / meta * 100) + '%';
  }

  function bandeira(estado) {
    return '../assets/flags/' + estado.sigla.toLowerCase() + '.svg';
  }

  function preencherRevisao() {
    const lista = porId('lista-revisao');
    lista.replaceChildren();
    const estados = [...estadosVistos.values()].sort((a, b) => Number(b.errou) - Number(a.errou));
    const erros = tentativas - acertos;
    porId('resumo-revisao').textContent =
      acertos + ' acertos em ' + tentativas + ' rodadas. ' +
      (erros ? 'As bandeiras das rodadas em que você errou aparecem primeiro.' : 'Você acertou todas as rodadas.');
    for (const {estado, errou} of estados) {
      const item = document.createElement('li');
      item.innerHTML = '<img alt="" width="64" height="43"><div><strong></strong><small></small></div><span></span>';
      item.classList.toggle('revisar-estado', errou);
      item.querySelector('img').src = bandeira(estado);
      item.querySelector('strong').textContent = estado.nome;
      item.querySelector('small').textContent = estado.capital + ' · ' + estado.regiao;
      item.querySelector('span').textContent = errou ? 'Para rever' : 'Acertou';
      lista.append(item);
    }
  }

  function concluir() {
    // A partida segue usando o registro original lido pelo painel e pelo ranking.
    timeElapsed = Math.floor(tempoAtivo / 1000);
    finalizarJogo();
    porId('pontos-final').textContent = currentScore;
    porId('tempo-final').textContent = formatTime(timeElapsed);
    porId('percentual-final').textContent = '100%';
    preencherRevisao();
    mostrar('telaResultado');
    porId('titulo-resultado').focus({preventScroll:true});
  }

  function proximaRodada() {
    // O motor é compartilhado. Esta tela desconta somente a leitura entre rodadas.
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    maxScore = meta;
    if (!fila.length) fila = embaralhar(estadosBR);
    const estado = fila.pop();
    const opcoes = embaralhar([estado, ...embaralhar(estadosBR.filter(uf => uf !== estado)).slice(0, 3)]);
    jogo.innerHTML = `
      <div class="pista" id="cartao-pista">
        <span class="pista-rotulo">PISTA DO COPERO</span>
        <div class="pista-simbolo" aria-hidden="true"></div>
        <p class="pista-texto" id="pista-texto"></p>
        <button class="pista-dica" type="button" id="dica" aria-expanded="false" aria-controls="sigla-dica">Ver dica</button>
        <p class="pista-sigla" id="sigla-dica" role="status" hidden>Sigla: <strong></strong></p>
      </div>
      <div class="pista revelacao" id="cartao-bandeira" hidden>
        <span class="pista-rotulo">BANDEIRA REVELADA</span>
        <img class="bandeira-revelada" width="270" height="180">
        <h2 id="estado-revelado" tabindex="-1" aria-describedby="detalhes-revelados gfb"></h2>
        <p id="detalhes-revelados"></p>
      </div>
      <div class="respostas">
        <p class="rodada-numero"></p>
        <h2 class="pergunta" id="pergunta" tabindex="-1" aria-describedby="pista-texto">Que estado é esse?</h2>
        <div id="opcoes" role="group" aria-labelledby="pergunta"></div>
        <div class="rodada-rodape" id="rodada-rodape" hidden>
          <p id="gfb"></p>
          <button class="primary-button navy-button" id="proximo" type="button"></button>
        </div>
      </div>`;
    jogo.classList.add('rodada');
    jogo.querySelector('.pista-simbolo').innerHTML = estado.icon;
    porId('pista-texto').textContent = pistas[estado.sigla];
    jogo.querySelector('.rodada-numero').textContent = 'RODADA ' + String(tentativas + 1).padStart(2, '0');
    const dica = porId('dica');
    const sigla = porId('sigla-dica');
    sigla.querySelector('strong').textContent = estado.sigla;
    dica.addEventListener('click', () => {
      sigla.hidden = !sigla.hidden;
      dica.setAttribute('aria-expanded', String(!sigla.hidden));
      dica.textContent = sigla.hidden ? 'Ver dica' : 'Ocultar dica';
    });
    const bandeiraImg = jogo.querySelector('.bandeira-revelada');
    bandeiraImg.src = bandeira(estado);
    bandeiraImg.alt = estado.sigla === 'DF' ? 'Bandeira do Distrito Federal' : 'Bandeira: ' + estado.nome;
    porId('estado-revelado').textContent = estado.nome;
    porId('detalhes-revelados').textContent = 'Capital: ' + estado.capital + ' · Região: ' + estado.regiao;
    const botoes = porId('opcoes');
    const inicioRodada = performance.now();
    for (const opcao of opcoes) {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.textContent = opcao.nome;
      botao.dataset.uf = opcao.sigla;
      botao.addEventListener('click', () => {
        if (botao.disabled) return;
        tempoAtivo += performance.now() - inicioRodada;
        tentativas++;
        const acertou = opcao === estado;
        const anterior = estadosVistos.get(estado.sigla);
        estadosVistos.set(estado.sigla, {estado, errou: !acertou || Boolean(anterior?.errou)});
        if (acertou) {
          acertos++;
          currentScore += valorAcerto;
          atualizarPlacar();
        } else {
          botao.classList.add('resposta-errada');
          botao.setAttribute('aria-label', opcao.nome + ', sua escolha incorreta');
        }
        for (const alternativa of botoes.children) {
          alternativa.disabled = true;
          if (alternativa.dataset.uf === estado.sigla) {
            alternativa.classList.add('resposta-certa');
            alternativa.setAttribute('aria-label', estado.nome + ', resposta correta');
          }
        }
        const feedback = porId('gfb');
        feedback.className = acertou ? 'feedback-certo' : 'feedback-erro';
        feedback.textContent = acertou ? 'Acertou! +10 pontos' : 'A resposta era ' + estado.nome + '.';
        const proximo = porId('proximo');
        const chegouNaMeta = currentScore >= meta;
        proximo.textContent = chegouNaMeta ? 'Ver resultado' : 'Próxima pista';
        proximo.onclick = chegouNaMeta ? concluir : proximaRodada;
        porId('cartao-pista').hidden = true;
        porId('cartao-bandeira').hidden = false;
        porId('rodada-rodape').hidden = false;
        porId('estado-revelado').focus();
      });
      botoes.append(botao);
    }
    porId('pergunta').focus({preventScroll:true});
    window.scrollTo(0, 0);
  }

  function iniciar() {
    if (typeof window.abrirJogo !== 'function') {
      porId('falha').hidden = false;
      return;
    }
    fila = [];
    acertos = 0;
    tentativas = 0;
    tempoAtivo = 0;
    estadosVistos.clear();
    mostrar('telaJogo');
    window.abrirJogo(1, 'Bandeira e Estado');
    atualizarPlacar();
  }

  // Sobrescreve somente a rodada deste jogo nesta página; o motor fica intacto.
  window.initJogo1 = proximaRodada;
  porId('iniciar').addEventListener('click', iniciar);
  porId('repetir').addEventListener('click', iniciar);
  porId('revisar').addEventListener('click', () => revisao.showModal());
})();
