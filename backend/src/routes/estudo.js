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

const { db } = require('../../firebase/firebase-admin');

async function rateLimitAluno(req, res, next) {
    if (req.user && req.user.tipo === 'aluno') {
        const alunoId = req.user.id;
        const hoje = new Date().toISOString().split('T')[0];
        const usageRef = db.collection('alunos_usage').doc(`${alunoId}_${hoje}`);
        
        try {
            const doc = await usageRef.get();
            let count = 0;
            if (doc.exists) {
                count = doc.data().rota27_uses || 0;
            }
            
            if (count >= 10) {
                return res.status(429).json({ erro: 'Limite diário de 10 usos atingido para a conta de Aluno.' });
            }
            
            await usageRef.set({ rota27_uses: count + 1 }, { merge: true });
        } catch (error) {
            console.error('Erro no rate limit do aluno:', error);
        }
    }
    next();
}

function validarRequisicao(req, res, next) {
    if (!req.body || !req.body.tema) {
        return res.status(400).json({ erro: "O campo 'tema' é obrigatório no corpo da requisição." });
    }
    next();
}

// Em vez de Blueprint (Flask), usamos express.Router
// Aplicamos o middleware authenticateToken para exigir login do GeoEduca
// Validamos se o body.tema existe
router.post('/gerarestudo', authenticateToken, rateLimitAluno, validarRequisicao, async (req, res) => {
    const resultado = await gerarConteudoEstudo(req.body.tema);
    res.json(resultado);
});

router.post('/gerarflashcards', authenticateToken, rateLimitAluno, validarRequisicao, async (req, res) => {
    const resultado = await gerarFlashcardsService(req.body.tema);
    res.json(resultado);
});

router.post('/gerarquiz', authenticateToken, rateLimitAluno, validarRequisicao, async (req, res) => {
    const resultado = await gerarQuizService(req.body.tema);
    res.json(resultado);
});

router.post('/gerarmapas', authenticateToken, rateLimitAluno, validarRequisicao, async (req, res) => {
    const resultado = await gerarMidiaMapasService(req.body.tema);
    res.json(resultado);
});

router.post('/gerarvideos', authenticateToken, rateLimitAluno, validarRequisicao, async (req, res) => {
    const resultado = await gerarVideosYoutubeService(req.body.tema);
    res.json(resultado);
});


router.get('/stats', authenticateToken, async (req, res) => {
    try {
        if (req.user && req.user.tipo === 'aluno') {
            const alunoId = req.user.id;
            const hoje = new Date().toISOString().split('T')[0];
            const usageRef = db.collection('alunos_usage').doc(`${alunoId}_${hoje}`);
            const doc = await usageRef.get();
            let count = 0;
            if (doc.exists) {
                count = doc.data().rota27_uses || 0;
            }
            res.json({ usesToday: count, limit: 10 });
        } else {
            res.json({ usesToday: 0, limit: 'Ilimitado' });
        }
    } catch (e) {
        res.json({ usesToday: 0, limit: 10 });
    }
});

module.exports = router;

