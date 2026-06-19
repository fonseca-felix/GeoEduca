document.addEventListener('DOMContentLoaded', () => {
  // Inject sidebar BEFORE initPage
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildProfessorSidebar());
  
  const user = initPage('prof');
  if (!user) return; // redirect handled in auth

  // Modal/Toast — already provided by ui.js, use as-is
  // (Modal uses .modal-overlay + .open class)

  // Ordem correta das salas
  const SALA_ORDER = [
    '6\u00ba Ano A', '6\u00ba Ano B',
    '7\u00ba Ano A', '7\u00ba Ano B',
    '8\u00ba Ano A', '8\u00ba Ano B',
    '9\u00ba Ano A', '9\u00ba Ano B',
    '1\u00aa S\u00e9rie A', '1\u00aa S\u00e9rie B',
    '2\u00aa S\u00e9rie A', '2\u00aa S\u00e9rie B',
    '3\u00aa S\u00e9rie A', '3\u00aa S\u00e9rie B'
  ];

  function sortSalas(lista) {
    return [...lista].sort((a, b) => {
      const idxA = SALA_ORDER.indexOf(a.nome);
      const idxB = SALA_ORDER.indexOf(b.nome);
      if (idxA === -1 && idxB === -1) return a.nome.localeCompare(b.nome);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  let salas = [];

  async function loadSalas() {
    try {
      const [salasData, alunosData] = await Promise.all([
        api.get('/salas'),
        api.get('/alunos')
      ]);

      const colors = [
          'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'
      ];

      // Count alunos per sala
      const contagemPorSala = {};
      alunosData.forEach(a => {
        contagemPorSala[a.salaId] = (contagemPorSala[a.salaId] || 0) + 1;
      });
      
      const sorted = sortSalas(salasData);
      salas = sorted.map((s, index) => ({
        id: s.id,
        nome: s.nome,
        assunto: s.assunto || 'Ensino de Geografia',
        alunos: contagemPorSala[s.id] || 0,
        quizzes: 0,
        codigo: s.id.substring(0, 6).toUpperCase(),
        cor: colors[index % colors.length]
      }));
      
      renderRooms();
    } catch (e) {
      console.error(e);
      Toast.error('Erro ao carregar salas', 'Verifique se o servidor está rodando.');
    }
  }

  const roomsContainer = document.getElementById('rooms-container');
  const searchInput = document.getElementById('searchRoom');
  const addRoomForm = document.getElementById('addRoomForm');

  function renderRooms() {
    if(!roomsContainer) return;

    const searchTerm = searchInput.value.toLowerCase();
    const filtered = salas.filter(s => 
      s.nome.toLowerCase().includes(searchTerm) || 
      s.assunto.toLowerCase().includes(searchTerm) ||
      s.codigo.toLowerCase().includes(searchTerm)
    );

    roomsContainer.innerHTML = filtered.map(s => `
      <div class="room-card">
        <div class="room-header" style="background: ${s.cor};">
          <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.2); padding: 0.25rem; border-radius: 8px; backdrop-filter: blur(4px);">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <h3 class="room-title">${s.nome}</h3>
          <p class="room-subtitle">${s.assunto}</p>
        </div>
        <div class="room-body">
          <div class="room-stat">
            <span class="room-stat-label">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              Alunos Inscritos
            </span>
            <span class="room-stat-value">${s.alunos}</span>
          </div>
          <div class="room-stat">
            <span class="room-stat-label">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              Quizzes Ativos
            </span>
            <span class="room-stat-value">${s.quizzes}</span>
          </div>
        </div>
        <div class="room-footer">
          <button class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.875rem;" onclick="window.location.href='alunos.html'">Ver Alunos</button>
          <div class="room-code" title="Clique para copiar" onclick="window.copyCode('${s.codigo}')">
            ${s.codigo}
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          </div>
        </div>
      </div>
    `).join('');

    if(filtered.length === 0) {
      roomsContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: #6b7280; background: var(--bg-surface, #fff); border-radius: 12px; border: 1px dashed #d1d5db;">Nenhuma sala encontrada.</div>`;
    }
  }

  // Generate random 6 char code
  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for(let i=0; i<6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Global scope function for HTML inline handler
  window.copyCode = function(code) {
    navigator.clipboard.writeText(code).then(() => {
      Toast.success(`Código da sala ${code} copiado!`);
    }).catch(() => {
      Toast.error('Falha ao copiar o código.');
    });
  };

  // Events
  if(searchInput) searchInput.addEventListener('input', renderRooms);

  if(addRoomForm) {
    addRoomForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome    = document.getElementById('roomName').value.trim();
      const serie   = document.getElementById('roomSerie').value.trim();
      const turma   = document.getElementById('roomTurma').value.trim();
      const assunto = document.getElementById('roomSubject').value.trim();

      if (!nome || !serie || !turma) {
        Toast.error('Campos obrigatórios', 'Preencha Nome, Série e Turma.');
        return;
      }

      const saveBtn = document.getElementById('saveRoomBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Salvando...';

      try {
        await api.post('/salas', { nome, serie, turma, assunto });
        Modal.close('addRoomModal');
        addRoomForm.reset();
        await loadSalas();
        Toast.success('Sala criada!', `"${nome}" adicionada com sucesso.`);
      } catch (err) {
        console.error(err);
        Toast.error('Erro ao criar sala', err.message || 'Verifique o servidor.');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Criar Sala';
      }
    });
  }

  // Init
  loadSalas();
});
