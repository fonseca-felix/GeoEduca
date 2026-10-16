const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../../firebase/firebase-admin');
const { sendProfessorWelcomeEmail, sendPasswordResetCodeEmail } = require('../services/emailService');

// Nova função unificada de Login
const login = async (req, res) => {
    try {
        const { identificador, senha, codigoVerificacao, 'g-recaptcha-response': recaptchaResponse } = req.body;

        if (!identificador || !senha) {
            return res.status(400).json({ error: 'Identificador e senha são obrigatórios' });
        }

        // Verify reCAPTCHA if secret is set (skip on 2nd step when codigoVerificacao is being submitted)
        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
        if (recaptchaSecret && !codigoVerificacao) {
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

        // 3. Tentar na coleção professores (por email exato ou case-insensitive / emailRecuperacao)
        const allProfsSnap = await db.collection('professores').get();
        const identLower = identificador.trim().toLowerCase();
        const profDoc = allProfsSnap.docs.find(d => {
            const data = d.data();
            return (
                data.email === identificador.trim() ||
                (data.email || '').toLowerCase() === identLower ||
                (data.emailRecuperacao || '').toLowerCase() === identLower
            );
        });

        if (profDoc) {
            const profData = profDoc.data();
            const senhaValida = await bcrypt.compare(senha, profData.senha);
            if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas' });

            // Verificação de 1º login via código enviado ao Gmail
            if (profData.emailVerificado === false && profData.codigoVerificacao) {
                if (!codigoVerificacao) {
                    return res.json({
                        requiresVerification: true,
                        email: profData.emailRecuperacao || profData.email,
                        codigoSimulado: profData.codigoVerificacao,
                        message: `Enviamos um código de 6 dígitos para ${profData.emailRecuperacao || profData.email}. Digite-o abaixo para confirmar seu 1º acesso.`
                    });
                }

                if (String(codigoVerificacao).trim() !== String(profData.codigoVerificacao).trim()) {
                    return res.status(400).json({ error: 'Código de confirmação incorreto. Verifique seu Gmail.' });
                }

                await db.collection('professores').doc(profDoc.id).update({
                    emailVerificado: true,
                    codigoVerificacao: null
                });
            }

            const token = jwt.sign(
                { id: profDoc.id, tipo: 'prof', email: profData.email, escolaId: profData.escolaId },
                process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );
            return res.json({
                token,
                usuario: { id: profDoc.id, nome: profData.nome, email: profData.email, escolaId: profData.escolaId, tipo: 'prof' }
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
                usuario: { id: aluno.id, rm: alunoData.rm, nome: alunoData.nome, salaId: alunoData.salaId, salaNome: alunoData.salaNome, tipo: 'aluno', tituloAtual: alunoData.tituloAtual, bordaAtual: alunoData.bordaAtual, iconeAtual: alunoData.iconeAtual }
            });
        }

        return res.status(401).json({ error: 'Credenciais inválidas ou usuário não encontrado' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
};

// Reenvia o código de confirmação de 1º acesso para o Gmail do professor
const resendVerificationCode = async (req, res) => {
    try {
        const { identificador } = req.body;
        if (!identificador) return res.status(400).json({ error: 'Informe o e-mail do professor' });

        const identLower = identificador.trim().toLowerCase();
        const allProfsSnap = await db.collection('professores').get();
        const profDoc = allProfsSnap.docs.find(d => {
            const data = d.data();
            return (
                data.email === identificador.trim() ||
                (data.email || '').toLowerCase() === identLower ||
                (data.emailRecuperacao || '').toLowerCase() === identLower
            );
        });

        if (!profDoc) {
            return res.status(404).json({ error: 'Professor não encontrado' });
        }

        const profData = profDoc.data();
        const targetEmail = profData.emailRecuperacao || profData.email;
        const codigoVerificacao = String(Math.floor(100000 + Math.random() * 900000));

        await db.collection('professores').doc(profDoc.id).update({ codigoVerificacao });

        const emailResult = await sendProfessorWelcomeEmail({
            to: targetEmail,
            nome: profData.nome,
            emailLogin: profData.email,
            senhaProvisoria: null,
            codigoVerificacao
        });

        res.json({
            message: emailResult.sent
                ? `Novo código enviado para ${targetEmail}!`
                : `Novo código gerado com sucesso!`,
            codigoSimulado: emailResult.simulated ? codigoVerificacao : undefined
        });
    } catch (error) {
        console.error('Erro ao reenviar código:', error);
        res.status(500).json({ error: 'Erro ao reenviar código' });
    }
};

// Envia código de 6 dígitos para o Gmail do professor ("Esqueci minha senha")
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Informe o seu e-mail (@gmail.com) cadastrado.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const allProfsSnap = await db.collection('professores').get();
        const profDoc = allProfsSnap.docs.find(d => {
            const data = d.data();
            return (
                (data.email || '').toLowerCase() === cleanEmail ||
                (data.emailRecuperacao || '').toLowerCase() === cleanEmail
            );
        });

        if (!profDoc) {
            return res.status(404).json({ error: 'Nenhum professor encontrado com este Gmail de recuperação.' });
        }

        const profData = profDoc.data();
        const targetEmail = profData.emailRecuperacao || profData.email;
        const codigoRecuperacao = String(Math.floor(100000 + Math.random() * 900000));
        const codigoRecuperacaoExpira = Date.now() + 15 * 60 * 1000; // 15 minutos

        await db.collection('professores').doc(profDoc.id).update({
            codigoRecuperacao,
            codigoRecuperacaoExpira
        });

        const emailResult = await sendPasswordResetCodeEmail({
            to: targetEmail,
            nome: profData.nome,
            codigoRecuperacao
        });

        res.json({
            message: emailResult.sent
                ? `Enviamos um código de 6 dígitos para ${targetEmail}!`
                : `Código de recuperação gerado com sucesso!`,
            codigoSimulado: emailResult.simulated ? codigoRecuperacao : undefined
        });
    } catch (error) {
        console.error('Erro em forgotPassword:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação de recuperação de senha' });
    }
};

// Redefine a senha do professor validando o código de 6 dígitos enviado ao Gmail
const resetPassword = async (req, res) => {
    try {
        const { email, codigo, novaSenha } = req.body;
        if (!email || !codigo || !novaSenha) {
            return res.status(400).json({ error: 'E-mail, código e nova senha são obrigatórios.' });
        }

        if (novaSenha.length < 8 || novaSenha.length > 20 || !/[A-Z]/.test(novaSenha) || !/[!@#$%^&*(),.?":{}|<>\-+=_]/.test(novaSenha)) {
            return res.status(400).json({
                error: 'A nova senha deve ter entre 8 e 20 caracteres, pelo menos 1 letra maiúscula e 1 caractere especial.'
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const allProfsSnap = await db.collection('professores').get();
        const profDoc = allProfsSnap.docs.find(d => {
            const data = d.data();
            return (
                (data.email || '').toLowerCase() === cleanEmail ||
                (data.emailRecuperacao || '').toLowerCase() === cleanEmail
            );
        });

        if (!profDoc) {
            return res.status(404).json({ error: 'Professor não encontrado.' });
        }

        const profData = profDoc.data();
        if (!profData.codigoRecuperacao || String(profData.codigoRecuperacao).trim() !== String(codigo).trim()) {
            return res.status(400).json({ error: 'Código de recuperação inválido.' });
        }

        if (profData.codigoRecuperacaoExpira && Date.now() > profData.codigoRecuperacaoExpira) {
            return res.status(400).json({ error: 'O código expirou. Solicite um novo código.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(novaSenha, salt);

        await db.collection('professores').doc(profDoc.id).update({
            senha: hashedPassword,
            codigoRecuperacao: null,
            codigoRecuperacaoExpira: null,
            emailVerificado: true,
            codigoVerificacao: null
        });

        res.json({ message: 'Senha alterada com sucesso! Agora você já pode fazer login.' });
    } catch (error) {
        console.error('Erro em resetPassword:', error);
        res.status(500).json({ error: 'Erro ao redefinir a senha' });
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
        res.json({ valido: true, usuario: { id: aluno.id, rm: d.rm, nome: d.nome, salaId: d.salaId, salaNome: d.salaNome, tipo: 'aluno', tituloAtual: d.tituloAtual, bordaAtual: d.bordaAtual, iconeAtual: d.iconeAtual } });
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
};

module.exports = { login, verifyToken, resendVerificationCode, forgotPassword, resetPassword };
