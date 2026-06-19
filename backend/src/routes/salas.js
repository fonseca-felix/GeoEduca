const express = require('express');
const { db } = require('../../firebase/firebase-admin');
const { authenticateToken, requireProfessor } = require('../middleware/auth');

const router = express.Router();

// GET - Listar todas as salas
router.get('/', authenticateToken, async (req, res) => {
    try {
        const salasRef = db.collection('salas');
        const snapshot = await salasRef.get();
        
        const salas = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            salas.push({
                id: doc.id,
                nome: data.nome,
                serie: data.serie,
                turma: data.turma,
                assunto: data.assunto || '',
                createdAt: data.createdAt
            });
        });
        
        res.json(salas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar salas' });
    }
});

// GET - Obter sala por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const salaRef = db.collection('salas').doc(id);
        const sala = await salaRef.get();
        
        if (!sala.exists) {
            return res.status(404).json({ error: 'Sala não encontrada' });
        }
        
        const data = sala.data();
        res.json({
            id: sala.id,
            nome: data.nome,
            serie: data.serie,
            turma: data.turma,
            assunto: data.assunto || '',
            createdAt: data.createdAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar sala' });
    }
});

// POST - Criar nova sala
router.post('/', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { nome, serie, turma, assunto } = req.body;
        
        if (!nome || !serie || !turma) {
            return res.status(400).json({ error: 'Nome, série e turma são obrigatórios' });
        }
        
        const novaSala = {
            nome,
            serie,
            turma,
            assunto: assunto || '',
            createdAt: new Date().toISOString()
        };
        
        const docRef = await db.collection('salas').add(novaSala);
        
        res.status(201).json({
            id: docRef.id,
            nome,
            serie,
            turma,
            assunto: assunto || ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar sala' });
    }
});

// PUT - Atualizar sala
router.put('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, serie, turma } = req.body;
        
        const salaRef = db.collection('salas').doc(id);
        const sala = await salaRef.get();
        
        if (!sala.exists) {
            return res.status(404).json({ error: 'Sala não encontrada' });
        }
        
        const updates = {};
        if (nome) updates.nome = nome;
        if (serie) updates.serie = serie;
        if (turma) updates.turma = turma;
        
        await salaRef.update(updates);
        
        res.json({ message: 'Sala atualizada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar sala' });
    }
});

// DELETE - Remover sala
router.delete('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        
        const salaRef = db.collection('salas').doc(id);
        const sala = await salaRef.get();
        
        if (!sala.exists) {
            return res.status(404).json({ error: 'Sala não encontrada' });
        }
        
        // Verificar se há alunos na sala
        const alunosRef = db.collection('alunos');
        const alunos = await alunosRef.where('salaId', '==', id).limit(1).get();
        
        if (!alunos.empty) {
            return res.status(400).json({ error: 'Não é possível remover sala com alunos. Remova os alunos primeiro.' });
        }
        
        await salaRef.delete();
        
        res.json({ message: 'Sala removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover sala' });
    }
});

module.exports = router;
