document.addEventListener('DOMContentLoaded', () => {
  // Inject sidebar BEFORE initPage
  document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildProfessorSidebar());
  
  const user = initPage('prof');
  if (!user) return; // redirect handled in auth



  let alunos = [];
  let salasData = [];

  const tableBody = document.getElementById('students-table-body');
  const searchInput = document.getElementById('searchInput');
  const filterRoom = document.getElementById('filterRoom');
  const addStudentForm = document.getElementById('addStudentForm');
  const editStudentForm = document.getElementById('editStudentForm');

  // Ordem correta das salas
  const SALA_ORDER = [
    '6º Ano A', '6º Ano B',
    '7º Ano A', '7º Ano B',
    '8º Ano A', '8º Ano B',
    '9º Ano A', '9º Ano B',
    '1ª Série A', '1ª Série B',
    '2ª Série A', '2ª Série B',
    '3ª Série A', '3ª Série B'
  ];

  function sortSalas(salas) {
    return [...salas].sort((a, b) => {
      const idxA = SALA_ORDER.indexOf(a.nome);
      const idxB = SALA_ORDER.indexOf(b.nome);
      if (idxA === -1 && idxB === -1) return a.nome.localeCompare(b.nome);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  async function loadData() {
    try {
      const [salasRes, alunosRes] = await Promise.all([
        api.get('/salas'),
        api.get('/alunos')
      ]);
      
      salasData = sortSalas(salasRes);
      alunos = alunosRes.map(a => ({
        ...a,
        progresso: 0,
        status: 'Ativo'
      }));
      
      populateSalasSelects();
      renderTable();
    } catch (err) {
      console.error(err);
      Toast.error('Erro ao carregar', 'Servidor está ligado?');
    }
  }

  function populateSalasSelects() {
    if (filterRoom) {
      filterRoom.innerHTML = '<option value="">Todas as Salas</option>' + 
        salasData.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    }
    
    const studentRoom = document.getElementById('studentRoom');
    if (studentRoom) {
      studentRoom.innerHTML = '<option value="" disabled selected>Selecione uma sala...</option>' + 
        salasData.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    }
    
    const editStudentRoom = document.getElementById('editStudentRoom');
    if (editStudentRoom) {
      editStudentRoom.innerHTML = '<option value="" disabled>Selecione uma sala...</option>' + 
        salasData.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    }
  }

  // Render Logic
  function renderTable() {
    if (!tableBody) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const roomFilter = filterRoom.value;

    const filtered = alunos.filter(a => {
      const matchSearch = a.nome.toLowerCase().includes(searchTerm) || a.rm.includes(searchTerm);
      const matchRoom = roomFilter === '' || a.salaId === roomFilter;
      return matchSearch && matchRoom;
    });

    tableBody.innerHTML = filtered.map(a => {
      let badgeClass = 'badge-active';
      if(a.status === 'Inativo') badgeClass = 'badge-inactive';
      if(a.status === 'Atenção') badgeClass = 'badge-attention';

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0e7ff; color: #3730a3; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem;">
                ${a.nome.charAt(0)}
              </div>
              <div style="font-weight: 600; color: var(--text-primary, #111827);">${a.nome}</div>
            </div>
          </td>
          <td style="font-family: monospace; color: #4b5563;">${a.rm}</td>
          <td style="font-weight: 500; color: #374151;">${a.salaNome}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 999px; min-width: 80px;">
                <div style="height: 100%; width: ${a.progresso}%; background: ${a.progresso > 80 ? '#10b981' : a.progresso > 40 ? '#3b82f6' : '#f59e0b'}; border-radius: 999px;"></div>
              </div>
              <span style="font-size: 0.875rem; font-weight: 500; color: #4b5563;">${a.progresso}%</span>
            </div>
          </td>
          <td><span class="badge ${badgeClass}">${a.status}</span></td>
          <td style="text-align: right;">
            <div class="actions" style="justify-content: flex-end;">
              <button class="btn-icon" title="Editar" onclick="window.openEditStudent('${a.id}')">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button class="btn-icon danger" title="Remover" onclick="window.deleteStudent('${a.id}')">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if(filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 3rem; color: #6b7280;">Nenhum aluno encontrado.</td></tr>`;
    }
  }

  // Bind Events
  if(searchInput) searchInput.addEventListener('input', renderTable);
  if(filterRoom) filterRoom.addEventListener('change', renderTable);

  if(addStudentForm) {
    addStudentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('studentName').value;
      const salaId = document.getElementById('studentRoom').value;
      const rm = document.getElementById('studentId').value;
      
      try {
        await api.post('/alunos', { rm, nome, senha: rm, salaId });
        
        Modal.close('addStudentModal');
        addStudentForm.reset();
        await loadData();
        Toast.success('Aluno adicionado!', `${nome} foi cadastrado com sucesso.`);
      } catch (err) {
        console.error(err);
        Toast.error('Erro ao criar aluno', err.message || 'Tente novamente.');
      }
    });
  }

  window.openEditStudent = function(id) {
    const aluno = alunos.find(a => a.id === id);
    if(!aluno) return;

    document.getElementById('editStudentIdDb').value = aluno.id;
    document.getElementById('editStudentName').value = aluno.nome;
    document.getElementById('editStudentRm').value = aluno.rm;
    document.getElementById('editStudentRoom').value = aluno.salaId;
    document.getElementById('editStudentPassword').value = aluno.senhaVisivel || '';

    Modal.open('editStudentModal');
  };

  window.copyPassword = function() {
    const passInput = document.getElementById('editStudentPassword');
    if (!passInput.value) {
      Toast.error('Erro', 'Não há senha para copiar.');
      return;
    }
    navigator.clipboard.writeText(passInput.value).then(() => {
      Toast.success('Senha copiada!', 'Você pode colar e enviar para o aluno.');
    }).catch(err => {
      console.error('Falha ao copiar', err);
      Toast.error('Erro ao copiar', 'Não foi possível copiar a senha.');
    });
  };

  if(editStudentForm) {
    editStudentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('editStudentIdDb').value;
      const nome = document.getElementById('editStudentName').value;
      const rm = document.getElementById('editStudentRm').value;
      const salaId = document.getElementById('editStudentRoom').value;
      const senha = document.getElementById('editStudentPassword').value;

      try {
        const payload = { nome, rm, salaId };
        // Só atualiza a senha se o campo não estiver vazio
        if (senha.trim() !== '') {
          payload.senha = senha.trim();
        }

        await api.put(`/alunos/${id}`, payload);
        
        Modal.close('editStudentModal');
        await loadData();
        Toast.success('Aluno atualizado!', `${nome} foi alterado com sucesso.`);
      } catch (err) {
        console.error(err);
        Toast.error('Erro ao atualizar aluno', err.message || 'Verifique se o RM já está em uso.');
      }
    });
  }

  window.deleteStudent = async function(id) {
    if(confirm('Tem certeza que deseja remover este aluno?')) {
      try {
        await api.delete('/alunos/' + id);
        await loadData();
        Toast.success('Aluno removido', 'O aluno foi excluído com sucesso.');
      } catch (err) {
        console.error(err);
        Toast.error('Erro ao remover', 'Tente novamente.');
      }
    }
  };

  // Initial Load
  loadData();
});
