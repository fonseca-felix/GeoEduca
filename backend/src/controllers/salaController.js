const { supabase } = require('../../supabase/client');

const listarSalas = async (req, res) => {
    try {
        const { data: salas, error } = await supabase.from('salas').select('*');
        if (error) throw error;
        res.json(salas || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar salas' });
    }
};

const buscarSala = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: sala, error } = await supabase.from('salas').select('*').eq('id', id).single();
        if (error || !sala) return res.status(404).json({ error: 'Sala não encontrada' });
        res.json(sala);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar sala' });
    }
};

const criarSala = async (req, res) => {
    try {
        const { nome, serie, turma } = req.body;
        if (!nome || !serie || !turma) {
            return res.status(400).json({ error: 'Nome, série e turma são obrigatórios' });
        }
        
        const profId = req.user.id;
        const novaSala = { nome, serie, turma, profId };
        
        const { data: docRef, error } = await supabase.from('salas').insert([novaSala]).select().single();
        if (error) throw error;
        
        res.status(201).json(docRef);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar sala' });
    }
};

const atualizarSala = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, serie, turma } = req.body;

        const { data: sala, error: salaErr } = await supabase.from('salas').select('id').eq('id', id).single();
        if (salaErr || !sala) return res.status(404).json({ error: 'Sala não encontrada' });

        const updates = {};
        if (nome) updates.nome = nome;
        if (serie) updates.serie = serie;
        if (turma) updates.turma = turma;

        const { error } = await supabase.from('salas').update(updates).eq('id', id);
        if (error) throw error;
        
        res.json({ message: 'Sala atualizada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar sala' });
    }
};

const removerSala = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: sala, error: salaErr } = await supabase.from('salas').select('id').eq('id', id).single();
        if (salaErr || !sala) return res.status(404).json({ error: 'Sala não encontrada' });

        const { data: alunos } = await supabase.from('alunos').select('id').eq('salaId', id).limit(1);
        if (alunos && alunos.length > 0) {
            return res.status(400).json({ error: 'Não é possível remover sala com alunos. Remova os alunos primeiro.' });
        }

        const { error } = await supabase.from('salas').delete().eq('id', id);
        if (error) throw error;
        
        res.json({ message: 'Sala removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover sala' });
    }
};

module.exports = { listarSalas, buscarSala, criarSala, atualizarSala, removerSala };
