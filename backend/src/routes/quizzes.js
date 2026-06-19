const express = require('express');
const { db } = require('../../firebase/firebase-admin');
const { authenticateToken, requireProfessor, requireAluno } = require('../middleware/auth');

const router = express.Router();

async function getAlunoDocsByIds(alunoIds) {
    const result = [];
    for (const alunoId of alunoIds) {
        const alunoDoc = await db.collection('alunos').doc(alunoId).get();
        if (alunoDoc.exists) result.push({ id: alunoDoc.id, ...alunoDoc.data() });
    }
    return result;
}

// GET - Listar todos os quizzes
router.get('/', authenticateToken, async (req, res) => {
    try {
        const quizzesRef = db.collection('quizzes');
        const snapshot = await quizzesRef.get();

        const quizzes = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();

            const perguntasRef = db.collection('quiz_perguntas');
            const perguntasSnapshot = await perguntasRef.where('quizId', '==', doc.id).get();

            const perguntas = [];
            perguntasSnapshot.forEach(pDoc => {
                const pData = pDoc.data();
                perguntas.push({
                    id: pDoc.id,
                    texto: pData.texto,
                    opcoes: pData.opcoes,
                    correta: pData.correta,
                    valor: pData.valor
                });
            });

            quizzes.push({
                id: doc.id,
                titulo: data.titulo,
                imagem: data.imagem,
                perguntas,
                createdAt: data.createdAt
            });
        }

        res.json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar quizzes' });
    }
});

// POST - Enviar quiz para sala ou alunos específicos/múltiplos
// body: { quizId, salaId?, alunoId?, alunoIds?, dataLimite? }
router.post('/enviar', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const professorId = req.user.id;
        const { quizId, salaId, alunoId, alunoIds, dataLimite } = req.body;

        if (!quizId) {
            return res.status(400).json({ error: 'quizId é obrigatório' });
        }

        const quizRef = db.collection('quizzes').doc(quizId);
        const quizSnap = await quizRef.get();
        if (!quizSnap.exists) {
            return res.status(404).json({ error: 'Quiz não encontrado' });
        }

        let targets = [];
        if (salaId) {
            const alunosSnap = await db.collection('alunos').where('salaId', '==', salaId).get();
            targets = alunosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else if (Array.isArray(alunoIds) && alunoIds.length > 0) {
            targets = await getAlunoDocsByIds(alunoIds);
        } else if (alunoId) {
            targets = await getAlunoDocsByIds([alunoId]);
        }

        if (!targets || targets.length === 0) {
            return res.status(400).json({ error: 'Informe salaId ou ao menos um aluno (alunoId/alunoIds)' });
        }

        let enviados = 0;
        const tituloQuiz = quizSnap.data().titulo;

        for (const aluno of targets) {
            const envioId = `${quizId}_${aluno.id}`;
            await db.collection('quizzes_enviados').doc(envioId).set({
                quizId,
                alunoId: aluno.id,
                salaId: aluno.salaId || '',
                professorId,
                dataLimite: dataLimite || null,
                createdAt: new Date().toISOString()
            });

            await db.collection('notificacoes').add({
                alunoId: aluno.id,
                titulo: 'Quiz disponível',
                mensagem: `O quiz "${tituloQuiz}" foi liberado para você.`,
                tipo: 'quiz',
                lida: false,
                data: new Date().toISOString()
            });

            enviados++;
        }

        res.status(201).json({ message: 'Quiz enviado com sucesso', enviados });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao enviar quiz' });
    }
});

// GET - Quizzes disponíveis para o aluno
router.get('/disponiveis', authenticateToken, requireAluno, async (req, res) => {
    try {
        const alunoId = req.user.id;
        const enviosSnap = await db.collection('quizzes_enviados')
            .where('alunoId', '==', alunoId)
            .get();

        const envioDocs = enviosSnap.docs.slice().sort((a, b) => {
            const ta = a.data().createdAt || '';
            const tb = b.data().createdAt || '';
            return tb.localeCompare(ta);
        });

        const quizzes = [];
        for (const envioDoc of envioDocs) {
            const envio = envioDoc.data();
            const quizRef = db.collection('quizzes').doc(envio.quizId);
            const quizSnap = await quizRef.get();
            if (!quizSnap.exists) continue;

            const quizData = quizSnap.data();

            const respostasRef = db.collection('quiz_respostas');
            const respostaExistente = await respostasRef
                .where('quizId', '==', quizSnap.id)
                .where('alunoId', '==', alunoId)
                .limit(1)
                .get();

            const perguntasRef = db.collection('quiz_perguntas');
            const perguntasSnapshot = await perguntasRef.where('quizId', '==', quizSnap.id).get();

            const perguntas = [];
            perguntasSnapshot.forEach(pDoc => {
                const pData = pDoc.data();
                perguntas.push({
                    id: pDoc.id,
                    texto: pData.texto,
                    opcoes: pData.opcoes,
                    valor: pData.valor
                    // Não expõe 'correta' para o aluno
                });
            });

            quizzes.push({
                id: quizSnap.id,
                titulo: quizData.titulo,
                imagem: quizData.imagem,
                perguntas,
                realizado: !respostaExistente.empty,
                pontuacao: respostaExistente.empty ? null : respostaExistente.docs[0].data().pontuacao,
                dataLimite: envio.dataLimite || null
            });
        }

        res.json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar quizzes disponíveis' });
    }
});

// GET - Obter quiz específico
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const quizRef = db.collection('quizzes').doc(id);
        const quiz = await quizRef.get();

        if (!quiz.exists) {
            return res.status(404).json({ error: 'Quiz não encontrado' });
        }

        const data = quiz.data();

        const perguntasRef = db.collection('quiz_perguntas');
        const perguntasSnapshot = await perguntasRef.where('quizId', '==', id).get();

        const perguntas = [];
        perguntasSnapshot.forEach(pDoc => {
            const pData = pDoc.data();
            perguntas.push({
                id: pDoc.id,
                texto: pData.texto,
                opcoes: pData.opcoes,
                correta: pData.correta,
                valor: pData.valor
            });
        });

        res.json({
            id: quiz.id,
            titulo: data.titulo,
            imagem: data.imagem,
            perguntas,
            createdAt: data.createdAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar quiz' });
    }
});

// POST - Criar novo quiz
router.post('/', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { titulo, imagem, perguntas } = req.body;

        if (!titulo || !perguntas || !perguntas.length) {
            return res.status(400).json({ error: 'Título e perguntas são obrigatórios' });
        }

        const novoQuiz = {
            titulo,
            imagem: imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
            createdAt: new Date().toISOString()
        };

        const quizRef = await db.collection('quizzes').add(novoQuiz);

        for (const pergunta of perguntas) {
            await db.collection('quiz_perguntas').add({
                quizId: quizRef.id,
                texto: pergunta.texto,
                opcoes: pergunta.opcoes,
                correta: pergunta.correta,
                valor: pergunta.valor || 1
            });
        }

        res.status(201).json({
            id: quizRef.id,
            ...novoQuiz,
            perguntas
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar quiz' });
    }
});

// POST - Enviar respostas do quiz (aluno)
router.post('/:id/responder', authenticateToken, requireAluno, async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;
        const { respostas } = req.body;

        if (!respostas || !Array.isArray(respostas)) {
            return res.status(400).json({ error: 'Respostas são obrigatórias' });
        }

        // Só permite responder quizzes que foram enviados para este aluno
        const envioSnap = await db.collection('quizzes_enviados')
            .where('quizId', '==', id)
            .where('alunoId', '==', alunoId)
            .limit(1)
            .get();
        if (envioSnap.empty) {
            return res.status(403).json({ error: 'Quiz não liberado para você' });
        }

        const quizRef = db.collection('quizzes').doc(id);
        const quiz = await quizRef.get();

        if (!quiz.exists) {
            return res.status(404).json({ error: 'Quiz não encontrado' });
        }

        const respostasRef = db.collection('quiz_respostas');
        const respostaExistente = await respostasRef
            .where('quizId', '==', id)
            .where('alunoId', '==', alunoId)
            .limit(1)
            .get();

        if (!respostaExistente.empty) {
            return res.status(400).json({ error: 'Quiz já respondido' });
        }

        // Buscar perguntas para calcular pontuação
        const perguntasRef = db.collection('quiz_perguntas');
        const perguntasSnapshot = await perguntasRef.where('quizId', '==', id).get();

        let pontuacaoTotal = 0;
        let pontuacaoMaxima = 0;

        const perguntasMap = {};
        perguntasSnapshot.forEach(pDoc => {
            perguntasMap[pDoc.id] = pDoc.data();
            pontuacaoMaxima += pDoc.data().valor || 1;
        });

        const respostasDetalhadas = respostas.map(resposta => {
            const pergunta = perguntasMap[resposta.perguntaId];
            let correta = false;
            if (pergunta) {
                // Suporte a dados antigos onde "correta" pode ser índice (number) ou texto (string).
                if (typeof pergunta.correta === 'number') {
                    if (typeof resposta.opcaoSelecionada === 'number') {
                        correta = resposta.opcaoSelecionada === pergunta.correta;
                    } else if (typeof resposta.opcaoSelecionada === 'string' && Array.isArray(pergunta.opcoes)) {
                        correta = pergunta.opcoes[pergunta.correta] === resposta.opcaoSelecionada;
                    }
                } else {
                    // correta como texto
                    if (typeof resposta.opcaoSelecionada === 'number' && Array.isArray(pergunta.opcoes)) {
                        correta = pergunta.opcoes[resposta.opcaoSelecionada] === pergunta.correta;
                    } else {
                        correta = resposta.opcaoSelecionada === pergunta.correta;
                    }
                }
            }
            if (correta) pontuacaoTotal += (pergunta && pergunta.valor) ? pergunta.valor : 1;
            return {
                perguntaId: resposta.perguntaId,
                opcaoSelecionada: resposta.opcaoSelecionada,
                correta
            };
        });

        await respostasRef.add({
            quizId: id,
            alunoId,
            respostas: respostasDetalhadas,
            pontuacao: pontuacaoTotal,
            pontuacaoMaxima,
            dataResposta: new Date().toISOString()
        });

        res.status(201).json({
            message: 'Quiz respondido com sucesso!',
            pontuacao: pontuacaoTotal,
            pontuacaoMaxima,
            acertos: respostasDetalhadas.filter(r => r.correta).length,
            total: respostasDetalhadas.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao enviar respostas do quiz' });
    }
});

// GET - Resultados de um quiz por sala (professor)
router.get('/:id/resultados/sala/:salaId', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id, salaId } = req.params;

        const alunosRef = db.collection('alunos');
        const alunos = await alunosRef.where('salaId', '==', salaId).get();

        const resultados = [];
        for (const alunoDoc of alunos.docs) {
            const respostasRef = db.collection('quiz_respostas');
            const resposta = await respostasRef
                .where('quizId', '==', id)
                .where('alunoId', '==', alunoDoc.id)
                .limit(1)
                .get();

            resultados.push({
                alunoId: alunoDoc.id,
                alunoNome: alunoDoc.data().nome,
                respondeu: !resposta.empty,
                pontuacao: resposta.empty ? null : resposta.docs[0].data().pontuacao,
                pontuacaoMaxima: resposta.empty ? null : resposta.docs[0].data().pontuacaoMaxima
            });
        }

        res.json(resultados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar resultados do quiz' });
    }
});

// GET - Relatório detalhado de um quiz por sala (professor)
router.get('/:id/relatorioDetalhado/sala/:salaId', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id, salaId } = req.params;

        // 1. Buscar o quiz
        const quizRef = db.collection('quizzes').doc(id);
        const quiz = await quizRef.get();
        if (!quiz.exists) {
            return res.status(404).json({ error: 'Quiz não encontrado' });
        }

        // 2. Buscar perguntas do quiz
        const perguntasSnapshot = await db.collection('quiz_perguntas').where('quizId', '==', id).get();
        const perguntas = [];
        const perguntasMap = {};
        perguntasSnapshot.forEach(doc => {
            const data = doc.data();
            const p = { id: doc.id, texto: data.texto, opcoes: data.opcoes, correta: data.correta };
            perguntas.push(p);
            perguntasMap[doc.id] = p;
        });

        // 3. Buscar alunos da sala
        const alunosSnapshot = await db.collection('alunos').where('salaId', '==', salaId).get();
        const alunosMap = {};
        alunosSnapshot.forEach(doc => {
            alunosMap[doc.id] = { id: doc.id, nome: doc.data().nome };
        });

        // 4. Buscar respostas dos alunos dessa sala para esse quiz
        const respostasSnapshot = await db.collection('quiz_respostas').where('quizId', '==', id).get();
        
        // Estrutura do relatório: para cada pergunta, quem acertou, quem errou e o que escolheu
        const relatorioPorPergunta = perguntas.map(p => ({
            perguntaId: p.id,
            texto: p.texto,
            opcoes: p.opcoes,
            correta: p.correta,
            acertos: [], // { alunoId, nome }
            erros: []    // { alunoId, nome, respostaEscolhida }
        }));

        let totalRespostasValidas = 0;

        respostasSnapshot.forEach(doc => {
            const data = doc.data();
            // Filtrar apenas respostas de alunos desta sala
            if (alunosMap[data.alunoId]) {
                totalRespostasValidas++;
                const aluno = alunosMap[data.alunoId];
                
                data.respostas.forEach(r => {
                    const relatorioP = relatorioPorPergunta.find(rp => rp.perguntaId === r.perguntaId);
                    if (relatorioP) {
                        if (r.correta) {
                            relatorioP.acertos.push(aluno);
                        } else {
                            relatorioP.erros.push({
                                ...aluno,
                                respostaEscolhida: r.opcaoSelecionada
                            });
                        }
                    }
                });
            }
        });

        res.json({
            quiz: { id: quiz.id, titulo: quiz.data().titulo, imagem: quiz.data().imagem },
            totalAlunos: alunosSnapshot.size,
            totalResponderam: totalRespostasValidas,
            relatorio: relatorioPorPergunta
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar relatório detalhado do quiz' });
    }
});

// PUT - Atualizar quiz
router.put('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, imagem } = req.body;

        const quizRef = db.collection('quizzes').doc(id);
        const quiz = await quizRef.get();

        if (!quiz.exists) {
            return res.status(404).json({ error: 'Quiz não encontrado' });
        }

        const updates = {};
        if (titulo) updates.titulo = titulo;
        if (imagem) updates.imagem = imagem;

        await quizRef.update(updates);

        res.json({ message: 'Quiz atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar quiz' });
    }
});

// DELETE - Remover quiz
router.delete('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;

        const quizRef = db.collection('quizzes').doc(id);
        const quiz = await quizRef.get();

        if (!quiz.exists) {
            return res.status(404).json({ error: 'Quiz não encontrado' });
        }

        await quizRef.delete();

        res.json({ message: 'Quiz removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover quiz' });
    }
});

module.exports = router;
