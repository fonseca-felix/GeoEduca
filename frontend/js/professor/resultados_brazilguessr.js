document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildProfessorSidebar());
    const user = initPage('prof');
    if (!user) return;

    let jogoId = 'brazilguessr';

    try {
        const jogos = await api.get('/jogos');
        console.log('Jogos list:', jogos);
        const bg = jogos.find(j => j.titulo.toLowerCase().includes('brazilguessr'));
        if (bg) {
            jogoId = bg.id;
            console.log('Found BrazilGuessr game id:', jogoId);
        } else {
            console.warn('BrazilGuessr game not found in list, using default id');
        }
        const data = await api.get(`/jogos/${jogoId}/resultados-completos`);
        console.log('Resultados data:', data);
        window.brazilGuessrData = data;

        // Render Global
        const tbodyGlobal = document.getElementById('tbody-global');
        if (data.global.length === 0) {
            tbodyGlobal.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 32px;">Nenhum dado encontrado.</td></tr>';
        } else {
            tbodyGlobal.innerHTML = renderStudentRows(data.global);
        }

        // Render Salas
        const tbodySalas = document.getElementById('tbody-salas');
        if (data.salas.length === 0) {
            tbodySalas.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 32px;">Nenhuma sala encontrada.</td></tr>';
        } else {
            tbodySalas.innerHTML = data.salas.map((s, index) => {
                let rankClass = index < 3 ? `rank-${index + 1}` : '';
                let rankIcon = index === 0 ? '<i data-lucide="medal" class="w-4 h-4 inline" style="color: #000;"></i> ' : '';
                if (index === 1 || index === 2) rankIcon = '<i data-lucide="award" class="w-4 h-4 inline"></i> ';

                return `
                    <tr class="${rankClass}">
                        <td><div class="rank-badge">${rankIcon}${index + 1}</div></td>
                        <td style="font-weight: 600; font-size: 15px;">${s.nome} (${s.serie} ${s.turma})</td>
                        <td><span class="total-pts-badge">${s.totalPts.toLocaleString('pt-BR')} pts</span></td>
                    </tr>
                `;
            }).join('');
        }

        // Setup Select Sala
        const selectSala = document.getElementById('select-sala');
        if (data.salasInfo.length === 0) {
            selectSala.innerHTML = '<option value="">Nenhuma sala encontrada</option>';
        } else {
            selectSala.innerHTML = '<option value="">Selecione uma sala...</option>' + 
                data.salasInfo.map(s => `<option value="${s.id}">${s.nome} (${s.serie} ${s.turma})</option>`).join('');
        }

        const tbodyPorSala = document.getElementById('tbody-por-sala');
        selectSala.addEventListener('change', (e) => {
            const salaId = e.target.value;
            if (!salaId) {
                tbodyPorSala.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 32px;">Selecione uma sala para ver os resultados</td></tr>';
                return;
            }
            const alunosDaSala = data.porSala[salaId] || [];
            if (alunosDaSala.length === 0) {
                tbodyPorSala.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--color-text-secondary);">Nenhum aluno desta sala jogou o BrazilGuessr ainda.</td></tr>';
                return;
            }
            tbodyPorSala.innerHTML = renderStudentRows(alunosDaSala);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (error) {
        console.error('Erro ao inicializar resultados:', error);
        document.getElementById('tbody-global').innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--color-danger);">Erro ao carregar dados.</td></tr>';
        document.getElementById('tbody-salas').innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 32px; color: var(--color-danger);">Erro ao carregar dados.</td></tr>';
    }
});

function renderStudentRows(alunos) {
    return alunos.map((r, index) => {
        let rankClass = index < 3 ? `rank-${index + 1}` : '';
        let rankIcon = index === 0 ? '<i data-lucide="medal" class="w-4 h-4 inline" style="color: #000;"></i> ' : '';
        if (index === 1 || index === 2) rankIcon = '<i data-lucide="award" class="w-4 h-4 inline"></i> ';

        return `
            <tr class="${rankClass}">
                <td><div class="rank-badge">${rankIcon}${index + 1}</div></td>
                <td style="font-weight: 600; font-size: 15px;">${r.alunoNome}</td>
                <td><span class="pts-badge">${(r.semanal || 0).toLocaleString('pt-BR')} pts</span></td>
                <td><span class="pts-badge">${(r.mensal || 0).toLocaleString('pt-BR')} pts</span></td>
                <td><span class="pts-badge">${(r.trimestral || 0).toLocaleString('pt-BR')} pts</span></td>
                <td><span class="pts-badge">${(r.semestral || 0).toLocaleString('pt-BR')} pts</span></td>
                <td><span class="pts-badge">${(r.anual || 0).toLocaleString('pt-BR')} pts</span></td>
                <td><span class="total-pts-badge">${(r.total || 0).toLocaleString('pt-BR')} pts</span></td>
            </tr>
        `;
    }).join('');
}

window.switchTab = function(tabId, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const tabEl = document.getElementById('tab-' + tabId);
    if (tabEl) tabEl.classList.add('active');
};
