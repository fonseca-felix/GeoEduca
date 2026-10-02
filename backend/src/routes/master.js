const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');

// Middleware para verificar se é Master
const checkMaster = (req, res, next) => {
  if (req.user && req.user.tipo === 'master') {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado: Requer privilégios Master' });
  }
};

router.post('/escola', checkMaster, masterController.createEscola);
router.get('/escolas', checkMaster, masterController.getEscolas);
router.get('/stats', checkMaster, masterController.getStats);

module.exports = router;
