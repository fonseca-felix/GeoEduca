const { supabase } = require('../../supabase/client');
const bcrypt = require('bcryptjs');

const escolaController = {
  createProfessor: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      const { data: profSnap, error: profErr } = await supabase
        .from('professores')
        .select('id')
        .eq('email', email)
        .limit(1);

      if (profSnap && profSnap.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado para outro professor' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senha, salt);

      const novoProf = {
        nome,
        email,
        senha: hashedPassword,
        escolaId
      };

      const { data, error } = await supabase
        .from('professores')
        .insert([novoProf])
        .select();

      if (error) throw error;

      res.status(201).json({ id: data[0].id, message: 'Professor cadastrado com sucesso' });
    } catch (error) {
      console.error('Erro ao criar professor:', error);
      res.status(500).json({ error: 'Erro ao criar professor' });
    }
  },

  getProfessores: async (req, res) => {
    try {
      const escolaId = req.user.id;
      
      const { data: professoresSnap, error: profErr } = await supabase
        .from('professores')
        .select('*')
        .eq('escolaId', escolaId);
        
      if (profErr) throw profErr;

      const professores = [];
      
      for (let prof of professoresSnap) {
        const { count: countAlunos, error: errA } = await supabase
          .from('alunos')
          .select('*', { count: 'exact', head: true })
          .eq('profId', prof.id);
          
        const { count: countProvas, error: errP } = await supabase
          .from('provas')
          .select('*', { count: 'exact', head: true })
          .eq('profId', prof.id);
          
        professores.push({
          id: prof.id,
          nome: prof.nome,
          email: prof.email,
          criadoEm: prof.criadoEm,
          totalAlunos: countAlunos || 0,
          totalProvas: countProvas || 0
        });
      }

      res.json(professores);
    } catch (error) {
      console.error('Erro ao listar professores:', error);
      res.status(500).json({ error: 'Erro ao listar professores' });
    }
  },

  getStats: async (req, res) => {
    try {
      const escolaId = req.user.id;
      
      const { data: profSnap, error: profErr } = await supabase
        .from('professores')
        .select('id')
        .eq('escolaId', escolaId);
        
      if (profErr) throw profErr;
      
      const totalProfessores = profSnap ? profSnap.length : 0;
      let totalAlunos = 0;
      let totalProvas = 0;

      for (let prof of profSnap) {
        const { count: cA } = await supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('profId', prof.id);
        const { count: cP } = await supabase.from('provas').select('*', { count: 'exact', head: true }).eq('profId', prof.id);
        totalAlunos += cA || 0;
        totalProvas += cP || 0;
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
  
  getProfessorDetalhes: async (req, res) => {
      try {
        const escolaId = req.user.id;
        const profId = req.params.id;
        
        const { data: profDoc, error } = await supabase
          .from('professores')
          .select('*')
          .eq('id', profId)
          .single();
          
        if(error || !profDoc || profDoc.escolaId !== escolaId) {
            return res.status(404).json({error: 'Professor não encontrado ou não pertence a esta escola'});
        }
        
        const { data: alunos } = await supabase.from('alunos').select('*').eq('profId', profId);
        const { data: provas } = await supabase.from('provas').select('*').eq('profId', profId);
        const { data: salas } = await supabase.from('salas').select('*').eq('profId', profId);
        
        res.json({
            id: profDoc.id,
            nome: profDoc.nome,
            email: profDoc.email,
            alunos: alunos || [],
            provas: provas || [],
            salas: salas || []
        });
        
      } catch (error) {
        console.error('Erro ao buscar detalhes do professor:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes' });
      }
  }
};

module.exports = escolaController;
