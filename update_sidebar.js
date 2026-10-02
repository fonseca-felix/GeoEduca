const fs = require('fs');
let code = fs.readFileSync('frontend/js/sidebar.js', 'utf8');

const navIconsMatch = code.match(/const NAV_ICONS = \{[\s\S]*?\};/);
if (navIconsMatch && !code.includes('escolas:')) {
  let navIcons = navIconsMatch[0];
  navIcons = navIcons.replace('};', 
`  escolas:    \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>\`,
  professores:\`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>\`,
};`);
  code = code.replace(navIconsMatch[0], navIcons);
}

const escolaSidebar = `
function buildEscolaSidebar(basePath = '../') {
  return \`
  <aside class="sidebar" id="sidebar">
    <a class="sidebar-brand" href="\${basePath}escola/dashboard.html" aria-label="GeoEduca - Dashboard">
      <div class="sidebar-logo">\${GLOBE_SVG}</div>
      <div class="sidebar-brand-text">
        <div class="sidebar-brand-name">GeoEduca</div>
        <div class="sidebar-brand-tagline">Painel da Escola</div>
      </div>
    </a>

    <div class="sidebar-user">
      <div class="sidebar-user-avatar" id="sidebar-user-avatar">ES</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name" id="sidebar-user-name">Carregando...</div>
        <div class="sidebar-user-role" id="sidebar-user-role">Escola</div>
      </div>
    </div>

    <nav class="sidebar-nav" role="navigation">
      <span class="sidebar-nav-label">Principal</span>
      <a class="sidebar-nav-item" href="\${basePath}escola/dashboard.html" data-tooltip="Dashboard">
        <span class="sidebar-nav-icon">\${NAV_ICONS.dashboard}</span>
        <span class="sidebar-nav-text">Dashboard</span>
      </a>
      <a class="sidebar-nav-item" href="\${basePath}escola/professores.html" data-tooltip="Professores">
        <span class="sidebar-nav-icon">\${NAV_ICONS.professores}</span>
        <span class="sidebar-nav-text">Professores</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <button class="sidebar-nav-item" data-action="toggle-theme" data-tooltip="Alternar tema" style="width:100%;text-align:left;cursor:pointer;background:none;border:none">
        <span class="sidebar-nav-icon">\${NAV_ICONS.moon}</span>
        <span class="sidebar-nav-text">Alternar tema</span>
      </button>
      <button class="sidebar-nav-item" data-action="logout" data-tooltip="Sair" style="width:100%;text-align:left;cursor:pointer;background:none;border:none">
        <span class="sidebar-nav-icon">\${NAV_ICONS.logout}</span>
        <span class="sidebar-nav-text">Sair</span>
      </button>
    </div>

    <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Recolher menu">
      \${NAV_ICONS.chevron}
    </button>
  </aside>\`;
}
`;

const masterSidebar = `
function buildMasterSidebar(basePath = '../') {
  return \`
  <aside class="sidebar" id="sidebar">
    <a class="sidebar-brand" href="\${basePath}master/dashboard.html" aria-label="GeoEduca - Dashboard">
      <div class="sidebar-logo">\${GLOBE_SVG}</div>
      <div class="sidebar-brand-text">
        <div class="sidebar-brand-name">GeoEduca</div>
        <div class="sidebar-brand-tagline">Master Admin</div>
      </div>
    </a>

    <div class="sidebar-user">
      <div class="sidebar-user-avatar" id="sidebar-user-avatar">MA</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name" id="sidebar-user-name">Master</div>
        <div class="sidebar-user-role" id="sidebar-user-role">Admin</div>
      </div>
    </div>

    <nav class="sidebar-nav" role="navigation">
      <span class="sidebar-nav-label">Principal</span>
      <a class="sidebar-nav-item" href="\${basePath}master/dashboard.html" data-tooltip="Dashboard">
        <span class="sidebar-nav-icon">\${NAV_ICONS.dashboard}</span>
        <span class="sidebar-nav-text">Dashboard</span>
      </a>
      <a class="sidebar-nav-item" href="\${basePath}master/escolas.html" data-tooltip="Escolas">
        <span class="sidebar-nav-icon">\${NAV_ICONS.escolas}</span>
        <span class="sidebar-nav-text">Escolas</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <button class="sidebar-nav-item" data-action="toggle-theme" data-tooltip="Alternar tema" style="width:100%;text-align:left;cursor:pointer;background:none;border:none">
        <span class="sidebar-nav-icon">\${NAV_ICONS.moon}</span>
        <span class="sidebar-nav-text">Alternar tema</span>
      </button>
      <button class="sidebar-nav-item" data-action="logout" data-tooltip="Sair" style="width:100%;text-align:left;cursor:pointer;background:none;border:none">
        <span class="sidebar-nav-icon">\${NAV_ICONS.logout}</span>
        <span class="sidebar-nav-text">Sair</span>
      </button>
    </div>

    <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Recolher menu">
      \${NAV_ICONS.chevron}
    </button>
  </aside>\`;
}
`;

if (!code.includes('buildEscolaSidebar')) {
  code += '\\n' + escolaSidebar + '\\n' + masterSidebar;
  fs.writeFileSync('frontend/js/sidebar.js', code);
  console.log('Sidebar updated');
} else {
  console.log('Already updated');
}
