const { db } = require('../../firebase/firebase-admin');

const listarProvas = async (req, res) => {
    try {
        const snapshot = await db.collection('provas').get();
        const provas = [];
        for (const doc of snapshot.docs) {
            const d = doc.data();
            const questoesSnapshot = await db.collection('prova_questoes').where('provaId', '==', doc.id).get();
            const questoes = questoesSnapshot.docs.map(qDoc => ({ id: qDoc.id, ...qDoc.data() }));
            provas.push({ id: doc.id, titulo: d.titulo, imagem: d.imagem, rubrica: d.rubrica, questoes, createdAt: d.createdAt });
        }
        res.json(provas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar provas' });
    }
};

const criarProva = async (req, res) => {
    try {
        const { titulo, imagem, rubrica, questoes } = req.body;
        if (!titulo || !questoes?.length) return res.status(400).json({ error: 'Título e questões são obrigatórios' });

        const novaProva = {
            titulo, imagem: imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
            rubrica: rubrica || '', createdAt: new Date().toISOString()
        };
        const provaRef = await db.collection('provas').add(novaProva);
        for (const q of questoes) {
            await db.collection('prova_questoes').add({
                provaId: provaRef.id, texto: q.texto, tipo: q.tipo,
                opcoes: q.opcoes || null, correta: q.correta !== undefined ? q.correta : null, valor: q.valor || 5
            });
        }
        res.status(201).json({ id: provaRef.id, ...novaProva, questoes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar prova' });
    }
};

const responderProva = async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;
        const { respostas } = req.body;

        if (!respostas || !Array.isArray(respostas)) return res.status(400).json({ error: 'Respostas são obrigatórias' });

        const prova = await db.collection('provas').doc(id).get();
        if (!prova.exists) return res.status(404).json({ error: 'Prova não encontrada' });

        const respostaExistente = await db.collection('prova_respostas')
            .where('provaId', '==', id).where('alunoId', '==', alunoId).limit(1).get();
        if (!respostaExistente.empty) return res.status(400).json({ error: 'Prova já respondida' });

        await db.collection('prova_respostas').add({
            provaId: id, alunoId, respostas, status: 'pendente', dataEnvio: new Date().toISOString()
        });

        res.status(201).json({ message: 'Prova enviada com sucesso! Aguarde a correção do professor.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao enviar respostas da prova' });
    }
};

const corrigirProva = async (req, res) => {
    try {
        const { respostaId } = req.params;
        const { nota, feedback } = req.body;

        const respostaRef = db.collection('prova_respostas').doc(respostaId);
        const resposta = await respostaRef.get();
        if (!resposta.exists) return res.status(404).json({ error: 'Resposta não encontrada' });

        await respostaRef.update({ nota: nota || 0, feedback: feedback || '', status: 'corrigida', dataCorrecao: new Date().toISOString() });
        res.json({ message: 'Prova corrigida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao corrigir prova' });
    }
};

module.exports = { listarProvas, criarProva, responderProva, corrigirProva };
