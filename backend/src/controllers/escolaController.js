const { db } = require('../../firebase/firebase-admin');
const bcrypt = require('bcryptjs');

const escolaController = {
  // Cria um novo professor vinculado à escola
  createProfessor: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
          error: 'Informe um endereço de e-mail válido.'
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
        return (d.email || '').toLowerCase() === cleanEmail;
      });
      if (emailExists) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado para outro professor.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senha, salt);

      const novoProf = {
        nome: nome.trim(),
        email: cleanEmail,
        senha: hashedPassword,
        escolaId,
        emailVerificado: true,
        criadoEm: new Date().toISOString(),
      };

      const docRef = await db.collection('professores').add(novoProf);

      res.status(201).json({
        id: docRef.id,
        message: 'Professor cadastrado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao criar professor:', error);
      res.status(500).json({ error: 'Erro ao criar professor' });
    }
  },

  // Redefine a senha do professor diretamente pela coordenação da escola
  resetProfessorPassword: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const profId = req.params.id;
      const { novaSenha } = req.body;

      if (!novaSenha) {
        return res.status(400).json({ error: 'A nova senha é obrigatória.' });
      }

      if (novaSenha.length < 8 || novaSenha.length > 20 || !/[A-Z]/.test(novaSenha) || !/[!@#$%^&*(),.?":{}|<>\-+=_]/.test(novaSenha)) {
        return res.status(400).json({
          error: 'A nova senha deve ter entre 8 e 20 caracteres, pelo menos 1 letra maiúscula e 1 caractere especial.'
        });
      }

      const profDoc = await db.collection('professores').doc(profId).get();
      if (!profDoc.exists) {
        return res.status(404).json({ error: 'Professor não encontrado.' });
      }

      const profEscolaId = profDoc.data().escolaId || 'escola_ce399';
      if (profEscolaId !== escolaId) {
        return res.status(403).json({ error: 'Acesso negado: Este professor não pertence à sua escola.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(novaSenha, salt);

      await db.collection('professores').doc(profId).update({
        senha: hashedPassword,
        emailVerificado: true,
        codigoVerificacao: null,
        codigoRecuperacao: null
      });

      res.json({ message: 'Senha do professor redefinida com sucesso!' });
    } catch (error) {
      console.error('Erro ao redefinir senha do professor:', error);
      res.status(500).json({ error: 'Erro ao redefinir senha do professor' });
    }
  },

  // Atualiza o email de um professor existente
  updateProfessorEmail: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const profId = req.params.id;
      const { emailRecuperacao } = req.body;

      if (!emailRecuperacao || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRecuperacao.trim())) {
        return res.status(400).json({ error: 'Informe um endereço de e-mail válido.' });
      }

      const cleanEmail = emailRecuperacao.trim().toLowerCase();
      const profDoc = await db.collection('professores').doc(profId).get();
      const profEscolaId = profDoc.exists ? (profDoc.data().escolaId || 'escola_ce399') : null;
      if (!profDoc.exists || profEscolaId !== escolaId) {
        return res.status(404).json({ error: 'Professor não encontrado' });
      }

      await db.collection('professores').doc(profId).update({
        emailRecuperacao: cleanEmail,
        email: cleanEmail
      });

      res.json({
        message: `E-mail atualizado com sucesso!`,
        email: cleanEmail
      });
    } catch (error) {
      console.error('Erro ao atualizar e-mail do professor:', error);
      res.status(500).json({ error: 'Erro ao atualizar e-mail do professor' });
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
          emailRecuperacao: data.emailRecuperacao || data.email,
          emailVerificado: true,
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
            emailVerificado: true,
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
