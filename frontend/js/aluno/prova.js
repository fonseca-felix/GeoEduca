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
            ${status === 'available' ? 'Liberada' : status === 'graded' ? 'Corrigida' : 'Agendada'}
          </span>
          ${status === 'available'
            ? `<button class="btn-exam primary" onclick="confirmExam('${exam.id}')">Iniciar Prova</button>`
            : `<div style="font-size:0.95rem;color:#059669;margin-top:0.25rem;">${exam.realizada ? 'Concluída' : ''}</div>`
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

    btn.onclick = () => {
      closeModal('exam-modal');
      const modal = document.getElementById('exam-taking-modal');
      if (!modal) return;

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

  document.addEventListener('visibilitychange', () => {
    if (isTakingExam && document.visibilityState === 'hidden') {
      if (!questoesPenalizadas.has(currentQuestionIndex)) {
        questoesPenalizadas.add(currentQuestionIndex);
        Toast.error('Violação Anti-Cola!', 'Você saiu da página. A questão atual foi anulada (-0,25 pt).');
        updatePaginationButtons(); // Update UI to show penalty overlay
      }
    }
  });

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

