const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const runtime=require('./dom-runtime.cjs');let checks=0;
const packageRoot=path.resolve(__dirname,'..'),game=path.basename(packageRoot);
assert.ok(['GeoBr','GeoMundo','geobr','geomundo'].includes(game),'Run from a GeoBr or GeoMundo package');
function eq(a,b,l){assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),l);checks++}function ok(v,l){assert.ok(v,l);checks++}
async function br(){
 const root=packageRoot,r=runtime(root),{run,load,$,tick,document}=r;
 for(const f of ['interface.js','characters.js','sound.js','script.js'])load(f);
 await document.dispatch('DOMContentLoaded');
 eq(run('estadosAPI.length'),27,'BR geography');eq(document.body.dataset.screen,'telaInicial','BR cover');
 $('filtroRegiao').value='all';await $('atlasStart').click();eq(document.body.dataset.screen,'telaPersonagem','BR preparation');
 await $('btnSalvarAluno').click();ok($('characterError').textContent.includes('nome'),'BR name required');
 eq(document.querySelectorAll('.character-option').length,6,'BR six original choices');
 $('alunoNome').value='Ana';$('filtroRegiao').value='Sul';run('selecionarPersonagem("brasa");atualizarModoUI()');await $('btnSalvarAluno').click();
 eq(document.body.dataset.screen,'telaJogo','BR starts');eq(run('gameSession.shuffledIndices.length'),3,'BR region count');eq(run('gameSession.vidas'),3,'BR 3 lives');
 run('usarDica()');eq(document.querySelectorAll('.hint-hidden').length,2,'BR hint removes two');run('usarDica()');eq(document.querySelectorAll('.hint-hidden').length,2,'BR hint only once');
 run('processarResposta(gameSession.currentCorrect)');eq(run('player.xp'),12,'BR first XP');eq(run('gameSession.score'),10,'BR correct count');
 run('processarResposta(gameSession.currentCorrect)');eq(run('player.xp'),12,'BR duplicate blocked');ok(!$('brNext').hidden,'BR manual next appears');
 run('proximaPergunta();processarResposta("wrong")');eq(run('gameSession.vidas'),2,'BR wrong removes life');eq(run('player.xp'),14,'BR wrong XP unchanged');
 run('proximaPergunta()');tick(5100);eq(run('gameSession.vidas'),1,'BR timeout removes life');tick(5000);
 eq(document.body.dataset.screen,'telaResultado','BR final');eq($('finalPrecisao').textContent,'33','BR precision');eq($('atlasSessionXP').textContent,'16','BR session XP');ok($('mascoteResultado').src.includes('brasa.webp'),'BR chosen celebration');
 await $('btnJogarNovamente').click();eq(run('gameSession.vidas'),3,'BR replay lives reset');eq(run('gameSession.score'),0,'BR replay score reset');
 for(let i=0;i<3;i++){run('processarResposta("wrong")');if(i<2)run('proximaPergunta()')}
 tick(1500);eq(document.body.dataset.screen,'telaResultado','BR zero lives ends');ok($('tituloResultado').textContent.includes('novo'),'BR encouraging end');
 run('iniciarJogo();processarResposta("wrong");proximaPergunta();processarResposta("wrong");proximaPergunta();processarResposta("wrong");voltarMenu()');tick(6000);eq(document.body.dataset.screen,'telaInicial','BR old end timer canceled on exit');
 for(const mode of ['capitais','biomas']){
  run(`player.modoAtual='${mode}'`);await $('atlasStart').click();$('alunoNome').value='Teste '+mode;$('filtroRegiao').value='Sudeste';run('atualizarModoUI()');await $('btnSalvarAluno').click();
  eq(run('gameSession.modoJogo'),mode,'BR mode');eq(document.querySelectorAll('.neo-alt').length,4,'BR four options');
  eq(run('gameSession.shuffledIndices.length'),mode==='biomas'?27:4,'BR mode filter');
  if(mode==='capitais')ok($('bandeiraImg').src.includes('assets/maps/'),'BR capital shows map');
  else ok($('biomaDisplayImg').src.includes('img/'),'BR biome image');
  run('voltarMenu()');
 }
 ok(r.storage.has('missaoBrasil_ranking'),'BR ranking key preserved');ok(r.storage.has('geobr_perfis_jogadores')||run('ranking.length>0'),'BR profiles and ranking');
 console.log('GeoBr passed');
}
async function mundo(){
 const root=packageRoot,r=runtime(root),{run,load,$,tick,document}=r;
 for(const f of ['interface.js','data/local-data.js','js/storage.js','js/questions.js','js/map.js','js/ui.js','js/game.js','js/app.js','atlas.js'])load(f);
 await document.dispatch('DOMContentLoaded');
 eq(run('bancoPerguntas.length'),300,'Mundo bank preserved');eq(run('REGIOES.length'),7,'Mundo seven stages');eq(run('REGIOES.map(r=>r.nome)'),['América do Sul','América do Norte','Europa','Ásia','África','Oceania','Mundo'],'Mundo exact stage order');
 ok($('map').children.length>0,'Mundo no-Leaflet fallback');await $('btn-jogar').click();await $('btn-confirmar-nome').click();ok($('mundoNomeErro').textContent.includes('nome'),'Mundo name required');
 eq(document.querySelectorAll('input[name="mundo-personagem"]').length,6,'Mundo six avatars');
 const character=document.querySelectorAll('input[name="mundo-personagem"]').find(n=>n.value==='bone');await character.dispatch('change');
 $('input-nome-jogador').value='Ana Mundo';await $('btn-confirmar-nome').click();eq(document.body.dataset.screen,'telaJogo','Mundo starts');eq(run('personagemMundo'),'bone','Mundo chosen avatar');
 run('checkAnswer(estado.perguntaAtual.resposta)');eq(run('estado.progress.xp'),100,'Mundo base XP');run('checkAnswer(estado.perguntaAtual.resposta)');eq(run('estado.progress.xp'),100,'Mundo duplicate blocked');
 tick(410);ok(!$('overlay-result').classList.contains('hidden'),'Mundo inline feedback');ok($('mundoFeedbackAvatar').src.includes('bone.webp'),'Mundo original celebration');
 run('nextQuestion();usarDica()');eq(run('estado.progress.xp'),85,'Mundo hint cost');ok($('hint-box-wrap').children.length===1,'Mundo hint displays');
 for(let stage=0;stage<7;stage++){
  const remaining=stage===0?4:5;
  for(let n=0;n<remaining;n++){run('checkAnswer(estado.perguntaAtual.resposta)');tick(410);run('nextQuestion()')}
  eq(document.body.dataset.screen,'telaResultado','Mundo stage result');eq(run('estado.regiaoAtualIndex'),stage+1,'Mundo stage index');eq($('mundoJourney').children.length,7,'Mundo journey UI');
  if(stage<6){await $('btn-proximo-nivel').click();eq(document.body.dataset.screen,'telaJogo','Mundo next stage quiz returns');eq(run('estado.vidas'),3,'Mundo next stage restores lives')}
 }
 eq($('mundoVitoriaTitulo').textContent,'Jornada concluída!','Mundo final title');eq(run('estado.progress.acertos'),35,'Mundo full journey 35 correct');eq(run('estado.progress.xp'),3635,'Mundo 7-stage XP, bonus and hint');
 await $('btn-proximo-nivel').click();eq(document.body.dataset.screen,'telaInicial','Mundo final returns cover');eq(run('carregarRanking().length'),1,'Mundo ranking once');run('salvarSessaoMundo()');eq(run('carregarRanking().length'),1,'Mundo ranking deduplicates');
 await $('btn-jogar').click();$('input-nome-jogador').value='Outra partida';await $('btn-confirmar-nome').click();eq(run('estado.progress.xp'),0,'Mundo new session resets XP');
 for(let n=0;n<3;n++){run('checkAnswer((estado.perguntaAtual.resposta+1)%4)');tick(410);if(n<2)run('nextQuestion()')}
 eq(run('estado.vidas'),0,'Mundo third error ends');eq(document.body.dataset.screen,'telaResultado','Mundo game over');eq($('go-erros').textContent,'3','Mundo errors displayed');eq(run('carregarRanking().length'),2,'Mundo final ranking saved');ok($('mundoFimAvatar').src.endsWith('bone_2.webp'),'Mundo original encouraging expression');
 await $('btn-menu-principal').click();tick(6000);eq(document.body.dataset.screen,'telaInicial','Mundo exit clears timers');
 console.log('GeoMundo passed');
}
function staticChecks(){for(const name of [game]){const root=packageRoot,html=fs.readFileSync(path.join(root,'index.html'),'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);eq(new Set(ids).size,ids.length,game+' unique IDs');for(const m of html.matchAll(/\b(?:src|href)="([^"#]+)"/g)){if(m[1].includes(':'))continue;ok(fs.existsSync(path.join(root,m[1])),game+' local '+m[1])}for(const id of ['classic','escot','bone','brasa','maloka','terno'])for(let n=1;n<=4;n++)ok(fs.existsSync(path.join(root,`assets/personagens/${id}_${n}.webp`)),'original expression')}}
(async()=>{staticChecks();if(game.toLowerCase()==='geobr')await br();else await mundo();console.log(checks+' regression checks passed (DOM and clock simulation).')})().catch(e=>{console.error(e);process.exitCode=1});
