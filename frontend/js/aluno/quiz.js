document.addEventListener('DOMContentLoaded', () => {
  // Inject sidebar BEFORE initPage
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());

  const user = initPage('aluno');
  if (!user) return; // redirect handled in auth

  let quizzes = [];

  function renderQuizzes() {
    const grid = document.getElementById('quiz-grid');
    if (!grid) return;

    if (!quizzes.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:3rem;border:1px dashed var(--border-color);border-radius:12px;background:var(--bg-card)">Nenhum quiz disponível.</div>`;
      return;
    }

    grid.innerHTML = quizzes.map(q => `
      <div class="quiz-card">
        <div class="quiz-banner" style="background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="quiz-content">
          <span class="quiz-category">Quiz</span>
          <h3 class="quiz-title">${q.titulo}</h3>
          <div class="quiz-meta">
            <div class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${q.perguntas ? q.perguntas.length : 0} Qts
            </div>
          </div>

          <button class="btn-start" onclick="openQuizModal('${q.id}')" ${q.realizado ? 'disabled style="opacity:0.6;cursor:not-allowed"' : ''}>
            ${q.realizado ? 'Quiz concluído' : 'Visualizar / Responder'}
          </button>
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

  window.openQuizModal = (id) => {
    const q = quizzes.find(x => x.id === id);
    if (!q) return;

    const questionsHtml = (q.perguntas || []).map((p, idx) => {
      const options = p.opcoes || [];
      return `
        <div style="margin-bottom:1.25rem;">
          <div style="font-weight:700;color:#0f172a;margin-bottom:0.5rem;">${idx + 1}. ${escapeHtml(p.texto)}</div>
          <div style="display:flex;flex-direction:column;gap:0.4rem;">
            ${options.map((opt, optIdx) => `
              <label style="display:flex;gap:0.5rem;align-items:flex-start;color:#334155;font-size:0.95rem;cursor:pointer;">
                <input type="radio" name="q-${p.id}" value="${escapeHtml(opt)}" />
                <span>${escapeHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('modal-body').innerHTML = `
      <div style="text-align:center;margin-bottom:1.5rem;">
        <h3 style="font-family:'Space Grotesk', sans-serif;font-size:1.5rem;margin:0;color:#0f172a;">${escapeHtml(q.titulo)}</h3>
        <p style="color:#64748b;font-size:0.875rem;margin:0.5rem 0 0 0;">Responda com calma. Você só pode enviar uma vez.</p>
      </div>
      <div style="text-align:left;max-height:55vh;overflow:auto;padding-right:0.5rem;">
        ${questionsHtml}
      </div>
    `;

    const btn = document.getElementById('btn-start-quiz');
    if (btn) {
      btn.textContent = q.realizado ? 'Quiz concluído' : 'Enviar respostas';
      btn.disabled = !!q.realizado;
      btn.onclick = async () => {
        try {
          btn.disabled = true;
          btn.textContent = 'Enviando...';

          if (!q.perguntas || q.perguntas.length === 0) {
            throw new Error('Quiz sem perguntas');
          }

          const respostas = q.perguntas.map(p => {
            const selected = document.querySelector(`input[name="q-${p.id}"]:checked`);
            return {
              perguntaId: p.id,
              opcaoSelecionada: selected ? selected.value : null
            };
          });

          // Validação mínima: precisa responder todas as perguntas objetivas
          for (const r of respostas) {
            if (r.opcaoSelecionada === null) {
              throw new Error('Responda todas as perguntas antes de enviar.');
            }
          }

          await api.post(`/quizzes/${q.id}/responder`, { respostas });
          if (window.Toast) window.Toast.success('Quiz enviado com sucesso!');

          closeModal('quiz-modal');
          await loadQuizzes();
        } catch (err) {
          btn.disabled = false;
          btn.textContent = 'Enviar respostas';
          if (window.Toast) window.Toast.error('Erro ao enviar', err.message || 'Tente novamente.');
          else alert(err.message || 'Tente novamente.');
        }
      };
    }

    document.getElementById('quiz-modal').classList.add('active');
  };

  window.closeModal = (id) => {
    document.getElementById(id).classList.remove('active');
  };

  function updateStats() {
    const done = quizzes.filter(q => q.realizado).length;
    const pending = quizzes.filter(q => !q.realizado).length;
    const points = quizzes
      .filter(q => q.realizado && q.pontuacao != null)
      .reduce((sum, q) => sum + (Number(q.pontuacao) || 0), 0);

    const elDone = document.getElementById('stat-quizzes-done');
    const elPoints = document.getElementById('stat-quizzes-points');
    const elPending = document.getElementById('stat-quizzes-pending');

    if (elDone) elDone.textContent = String(done);
    if (elPoints) elPoints.textContent = points.toLocaleString('pt-BR');
    if (elPending) elPending.textContent = String(pending);
  }

  async function loadQuizzes() {
    try {
      const quizzesRes = await api.get('/quizzes/disponiveis');
      quizzes = Array.isArray(quizzesRes) ? quizzesRes : [];
    } catch (err) {
      console.error(err);
      quizzes = [];
      if (window.Toast) window.Toast.error('Erro ao carregar quizzes', err.message || 'Tente novamente.');
    }
    updateStats();
    renderQuizzes();
  }

  // Initialize
  loadQuizzes();
});

