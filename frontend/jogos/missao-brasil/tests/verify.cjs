/* Regression checks for the shipped source. No network or dependencies. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
let checks = 0;
function equal(a,b,label){assert.deepEqual(a,b,label);checks++;}
function ok(value,label){assert.ok(value,label);checks++;}

// A small DOM double lets us run the real rules with a controlled clock.
// Layout is checked separately in the browser; this is not a visual test.
class Node {
  constructor(tag='#text',attrs={}){this.tagName=tag.toUpperCase();this.attrs={...attrs};this.children=[];this.events={};this.dataset={};this.style={};this.hidden='hidden' in attrs;this.value=attrs.value||'';this.checked=false;this.disabled=false;this.open=false;this._text='';this.clientHeight=300;for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}
  get id(){return this.attrs.id} set id(v){this.attrs.id=v}
  get name(){return this.attrs.name} set name(v){this.attrs.name=v}
  get className(){return this.attrs.class||''} set className(v){this.attrs.class=v}
  get classList(){const self=this;return {contains:v=>self.className.split(/\s+/).includes(v),add:(...a)=>{for(const v of a)if(!self.classList.contains(v))self.className+=' '+v},remove:(...a)=>self.className=self.className.split(/\s+/).filter(x=>!a.includes(x)).join(' '),toggle:(v,on)=>{on=on??!self.classList.contains(v);on?self.classList.add(v):self.classList.remove(v);return on}}}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('')} set textContent(v){this._text=String(v);this.children=[]}
  setAttribute(k,v){this.attrs[k]=String(v)} getAttribute(k){return this.attrs[k]??null} removeAttribute(k){delete this.attrs[k]}
  append(...nodes){for(let n of nodes){if(typeof n==='string'){const t=new Node();t.textContent=n;n=t}n.parentElement=this;this.children.push(n)}}
  replaceChildren(...nodes){this.children=[];this._text='';this.append(...nodes)}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn)}
  dispatch(type,extra={}){for(const fn of this.events[type]||[])fn({target:this,preventDefault(){},...extra})}
  click(){if(!this.disabled)this.dispatch('click')}
  focus(){document.activeElement=this}
  showModal(){this.open=true} close(){this.open=false;this.dispatch('close')}
  matches(selector){let checked=selector.includes(':checked');selector=selector.replace(':checked','');if(checked&&!this.checked)return false;const tag=selector.match(/^[\w-]+/);if(tag&&this.tagName!==tag[0].toUpperCase())return false;for(const c of selector.matchAll(/\.([\w-]+)/g))if(!this.classList.contains(c[1]))return false;for(const a of selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g))if(a[2]!==undefined?(this[a[1]]??this.attrs[a[1]])!==a[2]:!Object.hasOwn(this.attrs,a[1]))return false;return true}
  querySelectorAll(selector){return this.children.flatMap(c=>[...(c.matches(selector)?[c]:[]),...c.querySelectorAll(selector)])}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null}
}
const document=new Node('document');
document.createElement=tag=>new Node(tag);
document.createTextNode=text=>{const n=new Node();n.textContent=text;return n};
document.getElementById=id=>{function find(n){if(n.id===id)return n;for(const c of n.children){const f=find(c);if(f)return f}return null}return find(document)};
const stack=[document],voids=new Set(['meta','link','input','img','br','hr']);
for(const token of html.matchAll(/<\/?[a-zA-Z][^>]*>|[^<]+/g)){
 const text=token[0];if(text.startsWith('</')){stack.pop();continue}
 if(!text.startsWith('<')){stack.at(-1).append(document.createTextNode(text));continue}
 const tag=text.match(/^<([\w-]+)/)[1];const attrs={};for(const a of text.slice(tag.length+1).matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]??'';
 const n=new Node(tag,attrs);stack.at(-1).append(n);if(!voids.has(tag)&&!text.endsWith('/>'))stack.push(n);
}
document.body=document.querySelector('body');
document.hidden=false;
document.getElementById('filtroRegiao').value='all';
const clock={now:0,next:1,tasks:new Map()};
function schedule(fn,delay,repeat){const id=clock.next++;clock.tasks.set(id,{fn,due:clock.now+delay,delay,repeat});return id}
function tick(ms){const target=clock.now+ms;for(let guard=0;guard<10000;guard++){const next=[...clock.tasks.entries()].filter(([,t])=>t.due<=target).sort((a,b)=>a[1].due-b[1].due)[0];if(!next)break;const[id,t]=next;clock.now=t.due;if(t.repeat)t.due+=t.delay;else clock.tasks.delete(id);t.fn()}clock.now=target}
const storage=new Map();
const window={matchMedia:()=>({matches:true,addEventListener(){}}),addEventListener(){},scrollTo(){}};
const context=vm.createContext({document,window,console,Image:class{},ResizeObserver:class{observe(){}},getComputedStyle:()=>({gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr'}),setInterval:(fn,d)=>schedule(fn,d,true),setTimeout:(fn,d)=>schedule(fn,d,false),clearInterval:id=>clock.tasks.delete(id),clearTimeout:id=>clock.tasks.delete(id),requestAnimationFrame:()=>0,cancelAnimationFrame(){},performance:{now:()=>clock.now},Date:class extends Date{static now(){return 1800000000000+clock.now}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});
function run(s){return vm.runInContext(s,context)}
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),context);
vm.runInContext(source,context);
const $=id=>document.getElementById(id);

const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
equal(new Set(ids).size,ids.length,'HTML IDs are unique');
for(const match of source.matchAll(/\$\("([^"]+)"\)/g))ok($(match[1]),'existing DOM hook '+match[1]);
for(const match of html.matchAll(/\b(?:src|href)="([^"#]+)"/g))if(!match[1].includes(':'))ok(fs.existsSync(path.join(root,match[1])),'local asset '+match[1]);
const css=fs.readFileSync(path.join(root,'interface.css'),'utf8');
for(const m of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))ok(fs.existsSync(path.join(root,m[1])),'CSS asset '+m[1]);
equal(run('estadosAPI.length'),27,'27 geographic entries');
equal(run('personagens.length'),6,'six original mascots');
for(const id of run('personagens.map(c=>c.id)')){
 for(let n=1;n<=4;n++)ok(fs.existsSync(path.join(root,`assets/personagens/${id}_${n}.webp`)),'original expression');
 ok(fs.existsSync(path.join(root,`assets/celebracao/${id}.webp`)),'approved celebration');
}
equal(run('activeScreen'),'telaInicial','starts on the approved cover');
$('btnIniciarJogo').click();
equal(run('activeScreen'),'telaPersonagem','cover opens preparation');
equal(document.querySelectorAll('input[name="personagem"]').length,6,'all six radios created');
$('formPersonagem').dispatch('submit');
equal($('alunoNome').getAttribute('aria-invalid'),'true','name required');
equal(run('activeScreen'),'telaPersonagem','empty name cannot start');
$('alunoNome').value='Ana';
$('filtroRegiao').value='Sul';
run('atualizarModoUI()');
ok($('missionMeta').textContent.includes('3 perguntas'),'region count changes');
for(const r of document.querySelectorAll('input[name="personagem"]'))r.checked=r.value==='brasa';
$('formPersonagem').dispatch('submit');
equal(run('activeScreen'),'telaJogo','starts quiz');
equal(run('player.nome'),'Ana','name saved');
equal(run('player.personagem'),'brasa','selected original mascot saved');
equal(run('gameSession.shuffledIndices.length'),3,'Sul has three questions');
equal(document.querySelectorAll('.answer-button').length,4,'four answer buttons');
run('processarResposta(gameSession.currentCorrect)');
equal(run('player.xp'),12,'first correct awards 12 XP');
equal(run('gameSession.score'),10,'one correct answer');
equal(run('player.unlockedStates.filter(Boolean).length'),1,'collection unlocks state');
equal($('feedbackAvatar').src,'assets/celebracao/brasa.webp','correct avatar celebration');
run('processarResposta(gameSession.currentCorrect)');
equal(run('player.xp'),12,'second click cannot award twice');
$('btnProxima').click();
equal(run('gameSession.currentIndex'),1,'next question advances once');
run('processarResposta("wrong")');
equal(run('player.xp'),14,'wrong answer awards existing 2 XP');
equal(run('gameSession.combo'),0,'wrong answer breaks sequence');
equal($('feedbackAvatar').src,'assets/personagens/brasa_3.webp','original wrong-answer expression');
$('btnProxima').click();
tick(5100);
equal(run('gameSession.answered'),true,'five-second deadline expires');
equal(run('player.xp'),16,'timeout follows existing scoring');
equal($('feedbackAvatar').src,'assets/personagens/brasa_4.webp','original timeout expression');
tick(5000);
equal(run('activeScreen'),'telaResultado','auto progression reaches result');
equal($('finalAcertos').textContent,'1','actual correct count on result');
equal($('finalPrecisao').textContent,'33','precision based on three questions');
equal($('sessionXP').textContent,'16','session XP displayed in third statistic');
equal($('resultAvatar').src,'assets/celebracao/brasa.webp','result uses chosen mascot');
ok(storage.has('missaoBrasil_neo'),'existing progress storage retained');
ok(storage.has('missaoBrasil_ranking'),'existing ranking storage retained');
equal(run('ranking.length'),1,'ranking has a single player');
$('btnJogarNovamente').click();
equal(run('gameSession.currentIndex'),0,'replay starts at first question');
equal(run('gameSession.score'),0,'replay resets mission score');
equal(run('player.xp'),16,'replay preserves XP');
$('btnVoltarMenu').click();tick(15000);
equal(run('activeScreen'),'telaInicial','exit cancels automatic progression');
equal(run('player.xp'),16,'exit cannot award timeout XP');

for(const mode of ['bandeiras','capitais','biomas']){
 run(`player.modoAtual='${mode}';atualizarModoUI();abrirPersonagem()`);
 $('alunoNome').value='Ana';$('formPersonagem').dispatch('submit');
 equal(run('gameSession.modoJogo'),mode,'selected mode starts');
 equal(run('gameSession.shuffledIndices.length'),mode==='biomas'?27:3,'region respected for '+mode);
 for(let i=0;i<3;i++){
  const answers=run('obterAlternativas(gameSession.currentCorrect,obterPergunta(gameSession.shuffledIndices[gameSession.currentIndex]).tipo)');
  equal(new Set(answers).size,4,'four distinct alternatives');
  ok(answers.includes(run('gameSession.currentCorrect')),'correct answer offered');
  run('processarResposta(gameSession.currentCorrect);proximaPergunta()');
 }
 if(mode!=='biomas')equal(run('activeScreen'),'telaResultado','regional mode finishes');
 run('voltarMenu()');
}
run('player.modoAtual="biomas";atualizarModoUI()');
ok($('containerFiltro').classList.contains('hidden'),'biomas hides region');
ok(!$('biomaNote').classList.contains('hidden'),'biomas explanation visible');
run('abrirPersonagem(true)');$('alunoNome').value='Ana atualizada';$('formPersonagem').dispatch('submit');
equal(run('activeScreen'),'telaInicial','profile edit returns to cover');
equal(run('player.nome'),'Ana atualizada','profile edit saves name');
run('abrirAlbum()');
ok($('listaAlbum').children.length>0,'collection still renders');
run('voltarMenu()');
equal(run('activeScreen'),'telaInicial','collection returns to cover');
console.log(`${checks} checks passed. DOM/clock simulation; browser layout checked separately.`);
