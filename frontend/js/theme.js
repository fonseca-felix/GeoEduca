/* =============================================
   GeoEduca Theme Module
   Dark/Light mode persistence & live toggling
   ============================================= */

const Theme = {
  init() {
    const saved = localStorage.getItem('geo_theme');
    // Padrão explicitamente branco (light)
    const initialTheme = (saved === 'dark') ? 'dark' : 'light';
    this.apply(initialTheme);
  },

  apply(theme) {
    const target = (theme === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', target);
    if (document.body) {
      document.body.setAttribute('data-theme', target);
    }
    localStorage.setItem('geo_theme', target);
    this.updateUI(target);
  },

  toggle() {
    // Several pages bind more than one click handler to the same button;
    // ignore repeated calls from the same click so the theme doesn't flip back.
    const now = Date.now();
    if (now - (this._lastToggle || 0) < 300) return this.current();
    this._lastToggle = now;

    const current = this.current();
    const next = (current === 'dark') ? 'light' : 'dark';
    this.apply(next);
    return next;
  },

  current() {
    return document.documentElement.getAttribute('data-theme') || localStorage.getItem('geo_theme') || 'light';
  },

  updateUI(theme) {
    const isDark = (theme || this.current()) === 'dark';
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
      const textEl = btn.querySelector('.sidebar-nav-text');
      const iconEl = btn.querySelector('.sidebar-nav-icon');
      if (textEl) {
        textEl.textContent = isDark ? 'Tema Claro' : 'Tema Escuro';
      }
      btn.setAttribute('data-tooltip', isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro');
      btn.setAttribute('title', isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro');
      if (iconEl && typeof NAV_ICONS !== 'undefined') {
        iconEl.innerHTML = isDark ? (NAV_ICONS.sun || NAV_ICONS.moon) : NAV_ICONS.moon;
      }
    });
  }
};

// Init immediately on script execution
Theme.init();

// Re-sync UI when DOM is ready (captures dynamically injected sidebars)
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Theme.updateUI());
  } else {
    Theme.updateUI();
  }
}
