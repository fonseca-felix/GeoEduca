/* =============================================
   GeoEduca UI Utilities
   Toast, Modal, Confirm, Sidebar, Reveal
   ============================================= */

/* ---- Toast ---- */
const Toast = {
  container: null,

  _init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(title, message = '', type = 'info', duration = 4000) {
    this._init();
    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
      error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
    `;

    this.container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },

  success: (title, msg) => Toast.show(title, msg, 'success'),
  error: (title, msg) => Toast.show(title, msg, 'error'),
  warning: (title, msg) => Toast.show(title, msg, 'warning'),
};

/* ---- Modal ---- */
const Modal = {
  open(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) Modal.close(id);
    }, { once: false });
  },

  close(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  },

  closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
};

/* ---- Confirm Dialog ---- */
const Confirm = {
  show(title, message, onConfirm, danger = true) {
    const existingId = 'geo-confirm-dialog';
    let overlay = document.getElementById(existingId);

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = existingId;
      overlay.className = 'modal-overlay confirm-dialog';
      overlay.innerHTML = `
        <div class="modal" style="max-width:380px">
          <div class="modal-body" style="text-align:center; padding: var(--space-8)">
            <div class="confirm-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="confirm-text">
              <h3 id="confirm-title"></h3>
              <p id="confirm-message"></p>
            </div>
          </div>
          <div class="modal-footer" style="justify-content:center; gap: var(--space-3)">
            <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
            <button class="btn" id="confirm-ok">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    overlay.querySelector('#confirm-title').textContent = title;
    overlay.querySelector('#confirm-message').textContent = message;
    const okBtn = overlay.querySelector('#confirm-ok');
    okBtn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    okBtn.textContent = 'Confirmar';

    const cancelBtn = overlay.querySelector('#confirm-cancel');

    const handleConfirm = () => {
      onConfirm();
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    };

    const handleCancel = () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    };

    okBtn.onclick = handleConfirm;
    cancelBtn.onclick = handleCancel;
    overlay.onclick = (e) => { if (e.target === overlay) handleCancel(); };

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
};

/* ---- Sidebar ---- */
const Sidebar = {
  init() {
    const sidebar = document.querySelector('.sidebar');
    const layout = document.querySelector('.app-layout');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    if (!sidebar) return;

    // Mobile Hamburger Button & Overlay
    if (!document.getElementById('mobile-menu-btn')) {
      const mobileBtn = document.createElement('button');
      mobileBtn.id = 'mobile-menu-btn';
      mobileBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`;
      document.body.appendChild(mobileBtn);
      
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-mobile-overlay';
      document.body.appendChild(overlay);

      mobileBtn.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden'; // prevent bg scroll
      });

      overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      });
      
      // Close sidebar when clicking a nav item on mobile
      sidebar.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.addEventListener('click', () => {
          if (window.innerWidth <= 900) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
          }
        });
      });
    }

    const collapsed = localStorage.getItem('geo_sidebar') === 'collapsed';
    if (collapsed) {
      sidebar.classList.add('collapsed');
      layout?.classList.add('sidebar-collapsed');
    }

    toggleBtn?.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      layout?.classList.toggle('sidebar-collapsed');
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('geo_sidebar', isCollapsed ? 'collapsed' : 'expanded');
    });

    // Set active nav item
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      const href = item.getAttribute('href');
      if (href && currentPath.endsWith(href.split('/').pop())) {
        item.classList.add('active');
      }
    });
  }
};

/* ---- Scroll Reveal ---- */
const Reveal = {
  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
};

/* ---- Helpers ---- */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diff = (now - d) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function initPage(tipo) {
  Theme.init();
  Sidebar.init();
  Reveal.init();

  const user = Auth.requireAuth(tipo);
  if (!user) return null;

  // Set user info in sidebar
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-user-avatar');
  if (nameEl) nameEl.textContent = user.nome;
  if (roleEl) roleEl.textContent = tipo === 'prof' ? 'Professor' : `Turma: ${user.salaNome || '-'}`;
  if (avatarEl) avatarEl.textContent = Auth.getInitials(user.nome);

  // Theme toggle
  document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
    btn.addEventListener('click', () => Theme.toggle());
  });

  // Logout
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', () => Auth.logout());
  });

  return user;
}

// Stat counter animation
function animateCounter(el, target, duration = 800) {
  const start = 0;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  let startTime = null;
  requestAnimationFrame(step);
}
