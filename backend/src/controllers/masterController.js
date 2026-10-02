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

      // Check if email already exists
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

  // Lista todas as escolas
  getEscolas: async (req, res) => {
    try {
      const snapshot = await db.collection('escolas').get();
      const escolas = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        escolas.push({
          id: doc.id,
          nome: data.nome,
          email: data.email,
          criadoEm: data.criadoEm
        });
      });

      res.json(escolas);
    } catch (error) {
      console.error('Erro ao listar escolas:', error);
      res.status(500).json({ error: 'Erro ao listar escolas' });
    }
  },

  // Estatísticas Globais
  getStats: async (req, res) => {
    try {
      // Get counts for each collection
      const escolasSnap = await db.collection('escolas').count().get();
      const profSnap = await db.collection('professores').count().get();
      const alunosSnap = await db.collection('alunos').count().get();
      const provasSnap = await db.collection('provas').count().get();
      
      res.json({
        totalEscolas: escolasSnap.data().count,
        totalProfessores: profSnap.data().count,
        totalAlunos: alunosSnap.data().count,
        totalProvas: provasSnap.data().count,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas globais:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas globais' });
    }
  }
};

module.exports = masterController;
