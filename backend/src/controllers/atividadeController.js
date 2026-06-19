const { db } = require('../../firebase/firebase-admin');

const listarAtividades = async (req, res) => {
    try {
        const snapshot = await db.collection('atividades').get();
        const atividades = snapshot.docs.map(doc => {
            const d = doc.data();
            return { id: doc.id, titulo: d.titulo, tipo: d.tipo, imagem: d.imagem, link: d.link, descricao: d.descricao, createdAt: d.createdAt };
        });
        res.json(atividades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar atividades' });
    }
};

const listarMinhasAtividades = async (req, res) => {
    try {
        const alunoId = req.user.id;
        const alunoDoc = await db.collection('alunos').doc(alunoId).get();
        if (!alunoDoc.exists) return res.status(404).json({ error: 'Aluno não encontrado' });

        const { salaId } = alunoDoc.data();
        const snapshot = await db.collection('atividades_enviadas').where('salaId', '==', salaId).get();

        const atividades = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const atividadeDoc = await db.collection('atividades').doc(data.atividadeId).get();
            if (!atividadeDoc.exists) continue;

            const atividadeData = atividadeDoc.data();
            const visualizacao = await db.collection('visualizacoes_atividades')
                .where('atividadeEnviadaId', '==', doc.id)
                .where('alunoId', '==', alunoId)
                .limit(1).get();

            atividades.push({
                id: doc.id, atividadeId: data.atividadeId,
                titulo: atividadeData.titulo, tipo: atividadeData.tipo,
                imagem: atividadeData.imagem, link: atividadeData.link,
                descricao: atividadeData.descricao, dataLimite: data.dataLimite,
                visualizado: !visualizacao.empty, createdAt: data.createdAt
            });
        }

        res.json(atividades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar atividades do aluno' });
    }
};

const criarAtividade = async (req, res) => {
    try {
        const { titulo, tipo, imagem, link, descricao } = req.body;
        if (!titulo || !tipo || !link) {
            return res.status(400).json({ error: 'Título, tipo e link são obrigatórios' });
        }
        const novaAtividade = {
            titulo, tipo,
            imagem: imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
            link, descricao: descricao || '', createdAt: new Date().toISOString()
        };
        const docRef = await db.collection('atividades').add(novaAtividade);
        res.status(201).json({ id: docRef.id, ...novaAtividade });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar atividade' });
    }
};

const enviarAtividade = async (req, res) => {
    try {
        const { salaId, atividadeId, dataLimite } = req.body;
        if (!salaId || !atividadeId) {
            return res.status(400).json({ error: 'Sala e atividade são obrigatórios' });
        }

        const sala = await db.collection('salas').doc(salaId).get();
        if (!sala.exists) return res.status(404).json({ error: 'Sala não encontrada' });

        const atividade = await db.collection('atividades').doc(atividadeId).get();
        if (!atividade.exists) return res.status(404).json({ error: 'Atividade não encontrada' });

        const envio = { salaId, atividadeId, dataLimite: dataLimite || null, visualizado: false, createdAt: new Date().toISOString() };
        const docRef = await db.collection('atividades_enviadas').add(envio);

        const alunos = await db.collection('alunos').where('salaId', '==', salaId).get();
        for (const alunoDoc of alunos.docs) {
            await db.collection('notificacoes').add({
                alunoId: alunoDoc.id,
                titulo: 'Nova atividade disponível!',
                mensagem: `A atividade "${atividade.data().titulo}" foi disponibilizada para sua turma.`,
                tipo: 'atividade', lida: false, data: new Date().toISOString()
            });
        }

        res.status(201).json({ id: docRef.id, ...envio });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao enviar atividade' });
    }
};

const visualizarAtividade = async (req, res) => {
    try {
        const { atividadeEnviadaId } = req.params;
        const alunoId = req.user.id;

        const atividadeEnviada = await db.collection('atividades_enviadas').doc(atividadeEnviadaId).get();
        if (!atividadeEnviada.exists) return res.status(404).json({ error: 'Atividade não encontrada' });

        const visualizacaoExistente = await db.collection('visualizacoes_atividades')
            .where('atividadeEnviadaId', '==', atividadeEnviadaId)
            .where('alunoId', '==', alunoId).limit(1).get();

        if (!visualizacaoExistente.empty) return res.status(400).json({ error: 'Atividade já visualizada' });

        await db.collection('visualizacoes_atividades').add({
            atividadeEnviadaId, alunoId, dataVisualizacao: new Date().toISOString()
        });

        res.json({ message: 'Atividade marcada como visualizada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar visualização' });
    }
};

const atualizarAtividade = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, tipo, imagem, link, descricao } = req.body;

        const atividadeRef = db.collection('atividades').doc(id);
        const atividade = await atividadeRef.get();
        if (!atividade.exists) return res.status(404).json({ error: 'Atividade não encontrada' });

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
};

const removerAtividade = async (req, res) => {
    try {
        const { id } = req.params;
        const atividadeRef = db.collection('atividades').doc(id);
        const atividade = await atividadeRef.get();
        if (!atividade.exists) return res.status(404).json({ error: 'Atividade não encontrada' });
        await atividadeRef.delete();
        res.json({ message: 'Atividade removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover atividade' });
    }
};

module.exports = { listarAtividades, listarMinhasAtividades, criarAtividade, enviarAtividade, visualizarAtividade, atualizarAtividade, removerAtividade };
