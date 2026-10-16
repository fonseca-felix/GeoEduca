const { db } = require('../../firebase/firebase-admin');
const bcrypt = require('bcryptjs');

const masterController = {
  // Cria uma nova escola
  createEscola: async (req, res) => {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      const escolaSnap = await db.collection('escolas').where('email', '==', email).limit(1).get();
      if (!escolaSnap.empty) {
        return res.status(400).json({ error: 'Email já cadastrado para outra escola' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senha, salt);

      const novaEscola = {
        nome,
        email,
        senha: hashedPassword,
        criadoEm: new Date().toISOString(),
      };

      const docRef = await db.collection('escolas').add(novaEscola);

      res.status(201).json({ id: docRef.id, message: 'Escola cadastrada com sucesso' });
    } catch (error) {
      console.error('Erro ao criar escola:', error);
      res.status(500).json({ error: 'Erro ao criar escola' });
    }
  },

  // Lista todas as escolas com contagem de professores, alunos e salas
  getEscolas: async (req, res) => {
    try {
      const [escolasSnap, profSnap, alunosSnap, salasSnap] = await Promise.all([
        db.collection('escolas').get(),
        db.collection('professores').get(),
        db.collection('alunos').get(),
        db.collection('salas').get()
      ]);

      const profsPorEscola = {};
      profSnap.forEach(doc => {
        const d = doc.data();
        const escId = d.escolaId || 'escola_ce399';
        profsPorEscola[escId] = (profsPorEscola[escId] || 0) + 1;
      });

      const escolas = [];
      escolasSnap.forEach(doc => {
        const data = doc.data();
        const isDefault = doc.id === 'escola_ce399' || escolasSnap.size === 1;
        escolas.push({
          id: doc.id,
          nome: data.nome || 'Escola',
          email: data.email || '-',
          criadoEm: data.criadoEm || null,
          totalProfessores: profsPorEscola[doc.id] || 0,
          totalAlunos: isDefault ? alunosSnap.size : 0,
          totalSalas: isDefault ? salasSnap.size : 0
        });
      });

      // Fallback caso a coleção esteja vazia
      if (escolas.length === 0) {
        escolas.push({
          id: 'escola_ce399',
          nome: 'CE399 SESI',
          email: 'CE399 SESI',
          criadoEm: new Date().toISOString(),
          totalProfessores: profSnap.size,
          totalAlunos: alunosSnap.size,
          totalSalas: salasSnap.size
        });
      }

      res.json(escolas);
    } catch (error) {
      console.error('Erro ao listar escolas:', error);
      res.status(500).json({ error: 'Erro ao listar escolas' });
    }
  },

  // Remove uma escola
  deleteEscola: async (req, res) => {
    try {
      const { id } = req.params;
      if (id === 'escola_ce399') {
        return res.status(400).json({ error: 'A escola principal padrão não pode ser removida.' });
      }
      await db.collection('escolas').doc(id).delete();
      res.json({ message: 'Escola removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover escola:', error);
      res.status(500).json({ error: 'Erro ao remover escola' });
    }
  },

  // Estatísticas Globais
  getStats: async (req, res) => {
    try {
      const [escolasSnap, profSnap, alunosSnap, provasSnap, salasSnap, quizzesSnap, atividadesSnap] = await Promise.all([
        db.collection('escolas').get(),
        db.collection('professores').get(),
        db.collection('alunos').get(),
        db.collection('provas').get(),
        db.collection('salas').get(),
        db.collection('quizzes').get(),
        db.collection('atividades').get()
      ]);

      res.json({
        totalEscolas: Math.max(1, escolasSnap.size),
        totalProfessores: profSnap.size,
        totalAlunos: alunosSnap.size,
        totalProvas: provasSnap.size,
        totalSalas: salasSnap.size,
        totalQuizzes: quizzesSnap.size,
        totalAtividades: atividadesSnap.size
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas globais:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas globais' });
    }
  }
};

module.exports = masterController;
