document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildProfessorSidebar());
  const user = initPage('prof');
  if (!user) return;

  let quizzes = [];
  let salas = [];
  let alunos = [];
  let currentSendQuizId = null;
  
  // Variáveis para o fluxo de criação
  let creationData = {
    titulo: '',
    imagem: '',
    numQuestoes: 0,
    perguntas: []
  };
  let currentQuestionIndex = 0;

  // Variável para relatório
  let currentReportQuizId = null;

  async function loadInitialData() {
    try {
      const [quizzesRes, salasRes, alunosRes] = await Promise.all([
        api.get('/quizzes'),
        api.get('/salas'),
        api.get('/alunos')
      ]);
      quizzes = quizzesRes;
      salas = salasRes;
      alunos = alunosRes;
      
      renderQuizzes();
      populateReportSalas();
    } catch (err) {
      console.error(err);
      Toast.error('Erro ao carregar dados', err.message);
    }
  }

  function renderQuizzes() {
    const container = document.getElementById('quizzes-container');
    document.getElementById('loadingQuizzes').style.display = 'none';

    if (quizzes.length === 0) {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 3rem; background: #fff; border-radius:12px; border: 1px dashed #d1d5db; color: #6b7280;">Nenhum quiz criado ainda.</div>';
      return;
    }

    container.innerHTML = quizzes.map(q => `
      <div class="quiz-card" onclick="openReport('${q.id}', '${q.titulo}')">
        <img src="${q.imagem || 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg'}" class="quiz-img" alt="Capa" onerror="this.src='https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg'" />
        <div class="quiz-body">
          <div class="quiz-title">${q.titulo}</div>
          <div class="quiz-stats">${q.perguntas ? q.perguntas.length : 0} Questões</div>
        </div>
        <div class="quiz-footer">
          <span style="font-size:0.875rem; font-weight:600; color:#3b82f6;">Ver Relatório &rarr;</span>
          <button class="btn btn-outline" style="padding:0.35rem 0.65rem; font-size:0.75rem;" onclick="event.stopPropagation(); openSendQuiz('${q.id}')" title="Enviar quiz para alunos">
            Enviar
          </button>
          <button class="btn-close" onclick="event.stopPropagation(); deleteQuiz('${q.id}')" title="Excluir Quiz">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  window.deleteQuiz = function(id) {
    Confirm.show('Excluir Quiz', 'Tem certeza? Isso apagará o quiz e todas as respostas.', async () => {
      try {
        await api.delete('/quizzes/' + id);
        quizzes = quizzes.filter(q => q.id !== id);
        renderQuizzes();
        Toast.success('Quiz excluído.');
      } catch (err) {
        Toast.error('Erro ao excluir', err.message);
      }
    });
  };

  /* ========================================================
     FLUXO DE CRIAÇÃO
  ======================================================== */
  window.startQuizCreation = function() {
    creationData = { titulo: '', imagem: '', numQuestoes: 0, perguntas: [] };
    currentQuestionIndex = 0;
    
    document.getElementById('quizTitle').value = '';
    document.getElementById('quizImage').value = '';
    document.getElementById('quizQCount').value = '3';
    
    document.getElementById('step-1').style.display = 'block';
    document.getElementById('footer-step-1').style.display = 'flex';
    document.getElementById('step-question').style.display = 'none';
    document.getElementById('footer-step-question').style.display = 'none';
    
    Modal.open('modal-create-quiz');
  };

  window.goToQuestions = function() {
    const title = document.getElementById('quizTitle').value.trim();
    const count = parseInt(document.getElementById('quizQCount').value, 10);
    
    if (!title) { Toast.error('Erro', 'O título é obrigatório.'); return; }
    if (isNaN(count) || count < 1 || count > 50) { Toast.error('Erro', 'Quantidade de questões inválida.'); return; }
    
    creationData.titulo = title;
    creationData.imagem = document.getElementById('quizImage').value.trim();
    creationData.numQuestoes = count;
    
    // Inicializar array de perguntas se necessário
    if (creationData.perguntas.length !== count) {
      creationData.perguntas = Array.from({ length: count }, () => ({
        texto: '', opcoes: ['', '', '', ''], correta: 0
      }));
    }
    
    currentQuestionIndex = 0;
    renderCurrentQuestionForm();
    
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('footer-step-1').style.display = 'none';
    document.getElementById('step-question').style.display = 'block';
    document.getElementById('footer-step-question').style.display = 'flex';
  };

  function saveCurrentQuestionData() {
    const p = creationData.perguntas[currentQuestionIndex];
    p.texto = document.getElementById('qText').value.trim();
    p.opcoes[0] = document.getElementById('qOpt0').value.trim();
    p.opcoes[1] = document.getElementById('qOpt1').value.trim();
    p.opcoes[2] = document.getElementById('qOpt2').value.trim();
    p.opcoes[3] = document.getElementById('qOpt3').value.trim();
    
    const radio = document.querySelector('input[name="qCorrect"]:checked');
    p.correta = radio ? parseInt(radio.value, 10) : 0;
  }

  function renderCurrentQuestionForm() {
    const p = creationData.perguntas[currentQuestionIndex];
    document.getElementById('question-indicator').textContent = `Questão ${currentQuestionIndex + 1} de ${creationData.numQuestoes}`;
    
    document.getElementById('qText').value = p.texto;
    document.getElementById('qOpt0').value = p.opcoes[0];
    document.getElementById('qOpt1').value = p.opcoes[1];
    document.getElementById('qOpt2').value = p.opcoes[2];
    document.getElementById('qOpt3').value = p.opcoes[3];
    
    document.querySelectorAll('input[name="qCorrect"]').forEach(el => {
      el.checked = (parseInt(el.value, 10) === p.correta);
    });

    document.getElementById('btnPrevQ').style.display = currentQuestionIndex === 0 ? 'none' : 'block';
    const isLast = (currentQuestionIndex === creationData.numQuestoes - 1);
    document.getElementById('btnNextQ').textContent = isLast ? 'Salvar e Finalizar' : 'Próxima Questão';
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
    
    // Validação da pergunta atual
    const p = creationData.perguntas[currentQuestionIndex];
    if (!p.texto) { Toast.error('Faltou a pergunta!', 'Preencha o texto da pergunta.'); return; }
    if (p.opcoes.some(opt => !opt)) { Toast.error('Opções incompletas', 'Preencha todas as 4 alternativas.'); return; }

    const isLast = (currentQuestionIndex === creationData.numQuestoes - 1);
    
    if (isLast) {
      // Submeter ao backend
      const btn = document.getElementById('btnNextQ');
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      try {
        const payload = {
          titulo: creationData.titulo,
          imagem: creationData.imagem,
          perguntas: creationData.perguntas.map(p => ({
            texto: p.texto,
            opcoes: p.opcoes,
            correta: p.opcoes[p.correta] // backend espera o texto da opção correta
          }))
        };
        const novoQuiz = await api.post('/quizzes', payload);
        quizzes.unshift(novoQuiz);
        renderQuizzes();
        Modal.close('modal-create-quiz');
        Toast.success('Quiz criado com sucesso!');
      } catch(err) {
        Toast.error('Erro ao salvar', err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar e Finalizar';
      }
    } else {
      currentQuestionIndex++;
      renderCurrentQuestionForm();
    }
  };


  /* ========================================================
     RELATÓRIO DO QUIZ
  ======================================================== */
  function populateReportSalas() {
    const sel = document.getElementById('reportSalaSelect');
    if(salas.length === 0) {
      sel.innerHTML = '<option value="">Nenhuma sala encontrada</option>';
      return;
    }
    sel.innerHTML = '<option value="">Selecione...</option>' + salas.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
  }

  // ─────────────────────────────────────────────────────────
  // Enviar Quiz (Sala ou múltiplos alunos)
  // ─────────────────────────────────────────────────────────
  function populateSendQuizSalasSelect() {
    const sel = document.getElementById('sendQuizSalaSelect');
    if (!sel) return;
    if (!salas || salas.length === 0) {
      sel.innerHTML = '<option value="">Nenhuma sala encontrada</option>';
      return;
    }
    sel.innerHTML = '<option value="">Selecione...</option>' + salas.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
  }

  function renderSendQuizAlunosList() {
    const list = document.getElementById('sendQuizAlunosList');
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

  function syncSendQuizBlocks() {
    const type = document.querySelector('input[name="sendQuizTargetType"]:checked')?.value || 'sala';
    const salaBlock = document.getElementById('sendQuizSalaBlock');
    const alunosBlock = document.getElementById('sendQuizAlunosBlock');
    if (salaBlock) salaBlock.style.display = type === 'sala' ? 'block' : 'none';
    if (alunosBlock) alunosBlock.style.display = type === 'alunos' ? 'block' : 'none';
  }

  window.openSendQuiz = function(quizId) {
    currentSendQuizId = quizId;

    populateSendQuizSalasSelect();
    renderSendQuizAlunosList();

    // Default: sala
    const salaRadio = document.querySelector('input[name="sendQuizTargetType"][value="sala"]');
    if (salaRadio) salaRadio.checked = true;
    syncSendQuizBlocks();

    Modal.open('modal-send-quiz');
  };

  // Toggle do modal
  const radios = document.querySelectorAll('input[name="sendQuizTargetType"]');
  radios.forEach(r => {
    r.addEventListener('change', () => syncSendQuizBlocks());
  });

  // Submit do modal
  const btnSendQuiz = document.getElementById('btnSendQuiz');
  if (btnSendQuiz) {
    btnSendQuiz.addEventListener('click', async () => {
      try {
        if (!currentSendQuizId) {
          Toast.error('Erro', 'Quiz não selecionado.');
          return;
        }

        const type = document.querySelector('input[name="sendQuizTargetType"]:checked')?.value || 'sala';
        if (type === 'sala') {
          const salaId = document.getElementById('sendQuizSalaSelect')?.value;
          if (!salaId) {
            Toast.error('Sala obrigatória', 'Selecione a sala de destino.');
            return;
          }

          await api.post('/quizzes/enviar', { quizId: currentSendQuizId, salaId });
        } else {
          const selected = Array.from(document.querySelectorAll('#sendQuizAlunosList input[type="checkbox"]:checked'))
            .map(el => el.getAttribute('data-aluno-id'));

          if (!selected.length) {
            Toast.error('Selecione alunos', 'Escolha pelo menos um aluno.');
            return;
          }

          await api.post('/quizzes/enviar', { quizId: currentSendQuizId, alunoIds: selected });
        }

        Modal.close('modal-send-quiz');
        Toast.success('Quiz enviado com sucesso');
      } catch (err) {
        console.error(err);
        Toast.error('Erro ao enviar', err.message || 'Tente novamente.');
      }
    });
  }

  window.openReport = function(quizId, quizTitulo) {
    currentReportQuizId = quizId;
    document.getElementById('report-title').textContent = `Relatório: ${quizTitulo}`;
    document.getElementById('reportSalaSelect').value = '';
    
    document.getElementById('report-content').style.display = 'none';
    document.getElementById('report-loading').style.display = 'none';
    document.getElementById('report-empty').style.display = 'block';
    
    Modal.open('modal-report');
  };

  window.loadReportData = async function() {
    const salaId = document.getElementById('reportSalaSelect').value;
    if(!salaId) {
      document.getElementById('report-content').style.display = 'none';
      document.getElementById('report-empty').style.display = 'block';
      return;
    }

    document.getElementById('report-empty').style.display = 'none';
    document.getElementById('report-content').style.display = 'none';
    document.getElementById('report-loading').style.display = 'block';

    try {
      const data = await api.get(`/quizzes/${currentReportQuizId}/relatorioDetalhado/sala/${salaId}`);
      renderReportContent(data);
      document.getElementById('report-loading').style.display = 'none';
      document.getElementById('report-content').style.display = 'block';
    } catch(err) {
      document.getElementById('report-loading').style.display = 'none';
      Toast.error('Erro ao carregar relatório', err.message);
    }
  };

  function renderReportContent(data) {
    document.getElementById('repTotalAlunos').textContent = `${data.totalResponderam} / ${data.totalAlunos}`;
    
    // Calcular média geral
    let totalAcertosGerais = 0;
    let totalPossivel = data.totalResponderam * data.relatorio.length;
    
    data.relatorio.forEach(q => {
      totalAcertosGerais += q.acertos.length;
    });
    
    const mediaPercent = totalPossivel > 0 ? Math.round((totalAcertosGerais / totalPossivel) * 100) : 0;
    document.getElementById('repMedia').textContent = `${mediaPercent}%`;

    const container = document.getElementById('questions-report-container');
    
    container.innerHTML = data.relatorio.map((q, index) => {
      const respCount = q.acertos.length + q.erros.length;
      const acertosPercent = respCount > 0 ? Math.round((q.acertos.length / respCount) * 100) : 0;
      
      const acertosHtml = q.acertos.map(a => `
        <div class="student-item">
          <span>${a.nome}</span>
          <span class="student-correct">Acertou</span>
        </div>
      `).join('');
      
      const errosHtml = q.erros.map(e => `
        <div class="student-item">
          <span>${e.nome}</span>
          <span>
            <span class="student-wrong">Errou</span>
            <span class="wrong-answer" title="Marcou esta opção">${e.respostaEscolhida}</span>
          </span>
        </div>
      `).join('');

      const noResponses = respCount === 0 ? '<div style="padding:1rem;color:#6b7280;text-align:center;">Nenhuma resposta ainda.</div>' : '';

      return `
        <div class="question-report">
          <div class="qr-header" onclick="this.classList.toggle('open')">
            <div class="qr-title">Q${index + 1}: ${q.texto}</div>
            <div class="qr-stats">
              ${q.acertos.length} acertaram (${acertosPercent}%)
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>
          <div class="qr-body">
            <div style="font-size:0.875rem; color:#4b5563; margin-bottom:1rem;">
              <strong>Resposta correta:</strong> ${q.correta}
            </div>
            <div class="student-list">
              ${noResponses}
              ${acertosHtml}
              ${errosHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Load on start
  loadInitialData();
});
