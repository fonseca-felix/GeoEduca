document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildProfessorSidebar());
  const user = initPage('prof');
  if (!user) return;

  let provas = [];
  let salas = [];
  let alunos = [];
  let currentSendProvaId = null;
  
  // Variáveis para o fluxo de criação
  let creationData = {
    titulo: '',
    imagem: '',
    rubrica: '',
    numQuestoes: 0,
    questoes: []
  };
  let currentQuestionIndex = 0;

  // Variável para correção
  let currentGradingProvaId = null;
  let currentProvaQuestoes = [];

  async function loadInitialData() {
    try {
      const [provasRes, salasRes, alunosRes] = await Promise.all([
        api.get('/provas'),
        api.get('/salas'),
        api.get('/alunos')
      ]);
      provas = provasRes;
      salas = salasRes;
      alunos = alunosRes;
      
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


  /* ========================================================
     CORREÇÃO DA PROVA
  ======================================================== */
  function populateGradingSalas() {
    const sel = document.getElementById('gradeSalaSelect');
    if(salas.length === 0) {
      sel.innerHTML = '<option value="">Nenhuma sala encontrada</option>';
      return;
    }
    sel.innerHTML = '<option value="">Selecione...</option>' + salas.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
  }

  // ─────────────────────────────────────────────────────────
  // Enviar Prova (Sala ou múltiplos alunos)
  // ─────────────────────────────────────────────────────────
  function populateSendProvaSalasSelect() {
    const sel = document.getElementById('sendProvaSalaSelect');
    if (!sel) return;
    if (!salas || salas.length === 0) {
      sel.innerHTML = '<option value="">Nenhuma sala encontrada</option>';
      return;
    }
    sel.innerHTML = '<option value="">Selecione...</option>' + salas.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
  }

  function renderSendProvaAlunosList() {
    const list = document.getElementById('sendProvaAlunosList');
    if (!list) return;
    if (!alunos || alunos.length === 0) {
      list.innerHTML = '<div style="color:#6b7280;">Nenhum aluno encontrado.</div>';
      return;
    }

    list.innerHTML = alunos.map(a => `
      <label style="display:flex; gap:0.6rem; align-items:center; margin-bottom:0.75rem; cursor:pointer;">
        <input type="checkbox" data-aluno-id="${a.id}" />
        <div style="display:flex; flex-direction:column;">
          <span style="font-weight:600;color:#0f172a;">${a.nome}</span>
          <span style="font-size:0.78rem;color:#6b7280;">RM: ${a.rm} • ${a.salaNome || ''}</span>
        </div>
      </label>
    `).join('');
  }

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
    // Buscar as questões para saber quais são discursivas
    const prova = provas.find(p => p.id === provaId);
    currentProvaQuestoes = prova ? prova.questoes : [];

    document.getElementById('grading-title').textContent = `Correção: ${provaTitulo}`;
    document.getElementById('gradeSalaSelect').value = '';
    
    document.getElementById('grading-content').style.display = 'none';
    document.getElementById('grading-loading').style.display = 'none';
    document.getElementById('grading-empty').style.display = 'block';
    
    Modal.open('modal-grading');
  };

  window.loadGradingData = async function() {
    const salaId = document.getElementById('gradeSalaSelect').value;
    if(!salaId) {
      document.getElementById('grading-content').style.display = 'none';
      document.getElementById('grading-empty').style.display = 'block';
      return;
    }

    document.getElementById('grading-empty').style.display = 'none';
    document.getElementById('grading-content').style.display = 'none';
    document.getElementById('grading-loading').style.display = 'block';

    try {
      const data = await api.get(`/provas/${currentGradingProvaId}/respostas/sala/${salaId}`);
      renderGradingContent(data);
      document.getElementById('grading-loading').style.display = 'none';
      document.getElementById('grading-content').style.display = 'block';
    } catch(err) {
      document.getElementById('grading-loading').style.display = 'none';
      Toast.error('Erro ao carregar', err.message);
    }
  };

  function renderGradingContent(data) {
    const container = document.getElementById('students-list-container');
    
    // Filtrar apenas quem respondeu
    const responded = data.filter(s => s.respondeu);
    
    if (responded.length === 0) {
      container.innerHTML = '<div style="padding:2rem;text-align:center;color:#6b7280;">Nenhum aluno desta sala entregou a prova ainda.</div>';
      return;
    }

    container.innerHTML = responded.map(s => {
      const r = s.resposta;
      const penalidades = (r.saidasAba || 0) * 0.5;
      
      // Filtrar apenas respostas a questões discursivas para a professora corrigir
      const discursivasHtml = r.respostas.filter(resp => resp.tipo === 'descritiva').map(resp => {
        // Encontrar a questão para saber o valor máximo
        const qData = currentProvaQuestoes.find(q => q.id === resp.questaoId);
        const valorMax = qData ? qData.valor : 10;
        const textoQ = qData ? qData.texto : 'Questão Discursiva';

        return `
          <div class="correction-item">
            <div class="correction-q-text">${textoQ} (Max: ${valorMax} pts)</div>
            <div class="correction-a-text">${resp.respostaTexto || 'Em branco'}</div>
            <div class="grading-row">
              <label style="font-size:0.875rem; font-weight:600;">Nota atribuída:</label>
              <input type="number" step="0.5" min="0" max="${valorMax}" class="grading-input" 
                     id="grade-${r.id}-${resp.questaoId}" placeholder="Ex: ${valorMax}" />
            </div>
          </div>
        `;
      }).join('');

      const hasDiscursivas = discursivasHtml.length > 0;
      
      // Se já estiver corrigida, mostrar a nota final. Se não, mostrar botão de salvar.
      const statusBadge = r.status === 'corrigida' 
        ? `<span style="color:#059669; font-size:0.875rem; background:#d1fae5; padding:0.2rem 0.5rem; border-radius:4px;">Corrigida (Total: ${r.notaAutomatica + (r.notaManual||0)})</span>` 
        : `<span style="color:#d97706; font-size:0.875rem; background:#fef3c7; padding:0.2rem 0.5rem; border-radius:4px;">Pendente</span>`;

      return `
        <div class="student-item">
          <div class="student-header">
            ${s.alunoNome}
            ${statusBadge}
          </div>
          <div class="student-meta">
            <span>Nota Automática (Objetivas): <strong>${r.notaAutomatica.toFixed(2)}</strong></span>
            ${penalidades > 0 ? `<span style="color:#dc2626;">Penalidade (Saídas de Aba): <strong>-${penalidades.toFixed(2)}</strong> (${r.saidasAba} saídas)</span>` : `<span style="color:#059669;">Nenhuma saída de aba (Honesto)</span>`}
          </div>
          
          <div class="student-body">
            ${hasDiscursivas ? discursivasHtml : '<div style="color:#6b7280; font-size:0.875rem; margin-bottom:1rem;">Nenhuma questão discursiva para corrigir.</div>'}
            
            ${r.status !== 'corrigida' ? `
              <div class="final-grade-box">
                <div>
                  <strong>Correção Manual:</strong> Some as notas das questões acima e insira o total manual aqui.
                </div>
                <div style="display:flex; gap:0.5rem;">
                  <input type="number" step="0.5" min="0" id="manualTotal-${r.id}" class="form-control" style="width:100px;" placeholder="Total pts" />
                  <button class="btn btn-primary" onclick="submitGrade('${r.id}')">Salvar Nota</button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  window.submitGrade = async function(respostaId) {
    const input = document.getElementById(`manualTotal-${respostaId}`);
    if(!input) return;

    const notaManual = parseFloat(input.value) || 0;
    
    try {
      input.disabled = true;
      await api.put(`/provas/respostas/${respostaId}/corrigir`, {
        notaManual: notaManual,
        feedback: '' // Pode adicionar campo de feedback depois se quiser
      });
      Toast.success('Nota salva com sucesso!');
      
      // Recarregar os dados
      loadGradingData();
    } catch(err) {
      input.disabled = false;
      Toast.error('Erro ao salvar', err.message);
    }
  };

  // Load on start
  loadInitialData();
});
