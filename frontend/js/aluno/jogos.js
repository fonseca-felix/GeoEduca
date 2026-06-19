// ==========================================
// JOGOS DO ALUNO - GEOEDUCA
// Cards de jogos + ranking real da turma
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
  const user = initPage('aluno');
  if (!user) return;

  localStorage.setItem('geoeduca_user_name', user.nome || 'Aluno');
  try {
    const u = JSON.parse(localStorage.getItem('geoeduca_user') || '{}');
    u.name = user.nome || 'Aluno';
    u.sala = user.salaNome || '';
    localStorage.setItem('geoeduca_user', JSON.stringify(u));
  } catch (e) { /* ignore */ }

  const games = [
    {
      id: 1, title: 'Bandeira e Estado', category: 'Identificação',
      icon: '🏳️',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      desc: 'Associe o símbolo ao estado brasileiro correto. Teste seu conhecimento sobre as 27 unidades da federação.',
      dificuldade: 'Fácil', tempoMedio: '2 min'
    },
    {
      id: 2, title: 'Encontre a Capital', category: 'Capitais',
      icon: '🏛️',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      desc: 'Identifique a capital correta para cada estado. Do Acre ao Tocantins, você sabe todas?',
      dificuldade: 'Médio', tempoMedio: '3 min'
    },
    {
      id: 3, title: 'Quiz de Siglas', category: 'Quiz',
      icon: '🔤',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      desc: 'Reconheça o estado pela sigla. Crie combos de acertos para ganhar pontos extras!',
      dificuldade: 'Fácil', tempoMedio: '2 min'
    },
    {
      id: 4, title: 'Memória dos Biomas', category: 'Memória',
      icon: '🌿',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      desc: 'Vire as cartas e encontre os pares: nome do bioma e sua característica principal.',
      dificuldade: 'Médio', tempoMedio: '4 min'
    },
    {
      id: 5, title: 'Ordenando por Região', category: 'Regiões',
      icon: '🗺️',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
      desc: 'Classifique os estados nas 5 regiões do Brasil: Norte, Nordeste, Centro-Oeste, Sudeste e Sul.',
      dificuldade: 'Fácil', tempoMedio: '3 min'
    },
    {
      id: 6, title: 'Hidrografias', category: 'Rios',
      icon: '🌊',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
      desc: 'Identifique os principais rios brasileiros pelas suas características e extensão.',
      dificuldade: 'Difícil', tempoMedio: '3 min'
    },
    {
      id: 7, title: 'Desafio da Posição', category: 'Orientação',
      icon: '🧭',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)',
      desc: 'Responda perguntas sobre a posição geográfica dos estados e suas relações de vizinhança.',
      dificuldade: 'Difícil', tempoMedio: '4 min'
    },
    {
      id: 8, title: 'Caça-Palavras', category: 'Vocabulário',
      icon: '🔍',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
      desc: 'Encontre capitais e estados brasileiros escondidos na grade de letras.',
      dificuldade: 'Médio', tempoMedio: '5 min'
    },
    {
      id: 9, title: 'Complete a Capital', category: 'Digitação',
      icon: '✍️',
      gradient: 'linear-gradient(135deg, #84cc16 0%, #3f6212 100%)',
      desc: 'Complete o nome correto da capital com base na dica do estado e região.',
      dificuldade: 'Médio', tempoMedio: '4 min'
    },
    {
      id: 10, title: 'Fronteiras com Cronômetro', category: 'Fronteiras',
      icon: '⏱️',
      gradient: 'linear-gradient(135deg, #d946ef 0%, #7e22ce 100%)',
      desc: 'Marque todos os estados vizinhos antes do tempo acabar!',
      dificuldade: 'Difícil', tempoMedio: '5 min'
    },
    {
      id: "'brazilguessr'", title: 'BrazilGuessr', category: 'Geografia',
      icon: '📍',
      gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      desc: 'Explore o Street View e adivinhe em qual local do Brasil você está. Jogo imersivo com mapa interativo!',
      dificuldade: 'Médio', tempoMedio: '2 min/rodada'
    },
    {
      id: "'missao_brasil'", title: 'Missão Brasil', category: 'Geografia',
      icon: '🇧🇷',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      desc: 'Aprenda bandeiras, capitais e biomas dos 27 estados. Suba patentes e complete seu álbum!',
      dificuldade: 'Médio', tempoMedio: 'Livre'
    }
  ];

  const difCor = {
    'Fácil':  { bg: 'var(--color-success-light)', c: 'var(--color-success)', b: 'rgba(39,103,73,.3)' },
    'Médio':  { bg: 'var(--color-warning-light)', c: 'var(--color-warning)', b: 'rgba(214,158,46,.3)' },
    'Difícil':{ bg: 'var(--color-danger-light)',  c: 'var(--color-danger)',  b: 'rgba(197,48,48,.3)' }
  };

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

  function renderGames() {
    const grid = document.getElementById('games-grid');
    grid.innerHTML = games.map(g => {
      const d = difCor[g.dificuldade];
      return `
        <div class="game-card" onclick="playGame(${g.id}, '${g.title.replace(/'/g, "\\'")}')" tabindex="0"
          onkeydown="if(event.key==='Enter')playGame(${g.id},'${g.title.replace(/'/g, "\\'")}')">
          <div class="game-thumb" style="${g.gradient}">
            <div class="game-thumb-overlay">
              <span class="game-category">${g.category}</span>
            </div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
              font-size:44px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.25))">${g.icon}</div>
          </div>
          <div class="game-info">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
                background:${d.bg};color:${d.c};border:1px solid ${d.b};
                padding:2px 8px;border-radius:var(--radius-sm)">${g.dificuldade}</span>
              <span style="font-size:11px;color:var(--color-text-muted);font-weight:500">⏱ ${g.tempoMedio}</span>
            </div>
            <h3 class="game-title">${g.title}</h3>
            <p class="game-desc">${g.desc}</p>
            <div class="game-footer">
              <span style="font-size:12px;color:var(--color-text-muted);">Jogo educativo</span>
              <button class="play-btn" aria-label="Jogar ${g.title}">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  async function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;

    const nomeUsuario = user.nome || 'Aluno';
    const medalhas = ['🥇', '🥈', '🥉'];

    try {
      let ranking = await api.get('/alunos/ranking/turma');
      if (!Array.isArray(ranking)) ranking = [];

      const ptsLocal = pontosJogosLocal(nomeUsuario);
      if (ptsLocal > 0) {
        const eu = ranking.find(r => r.voce);
        if (eu) eu.pontos += ptsLocal;
        else ranking.push({ nome: nomeUsuario, pontos: ptsLocal, voce: true, salaNome: user.salaNome || '' });
        ranking.sort((a, b) => b.pontos - a.pontos);
        ranking = ranking.slice(0, 6);
      }

      if (ranking.length === 0) {
        list.innerHTML = `
          <div style="padding:1rem;text-align:center;color:var(--color-text-muted);font-size:0.85rem;line-height:1.5;">
            Nenhuma pontuação na turma ainda. Jogue e responda quizzes para aparecer aqui.
          </div>`;
        return;
      }

      list.innerHTML = ranking.map((u, i) => {
        const initials = (u.nome || '?').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
        return `
      <div class="rank-item" style="${u.voce ? 'background:rgba(204,164,59,.08);border:1px solid rgba(204,164,59,.25);' : ''}">
        <div class="rank-pos">${medalhas[i] || (i + 1)}</div>
        <div class="rank-avatar" style="${u.voce ? 'background:var(--gold);color:var(--navy);' : ''}">${initials}</div>
        <div class="rank-info">
          <div class="rank-name" style="${u.voce ? 'color:var(--gold);font-weight:700;' : ''}">${u.nome}${u.voce ? ' ← você' : ''}</div>
          <div class="rank-score">${u.pontos.toLocaleString('pt-BR')} pts${u.salaNome ? ` · ${u.salaNome}` : ''}</div>
        </div>
      </div>`;
      }).join('');
    } catch (err) {
      console.error(err);
      list.innerHTML = `
        <div style="padding:1rem;text-align:center;color:var(--color-text-muted);font-size:0.85rem;">
          Não foi possível carregar o ranking.
        </div>`;
    }
  }

  window.playGame = (id, title) => {
    if (id === 'brazilguessr') {
      window.location.href = 'hub_brazilguessr.html';
      return;
    }
    if (id === 'missao_brasil') {
      window.location.href = 'missao_brasil.html';
      return;
    }
    if (typeof j3Combo !== 'undefined') j3Combo = 0;
    if (window.abrirJogo) window.abrirJogo(id, title);
    else alert('Motor de jogos não carregado!');
  };

  const orig = window.fecharJogo;
  if (orig) {
    window.fecharJogo = function () {
      orig();
      renderLeaderboard();
    };
  }

  renderGames();
  renderLeaderboard();
});
