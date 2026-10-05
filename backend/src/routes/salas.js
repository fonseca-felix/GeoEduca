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
            codigo: Math.random().toString(36).substring(2, 8).toUpperCase(),
            createdAt: new Date().toISOString()
        };
        
        const docRef = await db.collection('salas').add(novaSala);
        
        res.status(201).json({
            id: docRef.id,
            ...novaSala
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
        const { nome, serie, turma, assunto } = req.body;
        
        const salaRef = db.collection('salas').doc(id);
        const sala = await salaRef.get();
        
        if (!sala.exists) {
            return res.status(404).json({ error: 'Sala não encontrada' });
        }
        
        const updates = {};
        if (nome !== undefined) updates.nome = nome;
        if (serie !== undefined) updates.serie = serie;
        if (turma !== undefined) updates.turma = turma;
        if (assunto !== undefined) updates.assunto = assunto;
        
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

// GET - Obter sala por código
router.get('/codigo/:codigo', authenticateToken, async (req, res) => {
    try {
        const { codigo } = req.params;
        const salasSnap = await db.collection('salas').where('codigo', '==', codigo).limit(1).get();
        
        if (salasSnap.empty) {
            return res.status(404).json({ error: 'Sala não encontrada para esse código.' });
        }
        
        const sala = salasSnap.docs[0];
        const data = sala.data();
        res.json({
            id: sala.id,
            nome: data.nome,
            serie: data.serie,
            turma: data.turma,
            assunto: data.assunto || '',
            codigo: data.codigo
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar sala por código' });
    }
});

// POST - Aluno entrar na sala
router.post('/entrar', authenticateToken, async (req, res) => {
    try {
        const { codigo } = req.body;
        const alunoId = req.user.id;
        
        if (!codigo) {
            return res.status(400).json({ error: 'Código da sala é obrigatório' });
        }
        
        if (req.user.tipo !== 'aluno') {
            return res.status(403).json({ error: 'Apenas alunos podem entrar via código.' });
        }

        const salasSnap = await db.collection('salas').where('codigo', '==', codigo).limit(1).get();
        if (salasSnap.empty) {
            return res.status(404).json({ error: 'Código inválido ou sala não encontrada.' });
        }
        
        const sala = salasSnap.docs[0];
        const salaData = sala.data();
        
        await db.collection('alunos').doc(alunoId).update({
            salaId: sala.id,
            salaNome: salaData.nome
        });
        
        res.json({ message: 'Você entrou na turma com sucesso!', sala: { id: sala.id, nome: salaData.nome } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao tentar entrar na turma' });
    }
});

// GET - Relatório da sala (alunos e métricas)
router.get('/:id/relatorio', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Pegar alunos
        const alunosSnap = await db.collection('alunos').where('salaId', '==', id).get();
        const alunos = alunosSnap.docs.map(d => ({ id: d.id, nome: d.data().nome, rm: d.data().rm }));
        
        // 2. Pegar contagem de provas enviadas para a sala (não importa qual)
        const provasEnviadasSnap = await db.collection('provas_enviadas').where('salaId', '==', id).get();
        // Agrupar provas por aluno
        const provasPorAluno = {};
        provasEnviadasSnap.forEach(d => {
            const data = d.data();
            const alunoId = data.alunoId;
            if (!provasPorAluno[alunoId]) provasPorAluno[alunoId] = { total: 0, respondidas: 0 };
            provasPorAluno[alunoId].total++;
        });

        // 3. Pegar respostas das provas para a sala
        // Note: As respostas têm 'alunoId' mas não necessariamente 'salaId', precisamos filtrar por aluno
        for (const aluno of alunos) {
            const respsSnap = await db.collection('prova_respostas').where('alunoId', '==', aluno.id).get();
            if (provasPorAluno[aluno.id]) {
                provasPorAluno[aluno.id].respondidas = respsSnap.size;
            } else {
                provasPorAluno[aluno.id] = { total: 0, respondidas: respsSnap.size };
            }
            aluno.metricas = provasPorAluno[aluno.id];
        }

        res.json({ alunos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
});

module.exports = router;
