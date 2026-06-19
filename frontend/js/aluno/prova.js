document.addEventListener('DOMContentLoaded', () => {
  // Inject sidebar BEFORE initPage
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());

  const user = initPage('aluno');
  if (!user) return; // redirect handled in auth

  let provas = [];
  let currentProva = null;

  const availableEl = document.getElementById('available-exams');
  const scheduledEl = document.getElementById('scheduled-exams');
  const gradedEl = document.getElementById('graded-exams');

  function renderExamList(container, list, status) {
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `<p style="color:var(--text-secondary);font-size:0.9rem;padding:0.5rem 0;">Nenhuma prova nesta seção.</p>`;
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

  function buildProvaTakingBody(prova) {
    const questoes = prova.questoes || [];
    if (!questoes.length) return '<div style="color:#6b7280;">Esta prova não tem questões.</div>';

    const html = questoes.map((q, idx) => {
      if (q.tipo === 'alternativa') {
        const options = q.opcoes || [];
        return `
          <div style="margin-bottom:1.5rem; padding:1rem; border:1px solid var(--border-color, #e2e8f0); border-radius:12px; background:#fff;">
            <div style="font-weight:700; color:#0f172a; margin-bottom:0.75rem;">
              ${idx + 1}. ${escapeHtml(q.texto)}
            </div>
            <div style="display:flex;flex-direction:column;gap:0.5rem;">
              ${options.map((opt) => `
                <label style="display:flex; gap:0.5rem; align-items:flex-start; cursor:pointer;">
                  <input type="radio" name="q-${q.id}" value="${escapeHtml(opt)}" />
                  <span style="color:#334155;">${escapeHtml(opt)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;
      }

      // descritiva
      return `
        <div style="margin-bottom:1.5rem; padding:1rem; border:1px solid var(--border-color, #e2e8f0); border-radius:12px; background:#fff;">
          <div style="font-weight:700; color:#0f172a; margin-bottom:0.75rem;">
            ${idx + 1}. ${escapeHtml(q.texto)}
          </div>
          <textarea id="q-${q.id}" style="width:100%; min-height:120px; padding:0.75rem; border:1px solid #d1d5db; border-radius:10px; font-family:Inter, sans-serif; outline:none; box-sizing:border-box;"></textarea>
        </div>
      `;
    }).join('');

    return html;
  }

  window.closeModal = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active');
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
      document.getElementById('exam-taking-body').innerHTML = buildProvaTakingBody(exam);

      modal.classList.add('active');
    };

    document.getElementById('exam-modal').classList.add('active');
  };

  async function submitProva() {
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

      // Validação mínima (objetivas precisam ser respondidas)
      for (const r of respostas) {
        const q = questoes.find(x => x.id === r.questaoId);
        if (q && q.tipo === 'alternativa' && (r.respostaSelecionada === null || r.respostaSelecionada === undefined)) {
          throw new Error('Responda todas as questões objetivas antes de enviar.');
        }
      }

      await api.post(`/provas/${currentProva.id}/responder`, {
        respostas,
        saidasAba: 0
      });

      if (window.Toast) window.Toast.success('Prova enviada com sucesso!');
      closeModal('exam-taking-modal');
      await loadProvas();
    } catch (err) {
      btn.disabled = false;
      if (window.Toast) window.Toast.error('Erro ao enviar', err.message || 'Tente novamente.');
      else alert(err.message || 'Tente novamente.');
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

