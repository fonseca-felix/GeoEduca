const express = require('express');
const router = express.Router();
const multer = require('multer');
const { corrigirProvaFisica } = require('../controllers/leitorController');
const { verifyToken } = require('../controllers/authController');

// Configuração do multer para manter a imagem em memória (buffer) para enviar direto pra IA
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // limite de 5MB
});

// Middleware simples para garantir que quem acessa é professor
const isProfessor = async (req, res, next) => {
    // Usamos a logica basica do verifyToken que o app já tem, e vamos verificar se o usuario foi injetado
    // Como a rota depende do req.user, precisamos de um middleware de auth.
    // O sistema GeoEduca atualmente não tem um authMiddleware exportado padrão nas rotas,
    // as rotas privadas geralmente checam os cabeçalhos.
    next();
};

// Como o projeto não tem um middleware global exportado, podemos importar do server ou apenas criar um básico aqui:
const authMiddleware = async (req, res, next) => {
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026');
        req.user = decoded;
        if (decoded.tipo !== 'prof' && decoded.tipo !== 'master') {
            return res.status(403).json({ error: 'Acesso restrito a professores.' });
        }
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
};

router.post('/corrigir', authMiddleware, upload.single('imagem'), corrigirProvaFisica);

module.exports = router;
