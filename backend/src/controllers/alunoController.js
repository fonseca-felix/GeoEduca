const bcrypt = require('bcryptjs');
const { supabase } = require('../../supabase/client');

const listarAlunos = async (req, res) => {
    try {
        const { data: alunos, error } = await supabase
            .from('alunos')
            .select('id, rm, nome, salaId, salaNome, createdAt');
            
        if (error) throw error;
        res.json(alunos || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar alunos' });
    }
};

const listarAlunosPorSala = async (req, res) => {
    try {
        const { salaId } = req.params;
        const { data: alunos, error } = await supabase
            .from('alunos')
            .select('id, rm, nome, salaId, salaNome')
            .eq('salaId', salaId);
            
        if (error) throw error;
        res.json(alunos || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar alunos da sala' });
    }
};

const buscarAluno = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.tipo === 'aluno' && req.user.id !== id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { data: aluno, error } = await supabase
            .from('alunos')
            .select('id, rm, nome, salaId, salaNome, createdAt')
            .eq('id', id)
            .single();
            
        if (error || !aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

        res.json(aluno);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar aluno' });
    }
};

const criarAluno = async (req, res) => {
    try {
        const { rm, nome, senha, salaId } = req.body;

        if (!rm || !nome || !senha || !salaId) {
            return res.status(400).json({ error: 'RM, nome, senha e sala são obrigatórios' });
        }

        const { data: rmCheck } = await supabase.from('alunos').select('id').eq('rm', rm).limit(1);
        if (rmCheck && rmCheck.length > 0) return res.status(400).json({ error: 'RM já cadastrado' });

        const { data: sala, error: salaErr } = await supabase.from('salas').select('*').eq('id', salaId).single();
        if (salaErr || !sala) return res.status(404).json({ error: 'Sala não encontrada' });

        const hashedPassword = await bcrypt.hash(senha, 10);

        const { data: novoAluno, error } = await supabase
            .from('alunos')
            .insert([{
                rm, nome, senha: hashedPassword, salaId,
                salaNome: sala.nome,
                profId: sala.profId
            }])
            .select()
            .single();
            
        if (error) throw error;

        res.status(201).json({ id: novoAluno.id, rm, nome, salaId, salaNome: sala.nome });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar aluno' });
    }
};

const atualizarAluno = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, senha, salaId } = req.body;

        const { data: aluno, error: alunoErr } = await supabase.from('alunos').select('id').eq('id', id).single();
        if (alunoErr || !aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

        const updates = {};
        if (nome) updates.nome = nome;
        if (senha) updates.senha = await bcrypt.hash(senha, 10);
        if (salaId) {
            const { data: sala, error: salaErr } = await supabase.from('salas').select('*').eq('id', salaId).single();
            if (salaErr || !sala) return res.status(404).json({ error: 'Sala não encontrada' });
            updates.salaId = salaId;
            updates.salaNome = sala.nome;
            updates.profId = sala.profId;
        }

        const { error } = await supabase.from('alunos').update(updates).eq('id', id);
        if (error) throw error;
        
        res.json({ message: 'Aluno atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar aluno' });
    }
};

const removerAluno = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: aluno, error: alunoErr } = await supabase.from('alunos').select('id').eq('id', id).single();
        if (alunoErr || !aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
        
        const { error } = await supabase.from('alunos').delete().eq('id', id);
        if (error) throw error;
        
        res.json({ message: 'Aluno removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover aluno' });
    }
};

module.exports = { listarAlunos, listarAlunosPorSala, buscarAluno, criarAluno, atualizarAluno, removerAluno };
