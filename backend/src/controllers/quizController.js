const { supabase } = require('../../supabase/client');

const listarQuizzes = async (req, res) => {
    try {
        const { data: quizzesDb, error } = await supabase.from('quizzes').select('*');
        if (error) throw error;
        
        const quizzes = [];
        for (const doc of (quizzesDb || [])) {
            const { data: perguntas } = await supabase.from('quiz_perguntas').select('*').eq('quizId', doc.id);
            quizzes.push({ ...doc, perguntas: perguntas || [] });
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
        const { data: quizzesDb, error } = await supabase.from('quizzes').select('*');
        if (error) throw error;
        
        const quizzes = [];

        for (const doc of (quizzesDb || [])) {
            const { data: respostaExistente } = await supabase.from('quiz_respostas')
                .select('pontuacao').eq('quizId', doc.id).eq('alunoId', alunoId).limit(1);
                
            const { data: perguntasDb } = await supabase.from('quiz_perguntas').select('id, texto, opcoes, valor').eq('quizId', doc.id);
            
            quizzes.push({
                ...doc,
                perguntas: perguntasDb || [],
                realizado: respostaExistente && respostaExistente.length > 0,
                pontuacao: (respostaExistente && respostaExistente.length > 0) ? respostaExistente[0].pontuacao : null
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
        const novoQuiz = { titulo, imagem: imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg' };
        
        const { data: quizRef, error } = await supabase.from('quizzes').insert([novoQuiz]).select().single();
        if (error) throw error;
        
        const perguntasData = perguntas.map(p => ({
            quizId: quizRef.id, texto: p.texto, opcoes: p.opcoes, correta: p.correta, valor: p.valor || 1
        }));
        
        await supabase.from('quiz_perguntas').insert(perguntasData);
        
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

        const { data: quiz, error: quizErr } = await supabase.from('quizzes').select('id').eq('id', id).single();
        if (quizErr || !quiz) return res.status(404).json({ error: 'Quiz não encontrado' });

        const { data: respostaExistente } = await supabase.from('quiz_respostas')
            .select('id').eq('quizId', id).eq('alunoId', alunoId).limit(1);
            
        if (respostaExistente && respostaExistente.length > 0) return res.status(400).json({ error: 'Quiz já respondido' });

        const { data: perguntasSnapshot } = await supabase.from('quiz_perguntas').select('*').eq('quizId', id);
        
        let pontuacaoTotal = 0, pontuacaoMaxima = 0;
        const perguntasMap = {};
        for (const p of (perguntasSnapshot || [])) {
            perguntasMap[p.id] = p;
            pontuacaoMaxima += p.valor || 1;
        }

        const respostasDetalhadas = respostas.map(r => {
            const pergunta = perguntasMap[r.perguntaId];
            const correta = pergunta && r.opcaoSelecionada === pergunta.correta;
            if (correta) pontuacaoTotal += pergunta.valor || 1;
            return { perguntaId: r.perguntaId, opcaoSelecionada: r.opcaoSelecionada, correta };
        });

        await supabase.from('quiz_respostas').insert([{
            quizId: id, alunoId, respostas: respostasDetalhadas,
            pontuacao: pontuacaoTotal, pontuacaoMaxima
        }]);

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
