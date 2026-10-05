const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { supabase } = require('../../supabase/client');

const login = async (req, res) => {
    try {
        const { identificador, senha, 'g-recaptcha-response': recaptchaResponse } = req.body; 

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
            const { data: recaptchaData } = await axios.post(verifyUrl);
            if (!recaptchaData.success) {
                return res.status(400).json({ error: 'Falha na validação do reCAPTCHA' });
            }
        }

        const masterEmail = process.env.MASTER_EMAIL || 'GEOEDUCA';
        const masterSenha = process.env.MASTER_PASSWORD || 'FJLP47';
        if (identificador === masterEmail && senha === masterSenha) {
            const token = jwt.sign(
                { id: 'master_admin', tipo: 'master', email: masterEmail },
                process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );
            return res.json({ token, usuario: { id: 'master_admin', nome: 'Admin Master', email: masterEmail, tipo: 'master' } });
        }

        if (identificador === 'CE399 SESI' && senha === 'SesiCE399') {
            const token = jwt.sign(
                { id: 'escola_ce399', tipo: 'escola', email: 'ce399@sesi' },
                process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );
            return res.json({ token, usuario: { id: 'escola_ce399', nome: 'CE399 SESI', email: 'ce399@sesi', tipo: 'escola' } });
        }

        if (identificador.includes('@')) {
            const { data: escolaSnap } = await supabase.from('escolas').select('*').eq('email', identificador).limit(1);
            if (escolaSnap && escolaSnap.length > 0) {
                const escola = escolaSnap[0];
                const senhaValida = await bcrypt.compare(senha, escola.senha);
                if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas' });
                
                const token = jwt.sign(
                    { id: escola.id, tipo: 'escola', email: escola.email },
                    process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
                    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
                );
                return res.json({ token, usuario: { id: escola.id, nome: escola.nome, email: escola.email, tipo: 'escola' } });
            }

            const { data: profSnap } = await supabase.from('professores').select('*').eq('email', identificador).limit(1);
            if (profSnap && profSnap.length > 0) {
                const prof = profSnap[0];
                const senhaValida = await bcrypt.compare(senha, prof.senha);
                if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas' });
                
                const token = jwt.sign(
                    { id: prof.id, tipo: 'prof', email: prof.email, escolaId: prof.escolaId },
                    process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
                    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
                );
                return res.json({ token, usuario: { id: prof.id, nome: prof.nome, email: prof.email, escolaId: prof.escolaId, tipo: 'prof' } });
            }
        } else {
            const { data: alunoSnap } = await supabase.from('alunos').select('*').eq('rm', identificador).limit(1);
            if (alunoSnap && alunoSnap.length > 0) {
                const aluno = alunoSnap[0];
                const senhaValida = await bcrypt.compare(senha, aluno.senha);
                if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas' });
                
                const token = jwt.sign(
                    { id: aluno.id, tipo: 'aluno', rm: aluno.rm },
                    process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
                    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
                );
                return res.json({ token, usuario: { id: aluno.id, rm: aluno.rm, nome: aluno.nome, salaId: aluno.salaId, salaNome: aluno.salaNome, tipo: 'aluno' } });
            }
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
        if (decoded.tipo === 'escola' && decoded.id === 'escola_ce399') {
            return res.json({ valido: true, usuario: { id: 'escola_ce399', nome: 'CE399 SESI', email: 'ce399@sesi', tipo: 'escola' } });
        }

        if (decoded.tipo === 'escola') {
            const { data: escola, error } = await supabase.from('escolas').select('*').eq('id', decoded.id).single();
            if (error || !escola) return res.status(401).json({ error: 'Escola não encontrada' });
            return res.json({ valido: true, usuario: { id: escola.id, nome: escola.nome, email: escola.email, tipo: 'escola' } });
        }

        if (decoded.tipo === 'prof') {
            const { data: professor, error } = await supabase.from('professores').select('*').eq('id', decoded.id).single();
            if (error || !professor) return res.status(401).json({ error: 'Usuário não encontrado' });
            return res.json({ valido: true, usuario: { id: professor.id, nome: professor.nome, email: professor.email, escolaId: professor.escolaId, tipo: 'prof' } });
        }

        const { data: aluno, error } = await supabase.from('alunos').select('*').eq('id', decoded.id).single();
        if (error || !aluno) return res.status(401).json({ error: 'Usuário não encontrado' });
        res.json({ valido: true, usuario: { id: aluno.id, rm: aluno.rm, nome: aluno.nome, salaId: aluno.salaId, salaNome: aluno.salaNome, tipo: 'aluno' } });
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
};

module.exports = { login, verifyToken };
