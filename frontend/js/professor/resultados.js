document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildProfessorSidebar());
    const user = initPage('prof');
    if (!user) return;

    // Set active menu item
    const menuItems = document.querySelectorAll('.sidebar-nav a');
    menuItems.forEach(item => {
        if(item.getAttribute('href').includes('resultados.html')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    const gameMap = {
      1: 'Bandeira e Estado', 2: 'Encontre a Capital', 3: 'Quiz de Siglas',
      4: 'Memória dos Biomas', 5: 'Ordenando por Região', 6: 'Hidrografias',
      7: 'Desafio da Posição', 8: 'Caça-Palavras', 9: 'Complete a Capital',
      10: 'Fronteiras c/ Cronômetro'
    };

    let realResults = [];
    try {
      const stored = JSON.parse(localStorage.getItem('geoeduca_results') || '[]');
      realResults = stored.map((r, i) => ({
        id: i + 1,
        aluno: r.aluno,
        turma: r.sala || 'Desconhecida',
        jogo: gameMap[r.gameId] || `Jogo ${r.gameId}`,
        score: r.pontuacao,
        accuracy: r.pct, // number 0-100
        date: new Date(r.data).toLocaleDateString('pt-BR')
      })).reverse(); // Mais recentes primeiro
    } catch(e) { console.error(e); }

    const tbody = document.getElementById('results-table-body');
    const noResults = document.getElementById('no-results');
    const filterTurma = document.getElementById('filter-turma');
    const filterJogo = document.getElementById('filter-jogo');

    function renderResults(results) {
        if(results.length === 0) {
            tbody.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        tbody.innerHTML = results.map(r => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:32px; height:32px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px;">
                            ${r.aluno.split(' ').map(n=>n[0]).join('').substring(0,2)}
                        </div>
                        <strong style="color:var(--text-color);">${r.aluno}</strong>
                    </div>
                </td>
                <td><span class="badge badge-info">${r.turma}</span></td>
                <td>${r.jogo}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="color:var(--success); font-weight:bold;">${r.score}</span>
                        <span style="color:var(--text-secondary); font-size:12px;">pts</span>
                    </div>
                </td>
                <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="flex:1; height:6px; background:var(--surface-hover); border-radius:3px; overflow:hidden; min-width: 60px;">
                            <div style="height:100%; width:${r.accuracy}%; background:${r.accuracy > 70 ? 'var(--success)' : r.accuracy > 50 ? 'var(--warning)' : 'var(--error)'};"></div>
                        </div>
                        <span style="font-size:13px; color:var(--text-secondary);">${r.accuracy}%</span>
                    </div>
                </td>
                <td style="color:var(--text-secondary);">${r.date}</td>
            </tr>
        `).join('');
    }

    function applyFilters() {
        const turma = filterTurma.value;
        const jogo = filterJogo.value;

        const filtered = realResults.filter(r => {
            const matchTurma = turma ? r.turma === turma : true;
            const matchJogo = jogo ? r.jogo === jogo : true;
            return matchTurma && matchJogo;
        });

        renderResults(filtered);
    }

    // Preencher select de filtros com jogos que foram jogados
    const jogosJogados = [...new Set(realResults.map(r => r.jogo))];
    filterJogo.innerHTML = '<option value="">Todos os Jogos</option>' + 
      jogosJogados.map(j => `<option value="${j}">${j}</option>`).join('');

    const turmasJogadas = [...new Set(realResults.map(r => r.turma))];
    filterTurma.innerHTML = '<option value="">Todas as Turmas</option>' + 
      turmasJogadas.map(t => `<option value="${t}">${t}</option>`).join('');

    filterTurma.addEventListener('change', applyFilters);
    filterJogo.addEventListener('change', applyFilters);

    // Initial render
    renderResults(realResults);
});
