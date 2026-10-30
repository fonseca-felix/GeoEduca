/* Contratos das regras originais e do fluxo, sem rede nem navegador. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'contratos-originais.json'), 'utf8'));
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }
function sha(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
const original = JSON.parse(fs.readFileSync(path.join(__dirname, 'banco-original.json'), 'utf8'));
check(sha(source.match(/function calcularPontuacao[\s\S]*?\n\}/)[0]) === expected.formula, 'Fórmula original preservada');
(async () => {
const elements = new Map();
class Element {
  constructor(id, classes = '') {
    this.id = id; this.innerText = ''; this.innerHTML = ''; this.textContent = ''; this.style = {}; this.dataset = {}; this.attributes = {}; this.events = {}; this.disabled = false; this.offsetWidth = 500;
    const classesSet = new Set(classes.split(/\s+/));
    this.classList = { add: (...v) => v.forEach(x => classesSet.add(x)), remove: (...v) => v.forEach(x => classesSet.delete(x)), contains: v => classesSet.has(v), toggle: (v, state) => { const next = state === undefined ? !classesSet.has(v) : state; if (next) classesSet.add(v); else classesSet.delete(v); return next; } };
  }
  addEventListener(type, callback) { this.events[type] = callback; }
  setAttribute(key, value) { this.attributes[key] = value; }
  focus() { document.activeElement = this; }
  close() { this.open = false; }
  showModal() { this.open = true; }
}
for (const tag of html.match(/<[^>]+\bid="[^"]+"[^>]*>/g)) {
  const id = tag.match(/\bid="([^"]+)"/)[1];
  check(!elements.has(id), 'ID único: ' + id);
  const e = new Element(id, tag.match(/class="([^"]*)"/)?.[1] || '');
  e.disabled = /\sdisabled(?:\s|>)/.test(tag); elements.set(id, e);
}
const document = {
  body: new Element('body'),
  getElementById(id) { const e = elements.get(id); assert.ok(e, 'Elemento ausente: ' + id); return e; },
  querySelectorAll() { return []; },
  querySelector(selector) { assert.equal(selector, '.clock-metric'); return elements.get('clock-metric'); }
};
elements.set('clock-metric', new Element('clock-metric'));
function latLng(a,b) { return Array.isArray(a) ? {lat:a[0],lng:a[1]} : typeof a === 'object' ? a : {lat:a,lng:b}; }
const bounds = {contains:p => p.lat>=-34.5 && p.lat<=5.5 && p.lng>=-74.5 && p.lng<=-32, pad(){return this;}};
const handlers = {};
const map = { layers: new Set(), center: latLng(-14.235,-51.9253), zoom:4, fits:0,
  setView(p,z) { this.center = latLng(p); if(z!==undefined)this.zoom=z; return this; }, getZoom(){return this.zoom;}, setMaxBounds() { return this; }, invalidateSize(){return this;},
  fitBounds() { this.fits++; return this; }, getCenter(){return this.center;}, removeLayer(v){this.layers.delete(v);return this;}, on(type,fn){handlers[type]=fn;return this;},
  distance(a,b){const r=Math.PI/180;const dlat=(b.lat-a.lat)*r,dlng=(b.lng-a.lng)*r;return 6371000*2*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2));}
};
function layer() { return { layers:new Set(), events:{}, views:new Map(), addTo(target){target.layers?.add(this); return this;}, bindPopup(){return this;},openPopup(){return this;},on(name,fn){this.events[name]=fn;return this;},fire(name,event){this.events[name]?.(event);return this;},getBounds(){return bounds;}}; }
const L = { latLng, latLngBounds:()=>bounds, divIcon:v=>v, map:()=>map, control:{zoom:layer,scale:layer},tileLayer:layer, geoJSON:layer,layerGroup:layer,marker:layer,polyline:layer,featureGroup:layer };
function Symbolizer() {}
let tileNetworkOk=true, tileErrorName='Error';
const protomapsL={leafletLayer:()=>{const l=layer();l.views.set('',{tileCache:{source:{get:async()=>{if(!tileNetworkOk){const e=new Error('Tile indisponível');e.name=tileErrorName;throw e;}return new Map();}}}});return l;},CenteredTextSymbolizer:Symbolizer,PolygonSymbolizer:Symbolizer,LineSymbolizer:Symbolizer,CircleSymbolizer:Symbolizer,LineLabelSymbolizer:Symbolizer};
let networkOk=true;
let serial = 0; const intervals = new Set(), timeouts = new Map();
const context = vm.createContext({ document,L,protomapsL,fetch:async()=>({ok:networkOk,json:async()=>({tiles:['https://tiles.openfreemap.org/test/{z}/{x}/{y}.pbf'],maxzoom:14})}),console:{...console,warn(){}},window:{addEventListener(){}},setTimeout:(fn,ms)=>{if(ms>=1000){timeouts.set(++serial,fn);return serial;}fn();return 0;},clearTimeout:id=>timeouts.delete(id),setInterval:()=>{intervals.add(++serial);return serial;},clearInterval:id=>intervals.delete(id) });
for (const file of ['assets/brasil-estados.js','locais.js','interface.js','mapa-ruas.js','script.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const run = code => vm.runInContext(code,context);
await run('trocarMapa("ruas")');
check(run('tipoMapaAtual')==='ruas' && map.layers.has(run('camadaMapa')),'Mapa detalhado abre por padrão');
run('camadaMapa').events.load();
check(elements.get('mapa-carregando').classList.contains('hidden'),'Mapa carregado encerra indicador');
const reviewed=run('locaisRevisados');
check(reviewed.length===69,'69 cenários selecionados após revisão dos 99 originais');
check(new Set(reviewed.map(l=>l.id)).size===69,'Identificadores dos cenários únicos');
for(const local of reviewed){
 const before=original[Number(local.id.slice(-3))-1];
 check(local.lat===before.lat && local.lng===before.lng,'Coordenadas de referência preservadas: '+local.id);
 check(run('dadosEstados['+JSON.stringify(local.uf)+'].regiao')===run('regioesDoJogo.find(r=>bancoLocais[r].some(l=>l.id==='+JSON.stringify(local.id)+'))'),'UF e região consistentes: '+local.id);
}
check(run('bancoLocais.nordeste.some(l=>l.id==="local-005")'),'Salvador corrigido para Nordeste');
check(run('bancoLocais.nordeste.some(l=>l.id==="local-052")'),'Carolina corrigida para Nordeste');
for(const id of [2,10,14,15,17,19,24,26,29,31,33,34,49,56,57,58,66,71,74,75,80,82,87,95])check(!reviewed.some(l=>Number(l.id.slice(-3))===id),'Cenário sem Street View retirado: '+id);
check(run('calcularPontuacao(0)') === 5000, 'Palpite exato: 5000');
check(run('calcularPontuacao(0.05)') === 5000, '50 metros: 5000');
check(run('calcularPontuacao(300)') === 1839, '300 km: regra exponencial original');
check(run('calcularPontuacao(3001)') === 0, 'Mais de 3000 km: zero');
run('mostrarRegiaoDoDia()'); check(document.body.dataset.tela === 'regiao','Destino antes da partida'); check(intervals.size===0,'Sorteio não inicia cronômetro');
run('comecarPartida()'); check(document.body.dataset.tela==='partida','Abertura da partida');check(intervals.size===1,'Um cronômetro ativo');check(elements.get('btn-enviar').disabled,'Confirmação aguarda marcação');
check(timeouts.size===1,'Aviso de carregamento pendente');
elements.get('sv-iframe').events.load();check(timeouts.size===0,'Load limpa aviso de demora');check(elements.get('paisagem-carregando').classList.contains('hidden'),'Load remove indicador');
const oldId=run('localAtual.id'),oldRegion=run('regiaoSorteada');
run('registrarPalpite({latlng:L.latLng(localAtual.lat,localAtual.lng)});contarTempo();trocarLocalIndisponivel()');
check(run('localAtual.id')!==oldId,'Troca sorteia outro local');check(run('regiaoSorteada')===oldRegion,'Troca permanece na mesma região');check(run('tempoRestante')===120,'Troca devolve dois minutos');check(run('palpiteJogador')===null,'Troca limpa palpite');check(elements.get('btn-enviar').disabled,'Troca bloqueia confirmação até novo palpite');check(run('pontosTotais')===0,'Troca não soma nem desconta pontos');check(intervals.size===1,'Troca não duplica cronômetro');check(document.activeElement===elements.get('btn-trocar-local'),'Foco retorna à ação de troca');
run('registrarPalpite({latlng:L.latLng(80,80)})');check(run('palpiteJogador')===null,'Clique fora dos limites rejeitado');
run('registrarPalpite({latlng:L.latLng(localAtual.lat,localAtual.lng)})');check(!elements.get('btn-enviar').disabled,'Marcação habilita confirmação');
check(!elements.get('btn-ampliar-palpite').disabled,'Marcação permite aproximar palpite');
run('ampliarPalpite()');check(map.zoom===18,'Aproximação chega à escala de rua');check(map.center.lat===run('palpiteJogador.lat') && map.center.lng===run('palpiteJogador.lng'),'Aproximação usa o palpite do jogador');
map.zoom=20;run('ampliarPalpite()');check(map.zoom===20,'Aproximação preserva zoom mais detalhado');
run('verificarPalpite()');check(run('pontosDaRodada')===5000,'Palpite exato calculado');check(run('pontosTotais')===5000,'Pontuação acumulada');check(document.body.dataset.tela==='resultado','Tela de resultado');check(intervals.size===0,'Cronômetro encerrado');check(elements.get('copero-resultado').src.endsWith('comemorando.webp'),'Pose de celebração');
check(run('avisoPaisagemTimeout')===null,'Resultado limpa aviso de carregamento');check(elements.get('btn-trocar-local').disabled,'Troca encerrada com a rodada');check(elements.get('resultado-geografia').innerText.includes(run('dadosEstados[localAtual.uf].nome')),'Resultado revela estado correto');check(elements.get('resultado-curiosidade').innerText.length>15,'Resultado contém descoberta educativa');check(elements.get('resultado-fonte').href.startsWith('https://'),'Fonte educativa disponível');
const completedId=run('localAtual.id');run('trocarLocalIndisponivel()');check(run('localAtual.id')===completedId,'Troca não reinicia rodada concluída');
run('verificarPalpite()');check(run('pontosTotais')===5000,'Reenvio não duplica pontos');
run('mostrarRegiaoDoDia();comecarPartida();');for(let i=0;i<120;i++)run('contarTempo()');
check(run('jogoFinalizado'),'Rodada termina em 120 segundos');check(run('pontosDaRodada')===0,'Sem palpite: zero');check(document.body.dataset.tela==='resultado','Timeout chega ao resultado');check(elements.get('resultado-distancia').innerText==='Sem palpite','Resultado sem distância fictícia');check(run('pontosTotais')===5000,'Total preservado após timeout');
run('fecharResultadoEVoltar()');check(document.body.dataset.tela==='mapa','Comparação no mapa');
run('voltarAoInicio()');check(document.body.dataset.tela==='inicio','Retorno ao início');check(intervals.size===0,'Retorno não deixa cronômetro ativo');
run('mostrarRegiaoDoDia();comecarPartida();voltarAoInicio()');check(intervals.size===0,'Saída da partida interrompe cronômetro');
check(run('avisoPaisagemTimeout')===null,'Saída da partida limpa aviso de carregamento');
run('regiaoSorteada="norte";comecarPartida();pontosTotais=5000;contarTempo();trocarLocalIndisponivel()');check(run('pontosTotais')===5000,'Troca preserva pontuação já acumulada');
run('locaisJaSorteadosPorRegiao.norte=new Set(bancoLocais.norte.map((_,i)=>i));');
const lastId=run('localAtual.id');run('trocarLocalIndisponivel()');check(run('localAtual.id')!==lastId,'Troca não repete o último local ao renovar o ciclo');
run('atualizarModalResultado(localAtual.nome,"500 km",2000,5000)');check(elements.get('copero-resultado').src.endsWith('bussola.webp'),'Reação intermediária usa a bússola');
run('atualizarModalResultado(localAtual.nome,"Sem palpite",0,5000)');check(elements.get('copero-resultado').src.endsWith('apresentando.webp'),'Reação sem pontos encoraja nova exploração');
run('localAtual=locaisRevisados.find(l=>l.id==="local-001");atualizarModalResultado(localAtual.nome,"0 km",5000,10000)');check(elements.get('resultado-curiosidade').innerText.includes('1896'),'Curiosidade específica do Teatro Amazonas');
for(const region of run('regioesDoJogo')) {
  const count=run('bancoLocais['+JSON.stringify(region)+'].length');
  run('regiaoSorteada='+JSON.stringify(region)+';locaisJaSorteadosPorRegiao[regiaoSorteada].clear();');
  const seen=new Set();
  for(let i=0;i<count;i++){run('iniciarNovaRodada()');const p=run('localAtual.id');check(!seen.has(p),'Cenário sem repetição: '+region);seen.add(p);}
  run('iniciarNovaRodada()');check(run('locaisJaSorteadosPorRegiao[regiaoSorteada].size')===1,'Lista reinicia após esgotar: '+region);
}
run('voltarAoInicio();interfaceJogo.enquadrarMapa=true;interfaceJogo.painel("mapa")');check(!run('interfaceJogo.enquadrarMapa'),'Mapa se enquadra ao abrir painel móvel');
await run('trocarMapa("ruas")');check(map.layers.has(run('camadaMapa')),'Camada detalhada disponível');
const oldLayer=run('camadaMapa');await run('trocarMapa("estados")');check(!map.layers.has(oldLayer),'Mapa de estados retira a camada detalhada');check(map.layers.has(run('mapaEstados')),'Mapa local disponível');
oldLayer.events.tileerror();check(elements.get('mapa-indisponivel').classList.contains('hidden'),'Erro antigo não invade outra camada');
const pending=run('trocarMapa("ruas")');await run('trocarMapa("estados")');await pending;
check(run('tipoMapaAtual')==='estados' && run('camadaMapa')===null,'Troca rápida não repõe camada antiga');
networkOk=false;run('configuracaoRuas=null');await run('trocarMapa("ruas")');
check(!elements.get('mapa-indisponivel').classList.contains('hidden'),'Falha da fonte apresenta recuperação');
networkOk=true;await elements.get('btn-recarregar-mapa').events.click();
check(map.layers.has(run('camadaMapa')),'Tentar novamente recupera mapa detalhado');
const recovered=run('camadaMapa');tileNetworkOk=false;
tileErrorName='AbortError';try{await recovered.views.get('').tileCache.source.get({z:14,x:1,y:1},1024);}catch{}
check(elements.get('mapa-indisponivel').classList.contains('hidden'),'Cancelamento ao mudar zoom não vira falha de conexão');
tileErrorName='Error';
let rejected=false;try{await recovered.views.get('').tileCache.source.get({z:14,x:1,y:1},1024);}catch{rejected=true;}
check(rejected,'Erro da fonte de tiles é propagado');recovered.events.load();
check(!elements.get('mapa-indisponivel').classList.contains('hidden'),'Falha parcial continua sinalizada após concluir carregamento');
recovered.events.loading();recovered.events.load();check(elements.get('mapa-indisponivel').classList.contains('hidden'),'Novo enquadramento carregado limpa aviso anterior');
await elements.get('btn-usar-estados').events.click();check(run('tipoMapaAtual')==='estados','Alternativa Estados disponível na recuperação');
for(const match of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)){const ref=match[1];if(/^(?:https?:|about:|\.\/)/.test(ref))continue;check(fs.existsSync(path.join(root,ref)),'Arquivo local: '+ref);}
check(!html.includes('tailwindcss'),'Estilos independem de CDN');
console.log(checks+' verificações passaram.');
})().catch(erro=>{console.error(erro);process.exitCode=1;});
