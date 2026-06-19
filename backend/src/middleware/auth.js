const jwt = require('jsonwebtoken');
const { db } = require('../../firebase/firebase-admin');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026');
        
        // Verificar se o usuário ainda existe
        if (decoded.tipo === 'prof') {
            const professorRef = db.collection('professores').doc(decoded.id);
            const professor = await professorRef.get();
            if (!professor.exists) {
                return res.status(401).json({ error: 'Usuário não encontrado.' });
            }
            req.user = { id: decoded.id, tipo: 'prof', ...professor.data() };
        } else {
            const alunoRef = db.collection('alunos').doc(decoded.id);
            const aluno = await alunoRef.get();
            if (!aluno.exists) {
                return res.status(401).json({ error: 'Usuário não encontrado.' });
            }
            req.user = { id: decoded.id, tipo: 'aluno', ...aluno.data() };
        }
        
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
};

const requireProfessor = (req, res, next) => {
    if (req.user.tipo !== 'prof') {
        return res.status(403).json({ error: 'Acesso restrito a professores.' });
    }
    next();
};

const requireAluno = (req, res, next) => {
    if (req.user.tipo !== 'aluno') {
        return res.status(403).json({ error: 'Acesso restrito a alunos.' });
    }
    next();
};

module.exports = { authenticateToken, requireProfessor, requireAluno };
