document.addEventListener('DOMContentLoaded', () => {
    // 1. Injetar a sidebar
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
    
    // 2. Inicializar usuário
    const user = initPage('aluno');
    if (!user) return;

    // 3. Marcar menu ativo
    const menuItems = document.querySelectorAll('.sidebar-nav a');
    menuItems.forEach(item => {
        if (item.getAttribute('href').includes('ranking.html')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    const studentNameEl = document.getElementById('student-name');
    if (studentNameEl && user.nome) {
        studentNameEl.textContent = user.nome.split(' ')[0];
    }

    // Função para recuperar pontos salvos apenas no localStorage (compatibilidade com dashboard)
    function pontosJogosLocal(nomeAluno) {
        let pts = 0;
        try {
            const hist = JSON.parse(localStorage.getItem('geoeduca_results') || '[]');
            hist.forEach(r => {
                if (r.aluno === nomeAluno) pts += Number(r.pontuacao) || 0;
            });
        } catch (e) { /* ignore */ }
        return pts;
    }

    async function getBrazilGuessrPts() {
        let bgJogoId = localStorage.getItem('bg_jogo_id');
        if (!bgJogoId || bgJogoId === 'undefined' || bgJogoId === 'null') {
            try {
                const jogos = await api.get('/jogos');
                const bg = jogos.find(j => j.titulo.toLowerCase().includes('brazilguessr'));
                bgJogoId = bg ? bg.id : 'brazilguessr';
            } catch (e) {
                bgJogoId = 'brazilguessr';
            }
        }
        try {
            const bgStats = await api.get(`/jogos/${bgJogoId}/estatisticas`);
            return bgStats ? (bgStats.total || 0) : 0;
        } catch (e) {
            return 0;
        }
    }

    const tabs = document.querySelectorAll('.ranking-tab');
    const listContainer = document.getElementById('ranking-list');
    
    let cacheTurma = null;
    let cacheGeral = null;
    let localExtras = null; // pts locais + bgPts

    function renderRanking(rankingData) {
        if (!rankingData || rankingData.length === 0) {
            listContainer.innerHTML = `
                <li style="padding: 32px; text-align: center; color: var(--color-text-muted);">
                    Nenhuma pontuação encontrada.
                </li>
            `;
            return;
        }

        const html = rankingData.map((r, i) => {
            const pos = i + 1;
            const isTop1 = pos === 1;
            const isTop2 = pos === 2;
            const isTop3 = pos === 3;
            
            let medalIcon = `#${pos}`;
            if (isTop1) medalIcon = '<i class="fa-solid fa-medal" style="color:#FFD700"></i>';
            if (isTop2) medalIcon = '<i class="fa-solid fa-medal" style="color:#C0C0C0"></i>';
            if (isTop3) medalIcon = '<i class="fa-solid fa-medal" style="color:#CD7F32"></i>';

            let classes = 'ranking-item';
            if (r.voce) classes += ' is-me';
            if (isTop1) classes += ' top-1';
            else if (isTop2) classes += ' top-2';
            else if (isTop3) classes += ' top-3';

            return `
                <li class="${classes}">
                    <div class="rank-info">
                        <div class="rank-position ${pos <= 3 ? 'medal' : ''}">${medalIcon}</div>
                        <div class="rank-details">
                            <h4>${r.nome} ${r.voce ? '<span style="color:var(--gold-dark); font-size:12px;">(Você)</span>' : ''}</h4>
                            <p>${r.salaNome || 'Sem turma'}</p>
                        </div>
                    </div>
                    <div class="rank-points">
                        ${r.pontos} <span style="font-size:12px; color:var(--color-text-muted); font-weight:normal;">pts</span>
                    </div>
                </li>
            `;
        }).join('');

        listContainer.innerHTML = html;
    }

    async function processAndRender(dataArray) {
        let ranking = [...dataArray];
        
        // Adiciona os extras do localStorage no usuário logado para refletir o mesmo do dashboard
        if (localExtras > 0) {
            const eu = ranking.find(r => r.voce);
            if (eu) {
                eu.pontos += localExtras;
            } else {
                ranking.push({ nome: user.nome, pontos: localExtras, voce: true, salaNome: user.salaNome || '' });
            }
        }
        
        ranking.sort((a, b) => b.pontos - a.pontos);
        renderRanking(ranking);
    }

    async function loadData(type) {
        listContainer.innerHTML = `
            <div class="loading-state">
               <i class="fa-solid fa-circle-notch fa-spin fa-2x"></i>
               <p style="margin-top: 16px;">Carregando ranking...</p>
            </div>
        `;

        try {
            if (localExtras === null) {
                const bgPts = await getBrazilGuessrPts();
                const ptsLocal = pontosJogosLocal(user.nome);
                localExtras = bgPts + ptsLocal;
            }

            if (type === 'turma') {
                if (!cacheTurma) {
                    cacheTurma = await api.get('/alunos/ranking/turma');
                }
                processAndRender(cacheTurma);
            } else {
                if (!cacheGeral) {
                    cacheGeral = await api.get('/alunos/ranking/geral');
                }
                processAndRender(cacheGeral);
            }
        } catch (e) {
            console.error('Erro ao carregar ranking', e);
            listContainer.innerHTML = `
                <li style="padding: 32px; text-align: center; color: var(--color-text-muted);">
                    Erro ao carregar o ranking. Tente novamente.
                </li>
            `;
        }
    }

    // Tabs listener
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadData(tab.dataset.target);
        });
    });

    // Load initial
    loadData('turma');
});
