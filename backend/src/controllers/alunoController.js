const bcrypt = require('bcryptjs');
const { db } = require('../../firebase/firebase-admin');

const listarAlunos = async (req, res) => {
    try {
        const snapshot = await db.collection('alunos').get();
        const alunos = snapshot.docs.map(doc => {
            const d = doc.data();
            return { id: doc.id, rm: d.rm, nome: d.nome, salaId: d.salaId, salaNome: d.salaNome, createdAt: d.createdAt };
        });
        res.json(alunos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar alunos' });
    }
};

const listarAlunosPorSala = async (req, res) => {
    try {
        const { salaId } = req.params;
        const snapshot = await db.collection('alunos').where('salaId', '==', salaId).get();
        const alunos = snapshot.docs.map(doc => {
            const d = doc.data();
            return { id: doc.id, rm: d.rm, nome: d.nome, salaId: d.salaId, salaNome: d.salaNome };
        });
        res.json(alunos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar alunos da sala' });
    }
};

const buscarAluno = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.tipo === 'aluno' && req.user.id !== id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const doc = await db.collection('alunos').doc(id).get();
        if (!doc.exists) return res.status(404).json({ error: 'Aluno não encontrado' });

        const d = doc.data();
        res.json({ id: doc.id, rm: d.rm, nome: d.nome, salaId: d.salaId, salaNome: d.salaNome, createdAt: d.createdAt });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar aluno' });
    }
};

const criarAluno = async (req, res) => {
    try {
        const { rm, nome, senha, salaId } = req.body;

        if (!rm || !nome || !senha || !salaId) {
            return res.status(400).json({ error: 'RM, nome, senha e sala são obrigatórios' });
        }

        const rmCheck = await db.collection('alunos').where('rm', '==', rm).limit(1).get();
        if (!rmCheck.empty) return res.status(400).json({ error: 'RM já cadastrado' });

        const sala = await db.collection('salas').doc(salaId).get();
        if (!sala.exists) return res.status(404).json({ error: 'Sala não encontrada' });

        const hashedPassword = await bcrypt.hash(senha, 10);
        const salaData = sala.data();

        const docRef = await db.collection('alunos').add({
            rm, nome, senha: hashedPassword, salaId,
            salaNome: salaData.nome, createdAt: new Date().toISOString()
        });

        res.status(201).json({ id: docRef.id, rm, nome, salaId, salaNome: salaData.nome });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar aluno' });
    }
};

const atualizarAluno = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, senha, salaId } = req.body;

        const alunoRef = db.collection('alunos').doc(id);
        const aluno = await alunoRef.get();
        if (!aluno.exists) return res.status(404).json({ error: 'Aluno não encontrado' });

        const updates = {};
        if (nome) updates.nome = nome;
        if (senha) updates.senha = await bcrypt.hash(senha, 10);
        if (salaId) {
            const sala = await db.collection('salas').doc(salaId).get();
            if (!sala.exists) return res.status(404).json({ error: 'Sala não encontrada' });
            updates.salaId = salaId;
            updates.salaNome = sala.data().nome;
        }

        await alunoRef.update(updates);
        res.json({ message: 'Aluno atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar aluno' });
    }
};

const removerAluno = async (req, res) => {
    try {
        const { id } = req.params;
        const alunoRef = db.collection('alunos').doc(id);
        const aluno = await alunoRef.get();
        if (!aluno.exists) return res.status(404).json({ error: 'Aluno não encontrado' });
        await alunoRef.delete();
        res.json({ message: 'Aluno removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover aluno' });
    }
};

module.exports = { listarAlunos, listarAlunosPorSala, buscarAluno, criarAluno, atualizarAluno, removerAluno };
