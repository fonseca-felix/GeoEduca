/**
 * GeoEduca Sidebar Builder
 * Generates the sidebar HTML for professor or student pages
 */

const GLOBE_SVG = `
<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="18" r="17" stroke="currentColor" stroke-width="1.5"/>
  <ellipse cx="18" cy="18" rx="8" ry="17" stroke="currentColor" stroke-width="1.5"/>
  <line x1="1" y1="18" x2="35" y2="18" stroke="currentColor" stroke-width="1.5"/>
  <line x1="3" y1="11" x2="33" y2="11" stroke="currentColor" stroke-width="1"/>
  <line x1="3" y1="25" x2="33" y2="25" stroke="currentColor" stroke-width="1"/>
</svg>`;

const NAV_ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  alunos:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  salas:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  atividades:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`,
  quizzes:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  provas:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>`,
  jogos:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`,
  notificacoes:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
  resultados:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  logout:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  chevron:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`,
  sun:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`,
  sobre:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><path d="M11 12h1v4h1"/></svg>`,
  dev:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6M12 9v6"/></svg>`,
};

function buildProfessorSidebar(basePath = '../') {
  return `
  <aside class="sidebar" id="sidebar">
    <a class="sidebar-brand" href="${basePath}professor/dashboard.html" aria-label="GeoEduca - Dashboard">
      <div class="sidebar-logo">${GLOBE_SVG}</div>
      <div class="sidebar-brand-text">
        <div class="sidebar-brand-name">GeoEduca</div>
        <div class="sidebar-brand-tagline">Painel do Professor</div>
      </div>
    </a>

    <div class="sidebar-user">
      <div class="sidebar-user-avatar" id="sidebar-user-avatar">JS</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name" id="sidebar-user-name">Carregando...</div>
        <div class="sidebar-user-role" id="sidebar-user-role">Professor</div>
      </div>
    </div>

    <nav class="sidebar-nav" role="navigation">
      <span class="sidebar-nav-label">Principal</span>
      <a class="sidebar-nav-item" href="${basePath}professor/dashboard.html" data-tooltip="Dashboard">
        <span class="sidebar-nav-icon">${NAV_ICONS.dashboard}</span>
        <span class="sidebar-nav-text">Dashboard</span>
      </a>
      <a class="sidebar-nav-item" href="${basePath}professor/alunos.html" data-tooltip="Alunos">
        <span class="sidebar-nav-icon">${NAV_ICONS.alunos}</span>
        <span class="sidebar-nav-text">Alunos</span>
      </a>
      <a class="sidebar-nav-item" href="${basePath}professor/salas.html" data-tooltip="Salas">
        <span class="sidebar-nav-icon">${NAV_ICONS.salas}</span>
        <span class="sidebar-nav-text">Salas</span>
      </a>

      <span class="sidebar-nav-label">Conteúdo</span>
      <a class="sidebar-nav-item" href="${basePath}professor/atividades.html" data-tooltip="Atividades">
        <span class="sidebar-nav-icon">${NAV_ICONS.atividades}</span>
        <span class="sidebar-nav-text">Atividades</span>
      </a>
      <a class="sidebar-nav-item" href="${basePath}professor/quizzes.html" data-tooltip="Quizzes">
        <span class="sidebar-nav-icon">${NAV_ICONS.quizzes}</span>
        <span class="sidebar-nav-text">Quizzes</span>
      </a>
      <a class="sidebar-nav-item" href="${basePath}professor/provas.html" data-tooltip="Provas">
        <span class="sidebar-nav-icon">${NAV_ICONS.provas}</span>
        <span class="sidebar-nav-text">Provas</span>
      </a>
      <a class="sidebar-nav-item" href="${basePath}professor/jogos.html" data-tooltip="Jogos">
        <span class="sidebar-nav-icon">${NAV_ICONS.jogos}</span>
        <span class="sidebar-nav-text">Jogos</span>
      </a>

      <span class="sidebar-nav-label">Avaliação</span>
      <a class="sidebar-nav-item" href="${basePath}professor/resultados.html" data-tooltip="Resultados">
        <span class="sidebar-nav-icon">${NAV_ICONS.resultados}</span>
        <span class="sidebar-nav-text">Resultados</span>
      </a>
      <a class="sidebar-nav-item" href="${basePath}professor/resultados_brazilguessr.html" data-tooltip="Resultados BrazilGuessr">
        <span class="sidebar-nav-icon">${NAV_ICONS.jogos}</span>
        <span class="sidebar-nav-text">Result. BrazilGuessr</span>
      </a>

      <span class="sidebar-nav-label">Sistema</span>
      <a class="sidebar-nav-item" href="${basePath}professor/sobre.html" data-tooltip="Sobre o GeoEduca">
        <span class="sidebar-nav-icon">${NAV_ICONS.sobre}</span>
        <span class="sidebar-nav-text">Sobre o Sistema</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <button class="sidebar-nav-item" data-action="toggle-theme" data-tooltip="Alternar tema" style="width:100%;text-align:left;cursor:pointer;background:none;border:none">
        <span class="sidebar-nav-icon">${NAV_ICONS.moon}</span>
        <span class="sidebar-nav-text">Alternar tema</span>
      </button>
      <button class="sidebar-nav-item" data-action="logout" data-tooltip="Sair" style="width:100%;text-align:left;cursor:pointer;background:none;border:none">
        <span class="sidebar-nav-icon">${NAV_ICONS.logout}</span>
        <span class="sidebar-nav-text">Sair</span>
      </button>
    </div>

    <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Recolher menu">
      ${NAV_ICONS.chevron}
    </button>
  </aside>`;
}

function buildAlunoSidebar(basePath = '../') {
  return `
  <aside class="sidebar" id="sidebar">
    <a class="sidebar-brand" href="${basePath}aluno/dashboard.html" aria-label="GeoEduca - Dashboard">
      <div class="sidebar-logo">${GLOBE_SVG}</div>
      <div class="sidebar-brand-text">
        <div class="sidebar-brand-name">GeoEduca</div>
        <div class="sidebar-brand-tagline">Área do Aluno</div>
      </div>
    </a>

    <div class="sidebar-user">
      <div class="sidebar-user-avatar" id="sidebar-user-avatar">AB</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name" id="sidebar-user-name">Carregando...</div>
        <div class="sidebar-user-role" id="sidebar-user-role">Aluno</div>
      </div>
    </div>

    <nav class="sidebar-nav" role="navigation">
      <span class="sidebar-nav-label">Início</span>
      <a class="sidebar-nav-item" href="${basePath}aluno/dashboard.html" data-tooltip="Dashboard">
        <span class="sidebar-nav-icon">${NAV_ICONS.dashboard}</span>
        <span class="sidebar-nav-text">Dashboard</span>
      </a>
      <a class="sidebar-nav-item" href="${basePath}aluno/notificacoes.html" data-tooltip="Notificações">
        <span class="sidebar-nav-icon">${NAV_ICONS.notificacoes}</span>
        <span class="sidebar-nav-text">Notificações</span>
      </a>

      <span class="sidebar-nav-label">Aprender</span>
      <a class="sidebar-nav-item" href="${basePath}aluno/atividades.html" data-tooltip="Atividades">
        <span class="sidebar-nav-icon">${NAV_ICONS.atividades}</span>
        <span class="sidebar-nav-text">Atividades</span>
      </a>
      <a class="sidebar-nav-item" href="${basePath}aluno/quiz.html" data-tooltip="Quizzes">
        <span class="sidebar-nav-icon">${NAV_ICONS.quizzes}</span>
        <span class="sidebar-nav-text">Quizzes</span>
      </a>
      <a class="sidebar-nav-item" href="${basePath}aluno/prova.html" data-tooltip="Provas">
        <span class="sidebar-nav-icon">${NAV_ICONS.provas}</span>
        <span class="sidebar-nav-text">Provas</span>
      </a>
      <a class="sidebar-nav-item" href="${basePath}aluno/jogos.html" data-tooltip="Jogos">
        <span class="sidebar-nav-icon">${NAV_ICONS.jogos}</span>
        <span class="sidebar-nav-text">Jogos</span>
      </a>
      <a class="sidebar-nav-item" href="${basePath}aluno/rota27.html" data-tooltip="Rota 27 (IA)">
        <span class="sidebar-nav-icon"><i class="fa-solid fa-earth-americas"></i></span>
        <span class="sidebar-nav-text">Rota 27 (IA)</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <button class="sidebar-nav-item" data-action="toggle-theme" data-tooltip="Alternar tema" style="width:100%;text-align:left;cursor:pointer;background:none;border:none">
        <span class="sidebar-nav-icon">${NAV_ICONS.moon}</span>
        <span class="sidebar-nav-text">Alternar tema</span>
      </button>
      <button class="sidebar-nav-item" data-action="logout" data-tooltip="Sair" style="width:100%;text-align:left;cursor:pointer;background:none;border:none">
        <span class="sidebar-nav-icon">${NAV_ICONS.logout}</span>
        <span class="sidebar-nav-text">Sair</span>
      </button>
    </div>

    <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Recolher menu">
      ${NAV_ICONS.chevron}
    </button>
  </aside>`;
}
