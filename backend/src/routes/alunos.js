const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../../firebase/firebase-admin');
const { authenticateToken, requireProfessor, requireAluno } = require('../middleware/auth');

const router = express.Router();

async function somarPontosAluno(alunoId) {
    let pontos = 0;

    const [quizSnap, jogoSnap, provaSnap] = await Promise.all([
        db.collection('quiz_respostas').where('alunoId', '==', alunoId).get(),
        db.collection('jogo_pontuacoes').where('alunoId', '==', alunoId).get(),
        db.collection('prova_respostas').where('alunoId', '==', alunoId).get()
    ]);

    quizSnap.forEach(doc => { pontos += Number(doc.data().pontuacao) || 0; });
    jogoSnap.forEach(doc => { pontos += Number(doc.data().pontuacao) || 0; });
    provaSnap.forEach(doc => { pontos += Number(doc.data().notaAutomatica) || 0; });

    return pontos;
}

// GET - Resumo do aluno logado (pontos, quizzes, provas)
router.get('/me/resumo', authenticateToken, requireAluno, async (req, res) => {
    try {
        const alunoId = req.user.id;

        const quizSnap = await db.collection('quiz_respostas').where('alunoId', '==', alunoId).get();
        let pontuacaoQuizzes = 0;
        quizSnap.forEach(doc => { pontuacaoQuizzes += Number(doc.data().pontuacao) || 0; });

        const provaSnap = await db.collection('prova_respostas').where('alunoId', '==', alunoId).get();

        const jogoSnap = await db.collection('jogo_pontuacoes').where('alunoId', '==', alunoId).get();
        let pontosJogos = 0;
        jogoSnap.forEach(doc => { pontosJogos += Number(doc.data().pontuacao) || 0; });

        const xpTotal = pontuacaoQuizzes + pontosJogos + provaSnap.size * 10;
        const xpPorNivel = 200;
        const nivel = Math.max(1, Math.floor(xpTotal / xpPorNivel) + 1);
        const xpNoNivel = xpTotal % xpPorNivel;
        const xpProximoNivel = xpPorNivel;

        res.json({
            nome: req.user.nome,
            salaNome: req.user.salaNome || '',
            quizzesConcluidos: quizSnap.size,
            pontuacaoQuizzes,
            provasEnviadas: provaSnap.size,
            pontosJogos,
            xpTotal,
            nivel,
            xpNoNivel,
            xpProximoNivel,
            progressoPct: Math.round((xpNoNivel / xpProximoNivel) * 100)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao carregar resumo do aluno' });
    }
});

// GET - Ranking da turma (mesma sala)
router.get('/ranking/turma', authenticateToken, requireAluno, async (req, res) => {
    try {
        const alunoId = req.user.id;
        const salaId = req.user.salaId;

        if (!salaId) {
            return res.json([]);
        }

        const alunosSnap = await db.collection('alunos').where('salaId', '==', salaId).get();
        const ranking = [];

        for (const alunoDoc of alunosSnap.docs) {
            const pontos = await somarPontosAluno(alunoDoc.id);
            ranking.push({
                alunoId: alunoDoc.id,
                nome: alunoDoc.data().nome,
                salaNome: alunoDoc.data().salaNome || '',
                pontos,
                voce: alunoDoc.id === alunoId
            });
        }

        ranking.sort((a, b) => b.pontos - a.pontos);
        res.json(ranking.filter(r => r.pontos > 0).slice(0, 10));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao carregar ranking da turma' });
    }
});

// GET - Listar todos os alunos (apenas professor)
router.get('/', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const alunosRef = db.collection('alunos');
        const snapshot = await alunosRef.get();
        
        const alunos = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            alunos.push({
                id: doc.id,
                rm: data.rm,
                nome: data.nome,
                salaId: data.salaId,
                salaNome: data.salaNome,
                senhaVisivel: data.senhaVisivel || null,
                createdAt: data.createdAt
            });
        });
        
        res.json(alunos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar alunos' });
    }
});

// GET - Alunos por sala
router.get('/sala/:salaId', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { salaId } = req.params;
        const alunosRef = db.collection('alunos');
        const snapshot = await alunosRef.where('salaId', '==', salaId).get();
        
        const alunos = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            alunos.push({
                id: doc.id,
                rm: data.rm,
                nome: data.nome,
                salaId: data.salaId,
                salaNome: data.salaNome,
                senhaVisivel: data.senhaVisivel || null
            });
        });
        
        res.json(alunos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar alunos da sala' });
    }
});

// GET - Obter aluno por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar permissão: professor ou o próprio aluno
        if (req.user.tipo === 'aluno' && req.user.id !== id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        
        const alunoRef = db.collection('alunos').doc(id);
        const aluno = await alunoRef.get();
        
        if (!aluno.exists) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }
        
        const data = aluno.data();
        res.json({
            id: aluno.id,
            rm: data.rm,
            nome: data.nome,
            salaId: data.salaId,
            salaNome: data.salaNome,
            createdAt: data.createdAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar aluno' });
    }
});

// POST - Criar novo aluno
router.post('/', authenticateToken, requireProfessor, async (req, res) => {
    try {
        let { rm, nome, senha, salaId } = req.body;
        
        if (!rm || !nome || !senha || !salaId) {
            return res.status(400).json({ error: 'RM, nome, senha e sala são obrigatórios' });
        }

        // Capitalizar primeira letra
        nome = nome.charAt(0).toUpperCase() + nome.slice(1);
        
        // Verificar se RM já existe
        const rmCheck = await db.collection('alunos').where('rm', '==', rm).limit(1).get();
        if (!rmCheck.empty) {
            return res.status(400).json({ error: 'RM já cadastrado' });
        }
        
        // Verificar se sala existe
        const salaRef = db.collection('salas').doc(salaId);
        const sala = await salaRef.get();
        if (!sala.exists) {
            return res.status(404).json({ error: 'Sala não encontrada' });
        }
        
        const hashedPassword = await bcrypt.hash(senha, 10);
        const salaData = sala.data();
        
        const novoAluno = {
            rm,
            nome,
            senha: hashedPassword,
            senhaVisivel: senha,
            salaId,
            salaNome: salaData.nome,
            createdAt: new Date().toISOString()
        };
        
        const docRef = await db.collection('alunos').add(novoAluno);
        
        res.status(201).json({
            id: docRef.id,
            rm,
            nome,
            senhaVisivel: senha,
            salaId,
            salaNome: salaData.nome
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar aluno' });
    }
});

// PUT - Atualizar aluno
router.put('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        let { nome, rm, senha, salaId } = req.body;
        
        const alunoRef = db.collection('alunos').doc(id);
        const aluno = await alunoRef.get();
        
        if (!aluno.exists) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }
        
        const updates = {};

        if (rm && rm !== aluno.data().rm) {
            // Verificar se novo RM já existe
            const rmCheck = await db.collection('alunos').where('rm', '==', rm).limit(1).get();
            if (!rmCheck.empty) {
                return res.status(400).json({ error: 'RM já cadastrado por outro aluno' });
            }
            updates.rm = rm;
        }

        if (nome) {
            updates.nome = nome.charAt(0).toUpperCase() + nome.slice(1);
        }
        
        if (senha) {
            updates.senha = await bcrypt.hash(senha, 10);
            updates.senhaVisivel = senha;
        }
        
        if (salaId) {
            const salaRef = db.collection('salas').doc(salaId);
            const sala = await salaRef.get();
            if (!sala.exists) {
                return res.status(404).json({ error: 'Sala não encontrada' });
            }
            updates.salaId = salaId;
            updates.salaNome = sala.data().nome;
        }
        
        await alunoRef.update(updates);
        
        res.json({ message: 'Aluno atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar aluno' });
    }
});

// DELETE - Remover aluno
router.delete('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        
        const alunoRef = db.collection('alunos').doc(id);
        const aluno = await alunoRef.get();
        
        if (!aluno.exists) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }
        
        await alunoRef.delete();
        
        res.json({ message: 'Aluno removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover aluno' });
    }
});

module.exports = router;
