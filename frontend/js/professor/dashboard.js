/* =============================================
   GeoEduca – Dashboard do Professor
   Carrega dados reais da API /api/dashboard
   ============================================= */

// ── Tipo de atividade → rótulo legível ──────────────────────────────────────
const TIPO_LABELS = {
  video:       { icon: '🎬', label: 'Vídeo' },
  infografico: { icon: '🖼️', label: 'Infográfico' },
  site:        { icon: '🌐', label: 'Site' },
  tarefa:      { icon: '📝', label: 'Tarefa' },
};

// ── Formata data ISO para "há X tempo" ──────────────────────────────────────
function timeAgoLocal(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Agora mesmo';
  if (m < 60) return `Há ${m} minuto${m > 1 ? 's' : ''}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Há ${h} hora${h > 1 ? 's' : ''}`;
  const d = Math.floor(h / 24);
  return `Há ${d} dia${d > 1 ? 's' : ''}`;
}

// ── Renderiza cards de estatísticas ─────────────────────────────────────────
function renderStats(stats) {
  const items = [
    {
      label:    'Total de Alunos',
      value:    stats.totalAlunos,
      icon:     '👨‍🎓',
      sub:      `em ${stats.totalSalas} sala${stats.totalSalas !== 1 ? 's' : ''}`,
      positive: true,
    },
    {
      label:    'Salas Ativas',
      value:    stats.totalSalas,
      icon:     '🏫',
      sub:      'turmas cadastradas',
      positive: true,
    },
    {
      label:    'Quizzes Criados',
      value:    stats.totalQuizzes,
      icon:     '📝',
      sub:      `${stats.totalRespostasQuiz} resposta${stats.totalRespostasQuiz !== 1 ? 's' : ''} enviada${stats.totalRespostasQuiz !== 1 ? 's' : ''}`,
      positive: true,
    },
    {
      label:    'Atividades',
      value:    stats.totalAtividades,
      icon:     '📚',
      sub:      `${stats.totalProvas} prova${stats.totalProvas !== 1 ? 's' : ''} criada${stats.totalProvas !== 1 ? 's' : ''}`,
      positive: true,
    },
  ];

  const container = document.getElementById('stats-container');
  if (!container) return;

  container.innerHTML = items.map((s, i) => `
    <div class="stat-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="stat-title">${s.label}</div>
          <div class="stat-value" id="stat-val-${i}">0</div>
        </div>
        <div style="font-size: 1.75rem; background: var(--bg-muted, #f3f4f6); width: 52px; height: 52px;
                    display: flex; align-items: center; justify-content: center; border-radius: 14px;">
          ${s.icon}
        </div>
      </div>
      <div class="stat-change ${!s.positive ? 'negative' : ''}">
        ${s.positive ? '↑' : '↓'} ${s.sub}
      </div>
    </div>
  `).join('');

  // Anima os contadores após render
  items.forEach((s, i) => {
    const el = document.getElementById(`stat-val-${i}`);
    if (el && typeof animateCounter === 'function') {
      animateCounter(el, s.value, 800);
    } else if (el) {
      el.textContent = s.value;
    }
  });
}

// ── Renderiza feed de atividades recentes ────────────────────────────────────
function renderAtividades(atividades) {
  const container = document.getElementById('activity-feed');
  if (!container) return;

  if (!atividades || atividades.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted, #6b7280);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
        <p style="margin: 0;">Nenhuma atividade criada ainda.</p>
        <a href="atividades.html" style="font-size: 0.875rem; color: var(--color-primary, #3b82f6); margin-top: 0.5rem; display: inline-block;">
          Criar primeira atividade →
        </a>
      </div>`;
    return;
  }

  container.innerHTML = atividades.map(a => {
    const t = TIPO_LABELS[a.tipo] || { icon: '📄', label: a.tipo };
    return `
      <div class="activity-item">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--bg-muted, #f3f4f6);
                    display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
          ${t.icon}
        </div>
        <div style="flex: 1; min-width: 0;">
          <p style="margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--text-primary, #111827);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${a.titulo}
          </p>
          <p style="margin: 0.2rem 0 0; font-size: 0.8rem; color: var(--text-muted, #6b7280);">
            ${t.label}${a.salaNome ? ` · ${a.salaNome}` : ''} · ${timeAgoLocal(a.createdAt)}
          </p>
        </div>
        <span style="font-size: 0.75rem; background: var(--bg-muted, #f3f4f6); color: var(--text-muted, #6b7280);
                     padding: 0.2rem 0.5rem; border-radius: 6px; white-space: nowrap; flex-shrink: 0;">
          ${t.label}
        </span>
      </div>`;
  }).join('');
}

// ── Renderiza salas no painel lateral ────────────────────────────────────────
function renderTopSalas(salas) {
  const container = document.getElementById('top-rooms');
  if (!container) return;

  if (!salas || salas.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted, #6b7280);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏫</div>
        <p style="margin: 0;">Nenhuma sala encontrada.</p>
      </div>`;
    return;
  }

  // Calcula o maior nº de alunos para a barra de progresso
  const maxAlunos = Math.max(...salas.map(s => s.totalAlunos), 1);

  container.innerHTML = salas.map(s => {
    const pct = Math.round((s.totalAlunos / maxAlunos) * 100);
    const barColor = pct > 70 ? '#10b981' : pct > 40 ? '#3b82f6' : '#f59e0b';

    return `
      <div style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
          <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary, #111827);">${s.nome}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted, #6b7280); font-weight: 500;">
            ${s.totalAlunos} aluno${s.totalAlunos !== 1 ? 's' : ''}
          </span>
        </div>
        <div style="width: 100%; background: var(--bg-muted, #f3f4f6); border-radius: 999px; height: 8px; overflow: hidden;">
          <div style="width: ${pct}%; background: ${barColor}; height: 100%; border-radius: 999px;
                      transition: width 1s ease-in-out;"></div>
        </div>
      </div>`;
  }).join('');
}

// ── Mostra estado de loading ─────────────────────────────────────────────────
function showLoadingState() {
  const placeholder = `
    <div style="height: 80px; background: linear-gradient(90deg, var(--bg-muted, #f3f4f6) 25%,
                var(--bg-surface, #fff) 50%, var(--bg-muted, #f3f4f6) 75%);
                background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px;"></div>`;
  
  const statsEl = document.getElementById('stats-container');
  if (statsEl) statsEl.innerHTML = [1,2,3,4].map(() => placeholder).join('');
  
  const feedEl = document.getElementById('activity-feed');
  if (feedEl) feedEl.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-muted);">Carregando...</div>`;
  
  const roomsEl = document.getElementById('top-rooms');
  if (roomsEl) roomsEl.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-muted);">Carregando...</div>`;
}

// ── Ponto de entrada ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Injeta sidebar
  const layout = document.getElementById('app-layout');
  if (layout && typeof buildProfessorSidebar === 'function') {
    layout.insertAdjacentHTML('afterbegin', buildProfessorSidebar());
  }

  // 2. Inicializa auth
  const user = (typeof initPage === 'function') ? initPage('prof') : null;
  if (!user) return;

  // 3. Loading skeleton
  showLoadingState();

  try {
    // 4. Busca dados reais da API
    const data = await api.get('/dashboard');

    renderStats(data.stats);
    renderAtividades(data.atividadesRecentes);
    renderTopSalas(data.topSalas);

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);

    // Fallback: mostra zeros se a API falhar
    renderStats({
      totalAlunos: 0, totalSalas: 0, totalQuizzes: 0,
      totalAtividades: 0, totalProvas: 0,
      totalRespostasQuiz: 0, totalRespostasProva: 0,
    });

    const feedEl = document.getElementById('activity-feed');
    if (feedEl) {
      feedEl.innerHTML = `
        <div style="text-align:center;padding:2rem;color:#ef4444;">
          <p>Não foi possível conectar ao servidor.</p>
          <p style="font-size:0.875rem;color:var(--text-muted);">Verifique se o backend está rodando na porta 3000.</p>
        </div>`;
    }

    const roomsEl = document.getElementById('top-rooms');
    if (roomsEl) {
      roomsEl.innerHTML = `
        <div style="text-align:center;padding:2rem;color:var(--text-muted);">
          Sem dados disponíveis.
        </div>`;
    }
  }
});
