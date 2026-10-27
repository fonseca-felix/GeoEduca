const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const runtime=require('./dom-runtime.cjs'),root=path.resolve(__dirname,'..');let checks=0;
const norm=x=>JSON.parse(JSON.stringify(x));
function eq(a,b,message){assert.deepEqual(norm(a),norm(b),message);checks++;}
function ok(value,message){assert.ok(value,message);checks++;}
async function setup(integrated=false){
 const r=runtime(root,{html:integrated?'detetive-brasil.html':'demo.html'});r.load('demo-caso.js');r.load('detetive-brasil.js');
 if(integrated)r.storage.set('geo_token','token-ficticio-de-teste');
 await r.document.dispatch('DOMContentLoaded');return r;
}
async function demo(){
 const r=await setup(),{run,$,document,tick}=r;
 eq(run('ESTADOS.length'),27,'27 UFs');eq(run('telaAtual()'),'tela-inicio','cover');ok(run('DEMO'),'demo mode retained');
 await $('btn-iniciar').click();eq(run('telaAtual()'),'tela-briefing','briefing');eq(run('G.horasRestantes'),72,'initial hours');
 await $('btn-investigar').click();eq(run('telaAtual()'),'tela-investigacao','investigation');eq($('npc-grid').children.length,3,'witnesses');
 ok(!$('progresso-rota').textContent.includes('MG'),'future route hidden');run('prenderCriminoso()');eq(run('G.ativo'),true,'cannot arrest at start');
 run('mostrarCaderneta()');ok($('caderneta-estados').hidden,'no invented notes');ok($('caderneta-lista').textContent.includes('vazia'),'empty notebook');
 run('mostrarInvestigacao();abrirDialogoNPC(estadoAtual().npcs[0],"0-0",0)');eq(run('G.horasRestantes'),70,'new clue costs 2h');eq(run('G.caderneta.length'),1,'clue saved automatically');
 run('abrirDialogoNPC(estadoAtual().npcs[0],"0-0",0)');eq(run('G.horasRestantes'),70,'duplicate does not charge');eq(run('G.caderneta.length'),1,'no duplicate clue');
 run('mostrarCaderneta()');eq($('caderneta-estados').children.length,1,'only states with collected clues');ok(!$('caderneta-estados').textContent.includes('Minas'),'no route reveal in notebook');
 run('mostrarAeroporto()');eq($('aeroporto-estados').children.length,27,'all states available');ok($('aeroporto-estados').children.find(n=>n.getAttribute('aria-label')?.includes('você está aqui')).disabled,'current state disabled');
 $('estado-busca').value='SAO PAULO';await $('estado-busca').dispatch('input');eq($('aeroporto-estados').children.length,1,'accent-insensitive search');
 $('estado-busca').value='zzzzz';await $('estado-busca').dispatch('input');ok($('aeroporto-estados').textContent.includes('Nenhum'),'empty search');
 $('estado-busca').value='';run("regiaoFiltro='Sudeste';renderizarFiltros();renderizarDestinos()");eq($('aeroporto-estados').children.length,4,'regional filter');
 await $('aeroporto-estados').children.find(n=>n.getAttribute('aria-label')==='Minas Gerais, MG').click();ok(!$('btn-embarcar').disabled,'explicit selection');eq(run('G.horasRestantes'),70,'selection does not charge');
 await $('btn-embarcar').click();eq(run('G.horasRestantes'),62,'correct trip costs 8');eq(run('G.rotaIndex'),1,'route advances');eq(run('G.acertosViagem'),1,'correct counter');ok($('travel-dialog').open,'travel feedback opens');
 run("viajar('RJ')");eq(run('G.rotaIndex'),1,'duplicate travel blocked while modal open');eq(run('G.horasRestantes'),62,'duplicate no charge');
 await $('travel-continue').click();eq(run('telaAtual()'),'tela-investigacao','continue after trip');eq($('inv-estado-nome').textContent,'Minas Gerais','correct state shown');
 run('mostrarAeroporto();viajar("SP")');eq(run('G.horasRestantes'),50,'wrong costs 12');eq(run('G.rotaIndex'),1,'wrong does not advance');eq(run('G.errosViagem'),1,'wrong counter');
 await $('travel-dialog').dispatch('cancel');ok(!$('travel-dialog').open,'escape closes feedback');eq(run('telaAtual()'),'tela-investigacao','escape completes transition');
 run('mostrarAeroporto();viajar("RJ");concluirViagem();mostrarAeroporto();viajar("SP");concluirViagem();mostrarAeroporto();viajar("PR");concluirViagem()');
 eq(run('G.rotaIndex'),4,'last stage');eq(run('G.horasRestantes'),26,'resource total');ok($('btn-aeroporto').hidden,'no airport at last stage');ok(!$('btn-prender').hidden,'capture action at last stage');
 eq(run('G.estadosVisitados'),['BA','MG','RJ','SP','PR'],'route states');tick(480000);await $('btn-prender').click();
 eq(run('telaAtual()'),'tela-fim','victory');eq($('fim-pontuacao').textContent,'912','score keeps formula (1000 - 80 - 8)');eq($('fim-estados').textContent,'5','five states');eq($('fim-tempo').textContent,'8m 0s','real time separate');ok($('save-status').textContent.includes('não é enviada'),'no demo ranking claims');ok($('fim-copero').src.includes('celebracao'),'victory pose');
 await $('btn-novo-caso').click();eq(run('G.horasRestantes'),72,'new case reset');eq(run('G.caderneta.length'),0,'notes reset');eq(run('G.errosViagem'),0,'errors reset');
 run('mostrarInvestigacao();mostrarAeroporto()');for(let i=0;i<6;i++)run('viajar("AC");concluirViagem();if(G.ativo)mostrarAeroporto()');
 eq(run('G.horasRestantes'),0,'time clamped at zero');eq(run('telaAtual()'),'tela-fim','defeat');eq($('fim-pontuacao').textContent,'0','defeat score');ok($('fim-copero').src.endsWith('copero-detetive-acolhendo.webp'),'selected encouraging loss pose');
 run('voltarInicio()');eq(run('telaAtual()'),'tela-inicio','home');
 await run('iniciarJogo()');run('mostrarInvestigacao();G.horasRestantes=2;abrirDialogoNPC(estadoAtual().npcs[0],"0-0",0)');eq(run('telaAtual()'),'tela-fim','conversation can exhaust time');
 await run('iniciarJogo()');run('mostrarInvestigacao();mostrarAeroporto();G.horasRestantes=8;viajar("MG");concluirViagem()');eq(run('telaAtual()'),'tela-fim','correct trip can exhaust time');eq(run('G.horasRestantes'),0,'zero trip');
}
async function integration(){
 const r=await setup(true),{run,$,document}=r;
 run('window.calls=[];fetch=async(url,options)=>{window.calls.push({url,options});return {ok:true,json:async()=>url.endsWith("novo-caso")?{sucesso:true,caso:window.DETETIVE_CASO_DEMO}:{sucesso:true}}}');
 await run('iniciarJogo()');eq(run('window.calls[0].url'),'/api/detetive/novo-caso','original new-case endpoint');eq(run('window.calls[0].options.method'),'POST','new-case POST');eq(run('window.calls[0].options.headers.Authorization'),'Bearer token-ficticio-de-teste','original token contract');ok(!run('DEMO'),'integrated mode retained');
 run('mostrarInvestigacao();mostrarAeroporto();viajar("MG");concluirViagem();mostrarAeroporto();viajar("RJ");concluirViagem();mostrarAeroporto();viajar("SP");concluirViagem();mostrarAeroporto();viajar("PR");concluirViagem()');
 await run('finalizarPartida("VITÓRIA")');eq(run('window.calls[1].url'),'/api/detetive/finalizar-partida','original finish endpoint');eq(run('JSON.parse(window.calls[1].options.body)'),{resultado:'VITÓRIA',tempo_jogado_segundos:0,erros_viagem:0,acertos_viagem:4,estados_visitados:['BA','MG','RJ','SP','PR']},'exact original final payload');
 await run('finalizarPartida("VITÓRIA")');eq(run('window.calls.length'),2,'one final save');ok($('save-status').textContent.includes('registrada'),'save success shown');
 run('fetch=async()=>({ok:false,status:500,json:async()=>({error:"<b>Erro de teste</b>"})})');await run('iniciarJogo()');eq(run('telaAtual()'),'tela-carregamento','error stays visible');ok(!$('btn-retry').hidden,'retry available');eq($('loading-msg').textContent,'<b>Erro de teste</b>','API error is text');eq($('loading-msg').children.length,0,'no HTML injection');
 run('fetch=async()=>({ok:true,json:async()=>({sucesso:true,caso:{rota:[]}})})');await run('iniciarJogo()');ok($('loading-msg').textContent.includes('incompleto'),'bad case rejected');
 run('fetch=async()=>({ok:true,json:async()=>({sucesso:true,caso:window.DETETIVE_CASO_DEMO})})');await run('iniciarJogo()');eq(run('telaAtual()'),'tela-briefing','retry recovers');
 run('window.pending=null;fetch=()=>new Promise(resolve=>window.pending=resolve)');const pending=run('iniciarJogo()');run('voltarInicio();window.pending({ok:true,json:async()=>({sucesso:true,caso:window.DETETIVE_CASO_DEMO})})');await pending;eq(run('telaAtual()'),'tela-inicio','stale case response ignored');
 const missing=runtime(root,{html:'detetive-brasil.html'});missing.load('detetive-brasil.js');await missing.document.dispatch('DOMContentLoaded');eq(missing.window.location.href,'/index.html','missing auth redirects as before');
}
function staticChecks(){
 for(const name of ['detetive-brasil.html','demo.html']){const html=fs.readFileSync(path.join(root,name),'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);eq(new Set(ids).size,ids.length,name+' unique IDs');for(const m of html.matchAll(/\b(?:src|href)="([^"#]+)"/g)){const file=m[1];if(file.includes(':')||file==='aluno/jogos.html')continue;ok(fs.existsSync(path.join(root,file)),name+' local '+file)}}
 ok(!fs.readFileSync(path.join(root,'detetive-brasil.html'),'utf8').includes('demo-caso.js'),'production does not load sample case');
 for(const uf of ['ac','al','ap','am','ba','ce','df','es','go','ma','mt','ms','mg','pa','pb','pr','pe','pi','rj','rn','rs','ro','rr','sc','sp','se','to'])ok(fs.existsSync(path.join(root,'assets/maps',uf+'.svg')),'local map '+uf);
}
(async()=>{staticChecks();await demo();await integration();console.log(checks+' verificações aprovadas (DOM, relógio e API simulados).')})().catch(error=>{console.error(error);process.exitCode=1});
