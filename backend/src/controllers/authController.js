const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../../firebase/firebase-admin');

// Nova função unificada de Login
const login = async (req, res) => {
    try {
        const { identificador, senha, 'g-recaptcha-response': recaptchaResponse } = req.body; // identificador pode ser email ou rm

        if (!identificador || !senha) {
            return res.status(400).json({ error: 'Identificador e senha são obrigatórios' });
        }

        // Verify reCAPTCHA if secret is set
        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
        if (recaptchaSecret) {
            if (!recaptchaResponse) {
                return res.status(400).json({ error: 'Validação de reCAPTCHA é obrigatória' });
            }
            const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaResponse}`;
            const response = await fetch(verifyUrl, { method: 'POST' });
            const recaptchaData = await response.json();
            if (!recaptchaData.success) {
                return res.status(400).json({ error: 'Falha na validação do reCAPTCHA' });
            }
        }

        // 1. Checar Master Admin
        const masterEmail = process.env.MASTER_EMAIL || 'GEOEDUCA';
        const masterSenha = process.env.MASTER_PASSWORD || 'FJLP47';
        if (identificador === masterEmail && senha === masterSenha) {
            const token = jwt.sign(
                { id: 'master_admin', tipo: 'master', email: masterEmail },
                process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );
            return res.json({
                token,
                usuario: { id: 'master_admin', nome: 'Admin Master', email: masterEmail, tipo: 'master' }
            });
        }

        // 1.5. Conta ADM Escola Mock
        if (identificador === 'CE399 SESI' && senha === 'SesiCE399') {
            const token = jwt.sign(
                { id: 'escola_ce399', tipo: 'escola', email: 'ce399@sesi' },
                process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );
            return res.json({
                token,
                usuario: { id: 'escola_ce399', nome: 'CE399 SESI', email: 'ce399@sesi', tipo: 'escola' }
            });
        }

        // Mock Prof
        if (identificador === 'prof123' && senha === 'prof123') {
            const token = jwt.sign({ id: 'prof_123', tipo: 'prof', email: 'prof123@mock', escolaId: 'escola_ce399' }, process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026', { expiresIn: '7d' });
            return res.json({ token, usuario: { id: 'prof_123', nome: 'Professor Teste', email: 'prof123@mock', escolaId: 'escola_ce399', tipo: 'prof' } });
        }

        // Mock Aluno
        if (identificador === 'aluno123' && senha === 'aluno123') {
            const token = jwt.sign({ id: 'aluno_123', tipo: 'aluno', rm: 'aluno123' }, process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026', { expiresIn: '7d' });
            return res.json({ token, usuario: { id: 'aluno_123', rm: 'aluno123', nome: 'Aluno Teste', tipo: 'aluno' } });
        }

        // 2. Tentar na coleção escolas
        const escolaSnap = await db.collection('escolas').where('email', '==', identificador).limit(1).get();
        if (!escolaSnap.empty) {
            const escola = escolaSnap.docs[0];
            const escolaData = escola.data();
            const senhaValida = await bcrypt.compare(senha, escolaData.senha);
            if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas' });
            
            const token = jwt.sign(
                { id: escola.id, tipo: 'escola', email: escolaData.email },
                process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );
            return res.json({
                token,
                usuario: { id: escola.id, nome: escolaData.nome, email: escolaData.email, tipo: 'escola' }
            });
        }

        // 3. Tentar na coleção professores
        const profSnap = await db.collection('professores').where('email', '==', identificador).limit(1).get();
        if (!profSnap.empty) {
            const prof = profSnap.docs[0];
            const profData = prof.data();
            const senhaValida = await bcrypt.compare(senha, profData.senha);
            if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas' });
            
            const token = jwt.sign(
                { id: prof.id, tipo: 'prof', email: profData.email, escolaId: profData.escolaId },
                process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );
            return res.json({
                token,
                usuario: { id: prof.id, nome: profData.nome, email: profData.email, escolaId: profData.escolaId, tipo: 'prof' }
            });
        }

        // 4. Tentar na coleção alunos (RM)
        const alunoSnap = await db.collection('alunos').where('rm', '==', identificador).limit(1).get();
        if (!alunoSnap.empty) {
            const aluno = alunoSnap.docs[0];
            const alunoData = aluno.data();
            const senhaValida = await bcrypt.compare(senha, alunoData.senha);
            if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas' });
            
            const token = jwt.sign(
                { id: aluno.id, tipo: 'aluno', rm: alunoData.rm },
                process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );
            return res.json({
                token,
                usuario: { id: aluno.id, rm: alunoData.rm, nome: alunoData.nome, salaId: alunoData.salaId, salaNome: alunoData.salaNome, tipo: 'aluno' }
            });
        }

        return res.status(401).json({ error: 'Credenciais inválidas ou usuário não encontrado' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};

const verifyToken = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026');

        if (decoded.tipo === 'master') {
            return res.json({ valido: true, usuario: { id: 'master_admin', nome: 'Admin Master', email: decoded.email, tipo: 'master' } });
        }

        if (decoded.tipo === 'prof' && decoded.id === 'prof_123') {
            return res.json({ valido: true, usuario: { id: 'prof_123', nome: 'Professor Teste', email: 'prof123@mock', tipo: 'prof' } });
        }
        if (decoded.tipo === 'aluno' && decoded.id === 'aluno_123') {
            return res.json({ valido: true, usuario: { id: 'aluno_123', rm: 'aluno123', nome: 'Aluno Teste', tipo: 'aluno' } });
        }

        if (decoded.tipo === 'escola') {
            if (decoded.id === 'escola_ce399') {
                return res.json({ valido: true, usuario: { id: 'escola_ce399', nome: 'CE399 SESI', email: 'ce399@sesi', tipo: 'escola' } });
            }
            const escola = await db.collection('escolas').doc(decoded.id).get();
            if (!escola.exists) return res.status(401).json({ error: 'Escola não encontrada' });
            const d = escola.data();
            return res.json({ valido: true, usuario: { id: escola.id, nome: d.nome, email: d.email, tipo: 'escola' } });
        }

        if (decoded.tipo === 'prof') {
            const professor = await db.collection('professores').doc(decoded.id).get();
            if (!professor.exists) return res.status(401).json({ error: 'Usuário não encontrado' });
            const d = professor.data();
            return res.json({ valido: true, usuario: { id: professor.id, nome: d.nome, email: d.email, escolaId: d.escolaId, tipo: 'prof' } });
        }

        const aluno = await db.collection('alunos').doc(decoded.id).get();
        if (!aluno.exists) return res.status(401).json({ error: 'Usuário não encontrado' });
        const d = aluno.data();
        res.json({ valido: true, usuario: { id: aluno.id, rm: d.rm, nome: d.nome, salaId: d.salaId, salaNome: d.salaNome, tipo: 'aluno' } });
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
};

module.exports = { login, verifyToken };
