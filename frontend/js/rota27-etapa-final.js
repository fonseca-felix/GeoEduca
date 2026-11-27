/* GeoEduca | Rota 27 | Etapas 4, 5 e 6.
 * Compatibilidade: usa somente os contratos JSON ja existentes no geminiService.
 * Nao cria endpoints, nao acessa chaves e nao interfere nos jogos.
 */
(function () {
  'use strict';
  const root = document.querySelector('.rota27-page');
  const modes = ['r27-aula-active', 'r27-flash-active', 'r27-quiz-active', 'r27-map-active', 'r27-video-active'];
  const state = { quiz: [], choices: [], current: 0, maps: [], mapIndex: 0, videos: [], videoIndex: 0, topic: '' };
  const str = x => String(x == null ? '' : x);
  const safe = x => str(x).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const inputTopic = () => (document.getElementById('inputTema')?.value || 'Geografia').trim().slice(0, 140);
  const output = () => document.getElementById('conteudoResultado');
  const title = () => document.getElementById('tituloResultado');
  const result = () => document.getElementById('painelResultado');
  const active = () => modes.some(c => root?.classList.contains(c));
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const scrollHome = () => document.querySelector('.r27-hero')?.scrollIntoView({behavior:reducedMotion() ? 'auto' : 'smooth',block:'start'});
  function activate(cls, label, html) {
    if (!root || !output() || !title() || !result()) return false;
    modes.forEach(c => root.classList.remove(c));
    title().textContent = label;
    output().innerHTML = html;
    root.classList.add(cls);
    return true;
  }
  function close() {
    modes.forEach(c => root?.classList.remove(c));
    result()?.classList.add('hidden');
    scrollHome();
  }
  function frame(type, label, subtitle, icon, inner) {
    return `<div class="r27-final-screen r27-${type}-screen" data-r27-final="${type}">
      <nav class="r27-final-crumbs" aria-label="Localização"><a href="#" data-r27-final-action="back">Rota 27</a><span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg></span><b>${safe(label)}</b></nav>
      <header class="r27-final-heading"><div class="r27-final-name"><span class="r27-final-icon" aria-hidden="true">${icon}</span><div><h2>${safe(label)}</h2><p>${safe(subtitle)}</p></div></div><button type="button" class="r27-final-back" data-r27-final-action="back"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 12H5m6-6-6 6 6 6"/></svg> Voltar à Rota 27</button></header>
      ${inner}
    </div>`;
  }

  // QUIZ. O servidor envia objetos pergunta, opcoes.A-D, resposta_correta, explicacao.
  function prepareQuiz(payload) {
    const qs = Array.isArray(payload?.quiz) ? payload.quiz : [];
    const valid = qs.filter(q => q && typeof q.pergunta === 'string' && q.opcoes && ['A','B','C','D'].every(k => typeof q.opcoes[k] === 'string') && /^[ABCD]$/i.test(str(q.resposta_correta).trim()))
      .map(q => ({pergunta:q.pergunta, opcoes:q.opcoes, correta:str(q.resposta_correta).trim().toUpperCase(), explicacao:str(q.explicacao)}));
    if (!valid.length) return false;
    state.quiz = valid; state.choices = Array(valid.length).fill(null); state.current = 0;
    state.topic = inputTopic();
    const inner = `<div class="r27-final-grid"><div class="r27-quiz-main">
      <div class="r27-quiz-meta"><span class="r27-final-pill" data-quiz-count></span><span class="r27-final-topic">${safe(state.topic)}</span></div>
      <div class="r27-quiz-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${valid.length}" aria-valuenow="1" aria-label="Progresso do quiz"><span data-quiz-progress></span></div>
      <section class="r27-quiz-paper" data-quiz-paper aria-live="polite"></section>
      <div class="r27-quiz-foot"><span>Selecione uma alternativa.</span><button type="button" class="r27-final-primary" data-r27-final-action="next" disabled>Próxima questão <svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button></div>
    </div><aside class="r27-final-aside"><h3>Seu desafio</h3><div class="r27-quiz-topic"><b>${safe(state.topic)}</b><small>${valid.length} questões inéditas</small></div><div class="r27-quiz-steps" data-quiz-steps></div><div class="r27-quiz-stat"><span>Acertos</span><strong data-quiz-score>0 / ${valid.length}</strong></div><p class="r27-final-note">Confira a explicação após cada resposta.</p></aside></div>`;
    if (!activate('r27-quiz-active','Quiz',frame('quiz','Quiz','Teste seus conhecimentos com gabarito comentado.','<svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M8 10l1 1 2-2m2 1h3M8 15l1 1 2-2m2 1h3"/></svg>',inner))) return false;
    renderQuiz();
    return true;
  }
  function renderQuiz() {
    const host = document.querySelector('[data-r27-final="quiz"]');
    if (!host) return;
    const i = state.current, q = state.quiz[i], chosen = state.choices[i], total = state.quiz.length;
    if (!q) return renderQuizFinish();
    const steps = host.querySelector('[data-quiz-steps]');
    if (steps) steps.innerHTML = state.quiz.map((v,j) => {
      const answer = state.choices[j];
      const type = answer === null ? (j===i?'active':'') : (answer===v.correta?'correct':'wrong');
      return `<span class="r27-quiz-step ${type}" aria-label="Questão ${j+1}${answer!==null ? ', respondida':''}">${j+1}</span>`;
    }).join('');
    host.querySelector('[data-quiz-count]').textContent=`Questão ${i+1} de ${total}`;
    const prog = host.querySelector('.r27-quiz-progress');
    prog.setAttribute('aria-valuenow',String(i+1));
    host.querySelector('[data-quiz-progress]').style.width = `${((i+1)/total)*100}%`;
    host.querySelector('[data-quiz-score]').textContent = `${state.choices.filter((a,j)=>a!==null && a===state.quiz[j].correta).length} / ${total}`;
    const question = host.querySelector('[data-quiz-paper]');
    question.innerHTML=`<div class="r27-quiz-kicker">QUESTÃO ${String(i+1).padStart(2,'0')}</div><h3>${safe(q.pergunta)}</h3><div class="r27-quiz-options">${['A','B','C','D'].map(k=>`<button type="button" class="r27-quiz-choice${chosen!==null?' answered':''}${chosen!==null&&k===q.correta?' correct':''}${chosen!==null&&k===chosen&&k!==q.correta?' incorrect':''}" data-r27-quiz-choice="${k}" ${chosen!==null?'disabled':''}><span class="r27-quiz-letter">${k}</span><span>${safe(q.opcoes[k])}</span></button>`).join('')}</div>${chosen!==null?`<div class="r27-quiz-feedback ${chosen===q.correta?'success':'error'}" role="status"><b>${chosen===q.correta?'Resposta correta.':'Resposta incorreta.'} A alternativa certa é ${q.correta}.</b><p>${safe(q.explicacao)}</p></div>`:''}`;
    const next = host.querySelector('[data-r27-final-action="next"]');
    next.disabled = chosen===null;
    next.innerHTML = (i===total-1?'Ver meu resultado':'Próxima questão')+' <svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
  }
  function renderQuizFinish() {
    const host = document.querySelector('[data-r27-final="quiz"]'); if (!host) return;
    const total = state.quiz.length;
    const correct = state.choices.filter((a,i)=>a===state.quiz[i].correta).length;
    const percent = Math.round(correct/total*100);
    host.querySelector('[data-quiz-paper]').innerHTML = `<div class="r27-quiz-finish"><div class="r27-quiz-finish-eyebrow">DESAFIO CONCLUÍDO</div><div class="r27-quiz-finish-score">${correct}<small> / ${total}</small></div><h3>Seu desempenho no Quiz</h3><p>Você acertou ${percent}% das questões sobre <b>${safe(state.topic)}</b>.</p><div class="r27-quiz-finish-actions"><button class="r27-final-primary" type="button" data-r27-final-action="retry">Refazer este quiz</button><button class="r27-final-secondary" type="button" data-r27-final-action="back">Voltar à Rota 27</button></div></div>`;
    host.querySelector('[data-quiz-count]').textContent='Quiz concluído';
    host.querySelector('.r27-quiz-progress').setAttribute('aria-valuenow',String(total));
    host.querySelector('[data-quiz-progress]').style.width='100%';
    host.querySelector('[data-quiz-score]').textContent=`${correct} / ${total}`;
    host.querySelector('[data-r27-final-action="next"]').style.display='none';
    host.querySelector('.r27-quiz-foot span').textContent='Você pode refazer o quiz sem gastar outra tentativa.';
  }
  function selectQuiz(letter) {
    const i=state.current; if (state.choices[i]!==null || !['A','B','C','D'].includes(letter)) return;
    state.choices[i]=letter;
    renderQuiz();
  }
  function nextQuiz() { if(state.choices[state.current]===null)return;state.current++;renderQuiz(); }
  function retryQuiz() { state.current=0;state.choices=Array(state.quiz.length).fill(null);const btn=document.querySelector('[data-r27-final="quiz"] [data-r27-final-action="next"]');if(btn)btn.style.display='';const hint=document.querySelector('[data-r27-final="quiz"] .r27-quiz-foot span');if(hint)hint.textContent='Selecione uma alternativa.';renderQuiz(); }

  // MAPAS E MÍDIAS. A API fornece descrições e termos de busca, NÃO imagens reais.
  function mapsSearch(term) {return 'https://www.google.com/search?tbm=isch&q='+encodeURIComponent(term);}
  function prepareMaps(payload) {
    const list=Array.isArray(payload?.midias)?payload.midias:[];
    state.maps=list.filter(m=>m && typeof m.termo_busca_google==='string' && m.termo_busca_google.trim())
      .map(m=>({tipo:str(m.tipo),titulo:str(m.titulo),termo:str(m.termo_busca_google),fonte:str(m.sugestao_fonte)}));
    if(!state.maps.length)return false;
    state.topic=inputTopic();state.mapIndex=0;
    const inner=`<div class="r27-final-grid"><section class="r27-media-main"><div class="r27-media-feature" data-map-feature></div><p class="r27-media-disclaimer">Consulte as imagens e os mapas na fonte original.</p></section><aside class="r27-final-aside"><h3>Explorar mídias</h3><p class="r27-final-note">Selecione uma mídia para explorar.</p><div data-map-list class="r27-media-list"></div></aside></div>`;
    if(!activate('r27-map-active','Mapas & Mídias',frame('map','Mapas & Mídias','Pesquise mapas, imagens geográficas e infográficos confiáveis.','<svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></svg>',inner)))return false;
    renderMaps();return true;
  }
  function renderMaps() {
    const host=document.querySelector('[data-r27-final="map"]');if(!host)return;
    const m=state.maps[state.mapIndex];
    host.querySelector('[data-map-feature]').innerHTML=`<div class="r27-media-topline"><span class="r27-final-pill">${safe(m.tipo||'Mídia geográfica')}</span><span class="r27-final-topic">${safe(state.topic)}</span></div><div class="r27-map-art" aria-hidden="true"><div class="r27-map-art-grid"></div><div class="r27-map-rings"><span></span><span></span><span></span></div><span class="r27-map-art-label">EXPLORAÇÃO CARTOGRÁFICA</span></div><div class="r27-media-description"><div><h3>${safe(m.titulo || m.termo)}</h3><p>Fonte sugerida: <strong>${safe(m.fonte||'Consulte a fonte original')}</strong></p><p class="r27-media-query">Pesquisa: ${safe(m.termo)}</p></div><a target="_blank" rel="noopener noreferrer" class="r27-final-primary r27-final-link" href="${safe(mapsSearch(m.termo))}">Buscar imagens reais <svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M13 5h6v6m0-6-9 9m9 0v5H5V5h5"/></svg></a></div>`;
    host.querySelector('[data-map-list]').innerHTML=state.maps.map((x,i)=>`<button type="button" class="r27-media-item${i===state.mapIndex?' selected':''}" data-r27-map-index="${i}" aria-pressed="${i===state.mapIndex}"><span class="r27-media-item-number">${String(i+1).padStart(2,'0')}</span><span><b>${safe(x.titulo||x.tipo)}</b><small>${safe(x.tipo||'Recomendação')}</small></span><span class="r27-media-chevron"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg></span></button>`).join('');
  }

  // VÍDEOS. A API devolve pesquisas sugeridas no YouTube, não IDs de vídeos.
  function safeYoutube(url,titleText,channel) {
    try {const parsed=new URL(str(url));if (parsed.protocol==='https:' && ['www.youtube.com','youtube.com','m.youtube.com','youtu.be'].includes(parsed.hostname))return parsed.href;}catch(_){}
    return 'https://www.youtube.com/results?search_query='+encodeURIComponent((titleText+' '+channel).trim());
  }
  function prepareVideos(payload) {
    const list=Array.isArray(payload?.videos_recommendedados)?payload.videos_recommendedados:[];
    state.videos=list.filter(v=>v && typeof v==='object' && (v.titulo_sugerido||v.canal))
      .map(v=>({titulo:str(v.titulo_sugerido),canal:str(v.canal),url:safeYoutube(v.url_busca_pronta,str(v.titulo_sugerido),str(v.canal))}));
    if (!state.videos.length)return false;
    state.topic=inputTopic();state.videoIndex=0;
    const inner=`<div class="r27-final-grid"><section class="r27-media-main"><div data-video-feature class="r27-video-feature"></div></section><aside class="r27-final-aside"><h3>Sugestões de vídeos</h3><p class="r27-final-note">Selecione uma recomendação.</p><div class="r27-media-list" data-video-list></div></aside></div>`;
    if(!activate('r27-video-active','Vídeos',frame('video','Vídeos','Explore recomendações de canais e vídeos educativos.','<svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></svg>',inner)))return false;
    renderVideos();return true;
  }
  function renderVideos() {
    const host=document.querySelector('[data-r27-final="video"]');if(!host)return;
    const v=state.videos[state.videoIndex];
    host.querySelector('[data-video-feature]').innerHTML=`<div class="r27-media-topline"><span class="r27-final-pill">VÍDEOS EDUCATIVOS</span><span class="r27-final-topic">${safe(state.topic)}</span></div><div class="r27-video-poster"><span class="r27-video-play" aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 5 11 7-11 7z"/></svg></span><span class="r27-video-poster-note">Conteúdo no YouTube</span></div><div class="r27-media-description"><div><h3>${safe(v.titulo||'Sugestão educativa')}</h3><p>Canal sugerido: <strong>${safe(v.canal||'A confirmar')}</strong></p><p class="r27-media-query">Recomendação de pesquisa no YouTube.</p></div><a class="r27-final-primary r27-final-link" href="${safe(v.url)}" target="_blank" rel="noopener noreferrer">Pesquisar no YouTube <svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M13 5h6v6m0-6-9 9m9 0v5H5V5h5"/></svg></a></div>`;
    host.querySelector('[data-video-list]').innerHTML=state.videos.map((x,i)=>`<button type="button" class="r27-media-item${i===state.videoIndex?' selected':''}" data-r27-video-index="${i}" aria-pressed="${i===state.videoIndex}"><span class="r27-media-item-number"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 5 11 7-11 7z"/></svg></span><span><b>${safe(x.titulo||'Vídeo educativo')}</b><small>${safe(x.canal||'YouTube')}</small></span><span class="r27-media-chevron"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg></span></button>`).join('');
  }

  function install() {
    if (!root) return;
    for(const [name, make] of [['renderizarQuiz',prepareQuiz],['renderizarMapas',prepareMaps],['renderizarVideos',prepareVideos]]){
      const original=window[name];if(typeof original!=='function')continue;
      window[name]=function(data){try{if(make(data))return;}catch(error){console.error('Rota 27 UI:',error)}return original(data)};
    }
    document.addEventListener('click',e=>{
      const action=e.target.closest('[data-r27-final-action]');
      if(action){const type=action.getAttribute('data-r27-final-action');
        if(type==='back'){e.preventDefault();close();return}
        if(type==='next'){nextQuiz();return}
        if(type==='retry'){retryQuiz();return}
      }
      const choice=e.target.closest('[data-r27-quiz-choice]');if(choice){selectQuiz(choice.dataset.r27QuizChoice);return}
      const map=e.target.closest('[data-r27-map-index]');if(map){const idx=Number(map.dataset.r27MapIndex);if(idx>=0&&idx<state.maps.length){state.mapIndex=idx;renderMaps()}return}
      const video=e.target.closest('[data-r27-video-index]');if(video){const idx=Number(video.dataset.r27VideoIndex);if(idx>=0&&idx<state.videos.length){state.videoIndex=idx;renderVideos()}return}
      // Se outra ferramenta for selecionada, o CSS anterior não pode ocultar a capa.
      if(e.target.closest('.r27-result-close')&&active())modes.forEach(c=>root.classList.remove(c));
    });
    // O voltar dos navegadores e o fluxo de login existentes permanecem originais.
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
