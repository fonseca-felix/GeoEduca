const { db } = require('../../firebase/firebase-admin');

const listarJogos = async (req, res) => {
    try {
        const snapshot = await db.collection('jogos').get();
        const jogos = snapshot.docs.map(doc => {
            const d = doc.data();
            return { id: doc.id, titulo: d.titulo, descricao: d.descricao, tipo: d.tipo, imagem: d.imagem, link: d.link, pontuacaoMaxima: d.pontuacaoMaxima, createdAt: d.createdAt };
        });
        res.json(jogos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar jogos' });
    }
};

const criarJogo = async (req, res) => {
    try {
        const { titulo, descricao, tipo, imagem, link, pontuacaoMaxima } = req.body;
        if (!titulo || !tipo) return res.status(400).json({ error: 'Título e tipo são obrigatórios' });

        const novoJogo = {
            titulo, descricao: descricao || '', tipo,
            imagem: imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
            link: link || '', pontuacaoMaxima: pontuacaoMaxima || 100, createdAt: new Date().toISOString()
        };
        const docRef = await db.collection('jogos').add(novoJogo);
        res.status(201).json({ id: docRef.id, ...novoJogo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar jogo' });
    }
};

const registrarPontuacao = async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;
        const { pontuacao } = req.body;

        if (pontuacao === undefined || pontuacao === null) return res.status(400).json({ error: 'Pontuação é obrigatória' });

        const jogo = await db.collection('jogos').doc(id).get();
        if (!jogo.exists) return res.status(404).json({ error: 'Jogo não encontrado' });

        await db.collection('jogo_pontuacoes').add({ jogoId: id, alunoId, pontuacao: Number(pontuacao), data: new Date().toISOString() });
        res.status(201).json({ message: 'Pontuação registrada com sucesso', pontuacao });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar pontuação' });
    }
};

module.exports = { listarJogos, criarJogo, registrarPontuacao };
