const { db } = require('../../firebase/firebase-admin');

const listarNotificacoes = async (req, res) => {
    try {
        const alunoId = req.user.id;
        const snapshot = await db.collection('notificacoes')
            .where('alunoId', '==', alunoId)
            .orderBy('data', 'desc').get();

        const notificacoes = snapshot.docs.map(doc => {
            const d = doc.data();
            return { id: doc.id, titulo: d.titulo, mensagem: d.mensagem, tipo: d.tipo, lida: d.lida, data: d.data };
        });
        res.json(notificacoes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar notificações' });
    }
};

const contarNaoLidas = async (req, res) => {
    try {
        const alunoId = req.user.id;
        const snapshot = await db.collection('notificacoes')
            .where('alunoId', '==', alunoId).where('lida', '==', false).get();
        res.json({ total: snapshot.size });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao contar notificações não lidas' });
    }
};

const marcarComoLida = async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;

        const notificacaoRef = db.collection('notificacoes').doc(id);
        const notificacao = await notificacaoRef.get();
        if (!notificacao.exists) return res.status(404).json({ error: 'Notificação não encontrada' });
        if (notificacao.data().alunoId !== alunoId) return res.status(403).json({ error: 'Acesso negado' });

        await notificacaoRef.update({ lida: true });
        res.json({ message: 'Notificação marcada como lida' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
    }
};

const marcarTodasComoLidas = async (req, res) => {
    try {
        const alunoId = req.user.id;
        const snapshot = await db.collection('notificacoes')
            .where('alunoId', '==', alunoId).where('lida', '==', false).get();

        const batch = db.batch();
        snapshot.forEach(doc => batch.update(doc.ref, { lida: true }));
        await batch.commit();

        res.json({ message: `${snapshot.size} notificação(ões) marcada(s) como lida(s)` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao marcar notificações como lidas' });
    }
};

const removerNotificacao = async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;

        const notificacaoRef = db.collection('notificacoes').doc(id);
        const notificacao = await notificacaoRef.get();
        if (!notificacao.exists) return res.status(404).json({ error: 'Notificação não encontrada' });
        if (notificacao.data().alunoId !== alunoId) return res.status(403).json({ error: 'Acesso negado' });

        await notificacaoRef.delete();
        res.json({ message: 'Notificação removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover notificação' });
    }
};

module.exports = { listarNotificacoes, contarNaoLidas, marcarComoLida, marcarTodasComoLidas, removerNotificacao };
