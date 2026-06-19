const express = require('express');
const { db } = require('../../firebase/firebase-admin');
const { authenticateToken, requireAluno } = require('../middleware/auth');

const router = express.Router();

// GET - Listar notificações do aluno logado
router.get('/', authenticateToken, requireAluno, async (req, res) => {
    try {
        const alunoId = req.user.id;

        const notificacoesRef = db.collection('notificacoes');
        const snapshot = await notificacoesRef
            .where('alunoId', '==', alunoId)
            .orderBy('data', 'desc')
            .get();

        const notificacoes = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            notificacoes.push({
                id: doc.id,
                titulo: data.titulo,
                mensagem: data.mensagem,
                tipo: data.tipo,
                lida: data.lida,
                data: data.data
            });
        });

        res.json(notificacoes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar notificações' });
    }
});

// GET - Contar notificações não lidas
router.get('/nao-lidas/count', authenticateToken, requireAluno, async (req, res) => {
    try {
        const alunoId = req.user.id;

        const notificacoesRef = db.collection('notificacoes');
        const snapshot = await notificacoesRef
            .where('alunoId', '==', alunoId)
            .where('lida', '==', false)
            .get();

        res.json({ total: snapshot.size });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao contar notificações não lidas' });
    }
});

// PUT - Marcar notificação como lida
router.put('/:id/lida', authenticateToken, requireAluno, async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;

        const notificacaoRef = db.collection('notificacoes').doc(id);
        const notificacao = await notificacaoRef.get();

        if (!notificacao.exists) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }

        // Garantir que o aluno só pode marcar suas próprias notificações
        if (notificacao.data().alunoId !== alunoId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        await notificacaoRef.update({ lida: true });

        res.json({ message: 'Notificação marcada como lida' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
    }
});

// PUT - Marcar todas as notificações como lidas
router.put('/todas/lidas', authenticateToken, requireAluno, async (req, res) => {
    try {
        const alunoId = req.user.id;

        const notificacoesRef = db.collection('notificacoes');
        const snapshot = await notificacoesRef
            .where('alunoId', '==', alunoId)
            .where('lida', '==', false)
            .get();

        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.update(doc.ref, { lida: true });
        });

        await batch.commit();

        res.json({ message: `${snapshot.size} notificação(ões) marcada(s) como lida(s)` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao marcar notificações como lidas' });
    }
});

// DELETE - Remover notificação
router.delete('/:id', authenticateToken, requireAluno, async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;

        const notificacaoRef = db.collection('notificacoes').doc(id);
        const notificacao = await notificacaoRef.get();

        if (!notificacao.exists) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }

        if (notificacao.data().alunoId !== alunoId) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        await notificacaoRef.delete();

        res.json({ message: 'Notificação removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover notificação' });
    }
});

module.exports = router;
