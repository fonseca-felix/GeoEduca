"use strict";
// Banco de perguntas extraído sem alterações do HTML original.
const perguntasPositivoData = [
    {p:"Qual estado fica ao norte de Santa Catarina?",   r:"Paraná",        err:["Rio Grande do Sul","São Paulo","Mato Grosso"]},
    {p:"Qual estado fica ao sul do Pará?",               r:"Mato Grosso",   err:["Tocantins","Maranhão","Amazonas"]},
    {p:"Qual estado fica mais a oeste do Brasil?",        r:"Acre",          err:["Rondônia","Amazonas","Roraima"]},
    {p:"Qual estado fica ao norte do Maranhão?",         r:"Pará",          err:["Ceará","Piauí","Tocantins"]},
    {p:"Qual estado não possui litoral?",                r:"Minas Gerais",  err:["Espírito Santo","Rio de Janeiro","Bahia"]},
    {p:"Qual estado é cortado pela Linha do Equador?",   r:"Amapá",         err:["Pará","Roraima","Maranhão"]},
    {p:"Qual estado fica ao leste de Mato Grosso?",      r:"Goiás",         err:["Mato Grosso do Sul","Tocantins","Rondônia"]},
    {p:"Qual estado fica ao sul do Amazonas?",           r:"Rondônia",      err:["Acre","Mato Grosso","Roraima"]},
    {p:"Qual estado faz fronteira com o Uruguai?",       r:"Rio Grande do Sul",err:["Santa Catarina","Paraná","Mato Grosso do Sul"]},
    {p:"Qual estado fica entre Pará e Maranhão?",        r:"Tocantins",     err:["Goiás","Piauí","Bahia"]},
  // Questões adicionais de localização: banco expandido para 30 perguntas.
    {p:"Qual estado fica imediatamente ao sul de Santa Catarina?",r:"Rio Grande do Sul",err:["Paraná", "São Paulo", "Mato Grosso do Sul"]},
    {p:"Qual estado fica imediatamente ao norte do Rio Grande do Sul?",r:"Santa Catarina",err:["Paraná", "São Paulo", "Mato Grosso"]},
    {p:"Qual estado faz fronteira com São Paulo pelo sul?",r:"Paraná",err:["Goiás", "Rio Grande do Sul", "Rio de Janeiro"]},
    {p:"Qual estado limita o Espírito Santo ao norte?",r:"Bahia",err:["Pernambuco", "Sergipe", "Paraná"]},
    {p:"Qual estado fica a leste de Minas Gerais e tem capital Vitória?",r:"Espírito Santo",err:["Goiás", "São Paulo", "Bahia"]},
    {p:"Qual estado faz fronteira com Alagoas ao sul?",r:"Sergipe",err:["Pernambuco", "Paraíba", "Piauí"]},
    {p:"Qual estado faz fronteira com Alagoas ao norte?",r:"Pernambuco",err:["Sergipe", "Bahia", "Rio Grande do Norte"]},
    {p:"Qual estado da Região Norte tem capital Palmas?",r:"Tocantins",err:["Rondônia", "Amapá", "Roraima"]},
    {p:"Qual estado da Região Sul tem capital Curitiba?",r:"Paraná",err:["Santa Catarina", "Rio Grande do Sul", "São Paulo"]},
    {p:"Qual estado da Região Nordeste tem capital Aracaju?",r:"Sergipe",err:["Bahia", "Alagoas", "Piauí"]},
    {p:"Qual estado da Região Centro-Oeste tem capital Cuiabá?",r:"Mato Grosso",err:["Mato Grosso do Sul", "Goiás", "Tocantins"]},
    {p:"Qual estado da Região Norte tem capital Boa Vista?",r:"Roraima",err:["Rondônia", "Acre", "Amazonas"]},
    {p:"Em qual estado fica a cidade de Foz do Iguaçu?",r:"Paraná",err:["Santa Catarina", "Mato Grosso do Sul", "São Paulo"]},
    {p:"Em qual estado fica a Ilha de Marajó?",r:"Pará",err:["Amapá", "Maranhão", "Amazonas"]},
    {p:"Qual estado brasileiro faz fronteira com a Guiana Francesa?",r:"Amapá",err:["Roraima", "Amazonas", "Tocantins"]},
    {p:"Qual estado envolve territorialmente o Distrito Federal?",r:"Goiás",err:["Minas Gerais", "Mato Grosso", "Tocantins"]},
    {p:"Qual estado fica a leste de Rondônia?",r:"Mato Grosso",err:["Amazonas", "Acre", "Roraima"]},
    {p:"Qual estado ocupa a extremidade sul do Brasil?",r:"Rio Grande do Sul",err:["Paraná", "Santa Catarina", "São Paulo"]},
    {p:"Qual estado faz fronteira com a Paraíba ao sul?",r:"Pernambuco",err:["Alagoas", "Bahia", "Ceará"]},
    {p:"Qual estado da Região Norte tem capital Macapá?",r:"Amapá",err:["Acre", "Amazonas", "Pará"]}
  ];

let currentScore=0;
const maxScore=50;
const questionsPerRound=5;
let questionIndex=0;
let secondsElapsed=0;
let timerInterval=null;
let shuffledQuestions=[];
let acceptingAnswer=false;
let advanceTimer=null;
let selectedValue=null;
let selectedButton=null;
let hintUsed=false;
function shuffle(arr){const out=[...arr];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function formatTime(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function startTimer(){if(timerInterval)clearInterval(timerInterval);timerInterval=setInterval(()=>{secondsElapsed++;const clock=document.getElementById('game-time');if(clock)clock.textContent=formatTime(secondsElapsed);},1000);}
function updateHeader(){
  document.getElementById('game-score').textContent=String(currentScore);
  document.getElementById('game-progress').textContent=String(Math.min(questionsPerRound,questionIndex+1));
}
function renderQuestion(){
  if(questionIndex>=questionsPerRound){finalizarJogo();return;}
  acceptingAnswer=true;
  selectedValue=null;
  selectedButton=null;
  hintUsed=false;
  updateHeader();
  const q=shuffledQuestions[questionIndex];
  const options=shuffle([q.r,...q.err]);
  const playArea=document.getElementById('play-area');
  playArea.innerHTML=`
    <div class="position-layout">
      <figure class="reference-map" aria-label="Mapa do Brasil, referência para a pergunta">
        <figcaption class="reference-map-top"><span><i class="map-dot" aria-hidden="true"></i> MAPA DO BRASIL</span><small>27 UFs</small></figcaption>
        <img src="assets/mapa-brasil.svg" alt="Mapa político do Brasil, sem destaque de resposta" draggable="false">
      </figure>
      <section class="answer-panel" aria-labelledby="question-text">
        <p class="prompt-topline">PERGUNTA <span id="current-number">${questionIndex+1}</span> DE ${questionsPerRound}</p>
        <h2 class="question-text" id="question-text"></h2>
        <div id="opcoes" class="options-grid" role="group" aria-label="Escolha uma alternativa"></div>
      </section>
    </div>
    <div class="game-actions">
      <div class="secondary-actions">
        <button type="button" id="hint-btn" class="action-outline" aria-label="Receber uma dica para esta pergunta"><span class="action-icon" aria-hidden="true">♧</span> Dica (1)</button>
        <button type="button" id="skip-btn" class="action-outline"><span class="action-icon" aria-hidden="true">≫</span> Pular</button>
      </div>
      <p id="feedback-msg" class="feedback-msg" role="status" aria-live="polite"></p>
      <button type="button" id="confirm-btn" class="action-confirm" disabled>Confirmar <span aria-hidden="true">→</span></button>
    </div>`;
  document.getElementById('question-text').textContent=q.p;
  const grid=document.getElementById('opcoes');
  options.forEach((value,i)=>{
    const btn=document.createElement('button');btn.type='button';btn.className='answer-option';
    const marker=document.createElement('span');marker.className='option-marker';marker.textContent='ABCD'[i];marker.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.className='option-label';label.textContent=value;
    btn.append(marker,label);
    btn.addEventListener('click',()=>{
      if(!acceptingAnswer || btn.disabled)return;
      grid.querySelectorAll('.answer-option').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false');});
      selectedValue=value;selectedButton=btn;
      btn.classList.add('selected');btn.setAttribute('aria-pressed','true');
      document.getElementById('confirm-btn').disabled=false;
    });
    btn.setAttribute('aria-pressed','false');
    grid.appendChild(btn);
  });
  document.getElementById('confirm-btn').addEventListener('click',()=>{
    if(selectedButton && selectedValue!==null) selectAnswer(selectedButton,selectedValue,q);
  });
  document.getElementById('hint-btn').addEventListener('click',()=>{
    if(!acceptingAnswer || hintUsed)return;
    hintUsed=true;
    // A dica elimina uma alternativa incorreta sem revelar o gabarito.
    const wrong=Array.from(grid.children).filter(b=>b.querySelector('.option-label').textContent!==q.r && b!==selectedButton);
    if(wrong.length){const choice=wrong[Math.floor(Math.random()*wrong.length)];choice.disabled=true;choice.classList.add('eliminated');}
    const hintBtn=document.getElementById('hint-btn');hintBtn.disabled=true;hintBtn.textContent='Dica usada';
    const feedback=document.getElementById('feedback-msg');feedback.textContent='Uma alternativa incorreta foi eliminada.';feedback.className='feedback-msg';
  });
  document.getElementById('skip-btn').addEventListener('click',()=>{
    if(!acceptingAnswer)return;
    acceptingAnswer=false;
    grid.querySelectorAll('.answer-option').forEach(b=>b.disabled=true);
    document.getElementById('hint-btn').disabled=true;
    document.getElementById('skip-btn').disabled=true;
    document.getElementById('confirm-btn').disabled=true;
    const feedback=document.getElementById('feedback-msg');feedback.textContent='Questão pulada. Resposta: '+q.r;feedback.className='feedback-msg';
    questionIndex++;
    advanceTimer=setTimeout(renderQuestion,950);
  });
}
function selectAnswer(btn,value,q){
  if(!acceptingAnswer)return;
  acceptingAnswer=false;
  const options=document.querySelectorAll('.answer-option');
  options.forEach(b=>{b.disabled=true;if(b.querySelector('.option-label').textContent===q.r)b.classList.add('correct');});
  document.getElementById('hint-btn').disabled=true;
  document.getElementById('skip-btn').disabled=true;
  document.getElementById('confirm-btn').disabled=true;
  const feedback=document.getElementById('feedback-msg');
  if(value===q.r){
    btn.classList.add('correct');currentScore+=10;
    feedback.classList.add('success');feedback.textContent='✓ Correto! +10 pontos';
  }else{
    btn.classList.add('wrong');feedback.classList.add('danger');
    feedback.textContent='✕ Incorreto! Resposta correta: '+q.r;
  }
  document.getElementById('game-score').textContent=String(currentScore);
  questionIndex++;
  advanceTimer=setTimeout(renderQuestion,value===q.r?950:1400);
}
function finalizarJogo(){
  if(timerInterval){clearInterval(timerInterval);timerInterval=null;}
  document.getElementById('game-progress').textContent=String(questionsPerRound);
  const tempo=formatTime(secondsElapsed);
  const pct=Math.min(100,Math.round(currentScore/maxScore*100));
  document.getElementById('play-area').innerHTML=`<section class="result-view" aria-live="polite">
    <p class="result-kicker">RODADA CONCLUÍDA</p>
    <h2>Desafio concluído!</h2>
    <p class="result-text">Você respondeu às cinco questões desta rodada.</p>
    <div class="result-stats"><div class="result-stat"><strong>${currentScore} / ${maxScore}</strong><span>Pontos</span></div><div class="result-stat"><strong>${tempo}</strong><span>Tempo</span></div></div>
    <div class="result-actions"><button type="button" id="reiniciar-btn">Nova rodada</button><a href="jogos.html">Voltar aos jogos</a></div>
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
    hist.push({gameId:7,aluno:nome,sala,pontuacao:pontos,tempo,data:new Date().toISOString(),pct});
    localStorage.setItem('geoeduca_results',JSON.stringify(hist));
  }catch(err){console.error('Não foi possível salvar o resultado localmente.',err);}
}
function startGame(){
  if(advanceTimer){clearTimeout(advanceTimer);advanceTimer=null;}
  currentScore=0;questionIndex=0;secondsElapsed=0;acceptingAnswer=false;
  shuffledQuestions=shuffle(perguntasPositivoData).slice(0,questionsPerRound);
  const clock=document.getElementById('game-time');if(clock)clock.textContent='00:00';
  document.body.dataset.screen='partida';
  document.getElementById('tela-inicio').hidden=true;
  document.getElementById('tela-jogo').hidden=false;
  startTimer();renderQuestion();
}
document.addEventListener('DOMContentLoaded',()=>{
  if(typeof initPage==='function')initPage('aluno');
  document.getElementById('btn-iniciar').addEventListener('click',startGame);
});
