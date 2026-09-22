const express = require('express');
const router = express.Router();
const { db } = require('../../firebase/firebase-admin');
const { gerarProvaGeografia } = require('../services/geminiService');

// Gerar nova prova via IA
router.post('/gerar', async (req, res) => {
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

// Listar provas salvas
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('banco_provas')
            .orderBy('criadoEm', 'desc')
            .get();
        const provas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(provas);
    } catch (err) {
        console.error("Erro ao buscar banco de provas:", err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// Salvar uma prova no banco
router.post('/', async (req, res) => {
    try {
        const { titulo, descricao, tema, questoes } = req.body;
        
        if (!titulo || !questoes || !Array.isArray(questoes)) {
            return res.status(400).json({ error: 'Dados inválidos da prova.' });
        }

        const novaProva = {
            titulo,
            descricao: descricao || '',
            tema: tema || '',
            questoes,
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
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('banco_provas').doc(id).delete();
        res.json({ success: true });
    } catch (err) {
        console.error("Erro ao deletar prova:", err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

module.exports = router;
