const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const escolaController = require('../controllers/escolaController');

// Middleware para verificar se é Escola
const checkEscola = (req, res, next) => {
  if (req.user && req.user.tipo === 'escola') {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado: Requer privilégios de Escola' });
  }
};

router.use(authenticateToken);

router.post('/professor', checkEscola, escolaController.createProfessor);
router.get('/professores', checkEscola, escolaController.getProfessores);
router.get('/professores/:id', checkEscola, escolaController.getProfessorDetalhes);
router.put('/professores/:id/email', checkEscola, escolaController.updateProfessorEmail);
router.get('/stats', checkEscola, escolaController.getStats);

module.exports = router;
