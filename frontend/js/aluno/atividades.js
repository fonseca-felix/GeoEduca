document.addEventListener('DOMContentLoaded', () => {
  // Inject sidebar BEFORE initPage
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());

  const user = initPage('aluno');
  if (!user) return;

  let atividades = [];
  let currentFilter = 'todas';

  const filterBar = document.getElementById('filter-bar');
  const grid = document.getElementById('activities-grid');

  function parseDate(d) {
    if (!d) return null;
    const dt = new Date(d + 'T00:00:00');
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function getStatus(act) {
    if (act.visualizado) return 'concluída';
    const dt = parseDate(act.dataLimite);
    if (!dt) return 'pendente';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dt < today ? 'atrasada' : 'pendente';
  }

  function renderFilters() {
    if (!filterBar) return;

    const filters = ['todas', 'pendente', 'concluída', 'atrasada'];
    filterBar.innerHTML = filters.map(filter => `
      <button class="filter-btn ${currentFilter === filter ? 'active' : ''}" data-filter="${filter}">
        ${filter.charAt(0).toUpperCase() + filter.slice(1)}
      </button>
    `).join('');

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentFilter = e.target.dataset.filter;
        renderActivities();
      });
    });
  }

  function renderActivities() {
    if (!grid) return;

    const enriched = atividades.map(a => ({
      ...a,
      status: getStatus(a),
      progress: a.visualizado ? 100 : 0
    }));

    const filtered = currentFilter === 'todas'
      ? enriched
      : enriched.filter(a => a.status === currentFilter);

    if (!filtered.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-secondary);">Nenhuma atividade encontrada.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(act => `
      <div class="activity-card">
        <div class="activity-header">
          <div>
            <h3 class="activity-title">${act.titulo}</h3>
            <span class="activity-subject">
              <span class="subject-icon" style="background-color:#4361ee"></span>
              ${act.tipo || 'Atividade'}
            </span>
          </div>
          <span class="badge ${act.status}">${act.status}</span>
        </div>

        <p style="font-size:0.875rem;color:var(--text-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
          ${act.descricao || ''}
        </p>

        <div class="progress-section">
          <div class="progress-label">
            <span>Progresso</span>
            <span>${act.progress}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${act.progress}%;"></div>
          </div>
        </div>

        <div class="card-footer">
          <span class="due-date">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${act.dataLimite ? parseDate(act.dataLimite)?.toLocaleDateString('pt-BR') : 'Sem prazo'}
          </span>
          <button class="btn-action ${act.status === 'concluída' ? 'secondary' : ''}" onclick="openActivityDetails('${act.id}')">
            ${act.status === 'concluída' ? 'Revisar' : (act.status === 'atrasada' ? 'Ver / Entregar' : 'Iniciar')}
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

  window.openActivityDetails = async (id) => {
    const act = atividades.find(a => a.id === id);
    if (!act) return;

    const status = getStatus(act);
    const dueDate = act.dataLimite ? parseDate(act.dataLimite)?.toLocaleDateString('pt-BR') : 'Sem prazo';

    document.getElementById('modal-title').textContent = act.titulo;
    document.getElementById('modal-body').innerHTML = `
      <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:1rem;">
        <span class="badge ${status}">${status}</span>
        <span style="font-weight:600;color:#0f172a;">${escapeHtml(act.tipo || 'Atividade')}</span>
      </div>

      ${act.descricao ? `<p style="color:var(--text-secondary);">${escapeHtml(act.descricao)}</p>` : ''}

      <div style="margin-top:1.25rem;background:#f8fafc;padding:1rem;border-radius:10px;border:1px solid var(--border-color, #e2e8f0);">
        <div style="font-weight:700;color:#0f172a;margin-bottom:0.25rem;">Prazo</div>
        <div style="color:var(--text-secondary);">${escapeHtml(dueDate)}</div>
      </div>
    `;

    const btn = document.getElementById('modal-action-btn');
    if (!btn) return;

    if (act.visualizado) {
      btn.textContent = 'Abrir';
      btn.onclick = () => {
        closeModal('activity-modal');
        if (act.link && act.link !== '#') window.open(act.link, '_blank');
      };
      document.getElementById('activity-modal')?.classList.add('active');
      return;
    }

    btn.textContent = 'Iniciar';
    btn.onclick = async () => {
      try {
        btn.disabled = true;
        await api.post(`/atividades/visualizar/${act.id}`, {});
        closeModal('activity-modal');
        if (act.link && act.link !== '#') window.open(act.link, '_blank');
        await loadAtividades();
      } catch (err) {
        btn.disabled = false;
        if (window.Toast) window.Toast.error('Erro', err.message || 'Tente novamente.');
        else alert(err.message || 'Tente novamente.');
      }
    };
    document.getElementById('activity-modal')?.classList.add('active');
  };

  window.closeModal = (id) => {
    document.getElementById(id)?.classList.remove('active');
  };

  async function loadAtividades() {
    const res = await api.get('/atividades/minhas').catch(() => []);
    atividades = Array.isArray(res) ? res : [];
    renderActivities();
  }

  // Initialize
  renderFilters();
  loadAtividades();
});

