document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildProfessorSidebar());
  const user = initPage('prof');
  if (!user) return;

  let provas = [];
  let salas = [];
  let alunos = [];
  let currentSendProvaId = null;

  // Ordem pedagógica das salas (6º Ano A até Ensino Médio)
  const SALA_ORDER = [
    '6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B',
    '8º Ano A', '8º Ano B', '9º Ano A', '9º Ano B',
    '1ª Série A', '1ª Série B', '2ª Série A', '2ª Série B',
    '3ª Série A', '3ª Série B'
  ];

  function sortSalas(lista) {
    if (!Array.isArray(lista)) return [];
    function normalize(str) {
      return (str || '').toLowerCase().replace(/[º°ª]/g, '').replace(/\s+/g, ' ').trim();
    }
    const normalizedOrder = SALA_ORDER.map(normalize);

    function getIndex(nome) {
      const norm = normalize(nome);
      const idx = normalizedOrder.indexOf(norm);
      if (idx !== -1) return idx;
      for (let i = 0; i < normalizedOrder.length; i++) {
        if (norm === normalizedOrder[i] || norm.startsWith(normalizedOrder[i])) return i;
      }
      return -1;
    }

    return [...lista].sort((a, b) => {
      const ia = getIndex(a.nome);
      const ib = getIndex(b.nome);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { numeric: true, sensitivity: 'base' });
    });
  }
  
  // Variáveis para o fluxo de criação
  let creationData = {
    titulo: '',
    imagem: '',
    rubrica: '',
    numQuestoes: 0,
    questoes: []
  };
  let currentQuestionIndex = 0;

  // Variáveis para correção
  let currentGradingProvaId = null;
  let currentProvaQuestoes = [];
  let currentGradingResponses = [];
  let currentSelectedStudentData = null;
  let currentQuestionScores = {};

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }

  async function loadInitialData() {
    try {
      const [provasRes, salasRes, alunosRes] = await Promise.all([
        api.get('/provas'),
        api.get('/salas'),
        api.get('/alunos')
      ]);
      provas = provasRes || [];
      salas = sortSalas(salasRes);
      alunos = (alunosRes || []).sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
      
      renderProvas();
      populateGradingSalas();
    } catch (err) {
      console.error(err);
      Toast.error('Erro ao carregar dados', err.message);
    }
  }

  function renderProvas() {
    const container = document.getElementById('exams-container');
    document.getElementById('loadingExams').style.display = 'none';

    if (provas.length === 0) {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 3rem; background: #fff; border-radius:12px; border: 1px dashed #d1d5db; color: #6b7280;">Nenhuma prova criada ainda.</div>';
      return;
    }

    container.innerHTML = provas.map(p => `
      <div class="exam-card" onclick="openGrading('${p.id}', '${p.titulo}')">
        <img src="${p.imagem || 'https://images.pexels.com/photos/2387796/pexels-photo-2387796.jpeg'}" class="exam-img" alt="Capa" onerror="this.src='https://images.pexels.com/photos/2387796/pexels-photo-2387796.jpeg'" />
        <div class="exam-body">
          <div class="exam-title">${p.titulo}</div>
          <div class="exam-stats">${p.questoes ? p.questoes.length : 0} Questões</div>
        </div>
        <div class="exam-footer">
          <span style="font-size:0.875rem; font-weight:600; color:#10b981;">Corrigir Respostas &rarr;</span>
            <button class="btn btn-outline" style="padding:0.35rem 0.65rem; font-size:0.75rem; border-color: transparent; background: #e0e7ff; color: #4338ca;" onclick="event.stopPropagation(); openExamReports('${p.id}', '${p.titulo}')" title="Ver gráficos e relatórios">
              <i class="fa-solid fa-chart-pie"></i> Gráficos
            </button>
          <button class="btn btn-outline" style="padding:0.35rem 0.65rem; font-size:0.75rem;" onclick="event.stopPropagation(); openSendProva('${p.id}')" title="Enviar prova para alunos/sala">
            Enviar
          </button>
          <button class="btn-close" onclick="event.stopPropagation(); deleteProva('${p.id}')" title="Excluir Prova">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  window.deleteProva = function(id) {
    Confirm.show('Excluir Prova', 'Tem certeza? Isso apagará a prova e todas as respostas.', async () => {
      try {
        await api.delete('/provas/' + id);
        provas = provas.filter(p => p.id !== id);
        renderProvas();
        Toast.success('Prova excluída.');
      } catch (err) {
        Toast.error('Erro ao excluir', err.message);
      }
    });
  };

  /* ========================================================
     FLUXO DE CRIAÇÃO
  ======================================================== */
  window.startExamCreation = function() {
    creationData = { titulo: '', imagem: '', rubrica: '', numQuestoes: 0, questoes: [] };
    currentQuestionIndex = 0;
    
    document.getElementById('examTitle').value = '';
    document.getElementById('examImage').value = '';
    document.getElementById('examRubric').value = '';
    document.getElementById('examQCount').value = '5';
    
    document.getElementById('step-1').style.display = 'block';
    document.getElementById('footer-step-1').style.display = 'flex';
    document.getElementById('step-question').style.display = 'none';
    document.getElementById('footer-step-question').style.display = 'none';
    
    Modal.open('modal-create-exam');
  };

  window.goToQuestions = function() {
    const title = document.getElementById('examTitle').value.trim();
    const count = parseInt(document.getElementById('examQCount').value, 10);
    const rubrica = document.getElementById('examRubric').value.trim();
    
    if (!title) { Toast.error('Erro', 'O título é obrigatório.'); return; }
    if (!rubrica) { Toast.error('Erro', 'A rubrica/instrução é obrigatória.'); return; }
    if (isNaN(count) || count < 1 || count > 50) { Toast.error('Erro', 'Quantidade de questões inválida.'); return; }
    
    creationData.titulo = title;
    creationData.imagem = document.getElementById('examImage').value.trim();
    creationData.rubrica = rubrica;
    creationData.numQuestoes = count;
    
    if (creationData.questoes.length !== count) {
      creationData.questoes = Array.from({ length: count }, () => ({
        tipo: 'alternativa', texto: '', valor: 1, opcoes: ['', '', '', ''], correta: 0
      }));
    }
    
    currentQuestionIndex = 0;
    renderCurrentQuestionForm();
    
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('footer-step-1').style.display = 'none';
    document.getElementById('step-question').style.display = 'block';
    document.getElementById('footer-step-question').style.display = 'flex';
  };

  window.toggleQuestionType = function() {
    const type = document.getElementById('qType').value;
    document.getElementById('objective-fields').style.display = type === 'alternativa' ? 'block' : 'none';
  };

  function saveCurrentQuestionData() {
    const q = creationData.questoes[currentQuestionIndex];
    q.tipo = document.getElementById('qType').value;
    q.texto = document.getElementById('qText').value.trim();
    q.valor = parseFloat(document.getElementById('qValue').value) || 1;
    
    if (q.tipo === 'alternativa') {
      q.opcoes[0] = document.getElementById('qOpt0').value.trim();
      q.opcoes[1] = document.getElementById('qOpt1').value.trim();
      q.opcoes[2] = document.getElementById('qOpt2').value.trim();
      q.opcoes[3] = document.getElementById('qOpt3').value.trim();
      
      const radio = document.querySelector('input[name="qCorrect"]:checked');
      q.correta = radio ? parseInt(radio.value, 10) : 0;
    }
  }

  function renderCurrentQuestionForm() {
    const q = creationData.questoes[currentQuestionIndex];
    document.getElementById('question-indicator').textContent = `Questão ${currentQuestionIndex + 1} de ${creationData.numQuestoes}`;
    
    document.getElementById('qType').value = q.tipo;
    window.toggleQuestionType();

    document.getElementById('qText').value = q.texto;
    document.getElementById('qValue').value = q.valor;
    
    if (q.tipo === 'alternativa') {
      document.getElementById('qOpt0').value = q.opcoes[0] || '';
      document.getElementById('qOpt1').value = q.opcoes[1] || '';
      document.getElementById('qOpt2').value = q.opcoes[2] || '';
      document.getElementById('qOpt3').value = q.opcoes[3] || '';
      
      document.querySelectorAll('input[name="qCorrect"]').forEach(el => {
        el.checked = (parseInt(el.value, 10) === q.correta);
      });
    }

    document.getElementById('btnPrevQ').style.display = currentQuestionIndex === 0 ? 'none' : 'block';
    const isLast = (currentQuestionIndex === creationData.numQuestoes - 1);
    document.getElementById('btnNextQ').textContent = isLast ? 'Salvar Prova' : 'Próxima Questão';
    document.getElementById('btnNextQ').className = isLast ? 'btn btn-primary' : 'btn btn-outline';
  }

  window.prevQuestion = function() {
    saveCurrentQuestionData();
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderCurrentQuestionForm();
    }
  };

  window.nextQuestion = async function() {
    saveCurrentQuestionData();
    
    const q = creationData.questoes[currentQuestionIndex];
    if (!q.texto) { Toast.error('Erro', 'Preencha a pergunta.'); return; }
    if (q.tipo === 'alternativa' && q.opcoes.some(opt => !opt)) { 
      Toast.error('Erro', 'Preencha todas as 4 alternativas.'); return; 
    }

    const isLast = (currentQuestionIndex === creationData.numQuestoes - 1);
    
    if (isLast) {
      const btn = document.getElementById('btnNextQ');
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      try {
        const payload = {
          titulo: creationData.titulo,
          imagem: creationData.imagem,
          rubrica: creationData.rubrica,
          questoes: creationData.questoes.map(q => {
            let questao = { texto: q.texto, tipo: q.tipo, valor: q.valor };
            if (q.tipo === 'alternativa') {
              questao.opcoes = q.opcoes;
              questao.correta = q.opcoes[q.correta]; // Backend espera texto
            }
            return questao;
          })
        };
        const novaProva = await api.post('/provas', payload);
        provas.unshift(novaProva);
        renderProvas();
        Modal.close('modal-create-exam');
        Toast.success('Prova criada com sucesso!');
      } catch(err) {
        Toast.error('Erro ao salvar', err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Prova';
      }
    } else {
      currentQuestionIndex++;
      renderCurrentQuestionForm();
    }
  };


  function setupCustomSelect(wrapperId, inputId, onChangeCallback) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    const display = wrapper.querySelector('.custom-select');
    const optionsContainer = wrapper.querySelector('.custom-select-options');
    const hiddenInput = document.getElementById(inputId);

    const newDisplay = display.cloneNode(true);
    display.parentNode.replaceChild(newDisplay, display);
    const displayText = newDisplay.querySelector('span');

    newDisplay.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
        if (w !== wrapper) w.classList.remove('open');
      });
      wrapper.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
    });

    optionsContainer.addEventListener('click', (e) => {
      const opt = e.target.closest('.custom-option');
      if (!opt) return;
      optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      
      const val = opt.dataset.value;
      hiddenInput.value = val;
      displayText.textContent = opt.textContent;
      wrapper.classList.remove('open');
      
      if(onChangeCallback) onChangeCallback(val);
    });
  }

  function renderCustomSelectOptions(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!items || items.length === 0) {
      container.innerHTML = '<div class="custom-option" data-value="">Nenhuma sala encontrada</div>';
      return;
    }
    const sortedItems = sortSalas(items);
    container.innerHTML = '<div class="custom-option selected" data-value="">Selecione...</div>' + 
      sortedItems.map(s => `<div class="custom-option" data-value="${s.id}">${s.nome}</div>`).join('');
  }

  /* ========================================================
     CORREÇÃO DA PROVA
  ======================================================== */
  function populateGradingSalas() {
    const container = document.getElementById('custom-select-grade-sala-options');
    if (!container) return;
    const sorted = sortSalas(salas);
    container.innerHTML = '<div class="custom-option selected" data-value="">Selecione a sala...</div>' +
      sorted.map(s => `<div class="custom-option" data-value="${s.id}">${s.nome}</div>`).join('');
    setupCustomSelect('custom-select-grade-sala', 'gradeSalaSelect', () => window.loadGradingData());
  }

  // ─────────────────────────────────────────────────────────
  // Enviar Prova (Sala ou múltiplos alunos)
  // ─────────────────────────────────────────────────────────
  function populateSendProvaSalasSelect() {
    renderCustomSelectOptions('custom-select-send-sala-options', salas);
    setupCustomSelect('custom-select-send-sala', 'sendProvaSalaSelect');
  }

  function renderSendProvaAlunosList() {
    const list = document.getElementById('sendProvaAlunosList');
    if (!list) return;
    if (!alunos || alunos.length === 0) {
      list.innerHTML = '<div style="color:#6b7280;">Nenhum aluno encontrado.</div>';
      return;
    }

    const sortedAlunos = [...alunos].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
    list.innerHTML = sortedAlunos.map(a => `
      <label class="send-student-item" style="display:flex; gap:0.6rem; align-items:center; margin-bottom:0.75rem; cursor:pointer;" data-nome="${(a.nome || '').toLowerCase()}">
        <input type="checkbox" data-aluno-id="${a.id}" />
        <div style="display:flex; flex-direction:column;">
          <span style="font-weight:600;color:#0f172a;">${a.nome}</span>
          <span style="font-size:0.78rem;color:#6b7280;">RM: ${a.rm || 'N/A'} • ${a.salaNome || a.sala || ''}</span>
        </div>
      </label>
    `).join('');
  }

  window.filterSendStudents = function() {
    const term = (document.getElementById('sendSearchInput')?.value || '').toLowerCase();
    const items = document.querySelectorAll('#sendProvaAlunosList .send-student-item');
    items.forEach(el => {
      if (el.dataset.nome.includes(term)) {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });
  };

  window.filterGradingStudents = function() {
    const term = (document.getElementById('gradeSearchInput')?.value || '').toLowerCase().trim();
    const items = document.querySelectorAll('#students-list-container .student-grading-card');
    items.forEach(el => {
      const data = el.dataset.nome || '';
      if (!term || data.includes(term)) {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });
  };

  function syncSendProvaBlocks() {
    const type = document.querySelector('input[name="sendProvaTargetType"]:checked')?.value || 'sala';
    const salaBlock = document.getElementById('sendProvaSalaBlock');
    const alunosBlock = document.getElementById('sendProvaAlunosBlock');
    if (salaBlock) salaBlock.style.display = type === 'sala' ? 'block' : 'none';
    if (alunosBlock) alunosBlock.style.display = type === 'alunos' ? 'block' : 'none';
  }

  window.openSendProva = function(provaId) {
    currentSendProvaId = provaId;
    populateSendProvaSalasSelect();
    renderSendProvaAlunosList();

    const salaRadio = document.querySelector('input[name="sendProvaTargetType"][value="sala"]');
    if (salaRadio) salaRadio.checked = true;
    syncSendProvaBlocks();

    Modal.open('modal-send-prova');
  };

  const sendProvaRadios = document.querySelectorAll('input[name="sendProvaTargetType"]');
  sendProvaRadios.forEach(r => {
    r.addEventListener('change', () => syncSendProvaBlocks());
  });

  const btnSendProva = document.getElementById('btnSendProva');
  if (btnSendProva) {
    btnSendProva.addEventListener('click', async () => {
      try {
        if (!currentSendProvaId) {
          Toast.error('Erro', 'Prova não selecionada.');
          return;
        }

        const type = document.querySelector('input[name="sendProvaTargetType"]:checked')?.value || 'sala';
        if (type === 'sala') {
          const salaId = document.getElementById('sendProvaSalaSelect')?.value;
          if (!salaId) {
            Toast.error('Sala obrigatória', 'Selecione a sala de destino.');
            return;
          }
          await api.post('/provas/enviar', { provaId: currentSendProvaId, salaId });
        } else {
          const selected = Array.from(document.querySelectorAll('#sendProvaAlunosList input[type="checkbox"]:checked'))
            .map(el => el.getAttribute('data-aluno-id'));
          if (!selected.length) {
            Toast.error('Selecione alunos', 'Escolha pelo menos um aluno.');
            return;
          }
          await api.post('/provas/enviar', { provaId: currentSendProvaId, alunoIds: selected });
        }

        Modal.close('modal-send-prova');
        Toast.success('Prova enviada com sucesso');
      } catch (err) {
        console.error(err);
        Toast.error('Erro ao enviar', err.message || 'Tente novamente.');
      }
    });
  }

  window.openGrading = function(provaId, provaTitulo) {
    currentGradingProvaId = provaId;
    const prova = provas.find(p => p.id === provaId);
    currentProvaQuestoes = prova ? (prova.questoes || []) : [];

    document.getElementById('grading-title').textContent = `Correção: ${provaTitulo}`;
    document.getElementById('gradeSalaSelect').value = '';
    const salaText = document.getElementById('custom-select-grade-sala-text');
    if (salaText) salaText.textContent = 'Selecione a sala...';
    
    // Reset para view de lista de alunos
    window.backToGradingList();
    
    // Reset estado da lista: solicitar que a professora escolha a sala primeiro
    const loadingEl = document.getElementById('grading-loading');
    const emptyEl = document.getElementById('grading-empty');
    const listContainer = document.getElementById('students-list-container');
    if (loadingEl) loadingEl.style.display = 'none';
    if (listContainer) listContainer.innerHTML = '';
    if (emptyEl) {
      emptyEl.innerHTML = `
        <i class="fa-solid fa-chalkboard-user" style="font-size:2rem; margin-bottom:0.75rem; display:block; color:#94a3b8;"></i>
        Por favor, selecione uma sala acima para ver os alunos que realizaram a prova.
      `;
      emptyEl.style.display = 'block';
    }

    Modal.open('modal-grading');
  };

  window.backToGradingList = function() {
    const listView = document.getElementById('grading-list-view');
    const detailView = document.getElementById('grading-detail-view');
    if (listView) listView.style.display = 'block';
    if (detailView) detailView.style.display = 'none';
    currentSelectedStudentData = null;
    currentQuestionScores = {};
  };

  window.loadGradingData = async function() {
    const salaId = document.getElementById('gradeSalaSelect')?.value || '';
    const loadingEl = document.getElementById('grading-loading');
    const emptyEl = document.getElementById('grading-empty');
    const listContainer = document.getElementById('students-list-container');

    if (!salaId) {
      if (loadingEl) loadingEl.style.display = 'none';
      if (listContainer) listContainer.innerHTML = '';
      if (emptyEl) {
        emptyEl.innerHTML = `
          <i class="fa-solid fa-chalkboard-user" style="font-size:2rem; margin-bottom:0.75rem; display:block; color:#94a3b8;"></i>
          Por favor, selecione uma sala acima para ver os alunos que realizaram a prova.
        `;
        emptyEl.style.display = 'block';
      }
      return;
    }

    if (loadingEl) loadingEl.style.display = 'block';
    if (emptyEl) emptyEl.style.display = 'none';
    if (listContainer) listContainer.innerHTML = '';

    try {
      let data;
      try {
        data = await api.get(`/provas/${currentGradingProvaId}/respostas?salaId=${salaId}`);
      } catch (e1) {
        data = await api.get(`/provas/${currentGradingProvaId}/respostas/sala/${salaId}`);
      }
      const rawList = Array.isArray(data) ? data : [];
      currentGradingResponses = rawList.filter(item => item.respondeu && item.resposta);
      
      if (loadingEl) loadingEl.style.display = 'none';
      if (currentGradingResponses.length === 0) {
        if (emptyEl) {
          emptyEl.innerHTML = `
            <i class="fa-solid fa-inbox" style="font-size:2rem; margin-bottom:0.75rem; display:block; color:#94a3b8;"></i>
            Nenhum aluno desta sala realizou ou entregou a prova ainda.
          `;
          emptyEl.style.display = 'block';
        }
      } else {
        renderGradingList(currentGradingResponses);
      }
    } catch(err) {
      if (loadingEl) loadingEl.style.display = 'none';
      Toast.error('Erro ao carregar', err.message || 'Falha ao buscar entregas');
    }
  };

  function renderGradingList(items) {
    const listContainer = document.getElementById('students-list-container');
    const emptyEl = document.getElementById('grading-empty');
    if (!listContainer) return;

    if (!items || items.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      listContainer.innerHTML = '';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    listContainer.innerHTML = items.map(s => {
      const r = s.resposta || {};
      const status = r.status || 'pendente';
      const isCorrigida = status === 'corrigida';
      const isRevisao = status === 'em_revisao';

      let statusBadge = '';
      if (isCorrigida) {
        const notaExibida = Number(r.notaFinal !== undefined ? r.notaFinal : ((r.notaAutomatica || 0) + (r.notaManual || 0)));
        const notaStr = notaExibida % 1 === 0 ? notaExibida.toFixed(0) : notaExibida.toFixed(1);
        statusBadge = `<span class="badge" style="background:#dcfce7; color:#15803d; border:1px solid #86efac; font-weight:700; padding:5px 12px; border-radius:8px; font-size:0.825rem;">
          <i class="fa-solid fa-check"></i> Corrigida • Nota "${notaStr}"
        </span>`;
      } else if (isRevisao) {
        statusBadge = `<span class="badge" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; font-weight:600; padding:5px 12px; border-radius:8px; font-size:0.825rem;">
          <i class="fa-solid fa-pen"></i> Em Revisão
        </span>`;
      } else {
        statusBadge = `<span class="badge" style="background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; font-weight:600; padding:5px 12px; border-radius:8px; font-size:0.825rem;">
          <i class="fa-solid fa-clock"></i> Pendente
        </span>`;
      }

      const dataFormatada = r.dataEnvio ? new Date(r.dataEnvio).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Recente';

      return `
        <div class="student-grading-card" onclick="openStudentCorrection('${r.id}')" data-nome="${(s.alunoNome || '').toLowerCase()} ${(s.salaNome || '').toLowerCase()}">
          <div style="display:flex; align-items:center; gap:1rem;">
            <div style="width:42px; height:42px; border-radius:10px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.1rem; border:1px solid #dbeafe;">
              ${(s.alunoNome || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div style="font-weight:700; font-size:1rem; color:#0f172a;">${s.alunoNome}</div>
              <div style="font-size:0.825rem; color:#64748b; margin-top:2px;">
                ${s.salaNome || 'Sala Geral'} • RM: ${s.alunoRm || 'N/A'} • Entregue às ${dataFormatada}
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            ${statusBadge}
            <button type="button" class="btn btn-outline" style="padding:0.4rem 0.85rem; font-size:0.8rem; background:#fff;">
              ${isCorrigida ? 'Revisar' : 'Corrigir'} &rarr;
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.openStudentCorrection = function(respostaId) {
    const item = currentGradingResponses.find(x => x.id === respostaId || (x.resposta && x.resposta.id === respostaId));
    if (!item) {
      Toast.error('Erro', 'Entrega não encontrada');
      return;
    }

    currentSelectedStudentData = item;
    currentQuestionScores = {};

    // Switch view
    document.getElementById('grading-list-view').style.display = 'none';
    document.getElementById('grading-detail-view').style.display = 'block';

    const r = item.resposta || {};
    const infoContainer = document.getElementById('detail-student-info');
    if (infoContainer) {
      const dataFormatada = r.dataEnvio ? new Date(r.dataEnvio).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Recente';
      infoContainer.innerHTML = `
        <span style="color:#0f172a; font-size:1.05rem;"><i class="fa-solid fa-user-graduate" style="color:#3b82f6;"></i> ${item.alunoNome}</span>
        <span style="color:#64748b; font-size:0.875rem;">(${item.salaNome || 'Sala'}) • Entregue: ${dataFormatada}</span>
      `;
    }

    renderStudentQuestions(item);
  };

  function renderStudentQuestions(item) {
    const container = document.getElementById('student-questions-container');
    if (!container) return;

    const r = item.resposta || {};
    const respostasAluno = r.respostas || [];

    // Mapear cada questão da prova
    container.innerHTML = currentProvaQuestoes.map((q, idx) => {
      const resp = respostasAluno.find(x => x.questaoId === q.id) || {};
      const valorMax = Number(q.valor !== undefined ? q.valor : 1);
      const isAlternativa = q.tipo === 'alternativa';

      let questaoBodyHtml = '';

      if (isAlternativa) {
        // Inicializar pontuação objetiva: se aluno acertou, ponto inteiro; se errou, 0
        const acertouPadrao = resp.acertou !== undefined ? resp.acertou : (resp.respostaSelecionada === q.correta);
        const notaPrevia = resp.notaAtribuida !== undefined ? Number(resp.notaAtribuida) : (acertouPadrao ? valorMax : 0);
        currentQuestionScores[q.id] = notaPrevia;

        const opcoes = q.opcoes || [];
        const opcoesHtml = opcoes.map((opt, oIdx) => {
          const isSelected = resp.respostaSelecionada === opt || resp.respostaSelecionada === oIdx;
          const isCorrect = q.correta === opt || q.correta === oIdx;
          
          let borderStyle = 'border: 1px solid #e2e8f0; background: #fff;';
          let indicatorIcon = '';
          if (isSelected && isCorrect) {
            borderStyle = 'border: 2px solid #10b981; background: #ecfdf5; font-weight:600; color:#065f46;';
            indicatorIcon = '<span style="color:#10b981; margin-left:auto; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Selecionou (Correta)</span>';
          } else if (isSelected && !isCorrect) {
            borderStyle = 'border: 2px solid #ef4444; background: #fef2f2; font-weight:600; color:#991b1b;';
            indicatorIcon = '<span style="color:#ef4444; margin-left:auto; font-weight:700;"><i class="fa-solid fa-circle-xmark"></i> Selecionou (Incorreta)</span>';
          } else if (isCorrect) {
            borderStyle = 'border: 1px dashed #10b981; background: #f0fdf4; color:#065f46;';
            indicatorIcon = '<span style="color:#10b981; font-size:0.75rem; margin-left:auto;"><i class="fa-solid fa-check"></i> Gabarito Oficial</span>';
          }

          return `
            <div style="padding: 0.65rem 1rem; border-radius: 8px; margin-bottom: 0.4rem; display: flex; align-items: center; ${borderStyle}">
              <span>${escapeHtml(opt)}</span>
              ${indicatorIcon}
            </div>
          `;
        }).join('');

        questaoBodyHtml = `
          <div style="margin-bottom: 1rem;">
            ${opcoesHtml}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.75rem 1rem; border-radius:10px; border:1px solid #e2e8f0; flex-wrap:wrap; gap:0.5rem;">
            <span style="font-size:0.875rem; font-weight:600; color:#334155;">Avaliação da Questão Objetiva:</span>
            <div class="grade-btn-group" id="btn-group-${q.id}">
              <button type="button" class="${currentQuestionScores[q.id] > 0 ? 'active-full' : ''}" onclick="setObjectiveScore('${q.id}', ${valorMax})">
                <i class="fa-solid fa-check"></i> Ponto Inteiro (${valorMax} pts)
              </button>
              <button type="button" class="${currentQuestionScores[q.id] === 0 ? 'active-zero' : ''}" onclick="setObjectiveScore('${q.id}', 0)">
                <i class="fa-solid fa-xmark"></i> 0 pts
              </button>
            </div>
          </div>
        `;
      } else {
        // Discursiva
        const notaPrevia = resp.notaAtribuida !== undefined ? Number(resp.notaAtribuida) : (Number(resp.nota) || 0);
        currentQuestionScores[q.id] = notaPrevia;

        questaoBodyHtml = `
          <div style="margin-bottom: 0.75rem;">
            <label style="font-size:0.8rem; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.04em;">Resposta do Aluno:</label>
            <div class="correction-a-text">${resp.respostaTexto ? escapeHtml(resp.respostaTexto) : '<em style="color:#94a3b8;">Questão deixada em branco pelo aluno.</em>'}</div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.75rem 1rem; border-radius:10px; border:1px solid #e2e8f0; flex-wrap:wrap; gap:0.5rem;">
            <span style="font-size:0.875rem; font-weight:600; color:#334155;">Atribuir Pontuação Discursiva:</span>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <input type="number" step="0.25" min="0" max="${valorMax}" class="form-control" style="width:90px; text-align:center; font-weight:700; font-size:1rem; padding:0.4rem;" value="${notaPrevia}" id="input-disc-${q.id}" oninput="setDiscursiveScore('${q.id}', this.value, ${valorMax})" />
              <span style="font-size:0.875rem; color:#64748b; font-weight:600;">/ ${valorMax} pts</span>
            </div>
          </div>
        `;
      }

      return `
        <div class="correction-item" id="card-q-${q.id}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:0.75rem;">
            <div class="correction-q-text">
              <span style="background:#e0e7ff; color:#4338ca; padding:2px 8px; border-radius:6px; font-size:0.8rem; margin-right:6px;">Questão ${idx + 1}</span>
              ${escapeHtml(q.texto)}
            </div>
            <span style="font-size:0.8rem; font-weight:700; color:#64748b; background:#f1f5f9; padding:4px 10px; border-radius:8px; white-space:nowrap;">
              Vale ${valorMax} pt${valorMax === 1 ? '' : 's'}
            </span>
          </div>
          ${questaoBodyHtml}
        </div>
      `;
    }).join('');

    recalculateFinalGrade();
  }

  window.setObjectiveScore = function(questaoId, pts) {
    currentQuestionScores[questaoId] = pts;
    const group = document.getElementById(`btn-group-${questaoId}`);
    if (group) {
      const btns = group.querySelectorAll('button');
      if (btns[0] && btns[1]) {
        if (pts > 0) {
          btns[0].className = 'active-full';
          btns[1].className = '';
        } else {
          btns[0].className = '';
          btns[1].className = 'active-zero';
        }
      }
    }
    recalculateFinalGrade();
  };

  window.setDiscursiveScore = function(questaoId, value, maxVal) {
    let parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) parsed = 0;
    if (parsed > maxVal) parsed = maxVal;
    currentQuestionScores[questaoId] = parsed;
    recalculateFinalGrade();
  };

  function recalculateFinalGrade() {
    let sumObj = 0;
    let sumDisc = 0;

    currentProvaQuestoes.forEach(q => {
      const pts = Number(currentQuestionScores[q.id]) || 0;
      if (q.tipo === 'alternativa') {
        sumObj += pts;
      } else {
        sumDisc += pts;
      }
    });

    const r = currentSelectedStudentData ? (currentSelectedStudentData.resposta || {}) : {};
    const penalidades = Number(r.penalidadeAntiCola || 0);

    let total = sumObj + sumDisc - penalidades;
    if (total < 0) total = 0;

    const displayGradeEl = document.getElementById('display-final-grade');
    if (displayGradeEl) {
      displayGradeEl.textContent = total % 1 === 0 ? total.toFixed(0) : total.toFixed(1);
    }

    const objEl = document.getElementById('grade-sub-obj');
    if (objEl) objEl.textContent = sumObj % 1 === 0 ? sumObj.toFixed(0) : sumObj.toFixed(1);

    const discEl = document.getElementById('grade-sub-disc');
    if (discEl) discEl.textContent = sumDisc % 1 === 0 ? sumDisc.toFixed(0) : sumDisc.toFixed(1);

    const penalEl = document.getElementById('grade-sub-penal');
    if (penalEl) {
      penalEl.innerHTML = penalidades > 0 ? ` - Penalidade (${penalidades.toFixed(2)} pts)` : '';
    }
  }

  window.saveStudentGrade = async function(novoStatus) {
    if (!currentSelectedStudentData) return;
    const r = currentSelectedStudentData.resposta || {};

    let sumObj = 0;
    let sumDisc = 0;
    const respostasAvaliadas = (r.respostas || []).map(resp => {
      const pts = currentQuestionScores[resp.questaoId] !== undefined 
        ? currentQuestionScores[resp.questaoId] 
        : (resp.acertou ? 1 : 0);
      
      const q = currentProvaQuestoes.find(x => x.id === resp.questaoId);
      if (q && q.tipo === 'alternativa') {
        sumObj += pts;
      } else {
        sumDisc += pts;
      }

      return {
        ...resp,
        notaAtribuida: pts
      };
    });

    const penalidades = Number(r.penalidadeAntiCola || 0);
    let finalGrade = Math.max(0, sumObj + sumDisc - penalidades);
    finalGrade = Math.round(finalGrade * 100) / 100;

    const btnRevisar = document.getElementById('btn-revisar-grade');
    const btnConcluir = document.getElementById('btn-concluir-grade');
    if (btnRevisar) btnRevisar.disabled = true;
    if (btnConcluir) btnConcluir.disabled = true;

    try {
      await api.put(`/provas/respostas/${r.id}/corrigir`, {
        notaManual: sumDisc,
        notaFinal: finalGrade,
        status: novoStatus,
        respostasAvaliadas: respostasAvaliadas
      });

      if (novoStatus === 'corrigida') {
        Toast.success('Correção Concluída!', `A nota final "${finalGrade % 1 === 0 ? finalGrade.toFixed(0) : finalGrade.toFixed(1)}" foi gravada com sucesso.`);
      } else {
        Toast.success('Rascunho Salvo', 'A prova foi marcada como em revisão.');
      }

      // Voltar para a lista e recarregar
      window.backToGradingList();
      window.loadGradingData();
    } catch(err) {
      Toast.error('Erro ao salvar', err.message || 'Tente novamente.');
    } finally {
      if (btnRevisar) btnRevisar.disabled = false;
      if (btnConcluir) btnConcluir.disabled = false;
    }
  };

  // Load on start
  loadInitialData();
});



let currentReportProvaId = null;
let chartsInstances = {};

window.openExamReports = async function(provaId, provaTitulo) {
    currentReportProvaId = provaId;
    document.getElementById('report-title').textContent = `Gráficos: ${provaTitulo}`;
    document.getElementById('reportSalaSelect').value = '';
    
    // Carregar salas no filtro, caso ainda não tenha (copiar do modal de correção)
    const optionsHtml = document.getElementById('custom-select-grade-sala-options').innerHTML;
    document.getElementById('custom-select-report-sala-options').innerHTML = '<div class="custom-select-item" data-value="">Todas as salas (Geral)</div>' + optionsHtml;
    document.getElementById('custom-select-report-sala-text').textContent = 'Todas as salas (Geral)';
    
    await loadExamReports();
    Modal.open('modal-exam-reports');
};

window.loadExamReports = async function() {
    const salaId = document.getElementById('reportSalaSelect').value;
    const url = `/provas/${currentReportProvaId}/estatisticas` + (salaId ? `?salaId=${salaId}` : '');
    
    try {
        const data = await api.get(url);
        renderExamReports(data);
    } catch(err) {
        if(window.Toast) Toast.error(err.message || 'Erro ao carregar estatísticas');
        console.error(err);
    }
};

function renderExamReports(data) {
    const pendentes = data.totalAlunos - data.totalRespondido;
    const respondidos = data.totalRespondido;
    
    // 1. Gráfico de Participação
    renderChart('chart-participacao', 'pie', {
        labels: ['Responderam', 'Pendentes'],
        datasets: [{
            data: [respondidos, pendentes < 0 ? 0 : pendentes],
            backgroundColor: ['#10b981', '#f43f5e']
        }]
    }, { responsive: true, maintainAspectRatio: false });

    // 2. Gráfico de Acertos/Erros por Questão
    const qLabels = data.questoes.map((q, i) => `Q${i+1}`);
    const acertosData = data.questoes.map(q => q.acertos);
    const errosData = data.questoes.map(q => q.erros);
    
    renderChart('chart-acertos', 'bar', {
        labels: qLabels,
        datasets: [
            { label: 'Acertos', data: acertosData, backgroundColor: '#3b82f6' },
            { label: 'Erros', data: errosData, backgroundColor: '#f59e0b' }
        ]
    }, { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } });
    
    // 3. Resumo em texto das questões
    const detalhesContainer = document.getElementById('report-detalhes');
    detalhesContainer.innerHTML = '';
    
    data.questoes.forEach((q, i) => {
        let escolhasHtml = '';
        if (q.tipo === 'alternativa' && q.escolhas) {
            const escolhas = Object.entries(q.escolhas).sort((a,b) => b[1] - a[1]);
            if (escolhas.length > 0) {
                escolhasHtml = `<div style="font-size:0.8rem; margin-top:0.5rem; color:#6b7280;">
                    <strong>Opções mais marcadas:</strong><br>
                    ${escolhas.map(e => `• ${e[0]}: ${e[1]} voto(s)`).join('<br>')}
                </div>`;
            }
        }
        
        const total = q.acertos + q.erros;
        const taxaAcerto = total > 0 ? Math.round((q.acertos / total) * 100) : 0;
        
        detalhesContainer.innerHTML += `
            <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 1rem;">
                <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem;">Questão ${i+1}: ${q.texto}</h4>
                <div style="display:flex; gap:1rem; font-size:0.85rem;">
                    <span style="color:#10b981;"><b>${q.acertos}</b> Acertos</span>
                    <span style="color:#f43f5e;"><b>${q.erros}</b> Erros</span>
                    <span style="color:#6366f1;"><b>${taxaAcerto}%</b> Taxa de Acerto</span>
                </div>
                ${escolhasHtml}
            </div>
        `;
    });
}

function renderChart(canvasId, type, data, options) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (chartsInstances[canvasId]) {
        chartsInstances[canvasId].destroy();
    }
    chartsInstances[canvasId] = new Chart(ctx, { type, data, options });
}

// Configurar o dropdown de sala no modal de relatórios
document.addEventListener('DOMContentLoaded', () => {
    // Fazer setup manual pois ui.js não pegará os adicionados via script dinâmico a tempo
    setTimeout(() => {
        const wrapper = document.getElementById('custom-select-report-sala');
        if(!wrapper) return;
        const display = wrapper.querySelector('.custom-select');
        const optionsList = wrapper.querySelector('.custom-select-options');
        const hiddenInput = document.getElementById('reportSalaSelect');
        const textSpan = display.querySelector('span');
        
        display.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.classList.toggle('open');
        });
        
        optionsList.addEventListener('click', (e) => {
            const item = e.target.closest('.custom-select-item');
            if (item) {
                hiddenInput.value = item.dataset.value;
                textSpan.textContent = item.textContent;
                wrapper.classList.remove('open');
                loadExamReports(); // Recarregar gráficos ao mudar sala
            }
        });
        
        document.addEventListener('click', () => {
            wrapper.classList.remove('open');
        });
    }, 1000);
});
