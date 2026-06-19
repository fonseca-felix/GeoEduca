const express = require('express');
const { db } = require('../../firebase/firebase-admin');
const { authenticateToken, requireProfessor } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard - Resumo geral para a professora
router.get('/', authenticateToken, requireProfessor, async (req, res) => {
    try {
        // Buscar em paralelo para performance
        const [alunosSnap, salasSnap, quizzesSnap, atividadesSnap, provasSnap] = await Promise.all([
            db.collection('alunos').get(),
            db.collection('salas').get(),
            db.collection('quizzes').get(),
            db.collection('atividades').orderBy('createdAt', 'desc').limit(50).get(),
            db.collection('provas').get(),
        ]);

        const totalAlunos = alunosSnap.size;
        const totalSalas = salasSnap.size;
        const totalQuizzes = quizzesSnap.size;
        const totalAtividades = atividadesSnap.size;
        const totalProvas = provasSnap.size;

        // Contagem de alunos por sala
        const alunosPorSala = {};
        alunosSnap.forEach(doc => {
            const { salaId } = doc.data();
            if (salaId) alunosPorSala[salaId] = (alunosPorSala[salaId] || 0) + 1;
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

        // Atividades recentes (últimas 5 criadas)
        const atividadesRecentes = [];
        atividadesSnap.forEach(doc => {
            const d = doc.data();
            atividadesRecentes.push({
                id: doc.id,
                titulo: d.titulo,
                tipo: d.tipo,
                salaNome: d.salaNome || '',
                createdAt: d.createdAt,
            });
        });

        // Contar respostas de quizzes para calcular total de participações
        const respostasSnap = await db.collection('quiz_respostas').get();
        const totalRespostasQuiz = respostasSnap.size;

        // Contar respostas de provas
        const respostasProvaSnap = await db.collection('prova_respostas').get();
        const totalRespostasProva = respostasProvaSnap.size;

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
            atividadesRecentes: atividadesRecentes.slice(0, 5),
        });
    } catch (error) {
        console.error('Erro no dashboard:', error);
        res.status(500).json({ error: 'Erro ao carregar dados do dashboard' });
    }
});

module.exports = router;
