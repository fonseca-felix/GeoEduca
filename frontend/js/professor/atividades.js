document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildProfessorSidebar());
  const user = initPage('prof');
  if (!user) return;

  // ─── Estado ────────────────────────────────────────────────
  let atividades = [];
  let salas      = [];
  let alunos     = [];

  // Ordem das salas
  const SALA_ORDER = [
    '6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B',
    '8º Ano A', '8º Ano B', '9º Ano A', '9º Ano B',
    '1ª Série A', '1ª Série B', '2ª Série A', '2ª Série B',
    '3ª Série A', '3ª Série B'
  ];

  function sortSalas(lista) {
    return [...lista].sort((a, b) => {
      const ia = SALA_ORDER.indexOf(a.nome);
      const ib = SALA_ORDER.indexOf(b.nome);
      if (ia === -1 && ib === -1) return a.nome.localeCompare(b.nome);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  // ─── Config por tipo ────────────────────────────────────────
  const TIPO_CONFIG = {
    video:       { emoji: '🎬', label: 'Vídeo',          badgeClass: 'badge-video',       iconClass: 'type-video' },
    infografico: { emoji: '🖼️', label: 'Infográfico',    badgeClass: 'badge-infografico', iconClass: 'type-infografico' },
    site:        { emoji: '🌐', label: 'Site',            badgeClass: 'badge-site',        iconClass: 'type-site' },
    tarefa:      { emoji: '📝', label: 'Tarefa',          badgeClass: 'badge-tarefa',      iconClass: 'type-tarefa' }
  };

  // ─── Carregamento inicial ───────────────────────────────────
  async function loadData() {
    try {
      const [salasRes, atividadesRes, alunosRes] = await Promise.all([
        api.get('/salas'),
        api.get('/atividades'),
        api.get('/alunos')
      ]);

      salas      = sortSalas(salasRes);
      atividades = atividadesRes;
      alunos     = alunosRes;

      populateSalaSelects();
      renderActAlunosList();
      renderAtividades();
    } catch (err) {
      console.error(err);
      Toast.error('Erro ao carregar', 'Verifique se o servidor está rodando.');
    }
  }

  function populateSalaSelects() {
    // Filtro
    const filterSala = document.getElementById('filterSala');
    if (filterSala) {
      filterSala.innerHTML =
        '<option value="">Todas as Salas</option>' +
        salas.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    }
    // Modal select
    const actSala = document.getElementById('actSala');
    if (actSala) {
      actSala.innerHTML =
        '<option value="" disabled selected>Selecione...</option>' +
        salas.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    }
  }

  // ─── Render cards ───────────────────────────────────────────
  function renderAtividades() {
    const container   = document.getElementById('activities-container');
    const searchTerm  = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const filterSala  = document.getElementById('filterSala')?.value || '';
    const filterTipo  = document.getElementById('filterTipo')?.value || '';

    const filtered = atividades.filter(a => {
      const matchSearch = a.titulo.toLowerCase().includes(searchTerm) ||
                          (a.descricao || '').toLowerCase().includes(searchTerm);
      const matchSala   = !filterSala || a.salaId === filterSala;
      const matchTipo   = !filterTipo || a.tipo === filterTipo;
      return matchSearch && matchSala && matchTipo;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>Nenhuma atividade encontrada</h3>
          <p>Crie a primeira atividade clicando em "Nova Atividade".</p>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map(a => buildCard(a)).join('');
  }

  function buildCard(a) {
    const cfg = TIPO_CONFIG[a.tipo] || TIPO_CONFIG.tarefa;

    // Data de entrega
    let dateHtml = '';
    if (a.dataEntrega) {
      const dt      = new Date(a.dataEntrega + 'T00:00:00');
      const today   = new Date(); today.setHours(0,0,0,0);
      const overdue = dt < today;
      const fmt     = dt.toLocaleDateString('pt-BR');
      dateHtml = `
        <span class="activity-meta-item ${overdue ? 'date-overdue' : ''}">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          ${overdue ? '⚠️ ' : ''}Entrega: ${fmt}
        </span>`;
    }

    // Aula de entrega (só tarefa)
    const aulaHtml = a.dataAula ? `
      <span class="activity-meta-item">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        ${a.dataAula}
      </span>` : '';

    // Link
    const linkHtml = a.link ? `
      <a href="${a.link}" target="_blank" rel="noopener" class="btn btn-outline" style="flex:1;font-size:0.82rem;padding:0.45rem 0.75rem;">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        Abrir
      </a>` : `<span style="flex:1;"></span>`;

    return `
      <div class="activity-card">
        <div class="activity-card-top">
          <div class="activity-type-icon ${cfg.iconClass}">${cfg.emoji}</div>
          <div class="activity-card-info">
            <div class="activity-card-title" title="${a.titulo}">${a.titulo}</div>
            <span class="activity-type-badge ${cfg.badgeClass}">${cfg.label}</span>
          </div>
        </div>
        <div class="activity-card-body">
          ${a.descricao ? `<p class="activity-desc">${a.descricao}</p>` : ''}
          <div class="activity-meta-row">
            <span class="activity-meta-item">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              ${a.salaNome || '—'}
            </span>
            ${dateHtml}
            ${aulaHtml}
          </div>
        </div>
        <div class="activity-card-footer">
          ${linkHtml}
          <button class="btn-icon-sm" title="Excluir atividade" onclick="deleteAtividade('${a.id}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>`;
  }

  function renderActAlunosList() {
    const list = document.getElementById('actAlunosList');
    if (!list) return;
    if (!alunos.length) {
      list.innerHTML = '<div style="color:#6b7280;">Nenhum aluno cadastrado.</div>';
      return;
    }
    list.innerHTML = alunos.map(a => `
      <label style="display:flex;gap:0.6rem;align-items:center;margin-bottom:0.75rem;cursor:pointer;">
        <input type="checkbox" data-aluno-id="${a.id}" />
        <div>
          <div style="font-weight:600;color:#111827;">${a.nome}</div>
          <div style="font-size:0.78rem;color:#6b7280;">RM: ${a.rm} • ${a.salaNome || ''}</div>
        </div>
      </label>
    `).join('');
  }

  window.syncActDestinoBlocks = function() {
    const type = document.querySelector('input[name="actDestinoType"]:checked')?.value || 'sala';
    const salaBlock = document.getElementById('actDestinoSalaBlock');
    const alunosBlock = document.getElementById('actDestinoAlunosBlock');
    if (salaBlock) salaBlock.style.display = type === 'sala' ? 'block' : 'none';
    if (alunosBlock) alunosBlock.style.display = type === 'alunos' ? 'block' : 'none';
  };

  // ─── Seletor de tipo (global para o HTML) ───────────────────
  window.selectTipo = function(tipo) {
    // Guardar valor
    document.getElementById('selectedTipo').value = tipo;

    // Atualizar botões
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.className = 'type-btn';
      if (btn.dataset.type === tipo) {
        btn.classList.add(`selected-${tipo}`);
      }
    });

    // Mostrar/ocultar campos dinâmicos
    const hasLink = ['video', 'infografico', 'site'].includes(tipo);
    document.getElementById('field-link').style.display = hasLink ? 'block' : 'none';
    document.getElementById('field-aula').style.display = tipo === 'tarefa' ? 'block' : 'none';
    document.getElementById('actLink').required = hasLink;

    // Ajustar labels
    document.getElementById('label-desc').innerHTML =
      tipo === 'tarefa'
        ? 'Critérios / O que o aluno deve fazer <span style="color:#ef4444">*</span>'
        : 'Descrição';
    document.getElementById('label-data').textContent =
      tipo === 'tarefa' ? 'Data de Entrega Presencial' : 'Data de Entrega';
    document.getElementById('actDescricao').required = tipo === 'tarefa';
  };

  // ─── Submit ─────────────────────────────────────────────────
  window.submitAtividade = async function() {
    const tipo     = document.getElementById('selectedTipo').value;
    const titulo   = document.getElementById('actTitulo').value.trim();
    const link     = document.getElementById('actLink').value.trim();
    const descricao= document.getElementById('actDescricao').value.trim();
    const aula     = document.getElementById('actAula').value.trim();
    const destinoType = document.querySelector('input[name="actDestinoType"]:checked')?.value || 'sala';
    const salaId   = document.getElementById('actSala').value;
    const data     = document.getElementById('actData').value;

    // Validações
    if (!tipo)   { Toast.error('Tipo obrigatório', 'Selecione o tipo de atividade.'); return; }
    if (!titulo) { Toast.error('Título obrigatório', 'Preencha o título da atividade.'); return; }

    let payload = { titulo, tipo, link, descricao, dataEntrega: data, dataAula: aula };

    if (destinoType === 'sala') {
      if (!salaId) { Toast.error('Sala obrigatória', 'Selecione a sala de destino.'); return; }
      payload.salaId = salaId;
    } else {
      const selected = Array.from(document.querySelectorAll('#actAlunosList input[type="checkbox"]:checked'))
        .map(el => el.getAttribute('data-aluno-id'));
      if (!selected.length) {
        Toast.error('Selecione alunos', 'Marque pelo menos um aluno.');
        return;
      }
      payload.alunoIds = selected;
    }
    if (['video','infografico','site'].includes(tipo) && !link) {
      Toast.error('Link obrigatório', 'Insira o link para este tipo de atividade.');
      return;
    }
    if (tipo === 'tarefa' && !descricao) {
      Toast.error('Critérios obrigatórios', 'Descreva o que o aluno deve produzir.');
      return;
    }

    const btn = document.getElementById('btnSalvar');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      const nova = await api.post('/atividades', payload);

      atividades.unshift(nova);
      renderAtividades();
      Modal.close('modal-atividade');
      resetModal();
      Toast.success('Atividade criada!', `"${titulo}" enviada para a sala.`);
    } catch (err) {
      console.error(err);
      Toast.error('Erro ao criar', err.message || 'Verifique o servidor.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Criar Atividade';
    }
  };

  function resetModal() {
    document.getElementById('form-atividade').reset();
    const salaRadio = document.querySelector('input[name="actDestinoType"][value="sala"]');
    if (salaRadio) salaRadio.checked = true;
    syncActDestinoBlocks();
    document.getElementById('selectedTipo').value = '';
    document.querySelectorAll('.type-btn').forEach(b => b.className = 'type-btn');
    document.getElementById('field-link').style.display = 'none';
    document.getElementById('field-aula').style.display = 'none';
    document.getElementById('actLink').required = false;
    document.getElementById('actDescricao').required = false;
    document.getElementById('label-desc').innerHTML = 'Descrição';
    document.getElementById('label-data').textContent = 'Data de Entrega';
  }

  // ─── Delete ─────────────────────────────────────────────────
  window.deleteAtividade = function(id) {
    Confirm.show(
      'Excluir Atividade',
      'Tem certeza? Esta ação é permanente e os alunos perderão o acesso.',
      async () => {
        try {
          await api.delete('/atividades/' + id);
          atividades = atividades.filter(a => a.id !== id);
          renderAtividades();
          Toast.success('Excluída!', 'Atividade removida com sucesso.');
        } catch (err) {
          Toast.error('Erro ao excluir', err.message || 'Tente novamente.');
        }
      },
      true
    );
  };

  // ─── Filtros ────────────────────────────────────────────────
  document.getElementById('searchInput')?.addEventListener('input', renderAtividades);
  document.getElementById('filterSala')?.addEventListener('change', renderAtividades);
  document.getElementById('filterTipo')?.addEventListener('change', renderAtividades);

  // ─── Init ───────────────────────────────────────────────────
  loadData();
});
