/* =============================================
   GeoEduca Auth Module
   Login, logout, token management
   ============================================= */

const Auth = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('geo_user'));
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('geo_token');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isProfessor() {
    const user = this.getUser();
    return user?.tipo === 'prof';
  },

  isAluno() {
    const user = this.getUser();
    return user?.tipo === 'aluno';
  },

  isEscola() {
    const user = this.getUser();
    return user?.tipo === 'escola';
  },

  isMaster() {
    const user = this.getUser();
    return user?.tipo === 'master';
  },

  save(token, user) {
    localStorage.setItem('geo_token', token);
    localStorage.setItem('geo_user', JSON.stringify(user));
  },

  getLoginUrl() {
    const p = window.location.pathname;
    if (p.includes('/aluno/') || p.includes('/professor/') || p.includes('/escola/') || p.includes('/master/')) {
      return '../index.html';
    }
    return './index.html';
  },

  logout() {
    localStorage.removeItem('geo_token');
    localStorage.removeItem('geo_user');
    window.location.href = this.getLoginUrl();
  },

  requireAuth(expectedTipo) {
    if (!this.isLoggedIn()) {
      window.location.href = this.getLoginUrl();
      return null;
    }
    const user = this.getUser();
    if (!user) {
      window.location.href = this.getLoginUrl();
      return null;
    }
    if (expectedTipo) {
      const allowed = Array.isArray(expectedTipo) ? [...expectedTipo] : [expectedTipo];
      if (allowed.includes('escola') && !allowed.includes('master')) {
        allowed.push('master');
      }
      if (!allowed.includes(user.tipo)) {
        window.location.href = this.getLoginUrl();
        return null;
      }
    }
    return user;
  },

  getInitials(nome) {
    if (!nome) return '?';
    return nome
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }
};
