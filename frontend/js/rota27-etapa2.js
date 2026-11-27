/* GeoEduca Rota 27 | ETAPA 2: renderização Aula Completa, sem alterações na API. */
(function () {
  'use strict';
  let currentObserver = null;
  let currentSections = [];
  let seenSections = new Set();

  function clean(value) { return String(value == null ? '' : value); }
  function escapeHtml(value) {
    return clean(value).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function closeLesson() {
    if (currentObserver) { currentObserver.disconnect(); currentObserver = null; }
    document.querySelector('.rota27-page')?.classList.remove('r27-aula-active');
    document.getElementById('painelResultado')?.classList.add('hidden');
    document.querySelector('.r27-hero')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function updateProgress() {
    const pct = currentSections.length ? Math.round(seenSections.size / currentSections.length * 100) : 0;
    const value = document.querySelector('#r27-aula-progress-value');
    const bar = document.querySelector('#r27-aula-progress-fill');
    const next = document.querySelector('#r27-aula-next');
    if (value) value.textContent = pct + '%';
    if (bar) bar.style.width = pct + '%';
    const track = document.querySelector('.r27-aula-progress-track');
    if (track) track.setAttribute('aria-valuenow', String(pct));
    if (next) next.innerHTML = (pct >= 100 ? 'Revisar aula' : 'Continuar leitura') + ' <span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></span>';
  }
  function observeReading() {
    if (currentObserver) currentObserver.disconnect();
    currentSections = Array.from(document.querySelectorAll('.r27-aula-screen [data-r27-section]'));
    seenSections = new Set();
    currentObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) seenSections.add(entry.target.getAttribute('data-r27-section'));
      });
      updateProgress();
    }, { threshold: 0.15, rootMargin: '0px 0px -15% 0px' });
    currentSections.forEach(function(node) { currentObserver.observe(node); });
    updateProgress();
  }
  function continueReading() {
    const next = currentSections.find(function(node) {
      return !seenSections.has(node.getAttribute('data-r27-section'));
    });
    if (next) {
      next.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
      seenSections.add(next.getAttribute('data-r27-section'));
      updateProgress();
    } else {
      seenSections = new Set();
      updateProgress();
      currentSections[0]?.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }
  function lessonHtml(dados) {
    const theme = clean(dados.tema || document.getElementById('inputTema')?.value || 'Geografia').trim();
    const isBiomes = /bioma|cerrado/i.test(theme);
    const heading = /biomas brasileiros/i.test(theme) ? 'Os biomas brasileiros' : theme;
    const topics = Array.isArray(dados.explicacao_topicos) ? dados.explicacao_topicos : [];
    const curiosities = Array.isArray(dados.curiosidades) ? dados.curiosidades : [];
    const preview = topics.slice(0, 2).map(function(t, i) {
      return '<div class="r27-aula-goal"><b><span class="r27-aula-goal-symbol" aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 12 4 4 10-10"/></svg></span> '+escapeHtml(t.titulo || 'Tópico de estudo')+'</b><p>'+escapeHtml(clean(t.conteudo).replace(/\s+/g,' ').slice(0,100))+(clean(t.conteudo).length>100?'…':'')+'</p></div>';
    }).join('');
    const chapters = topics.map(function(t,i) {
      return '<section class="r27-aula-chapter" data-r27-section="topico-'+i+'"><h3>'+escapeHtml(t.titulo||'Tópico de estudo')+'</h3><p>'+escapeHtml(t.conteudo)+'</p></section>';
    }).join('');
    const curiositiesHtml = curiosities.length ? '<section class="r27-aula-curiosities" data-r27-section="curiosidades"><h3>Curiosidades</h3><ul>'+curiosities.map(function(item){return '<li>'+escapeHtml(item)+'</li>'}).join('')+'</ul></section>' : '';
    const photo = isBiomes ? '<img class="r27-aula-photo" src="../assets/rota27/cerrado.jpg" alt="Paisagem ilustrativa do Cerrado, com árvores e chapadas"><p class="r27-aula-photo-caption">Imagem ilustrativa do bioma Cerrado.</p>' : '';
    const estimated = Math.max(1, Math.ceil([dados.introducao,dados.resumo,...topics.map(x=>x.conteudo)].join(' ').split(/\s+/).length/180));
    return '<div class="r27-aula-screen">'
      + '<nav class="r27-aula-crumbs" aria-label="Navegação da Aula"><a href="#" data-r27-action="back">Rota 27</a><span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg></span><b>Aula Completa</b></nav>'
      + '<header class="r27-aula-heading"><div class="r27-aula-name"><span class="r27-aula-title-icon" aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 7v14M3 4h4a5 5 0 0 1 5 5 5 5 0 0 1 5-5h4v15h-4a5 5 0 0 0-5 2 5 5 0 0 0-5-2H3z"/></svg></span><div><h2>Aula Completa</h2><p>Tema: <strong>'+escapeHtml(theme)+'</strong></p></div></div><button class="r27-aula-back" type="button" data-r27-action="back"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 12H5m6-6-6 6 6 6"/></svg> Voltar à Rota 27</button></header>'
      + '<div class="r27-aula-grid"><article class="r27-aula-paper" aria-label="Conteúdo da aula">'
      + '<section data-r27-section="introducao"><h2>'+escapeHtml(heading)+'</h2><p class="r27-aula-intro">'+escapeHtml(dados.introducao)+'</p>'+photo+'</section>'
      + (topics.length ? '<section data-r27-section="objetivos"><h3>O que você vai aprender</h3><div class="r27-aula-goals">'+preview+'</div></section>' : '')
      + '<section class="r27-aula-summary" data-r27-section="resumo"><span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 3h11l3 3v15H5zM15 3v4h4M8 11h8M8 15h8"/></svg></span><div><strong>Em resumo</strong><p>'+escapeHtml(dados.resumo)+'</p></div></section>'
      + chapters + curiositiesHtml
      + '</article><aside class="r27-aula-sidebar" aria-label="Acompanhamento da leitura"><h3><span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 4v16h16M8 15v-4m4 4V7m4 8V9"/></svg></span> Seu estudo</h3>'
      + '<div class="r27-aula-progress-row"><span>Progresso da leitura</span><b id="r27-aula-progress-value" aria-live="polite">0%</b></div><div class="r27-aula-progress-track" role="progressbar" aria-label="Progresso da leitura" aria-valuemin="0" aria-valuemax="100"><div id="r27-aula-progress-fill" class="r27-aula-progress-fill"></div></div>'
      + '<div class="r27-aula-metrics"><div class="r27-aula-metric"><span><i aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></i> Tempo estimado</span><b>'+estimated+' min</b></div><div class="r27-aula-metric"><span><i aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 7v14M3 4h4a5 5 0 0 1 5 5 5 5 0 0 1 5-5h4v15h-4a5 5 0 0 0-5 2 5 5 0 0 0-5-2H3z"/></svg></i> Seções</span><b>'+currentCount(topics,curiosities)+'</b></div><div class="r27-aula-metric"><span><i aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg></i> Tema</span><b>Geografia</b></div></div>'
      + '<button class="r27-aula-next" id="r27-aula-next" type="button">Continuar leitura <span aria-hidden="true"><svg class="r27-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></span></button>'
      + '</aside></div></div>';
  }
  function currentCount(topics,curiosities){return 2+(topics.length?1:0)+topics.length+(curiosities.length?1:0)}
  function install() {
    if (typeof window.renderizarEstudo !== 'function') return;
    const fallback = window.renderizarEstudo;
    window.renderizarEstudo = function(dados) {
      if (!dados || typeof dados !== 'object' || !Array.isArray(dados.explicacao_topicos)) {
        return fallback(dados);
      }
      const output = document.getElementById('conteudoResultado');
      const panelTitle = document.getElementById('tituloResultado');
      const main = document.querySelector('.rota27-page');
      if (!output || !panelTitle || !main) return fallback(dados);
      panelTitle.textContent = 'Aula Completa';
      output.innerHTML = lessonHtml(dados);
      main.classList.add('r27-aula-active');
      setTimeout(observeReading,60);
    };
    document.addEventListener('click',function(e) {
      if (e.target.closest('[data-r27-action="back"]')) {e.preventDefault();closeLesson()}
      else if (e.target.closest('#r27-aula-next')) continueReading();
      else if (e.target.closest('.r27-result-close')) setTimeout(closeLesson,0);
      else if (e.target.closest('.r27-card:not(#card-aula)')) document.querySelector('.rota27-page')?.classList.remove('r27-aula-active');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install);
  else install();
})();
