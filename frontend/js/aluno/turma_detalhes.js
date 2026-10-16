document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
    Auth.requireAuth('aluno');
    initPage('aluno');

    const params = new URLSearchParams(window.location.search);
    const salaId = params.get('id');

    if (!salaId) {
        alert('Turma não informada.');
        window.location.href = 'turmas.html';
        return;
    }

    await carregarTurmaInfo(salaId);
    carregarRanking(salaId);
    carregarAtividades(salaId);
});

async function carregarTurmaInfo(salaId) {
    try {
        // We can fetch from /minhas-salas and find the correct one, or fetch directly.
        // Actually /minhas-salas is easiest to just get the room name.
        const salas = await api.get('/alunos/minhas-salas');
        const sala = salas.find(s => s.id === salaId);
        
        if (sala) {
            document.getElementById('th-nome').textContent = sala.nome;
            document.getElementById('th-info').textContent = `Série: ${sala.serie} | Código: ${sala.turma}`;
            document.title = `GeoEduca - ${sala.nome}`;
        } else {
            document.getElementById('th-nome').textContent = 'Turma Desconhecida';
        }
    } catch (e) {
        console.error(e);
        document.getElementById('th-nome').textContent = 'Erro ao carregar';
    }
}

async function carregarRanking(salaId) {
    const container = document.getElementById('ranking-container');
    try {
        const ranking = await api.get(`/alunos/ranking/turma?salaId=${salaId}`);
        if (!ranking || ranking.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--color-text-muted);">Nenhum aluno nesta turma ainda.</div>';
            return;
        }

        ranking.sort((a, b) => b.pontos - a.pontos);
        container.innerHTML = '';

        const currentUser = Auth.getUser();

        ranking.forEach((r, i) => {
            const borda = (r.voce && currentUser?.bordaAtual) ? currentUser.bordaAtual : r.bordaAtual;
            const icone = (r.voce && currentUser?.iconeAtual) ? currentUser.iconeAtual : r.iconeAtual;
            const titulo = (r.voce && currentUser?.tituloAtual) ? currentUser.tituloAtual : r.tituloAtual;

            let bordaClass = 'r-avatar';
            let bordaStyle = '';
            if (borda && borda !== 'transparent') {
                if (borda.startsWith('anim-')) {
                    bordaClass += ` ${borda}`;
                } else {
                    bordaStyle = `border: 3px solid ${borda}; box-shadow: 0 0 10px ${borda};`;
                }
            }
            
            let tituloHtml = '';
            if (titulo) {
                tituloHtml = `<span style="font-size:0.6rem; color:var(--navy-light); font-weight:800; text-transform:uppercase; display:block;">${titulo}</span>`;
            }

            const initial = r.nome.charAt(0).toUpperCase();
            const avatarContent = icone 
                ? `<i class="${icone}"></i>` 
                : initial;
            
            const div = document.createElement('div');
            div.className = `ranking-item ${r.voce ? 'is-me' : ''}`;
            div.innerHTML = `
                <div class="r-pos">#${i + 1}</div>
                <div class="${bordaClass}" style="${bordaStyle}">
                    ${avatarContent}
                </div>
                <div class="r-info">
                    <strong>${r.voce ? r.nome + ' (Você)' : r.nome}</strong>
                    ${tituloHtml}
                </div>
                <div class="r-pts">${r.pontos} XP</div>
            `;
            container.appendChild(div);
        });

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--danger);">Erro ao carregar o ranking.</div>';
    }
}

async function carregarAtividades(salaId) {
    const container = document.getElementById('ativ-container');
    try {
        const atividades = await api.get(`/atividades/minhas?salaId=${salaId}`);
        if (!atividades || atividades.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--color-text-muted);">Nenhuma atividade pendente. Tudo certo!</div>';
            return;
        }

        container.innerHTML = '';

        atividades.forEach(a => {
            const dataLimiteFormato = a.dataLimite ? new Date(a.dataLimite).toLocaleDateString() : 'Sem prazo';
            const badge = a.visualizado 
                ? '<span class="badge concluida"><i class="fa-solid fa-check"></i> Concluída</span>' 
                : '<span class="badge pendente"><i class="fa-solid fa-clock"></i> Pendente</span>';

            const div = document.createElement('div');
            div.className = 'ativ-card';
            div.innerHTML = `
                <div class="ativ-info">
                    <h4>${a.titulo}</h4>
                    <p><i class="fa-solid fa-calendar-day"></i> Prazo: ${dataLimiteFormato}</p>
                </div>
                <div>${badge}</div>
            `;
            container.appendChild(div);
        });

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--danger);">Erro ao carregar atividades.</div>';
    }
}
