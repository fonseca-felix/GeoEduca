const bcrypt = require('bcryptjs');
const { db } = require('../../firebase/firebase-admin');

const listarAlunos = async (req, res) => {
    try {
        const snapshot = await db.collection('alunos').get();
        const alunos = snapshot.docs.map(doc => {
            const d = doc.data();
            return { id: doc.id, rm: d.rm, nome: d.nome, salas: d.salas || [d.salaId], salasNomes: d.salasNomes || [d.salaNome], tituloAtual: d.tituloAtual || "", bordaAtual: d.bordaAtual || "", createdAt: d.createdAt };
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
        const snapshot = await db.collection('alunos').where('salas', 'array-contains', salaId).get();
        const alunos = snapshot.docs.map(doc => {
            const d = doc.data();
            return { id: doc.id, rm: d.rm, nome: d.nome, salas: d.salas || [d.salaId], salasNomes: d.salasNomes || [d.salaNome], tituloAtual: d.tituloAtual || "", bordaAtual: d.bordaAtual || "" };
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
        res.json({ id: doc.id, rm: d.rm, nome: d.nome, salas: d.salas || [d.salaId], salasNomes: d.salasNomes || [d.salaNome], tituloAtual: d.tituloAtual || "", bordaAtual: d.bordaAtual || "", createdAt: d.createdAt });
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

        res.status(201).json({ id: docRef.id, rm, nome, salas: [salaId], salasNomes: [salaData.nome] });
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


const entrarTurma = async (req, res) => {
  try {
    const alunoId = req.user.id;
    const { codigoSala } = req.body;
    
    const snapshot = await db.collection('salas').where('turma', '==', codigoSala).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ error: 'Código de sala inválido' });
    
    const salaDoc = snapshot.docs[0];
    const salaId = salaDoc.id;
    const salaData = salaDoc.data();
    
    const alunoRef = db.collection('alunos').doc(alunoId);
    const alunoDoc = await alunoRef.get();
    if (!alunoDoc.exists) return res.status(404).json({ error: 'Aluno não encontrado' });
    
    const d = alunoDoc.data();
    let salas = d.salas || [];
    let salasNomes = d.salasNomes || [];
    
    if (d.salaId && !salas.includes(d.salaId)) {
        salas.push(d.salaId);
        salasNomes.push(d.salaNome);
    }
    
    if (salas.includes(salaId)) {
        return res.status(400).json({ error: 'Você já está nesta turma' });
    }
    
    salas.push(salaId);
    salasNomes.push(salaData.nome);
    
    await alunoRef.update({ salas, salasNomes });
    res.json({ message: 'Entrou na turma com sucesso', salas, salasNomes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao entrar na turma' });
  }
};

const equiparCosmetico = async (req, res) => {
  try {
    const alunoId = req.user.id;
    const { tipo, valor } = req.body; // tipo: 'titulo' ou 'borda'
    const updates = {};
    if (tipo === 'titulo') updates.tituloAtual = valor;
    if (tipo === 'borda') updates.bordaAtual = valor;
    
    await db.collection('alunos').doc(alunoId).update(updates);
    res.json({ message: 'Cosmético equipado', updates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao equipar cosmético' });
  }
};

module.exports = { listarAlunos, listarAlunosPorSala, buscarAluno, criarAluno, atualizarAluno, removerAluno, entrarTurma, equiparCosmetico };

