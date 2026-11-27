(() => {
  'use strict';
  const biomas = [
    {nome:'Amazônia', pista:'Maior floresta tropical do mundo', resumo:'Abriga uma grande diversidade de plantas e animais, com florestas e extensos rios.'},
    {nome:'Caatinga', pista:'Bioma exclusivamente brasileiro', resumo:'Predomina no semiárido. Sua vegetação é adaptada aos períodos de seca.'},
    {nome:'Cerrado', pista:'Savana com grande biodiversidade', resumo:'Ocorre principalmente no Planalto Central e reúne muitas espécies de plantas e animais.'},
    {nome:'Mata Atlântica', pista:'Floresta ao longo da costa brasileira', resumo:'Muito transformada pela ocupação humana, conserva espécies que só ocorrem nesse bioma.'},
    {nome:'Pampa', pista:'Campos do sul do Brasil', resumo:'Na porção brasileira, ocorre no Rio Grande do Sul, com campos de ervas e arbustos.'},
    {nome:'Pantanal', pista:'Planície com alagamentos sazonais', resumo:'Nos períodos de inundação, parte da fauna busca as áreas mais altas.'}
  ];
  const $ = id => document.getElementById(id);
  const tabuleiro = $('tabuleiro');
  const feedback = $('feedback');
  const metricas = document.querySelector('.metricas');
  const revisao = $('revisao');
  const folha = '<svg class="folha" viewBox="0 0 40 44" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7 32C-1 15 16 5 35 3c1 17-5 33-21 32l-6 7-3-2 20-24L7 32Z"/></svg>';
  let cartas = [];
  let escolhidas = [];
  let encontrados = 0;
  let jogadas = 0;
  let bloqueado = false;
  let inicio = 0;
  let intervalo = null;
  let espera = null;
  let salvo = false;
  let sessao = 0;

  function tempoFormatado(segundos) {
    return Math.floor(segundos/60).toString().padStart(2,'0') + ':' + (segundos%60).toString().padStart(2,'0');
  }

  function segundosDecorridos() {
    return Math.floor((performance.now() - inicio) / 1000);
  }

  function pararRelogios() {
    clearInterval(intervalo);
    clearTimeout(espera);
    intervalo = espera = null;
  }

  function mostrar(tela) {
    for (const nome of ['abertura','partida','resultado']) $(nome).hidden = nome !== tela;
    metricas.hidden = tela !== 'partida';
    document.body.dataset.screen = tela;
    window.scrollTo(0,0);
  }

  function embaralhar(lista) {
    const nova = [...lista];
    for (let i=nova.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [nova[i],nova[j]]=[nova[j],nova[i]];
    }
    return nova;
  }

  function fecharCarta(carta) {
    carta.botao.classList.remove('aberta');
    carta.botao.setAttribute('aria-label','Carta '+(carta.posicao+1)+', virada para baixo');
    carta.botao.setAttribute('aria-pressed','false');
    carta.botao.innerHTML=folha;
    carta.aberta=false;
  }

  function abrirCarta(carta) {
    if (bloqueado || carta.aberta || carta.encontrada) return;
    carta.aberta=true;
    carta.botao.classList.add('aberta');
    carta.botao.setAttribute('aria-label',carta.texto);
    carta.botao.setAttribute('aria-pressed','true');
    const texto=document.createElement('span');
    texto.className='conteudo';
    texto.textContent=carta.texto;
    carta.botao.replaceChildren(texto);
    escolhidas.push(carta);
    if (escolhidas.length!==2) return;
    bloqueado=true;
    tabuleiro.setAttribute('aria-busy','true');
    $('jogadas').textContent=++jogadas;
    const par=[...escolhidas];
    const acertou=par[0].bioma===par[1].bioma;
    const estaSessao=sessao;
    const segundoFinal=acertou && encontrados===biomas.length-1 ? segundosDecorridos() : null;
    if (segundoFinal!==null) clearInterval(intervalo);
    espera=setTimeout(() => {
      if (sessao!==estaSessao) return;
      if (acertou) {
        encontrados++;
        $('pares').textContent=encontrados;
        for (const cartaEncontrada of par) {
          cartaEncontrada.encontrada=true;
          const botao=cartaEncontrada.botao;
          botao.classList.add('encontrada');
          botao.disabled=true;
          botao.setAttribute('aria-label',cartaEncontrada.texto+', par encontrado');
        }
        feedback.classList.remove('erro');
        feedback.textContent='Par encontrado! +10 pontos';
      } else {
        par.forEach(fecharCarta);
        feedback.classList.add('erro');
        feedback.textContent='Ainda não é um par. Tente novamente.';
      }
      escolhidas=[];
      bloqueado=false;
      tabuleiro.setAttribute('aria-busy','false');
      if (encontrados===biomas.length) {
        bloqueado=true;
        espera=setTimeout(() => {
          if (sessao===estaSessao) concluir(segundoFinal);
        },450);
      } else if (acertou && par.some(c=>c.botao===document.activeElement)) {
        cartas.find(c=>!c.encontrada)?.botao.focus({preventScroll:true});
      }
    },acertou ? 350 : 1000);
  }

  function registrar(segundos) {
    if (salvo) return;
    salvo=true;
    try {
      const historico=JSON.parse(localStorage.getItem('geoeduca_results') || '[]');
      if (!Array.isArray(historico)) throw new Error('Histórico inválido');
      const usuario=JSON.parse(localStorage.getItem('geoeduca_user') || '{}');
      const nome=usuario?.name || localStorage.getItem('geoeduca_user_name') || 'Aluno';
      historico.push({
        gameId:4,
        aluno:nome,
        sala:usuario?.sala || '',
        pontuacao:encontrados*10,
        tempo:tempoFormatado(segundos),
        data:new Date().toISOString(),
        pct:Math.round(encontrados/biomas.length*100)
      });
      localStorage.setItem('geoeduca_results',JSON.stringify(historico));
    } catch {
      $('aviso-salvar').hidden=false;
    }
  }

  function concluir(segundos) {
    pararRelogios();
    $('resultado-pontos').textContent=encontrados*10;
    $('resultado-tempo').textContent=tempoFormatado(segundos);
    $('resultado-jogadas').textContent='Você encontrou todos os pares em '+jogadas+' jogadas.';
    registrar(segundos);
    mostrar('resultado');
    $('titulo-resultado').focus({preventScroll:true});
  }

  function iniciar() {
    sessao++;
    pararRelogios();
    encontrados=0;
    jogadas=0;
    escolhidas=[];
    bloqueado=false;
    salvo=false;
    $('aviso-salvar').hidden=true;
    $('pares').textContent='0';
    $('jogadas').textContent='0';
    $('tempo').textContent='00:00';
    feedback.classList.remove('erro');
    feedback.textContent='Vire duas cartas para encontrar um par.';
    tabuleiro.setAttribute('aria-busy','false');
    tabuleiro.replaceChildren();
    cartas=embaralhar(biomas.flatMap((bioma,i)=>[
      {bioma:i,texto:bioma.nome},
      {bioma:i,texto:bioma.pista}
    ])).map((carta,posicao)=>{
      const botao=document.createElement('button');
      botao.type='button';
      botao.className='carta';
      const item={...carta,posicao,botao,aberta:false,encontrada:false};
      fecharCarta(item);
      botao.addEventListener('click',()=>abrirCarta(item));
      tabuleiro.append(botao);
      return item;
    });
    inicio=performance.now();
    intervalo=setInterval(()=>{$('tempo').textContent=tempoFormatado(segundosDecorridos());},250);
    mostrar('partida');
    $('titulo-partida').focus({preventScroll:true});
  }

  for (const bioma of biomas) {
    const item=document.createElement('li');
    const titulo=document.createElement('h3');
    titulo.textContent=bioma.nome;
    const texto=document.createElement('p');
    texto.textContent=bioma.pista+'. '+bioma.resumo;
    item.append(titulo,texto);
    $('lista-biomas').append(item);
  }

  $('iniciar').addEventListener('click',iniciar);
  $('repetir').addEventListener('click',iniciar);
  $('revisar').addEventListener('click',()=>revisao.showModal());
  window.addEventListener('pagehide',()=>{sessao++;pararRelogios();});
  // Retomar uma página restaurada pelo navegador encerra a partida interrompida.
  window.addEventListener('pageshow',evento=>{
    if (evento.persisted) {
      pararRelogios();
      mostrar('abertura');
    }
  });
})();
