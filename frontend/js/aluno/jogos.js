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
      id: 4, title: 'Memória dos Biomas', category: 'Memória',
      icon: '<i class="fa-solid fa-leaf"></i>',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      desc: 'Vire as cartas e encontre os pares: nome do bioma e sua característica principal.',
      dificuldade: 'Médio', tempoMedio: '4 min'
    },
    {
      id: 5, title: 'Ordenando por Região', category: 'Regiões',
      icon: '<i class="fa-solid fa-map"></i>',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
      desc: 'Classifique os estados nas 5 regiões do Brasil: Norte, Nordeste, Centro-Oeste, Sudeste e Sul.',
      dificuldade: 'Fácil', tempoMedio: '3 min'
    },
    {
      id: 6, title: 'Hidrografias', category: 'Rios',
      icon: '<i class="fa-solid fa-water"></i>',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
      desc: 'Identifique os principais rios brasileiros pelas suas características e extensão.',
      dificuldade: 'Difícil', tempoMedio: '3 min'
    },
    {
      id: 7, title: 'Desafio da Posição', category: 'Orientação',
      icon: '<i class="fa-regular fa-compass"></i>',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)',
      desc: 'Responda perguntas sobre a posição geográfica dos estados e suas relações de vizinhança.',
      dificuldade: 'Difícil', tempoMedio: '4 min'
    },
    {
      id: 8, title: 'Caça-Palavras', category: 'Vocabulário',
      icon: '<i class="fa-solid fa-magnifying-glass"></i>',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
      desc: 'Encontre capitais e estados brasileiros escondidos na grade de letras.',
      dificuldade: 'Médio', tempoMedio: '5 min'
    },
    {
      id: 9, title: 'Complete a Capital', category: 'Digitação',
      icon: '<i class="fa-solid fa-pen-nib"></i>',
      gradient: 'linear-gradient(135deg, #84cc16 0%, #3f6212 100%)',
      desc: 'Complete o nome correto da capital com base na dica do estado e região.',
      dificuldade: 'Médio', tempoMedio: '4 min'
    },
    {
      id: 10, title: 'Fronteiras com Cronômetro', category: 'Fronteiras',
      icon: '<i class="fa-solid fa-stopwatch"></i>',
      gradient: 'linear-gradient(135deg, #d946ef 0%, #7e22ce 100%)',
      desc: 'Marque todos os estados vizinhos antes do tempo acabar!',
      dificuldade: 'Difícil', tempoMedio: '5 min'
    },
    {
      id: "'brazilguessr'", title: 'BrazilGuessr', category: 'Geografia',
      icon: '<i class="fa-solid fa-location-dot"></i>',
      gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      desc: 'Explore o Street View e adivinhe em qual local do Brasil você está. Jogo imersivo com mapa interativo!',
      dificuldade: 'Médio', tempoMedio: '2 min/rodada'
    },
    {
      id: "'missao_brasil'", title: 'Missão Brasil', category: 'Geografia',
      icon: '<i class="fa-solid fa-earth-americas"></i>',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      desc: 'Aprenda bandeiras, capitais e biomas dos 27 estados. Suba patentes e complete seu álbum!',
      dificuldade: 'Médio', tempoMedio: 'Livre'
    },
    {
      id: "'detetive_brasil'", title: 'Detetive do Brasil', category: 'Geografia',
      icon: '<i class="fa-solid fa-user-secret"></i>',
      gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      desc: 'Persiga um criminoso pelo Brasil usando pistas culturais e geográficas!',
      dificuldade: 'Médio', tempoMedio: '10 min'
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
              font-size:48px;color:rgba(255,255,255,0.95);filter:drop-shadow(0 4px 12px rgba(0,0,0,.3))">${g.icon}</div>
          </div>
          <div class="game-info">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
                background:${d.bg};color:${d.c};border:1px solid ${d.b};
                padding:2px 8px;border-radius:var(--radius-sm)"><i class="fa-solid fa-layer-group" style="margin-right:4px;opacity:0.8"></i>${g.dificuldade}</span>
              <span style="font-size:11px;color:var(--color-text-muted);font-weight:600"><i class="fa-regular fa-clock" style="margin-right:4px"></i>${g.tempoMedio}</span>
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

  function renderCharacterSelector() {
    const grid = document.getElementById('character-grid');
    const preview = document.getElementById('character-preview');
    const charImg = document.getElementById('char-img');
    
    if (!grid) return;

    const chars = [
      { id: 'maloka', name: 'Maloka' },
      { id: 'escot', name: 'Escoteiro' },
      { id: 'terno', name: 'Terno' },
      { id: 'brasa', name: 'Brasil' },
      { id: 'classic', name: 'Clássico' },
      { id: 'bone', name: 'Boné' }
    ];
    
    // Load saved character or default
    let selectedChar = localStorage.getItem('geoeduca_character') || 'maloka';

    function updatePreview(id) {
      charImg.src = `../assets/personagens/${id}_1.webp`;
      preview.style.display = 'flex';
      
      // Update UI selection
      document.querySelectorAll('.char-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === id);
      });
    }

    grid.innerHTML = chars.map(c => `
      <div class="char-option ${c.id === selectedChar ? 'selected' : ''}" data-id="${c.id}">
        <img src="../assets/personagens/${c.id}_1.webp" alt="${c.name}" />
        <span>${c.name}</span>
      </div>
    `).join('');

    // Attach click events
    document.querySelectorAll('.char-option').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        selectedChar = id;
        localStorage.setItem('geoeduca_character', id);
        updatePreview(id);
      });
    });

    // Initial preview
    if (selectedChar) {
      updatePreview(selectedChar);
    }
  }

  window.playGame = (id, title) => {
    
    if (id === 4) {
      window.location.href = 'memoria_biomas.html';
      return;
    }
    if (id === 5) {
      window.location.href = 'ordenando_regioes.html';
      return;
    }
    if (id === 6) {
      window.location.href = 'hidrografias.html';
      return;
    }
    if (id === 7) {
      window.location.href = 'desafio_posicao.html';
      return;
    }
    if (id === 8) {
      window.location.href = 'caca_palavras.html';
      return;
    }
    if (id === 9) {
      window.location.href = 'complete_capital.html';
      return;
    }
    if (id === 10) {
      window.location.href = 'fronteiras_cronometro.html';
      return;
    }
    if (id === 'brazilguessr') {
      window.location.href = 'hub_brazilguessr.html';
      return;
    }
    if (id === 'missao_brasil') {
      window.location.href = 'missao_brasil.html';
      return;
    }
    if (id === 'detetive_brasil') {
      window.location.href = '../detetive-brasil.html';
      return;
    }
  };

  const orig = window.fecharJogo;
  if (orig) {
    window.fecharJogo = function () {
      orig();
      renderCharacterSelector();
    };
  }

  renderGames();
  renderCharacterSelector();
});
