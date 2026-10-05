const { supabase } = require('../../supabase/client');
const bcrypt = require('bcryptjs');

const masterController = {
  createEscola: async (req, res) => {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      const { data: escolaSnap } = await supabase
        .from('escolas')
        .select('id')
        .eq('email', email)
        .limit(1);
        
      if (escolaSnap && escolaSnap.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado para outra escola' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senha, salt);

      const novaEscola = {
        nome,
        email,
        senha: hashedPassword
      };

      const { data, error } = await supabase
        .from('escolas')
        .insert([novaEscola])
        .select();

      if (error) throw error;

      res.status(201).json({ id: data[0].id, message: 'Escola cadastrada com sucesso' });
    } catch (error) {
      console.error('Erro ao criar escola:', error);
      res.status(500).json({ error: 'Erro ao criar escola' });
    }
  },

  getEscolas: async (req, res) => {
    try {
      const { data: escolas, error } = await supabase
        .from('escolas')
        .select('id, nome, email, criadoEm');
        
      if (error) throw error;

      res.json(escolas || []);
    } catch (error) {
      console.error('Erro ao listar escolas:', error);
      res.status(500).json({ error: 'Erro ao listar escolas' });
    }
  },

  getStats: async (req, res) => {
    try {
      const { count: totalEscolas } = await supabase.from('escolas').select('*', { count: 'exact', head: true });
      const { count: totalProfessores } = await supabase.from('professores').select('*', { count: 'exact', head: true });
      const { count: totalAlunos } = await supabase.from('alunos').select('*', { count: 'exact', head: true });
      const { count: totalProvas } = await supabase.from('provas').select('*', { count: 'exact', head: true });
      
      res.json({
        totalEscolas: totalEscolas || 0,
        totalProfessores: totalProfessores || 0,
        totalAlunos: totalAlunos || 0,
        totalProvas: totalProvas || 0,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas globais:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas globais' });
    }
  }
};

module.exports = masterController;
