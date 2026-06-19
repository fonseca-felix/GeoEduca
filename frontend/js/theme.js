/* =============================================
   GeoEduca Theme Module
   Dark/Light mode persistence
   ============================================= */

const Theme = {
  init() {
    const saved = localStorage.getItem('geo_theme') || 'light';
    this.apply(saved);
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('geo_theme', theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    this.apply(current === 'dark' ? 'light' : 'dark');
  },

  current() {
    return document.documentElement.getAttribute('data-theme');
  }
};

// Init immediately
Theme.init();
