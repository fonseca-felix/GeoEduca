const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../../firebase/firebase-admin');

const loginProfessor = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        const snapshot = await db.collection('professores').where('email', '==', email).limit(1).get();

        if (snapshot.empty) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const professor = snapshot.docs[0];
        const professorData = professor.data();
        const senhaValida = await bcrypt.compare(senha, professorData.senha);

        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: professor.id, tipo: 'prof', email: professorData.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            token,
            usuario: { id: professor.id, nome: professorData.nome, email: professorData.email, tipo: 'prof' }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};

const loginAluno = async (req, res) => {
    try {
        const { rm, senha } = req.body;

        if (!rm || !senha) {
            return res.status(400).json({ error: 'RM e senha são obrigatórios' });
        }

        const snapshot = await db.collection('alunos').where('rm', '==', rm).limit(1).get();

        if (snapshot.empty) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const aluno = snapshot.docs[0];
        const alunoData = aluno.data();
        const senhaValida = await bcrypt.compare(senha, alunoData.senha);

        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: aluno.id, tipo: 'aluno', rm: alunoData.rm },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            token,
            usuario: {
                id: aluno.id, rm: alunoData.rm, nome: alunoData.nome,
                salaId: alunoData.salaId, salaNome: alunoData.salaNome, tipo: 'aluno'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};

const verifyToken = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.tipo === 'prof') {
            const professor = await db.collection('professores').doc(decoded.id).get();
            if (!professor.exists) return res.status(401).json({ error: 'Usuário não encontrado' });
            const d = professor.data();
            return res.json({ valido: true, usuario: { id: professor.id, nome: d.nome, email: d.email, tipo: 'prof' } });
        }

        const aluno = await db.collection('alunos').doc(decoded.id).get();
        if (!aluno.exists) return res.status(401).json({ error: 'Usuário não encontrado' });
        const d = aluno.data();
        res.json({ valido: true, usuario: { id: aluno.id, rm: d.rm, nome: d.nome, salaId: d.salaId, salaNome: d.salaNome, tipo: 'aluno' } });
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
};

module.exports = { loginProfessor, loginAluno, verifyToken };
