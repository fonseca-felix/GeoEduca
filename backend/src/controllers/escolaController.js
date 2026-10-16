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

      if (senha.length < 8 || senha.length > 20 || !/[A-Z]/.test(senha) || !/[!@#$%^&*(),.?":{}|<>\-+=_]/.test(senha)) {
        return res.status(400).json({
          error: 'A senha deve ter entre 8 e 20 caracteres, pelo menos 1 letra maiúscula e 1 caractere especial.'
        });
      }

      // Check if email already exists
      const profSnap = await db.collection('professores').where('email', '==', email).limit(1).get();
      if (!profSnap.empty) {
        return res.status(400).json({ error: 'Email já cadastrado para outro professor' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senha, salt);

      const novoProf = {
        nome,
        email,
        senha: hashedPassword,
        escolaId,
        criadoEm: new Date().toISOString(),
      };

      const docRef = await db.collection('professores').add(novoProf);

      res.status(201).json({ id: docRef.id, message: 'Professor cadastrado com sucesso' });
    } catch (error) {
      console.error('Erro ao criar professor:', error);
      res.status(500).json({ error: 'Erro ao criar professor' });
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
