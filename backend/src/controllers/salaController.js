const { db } = require('../../firebase/firebase-admin');

const listarSalas = async (req, res) => {
    try {
        const snapshot = await db.collection('salas').get();
        const salas = snapshot.docs.map(doc => {
            const d = doc.data();
            return { id: doc.id, nome: d.nome, serie: d.serie, turma: d.turma, createdAt: d.createdAt };
        });
        res.json(salas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar salas' });
    }
};

const buscarSala = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('salas').doc(id).get();
        if (!doc.exists) return res.status(404).json({ error: 'Sala não encontrada' });
        const d = doc.data();
        res.json({ id: doc.id, nome: d.nome, serie: d.serie, turma: d.turma, createdAt: d.createdAt });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar sala' });
    }
};

const criarSala = async (req, res) => {
    try {
        const { nome, serie, turma } = req.body;
        if (!nome || !serie || !turma) {
            return res.status(400).json({ error: 'Nome, série e turma são obrigatórios' });
        }
        const docRef = await db.collection('salas').add({ nome, serie, turma, createdAt: new Date().toISOString() });
        res.status(201).json({ id: docRef.id, nome, serie, turma });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar sala' });
    }
};

const atualizarSala = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, serie, turma } = req.body;

        const salaRef = db.collection('salas').doc(id);
        const sala = await salaRef.get();
        if (!sala.exists) return res.status(404).json({ error: 'Sala não encontrada' });

        const updates = {};
        if (nome) updates.nome = nome;
        if (serie) updates.serie = serie;
        if (turma) updates.turma = turma;

        await salaRef.update(updates);
        res.json({ message: 'Sala atualizada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar sala' });
    }
};

const removerSala = async (req, res) => {
    try {
        const { id } = req.params;
        const salaRef = db.collection('salas').doc(id);
        const sala = await salaRef.get();
        if (!sala.exists) return res.status(404).json({ error: 'Sala não encontrada' });

        const alunos = await db.collection('alunos').where('salaId', '==', id).limit(1).get();
        if (!alunos.empty) {
            return res.status(400).json({ error: 'Não é possível remover sala com alunos. Remova os alunos primeiro.' });
        }

        await salaRef.delete();
        res.json({ message: 'Sala removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover sala' });
    }
};

module.exports = { listarSalas, buscarSala, criarSala, atualizarSala, removerSala };
