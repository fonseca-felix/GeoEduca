/* Detetive do Brasil · GeoEduca — interface aprovada e integração original. */
'use strict';
const API_BASE = '/api';
const HORAS_INICIAIS = 72;
const CUSTO_CONVERSAR = 2;
const CUSTO_VIAJAR_CERTO = 8;
const CUSTO_VIAJAR_ERRADO = 12;
const ESTADOS = [
  ['AC','Acre','Norte'],['AL','Alagoas','Nordeste'],['AP','Amapá','Norte'],['AM','Amazonas','Norte'],['BA','Bahia','Nordeste'],['CE','Ceará','Nordeste'],['DF','Distrito Federal','Centro-Oeste'],['ES','Espírito Santo','Sudeste'],['GO','Goiás','Centro-Oeste'],['MA','Maranhão','Nordeste'],['MT','Mato Grosso','Centro-Oeste'],['MS','Mato Grosso do Sul','Centro-Oeste'],['MG','Minas Gerais','Sudeste'],['PA','Pará','Norte'],['PB','Paraíba','Nordeste'],['PR','Paraná','Sul'],['PE','Pernambuco','Nordeste'],['PI','Piauí','Nordeste'],['RJ','Rio de Janeiro','Sudeste'],['RN','Rio Grande do Norte','Nordeste'],['RS','Rio Grande do Sul','Sul'],['RO','Rondônia','Norte'],['RR','Roraima','Norte'],['SC','Santa Catarina','Sul'],['SP','São Paulo','Sudeste'],['SE','Sergipe','Nordeste'],['TO','Tocantins','Norte']
].map(([sigla,nome,regiao])=>({sigla,nome,regiao}));
const REGIOES = ['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'];
const ICONES = {
  person:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3Z"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  warning:'<path d="m12 3 10 18H2Z"/><path d="M12 9v5M12 17v.1"/>'
};
const $ = id => document.getElementById(id);
const DEMO = document.body.dataset.mode === 'demo';
let G = criarEstadoInicial(), token = null, requestSerial = 0, caseSerial = 0, startController = null;
let regiaoFiltro = 'Todas', destinoSelecionado = null, filtroCaderneta = null, viagemPendente = null, exitAction = null;

function criarEstadoInicial(){return {caso:null,rotaIndex:0,horasRestantes:HORAS_INICIAIS,npcsConversados:new Set(),caderneta:[],errosViagem:0,acertosViagem:0,estadosVisitados:[],inicioPartida:null,ativo:false,serial:0,busy:false};}
function node(tag, className, text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
function icone(nome){const n=node('span','icon-wrap');n.innerHTML='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">'+(ICONES[nome]||ICONES.person)+'</svg>';return n;}
function _set(id,value){const n=$(id);if(n)n.textContent=value;}
function estadoAtual(){return G.caso?.rota[G.rotaIndex];}
function ativo(){return G.ativo && G.horasRestantes>0 && !viagemPendente;}
function closeDialog(id){if($(id).open)$(id).close();}

function mostrarTela(id){
  document.querySelectorAll('.tela').forEach(t=>{const current=t.id===id;t.hidden=!current;t.classList.toggle('ativa',current);});
  const tone=id==='tela-inicio'?'gold':(['tela-fim','tela-carregamento'].includes(id)?'navy':'paper');
  document.body.dataset.tone=tone;
  document.body.dataset.screen=id==='tela-inicio'?'telaInicial':id;
  const showCase=G.ativo && tone==='paper' && id!=='tela-briefing';
  $('progresso-rota').hidden=!showCase;$('timer-display').hidden=!showCase;$('header-agent').hidden=!showCase;
  $('options-menu').open=false;
  if(showCase)atualizarTopBar();
  window.scrollTo({top:0,behavior:'instant'});
  const heading=$(id).querySelector('h1');if(heading)heading.focus({preventScroll:true});
}

async function apiFetch(path, options={}, controller=new AbortController()){
  const timeout=setTimeout(()=>controller.abort(),60000);
  try{
    const response=await fetch(API_BASE+path,{...options,signal:controller.signal,headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`,...(options.headers||{})}});
    let data;
    try{data=await response.json();}catch{throw new Error('O servidor retornou uma resposta inválida. Tente novamente.');}
    if(!response.ok)throw Object.assign(new Error(data.error||'Não foi possível concluir a solicitação.'),{status:response.status});
    return data;
  }catch(error){
    if(error.name==='AbortError')throw new Error('A solicitação foi interrompida ou demorou demais. Tente novamente.');
    throw error;
  }finally{clearTimeout(timeout);}
}

function validarCaso(caso){
  if(!caso || typeof caso.patrimonioRoubado!=='string' || !caso.criminoso || typeof caso.criminoso.nome!=='string' || !Array.isArray(caso.rota) || !caso.rota.length || caso.rota.length>5)throw new Error('O servidor retornou um caso incompleto. Tente novamente.');
  caso.rota.forEach((passo,index)=>{
    if(!ESTADOS.some(e=>e.sigla===passo.estadoAtual) || !Array.isArray(passo.npcs) || passo.npcs.some(n=>!n || typeof n.nome!=='string' || typeof n.dica!=='string'))throw new Error('As pistas deste caso estão incompletas. Tente novamente.');
    const final=index===caso.rota.length-1;
    if(Boolean(passo.ehEstadoFinal)!==final || (!final && passo.proximoEstado!==caso.rota[index+1].estadoAtual))throw new Error('A rota recebida está inconsistente. Solicite outro caso.');
  });
  return caso;
}

async function iniciarJogo(){
  if(G.busy)return;
  if(!DEMO && !token){window.location.href='/index.html';return;}
  const serial=++requestSerial;
  if(startController)startController.abort();
  startController=new AbortController();
  closeDialog('travel-dialog');closeDialog('exit-dialog');closeDialog('help-dialog');viagemPendente=null;
  G=criarEstadoInicial();G.busy=true;
  $('btn-retry').hidden=true;$('loading-spinner').hidden=false;
  _set('loading-title','Preparando seu caso…');setLoadingMsg('Organizando a rota e as pistas da investigação.');
  mostrarTela('tela-carregamento');
  try{
    const data=DEMO?{sucesso:true,caso:JSON.parse(JSON.stringify(window.DETETIVE_CASO_DEMO))}:await apiFetch('/detetive/novo-caso',{method:'POST'},startController);
    if(serial!==requestSerial)return;
    if(!data.sucesso || !data.caso)throw new Error(data.error||'Não foi possível preparar este caso.');
    const caso=validarCaso(data.caso);
    G=criarEstadoInicial();G.caso=caso;G.estadosVisitados=[caso.rota[0].estadoAtual];G.inicioPartida=Date.now();G.ativo=true;G.serial=++caseSerial;
    regiaoFiltro='Todas';destinoSelecionado=null;filtroCaderneta=null;
    mostrarBriefing();
  }catch(error){
    if(serial!==requestSerial)return;
    G.busy=false;$('loading-spinner').hidden=true;$('btn-retry').hidden=false;
    _set('loading-title','Não foi possível abrir o caso.');setLoadingMsg(error.message||'Verifique a conexão e tente novamente.');
  }finally{if(serial===requestSerial)G.busy=false;}
}
function setLoadingMsg(msg){_set('loading-msg',msg);}
function mostrarBriefing(){
  const caso=G.caso,primeiro=estadoAtual();
  _set('briefing-patrimonio',caso.patrimonioRoubado);_set('briefing-desc',caso.descricaoRoubo||'Siga as pistas para recuperar o patrimônio.');
  _set('briefing-crim-nome',caso.criminoso.nome);_set('briefing-crim-apelido',caso.criminoso.apelido?`“${caso.criminoso.apelido}”`:'');
  _set('briefing-crim-desc',caso.criminoso.descricao||'Não informada.');_set('briefing-crim-motivo',caso.criminoso.motivacao||'Não informada.');
  _set('briefing-local',`${nomeEstado(primeiro.estadoAtual)} · ${primeiro.estadoAtual}`);mostrarTela('tela-briefing');
}
function nomeEstado(sigla){return ESTADOS.find(e=>e.sigla===sigla)?.nome||sigla;}
function atualizarMapa(id,sigla){const img=$(id);img.src=`assets/maps/${sigla.toLowerCase()}.svg`;img.alt=`${nomeEstado(sigla)} em destaque no mapa do Brasil`;}

function mostrarInvestigacao(){
  if(!ativo())return;
  const local=estadoAtual(),final=local.ehEstadoFinal;
  _set('inv-eyebrow',`${local.estadoAtual} · ETAPA ${G.rotaIndex+1} DE ${G.caso.rota.length}`);
  _set('inv-estado-nome',final?'O suspeito está aqui.':nomeEstado(local.estadoAtual));
  _set('inv-mensagem',final?'Converse com as testemunhas para confirmar o esconderijo.':'Converse com os moradores e descubra o próximo destino.');
  _set('inv-map-caption',`${nomeEstado(local.estadoAtual)} · ${local.estadoAtual}`);
  atualizarMapa('inv-mapa',local.estadoAtual);
  $('btn-aeroporto').hidden=final;$('btn-prender').hidden=!final;
  _set('badge-notas',G.caderneta.length);_set('notas-label',G.caderneta.length===1?'pista':'pistas');renderizarNPCs(local);mostrarTela('tela-investigacao');
}
function renderizarNPCs(local){
  const grid=$('npc-grid');grid.replaceChildren();
  local.npcs.forEach((npc,index)=>{
    const key=`${G.rotaIndex}-${index}`,read=G.npcsConversados.has(key),button=node('button','witness-row'+(read?' collected':''));
    button.append(icone('person'));
    const copy=node('span','witness-copy');copy.append(node('strong','',npc.nome),node('span','',npc.profissao||'Morador local'));
    const action=node('span','witness-action',read?'Reler pista':'Conversar · −2h');action.append(node('span','arrow','›'));
    button.append(copy,action);button.setAttribute('aria-label',`${npc.nome}, ${npc.profissao||'morador local'}. ${read?'Reler pista, sem custo':'Conversar, custo de 2 horas'}`);
    button.addEventListener('click',()=>abrirDialogoNPC(npc,key,index));grid.append(button);
  });
  if(!local.npcs.length)grid.append(node('p','empty-clues','Nenhuma testemunha disponível neste local. Consulte as pistas já coletadas.'));
}
function abrirDialogoNPC(npc,key,index){
  if(!ativo() || !['tela-investigacao','tela-npc'].includes(telaAtual()))return;
  const local=estadoAtual();if(key!==`${G.rotaIndex}-${index}` || local.npcs[index]!==npc)return;
  const collected=G.npcsConversados.has(key);
  if(!collected){
    G.horasRestantes=Math.max(0,G.horasRestantes-CUSTO_CONVERSAR);G.npcsConversados.add(key);
    G.caderneta.push({uf:local.estadoAtual,estado:`${nomeEstado(local.estadoAtual)} (${local.estadoAtual})`,npcNome:npc.nome,npcJob:npc.profissao||'Morador local',dica:npc.dica});
    if(verificarFim())return;
  }
  $('npc-dialog-emoji').replaceChildren(icone('person'));_set('npc-dialog-nome',npc.nome);_set('npc-dialog-job',`${npc.profissao||'Morador local'} · ${nomeEstado(local.estadoAtual)}`);
  _set('npc-dialog-dica',npc.dica);_set('npc-title',collected?'Releia esta pista.':'Uma nova pista.');
  _set('npc-clue-status',collected?'Pista já coletada · Releitura sem custo':'Pista salva na caderneta · Conversa: −2h');mostrarTela('tela-npc');
}

function mostrarCaderneta(){
  if(!ativo())return;
  const states=[...new Set(G.caderneta.map(n=>n.uf))];
  if(!states.includes(filtroCaderneta))filtroCaderneta=states.includes(estadoAtual().estadoAtual)?estadoAtual().estadoAtual:states[0];
  const nav=$('caderneta-estados');nav.replaceChildren();nav.hidden=!states.length;
  states.forEach(uf=>{
    const count=G.caderneta.filter(n=>n.uf===uf).length,b=node('button','notebook-state',`${nomeEstado(uf)} · ${count} ${count===1?'pista':'pistas'}`);
    b.setAttribute('aria-pressed',String(uf===filtroCaderneta));b.addEventListener('click',()=>{filtroCaderneta=uf;mostrarCaderneta();});nav.append(b);
  });
  const list=$('caderneta-lista');list.replaceChildren();
  G.caderneta.filter(n=>n.uf===filtroCaderneta).forEach(clue=>{
    const item=node('article','clue-item'),person=node('div','witness-person'),symbol=node('span','person-icon');symbol.append(icone('person'));
    const author=node('div');author.append(node('strong','',`${clue.npcNome} · ${clue.npcJob}`),node('span','',clue.estado));person.append(symbol,author);item.append(person,node('blockquote','',clue.dica));list.append(item);
  });
  if(!G.caderneta.length)list.append(node('p','empty-clues','Sua caderneta está vazia. Converse com os moradores para coletar pistas. Elas serão salvas aqui automaticamente.'));
  const airport=$('tela-caderneta').querySelector('[data-action="airport"]');airport.hidden=estadoAtual().ehEstadoFinal;
  mostrarTela('tela-caderneta');
}

function normalizar(value){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function mostrarAeroporto(){
  if(!ativo() || estadoAtual().ehEstadoFinal)return;
  _set('aeroporto-estado-atual',nomeEstado(estadoAtual().estadoAtual));atualizarMapa('airport-map',estadoAtual().estadoAtual);
  renderizarFiltros();renderizarDestinos();mostrarTela('tela-aeroporto');
}
function renderizarFiltros(){
  const box=$('filtros-regiao');box.replaceChildren();
  ['Todas',...REGIOES].forEach(region=>{const b=node('button','',region);b.setAttribute('aria-pressed',String(region===regiaoFiltro));b.addEventListener('click',()=>{regiaoFiltro=region;renderizarFiltros();renderizarDestinos();});box.append(b);});
}
function renderizarDestinos(){
  if(!G.caso)return;
  const query=normalizar($('estado-busca').value||''),list=$('aeroporto-estados');list.replaceChildren();
  const filtered=ESTADOS.filter(e=>(regiaoFiltro==='Todas'||e.regiao===regiaoFiltro)&&(!query||normalizar(e.nome+' '+e.sigla).includes(query)));
  filtered.forEach(e=>{
    const current=e.sigla===estadoAtual().estadoAtual,b=node('button','destination-button');b.disabled=current;
    b.setAttribute('aria-pressed',String(e.sigla===destinoSelecionado));b.setAttribute('aria-label',`${e.nome}, ${e.sigla}${current?', você está aqui':''}`);
    b.append(node('span','',e.nome),node('strong','',current?'Atual':e.sigla));
    b.addEventListener('click',()=>{destinoSelecionado=e.sigla;renderizarDestinos();$('aeroporto-estados').querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});});list.append(b);
  });
  if(!filtered.length)list.append(node('p','empty-clues','Nenhum estado encontrado neste filtro. Tente outra região ou busca.'));
  // A selection remains explicit even when the user changes the filter.
  const selected=ESTADOS.find(e=>e.sigla===destinoSelecionado);
  $('btn-embarcar').disabled=!selected;
  $('btn-embarcar').replaceChildren(document.createTextNode(selected?`Embarcar para ${selected.nome}`:'Selecione um destino'),node('span','','→'));
  _set('airport-selection-status',selected?`Destino selecionado: ${selected.nome} · ${selected.sigla}`:'Escolha um estado para embarcar.');
}
function viajar(sigla){
  if(!ativo() || telaAtual()!=='tela-aeroporto' || estadoAtual().ehEstadoFinal)return;
  const destination=ESTADOS.find(e=>e.sigla===sigla);if(!destination || sigla===estadoAtual().estadoAtual)return;
  const correct=sigla===estadoAtual().proximoEstado,cost=correct?CUSTO_VIAJAR_CERTO:CUSTO_VIAJAR_ERRADO;
  G.horasRestantes=Math.max(0,G.horasRestantes-cost);
  if(correct){G.acertosViagem++;G.rotaIndex++;G.npcsConversados=new Set();G.estadosVisitados.push(sigla);}else G.errosViagem++;
  destinoSelecionado=null;$('estado-busca').value='';
  viagemPendente={serial:G.serial,correct,cost};
  exibirModalViagem(correct,destination.nome,cost);
}
function exibirModalViagem(correct,name,cost){
  atualizarTopBar();const d=$('travel-dialog');d.className=correct?'success':'error';
  $('travel-symbol').replaceChildren(icone(correct?'pin':'warning'));
  _set('travel-title',correct?'Rastros encontrados!':'Essa pista não se confirmou.');
  _set('travel-desc',correct?`Você chegou a ${name} e está no caminho certo.`:`O suspeito não passou por ${name}. Consulte novamente as pistas de ${nomeEstado(estadoAtual().estadoAtual)}.`);
  _set('travel-cost',`−${cost}h · ${G.horasRestantes}h restantes`);
  $('travel-continue').replaceChildren(document.createTextNode(correct?'Continuar investigação':'Voltar às pistas'),node('span','','→'));
  d.showModal();$('travel-continue').focus();
}
function concluirViagem(){
  if(!viagemPendente)return;
  const pending=viagemPendente;viagemPendente=null;closeDialog('travel-dialog');
  if(pending.serial!==G.serial || !G.ativo)return;
  if(!verificarFim())mostrarInvestigacao();
}
function prenderCriminoso(){if(!ativo() || !estadoAtual().ehEstadoFinal || telaAtual()!=='tela-investigacao')return;finalizarPartida('VITÓRIA');}
function verificarFim(){if(G.ativo && G.horasRestantes<=0){G.horasRestantes=0;finalizarPartida('DERROTA');return true;}return !G.ativo;}

async function finalizarPartida(resultado){
  if(!G.ativo)return;
  G.ativo=false;viagemPendente=null;
  const serial=G.serial,seconds=Math.max(0,Math.floor((Date.now()-G.inicioPartida)/1000));
  const payload={resultado,tempo_jogado_segundos:seconds,erros_viagem:G.errosViagem,acertos_viagem:G.acertosViagem,estados_visitados:[...G.estadosVisitados]};
  mostrarFimDeJogo(resultado,seconds);
  if(DEMO){_set('save-status','Demonstração: esta partida não é enviada ao ranking.');return;}
  _set('save-status','Registrando sua partida…');
  try{
    const data=await apiFetch('/detetive/finalizar-partida',{method:'POST',body:JSON.stringify(payload)});
    if(data.sucesso===false)throw new Error('Registro não confirmado.');
    if(serial===G.serial)_set('save-status','Partida registrada na plataforma.');
  }catch{if(serial===G.serial)_set('save-status','Não foi possível confirmar o registro desta partida. O resultado permanece nesta tela.');}
}
function mostrarFimDeJogo(resultado,seconds){
  const win=resultado==='VITÓRIA',points=win?Math.max(100,1000-G.errosViagem*80-Math.floor(seconds/60)):Math.max(0,G.acertosViagem*30);
  $('tela-fim').classList.toggle('loss',!win);
  _set('fim-titulo',win?'Caso encerrado!':'Ainda há casos para resolver.');
  _set('fim-mensagem',win?`Você recuperou “${G.caso.patrimonioRoubado}”. Excelente trabalho, detetive!`:'O tempo desta investigação acabou. Tente uma nova rota.');
  _set('fim-pontuacao',points);_set('fim-estados',G.estadosVisitados.length);_set('fim-horas',`${G.horasRestantes}h`);_set('fim-acertos',G.acertosViagem);_set('fim-erros',G.errosViagem);_set('fim-pistas',G.caderneta.length);_set('fim-tempo',formatarTempo(seconds));
  $('fim-copero').src=win?'assets/celebracao/copero-detetive.webp':'assets/personagens/copero-detetive-acolhendo.webp';$('fim-copero').alt=win?'Copero comemorando a recuperação do patrimônio':'Copero pronto para uma nova investigação';
  $('btn-novo-caso').replaceChildren(document.createTextNode(win?'Investigar novo caso':'Tentar um novo caso'),node('span','','→'));
  $('tela-fim').querySelector('.result-details').open=false;mostrarTela('tela-fim');
}
function atualizarTopBar(){
  _set('horas-header',`${Math.max(0,G.horasRestantes)}h`);$('timer-display').classList.toggle('urgent',G.horasRestantes<=16);$('timer-display').setAttribute('aria-label',`${G.horasRestantes} horas restantes no caso`);
  renderizarProgressoRota();
}
function renderizarProgressoRota(){
  const route=$('progresso-rota');route.replaceChildren();if(!G.caso)return;
  G.caso.rota.forEach((step,index)=>{
    const visited=index<G.rotaIndex,current=index===G.rotaIndex,known=visited||current,item=node('li',current?'current':visited?'visited':'unknown');
    item.append(node('span','step-dot',visited?'✓':current?'●':'?'),node('span','',known?step.estadoAtual:'?'));
    item.setAttribute('aria-label',known?`${nomeEstado(step.estadoAtual)}${current?', localização atual':', visitado'}`:`Etapa ${index+1}, destino ainda não descoberto`);
    if(current)item.setAttribute('aria-current','step');route.append(item);
  });
}
function formatarTempo(seconds){const s=Math.max(0,Math.floor(seconds)),m=Math.floor(s/60);return m<60?`${m}m ${s%60}s`:`${Math.floor(m/60)}h ${m%60}m`;}
function telaAtual(){return document.querySelector('.tela.ativa')?.id;}
function voltarInicio(){requestSerial++;if(startController)startController.abort();closeDialog('travel-dialog');closeDialog('exit-dialog');closeDialog('help-dialog');G=criarEstadoInicial();viagemPendente=null;mostrarTela('tela-inicio');}
function pedirSaida(action){$('options-menu').open=false;if(!G.ativo){action();return;}exitAction=action;$('exit-dialog').showModal();}

function init(){
  if(!DEMO){try{token=localStorage.getItem('geo_token');}catch{token=null;}if(!token){window.location.href='/index.html';return;}}
  if(DEMO)document.querySelectorAll('.other-games').forEach(a=>{a.textContent='Voltar ao início';a.href='#inicio';a.addEventListener('click',event=>{event.preventDefault();pedirSaida(voltarInicio);});});
  $('btn-iniciar').addEventListener('click',iniciarJogo);$('btn-retry').addEventListener('click',iniciarJogo);$('btn-investigar').addEventListener('click',mostrarInvestigacao);
  $('btn-aeroporto').addEventListener('click',mostrarAeroporto);$('btn-prender').addEventListener('click',prenderCriminoso);$('btn-embarcar').addEventListener('click',()=>viajar(destinoSelecionado));
  $('estado-busca').addEventListener('input',renderizarDestinos);
  $('travel-continue').addEventListener('click',concluirViagem);
  $('travel-dialog').addEventListener('cancel',event=>{event.preventDefault();concluirViagem();});
  $('brand-home').addEventListener('click',event=>{event.preventDefault();pedirSaida(voltarInicio);});
  document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{
    const action=b.dataset.action;
    if(action==='home')pedirSaida(voltarInicio);
    else if(action==='new-case')pedirSaida(iniciarJogo);
    else if(action==='investigate')mostrarInvestigacao();
    else if(action==='notebook')mostrarCaderneta();
    else if(action==='airport')mostrarAeroporto();
  }));
  $('confirm-exit').addEventListener('click',()=>{const action=exitAction;exitAction=null;closeDialog('exit-dialog');if(action)action();});
  $('exit-dialog').addEventListener('close',()=>{exitAction=null;});
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  $('open-help').addEventListener('click',()=>{$('options-menu').open=false;$('help-dialog').showModal();});
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('#options-menu'))$('options-menu').open=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && $('options-menu').open){$('options-menu').open=false;$('options-menu').querySelector('summary').focus();}});
  mostrarTela('tela-inicio');
}
document.addEventListener('DOMContentLoaded',init);
