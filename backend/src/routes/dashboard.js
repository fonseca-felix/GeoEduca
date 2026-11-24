const express = require('express');
const { db } = require('../../firebase/firebase-admin');
const { authenticateToken, requireProfessor } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard - Resumo geral para a professora/professor
router.get('/', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const profId = req.user.id;

        // Buscar em paralelo para performance
        const [alunosSnap, salasSnap, quizzesSnap, atividadesSnap, provasSnap, respostasSnap, respostasProvaSnap] = await Promise.all([
            db.collection('alunos').get(),
            db.collection('salas').get(),
            db.collection('quizzes').get(),
            db.collection('atividades').orderBy('createdAt', 'desc').get(),
            db.collection('provas').get(),
            db.collection('quiz_respostas').get(),
            db.collection('prova_respostas').get()
        ]);

        // Manter alunos e salas globais da escola (alunos mantidos em suas devidas salas)
        const totalAlunos = alunosSnap.size;
        const totalSalas = salasSnap.size;

        // Filtrar Provas, Quizzes e Atividades pertencentes a ESTE professor
        const profProvasDocs = provasSnap.docs.filter(d => d.data().professorId === profId);
        const profQuizzesDocs = quizzesSnap.docs.filter(d => d.data().professorId === profId);
        const profAtividadesDocs = atividadesSnap.docs.filter(d => d.data().professorId === profId);

        const totalProvas = profProvasDocs.length;
        const totalQuizzes = profQuizzesDocs.length;
        const totalAtividades = profAtividadesDocs.length;

        const profProvaIds = new Set(profProvasDocs.map(d => d.id));
        const profQuizIds = new Set(profQuizzesDocs.map(d => d.id));

        // Respostas apenas de provas e quizzes deste professor
        const totalRespostasQuiz = respostasSnap.docs.filter(d => profQuizIds.has(d.data().quizId)).length;
        const totalRespostasProva = respostasProvaSnap.docs.filter(d => profProvaIds.has(d.data().provaId)).length;

        // Contagem de alunos por sala (salas mantidas para todos)
        const alunosPorSala = {};
        alunosSnap.forEach(doc => {
            const d = doc.data();
            const studentRooms = Array.isArray(d.salas) && d.salas.length > 0 ? d.salas : (d.salaId ? [d.salaId] : []);
            studentRooms.forEach(sId => {
                alunosPorSala[sId] = (alunosPorSala[sId] || 0) + 1;
            });
        });

        // Top salas com mais alunos
        const salasComAlunos = [];
        salasSnap.forEach(doc => {
            const d = doc.data();
            salasComAlunos.push({
                id: doc.id,
                nome: d.nome,
                serie: d.serie,
                turma: d.turma,
                totalAlunos: alunosPorSala[doc.id] || 0,
            });
        });

        // Ordenar pela ordem padrão (série + turma) e pegar top 5 com alunos
        const ordemSeries = ['6º', '7º', '8º', '9º', '1ª', '2ª', '3ª'];
        salasComAlunos.sort((a, b) => {
            const iA = ordemSeries.findIndex(s => (a.serie || '').startsWith(s));
            const iB = ordemSeries.findIndex(s => (b.serie || '').startsWith(s));
            if (iA !== iB) return iA - iB;
            return (a.turma || '').localeCompare(b.turma || '');
        });

        const topSalas = salasComAlunos.slice(0, 6);

        // Atividades recentes DESTE professor (últimas 5 criadas)
        const atividadesRecentes = profAtividadesDocs.slice(0, 5).map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                titulo: d.titulo,
                tipo: d.tipo,
                salaNome: d.salaNome || '',
                createdAt: d.createdAt,
            };
        });

        res.json({
            stats: {
                totalAlunos,
                totalSalas,
                totalQuizzes,
                totalAtividades,
                totalProvas,
                totalRespostasQuiz,
                totalRespostasProva,
            },
            topSalas,
            atividadesRecentes,
        });
    } catch (error) {
        console.error('Erro no dashboard:', error);
        res.status(500).json({ error: 'Erro ao carregar dados do dashboard' });
    }
});

module.exports = router;
