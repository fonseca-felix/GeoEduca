const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { 
    gerarConteudoEstudo,
    gerarFlashcardsService,
    gerarQuizService,
    gerarMidiaMapasService,
    gerarVideosYoutubeService
} = require('../services/geminiService');

const router = express.Router();

function validarRequisicao(req, res, next) {
    if (!req.body || !req.body.tema) {
        return res.status(400).json({ erro: "O campo 'tema' é obrigatório no corpo da requisição." });
    }
    next();
}

// Em vez de Blueprint (Flask), usamos express.Router
// Aplicamos o middleware authenticateToken para exigir login do GeoEduca
// Validamos se o body.tema existe
router.post('/gerarestudo', authenticateToken, validarRequisicao, async (req, res) => {
    const resultado = await gerarConteudoEstudo(req.body.tema);
    res.json(resultado);
});

router.post('/gerarflashcards', authenticateToken, validarRequisicao, async (req, res) => {
    const resultado = await gerarFlashcardsService(req.body.tema);
    res.json(resultado);
});

router.post('/gerarquiz', authenticateToken, validarRequisicao, async (req, res) => {
    const resultado = await gerarQuizService(req.body.tema);
    res.json(resultado);
});

router.post('/gerarmapas', authenticateToken, validarRequisicao, async (req, res) => {
    const resultado = await gerarMidiaMapasService(req.body.tema);
    res.json(resultado);
});

router.post('/gerarvideos', authenticateToken, validarRequisicao, async (req, res) => {
    const resultado = await gerarVideosYoutubeService(req.body.tema);
    res.json(resultado);
});

module.exports = router;
