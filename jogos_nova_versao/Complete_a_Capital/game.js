"use strict";
// Banco das 27 unidades federativas copiado do HTML original enviado.
const estadosBR = [
    {nome:"Acre",          sigla:"AC", capital:"Rio Branco",       regiao:"Norte",        icon:"<i class='fa-solid fa-tree'></i>"},
    {nome:"Alagoas",       sigla:"AL", capital:"Maceió",           regiao:"Nordeste",     icon:"<i class='fa-solid fa-umbrella-beach'></i>"},
    {nome:"Amapá",         sigla:"AP", capital:"Macapá",           regiao:"Norte",        icon:"<i class='fa-solid fa-leaf'></i>"},
    {nome:"Amazonas",      sigla:"AM", capital:"Manaus",           regiao:"Norte",        icon:"<i class='fa-solid fa-tree'></i>"},
    {nome:"Bahia",         sigla:"BA", capital:"Salvador",         regiao:"Nordeste",     icon:"<i class='fa-solid fa-drum'></i>"},
    {nome:"Ceará",         sigla:"CE", capital:"Fortaleza",        regiao:"Nordeste",     icon:"<i class='fa-solid fa-sun'></i>"},
    {nome:"Espírito Santo",sigla:"ES", capital:"Vitória",          regiao:"Sudeste",      icon:"<i class='fa-solid fa-mug-hot'></i>"},
    {nome:"Goiás",         sigla:"GO", capital:"Goiânia",          regiao:"Centro-Oeste", icon:"<i class='fa-solid fa-wheat-awn'></i>"},
    {nome:"Maranhão",      sigla:"MA", capital:"São Luís",         regiao:"Nordeste",     icon:"<i class='fa-solid fa-house-chimney'></i>"},
    {nome:"Mato Grosso",   sigla:"MT", capital:"Cuiabá",           regiao:"Centro-Oeste", icon:"<i class='fa-solid fa-fish'></i>"},
    {nome:"Mato Grosso do Sul",sigla:"MS",capital:"Campo Grande",  regiao:"Centro-Oeste", icon:"<i class='fa-solid fa-feather'></i>"},
    {nome:"Minas Gerais",  sigla:"MG", capital:"Belo Horizonte",   regiao:"Sudeste",      icon:"<i class='fa-solid fa-cheese'></i>"},
    {nome:"Pará",          sigla:"PA", capital:"Belém",            regiao:"Norte",        icon:"<i class='fa-solid fa-cloud-showers-heavy'></i>"},
    {nome:"Paraíba",       sigla:"PB", capital:"João Pessoa",      regiao:"Nordeste",     icon:"<i class='fa-solid fa-cloud-sun'></i>"},
    {nome:"Paraná",        sigla:"PR", capital:"Curitiba",         regiao:"Sul",          icon:"<i class='fa-solid fa-tree'></i>"},
    {nome:"Pernambuco",    sigla:"PE", capital:"Recife",           regiao:"Nordeste",     icon:"<i class='fa-solid fa-umbrella'></i>"},
    {nome:"Piauí",         sigla:"PI", capital:"Teresina",         regiao:"Nordeste",     icon:"<i class='fa-solid fa-sun'></i>"},
    {nome:"Rio de Janeiro",sigla:"RJ", capital:"Rio de Janeiro",   regiao:"Sudeste",      icon:"<i class='fa-solid fa-mountain'></i>"},
    {nome:"Rio Grande do Norte",sigla:"RN",capital:"Natal",        regiao:"Nordeste",     icon:"<i class='fa-solid fa-umbrella-beach'></i>"},
    {nome:"Rio Grande do Sul",sigla:"RS",capital:"Porto Alegre",   regiao:"Sul",          icon:"<i class='fa-solid fa-mug-hot'></i>"},
    {nome:"Rondônia",      sigla:"RO", capital:"Porto Velho",      regiao:"Norte",        icon:"<i class='fa-solid fa-train'></i>"},
    {nome:"Roraima",       sigla:"RR", capital:"Boa Vista",        regiao:"Norte",        icon:"<i class='fa-solid fa-mountain'></i>"},
    {nome:"Santa Catarina",sigla:"SC", capital:"Florianópolis",    regiao:"Sul",          icon:"<i class='fa-solid fa-apple-whole'></i>"},
    {nome:"São Paulo",     sigla:"SP", capital:"São Paulo",        regiao:"Sudeste",      icon:"<i class='fa-solid fa-city'></i>"},
    {nome:"Sergipe",       sigla:"SE", capital:"Aracaju",          regiao:"Nordeste",     icon:"<i class='fa-solid fa-water'></i>"},
    {nome:"Tocantins",     sigla:"TO", capital:"Palmas",           regiao:"Norte",        icon:"<i class='fa-solid fa-sun'></i>"},
    {nome:"Distrito Federal",sigla:"DF",capital:"Brasília",        regiao:"Centro-Oeste", icon:"<i class='fa-solid fa-building-columns'></i>"}
  ];
let currentScore = 0;
const maxScore = 270;
let secondsElapsed = 0;
let timerInterval = null;
let currentTarget = null;
let targetName = "";
let hintAttempts = 1;
let statesQueue = [];
let responsePending = false;
let roundNumber = 0;
const totalStates = estadosBR.length;
function shuffle(arr) { const out = [...arr]; for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out; }
function formatTime(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function normalizar(text){return text.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');}
function startTimer(){if(timerInterval)clearInterval(timerInterval);timerInterval=setInterval(()=>secondsElapsed++,1000);}
function updateHeader(){document.getElementById('game-score').textContent=currentScore;document.getElementById('game-step').textContent=Math.min(roundNumber+1,totalStates);}
function renderGame(){
  responsePending=false;
  if(statesQueue.length===0){finalizarJogo();return;}
  currentTarget=statesQueue[0];targetName=currentTarget.capital.toUpperCase();hintAttempts=1;
  const lacuna=targetName.split('').map(c=>c===' '? '  ' :(Math.random()>.7?c:'_')).join('');
  updateHeader();
  const playArea=document.getElementById('play-area');
  const percent=Math.min(100,Math.round((roundNumber/totalStates)*100));
  playArea.innerHTML=`
    <div class="capital-layout">
      <section class="capital-prompt" aria-label="Pergunta atual">
        <p class="prompt-topline">CAPITAL ${String(roundNumber+1).padStart(2,'0')} DE ${totalStates}</p>
        <h2 class="prompt-title">Qual é a capital deste estado?</h2>
        <div class="state-block">
          <p class="region-label">REGIÃO ${currentTarget.regiao}</p>
          <p class="state-name">${currentTarget.nome}</p>
          <span class="state-sigla">${currentTarget.sigla}</span>
        </div>
        <p class="puzzle-label">COMPLETE O NOME</p>
        <p class="capital-lacuna" aria-label="Letras reveladas da capital">${lacuna}</p>
      </section>
      <section class="answer-panel" aria-label="Responder pergunta">
        <p class="answer-kicker">SUA RESPOSTA</p>
        <h3 class="answer-title">Você sabe a capital?</h3>
        <p class="answer-help">Escreva o nome completo. Acentos são opcionais.</p>
        <form class="capital-form" id="capital-form">
          <input id="capital-input" class="capital-input" type="text" maxlength="30" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Nome da capital" placeholder="Digite a capital..." required>
          <div class="actions">
            <button class="action-btn primary" id="confirmar-btn" type="submit">Confirmar <span aria-hidden="true">→</span></button>
            <button class="action-btn" id="dica-btn" type="button">Dica (1)</button>
            <button class="action-btn" id="pular-btn" type="button">Pular</button>
          </div>
        </form>
        <div id="feedback-msg" class="feedback-msg" role="status" aria-live="polite"></div>
        <div class="small-progress" aria-label="Progresso das capitais respondidas">
          <div class="progress-top"><span>PROGRESSO</span><strong>${roundNumber} de ${totalStates}</strong></div>
          <div class="progress-track"><span style="width:${percent}%"></span></div>
        </div>
      </section>
    </div>`;
  document.getElementById('capital-form').addEventListener('submit',e=>{e.preventDefault();verificarResposta();});
  document.getElementById('dica-btn').addEventListener('click',obterDica);
  document.getElementById('pular-btn').addEventListener('click',pularPergunta);
}
function verificarResposta(){
  if(responsePending)return;
  const input=document.getElementById('capital-input');
  if(!input)return;
  const feedback=document.getElementById('feedback-msg');
  const val=normalizar(input.value), ans=normalizar(targetName);
  if(val===ans){
    responsePending=true;currentScore+=10;roundNumber++;
    statesQueue.shift();document.getElementById('game-score').textContent=currentScore;
    feedback.style.color='var(--color-success)';feedback.textContent='✓ Correto! +10 pontos';
    document.getElementById('confirmar-btn').disabled=true;
    document.getElementById('dica-btn').disabled=true;
    document.getElementById('pular-btn').disabled=true;
    setTimeout(renderGame,650);
  }else{feedback.style.color='var(--color-danger)';feedback.textContent='✕ Incorreto. Tente novamente.';}
}
function pularPergunta(){
  if(responsePending)return;
  responsePending=true;
  const feedback=document.getElementById('feedback-msg');
  feedback.style.color='#77717d';feedback.textContent='A resposta era '+targetName+'. Ela voltará ao final.';
  const pulado=statesQueue.shift();statesQueue.push(pulado);
  if(window.GeoCharacter && typeof window.GeoCharacter.react==='function')window.GeoCharacter.react('thinking');
  setTimeout(renderGame,1000);
}
function obterDica(){
  if(hintAttempts<=0 || responsePending)return;
  hintAttempts--;
  const btn=document.getElementById('dica-btn');btn.textContent='Dica (0)';btn.disabled=true;
  document.getElementById('capital-input').value=targetName.substring(0,Math.ceil(targetName.length/2));
  const feedback=document.getElementById('feedback-msg');
  feedback.style.color='#946c17';feedback.textContent='A capital começa com: "'+targetName.substring(0,3)+'"';
  if(window.GeoCharacter && typeof window.GeoCharacter.react==='function')window.GeoCharacter.react('hint');
}
function finalizarJogo(){
  if(timerInterval){clearInterval(timerInterval);timerInterval=null;}
  document.getElementById('game-step').textContent=totalStates;
  const tempo=formatTime(secondsElapsed);
  const pct=Math.min(100,Math.round(currentScore/maxScore*100));
  document.getElementById('play-area').innerHTML=`<section class="result-view" aria-live="polite">
    <p class="result-kicker">TODAS AS CAPITAIS CONCLUÍDAS</p>
    <h2>Desafio concluído!</h2>
    <p class="result-text">Você percorreu as 27 unidades federativas do Brasil.</p>
    <div class="result-stats"><div class="result-stat"><strong>${currentScore} / ${maxScore}</strong><span>Pontos</span></div><div class="result-stat"><strong>${tempo}</strong><span>Tempo</span></div></div>
    <div class="result-actions"><button type="button" id="reiniciar-btn">Jogar novamente</button><a href="jogos.html">Voltar aos jogos</a></div>
  </section>`;
  document.getElementById('reiniciar-btn').addEventListener('click',startGame);
  salvarResultado(currentScore,tempo,pct);
}
function salvarResultado(pontos,tempo,pct){
  try{
    const hist=JSON.parse(localStorage.getItem('geoeduca_results')||'[]');
    const geoUser=JSON.parse(localStorage.getItem('geoeduca_user')||'{}');
    const nome=geoUser.name||localStorage.getItem('geoeduca_user_name')||'Aluno';
    const sala=geoUser.sala||'';
    hist.push({gameId:9,aluno:nome,sala,pontuacao:pontos,tempo,data:new Date().toISOString(),pct});
    localStorage.setItem('geoeduca_results',JSON.stringify(hist));
  }catch(err){console.error('Não foi possível salvar o resultado localmente.',err);}
}
function startGame(){
  currentScore=0;secondsElapsed=0;roundNumber=0;responsePending=false;
  statesQueue=shuffle(estadosBR);
  document.body.dataset.screen='partida';
  document.getElementById('tela-inicio').hidden=true;
  document.getElementById('tela-jogo').hidden=false;
  document.getElementById('game-score').textContent='0';
  document.getElementById('game-step').textContent='1';
  startTimer();renderGame();
}
document.addEventListener('DOMContentLoaded',()=>{
  if(typeof initPage==='function')initPage('aluno');
  document.getElementById('btn-iniciar').addEventListener('click',startGame);
});
