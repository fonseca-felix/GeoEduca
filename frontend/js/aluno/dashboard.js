document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
    const user = initPage('aluno');
    if (!user) return;

    const menuItems = document.querySelectorAll('.sidebar-nav a');
    menuItems.forEach(item => {
        if (item.getAttribute('href').includes('dashboard.html')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    const studentNameEl = document.getElementById('student-name');
    if (studentNameEl && user.nome) {
        studentNameEl.textContent = user.nome.split(' ')[0];
    }

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

    async function loadDashboard() {
        try {
            const [atividades, provas, quizzes] = await Promise.all([
                api.get('/atividades/minhas').catch(() => []),
                api.get('/provas/disponiveis').catch(() => []),
                api.get('/quizzes/disponiveis').catch((err) => {
                    console.error('Erro ao carregar quizzes:', err);
                    return [];
                })
            ]);

            const pendingAtividades = atividades.filter(a => !a.visualizado).map(a => ({
                id: a.atividadeId,
                title: a.titulo,
                type: a.tipo,
                deadline: a.dataLimite ? new Date(a.dataLimite + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem prazo',
                icon: a.tipo === 'video' ? '🎬' : a.tipo === 'infografico' ? '🖼️' : a.tipo === 'site' ? '🌐' : '📝',
                link: a.link || '#'
            }));

            const pendingProvas = provas.filter(p => !p.realizada).map(p => ({
                id: p.id,
                title: p.titulo,
                type: 'Prova',
                deadline: p.dataLimite ? new Date(p.dataLimite + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem prazo',
                icon: '📋',
                link: '/aluno/prova.html'
            }));

            const pendingQuizzes = quizzes.filter(q => !q.realizado).map(q => ({
                id: q.id,
                title: q.titulo,
                type: 'Quiz',
                deadline: q.dataLimite ? new Date(q.dataLimite + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem prazo',
                icon: '🎮',
                link: '/aluno/quiz.html'
            }));

            const allItems = [...pendingQuizzes, ...pendingProvas, ...pendingAtividades];
            const count = allItems.length;

            document.getElementById('pending-count').textContent = count;

            const heroText = document.getElementById('hero-pending-text');
            if (heroText) {
                heroText.textContent = count === 0
                    ? 'Você não tem tarefas pendentes no momento.'
                    : count === 1
                        ? 'Você tem 1 tarefa pendente.'
                        : `Você tem ${count} tarefas pendentes.`;
            }

            const gamesContainer = document.getElementById('student-games');
            if (allItems.length === 0) {
                gamesContainer.innerHTML = `
                    <div style="grid-column: 1/-1; padding: 32px; text-align: center; background: var(--color-surface-2); border-radius: 12px; color: var(--color-text-muted);">
                        Nenhuma atividade pendente no momento.
                    </div>
                `;
            } else {
                gamesContainer.innerHTML = allItems.map(g => `
                    <div class="card card-hover" style="display:flex; flex-direction:column; transition: transform 0.2s;">
                        <div class="card-body" style="flex:1; display:flex; flex-direction:column;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:12px; align-items:center;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-size:20px;">${g.icon}</span>
                                    <span style="font-size:12px; font-weight:600; color:var(--text-secondary); text-transform:uppercase;">${g.type}</span>
                                </div>
                                <span class="badge badge-warning" style="font-size:11px;">${g.deadline}</span>
                            </div>
                            <h4 style="font-size:18px; margin-bottom:8px;">${g.title}</h4>
                            <div style="margin-top:auto; padding-top:16px;">
                                <a href="${g.link}" ${g.link !== '#' && !g.link.startsWith('/') ? 'target="_blank"' : ''} class="btn btn-primary" style="width:100%; display:flex; justify-content:center; gap:8px; text-decoration:none;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                    Acessar
                                </a>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (e) {
            console.error('Erro ao carregar dashboard', e);
        }
    }

    async function loadResumoERanking() {
        const nomeUsuario = user.nome || 'Aluno';
        let resumo = null;
        let bgStats = null;

        try {
            resumo = await api.get('/alunos/me/resumo');
        } catch (e) {
            console.error('Erro ao carregar resumo', e);
        }

        let bgJogoId = localStorage.getItem('bg_jogo_id');
        if (!bgJogoId || bgJogoId === 'undefined' || bgJogoId === 'null') {
            try {
                const jogos = await api.get('/jogos');
                const bg = jogos.find(j => j.titulo.toLowerCase().includes('brazilguessr'));
                if (bg) {
                    bgJogoId = bg.id;
                    localStorage.setItem('bg_jogo_id', bgJogoId);
                } else {
                    bgJogoId = 'brazilguessr';
                }
            } catch (e) {
                bgJogoId = 'brazilguessr';
            }
        }

        try {
            bgStats = await api.get(`/jogos/${bgJogoId}/estatisticas`);
            const maxTentativas = bgStats.limiteDiario || 10;
            let tentativasRestantes = maxTentativas - (bgStats.partidasHoje || 0);
            if (tentativasRestantes < 0) tentativasRestantes = 0;
            
            const tentEl = document.getElementById('dashboard-bg-tentativas');
            if (tentEl) tentEl.textContent = tentativasRestantes;
        } catch (e) {
            console.error('Erro ao carregar stats do BrazilGuessr', e);
        }

        const ptsLocal = pontosJogosLocal(nomeUsuario);
        const bgPts = bgStats ? bgStats.total : 0;
        const xpTotal = (resumo?.xpTotal || 0) + ptsLocal + bgPts;
        const xpPorNivel = resumo?.xpProximoNivel || 200;
        const nivel = Math.max(1, Math.floor(xpTotal / xpPorNivel) + 1);
        const xpNoNivel = xpTotal % xpPorNivel;
        const progressoPct = xpPorNivel ? Math.round((xpNoNivel / xpPorNivel) * 100) : 0;

        const levelEl = document.getElementById('student-level');
        const levelTitleEl = document.getElementById('student-level-title');
        const xpLabelEl = document.getElementById('student-xp-label');
        const xpBarEl = document.getElementById('student-xp-bar');

        if (levelEl) levelEl.textContent = nivel;
        if (levelTitleEl) {
            levelTitleEl.textContent = xpTotal > 0
                ? (resumo?.salaNome ? `Turma: ${resumo.salaNome}` : 'Continue estudando!')
                : 'Comece uma atividade para ganhar XP';
        }
        if (xpLabelEl) xpLabelEl.textContent = `${xpNoNivel} / ${xpPorNivel} XP`;
        if (xpBarEl) xpBarEl.style.width = `${progressoPct}%`;

        const rankingList = document.getElementById('ranking-list');
        if (!rankingList) return;

        try {
            let ranking = await api.get('/alunos/ranking/turma');
            if (!Array.isArray(ranking)) ranking = [];

            if (ptsLocal > 0 || bgPts > 0) {
                const totalExtras = ptsLocal + bgPts;
                const eu = ranking.find(r => r.voce);
                if (eu) {
                    eu.pontos += totalExtras;
                } else {
                    ranking.push({ nome: nomeUsuario, pontos: totalExtras, voce: true, salaNome: user.salaNome || '' });
                }
                ranking.sort((a, b) => b.pontos - a.pontos);
                ranking = ranking.slice(0, 10);
            }

            if (ranking.length === 0) {
                rankingList.innerHTML = `
                    <li style="padding: 16px; text-align: center; color: var(--color-text-muted); font-size: 14px;">
                        Ainda não há pontuação na turma. Complete quizzes, provas ou jogos.
                    </li>
                `;
                return;
            }

            rankingList.innerHTML = ranking.map((r, i) => {
                const pos = i + 1;
                return `
                <li style="display:flex; justify-content:space-between; align-items:center; padding: 10px 12px; background: ${r.voce ? 'rgba(204,164,59,.1)' : 'var(--color-surface-2)'}; border-radius: 8px; border: 1px solid ${r.voce ? 'rgba(204,164,59,.35)' : 'var(--color-border)'};">
                    <div style="display:flex; align-items:center; gap: 12px;">
                        <span style="font-weight:bold; color:${pos <= 3 ? 'var(--gold-dark)' : 'var(--color-text-muted)'}; width:24px; text-align:center; font-size:14px;">
                            ${pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`}
                        </span>
                        <span style="font-weight:${r.voce ? '600' : '500'}; color:${r.voce ? 'var(--gold-dark)' : 'var(--color-text-primary)'};">${r.nome}${r.voce ? ' (Você)' : ''}</span>
                    </div>
                    <span style="font-weight:600; color:var(--color-text-primary); font-size:14px;">${r.pontos} pts</span>
                </li>
                `;
            }).join('');
        } catch (e) {
            console.error('Erro ao carregar ranking', e);
            rankingList.innerHTML = `
                <li style="padding: 16px; text-align: center; color: var(--color-text-muted); font-size: 14px;">
                    Não foi possível carregar o ranking.
                </li>
            `;
        }
    }

    loadDashboard();
    loadResumoERanking();
});
