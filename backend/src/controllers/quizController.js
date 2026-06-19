const { db } = require('../../firebase/firebase-admin');

const listarQuizzes = async (req, res) => {
    try {
        const snapshot = await db.collection('quizzes').get();
        const quizzes = [];
        for (const doc of snapshot.docs) {
            const d = doc.data();
            const perguntasSnapshot = await db.collection('quiz_perguntas').where('quizId', '==', doc.id).get();
            const perguntas = perguntasSnapshot.docs.map(pDoc => ({ id: pDoc.id, ...pDoc.data() }));
            quizzes.push({ id: doc.id, titulo: d.titulo, imagem: d.imagem, perguntas, createdAt: d.createdAt });
        }
        res.json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar quizzes' });
    }
};

const listarQuizzesDisponiveis = async (req, res) => {
    try {
        const alunoId = req.user.id;
        const snapshot = await db.collection('quizzes').get();
        const quizzes = [];

        for (const doc of snapshot.docs) {
            const d = doc.data();
            const respostaExistente = await db.collection('quiz_respostas')
                .where('quizId', '==', doc.id).where('alunoId', '==', alunoId).limit(1).get();
            const perguntasSnapshot = await db.collection('quiz_perguntas').where('quizId', '==', doc.id).get();
            const perguntas = perguntasSnapshot.docs.map(pDoc => {
                const pd = pDoc.data();
                return { id: pDoc.id, texto: pd.texto, opcoes: pd.opcoes, valor: pd.valor };
            });
            quizzes.push({
                id: doc.id, titulo: d.titulo, imagem: d.imagem, perguntas,
                realizado: !respostaExistente.empty,
                pontuacao: respostaExistente.empty ? null : respostaExistente.docs[0].data().pontuacao
            });
        }
        res.json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar quizzes disponíveis' });
    }
};

const criarQuiz = async (req, res) => {
    try {
        const { titulo, imagem, perguntas } = req.body;
        if (!titulo || !perguntas?.length) {
            return res.status(400).json({ error: 'Título e perguntas são obrigatórios' });
        }
        const novoQuiz = { titulo, imagem: imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg', createdAt: new Date().toISOString() };
        const quizRef = await db.collection('quizzes').add(novoQuiz);
        for (const p of perguntas) {
            await db.collection('quiz_perguntas').add({ quizId: quizRef.id, texto: p.texto, opcoes: p.opcoes, correta: p.correta, valor: p.valor || 1 });
        }
        res.status(201).json({ id: quizRef.id, ...novoQuiz, perguntas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar quiz' });
    }
};

const responderQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;
        const { respostas } = req.body;

        if (!respostas || !Array.isArray(respostas)) return res.status(400).json({ error: 'Respostas são obrigatórias' });

        const quiz = await db.collection('quizzes').doc(id).get();
        if (!quiz.exists) return res.status(404).json({ error: 'Quiz não encontrado' });

        const respostaExistente = await db.collection('quiz_respostas')
            .where('quizId', '==', id).where('alunoId', '==', alunoId).limit(1).get();
        if (!respostaExistente.empty) return res.status(400).json({ error: 'Quiz já respondido' });

        const perguntasSnapshot = await db.collection('quiz_perguntas').where('quizId', '==', id).get();
        let pontuacaoTotal = 0, pontuacaoMaxima = 0;
        const perguntasMap = {};
        perguntasSnapshot.forEach(pDoc => {
            perguntasMap[pDoc.id] = pDoc.data();
            pontuacaoMaxima += pDoc.data().valor || 1;
        });

        const respostasDetalhadas = respostas.map(r => {
            const pergunta = perguntasMap[r.perguntaId];
            const correta = pergunta && r.opcaoSelecionada === pergunta.correta;
            if (correta) pontuacaoTotal += pergunta.valor || 1;
            return { perguntaId: r.perguntaId, opcaoSelecionada: r.opcaoSelecionada, correta };
        });

        await db.collection('quiz_respostas').add({
            quizId: id, alunoId, respostas: respostasDetalhadas,
            pontuacao: pontuacaoTotal, pontuacaoMaxima, dataResposta: new Date().toISOString()
        });

        res.status(201).json({
            message: 'Quiz respondido com sucesso!', pontuacao: pontuacaoTotal, pontuacaoMaxima,
            acertos: respostasDetalhadas.filter(r => r.correta).length, total: respostasDetalhadas.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao responder quiz' });
    }
};

module.exports = { listarQuizzes, listarQuizzesDisponiveis, criarQuiz, responderQuiz };
