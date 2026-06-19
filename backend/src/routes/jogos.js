const express = require('express');
const { db } = require('../../firebase/firebase-admin');
const { authenticateToken, requireProfessor, requireAluno } = require('../middleware/auth');

const router = express.Router();

// GET - Listar todos os jogos
router.get('/', authenticateToken, async (req, res) => {
    try {
        const jogosRef = db.collection('jogos');
        const snapshot = await jogosRef.get();

        const jogos = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            jogos.push({
                id: doc.id,
                titulo: data.titulo,
                descricao: data.descricao,
                tipo: data.tipo,
                imagem: data.imagem,
                link: data.link,
                pontuacaoMaxima: data.pontuacaoMaxima,
                createdAt: data.createdAt
            });
        });

        res.json(jogos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar jogos' });
    }
});

// GET - Ranking de um jogo
router.get('/:id/ranking', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const jogoRef = db.collection('jogos').doc(id);
        const jogo = await jogoRef.get();

        if (!jogo.exists) {
            return res.status(404).json({ error: 'Jogo não encontrado' });
        }

        const pontuacoesRef = db.collection('jogo_pontuacoes');
        const snapshot = await pontuacoesRef
            .where('jogoId', '==', id)
            .orderBy('pontuacao', 'desc')
            .limit(10)
            .get();

        const ranking = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const alunoRef = db.collection('alunos').doc(data.alunoId);
            const aluno = await alunoRef.get();

            ranking.push({
                posicao: ranking.length + 1,
                alunoId: data.alunoId,
                alunoNome: aluno.exists ? aluno.data().nome : 'Aluno removido',
                pontuacao: data.pontuacao,
                data: data.data
            });
        }

        res.json({
            jogo: { id: jogo.id, titulo: jogo.data().titulo },
            ranking
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar ranking' });
    }
});

// GET - Minha pontuação em um jogo
router.get('/:id/minha-pontuacao', authenticateToken, requireAluno, async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;

        const pontuacoesRef = db.collection('jogo_pontuacoes');
        const snapshot = await pontuacoesRef
            .where('jogoId', '==', id)
            .where('alunoId', '==', alunoId)
            .orderBy('pontuacao', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.json({ jogou: false, pontuacao: null });
        }

        const data = snapshot.docs[0].data();
        res.json({
            jogou: true,
            pontuacao: data.pontuacao,
            data: data.data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pontuação' });
    }
});

// GET - Estatisticas avançadas do aluno no jogo (diário, semanal, mensal, etc)
router.get('/:id/estatisticas', authenticateToken, requireAluno, async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;

        const pontuacoesRef = db.collection('jogo_pontuacoes');
        const snapshot = await pontuacoesRef
            .where('jogoId', '==', id)
            .where('alunoId', '==', alunoId)
            .get();

        let total = 0;
        let semanal = 0;
        let mensal = 0;
        let trimestral = 0;
        let semestral = 0;
        let anual = 0;
        let partidasHoje = 0;

        const now = new Date();
        const hojeLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        snapshot.forEach(doc => {
            const data = doc.data();
            const pts = data.pontuacao || 0;
            const pDate = new Date(data.data);

            total += pts;

            const diffTime = Math.abs(now - pDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 7) semanal += pts;
            if (diffDays <= 30) mensal += pts;
            if (diffDays <= 90) trimestral += pts;
            if (diffDays <= 180) semestral += pts;
            if (diffDays <= 365) anual += pts;

            const pDateLocal = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate());
            if (pDateLocal.getTime() === hojeLocal.getTime()) {
                partidasHoje++;
            }
        });

        res.json({
            total,
            semanal,
            mensal,
            trimestral,
            semestral,
            anual,
            partidasHoje,
            limiteDiario: 10
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// GET - Resultados do jogo para o professor (filtrado por sala)
router.get('/:id/resultados-professor/:salaId', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id, salaId } = req.params;
        
        // Buscar alunos da sala
        const alunosSnap = await db.collection('alunos').where('salaId', '==', salaId).get();
        if (alunosSnap.empty) {
            return res.json([]);
        }

        const alunosMap = {};
        alunosSnap.forEach(doc => {
            alunosMap[doc.id] = doc.data();
        });

        const alunosIds = Object.keys(alunosMap);

        // Buscar pontuações apenas para esses alunos
        const pontuacoesRef = db.collection('jogo_pontuacoes');
        
        // Note: Firestore 'in' query has a limit of 10 elements. 
        // For a full app, we fetch all scores for the game and filter in memory, 
        // or chunk the queries. Let's fetch all scores for the game and filter in memory.
        const snapshot = await pontuacoesRef.where('jogoId', '==', id).get();

        const alunosStats = {};
        const now = new Date();

        snapshot.forEach(doc => {
            const data = doc.data();
            const aId = data.alunoId;

            if (alunosMap[aId]) {
                if (!alunosStats[aId]) {
                    alunosStats[aId] = {
                        alunoId: aId,
                        alunoNome: alunosMap[aId].nome,
                        total: 0,
                        semanal: 0,
                        mensal: 0,
                        anual: 0
                    };
                }

                const pts = data.pontuacao || 0;
                const pDate = new Date(data.data);
                const diffTime = Math.abs(now - pDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                alunosStats[aId].total += pts;
                if (diffDays <= 7) alunosStats[aId].semanal += pts;
                if (diffDays <= 30) alunosStats[aId].mensal += pts;
                if (diffDays <= 365) alunosStats[aId].anual += pts;
            }
        });

        res.json(Object.values(alunosStats).sort((a, b) => b.total - a.total));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar resultados da sala' });
    }
});

// GET - Resultados completos do jogo para o professor (Global, por Salas e por Turma)
router.get('/:id/resultados-completos', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [alunosSnap, salasSnap, pontuacoesSnap] = await Promise.all([
            db.collection('alunos').get(),
            db.collection('salas').get(),
            db.collection('jogo_pontuacoes').where('jogoId', '==', id).get()
        ]);

        const salasMap = {};
        salasSnap.forEach(doc => {
            const data = doc.data();
            salasMap[doc.id] = { id: doc.id, nome: data.nome, serie: data.serie, turma: data.turma || '', totalPts: 0 };
        });

        const alunosStats = {};
        alunosSnap.forEach(doc => {
            const data = doc.data();
            alunosStats[doc.id] = {
                alunoId: doc.id,
                alunoNome: data.nome,
                salaId: data.salaId,
                total: 0,
                semanal: 0,
                mensal: 0,
                trimestral: 0,
                semestral: 0,
                anual: 0
            };
        });

        const now = new Date();

        pontuacoesSnap.forEach(doc => {
            const data = doc.data();
            const aId = data.alunoId;

            if (alunosStats[aId]) {
                const pts = data.pontuacao || 0;
                const pDate = new Date(data.data);
                const diffTime = Math.abs(now - pDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                alunosStats[aId].total += pts;
                if (diffDays <= 7) alunosStats[aId].semanal += pts;
                if (diffDays <= 30) alunosStats[aId].mensal += pts;
                if (diffDays <= 90) alunosStats[aId].trimestral += pts;
                if (diffDays <= 180) alunosStats[aId].semestral += pts;
                if (diffDays <= 365) alunosStats[aId].anual += pts;
                
                const sId = alunosStats[aId].salaId;
                if (sId && salasMap[sId]) {
                    salasMap[sId].totalPts += pts;
                }
            }
        });

        const globalRanking = Object.values(alunosStats).sort((a, b) => b.total - a.total);
        const salasRanking = Object.values(salasMap).sort((a, b) => b.totalPts - a.totalPts);
        
        const porSala = {};
        Object.keys(salasMap).forEach(sId => {
            porSala[sId] = Object.values(alunosStats)
                .filter(a => a.salaId === sId)
                .sort((a, b) => b.total - a.total);
        });

        res.json({
            global: globalRanking,
            salas: salasRanking,
            porSala: porSala,
            salasInfo: Object.values(salasMap)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar resultados completos' });
    }
});

// POST - Criar novo jogo
router.post('/', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { titulo, descricao, tipo, imagem, link, pontuacaoMaxima } = req.body;

        if (!titulo || !tipo) {
            return res.status(400).json({ error: 'Título e tipo são obrigatórios' });
        }

        const novoJogo = {
            titulo,
            descricao: descricao || '',
            tipo,
            imagem: imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
            link: link || '',
            pontuacaoMaxima: pontuacaoMaxima || 100,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('jogos').add(novoJogo);

        res.status(201).json({
            id: docRef.id,
            ...novoJogo
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar jogo' });
    }
});

// POST - Registrar pontuação do aluno
router.post('/:id/pontuacao', authenticateToken, requireAluno, async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;
        const { pontuacao } = req.body;

        if (pontuacao === undefined || pontuacao === null) {
            return res.status(400).json({ error: 'Pontuação é obrigatória' });
        }

        if (id !== 'brazilguessr') {
            const jogoRef = db.collection('jogos').doc(id);
            const jogo = await jogoRef.get();

            if (!jogo.exists) {
                return res.status(404).json({ error: 'Jogo não encontrado' });
            }
        }

        // Limit check
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        
        const jogadasSnap = await db.collection('jogo_pontuacoes')
            .where('jogoId', '==', id)
            .where('alunoId', '==', alunoId)
            .get();
            
        let jogadasHojeCount = 0;
        jogadasSnap.forEach(doc => {
            if (doc.data().data >= startOfDay) {
                jogadasHojeCount++;
            }
        });

        if (jogadasHojeCount >= 10) {
            return res.status(403).json({ error: 'Limite diário de 10 partidas atingido.' });
        }

        await db.collection('jogo_pontuacoes').add({
            jogoId: id,
            alunoId,
            pontuacao: Number(pontuacao),
            data: new Date().toISOString()
        });

        res.status(201).json({ message: 'Pontuação registrada com sucesso', pontuacao });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar pontuação' });
    }
});

// PUT - Atualizar jogo
router.put('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descricao, tipo, imagem, link, pontuacaoMaxima } = req.body;

        const jogoRef = db.collection('jogos').doc(id);
        const jogo = await jogoRef.get();

        if (!jogo.exists) {
            return res.status(404).json({ error: 'Jogo não encontrado' });
        }

        const updates = {};
        if (titulo) updates.titulo = titulo;
        if (descricao !== undefined) updates.descricao = descricao;
        if (tipo) updates.tipo = tipo;
        if (imagem) updates.imagem = imagem;
        if (link !== undefined) updates.link = link;
        if (pontuacaoMaxima) updates.pontuacaoMaxima = pontuacaoMaxima;

        await jogoRef.update(updates);

        res.json({ message: 'Jogo atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar jogo' });
    }
});

// DELETE - Remover jogo
router.delete('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;

        const jogoRef = db.collection('jogos').doc(id);
        const jogo = await jogoRef.get();

        if (!jogo.exists) {
            return res.status(404).json({ error: 'Jogo não encontrado' });
        }

        await jogoRef.delete();

        res.json({ message: 'Jogo removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover jogo' });
    }
});

module.exports = router;
