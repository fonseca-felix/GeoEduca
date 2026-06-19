document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
    const user = initPage('aluno');
    if (!user) return;
  
    const btnJogar = document.getElementById('btn-jogar-agora');
    const txtPartidas = document.getElementById('partidas-hoje');
    const avisoLimite = document.getElementById('aviso-limite');
    
    let jogoId = localStorage.getItem('bg_jogo_id');
  
    // Tenta encontrar o jogo BrazilGuessr no banco
    try {
        if (!jogoId || jogoId === 'undefined' || jogoId === 'null') {
            const jogos = await api.get('/jogos');
            const bg = jogos.find(j => j.titulo.toLowerCase().includes('brazilguessr'));
            if (bg) {
                jogoId = bg.id;
                localStorage.setItem('bg_jogo_id', jogoId);
            } else {
                jogoId = 'brazilguessr'; 
            }
        }
    // Busca as estatísticas
        const stats = await api.get(`/jogos/${jogoId}/estatisticas`);
        
        document.getElementById('stat-total').innerText = (stats.total || 0).toLocaleString('pt-BR');
        document.getElementById('stat-semanal').innerText = (stats.semanal || 0).toLocaleString('pt-BR');
        document.getElementById('stat-mensal').innerText = (stats.mensal || 0).toLocaleString('pt-BR');
        document.getElementById('stat-trimestral').innerText = (stats.trimestral || 0).toLocaleString('pt-BR');
        document.getElementById('stat-semestral').innerText = (stats.semestral || 0).toLocaleString('pt-BR');
        document.getElementById('stat-anual').innerText = (stats.anual || 0).toLocaleString('pt-BR');
  
        const partidasMax = stats.limiteDiario || 10;
        let partidasRestantes = partidasMax - (stats.partidasHoje || 0);
        if (partidasRestantes < 0) partidasRestantes = 0;

        txtPartidas.innerText = `Tentativas Restantes: ${partidasRestantes}`;
  
        if (partidasRestantes <= 0) {
            btnJogar.disabled = true;
            btnJogar.style.opacity = '0.5';
            btnJogar.style.cursor = 'not-allowed';
            avisoLimite.style.display = 'block';
        }
  
    } catch (err) {
        console.error('Erro ao buscar estatísticas do BrazilGuessr', err);
        txtPartidas.innerText = `Erro ao carregar dados`;
    }
  
    window.irParaJogo = () => {
        window.location.href = 'play_brazilguessr.html';
    };
});
