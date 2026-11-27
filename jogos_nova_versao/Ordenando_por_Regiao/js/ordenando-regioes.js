(() => {
  'use strict';
  const {estados,pecas,viewBox}=window.GeoRegioesDados;
  const regioes=['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'];
  const $=id=>document.getElementById(id);
  const metricas=document.querySelector('.metricas');
  const conquistados=new Set();
  const mapaPartida=criarMapa($('mapa-partida'),'Mapa com os estados conquistados nesta sessão');
  const mapaCompleto=criarMapa($('mapa-completo'),'Seu quebra-cabeça do Brasil');
  let lista=[],historico=[],indice=0,pontos=0;
  let atual=null,respondida=false,concluida=false;
  let tempoAcumulado=0,inicioPergunta=null,intervalo=null;

  function criarMapa(destino,descricao) {
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox',viewBox);
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label',descricao);
    const referencias=new Map();
    for (const peca of pecas) {
      const path=document.createElementNS(ns,'path');
      path.setAttribute('d',peca.d);
      path.setAttribute('data-uf',peca.uf);
      path.classList.add('peca-mapa');
      const title=document.createElementNS(ns,'title');
      title.textContent='Peça ainda não conquistada';
      path.append(title);
      svg.append(path);
      referencias.set(peca.uf,path);
    }
    destino.append(svg);
    return {svg,referencias};
  }

  function atualizarMapas(nova=null) {
    for (const mapa of [mapaPartida,mapaCompleto]) {
      for (const uf of estados) {
        const path=mapa.referencias.get(uf.sigla);
        const conquistado=conquistados.has(uf.sigla);
        path.classList.toggle('encaixada',conquistado);
        path.classList.remove('nova');
        path.querySelector('title').textContent=conquistado ? uf.nome+' · '+uf.regiao : 'Peça ainda não conquistada';
      }
      if (nova) {
        // Alterar a ordem põe o novo estado acima das linhas das peças vizinhas.
        const path=mapa.referencias.get(nova);
        mapa.svg.append(path);
        path.classList.add('nova');
      }
      mapa.svg.setAttribute('aria-label',conquistados.size+' de 27 peças conquistadas no mapa do Brasil');
    }
    $('mini-pecas').textContent=conquistados.size+'/27';
    $('pecas').textContent=conquistados.size+' de 27';
    $('resumo-mapa-dialog').textContent=conquistados.size===27
      ? 'Mapa completo! Você conquistou todas as 27 unidades da Federação.'
      : conquistados.size+' de 27 peças encaixadas. Acerte novos estados para continuar seu mapa.';
    $('pecas-lista').replaceChildren();
    for (const uf of estados.filter(e=>conquistados.has(e.sigla))) {
      const item=document.createElement('li');
      item.textContent=uf.nome+' · '+uf.regiao;
      $('pecas-lista').append(item);
    }
  }

  function mostrar(tela) {
    for (const nome of ['abertura','partida','resultado']) $(nome).hidden=nome!==tela;
    metricas.hidden=tela!=='partida';
    document.body.dataset.screen=tela;
    window.scrollTo(0,0);
  }

  function embaralhar(valores) {
    const copia=[...valores];
    for (let i=copia.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [copia[i],copia[j]]=[copia[j],copia[i]];
    }
    return copia;
  }

  function formatar(segundos) {
    return Math.floor(segundos/60).toString().padStart(2,'0')+':'+(segundos%60).toString().padStart(2,'0');
  }

  function duracao() {
    return tempoAcumulado+(inicioPergunta===null?0:performance.now()-inicioPergunta);
  }

  function atualizarTempo() {
    $('tempo').textContent=formatar(Math.floor(duracao()/1000));
  }

  function renderizarPergunta() {
    atual=lista[indice];
    respondida=false;
    $('cartao-estado').hidden=false;
    $('cartao-mapa').hidden=true;
    $('feedback-area').hidden=true;
    $('estado').textContent=atual.nome;
    $('sigla').textContent=atual.sigla;
    $('numero-rodada').textContent='RODADA '+String(indice+1).padStart(2,'0');
    $('opcoes').replaceChildren();
    for (const regiao of regioes) {
      const botao=document.createElement('button');
      botao.type='button';
      botao.textContent=regiao;
      botao.addEventListener('click',()=>responder(botao,regiao));
      $('opcoes').append(botao);
    }
    inicioPergunta=performance.now();
    $('pergunta').focus({preventScroll:true});
    window.scrollTo(0,0);
  }

  function responder(botao,regiao) {
    if (respondida||concluida) return;
    respondida=true;
    tempoAcumulado=duracao();
    inicioPergunta=null;
    atualizarTempo();
    const acertou=regiao===atual.regiao;
    const novaPeca=acertou&&!conquistados.has(atual.sigla);
    historico.push({estado:atual,escolha:regiao,acertou});
    if (acertou) {
      pontos+=10;
      conquistados.add(atual.sigla);
      $('placar').textContent=pontos;
    }
    for (const opcao of $('opcoes').children) {
      opcao.disabled=true;
      if (opcao.textContent===atual.regiao) {
        opcao.classList.add('correta');
        opcao.setAttribute('aria-label',atual.regiao+', resposta correta');
      }
    }
    if (!acertou) {
      botao.classList.add('errada');
      botao.setAttribute('aria-label',regiao+', sua escolha incorreta');
    }
    atualizarMapas(novaPeca?atual.sigla:null);
    if (acertou) {
      $('cartao-estado').hidden=true;
      $('cartao-mapa').hidden=false;
      $('rotulo-encaixe').textContent=conquistados.size===27?'MAPA COMPLETO':novaPeca?'MAIS UMA PEÇA NO MAPA':'SEU MAPA DO BRASIL';
      $('mapa-legenda').textContent=atual.nome+' · '+atual.regiao+(novaPeca?' · Peça encaixada!':' · Já estava no seu mapa');
    }
    $('feedback').classList.toggle('erro',!acertou);
    $('feedback').textContent=acertou?'Acertou! +10 pontos':atual.nome+' fica na região '+atual.regiao+'.';
    $('proximo').textContent=pontos>=60||indice===lista.length-1?'Ver resultado':'Próximo estado';
    $('proximo').setAttribute('aria-describedby',acertou?'feedback mapa-legenda':'feedback');
    $('feedback-area').hidden=false;
    // A leitura do mapa e do feedback fica no ritmo do aluno.
    $('proximo').focus({preventScroll:true});
  }

  function preencherRevisao() {
    $('resumo-revisao').textContent=(pontos/10)+' acertos em '+historico.length+' questões nesta partida.';
    $('lista-revisao').replaceChildren();
    for (const item of [...historico].sort((a,b)=>Number(a.acertou)-Number(b.acertou))) {
      const linha=document.createElement('li');
      linha.classList.toggle('rever',!item.acertou);
      const coluna=document.createElement('div');
      const titulo=document.createElement('strong');
      titulo.textContent=item.estado.nome;
      const detalhe=document.createElement('small');
      detalhe.textContent=item.estado.sigla+' · '+item.estado.regiao+(!item.acertou?' · Você escolheu '+item.escolha:'');
      coluna.append(titulo,detalhe);
      const selo=document.createElement('span');
      selo.className='selo';
      selo.textContent=item.acertou?'Acertou':'Para rever';
      linha.append(coluna,selo);
      $('lista-revisao').append(linha);
    }
  }

  function registrar(segundos) {
    try {
      const registros=JSON.parse(localStorage.getItem('geoeduca_results')||'[]');
      if (!Array.isArray(registros)) throw new Error('Histórico inválido');
      const usuario=JSON.parse(localStorage.getItem('geoeduca_user')||'{}');
      registros.push({
        gameId:5,
        aluno:usuario?.name||localStorage.getItem('geoeduca_user_name')||'Aluno',
        sala:usuario?.sala||'',
        pontuacao:pontos,
        tempo:formatar(segundos),
        data:new Date().toISOString(),
        pct:Math.min(100,Math.round(pontos/60*100))
      });
      localStorage.setItem('geoeduca_results',JSON.stringify(registros));
    } catch {
      $('aviso-salvar').hidden=false;
    }
  }

  function concluir() {
    if (concluida) return;
    concluida=true;
    clearInterval(intervalo);
    intervalo=null;
    inicioPergunta=null;
    const segundos=Math.floor(tempoAcumulado/1000);
    $('resultado-pontos').textContent=pontos;
    $('resultado-acertos').textContent=pontos/10;
    $('resultado-tempo').textContent=formatar(segundos);
    $('titulo-resultado').innerHTML=pontos>=60?'Você conhece<br>as regiões!':'Continue<br>descobrindo!';
    $('resumo-mapa').textContent=conquistados.size===27
      ? 'Seu mapa está completo: 27 de 27 peças encaixadas!'
      : 'Seu mapa tem '+conquistados.size+' de 27 peças. Jogue novamente para encaixar mais estados.';
    preencherRevisao();
    registrar(segundos);
    mostrar('resultado');
    $('titulo-resultado').focus({preventScroll:true});
  }

  function avancar() {
    if (!respondida||concluida) return;
    if (pontos>=60||indice===lista.length-1) {
      concluir();
      return;
    }
    indice++;
    renderizarPergunta();
  }

  function iniciar() {
    clearInterval(intervalo);
    pontos=0;
    indice=0;
    historico=[];
    concluida=false;
    tempoAcumulado=0;
    inicioPergunta=null;
    $('placar').textContent='0';
    $('tempo').textContent='00:00';
    $('aviso-salvar').hidden=true;
    // Cada UF aparece no máximo uma vez por partida. O mapa permanece no replay.
    lista=[
      ...embaralhar(estados.filter(e=>!conquistados.has(e.sigla))),
      ...embaralhar(estados.filter(e=>conquistados.has(e.sigla)))
    ];
    atualizarMapas();
    mostrar('partida');
    renderizarPergunta();
    intervalo=setInterval(atualizarTempo,250);
  }

  $('iniciar').addEventListener('click',iniciar);
  $('repetir').addEventListener('click',iniciar);
  $('proximo').addEventListener('click',avancar);
  for (const id of ['abrir-mapa','ver-mapa-final']) {
    $(id).addEventListener('click',()=>{$('mapa-dialog').showModal();});
  }
  $('revisar').addEventListener('click',()=>$('revisao').showModal());
  window.addEventListener('pagehide',()=>{clearInterval(intervalo);intervalo=null;});
  window.addEventListener('pageshow',evento=>{
    if (evento.persisted) {
      inicioPergunta=null;
      clearInterval(intervalo);
      mostrar('abertura');
    }
  });
  atualizarMapas();
})();
