// ==========================================
// JOGOS DO PROFESSOR - GEOEDUCA
// Cards de jogos + relatórios por sala e aluno
// Lê resultados REAIS do localStorage
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildProfessorSidebar());
  const user = initPage('prof');
  if (!user) return;

  // ---- Dados dos jogos ----
  const mockGames = [
    { id: 1,  title: 'Bandeira e Estado',       type: 'identificacao', icon: '🏳️', desc: 'Associe o símbolo ao estado brasileiro. Quiz de identificação visual.', maxPts: 60 },
    { id: 2,  title: 'Encontre a Capital',       type: 'capitais',      icon: '🏛️', desc: 'Identifique a capital correta para cada estado brasileiro.',           maxPts: 60 },
    { id: 3,  title: 'Quiz de Siglas',           type: 'quiz',          icon: '🔤', desc: 'Reconheça o estado pela sigla com sistema de combos.',                 maxPts: 60 },
    { id: 4,  title: 'Memória dos Biomas',       type: 'memoria',       icon: '🌿', desc: 'Encontre pares entre biomas e suas características.',                  maxPts: 40 },
    { id: 5,  title: 'Ordenando por Região',     type: 'regioes',       icon: '🗺️', desc: 'Classifique estados nas 5 regiões do Brasil.',                        maxPts: 60 },
    { id: 6,  title: 'Hidrografias',             type: 'rios',          icon: '🌊', desc: 'Identifique rios pela extensão e características.',                   maxPts: 50 },
    { id: 7,  title: 'Desafio da Posição',       type: 'orientacao',    icon: '🧭', desc: 'Perguntas sobre localização geográfica dos estados.',                  maxPts: 50 },
    { id: 8,  title: 'Caça-Palavras',            type: 'vocabulario',   icon: '🔍', desc: 'Encontre capitais e estados na grade de letras.',                      maxPts: 50 },
    { id: 9,  title: 'Complete a Capital',       type: 'digitacao',     icon: '✍️', desc: 'Complete o nome da capital com base nas lacunas exibidas.',            maxPts: 50 },
    { id: 10, title: 'Fronteiras c/ Cronômetro', type: 'fronteiras',    icon: '⏱️', desc: 'Marque os estados vizinhos antes do tempo acabar.',                   maxPts: 60 }
  ];

  // ---- Estatísticas gerais ----
  function getEstatisticasGerais(gameId) {
    let realHist = [];
    try { realHist = JSON.parse(localStorage.getItem('geoeduca_results') || '[]'); } catch(e) {}
    return realHist.filter(r => r.gameId === gameId).map(r => ({
      nome: r.aluno,
      sala: r.sala || 'Desconhecida',
      pontuacao: r.pontuacao,
      tempo: r.tempo,
      data: r.data,
      isReal: true
    }));
  }

  // Agrupa por sala
  function agruparPorSala(todos) {
    const map = {};
    todos.forEach(a => {
      if (!map[a.sala]) map[a.sala] = { nome: a.sala, alunos: [] };
      map[a.sala].alunos.push(a);
    });
    return Object.values(map);
  }

  // ---- Render dos cards ----
  const typeLabels = {
    identificacao:'Identificação', capitais:'Capitais', quiz:'Quiz',
    memoria:'Memória', regioes:'Regiões', rios:'Rios',
    orientacao:'Orientação', vocabulario:'Vocabulário',
    digitacao:'Digitação', fronteiras:'Fronteiras'
  };
  const typeColors = {
    identificacao:'badge-forest', capitais:'badge-navy', quiz:'badge-gold',
    memoria:'badge-forest', regioes:'badge-navy', rios:'badge-navy',
    orientacao:'badge-gold', vocabulario:'badge-forest',
    digitacao:'badge-gold', fronteiras:'badge-danger'
  };

  function getTotaisJogo(gameId, jogo) {
    let hist = [];
    try { hist = JSON.parse(localStorage.getItem('geoeduca_results') || '[]'); } catch(e) {}
    const desteJogo = hist.filter(r => r.gameId === gameId);
    const realPlays  = desteJogo.length;
    return { plays: realPlays, realPlays };
  }

  function renderGames(lista) {
    const grid = document.getElementById('games-grid');
    if (!lista.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;
        color:var(--color-text-secondary);background:var(--color-surface);border-radius:var(--radius-lg);">
        Nenhum jogo encontrado.
      </div>`;
      return;
    }
    grid.innerHTML = lista.map(g => {
      const { plays } = getTotaisJogo(g.id, g);
      return `
        <div class="card" style="display:flex;flex-direction:column;overflow:hidden;">
          <div style="background:var(--color-surface-2);padding:20px 20px 16px;border-bottom:1px solid var(--color-border);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
              <span class="badge ${typeColors[g.type] || 'badge-muted'}">${typeLabels[g.type] || g.type}</span>
              <span style="font-size:22px;">${g.icon}</span>
            </div>
            <h3 style="margin:0 0 6px;font-size:16px;font-family:var(--font-display);color:var(--color-text-primary)">${g.title}</h3>
            <p style="margin:0;color:var(--color-text-secondary);font-size:13px;line-height:1.5">${g.desc}</p>
          </div>
          <div class="card-body" style="flex:1;display:flex;flex-direction:column;gap:12px;padding:16px 20px;">
            <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--color-text-secondary);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <strong style="color:var(--color-text-primary)">${plays.toLocaleString('pt-BR')}</strong> jogadas registradas
            </div>
            <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--color-text-secondary);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Pontuação máxima: <strong style="color:var(--gold)">${g.maxPts} pts</strong>
            </div>
            <button class="btn btn-primary" style="width:100%;margin-top:auto;" onclick="abrirRelatorioJogo(${g.id})">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Ver Resultados
            </button>
          </div>
        </div>`;
    }).join('');
  }

  // ---- Filtros ----
  const allTypes = [...new Set(mockGames.map(g => g.type))];
  const typeSelect = document.getElementById('filter-type');
  typeSelect.innerHTML = `<option value="">Todos os tipos</option>` +
    allTypes.map(t => `<option value="${t}">${typeLabels[t] || t}</option>`).join('');

  function applyFilters() {
    const q = document.getElementById('search-games').value.toLowerCase();
    const type = typeSelect.value;
    renderGames(mockGames.filter(g => {
      return (!q || g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q)) &&
             (!type || g.type === type);
    }));
  }
  document.getElementById('search-games').addEventListener('input', applyFilters);
  typeSelect.addEventListener('change', applyFilters);
  renderGames(mockGames);

  // ---- RELATÓRIOS ----
  window.abrirRelatorioJogo = function(gameId) {
    const jogo = mockGames.find(g => g.id === gameId);
    if (!jogo) return;

    const todos     = getEstatisticasGerais(gameId);
    const turmas    = agruparPorSala(todos);
    const realCount = todos.filter(a => a.isReal).length;

    document.getElementById('report-game-title').innerText    = `Resultados: ${jogo.title}`;
    document.getElementById('report-game-subtitle').innerText =
      `${todos.length} alunos · ${turmas.length} turmas · ${realCount} jogadas reais registradas`;

    // ---- Aba POR SALA ----
    const containerSala = document.getElementById('report-content-sala');
    containerSala.innerHTML = '';

    // Estatísticas resumidas no topo
    if (todos.length === 0) {
      containerSala.innerHTML = `
        <div style="text-align:center;padding:48px 24px;color:var(--color-text-secondary);background:var(--color-surface-2);border-radius:var(--radius-lg);margin-top:16px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;opacity:0.5;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h4 style="margin:0 0 8px;font-size:18px;color:var(--color-text-primary);font-family:var(--font-display);">Nenhum resultado ainda</h4>
          <p style="margin:0;font-size:14px;max-width:300px;margin:0 auto;">Os alunos precisam jogar este jogo para que os resultados apareçam aqui.</p>
        </div>`;
      document.getElementById('report-aluno-tbody').innerHTML = `
        <tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-muted);">Nenhuma jogada registrada.</td></tr>
      `;
      if (window.switchReportTab) window.switchReportTab('sala');
      document.getElementById('modal-relatorio-overlay').classList.add('open');
      return;
    }

    const mediaGeral = Math.round(todos.reduce((s, a) => s + a.pontuacao, 0) / todos.length);
    const melhor = todos.reduce((m, a) => a.pontuacao > m.pontuacao ? a : m, todos[0]);
    const pior   = todos.reduce((m, a) => a.pontuacao < m.pontuacao ? a : m, todos[0]);

    containerSala.insertAdjacentHTML('beforeend', `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:8px;">
        <div class="stat-card" style="padding:14px 16px;">
          <div class="stat-card-accent gold"></div>
          <div class="stat-card-label">Média Geral</div>
          <div class="stat-card-value" style="font-size:1.6rem;">${mediaGeral}<small style="font-size:.8rem;color:var(--color-text-muted)"> pts</small></div>
        </div>
        <div class="stat-card" style="padding:14px 16px;">
          <div class="stat-card-accent forest"></div>
          <div class="stat-card-label">Melhor Aluno</div>
          <div class="stat-card-value" style="font-size:1rem;">${melhor.nome.split(' ')[0]}</div>
          <div class="stat-card-change" style="color:var(--color-success)">${melhor.pontuacao} pts</div>
        </div>
        <div class="stat-card" style="padding:14px 16px;">
          <div class="stat-card-accent navy"></div>
          <div class="stat-card-label">Total Turmas</div>
          <div class="stat-card-value" style="font-size:1.6rem;">${turmas.length}</div>
        </div>
      </div>`);

    // Cards de cada turma
    turmas.forEach(t => {
      const mediaT = Math.round(t.alunos.reduce((s, a) => s + a.pontuacao, 0) / t.alunos.length);
      const aprovados = t.alunos.filter(a => a.pontuacao >= Math.round(jogo.maxPts * 0.6)).length;
      const pct = Math.round((aprovados / t.alunos.length) * 100);

      const div = document.createElement('div');
      div.className = 'class-card';
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h4 style="margin:0;font-size:16px;font-family:var(--font-display)">${t.nome}</h4>
            <p style="margin:4px 0 0;font-size:12px;color:var(--color-text-secondary)">
              ${t.alunos.length} alunos · ${aprovados} aprovados (≥${Math.round(jogo.maxPts * 0.6)} pts)
            </p>
          </div>
          <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
            <span class="badge ${mediaT >= Math.round(jogo.maxPts*0.6) ? 'badge-success' : 'badge-danger'}">
              Média: ${mediaT} pts
            </span>
            <div style="font-size:11px;color:var(--color-text-muted)">
              ${pct}% de aprovação
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            style="margin-left:12px;flex-shrink:0;color:var(--color-text-muted)">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        <!-- Barra de progresso da turma -->
        <div style="margin-top:10px;height:6px;background:var(--color-border);border-radius:99px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${mediaT >= Math.round(jogo.maxPts*0.6) ? 'var(--color-success)' : 'var(--color-danger)'};border-radius:99px;"></div>
        </div>

        <div class="class-details">
          <!-- Cabeçalho da tabela -->
          <div style="display:grid;grid-template-columns:1fr 100px 80px 90px;gap:8px;
            font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.07em;
            color:var(--color-text-muted);margin-bottom:6px;padding:0 4px;">
            <span>Aluno</span><span style="text-align:center">Pontuação</span>
            <span style="text-align:center">Tempo</span><span style="text-align:center">Status</span>
          </div>
          ${t.alunos.sort((a,b) => b.pontuacao - a.pontuacao).map((a, i) => {
            const aprovado = a.pontuacao >= Math.round(jogo.maxPts * 0.6);
            const pctAluno = Math.round((a.pontuacao / jogo.maxPts) * 100);
            return `
              <div style="display:grid;grid-template-columns:1fr 100px 80px 90px;gap:8px;
                align-items:center;padding:8px 4px;border-radius:var(--radius-md);
                ${a.isReal ? 'background:rgba(204,164,59,.07);border:1px solid rgba(204,164,59,.2);' : 'border-bottom:1px solid var(--color-border);'}
                font-size:13px;margin-bottom:2px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="width:22px;height:22px;border-radius:3px;
                    background:${i===0?'var(--gold)':i===1?'#94a3b8':i===2?'#b45309':'var(--color-border)'};
                    display:flex;align-items:center;justify-content:center;
                    font-size:10px;font-weight:700;color:${i<3?'white':'var(--color-text-muted)'};">
                    ${i+1}
                  </div>
                  <div>
                    <div style="font-weight:${a.isReal?'700':'500'};color:${a.isReal?'var(--gold)':'var(--color-text-primary)'}">
                      ${a.nome} ${a.isReal ? '⭐' : ''}
                    </div>
                    ${a.isReal ? '<div style="font-size:10px;color:var(--color-text-muted)">Resultado real</div>' : ''}
                  </div>
                </div>
                <div style="text-align:center;">
                  <div style="font-weight:700;font-size:15px;color:${aprovado?'var(--color-success)':'var(--color-danger)'}">
                    ${a.pontuacao}
                  </div>
                  <div style="height:3px;background:var(--color-border);border-radius:99px;overflow:hidden;margin-top:3px;">
                    <div style="width:${pctAluno}%;height:100%;background:${aprovado?'var(--color-success)':'var(--color-danger)'};border-radius:99px;"></div>
                  </div>
                </div>
                <div style="text-align:center;color:var(--color-text-muted);font-size:12px;">${a.tempo}</div>
                <div style="text-align:center;">
                  <span class="badge ${aprovado?'badge-success':'badge-danger'}" style="font-size:10px;">
                    ${aprovado?'Aprovado':'Atenção'}
                  </span>
                </div>
              </div>`;
          }).join('')}
        </div>`;
      div.onclick = (e) => {
        if (e.target.closest('.class-details')) return;
        div.classList.toggle('expanded');
      };
      containerSala.appendChild(div);
    });

    // ---- Aba POR ALUNO ----
    const tbody = document.getElementById('report-aluno-tbody');
    const sorted = [...todos].sort((a, b) => b.pontuacao - a.pontuacao);
    tbody.innerHTML = sorted.map((a, i) => {
      const aprovado = a.pontuacao >= Math.round(jogo.maxPts * 0.6);
      const pct = Math.round((a.pontuacao / jogo.maxPts) * 100);
      const dataFmt = new Date(a.data).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });
      return `
        <tr style="${a.isReal ? 'background:rgba(204,164,59,.06);' : ''}">
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:28px;height:28px;border-radius:4px;
                background:${i===0?'var(--gold)':i===1?'#94a3b8':i===2?'#b45309':'var(--color-surface-2)'};
                border:1px solid var(--color-border);
                display:flex;align-items:center;justify-content:center;
                font-size:11px;font-weight:700;color:${i<3?'white':'var(--color-text-muted)'};">${i+1}</div>
              <div>
                <div style="font-weight:${a.isReal?'700':'500'};color:${a.isReal?'var(--gold)':'var(--color-text-primary)'}">
                  ${a.nome} ${a.isReal ? '⭐' : ''}
                </div>
                ${a.isReal ? '<div style="font-size:10px;color:var(--gold)">Resultado real</div>' : ''}
              </div>
            </div>
          </td>
          <td><span class="badge badge-muted">${a.sala}</span></td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <strong style="font-size:16px;color:${aprovado?'var(--color-success)':'var(--color-danger)'}">${a.pontuacao}</strong>
              <div style="flex:1;height:4px;background:var(--color-border);border-radius:99px;overflow:hidden;min-width:40px;">
                <div style="width:${pct}%;height:100%;background:${aprovado?'var(--color-success)':'var(--color-danger)'};border-radius:99px;"></div>
              </div>
              <span style="font-size:11px;color:var(--color-text-muted)">${pct}%</span>
            </div>
          </td>
          <td style="font-size:13px;color:var(--color-text-muted)">${a.tempo}</td>
          <td>
            <span class="badge ${aprovado?'badge-success':'badge-danger'}">${aprovado?'Aprovado':'Atenção'}</span>
          </td>
          <td style="font-size:12px;color:var(--color-text-muted)">${dataFmt}</td>
        </tr>`;
    }).join('');

    if (window.switchReportTab) window.switchReportTab('sala');
    document.getElementById('modal-relatorio-overlay').classList.add('open');
  };
});
