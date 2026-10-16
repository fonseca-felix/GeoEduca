/* =============================================
   GeoEduca API Client
   Centralized fetch with auth headers
   ============================================= */

// Detecta automaticamente onde está o backend
let API_BASE;
if (window.location.protocol === 'file:') {
  // Abrindo arquivo diretamente (double-click index.html)
  API_BASE = 'http://localhost:3000/api';
} else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Desenvolvimento local (Live Server ou npx serve)
  API_BASE = 'http://localhost:3000/api';
} else {
  // Produção (Render): Frontend e Backend dividem a mesma URL
  API_BASE = `${window.location.origin}/api`;
}

const API_CACHE_PREFIX = 'geo_api_cache_';
const API_CACHE_TTL_MS = 45 * 1000; // 45 segundos no navegador
const _inFlightGet = new Map();

const api = {
  _getHeaders() {
    const token = localStorage.getItem('geo_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  clearCache() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(API_CACHE_PREFIX)) keysToRemove.push(k);
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch (e) { /* ignore */ }
    _inFlightGet.clear();
  },

  _getCached(endpoint) {
    try {
      const token = (localStorage.getItem('geo_token') || '').slice(-16);
      const raw = sessionStorage.getItem(`${API_CACHE_PREFIX}${token}_${endpoint}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() > parsed.expiresAt) {
        sessionStorage.removeItem(`${API_CACHE_PREFIX}${token}_${endpoint}`);
        return null;
      }
      return parsed.data;
    } catch (e) {
      return null;
    }
  },

  _setCached(endpoint, data) {
    try {
      const token = (localStorage.getItem('geo_token') || '').slice(-16);
      sessionStorage.setItem(
        `${API_CACHE_PREFIX}${token}_${endpoint}`,
        JSON.stringify({ data, expiresAt: Date.now() + API_CACHE_TTL_MS })
      );
    } catch (e) { /* ignore quota errors */ }
  },

  async _request(method, endpoint, body = null) {
    if (method === 'GET' && endpoint !== '/csrf-token') {
      const cached = this._getCached(endpoint);
      if (cached !== null) return cached;
      if (_inFlightGet.has(endpoint)) return _inFlightGet.get(endpoint);
    }

    const execPromise = (async () => {
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
        const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        if (!isLoginPage) {
          localStorage.removeItem('geo_token');
          localStorage.removeItem('geo_user');
          this.clearCache();
          window.location.href = '/index.html';
          return;
        }
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Erro ${res.status}`);
      }

      if (method === 'GET' && endpoint !== '/csrf-token') {
        this._setCached(endpoint, data);
      } else if (method !== 'GET') {
        this.clearCache();
      }

      return data;
    })();

    if (method === 'GET' && endpoint !== '/csrf-token') {
      _inFlightGet.set(endpoint, execPromise);
      execPromise.finally(() => _inFlightGet.delete(endpoint));
    }

    return execPromise;
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
    this.clearCache();
    return data;
  }
};
