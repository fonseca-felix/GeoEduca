const { supabase } = require('../../supabase/client');

const listarProvas = async (req, res) => {
    try {
        const { data: provasDb, error } = await supabase.from('provas').select('*');
        if (error) throw error;
        
        const provas = [];
        for (const p of (provasDb || [])) {
            const { data: questoes } = await supabase.from('prova_questoes').select('*').eq('provaId', p.id);
            provas.push({ ...p, questoes: questoes || [] });
        }
        res.json(provas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar provas' });
    }
};

const criarProva = async (req, res) => {
    try {
        const { titulo, imagem, rubrica, questoes } = req.body;
        if (!titulo || !questoes?.length) return res.status(400).json({ error: 'Título e questões são obrigatórios' });

        const profId = req.user.id;
        
        const novaProva = {
            titulo, imagem: imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
            rubrica: rubrica || '', profId
        };
        
        const { data: provaRef, error } = await supabase.from('provas').insert([novaProva]).select().single();
        if (error) throw error;
        
        const questoesData = questoes.map(q => ({
            provaId: provaRef.id, texto: q.texto, tipo: q.tipo,
            opcoes: q.opcoes || null, correta: q.correta !== undefined ? q.correta : null, valor: q.valor || 5
        }));
        
        await supabase.from('prova_questoes').insert(questoesData);
        
        res.status(201).json({ id: provaRef.id, ...novaProva, questoes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar prova' });
    }
};

const responderProva = async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;
        const { respostas } = req.body;

        if (!respostas || !Array.isArray(respostas)) return res.status(400).json({ error: 'Respostas são obrigatórias' });

        const { data: prova, error: provaErr } = await supabase.from('provas').select('id').eq('id', id).single();
        if (provaErr || !prova) return res.status(404).json({ error: 'Prova não encontrada' });

        const { data: respostaExistente } = await supabase.from('prova_respostas')
            .select('id').eq('provaId', id).eq('alunoId', alunoId).limit(1);
            
        if (respostaExistente && respostaExistente.length > 0) return res.status(400).json({ error: 'Prova já respondida' });

        const { error } = await supabase.from('prova_respostas').insert([{
            provaId: id, alunoId, respostas, status: 'pendente'
        }]);
        if (error) throw error;

        res.status(201).json({ message: 'Prova enviada com sucesso! Aguarde a correção do professor.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao enviar respostas da prova' });
    }
};

const corrigirProva = async (req, res) => {
    try {
        const { respostaId } = req.params;
        const { nota, feedback } = req.body;

        const { data: resposta, error: respErr } = await supabase.from('prova_respostas').select('id').eq('id', respostaId).single();
        if (respErr || !resposta) return res.status(404).json({ error: 'Resposta não encontrada' });

        const { error } = await supabase.from('prova_respostas').update({ 
            nota: nota || 0, 
            feedback: feedback || '', 
            status: 'corrigida', 
            dataCorrecao: new Date().toISOString() 
        }).eq('id', respostaId);
        
        if (error) throw error;
        
        res.json({ message: 'Prova corrigida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao corrigir prova' });
    }
};

module.exports = { listarProvas, criarProva, responderProva, corrigirProva };
