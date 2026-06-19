/* =============================================
   GeoEduca API Client
   Centralized fetch with auth headers
   ============================================= */

// Detecta automaticamente onde está o backend
let API_BASE;
if (window.location.protocol === 'file:') {
  // Abrindo arquivo diretamente (double-click index.html)
  API_BASE = 'http://localhost:3000/api';
} else if (window.location.port !== '3000') {
  // Frontend servido em porta diferente (ex: 3001 via npx serve)
  // API sempre roda na porta 3000
  API_BASE = `${window.location.protocol}//${window.location.hostname}:3000/api`;
} else {
  // Frontend servido pelo próprio backend (porta 3000)
  API_BASE = `${window.location.origin}/api`;
}

const api = {
  _getHeaders() {
    const token = localStorage.getItem('geo_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  async _request(method, endpoint, body = null) {
    const opts = {
      method,
      headers: this._getHeaders(),
    };
    if (body) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, opts);
    } catch (e) {
      console.error('Network error:', e);
      throw new Error('Erro de conexão com o servidor. Verifique se o backend está rodando.');
    }

    if (res.status === 401) {
      // Não redirecionar se estiver na página de login (evita loop)
      const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
      if (!isLoginPage) {
        localStorage.removeItem('geo_token');
        localStorage.removeItem('geo_user');
        window.location.href = '/index.html';
        return;
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Erro ${res.status}`);
    }

    return data;
  },

  get: (endpoint) => api._request('GET', endpoint),
  post: (endpoint, body) => api._request('POST', endpoint, body),
  put: (endpoint, body) => api._request('PUT', endpoint, body),
  delete: (endpoint) => api._request('DELETE', endpoint),

  async upload(endpoint, formData) {
    const token = localStorage.getItem('geo_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Erro no upload');
    return data;
  }
};
