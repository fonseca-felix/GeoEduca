document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
    Auth.requireAuth('aluno');
    initPage('aluno');

    carregarTurmas();

    document.getElementById('form-join-room').addEventListener('submit', async (e) => {
        e.preventDefault();
        const codigo = document.getElementById('roomCode').value.trim().toUpperCase();
        const btn = document.getElementById('btn-submit-join');
        const errDiv = document.getElementById('join-error');
        
        if (!codigo) return;
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
        errDiv.style.display = 'none';

        try {
            const res = await api.post('/alunos/entrar-sala', { codigoSala: codigo });
            
            // Sucesso! Atualiza os dados do aluno no localStorage
            const user = Auth.getUser();
            if(user) {
                user.salas = res.salas;
                user.salasNomes = res.salasNomes;
                localStorage.setItem('geo_user', JSON.stringify(user));
            }
            
            Modal.close('joinRoomModal');
            document.getElementById('roomCode').value = '';
            carregarTurmas();
            
        } catch (error) {
            errDiv.textContent = error.message || 'Erro ao entrar na turma';
            errDiv.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar';
        }
    });
});

async function carregarTurmas() {
    const container = document.getElementById('turmas-container');
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Carregando turmas...</p></div>';

    try {
        const turmas = await api.get('/alunos/minhas-salas');
        
        if (!turmas || turmas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-users-slash"></i>
                    <h3>Nenhuma turma encontrada</h3>
                    <p>Você ainda não está matriculado em nenhuma turma.</p>
                    <button class="btn btn-primary" onclick="Modal.open('joinRoomModal')">Entrar em uma Turma</button>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        turmas.forEach(turma => {
            const card = document.createElement('div');
            card.className = 'turma-card';
            // Por enquanto não tem página individual, mas futuramente apontará para a dashboard daquela turma
            card.innerHTML = `
                <div class="turma-card-header">
                    <div class="turma-icon">
                        <i class="fa-solid fa-chalkboard-user"></i>
                    </div>
                    <div class="turma-info">
                        <h3>${turma.nome}</h3>
                        <p>Código: ${turma.turma}</p>
                    </div>
                </div>
                <div class="turma-meta">
                    <span><i class="fa-solid fa-graduation-cap"></i> Série: ${turma.serie}</span>
                    <a href="turma_detalhes.html?id=${turma.id}" class="btn btn-outline btn-sm">Ver Turma</a>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (e) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation" style="color:var(--danger)"></i>
                <h3>Erro ao carregar turmas</h3>
                <p>${e.message}</p>
            </div>
        `;
    }
}
