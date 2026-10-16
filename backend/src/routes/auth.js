const express = require('express');
const { login, verifyToken, resendVerificationCode, forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();

// Nova rota unificada de login
router.post('/login', login);

// Reenviar código de confirmação de 1º acesso do professor
router.post('/resend-verification', resendVerificationCode);

// Recuperação de senha do professor via Gmail
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Verificar token
router.get('/verify', verifyToken);

// Para manter compatibilidade temporária com o frontend atual, redirecionar
// os endpoints antigos para o novo método
router.post('/login/professor', async (req, res) => {
    // Adapter to match new login fields
    req.body.identificador = req.body.email || req.body.nome;
    return login(req, res);
});

router.post('/login/aluno', async (req, res) => {
    req.body.identificador = req.body.rm;
    return login(req, res);
});

module.exports = router;
