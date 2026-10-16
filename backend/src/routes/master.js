const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const masterController = require('../controllers/masterController');

// Middleware para verificar se é Master
const checkMaster = (req, res, next) => {
  if (req.user && req.user.tipo === 'master') {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado: Requer privilégios Master' });
  }
};

router.use(authenticateToken);

router.post('/escola', checkMaster, masterController.createEscola);
router.get('/escolas', checkMaster, masterController.getEscolas);
router.delete('/escola/:id', checkMaster, masterController.deleteEscola);
router.get('/stats', checkMaster, masterController.getStats);

module.exports = router;
