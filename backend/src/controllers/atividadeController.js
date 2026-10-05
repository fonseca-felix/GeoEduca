const { supabase } = require('../../supabase/client');

const listarAtividades = async (req, res) => {
    try {
        const { data: atividades, error } = await supabase
            .from('atividades')
            .select('*');
            
        if (error) throw error;
        res.json(atividades || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar atividades' });
    }
};

const listarMinhasAtividades = async (req, res) => {
    try {
        const alunoId = req.user.id;
        
        const { data: alunoDoc, error: alunoErr } = await supabase
            .from('alunos')
            .select('salaId')
            .eq('id', alunoId)
            .single();
            
        if (alunoErr || !alunoDoc) return res.status(404).json({ error: 'Aluno não encontrado' });

        const { salaId } = alunoDoc;
        const { data: enviadas, error: envErr } = await supabase
            .from('atividades_enviadas')
            .select(`
                id,
                atividadeId,
                dataLimite,
                createdAt,
                atividades (titulo, tipo, imagem, link, descricao)
            `)
            .eq('salaId', salaId);
            
        if (envErr) throw envErr;

        const atividades = [];
        for (const data of (enviadas || [])) {
            if (!data.atividades) continue;

            const { data: visualizacao } = await supabase
                .from('visualizacoes_atividades')
                .select('id')
                .eq('atividadeEnviadaId', data.id)
                .eq('alunoId', alunoId)
                .limit(1);

            atividades.push({
                id: data.id, 
                atividadeId: data.atividadeId,
                titulo: data.atividades.titulo, 
                tipo: data.atividades.tipo,
                imagem: data.atividades.imagem, 
                link: data.atividades.link,
                descricao: data.atividades.descricao, 
                dataLimite: data.dataLimite,
                visualizado: visualizacao && visualizacao.length > 0, 
                createdAt: data.createdAt
            });
        }

        res.json(atividades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar atividades do aluno' });
    }
};

const criarAtividade = async (req, res) => {
    try {
        const { titulo, tipo, imagem, link, descricao } = req.body;
        if (!titulo || !tipo || !link) {
            return res.status(400).json({ error: 'Título, tipo e link são obrigatórios' });
        }
        const novaAtividade = {
            titulo, tipo,
            imagem: imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
            link, descricao: descricao || ''
        };
        const { data, error } = await supabase.from('atividades').insert([novaAtividade]).select().single();
        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar atividade' });
    }
};

const enviarAtividade = async (req, res) => {
    try {
        const { salaId, atividadeId, dataLimite } = req.body;
        if (!salaId || !atividadeId) {
            return res.status(400).json({ error: 'Sala e atividade são obrigatórios' });
        }
        const professorId = req.user.id;

        const { data: sala, error: salaErr } = await supabase.from('salas').select('id').eq('id', salaId).single();
        if (salaErr || !sala) return res.status(404).json({ error: 'Sala não encontrada' });

        const { data: atividade, error: ativErr } = await supabase.from('atividades').select('titulo').eq('id', atividadeId).single();
        if (ativErr || !atividade) return res.status(404).json({ error: 'Atividade não encontrada' });

        const envio = { salaId, atividadeId, dataLimite: dataLimite || null, professorId, visualizado: false };
        const { data, error } = await supabase.from('atividades_enviadas').insert([envio]).select().single();
        if (error) throw error;

        const { data: alunos } = await supabase.from('alunos').select('id').eq('salaId', salaId);
        if (alunos && alunos.length > 0) {
            const notificacoes = alunos.map(alunoDoc => ({
                alunoId: alunoDoc.id,
                titulo: 'Nova atividade disponível!',
                mensagem: `A atividade "${atividade.titulo}" foi disponibilizada para sua turma.`,
                tipo: 'atividade', 
                lida: false
            }));
            await supabase.from('notificacoes').insert(notificacoes);
        }

        res.status(201).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao enviar atividade' });
    }
};

const visualizarAtividade = async (req, res) => {
    try {
        const { atividadeEnviadaId } = req.params;
        const alunoId = req.user.id;

        const { data: atividadeEnviada, error: envErr } = await supabase
            .from('atividades_enviadas').select('id').eq('id', atividadeEnviadaId).single();
            
        if (envErr || !atividadeEnviada) return res.status(404).json({ error: 'Atividade não encontrada' });

        const { data: visualizacaoExistente } = await supabase
            .from('visualizacoes_atividades')
            .select('id')
            .eq('atividadeEnviadaId', atividadeEnviadaId)
            .eq('alunoId', alunoId).limit(1);

        if (visualizacaoExistente && visualizacaoExistente.length > 0) {
             return res.status(400).json({ error: 'Atividade já visualizada' });
        }

        await supabase.from('visualizacoes_atividades').insert([{
            atividadeEnviadaId, alunoId
        }]);

        res.json({ message: 'Atividade marcada como visualizada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar visualização' });
    }
};

const atualizarAtividade = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, tipo, imagem, link, descricao } = req.body;

        const { data: atividade, error: ativErr } = await supabase.from('atividades').select('id').eq('id', id).single();
        if (ativErr || !atividade) return res.status(404).json({ error: 'Atividade não encontrada' });

        const updates = {};
        if (titulo) updates.titulo = titulo;
        if (tipo) updates.tipo = tipo;
        if (imagem) updates.imagem = imagem;
        if (link) updates.link = link;
        if (descricao !== undefined) updates.descricao = descricao;

        const { error } = await supabase.from('atividades').update(updates).eq('id', id);
        if (error) throw error;
        
        res.json({ message: 'Atividade atualizada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar atividade' });
    }
};

const removerAtividade = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: atividade, error: ativErr } = await supabase.from('atividades').select('id').eq('id', id).single();
        if (ativErr || !atividade) return res.status(404).json({ error: 'Atividade não encontrada' });
        
        const { error } = await supabase.from('atividades').delete().eq('id', id);
        if (error) throw error;
        
        res.json({ message: 'Atividade removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover atividade' });
    }
};

module.exports = { listarAtividades, listarMinhasAtividades, criarAtividade, enviarAtividade, visualizarAtividade, atualizarAtividade, removerAtividade };
