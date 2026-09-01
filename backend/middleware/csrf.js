const crypto = require('crypto');

/**
 * CSRF protection middleware using double‑submit cookie pattern.
 * Reads token from cookie `XSRF-TOKEN` and compares with `_csrf`
 * field submitted in request body.
 */
function csrfProtection(req, res, next) {
  const tokenCookie = req.cookies && req.cookies['XSRF-TOKEN'];
  const tokenBody = req.body && req.body._csrf;

  if (!tokenCookie || !tokenBody || tokenCookie !== tokenBody) {
    return res.status(403).json({ error: 'CSRF token inválido' });
  }
  next();
}

/**
 * Generates a new CSRF token, stores it in a cookie (readable by JavaScript)
 * and returns it in the response body.
 */
function generateCsrfToken(req, res) {
  const token = crypto.randomBytes(24).toString('hex');
  // Cookie accessible from client-side JavaScript (not HttpOnly)
  res.cookie('XSRF-TOKEN', token, { sameSite: 'strict' });
  res.json({ csrfToken: token });
}

module.exports = { csrfProtection, generateCsrfToken };
