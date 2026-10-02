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
      
      const snapshot = await db.collection('professores').where('escolaId', '==', escolaId).get();
      const professores = [];
      
      // Aggregating statistics can be slow if done one-by-one.
      // But for a simple approach, we'll fetch them.
      for (let doc of snapshot.docs) {
        const data = doc.data();
        
        // Count alunos for this professor
        const alunosSnap = await db.collection('alunos').where('profId', '==', doc.id).count().get();
        const provasSnap = await db.collection('provas').where('profId', '==', doc.id).count().get();
        
        professores.push({
          id: doc.id,
          nome: data.nome,
          email: data.email,
          criadoEm: data.criadoEm,
          totalAlunos: alunosSnap.data().count,
          totalProvas: provasSnap.data().count
        });
      }

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
      
      const profSnap = await db.collection('professores').where('escolaId', '==', escolaId).get();
      const totalProfessores = profSnap.size;
      
      let totalAlunos = 0;
      let totalProvas = 0;

      for (let prof of profSnap.docs) {
        const alunos = await db.collection('alunos').where('profId', '==', prof.id).count().get();
        const provas = await db.collection('provas').where('profId', '==', prof.id).count().get();
        totalAlunos += alunos.data().count;
        totalProvas += provas.data().count;
      }

      res.json({
        totalProfessores,
        totalAlunos,
        totalProvas
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
        if(!profDoc.exists || profDoc.data().escolaId !== escolaId) {
            return res.status(404).json({error: 'Professor não encontrado ou não pertence a esta escola'});
        }
        
        const data = profDoc.data();
        
        // Fetch items
        const alunosSnap = await db.collection('alunos').where('profId', '==', profId).get();
        const provasSnap = await db.collection('provas').where('profId', '==', profId).get();
        const salasSnap = await db.collection('salas').where('profId', '==', profId).get();
        
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
