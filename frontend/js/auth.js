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

  save(token, user) {
    localStorage.setItem('geo_token', token);
    localStorage.setItem('geo_user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('geo_token');
    localStorage.removeItem('geo_user');
    window.location.href = '/index.html';
  },

  requireAuth(expectedTipo) {
    if (!this.isLoggedIn()) {
      window.location.href = '/index.html';
      return null;
    }
    const user = this.getUser();
    if (expectedTipo && user?.tipo !== expectedTipo) {
      window.location.href = '/index.html';
      return null;
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
