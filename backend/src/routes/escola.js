const express = require('express');
const router = express.Router();
const escolaController = require('../controllers/escolaController');

// Middleware para verificar se é Escola
const checkEscola = (req, res, next) => {
  if (req.user && req.user.tipo === 'escola') {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado: Requer privilégios de Escola' });
  }
};

router.post('/professor', checkEscola, escolaController.createProfessor);
router.get('/professores', checkEscola, escolaController.getProfessores);
router.get('/professores/:id', checkEscola, escolaController.getProfessorDetalhes);
router.get('/stats', checkEscola, escolaController.getStats);

module.exports = router;
