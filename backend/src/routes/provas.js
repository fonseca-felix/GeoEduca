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

// GET - Listar todas as provas
router.get('/', authenticateToken, async (req, res) => {
    try {
        const provasRef = db.collection('provas');
        const snapshot = await provasRef.get();

        const provas = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();

            const questoesRef = db.collection('prova_questoes');
            const questoesSnapshot = await questoesRef.where('provaId', '==', doc.id).get();

            const questoes = [];
            questoesSnapshot.forEach(qDoc => {
                const qData = qDoc.data();
                questoes.push({
                    id: qDoc.id,
                    texto: qData.texto,
                    tipo: qData.tipo,
                    opcoes: qData.opcoes || null,
                    correta: qData.correta !== undefined ? qData.correta : null,
                    valor: qData.valor
                });
            });

            provas.push({
                id: doc.id,
                titulo: data.titulo,
                imagem: data.imagem,
                rubrica: data.rubrica,
                questoes,
                createdAt: data.createdAt
            });
        }

        res.json(provas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar provas' });
    }
});

// POST - Enviar prova para sala ou alunos específicos/múltiplos
// body: { provaId, salaId?, alunoId?, alunoIds?, dataLimite? }
router.post('/enviar', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const professorId = req.user.id;
        const { provaId, salaId, alunoId, alunoIds, dataLimite } = req.body;

        if (!provaId) {
            return res.status(400).json({ error: 'provaId é obrigatório' });
        }

        const provaRef = db.collection('provas').doc(provaId);
        const provaSnap = await provaRef.get();
        if (!provaSnap.exists) {
            return res.status(404).json({ error: 'Prova não encontrada' });
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

        const tituloProva = provaSnap.data().titulo;
        let enviados = 0;

        for (const aluno of targets) {
            const envioId = `${provaId}_${aluno.id}`;
            await db.collection('provas_enviadas').doc(envioId).set({
                provaId,
                alunoId: aluno.id,
                salaId: aluno.salaId || '',
                professorId,
                dataLimite: dataLimite || null,
                createdAt: new Date().toISOString()
            });

            await db.collection('notificacoes').add({
                alunoId: aluno.id,
                titulo: 'Prova disponível',
                mensagem: `A prova "${tituloProva}" foi liberada para você.`,
                tipo: 'prova',
                lida: false,
                data: new Date().toISOString()
            });

            enviados++;
        }

        res.status(201).json({ message: 'Prova enviada com sucesso', enviados });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao enviar prova' });
    }
});

// GET - Provas disponíveis para o aluno
router.get('/disponiveis', authenticateToken, requireAluno, async (req, res) => {
    try {
        const alunoId = req.user.id;
        const enviosSnap = await db.collection('provas_enviadas')
            .where('alunoId', '==', alunoId)
            .get();

        const envioDocs = enviosSnap.docs.slice().sort((a, b) => {
            const ta = a.data().createdAt || '';
            const tb = b.data().createdAt || '';
            return tb.localeCompare(ta);
        });

        const provas = [];
        for (const envioDoc of envioDocs) {
            const envio = envioDoc.data();
            const provaRef = db.collection('provas').doc(envio.provaId);
            const provaSnap = await provaRef.get();
            if (!provaSnap.exists) continue;

            const data = provaSnap.data();
            const provaId = provaSnap.id;

            // Verificar se aluno já respondeu
            const respostasRef = db.collection('prova_respostas');
            const respostaExistente = await respostasRef
                .where('provaId', '==', provaId)
                .where('alunoId', '==', alunoId)
                .limit(1)
                .get();

            const questoesRef = db.collection('prova_questoes');
            const questoesSnapshot = await questoesRef.where('provaId', '==', provaId).get();

            const questoes = [];
            questoesSnapshot.forEach(qDoc => {
                const qData = qDoc.data();
                questoes.push({
                    id: qDoc.id,
                    texto: qData.texto,
                    tipo: qData.tipo,
                    opcoes: qData.opcoes || null,
                    valor: qData.valor
                });
            });

            provas.push({
                id: provaId,
                titulo: data.titulo,
                imagem: data.imagem,
                rubrica: data.rubrica,
                questoes,
                realizada: !respostaExistente.empty,
                createdAt: data.createdAt
            });
        }

        res.json(provas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar provas disponíveis' });
    }
});

// GET - Obter prova específica
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const provaRef = db.collection('provas').doc(id);
        const prova = await provaRef.get();

        if (!prova.exists) {
            return res.status(404).json({ error: 'Prova não encontrada' });
        }

        const data = prova.data();

        const questoesRef = db.collection('prova_questoes');
        const questoesSnapshot = await questoesRef.where('provaId', '==', id).get();

        const questoes = [];
        questoesSnapshot.forEach(qDoc => {
            const qData = qDoc.data();
            questoes.push({
                id: qDoc.id,
                texto: qData.texto,
                tipo: qData.tipo,
                opcoes: qData.opcoes || null,
                correta: qData.correta !== undefined ? qData.correta : null,
                valor: qData.valor
            });
        });

        res.json({
            id: prova.id,
            titulo: data.titulo,
            imagem: data.imagem,
            rubrica: data.rubrica,
            questoes,
            createdAt: data.createdAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar prova' });
    }
});

// POST - Criar nova prova
router.post('/', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { titulo, imagem, rubrica, questoes } = req.body;

        if (!titulo || !questoes || !questoes.length) {
            return res.status(400).json({ error: 'Título e questões são obrigatórios' });
        }

        const novaProva = {
            titulo,
            imagem: imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
            rubrica: rubrica || '',
            createdAt: new Date().toISOString()
        };

        const provaRef = await db.collection('provas').add(novaProva);

        for (const questao of questoes) {
            await db.collection('prova_questoes').add({
                provaId: provaRef.id,
                texto: questao.texto,
                tipo: questao.tipo,
                opcoes: questao.opcoes || null,
                correta: questao.correta !== undefined ? questao.correta : null,
                valor: questao.valor || 5
            });
        }

        res.status(201).json({
            id: provaRef.id,
            ...novaProva,
            questoes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar prova' });
    }
});

// POST - Enviar respostas da prova (aluno)
router.post('/:id/responder', authenticateToken, requireAluno, async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;
        const { respostas, saidasAba } = req.body;

        if (!respostas || !Array.isArray(respostas)) {
            return res.status(400).json({ error: 'Respostas são obrigatórias' });
        }

        // Só permite responder provas que foram enviadas para este aluno
        const envioSnap = await db.collection('provas_enviadas')
            .where('provaId', '==', id)
            .where('alunoId', '==', alunoId)
            .limit(1)
            .get();
        if (envioSnap.empty) {
            return res.status(403).json({ error: 'Prova não liberada para você' });
        }

        const provaRef = db.collection('provas').doc(id);
        const prova = await provaRef.get();

        if (!prova.exists) {
            return res.status(404).json({ error: 'Prova não encontrada' });
        }

        const respostasRef = db.collection('prova_respostas');
        const respostaExistente = await respostasRef
            .where('provaId', '==', id)
            .where('alunoId', '==', alunoId)
            .limit(1)
            .get();

        if (!respostaExistente.empty) {
            return res.status(400).json({ error: 'Prova já respondida' });
        }

        // Buscar questões da prova para calcular nota automática das objetivas
        const questoesRef = db.collection('prova_questoes');
        const questoesSnapshot = await questoesRef.where('provaId', '==', id).get();
        const questoesMap = {};
        questoesSnapshot.forEach(doc => {
            questoesMap[doc.id] = doc.data();
        });

        let notaAutomatica = 0;
        const respostasDetalhadas = respostas.map(r => {
            const questao = questoesMap[r.questaoId];
            let acertou = false;
            
            // Só calcula nota automática para questões objetivas/alternativa
            if (questao && questao.tipo === 'alternativa') {
                let correta = false;
                // Suporte a dados antigos onde "correta" pode ser índice (number) ou texto (string).
                if (typeof questao.correta === 'number') {
                    if (typeof r.respostaSelecionada === 'number') {
                        correta = r.respostaSelecionada === questao.correta;
                    } else if (typeof r.respostaSelecionada === 'string' && Array.isArray(questao.opcoes)) {
                        correta = questao.opcoes[questao.correta] === r.respostaSelecionada;
                    }
                } else {
                    // correta como texto
                    if (typeof r.respostaSelecionada === 'number' && Array.isArray(questao.opcoes)) {
                        correta = questao.opcoes[r.respostaSelecionada] === questao.correta;
                    } else {
                        correta = r.respostaSelecionada === questao.correta;
                    }
                }

                if (correta) {
                    acertou = true;
                    notaAutomatica += (questao.valor || 0);
                }
            }
            
            return {
                questaoId: r.questaoId,
                respostaTexto: r.respostaTexto || null,
                respostaSelecionada: r.respostaSelecionada !== undefined ? r.respostaSelecionada : null,
                acertou,
                tipo: questao ? questao.tipo : 'desconhecido'
            };
        });

        // Aplicar penalidade anti-cola (0.5 por saída de aba)
        const penalidade = (saidasAba || 0) * 0.5;
        notaAutomatica -= penalidade;
        
        // Impedir nota negativa na correção automática
        if (notaAutomatica < 0) notaAutomatica = 0;

        await respostasRef.add({
            provaId: id,
            alunoId,
            respostas: respostasDetalhadas,
            saidasAba: saidasAba || 0,
            notaAutomatica,
            notaManual: null,
            status: 'pendente',
            dataEnvio: new Date().toISOString()
        });

        res.status(201).json({ message: 'Prova enviada com sucesso! Aguarde a correção do professor.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao enviar respostas da prova' });
    }
});

// GET - Respostas de uma prova por sala (professor)
router.get('/:id/respostas/sala/:salaId', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id, salaId } = req.params;

        const alunosRef = db.collection('alunos');
        const alunos = await alunosRef.where('salaId', '==', salaId).get();

        const resultado = [];
        for (const alunoDoc of alunos.docs) {
            const respostasRef = db.collection('prova_respostas');
            const resposta = await respostasRef
                .where('provaId', '==', id)
                .where('alunoId', '==', alunoDoc.id)
                .limit(1)
                .get();

            resultado.push({
                alunoId: alunoDoc.id,
                alunoNome: alunoDoc.data().nome,
                respondeu: !resposta.empty,
                resposta: resposta.empty ? null : { id: resposta.docs[0].id, ...resposta.docs[0].data() }
            });
        }

        res.json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar respostas da prova' });
    }
});

// PUT - Corrigir e atribuir nota (professor)
router.put('/respostas/:respostaId/corrigir', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { respostaId } = req.params;
        const { notaManual, feedback } = req.body;

        const respostaRef = db.collection('prova_respostas').doc(respostaId);
        const resposta = await respostaRef.get();

        if (!resposta.exists) {
            return res.status(404).json({ error: 'Resposta não encontrada' });
        }

        await respostaRef.update({
            notaManual: notaManual || 0,
            feedback: feedback || '',
            status: 'corrigida',
            dataCorrecao: new Date().toISOString()
        });

        res.json({ message: 'Prova corrigida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao corrigir prova' });
    }
});

// PUT - Atualizar prova
router.put('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, imagem, rubrica } = req.body;

        const provaRef = db.collection('provas').doc(id);
        const prova = await provaRef.get();

        if (!prova.exists) {
            return res.status(404).json({ error: 'Prova não encontrada' });
        }

        const updates = {};
        if (titulo) updates.titulo = titulo;
        if (imagem) updates.imagem = imagem;
        if (rubrica !== undefined) updates.rubrica = rubrica;

        await provaRef.update(updates);

        res.json({ message: 'Prova atualizada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar prova' });
    }
});

// DELETE - Remover prova
router.delete('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;

        const provaRef = db.collection('provas').doc(id);
        const prova = await provaRef.get();

        if (!prova.exists) {
            return res.status(404).json({ error: 'Prova não encontrada' });
        }

        await provaRef.delete();

        res.json({ message: 'Prova removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover prova' });
    }
});

module.exports = router;
