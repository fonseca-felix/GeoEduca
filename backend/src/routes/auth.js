const express = require('express');
const { login, verifyToken } = require('../controllers/authController');

const router = express.Router();

// Nova rota unificada de login
router.post('/login', login);

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
