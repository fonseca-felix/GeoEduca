const { supabase } = require('../../supabase/client');

const listarJogos = async (req, res) => {
    try {
        const { data: jogos, error } = await supabase.from('jogos').select('*');
        if (error) throw error;
        res.json(jogos || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar jogos' });
    }
};

const criarJogo = async (req, res) => {
    try {
        const { titulo, descricao, tipo, imagem, link, pontuacaoMaxima } = req.body;
        if (!titulo || !tipo) return res.status(400).json({ error: 'Título e tipo são obrigatórios' });

        const novoJogo = {
            titulo, descricao: descricao || '', tipo,
            imagem: imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
            link: link || '', pontuacaoMaxima: pontuacaoMaxima || 100
        };
        const { data, error } = await supabase.from('jogos').insert([novoJogo]).select().single();
        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar jogo' });
    }
};

const registrarPontuacao = async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;
        const { pontuacao } = req.body;

        if (pontuacao === undefined || pontuacao === null) return res.status(400).json({ error: 'Pontuação é obrigatória' });

        const { data: jogo, error: jogoErr } = await supabase.from('jogos').select('id').eq('id', id).single();
        if (jogoErr || !jogo) return res.status(404).json({ error: 'Jogo não encontrado' });

        const { error } = await supabase.from('jogo_pontuacoes').insert([{ 
            jogoId: id, alunoId, pontuacao: Number(pontuacao) 
        }]);
        if (error) throw error;
        
        res.status(201).json({ message: 'Pontuação registrada com sucesso', pontuacao });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar pontuação' });
    }
};

module.exports = { listarJogos, criarJogo, registrarPontuacao };
