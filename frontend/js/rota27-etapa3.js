/* GeoEduca | Rota 27 | Etapa 3 - Flashcards: interface em baralho.
   Usa APENAS dados.flashcards ({ frente, verso }) da API atual.
   Não altera fetch, JWT, Gemini, rotas ou limites de tentativas. */
(function () {
  'use strict';

  const page = document.querySelector('.rota27-page');
  let deck = [];
  let current = 0;
  let isFlipped = false;
  let topic = '';
  let savedCards = new Set();

  function asText(v) { return String(v == null ? '' : v); }
  function escapeHtml(v) {
    return asText(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function safeStorageGet() {
    try {
      const parsed = JSON.parse(localStorage.getItem('geo_rota27_flash_saved_v1') || '[]');
      return new Set(Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string').slice(0, 250) : []);
    } catch (_) { return new Set(); }
  }
  function saveStorage() {
    try { localStorage.setItem('geo_rota27_flash_saved_v1', JSON.stringify(Array.from(savedCards).slice(-250))); }
    catch (_) { /* Sem armazenamento local, o uso da ferramenta continua normal. */ }
  }
  function cardKey(card) { return topic + '::' + card.frente + '::' + card.verso; }
  function screen() { return document.querySelector('.r27-flash-screen'); }
  function closeFlash() {
    page?.classList.remove('r27-flash-active');
    const panel = document.getElementById('painelResultado');
    panel?.classList.add('hidden');
    document.querySelector('.r27-hero')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function updateCard(animate) {
    const root = screen();
    if (!root || !deck.length) return;
    const card = deck[current];
    isFlipped = false;
    const flip = root.querySelector('.r27-flash-card');
    if (flip) {
      flip.classList.remove('is-flipped');
      flip.setAttribute('aria-label', 'Flashcard '+(current+1)+' de '+deck.length+'. Clique para revelar a resposta.');
      if (animate) { flip.classList.add('changing'); setTimeout(() => flip.classList.remove('changing'),170); }
    }
    const question = root.querySelector('[data-flash-question]');
    const answer = root.querySelector('[data-flash-answer]');
    if (question) question.textContent = card.frente;
    if (answer) answer.textContent = card.verso;
    const counter = root.querySelectorAll('[data-flash-counter]');
    counter.forEach(n => { n.textContent = (current+1)+' de '+deck.length+' cartões'; });
    const bar = root.querySelector('[data-flash-progress]');
    if (bar) { bar.style.width = ((current+1) / deck.length * 100).toFixed(2)+'%'; }
    const track = root.querySelector('.r27-flash-track');
    if (track) track.setAttribute('aria-valuenow',String(current+1));
    const stage = root.querySelector('[data-flash-stage]');
    if (stage) { stage.textContent = 'Pergunta'; }
    const btnFlip = root.querySelector('[data-flash-action="flip"]');
    if (btnFlip) { btnFlip.innerHTML = '<span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 8a8 8 0 1 0 0 8M20 3v6h-6"/></svg></span> Virar cartão'; }
    const btnSave = root.querySelector('[data-flash-action="save"]');
    const saved = savedCards.has(cardKey(card));
    if (btnSave) { btnSave.setAttribute('aria-pressed',String(saved)); btnSave.innerHTML = '<span aria-hidden="true">'+(saved?'<svg class="r27-icon r27-icon-filled" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/></svg>':'<svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/></svg>')+'</span> '+(saved?'Salvo':'Salvar'); }
    const prev = root.querySelectorAll('[data-flash-action="prev"]');
    prev.forEach(p => { p.disabled = (current===0); });
    const next = root.querySelectorAll('[data-flash-action="next"]');
    next.forEach(p => { p.disabled = (current===deck.length-1); });
    root.querySelectorAll('[data-flash-index]').forEach(btn => {
      const target = Number(btn.getAttribute('data-flash-index'));
      btn.classList.toggle('selected',target===current);
      btn.setAttribute('aria-current',target===current?'true':'false');
    });
  }
  function flip() {
    const element = screen()?.querySelector('.r27-flash-card');
    if (!element) return;
    isFlipped = !isFlipped;
    element.classList.toggle('is-flipped',isFlipped);
    const tag = screen().querySelector('[data-flash-stage]');
    if (tag) tag.textContent = isFlipped?'Resposta':'Pergunta';
    const button = screen().querySelector('[data-flash-action="flip"]');
    if (button) button.innerHTML = isFlipped ? '<span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 8a8 8 0 1 0 0 8M20 3v6h-6"/></svg></span> Ver pergunta' : '<span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 8a8 8 0 1 0 0 8M20 3v6h-6"/></svg></span> Virar cartão';
  }
  function shuffle() {
    if (deck.length < 2) return;
    for (let i=deck.length-1; i>0; i--) {
      const j=Math.floor(Math.random()*(i+1));
      [deck[i],deck[j]]=[deck[j],deck[i]];
    }
    current=0;
    updateSidebar();
    updateCard(false);
  }
  function updateSidebar() {
    const target=screen()?.querySelector('[data-flash-list]');
    if (!target) return;
    target.innerHTML=deck.map((c,i) => '<button type="button" data-flash-index="'+i+'" class="r27-flash-item" aria-label="Ir para flashcard '+(i+1)+'"><span class="r27-flash-item-number">'+String(i+1).padStart(2,'0')+'</span><span>'+escapeHtml(c.frente)+'</span></button>').join('');
  }
  function render(dados) {
    const list=Array.isArray(dados?.flashcards)?dados.flashcards:[];
    if (!list.length) return false;
    deck=list.filter(x=>x && typeof x==='object' && (x.frente || x.verso)).map(x=>({frente:asText(x.frente),verso:asText(x.verso)}));
    if (!deck.length) return false;
    current=0; isFlipped=false; savedCards=safeStorageGet();
    topic=(document.getElementById('inputTema')?.value||'Geografia').trim().slice(0,150);
    const title=document.getElementById('tituloResultado');
    const output=document.getElementById('conteudoResultado');
    if (!title || !output || !page) return false;
    title.textContent='Flashcards';
    output.innerHTML=`<div class="r27-flash-screen" aria-label="Baralho de flashcards">
      <nav class="r27-flash-crumbs" aria-label="Navegação dos Flashcards"><a href="#" data-flash-action="back">Rota 27</a><span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg></span><b>Flashcards</b></nav>
      <header class="r27-flash-head"><div class="r27-flash-name"><span class="r27-flash-icon" aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="7" y="7" width="14" height="14" rx="2"/><path d="M17 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2M11 12h6M11 16h4"/></svg></span><div><h2>Flashcards</h2><p>Revise os principais conteúdos de forma rápida e eficiente.</p></div></div><button type="button" class="r27-flash-back" data-flash-action="back"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 12H5m6-6-6 6 6 6"/></svg> Voltar à Rota 27</button></header>
      <div class="r27-flash-layout">
        <aside class="r27-flash-aside" aria-label="Cartões desta sessão"><div class="r27-flash-aside-title"><span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="7" y="7" width="14" height="14" rx="2"/><path d="M17 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2M11 12h6M11 16h4"/></svg></span><h3>Seu baralho</h3></div><div class="r27-flash-topic"><span class="r27-flash-topic-name">${escapeHtml(topic)}</span><small>${deck.length} cartões gerados</small></div><div data-flash-list class="r27-flash-list"></div><p class="r27-flash-aside-note">Perguntas e respostas produzidas para o tema pesquisado.</p></aside>
        <section class="r27-flash-center" aria-label="Flashcard atual"><div class="r27-flash-topline"><span class="r27-flash-count" data-flash-counter></span><span class="r27-flash-topic-small">${escapeHtml(topic)}</span></div>
        <div class="r27-flash-stage">
          <button type="button" class="r27-flash-arrow r27-flash-arrow-desktop" aria-label="Cartão anterior" data-flash-action="prev"><span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m15 18-6-6 6-6"/></svg></span></button>
          <button type="button" class="r27-flash-card" data-flash-action="flip-card" aria-label="Virar flashcard"><span class="r27-flash-card-inner"><span class="r27-flash-face r27-flash-front"><span class="r27-flash-face-label">GEOGRAFIA • <span data-flash-stage>Pergunta</span></span><span class="r27-flash-body" data-flash-question></span><span class="r27-flash-card-line"></span><span class="r27-flash-hint">Clique para revelar a resposta</span></span><span class="r27-flash-face r27-flash-reverse"><span class="r27-flash-face-label">RESPOSTA</span><span class="r27-flash-body" data-flash-answer></span><span class="r27-flash-card-line"></span><span class="r27-flash-hint">Clique para ver a pergunta</span></span></span></button>
          <button type="button" class="r27-flash-arrow r27-flash-arrow-desktop" aria-label="Próximo cartão" data-flash-action="next"><span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg></span></button>
        </div>
        <div class="r27-flash-mobile-nav"><button type="button" class="r27-flash-arrow" data-flash-action="prev" aria-label="Cartão anterior"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m15 18-6-6 6-6"/></svg></button><span data-flash-counter class="r27-flash-count"></span><button type="button" class="r27-flash-arrow" data-flash-action="next" aria-label="Próximo cartão"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg></button></div>
        <div class="r27-flash-track" role="progressbar" aria-valuemin="0" aria-valuemax="${deck.length}" aria-valuenow="1" aria-label="Progresso do baralho"><span data-flash-progress></span></div>
        <div class="r27-flash-actions"><button type="button" data-flash-action="shuffle" class="r27-flash-secondary"><span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 7h3c4 0 6 10 10 10h5m-4-4 4 4-4 4M3 17h3c1.5 0 3-2 4-4m4-4c1-1 2-2 3-2h4m-4-4 4 4-4 4"/></svg></span> Embaralhar</button><button type="button" data-flash-action="flip" class="r27-flash-primary"><span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 8a8 8 0 1 0 0 8M20 3v6h-6"/></svg></span> Virar cartão</button><button type="button" data-flash-action="save" aria-pressed="false" class="r27-flash-secondary"><span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/></svg></span> Salvar</button></div><p class="r27-flash-storage-note">Cartões salvos ficam neste navegador; não são enviados ao servidor.</p>
        </section>
      </div>
    </div>`;
    page.classList.remove('r27-aula-active');
    page.classList.add('r27-flash-active');
    updateSidebar(); updateCard(false);
    return true;
  }
  function install() {
    if (typeof window.renderizarFlashcards !== 'function') return;
    const oldRenderer=window.renderizarFlashcards;
    window.renderizarFlashcards=function(dados) {
      if (!dados || !Array.isArray(dados.flashcards) || !dados.flashcards.length) return oldRenderer(dados);
      if (!render(dados)) return oldRenderer(dados);
    };
    document.addEventListener('click',e => {
      const action=e.target.closest('[data-flash-action]');
      if (action && screen()) {
        const name=action.getAttribute('data-flash-action');
        if (name==='back') {e.preventDefault();closeFlash();}
        else if (name==='prev' && current>0) {current--;updateCard(true);}
        else if (name==='next' && current<deck.length-1) {current++;updateCard(true);}
        else if (name==='flip'||name==='flip-card') flip();
        else if (name==='shuffle') shuffle();
        else if (name==='save') {const key=cardKey(deck[current]);savedCards.has(key)?savedCards.delete(key):savedCards.add(key);saveStorage();const btn=screen().querySelector('[data-flash-action="save"]');const saved=savedCards.has(key);if(btn){btn.setAttribute('aria-pressed',String(saved));btn.innerHTML='<span aria-hidden="true">'+(saved?'<svg class="r27-icon r27-icon-filled" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/></svg>':'<svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/></svg>')+'</span> '+(saved?'Salvo':'Salvar');}}
        return;
      }
      const jump=e.target.closest('[data-flash-index]');
      if (jump && screen()) {current=Number(jump.getAttribute('data-flash-index'));if(current>=0&&current<deck.length)updateCard(true);return;}
      if (e.target.closest('.r27-result-close')) page?.classList.remove('r27-flash-active');
      if (e.target.closest('.r27-card:not(#card-flash)')) page?.classList.remove('r27-flash-active');
    });
    document.addEventListener('keydown',e=>{
      if(!page?.classList.contains('r27-flash-active')||!screen())return;
      const t=e.target;
      if(t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;
      // Não intercepta setas quando o usuário navega por botões ou links usando o teclado.
      if(e.key==='ArrowRight' && current<deck.length-1){e.preventDefault();current++;updateCard(true)}
      else if(e.key==='ArrowLeft'&&current>0){e.preventDefault();current--;updateCard(true)}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
})();
