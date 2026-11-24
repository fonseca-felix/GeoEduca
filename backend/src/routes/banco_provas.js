const express = require('express');
const router = express.Router();
const { db } = require('../../firebase/firebase-admin');
const { gerarProvaGeografia } = require('../services/geminiService');
const { authenticateToken, requireProfessor } = require('../middleware/auth');

// Gerar nova prova via IA
router.post('/gerar', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { tema, quantidade, nivel } = req.body;
        if (!tema) return res.status(400).json({ error: 'O tema é obrigatório.' });

        const qty = parseInt(quantidade) || 5;
        const limitQty = Math.min(Math.max(qty, 1), 50); // limita entre 1 e 50

        const geminiRes = await gerarProvaGeografia(tema, limitQty, nivel);
        if (!geminiRes.sucesso) {
            return res.status(400).json({ error: geminiRes.erro });
        }

        res.json(geminiRes.dados);
    } catch (err) {
        console.error("Erro em /banco_provas/gerar:", err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// Listar provas salvas (filtrado por professor)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const snapshot = await db.collection('banco_provas')
            .orderBy('criadoEm', 'desc')
            .get();
        let docs = snapshot.docs;
        if (req.user && req.user.tipo === 'prof') {
            docs = docs.filter(doc => doc.data().professorId === req.user.id);
        }
        const provas = docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(provas);
    } catch (err) {
        console.error("Erro ao buscar banco de provas:", err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// Salvar uma prova no banco
router.post('/', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { titulo, descricao, tema, questoes } = req.body;
        const professorId = req.user.id;
        
        if (!titulo || !questoes || !Array.isArray(questoes)) {
            return res.status(400).json({ error: 'Dados inválidos da prova.' });
        }

        const novaProva = {
            titulo,
            descricao: descricao || '',
            tema: tema || '',
            questoes,
            professorId,
            criadoEm: new Date().toISOString()
        };

        const docRef = await db.collection('banco_provas').add(novaProva);
        res.status(201).json({ id: docRef.id, ...novaProva });
    } catch (err) {
        console.error("Erro ao salvar prova no banco:", err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// Deletar uma prova
router.delete('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        const docRef = db.collection('banco_provas').doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Prova não encontrada no banco.' });
        }
        if (req.user.tipo === 'prof' && docSnap.data().professorId && docSnap.data().professorId !== req.user.id) {
            return res.status(403).json({ error: 'Você não tem permissão para excluir esta prova.' });
        }
        await docRef.delete();
        res.json({ success: true });
    } catch (err) {
        console.error("Erro ao deletar prova:", err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

module.exports = router;
