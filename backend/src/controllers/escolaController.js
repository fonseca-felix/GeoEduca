const { db } = require('../../firebase/firebase-admin');
const bcrypt = require('bcryptjs');
const { sendProfessorWelcomeEmail } = require('../services/emailService');

const escolaController = {
  // Cria um novo professor vinculado à escola e envia o código de 6 dígitos para o Gmail
  createProfessor: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(cleanEmail)) {
        return res.status(400).json({
          error: 'Informe um e-mail válido do Gmail (@gmail.com) para envio do código e recuperação de senha.'
        });
      }

      if (senha.length < 8 || senha.length > 20 || !/[A-Z]/.test(senha) || !/[!@#$%^&*(),.?":{}|<>\-+=_]/.test(senha)) {
        return res.status(400).json({
          error: 'A senha deve ter entre 8 e 20 caracteres, pelo menos 1 letra maiúscula e 1 caractere especial.'
        });
      }

      // Check if email already exists
      const allProfsSnap = await db.collection('professores').get();
      const emailExists = allProfsSnap.docs.some(doc => {
        const d = doc.data();
        return (d.email || '').toLowerCase() === cleanEmail || (d.emailRecuperacao || '').toLowerCase() === cleanEmail;
      });
      if (emailExists) {
        return res.status(400).json({ error: 'Este Gmail já está cadastrado para outro professor.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senha, salt);
      const codigoVerificacao = String(Math.floor(100000 + Math.random() * 900000));

      const novoProf = {
        nome: nome.trim(),
        email: cleanEmail,
        emailRecuperacao: cleanEmail,
        senha: hashedPassword,
        escolaId,
        emailVerificado: false,
        codigoVerificacao,
        criadoEm: new Date().toISOString(),
      };

      const docRef = await db.collection('professores').add(novoProf);

      let emailResult = { sent: false };
      try {
        emailResult = await sendProfessorWelcomeEmail({
          to: cleanEmail,
          nome: nome.trim(),
          emailLogin: cleanEmail,
          senhaProvisoria: senha,
          codigoVerificacao
        });
      } catch (mailErr) {
        console.error('Erro ao enviar e-mail de boas-vindas ao professor:', mailErr.message);
      }

      res.status(201).json({
        id: docRef.id,
        emailSent: !!emailResult.sent,
        codigoSimulado: emailResult.simulated ? codigoVerificacao : undefined,
        message: emailResult.sent
          ? `Professor cadastrado! Credenciais e código enviados para ${cleanEmail}.`
          : `Professor cadastrado! (Aviso: configure EMAIL_USER e EMAIL_PASS no servidor para envio automático ao Gmail. Código gerado: ${codigoVerificacao})`
      });
    } catch (error) {
      console.error('Erro ao criar professor:', error);
      res.status(500).json({ error: 'Erro ao criar professor' });
    }
  },

  // Atualiza o Gmail de recuperação de um professor existente e reenvia código se solicitado
  updateProfessorEmail: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const profId = req.params.id;
      const { emailRecuperacao } = req.body;

      if (!emailRecuperacao || !/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(emailRecuperacao.trim())) {
        return res.status(400).json({ error: 'Informe um endereço @gmail.com válido.' });
      }

      const cleanEmail = emailRecuperacao.trim().toLowerCase();
      const profDoc = await db.collection('professores').doc(profId).get();
      const profEscolaId = profDoc.exists ? (profDoc.data().escolaId || 'escola_ce399') : null;
      if (!profDoc.exists || profEscolaId !== escolaId) {
        return res.status(404).json({ error: 'Professor não encontrado' });
      }

      const codigoVerificacao = String(Math.floor(100000 + Math.random() * 900000));
      const profData = profDoc.data();

      await db.collection('professores').doc(profId).update({
        emailRecuperacao: cleanEmail,
        codigoVerificacao
      });

      let emailResult = { sent: false };
      try {
        emailResult = await sendProfessorWelcomeEmail({
          to: cleanEmail,
          nome: profData.nome,
          emailLogin: profData.email,
          senhaProvisoria: null,
          codigoVerificacao
        });
      } catch (mailErr) {
        console.error('Erro ao enviar e-mail de vinculação:', mailErr.message);
      }

      res.json({
        message: emailResult.sent
          ? `Gmail de recuperação (${cleanEmail}) vinculado e e-mail enviado com sucesso!`
          : `Gmail de recuperação (${cleanEmail}) salvo!`,
        emailRecuperacao: cleanEmail
      });
    } catch (error) {
      console.error('Erro ao atualizar Gmail do professor:', error);
      res.status(500).json({ error: 'Erro ao atualizar Gmail do professor' });
    }
  },

  // Lista os professores da escola
  getProfessores: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const [allProfsSnap, alunosSnap, provasSnap] = await Promise.all([
        db.collection('professores').get(),
        db.collection('alunos').get(),
        db.collection('provas').get()
      ]);

      const profDocs = allProfsSnap.docs.filter(d => {
        const pEscId = d.data().escolaId || 'escola_ce399';
        return pEscId === escolaId;
      });

      const singleProf = profDocs.length === 1;
      const professores = profDocs.map(doc => {
        const data = doc.data();
        const alunosCount = singleProf
          ? alunosSnap.size
          : alunosSnap.docs.filter(a => a.data().profId === doc.id).length;
        const provasCount = singleProf
          ? provasSnap.size
          : provasSnap.docs.filter(p => p.data().profId === doc.id).length;

        return {
          id: doc.id,
          nome: data.nome,
          email: data.email,
          emailRecuperacao: data.emailRecuperacao || (data.email && data.email.endsWith('@gmail.com') ? data.email : null),
          emailVerificado: data.emailVerificado !== false,
          criadoEm: data.criadoEm,
          totalAlunos: alunosCount,
          totalProvas: provasCount
        };
      });

      res.json(professores);
    } catch (error) {
      console.error('Erro ao listar professores:', error);
      res.status(500).json({ error: 'Erro ao listar professores' });
    }
  },

  // Estatísticas da Escola
  getStats: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const [allProfsSnap, alunosSnap, provasSnap] = await Promise.all([
        db.collection('professores').get(),
        db.collection('alunos').get(),
        db.collection('provas').get()
      ]);

      const profDocs = allProfsSnap.docs.filter(d => (d.data().escolaId || 'escola_ce399') === escolaId);

      res.json({
        totalProfessores: profDocs.length,
        totalAlunos: alunosSnap.size,
        totalProvas: provasSnap.size
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas da escola:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  },
  
  // Detalhes do professor (usado pela Escola)
  getProfessorDetalhes: async (req, res) => {
      try {
        const escolaId = req.user.id;
        const profId = req.params.id;
        
        const profDoc = await db.collection('professores').doc(profId).get();
        const profEscolaId = profDoc.exists ? (profDoc.data().escolaId || 'escola_ce399') : null;
        if (!profDoc.exists || profEscolaId !== escolaId) {
            return res.status(404).json({ error: 'Professor não encontrado ou não pertence a esta escola' });
        }
        
        const data = profDoc.data();
        const [alunosSnap, provasSnap, salasSnap, atividadesSnap, quizzesSnap] = await Promise.all([
            db.collection('alunos').get(),
            db.collection('provas').get(),
            db.collection('salas').get(),
            db.collection('atividades').get(),
            db.collection('quizzes').get()
        ]);
        
        const alunos = [];
        alunosSnap.forEach(a => alunos.push({ id: a.id, ...a.data() }));
        
        const provas = [];
        provasSnap.forEach(p => provas.push({ id: p.id, ...p.data() }));
        
        const salas = [];
        salasSnap.forEach(s => salas.push({ id: s.id, ...s.data() }));
        
        res.json({
            id: profDoc.id,
            nome: data.nome,
            email: data.email,
            emailRecuperacao: data.emailRecuperacao || (data.email && data.email.endsWith('@gmail.com') ? data.email : ''),
            emailVerificado: data.emailVerificado !== false,
            totalAlunos: alunos.length,
            totalProvas: provas.length,
            totalAtividades: atividadesSnap.size + quizzesSnap.size,
            alunos,
            provas,
            salas
        });
        
      } catch (error) {
        console.error('Erro ao buscar detalhes do professor:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes' });
      }
  }
};

module.exports = escolaController;
