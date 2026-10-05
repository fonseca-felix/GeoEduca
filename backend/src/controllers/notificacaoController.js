const { supabase } = require('../../supabase/client');

const listarNotificacoes = async (req, res) => {
    try {
        const alunoId = req.user.id;
        const { data: notificacoes, error } = await supabase
            .from('notificacoes')
            .select('*')
            .eq('alunoId', alunoId)
            .order('data', { ascending: false });
            
        if (error) throw error;
        res.json(notificacoes || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar notificações' });
    }
};

const contarNaoLidas = async (req, res) => {
    try {
        const alunoId = req.user.id;
        const { count, error } = await supabase
            .from('notificacoes')
            .select('*', { count: 'exact', head: true })
            .eq('alunoId', alunoId)
            .eq('lida', false);
            
        if (error) throw error;
        res.json({ total: count || 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao contar notificações não lidas' });
    }
};

const marcarComoLida = async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;

        const { data: notificacao, error: notifErr } = await supabase.from('notificacoes').select('*').eq('id', id).single();
        if (notifErr || !notificacao) return res.status(404).json({ error: 'Notificação não encontrada' });
        if (notificacao.alunoId !== alunoId) return res.status(403).json({ error: 'Acesso negado' });

        const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
        if (error) throw error;
        
        res.json({ message: 'Notificação marcada como lida' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
    }
};

const marcarTodasComoLidas = async (req, res) => {
    try {
        const alunoId = req.user.id;
        const { error } = await supabase
            .from('notificacoes')
            .update({ lida: true })
            .eq('alunoId', alunoId)
            .eq('lida', false);

        if (error) throw error;
        res.json({ message: 'Notificações marcadas como lidas' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao marcar notificações como lidas' });
    }
};

const removerNotificacao = async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.user.id;

        const { data: notificacao, error: notifErr } = await supabase.from('notificacoes').select('*').eq('id', id).single();
        if (notifErr || !notificacao) return res.status(404).json({ error: 'Notificação não encontrada' });
        if (notificacao.alunoId !== alunoId) return res.status(403).json({ error: 'Acesso negado' });

        const { error } = await supabase.from('notificacoes').delete().eq('id', id);
        if (error) throw error;
        
        res.json({ message: 'Notificação removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover notificação' });
    }
};

module.exports = { listarNotificacoes, contarNaoLidas, marcarComoLida, marcarTodasComoLidas, removerNotificacao };
