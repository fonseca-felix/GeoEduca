document.addEventListener('DOMContentLoaded', () => {
  // Inject sidebar BEFORE initPage
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());

  const user = initPage('aluno');
  if (!user) return; // redirect handled in auth

  let provas = [];
  let currentProva = null;
  let isTakingExam = false;
  let currentQuestionIndex = 0;

  const availableEl = document.getElementById('available-exams');
  const scheduledEl = document.getElementById('scheduled-exams');
  const gradedEl = document.getElementById('graded-exams');

  function renderExamList(container, list, status) {
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `<p style="color:var(--color-text-secondary);font-size:0.9rem;padding:0.5rem 0;">Nenhuma prova nesta seção.</p>`;
      return;
    }

    container.innerHTML = list.map(exam => `
      <div class="exam-card ${status}">
        <div class="exam-info">
          <h3 class="exam-title">${exam.titulo}</h3>
          <div class="exam-subject">${exam.rubrica || '—'}</div>
          <div class="exam-details">
            <span class="detail-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="2" x2="9" y2="6"></line><line x1="15" y1="2" x2="15" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${exam.questoes ? exam.questoes.length : 0} Questões
            </span>
          </div>
        </div>
        <div class="exam-actions">
          <span class="status-badge ${status}">
            ${status === 'available' ? 'Liberada' : (exam.nota !== null && exam.nota !== undefined) ? 'Corrigida' : 'Entregue'}
          </span>
          ${status === 'available'
            ? `<button class="btn-exam primary" onclick="confirmExam('${exam.id}')">Iniciar Prova</button>`
            : (exam.nota !== null && exam.nota !== undefined)
              ? `<div style="margin-top:0.35rem; display:flex; flex-direction:column; align-items:flex-end; gap:0.4rem;">
                   <div style="display:flex; align-items:center; gap:0.5rem;">
                     <span style="font-size:1.1rem; font-weight:800; color:#15803d; background:#dcfce7; padding:0.25rem 0.75rem; border-radius:8px; border:1px solid #86efac; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                       Nota: ${Number(exam.nota) % 1 === 0 ? Number(exam.nota).toFixed(0) : Number(exam.nota).toFixed(1)}
                     </span>
                     <span style="font-size:0.75rem; color:#15803d; font-weight:700; background:#f0fdf4; border:1px solid #bbf7d0; padding:0.2rem 0.5rem; border-radius:6px;">Concluída</span>
                   </div>
                   <button class="btn-exam outline" onclick="openStudentExamReview('${exam.id}')" style="font-size:0.75rem; padding:0.4rem 0.75rem; border-color:#10b981; color:#065f46; background:#f0fdf4; display:inline-flex; align-items:center; gap:0.4rem; font-weight:700; border-radius:6px; cursor:pointer; box-shadow:0 1px 2px rgba(16,185,129,0.1);" title="Ver correção detalhada e notas por questão">
                     <i class="fa-solid fa-file-circle-check"></i> Ver Correção & Feedback
                   </button>
                 </div>`
              : `<div style="font-size:0.85rem; color:#d97706; background:#fef3c7; border:1px solid #fde68a; padding:0.3rem 0.6rem; border-radius:6px; margin-top:0.25rem; font-weight:600;">
                   <i class="fa-solid fa-clock"></i> Aguardando Correção
                 </div>`
          }
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }

  let questoesPenalizadas = new Set();

  function buildProvaTakingBody(prova) {
    const questoes = prova.questoes || [];
    if (!questoes.length) return '<div style="color:#6b7280;text-align:center;">Esta prova não tem questões.</div>';

    const letters = ['a', 'b', 'c', 'd', 'e'];
    const html = questoes.map((q, idx) => {
      const displayStyle = idx === 0 ? 'block' : 'none';
      if (q.tipo === 'alternativa') {
        const options = q.opcoes || [];
        return `
          <div class="question-step" id="q-step-${idx}" style="display:${displayStyle};">
            <div class="exam-question-text">${escapeHtml(q.texto)}</div>
            <div style="display:flex;flex-direction:column;">
              ${options.map((opt, optIdx) => `
                <label class="exam-option-label" onclick="updateNavGrid(${idx})">
                  <div class="exam-option-indicator">${letters[optIdx] || '-'}</div>
                  <input type="radio" name="q-${q.id}" value="${escapeHtml(opt)}" />
                  <span style="color:#334155;font-weight:500;">${escapeHtml(opt)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;
      }

      // descritiva
      return `
        <div class="question-step" id="q-step-${idx}" style="display:${displayStyle};">
          <div class="exam-question-text">${escapeHtml(q.texto)}</div>
          <textarea id="q-${q.id}" oninput="updateNavGrid(${idx})" style="width:100%; min-height:150px; padding:1rem; border:1px solid #d1d5db; border-radius:10px; font-family:Inter, sans-serif; font-size:1rem; outline:none; box-sizing:border-box; resize:vertical;"></textarea>
        </div>
      `;
    }).join('');

    return html;
  }

  function buildNavGrid(prova) {
    const questoes = prova.questoes || [];
    const grid = document.getElementById('exam-nav-grid');
    if (!grid) return;
    
    grid.innerHTML = questoes.map((_, idx) => `
      <div class="nav-dot" id="nav-dot-${idx}" onclick="jumpToQuestion(${idx})">
        ${idx + 1}
      </div>
    `).join('');
  }

  window.updateNavGrid = (idx) => {
    if (!currentProva) return;
    const q = currentProva.questoes[idx];
    const dot = document.getElementById(`nav-dot-${idx}`);
    if (!dot || questoesPenalizadas.has(idx)) return;
    
    let isAnswered = false;
    if (q.tipo === 'alternativa') {
      const selected = document.querySelector(`input[name="q-${q.id}"]:checked`);
      isAnswered = !!selected;
    } else {
      const ta = document.getElementById(`q-${q.id}`);
      isAnswered = ta && ta.value.trim().length > 0;
    }
    
    if (isAnswered) dot.classList.add('answered');
    else dot.classList.remove('answered');
    
    checkAllAnswered();
  };

  function checkAllAnswered() {
    if (!currentProva || !currentProva.questoes) return;
    const total = currentProva.questoes.length;
    let answeredCount = 0;
    for (let i = 0; i < total; i++) {
      const dot = document.getElementById(`nav-dot-${i}`);
      if (dot && (dot.classList.contains('answered') || dot.classList.contains('penalized'))) {
        answeredCount++;
      }
    }
    const btnSubmit = document.getElementById('btn-submit-prova');
    if (btnSubmit) {
      if (answeredCount === total) {
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = '1';
        btnSubmit.style.cursor = 'pointer';
      } else {
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = '0.5';
        btnSubmit.style.cursor = 'not-allowed';
      }
    }
  }

  window.jumpToQuestion = (idx) => {
    if (idx === currentQuestionIndex) return;
    changeQuestion(idx - currentQuestionIndex);
  };

  window.closeModal = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active');
    if (id === 'exam-taking-modal') isTakingExam = false;
  };

  window.confirmExam = (id) => {
    const exam = provas.find(e => e.id === id);
    if (!exam) return;
    currentProva = exam;

    const titleEl = document.getElementById('exam-modal-title');
    if (titleEl) titleEl.textContent = `${exam.titulo}`;

    const btn = document.getElementById('btn-confirm-exam');
    if (!btn) return;

    btn.onclick = async () => {
      closeModal('exam-modal');
      const modal = document.getElementById('exam-taking-modal');
      if (!modal) return;

      // Solicitar Tela Cheia Nativa do Navegador
      const docEl = document.documentElement;
      const requestFS = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
      if (requestFS) {
        try {
          await requestFS.call(docEl);
        } catch (err) {
          console.warn('Fullscreen bloqueado ou cancelado pelo usuário:', err);
        }
      }

      document.getElementById('exam-taking-title').textContent = exam.titulo;
      const subtitle = document.getElementById('exam-taking-subtitle');
      if (subtitle) subtitle.textContent = exam.rubrica ? exam.rubrica : '—';
      
      questoesPenalizadas.clear();
      buildNavGrid(exam);
      document.getElementById('exam-taking-body').innerHTML = buildProvaTakingBody(exam);

      currentQuestionIndex = 0;
      updatePaginationButtons();

      modal.classList.add('active');
      isTakingExam = true;
    };

    document.getElementById('exam-modal').classList.add('active');
  };

  // ─── SISTEMA ANTI-COLA AVANÇADO (ABAS VOADORAS, GEMINI, TELAS DIVIDIDAS) ───
  function penalizeCurrentQuestion(reason) {
    if (!isTakingExam) return;
    if (!questoesPenalizadas.has(currentQuestionIndex)) {
      questoesPenalizadas.add(currentQuestionIndex);
      Toast.error('Violação Anti-Cola!', `Tentativa de consulta externa detectada (${reason}). A questão atual foi anulada (-0,25 pt).`);
      updatePaginationButtons();
    }
  }

  // 1. Perda de Foco da Janela (detecta cliques no Gemini side panel, abas voadoras, janelas secundárias)
  window.addEventListener('blur', () => {
    if (!isTakingExam) return;
    penalizeCurrentQuestion('Painel de IA / Aba flutuante / Janela externa');
    const shield = document.getElementById('focus-lost-shield');
    if (shield) shield.classList.add('active');
  });

  window.addEventListener('focus', () => {
    if (!isTakingExam) return;
    // Remove o shield de perda de foco se estiver em tela cheia
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    if (isFS) {
      const shield = document.getElementById('focus-lost-shield');
      if (shield) shield.classList.remove('active');
    }
  });

  // 2. Mudança de Visibilidade (minimizar ou mudar de aba)
  document.addEventListener('visibilitychange', () => {
    if (isTakingExam && document.visibilityState === 'hidden') {
      penalizeCurrentQuestion('Navegador minimizado / Troca de aba');
      const shield = document.getElementById('focus-lost-shield');
      if (shield) shield.classList.add('active');
    }
  });

  // 3. Monitoramento de Tela Cheia Obrigatória
  function handleFullscreenChange() {
    if (!isTakingExam) return;
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
    const fsOverlay = document.getElementById('fullscreen-required-overlay');
    if (!isFS) {
      penalizeCurrentQuestion('Saída do modo tela cheia');
      if (fsOverlay) fsOverlay.classList.add('active');
    } else {
      if (fsOverlay) fsOverlay.classList.remove('active');
      const shield = document.getElementById('focus-lost-shield');
      if (shield) shield.classList.remove('active');
    }
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);

  // 4. Bloqueio de Botão Direito (Context Menu)
  document.addEventListener('contextmenu', (e) => {
    if (isTakingExam) {
      e.preventDefault();
      Toast.error('Ação Bloqueada', 'O botão direito está desativado no ambiente de prova.');
      return false;
    }
  });

  // 5. Bloqueio de Copiar, Recortar, Colar e Arrastar
  ['copy', 'cut', 'paste', 'dragstart'].forEach(evt => {
    document.addEventListener(evt, (e) => {
      if (isTakingExam) {
        e.preventDefault();
        Toast.error('Ação Bloqueada', 'Copiar/Colar está desativado durante a avaliação.');
        return false;
      }
    });
  });

  // 6. Bloqueio de Atalhos de Teclado (DevTools, Copiar, Inspecionar, etc.)
  document.addEventListener('keydown', (e) => {
    if (!isTakingExam) return;
    const key = e.key.toLowerCase();

    // Bloquear F12 e atalhos de desenvolvedor
    if (key === 'f12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key))) {
      e.preventDefault();
      penalizeCurrentQuestion('Tentativa de abrir DevTools');
      return false;
    }

    // Bloquear Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+U (código fonte), Ctrl+P (imprimir), Ctrl+S
    if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 'u', 'p', 's'].includes(key)) {
      e.preventDefault();
      Toast.error('Ação Bloqueada', 'Atalhos de teclado estão desativados na prova.');
      return false;
    }
  });

  // Funções globais de recuperação de tela
  window.recoverExamFocus = () => {
    const shield = document.getElementById('focus-lost-shield');
    if (shield) shield.classList.remove('active');
    window.focus();
  };

  window.reenterFullscreen = async () => {
    const docEl = document.documentElement;
    const requestFS = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
    if (requestFS) {
      try {
        await requestFS.call(docEl);
      } catch (err) {
        console.error(err);
      }
    }
    const fsOverlay = document.getElementById('fullscreen-required-overlay');
    if (fsOverlay) fsOverlay.classList.remove('active');
    const shield = document.getElementById('focus-lost-shield');
    if (shield) shield.classList.remove('active');
    window.focus();
  };

  function updatePaginationButtons() {
    if (!currentProva || !currentProva.questoes) return;
    const total = currentProva.questoes.length;
    
    // Update counter
    const counter = document.getElementById('exam-question-counter');
    if (counter) counter.textContent = `Questão ${currentQuestionIndex + 1} de ${total}`;

    // Update nav dots
    document.querySelectorAll('.nav-dot').forEach((dot, idx) => {
      dot.classList.remove('active');
      if (idx === currentQuestionIndex) dot.classList.add('active');
      if (questoesPenalizadas.has(idx)) {
        dot.classList.add('penalized');
        dot.classList.remove('answered');
      }
    });

    // Handle penalized overlay and inputs
    const overlay = document.getElementById('penalized-overlay');
    if (questoesPenalizadas.has(currentQuestionIndex)) {
      if (overlay) overlay.classList.add('active');
      // Disable inputs for this question
      const q = currentProva.questoes[currentQuestionIndex];
      const step = document.getElementById(`q-step-${currentQuestionIndex}`);
      if (step) {
        step.querySelectorAll('input, textarea').forEach(el => el.disabled = true);
      }
    } else {
      if (overlay) overlay.classList.remove('active');
    }

    const btnPrev = document.getElementById('btn-prev-questao');
    const btnNext = document.getElementById('btn-next-questao');

    if (btnPrev) {
      btnPrev.disabled = currentQuestionIndex === 0;
      btnPrev.style.opacity = currentQuestionIndex === 0 ? '0.5' : '1';
    }
    
    if (btnNext) {
      if (currentQuestionIndex < total - 1) {
        btnNext.style.display = 'flex';
      } else {
        btnNext.style.display = 'none';
      }
    }
    
    checkAllAnswered();
  }

  function changeQuestion(direction) {
    if (!currentProva || !currentProva.questoes) return;
    const total = currentProva.questoes.length;
    
    const currentStep = document.getElementById(`q-step-${currentQuestionIndex}`);
    if (currentStep) currentStep.style.display = 'none';

    currentQuestionIndex += direction;
    if (currentQuestionIndex < 0) currentQuestionIndex = 0;
    if (currentQuestionIndex >= total) currentQuestionIndex = total - 1;

    const nextStep = document.getElementById(`q-step-${currentQuestionIndex}`);
    if (nextStep) nextStep.style.display = 'block';

    updatePaginationButtons();
  }

  const btnPrev = document.getElementById('btn-prev-questao');
  const btnNext = document.getElementById('btn-next-questao');
  if (btnPrev) btnPrev.addEventListener('click', () => changeQuestion(-1));
  if (btnNext) btnNext.addEventListener('click', () => changeQuestion(1));

  async function submitProva(isForced = false) {
    // Treat as event if called directly from button click
    if (isForced instanceof Event) isForced = false;
    
    if (!currentProva) return;

    const btn = document.getElementById('btn-submit-prova');
    if (!btn) return;

    try {
      btn.disabled = true;
      const questoes = currentProva.questoes || [];
      const respostas = questoes.map(q => {
        if (q.tipo === 'alternativa') {
          const selected = document.querySelector(`input[name="q-${q.id}"]:checked`);
          return {
            questaoId: q.id,
            respostaTexto: null,
            respostaSelecionada: selected ? selected.value : null
          };
        }

        // descritiva
        const ta = document.getElementById(`q-${q.id}`);
        return {
          questaoId: q.id,
          respostaTexto: ta ? ta.value : '',
          respostaSelecionada: null
        };
      });

      // Validação mínima (objetivas precisam ser respondidas, exceto se penalizadas)
      for (const r of respostas) {
        const qIndex = questoes.findIndex(x => x.id === r.questaoId);
        if (questoesPenalizadas.has(qIndex)) continue; // Skip validation for penalized questions
        
        const q = questoes[qIndex];
        if (q && q.tipo === 'alternativa' && (r.respostaSelecionada === null || r.respostaSelecionada === undefined)) {
          throw new Error('Responda todas as questões objetivas antes de enviar.');
        }
      }

      const questoesPenalizadasArray = Array.from(questoesPenalizadas).map(idx => questoes[idx].id);

      await api.post(`/provas/${currentProva.id}/responder`, {
        respostas,
        questoesPenalizadas: questoesPenalizadasArray
      });

      isTakingExam = false;
      if (document.fullscreenElement) {
        const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exitFS) {
          try { await exitFS.call(document); } catch (e) {}
        }
      }
      if (!isForced) {
        Toast.success('Sucesso!', 'Prova enviada com sucesso! Redirecionando...');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        closeModal('exam-taking-modal');
        await loadProvas();
      }
    } catch (err) {
      btn.disabled = false;
      Toast.error('Erro ao enviar', err.message || 'Tente novamente.');
    }
  }

  const submitBtn = document.getElementById('btn-submit-prova');
  if (submitBtn) submitBtn.addEventListener('click', submitProva);

  
  window.openModal = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('active');
    el.classList.add('open');
  };

  window.openStudentExamReview = async function(provaId) {
    try {
      Toast.info('Carregando correção...', 'Buscando os detalhes e pontuações da prova.');
      const data = await api.get('/provas/' + provaId + '/minha-correcao');
      if (!data) {
        Toast.error('Erro', 'Dados da prova corrigida não encontrados.');
        return;
      }

      const modalTitle = document.getElementById('review-exam-title');
      if (modalTitle) modalTitle.textContent = data.titulo || 'Correção da Prova';

      const finalGradeEl = document.getElementById('review-final-grade');
      if (finalGradeEl) {
        const gradeVal = Number(data.notaFinal ?? 0);
        finalGradeEl.textContent = gradeVal % 1 === 0 ? gradeVal.toFixed(0) : gradeVal.toFixed(1);
      }

      // Feedback do Professor
      const feedbackBanner = document.getElementById('review-teacher-feedback');
      const feedbackText = document.getElementById('review-feedback-text');
      if (feedbackBanner && feedbackText) {
        if (data.feedback && data.feedback.trim()) {
          feedbackText.textContent = data.feedback;
          feedbackBanner.style.display = 'block';
        } else {
          feedbackBanner.style.display = 'none';
        }
      }

      // Badges de resumo
      const summaryBadges = document.getElementById('review-summary-badges');
      if (summaryBadges) {
        const questoes = data.questoes || [];
        const totalObj = questoes.filter(q => q.tipo === 'alternativa').length;
        const acertosObj = questoes.filter(q => q.tipo === 'alternativa' && q.acertou).length;
        const totalDisc = questoes.filter(q => q.tipo !== 'alternativa').length;

        summaryBadges.innerHTML = [
          totalObj > 0 ? `<span style="font-size:0.8rem; font-weight:700; background:#e0f2fe; color:#0369a1; padding:0.35rem 0.7rem; border-radius:8px; border:1px solid #bae6fd;"><i class="fa-solid fa-list-check"></i> Objetivas: ${acertosObj}/${totalObj} acertos</span>` : '',
          totalDisc > 0 ? `<span style="font-size:0.8rem; font-weight:700; background:#fef3c7; color:#b45309; padding:0.35rem 0.7rem; border-radius:8px; border:1px solid #fde68a;"><i class="fa-solid fa-pen-nib"></i> ${totalDisc} discursiva${totalDisc > 1 ? 's' : ''} avaliada${totalDisc > 1 ? 's' : ''}</span>` : '',
          data.penalidades > 0 ? `<span style="font-size:0.8rem; font-weight:700; background:#fee2e2; color:#b91c1c; padding:0.35rem 0.7rem; border-radius:8px; border:1px solid #fca5a5;"><i class="fa-solid fa-triangle-exclamation"></i> Penalidades: -${data.penalidades} pts</span>` : ''
        ].filter(Boolean).join('');
      }

      // Lista de questões avaliadas
      const container = document.getElementById('review-questions-container');
      if (container) {
        const letters = ['A', 'B', 'C', 'D', 'E'];
        const questoes = data.questoes || [];

        container.innerHTML = questoes.map((q, idx) => {
          const isObj = q.tipo === 'alternativa';
          const maxPts = q.valorOriginal ?? 1;
          const assignedPts = Number(q.notaAtribuida ?? (q.acertou ? maxPts : 0));
          const isFull = assignedPts >= maxPts;
          const isZero = assignedPts <= 0;

          const badgeBg = isFull ? '#dcfce7' : isZero ? '#fee2e2' : '#fef3c7';
          const badgeBorder = isFull ? '#86efac' : isZero ? '#fca5a5' : '#fde68a';
          const badgeColor = isFull ? '#15803d' : isZero ? '#b91c1c' : '#b45309';

          let bodyHtml = '';

          if (isObj) {
            const opcoes = q.opcoes || [];
            bodyHtml = `
              <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.75rem;">
                ${opcoes.map((opt, oIdx) => {
                  const letter = letters[oIdx] || '-';
                  const isStudentPick = String(opt).trim() === String(q.respostaAluno || '').trim();
                  const isOfficialGabarito = String(opt).trim() === String(q.gabarito || '').trim();

                  let optBg = '#ffffff';
                  let optBorder = '#e2e8f0';
                  let tag = '';

                  if (isStudentPick && q.acertou) {
                    optBg = '#f0fdf4';
                    optBorder = '#86efac';
                    tag = '<span style="font-size:0.75rem; font-weight:700; color:#15803d; background:#dcfce7; padding:0.2rem 0.5rem; border-radius:4px; margin-left:auto;"><i class="fa-solid fa-check"></i> Sua Resposta (Correta)</span>';
                  } else if (isStudentPick && !q.acertou) {
                    optBg = '#fef2f2';
                    optBorder = '#fca5a5';
                    tag = '<span style="font-size:0.75rem; font-weight:700; color:#b91c1c; background:#fee2e2; padding:0.2rem 0.5rem; border-radius:4px; margin-left:auto;"><i class="fa-solid fa-xmark"></i> Sua Resposta</span>';
                  } else if (isOfficialGabarito) {
                    optBg = '#f0fdf4';
                    optBorder = '#86efac';
                    tag = '<span style="font-size:0.75rem; font-weight:700; color:#15803d; background:#dcfce7; padding:0.2rem 0.5rem; border-radius:4px; margin-left:auto;"><i class="fa-solid fa-check"></i> Gabarito Correto</span>';
                  }

                  return `
                    <div style="display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0.85rem; border-radius:8px; border:1px solid ${optBorder}; background:${optBg};">
                      <span style="font-weight:700; font-size:0.85rem; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#f1f5f9; color:#475569;">${letter}</span>
                      <span style="font-size:0.9rem; color:#1e293b; font-weight:${isStudentPick ? '600' : '400'};">${escapeHtml(opt)}</span>
                      ${tag}
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          } else {
            // Discursiva
            bodyHtml = `
              <div style="margin-top:0.75rem;">
                <div style="font-size:0.8rem; font-weight:700; color:#64748b; margin-bottom:0.35rem;">Sua Resposta Escrita:</div>
                <div style="padding:0.75rem 1rem; border-radius:8px; border:1px solid #cbd5e1; background:#f8fafc; font-size:0.95rem; color:#1e293b; white-space:pre-wrap; line-height:1.5;">${q.respostaAluno ? escapeHtml(q.respostaAluno) : '<em style="color:#94a3b8;">Nenhuma resposta digitada.</em>'}</div>
              </div>
            `;
          }

          return `
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:1.25rem; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;">
                <div style="font-weight:700; font-size:0.95rem; color:#0f172a; flex:1;">
                  <span style="color:#64748b; margin-right:0.35rem;">Questão ${idx + 1}.</span> ${escapeHtml(q.texto)}
                </div>
                <div style="font-size:0.85rem; font-weight:700; background:${badgeBg}; border:1px solid ${badgeBorder}; color:${badgeColor}; padding:0.25rem 0.65rem; border-radius:8px; display:inline-flex; align-items:center; gap:0.35rem; white-space:nowrap;">
                  <span>${assignedPts % 1 === 0 ? assignedPts.toFixed(0) : assignedPts.toFixed(1)} / ${maxPts % 1 === 0 ? maxPts.toFixed(0) : maxPts.toFixed(1)} pts</span>
                  ${isObj ? (q.acertou ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-xmark"></i>') : ''}
                </div>
              </div>
              ${bodyHtml}
            </div>
          `;
        }).join('');
      }

      openModal('modal-student-exam-review');
    } catch (err) {
      console.error(err);
      Toast.error('Erro ao abrir correção', err.message || 'Falha na comunicação com o servidor.');
    }
  };

  async function loadProvas() {
    const provasRes = await api.get('/provas/disponiveis').catch(() => []);
    provas = Array.isArray(provasRes) ? provasRes : [];

    const available = provas.filter(p => !p.realizada);
    const graded = provas.filter(p => p.realizada);

    if (scheduledEl) {
      const scheduledSection = scheduledEl.closest('.exam-section');
      if (scheduledSection) scheduledSection.style.display = 'none';
      scheduledEl.innerHTML = '';
    }

    renderExamList(availableEl, available, 'available');
    renderExamList(gradedEl, graded, 'graded');

    const gradedSection = gradedEl?.closest('.exam-section');
    if (gradedSection && !graded.length) {
      gradedSection.style.display = 'none';
    } else if (gradedSection) {
      gradedSection.style.display = '';
    }
  }

  loadProvas();
});

