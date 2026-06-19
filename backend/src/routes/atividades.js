const express = require('express');
const { db } = require('../../firebase/firebase-admin');
const { authenticateToken, requireProfessor, requireAluno } = require('../middleware/auth');
const { getAlunoDocsByIds, normalizeAlunoIds } = require('../utils/envioHelpers');

const router = express.Router();

async function notificarAlunos(alunoIds, titulo, tipo = 'atividade') {
    const titulos = {
        atividade: 'Nova atividade disponível!',
        quiz: 'Quiz disponível',
        prova: 'Prova disponível'
    };
    for (const alunoId of alunoIds) {
        await db.collection('notificacoes').add({
            alunoId,
            titulo: titulos[tipo] || 'Nova atividade disponível!',
            mensagem: `A atividade "${titulo}" foi disponibilizada para você.`,
            tipo,
            lida: false,
            data: new Date().toISOString()
        });
    }
}

async function criarEnviosAtividade({ atividadeId, salaId, alunoId, alunoIds, dataLimite, professorId, titulo }) {
    const ids = normalizeAlunoIds(alunoId, alunoIds);
    let targets = [];

    if (ids.length > 0) {
        targets = await getAlunoDocsByIds(db, ids);
    } else if (salaId) {
        const alunosSnap = await db.collection('alunos').where('salaId', '==', salaId).get();
        targets = alunosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    if (!targets.length) {
        return { error: 'Nenhum aluno encontrado para o destino informado', status: 400 };
    }

    const enviados = [];
    for (const aluno of targets) {
        const envioId = ids.length > 0 ? `${atividadeId}_${aluno.id}` : `${atividadeId}_sala_${salaId}`;
        const ref = db.collection('atividades_enviadas').doc(envioId);
        const existing = await ref.get();
        if (existing.exists) {
            enviados.push(existing.id);
            continue;
        }

        await ref.set({
            atividadeId,
            salaId: ids.length > 0 ? (aluno.salaId || '') : salaId,
            alunoId: ids.length > 0 ? aluno.id : null,
            dataLimite: dataLimite || null,
            professorId,
            visualizado: false,
            createdAt: new Date().toISOString()
        });
        enviados.push(envioId);
    }

    await notificarAlunos(targets.map(t => t.id), titulo, 'atividade');
    return { enviados: enviados.length };
}

// GET - Listar todas as atividades (professor vê todas)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const snapshot = await db.collection('atividades').get();
        const atividades = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            atividades.push({
                id: doc.id,
                titulo: d.titulo,
                tipo: d.tipo,           // video | infografico | site | tarefa
                link: d.link || '',
                descricao: d.descricao || '',
                salaId: d.salaId || '',
                salaNome: d.salaNome || '',
                dataEntrega: d.dataEntrega || '',
                dataAula: d.dataAula || '',
                createdAt: d.createdAt
            });
        });
        atividades.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        res.json(atividades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar atividades' });
    }
});

// GET - Atividades enviadas para o aluno (sala inteira ou aluno específico)
router.get('/minhas', authenticateToken, requireAluno, async (req, res) => {
    try {
        const alunoId = req.user.id;
        const alunoRef = db.collection('alunos').doc(alunoId);
        const aluno = await alunoRef.get();

        if (!aluno.exists) {
            return res.status(400).json({ error: 'Aluno não encontrado' });
        }

        const salaId = aluno.data().salaId || '';
        const atividadesEnviadasRef = db.collection('atividades_enviadas');

        const [porAlunoSnap, porSalaSnap] = await Promise.all([
            atividadesEnviadasRef.where('alunoId', '==', alunoId).get(),
            salaId ? atividadesEnviadasRef.where('salaId', '==', salaId).get() : Promise.resolve({ docs: [] })
        ]);

        const envioDocsMap = new Map();
        porAlunoSnap.forEach(doc => envioDocsMap.set(doc.id, doc));
        porSalaSnap.forEach(doc => {
            const data = doc.data();
            // Envio para sala inteira (sem alunoId) ou direcionado a este aluno
            if (!data.alunoId || data.alunoId === alunoId) {
                envioDocsMap.set(doc.id, doc);
            }
        });

        const atividades = [];
        for (const doc of envioDocsMap.values()) {
            const data = doc.data();
            const atividadeRef = db.collection('atividades').doc(data.atividadeId);
            const atividade = await atividadeRef.get();

            if (!atividade.exists) continue;

            const atividadeData = atividade.data();
            const visualizacoesRef = db.collection('visualizacoes_atividades');
            const visualizacao = await visualizacoesRef
                .where('atividadeEnviadaId', '==', doc.id)
                .where('alunoId', '==', alunoId)
                .limit(1)
                .get();

            atividades.push({
                id: doc.id,
                atividadeId: data.atividadeId,
                titulo: atividadeData.titulo,
                tipo: atividadeData.tipo,
                imagem: atividadeData.imagem,
                link: atividadeData.link,
                descricao: atividadeData.descricao,
                dataLimite: data.dataLimite,
                visualizado: !visualizacao.empty,
                createdAt: data.createdAt
            });
        }

        atividades.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        res.json(atividades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar atividades do aluno' });
    }
});

// POST - Criar nova atividade e enviar (sala ou alunos específicos)
router.post('/', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { titulo, tipo, link, descricao, salaId, dataEntrega, dataAula, alunoId, alunoIds } = req.body;
        const professorId = req.user.id;
        const idsAlunos = normalizeAlunoIds(alunoId, alunoIds);

        if (!titulo || !tipo) {
            return res.status(400).json({ error: 'Título e tipo são obrigatórios' });
        }

        if (!salaId && idsAlunos.length === 0) {
            return res.status(400).json({ error: 'Informe a sala ou selecione ao menos um aluno' });
        }

        if (['video', 'infografico', 'site'].includes(tipo) && !link) {
            return res.status(400).json({ error: 'Link é obrigatório para este tipo de atividade' });
        }

        let salaNome = '';
        let salaIdAtividade = salaId || '';

        if (salaId) {
            const salaRef = db.collection('salas').doc(salaId);
            const sala = await salaRef.get();
            if (!sala.exists) {
                return res.status(400).json({ error: 'Sala não encontrada. Atualize a página e selecione uma sala válida.' });
            }
            salaNome = sala.data().nome;
        } else if (idsAlunos.length > 0) {
            const primeiro = await db.collection('alunos').doc(idsAlunos[0]).get();
            if (!primeiro.exists) {
                return res.status(400).json({ error: 'Aluno selecionado não encontrado' });
            }
            salaIdAtividade = primeiro.data().salaId || '';
            salaNome = primeiro.data().salaNome || '';
        }

        const novaAtividade = {
            titulo,
            tipo,
            link: link || '',
            descricao: descricao || '',
            salaId: salaIdAtividade,
            salaNome,
            dataEntrega: dataEntrega || '',
            dataAula: dataAula || '',
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('atividades').add(novaAtividade);

        const envio = await criarEnviosAtividade({
            atividadeId: docRef.id,
            salaId: idsAlunos.length > 0 ? null : salaId,
            alunoId,
            alunoIds: idsAlunos,
            dataLimite: dataEntrega || null,
            professorId,
            titulo
        });

        if (envio.error) {
            return res.status(envio.status).json({ error: envio.error });
        }

        res.status(201).json({ id: docRef.id, ...novaAtividade, enviados: envio.enviados });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar atividade' });
    }
});

// POST - Enviar atividade existente (sala ou alunos)
router.post('/enviar', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { salaId, atividadeId, dataLimite, alunoId, alunoIds } = req.body;
        const professorId = req.user.id;
        const idsAlunos = normalizeAlunoIds(alunoId, alunoIds);

        if (!atividadeId) {
            return res.status(400).json({ error: 'atividadeId é obrigatório' });
        }

        if (!salaId && idsAlunos.length === 0) {
            return res.status(400).json({ error: 'Informe salaId ou alunoId/alunoIds' });
        }

        const atividadeRef = db.collection('atividades').doc(atividadeId);
        const atividade = await atividadeRef.get();
        if (!atividade.exists) {
            return res.status(400).json({ error: 'Atividade não encontrada' });
        }

        if (salaId) {
            const salaRef = db.collection('salas').doc(salaId);
            const sala = await salaRef.get();
            if (!sala.exists) {
                return res.status(400).json({ error: 'Sala não encontrada' });
            }
        }

        const envio = await criarEnviosAtividade({
            atividadeId,
            salaId: idsAlunos.length > 0 ? null : salaId,
            alunoId,
            alunoIds: idsAlunos,
            dataLimite,
            professorId,
            titulo: atividade.data().titulo
        });

        if (envio.error) {
            return res.status(envio.status).json({ error: envio.error });
        }

        res.status(201).json({ message: 'Atividade enviada com sucesso', enviados: envio.enviados });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao enviar atividade' });
    }
});

// POST - Marcar atividade como visualizada
router.post('/visualizar/:atividadeEnviadaId', authenticateToken, requireAluno, async (req, res) => {
    try {
        const { atividadeEnviadaId } = req.params;
        const alunoId = req.user.id;
        
        // Verificar se a atividade existe
        const atividadeEnviadaRef = db.collection('atividades_enviadas').doc(atividadeEnviadaId);
        const atividadeEnviada = await atividadeEnviadaRef.get();
        
        if (!atividadeEnviada.exists) {
            return res.status(400).json({ error: 'Atividade não encontrada' });
        }

        const envioData = atividadeEnviada.data();
        const alunoSnap = await db.collection('alunos').doc(alunoId).get();
        const salaAluno = alunoSnap.exists ? alunoSnap.data().salaId : null;
        const podeVer =
            envioData.alunoId === alunoId ||
            (!envioData.alunoId && envioData.salaId && envioData.salaId === salaAluno);

        if (!podeVer) {
            return res.status(403).json({ error: 'Esta atividade não foi enviada para você' });
        }

        // Verificar se o aluno já visualizou
        const visualizacoesRef = db.collection('visualizacoes_atividades');
        const visualizacaoExistente = await visualizacoesRef
            .where('atividadeEnviadaId', '==', atividadeEnviadaId)
            .where('alunoId', '==', alunoId)
            .limit(1)
            .get();
        
        if (!visualizacaoExistente.empty) {
            return res.status(400).json({ error: 'Atividade já visualizada' });
        }
        
        // Registrar visualização
        await visualizacoesRef.add({
            atividadeEnviadaId,
            alunoId,
            dataVisualizacao: new Date().toISOString()
        });
        
        res.json({ message: 'Atividade marcada como visualizada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar visualização' });
    }
});

// GET - Relatório de visualizações por sala (professor)
router.get('/relatorio/sala/:salaId', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { salaId } = req.params;
        
        const atividadesEnviadasRef = db.collection('atividades_enviadas');
        const snapshot = await atividadesEnviadasRef.where('salaId', '==', salaId).get();
        
        const relatorio = [];
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const atividadeRef = db.collection('atividades').doc(data.atividadeId);
            const atividade = await atividadeRef.get();
            
            const visualizacoesRef = db.collection('visualizacoes_atividades');
            const visualizacoes = await visualizacoesRef.where('atividadeEnviadaId', '==', doc.id).get();
            
            const alunosVisualizaram = [];
            for (const visDoc of visualizacoes.docs) {
                const visData = visDoc.data();
                const alunoRef = db.collection('alunos').doc(visData.alunoId);
                const aluno = await alunoRef.get();
                if (aluno.exists) {
                    alunosVisualizaram.push({
                        alunoId: visData.alunoId,
                        alunoNome: aluno.data().nome,
                        dataVisualizacao: visData.dataVisualizacao
                    });
                }
            }
            
            relatorio.push({
                atividadeId: doc.id,
                atividadeTitulo: atividade.exists ? atividade.data().titulo : 'Atividade removida',
                dataLimite: data.dataLimite,
                totalVisualizacoes: visualizacoes.size,
                alunos: alunosVisualizaram
            });
        }
        
        res.json(relatorio);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
});

// PUT - Atualizar atividade
router.put('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, tipo, imagem, link, descricao } = req.body;
        
        const atividadeRef = db.collection('atividades').doc(id);
        const atividade = await atividadeRef.get();
        
        if (!atividade.exists) {
            return res.status(404).json({ error: 'Atividade não encontrada' });
        }
        
        const updates = {};
        if (titulo) updates.titulo = titulo;
        if (tipo) updates.tipo = tipo;
        if (imagem) updates.imagem = imagem;
        if (link) updates.link = link;
        if (descricao !== undefined) updates.descricao = descricao;
        
        await atividadeRef.update(updates);
        
        res.json({ message: 'Atividade atualizada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar atividade' });
    }
});

// DELETE - Remover atividade
router.delete('/:id', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { id } = req.params;
        
        const atividadeRef = db.collection('atividades').doc(id);
        const atividade = await atividadeRef.get();
        
        if (!atividade.exists) {
            return res.status(404).json({ error: 'Atividade não encontrada' });
        }
        
        await atividadeRef.delete();
        
        res.json({ message: 'Atividade removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover atividade' });
    }
});

module.exports = router;
