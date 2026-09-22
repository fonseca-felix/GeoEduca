document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildProfessorSidebar());
    const user = initPage('prof');
    if (!user) return;
    loadProvas();
    setupCustomSelect();
});

function setupCustomSelect() {
    const wrapper = document.getElementById('custom-select-nivel');
    if (!wrapper) return;
    const display = document.getElementById('custom-select-nivel-display');
    const optionsContainer = document.getElementById('custom-select-nivel-options');
    const hiddenInput = document.getElementById('inputNivel');

    // Remove old event listeners by cloning
    const newDisplay = display.cloneNode(true);
    display.parentNode.replaceChild(newDisplay, display);

    const displayText = newDisplay.querySelector('#custom-select-nivel-text');

    newDisplay.addEventListener('click', () => {
      wrapper.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
    });

    optionsContainer.querySelectorAll('.custom-option').forEach(opt => {
      opt.addEventListener('click', function() {
        optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        
        hiddenInput.value = this.dataset.value;
        displayText.textContent = this.textContent;
        wrapper.classList.remove('open');
      });
    });
}

let provasData = [];

async function loadProvas() {
    const container = document.getElementById('provas-container');
    const loading = document.getElementById('loadingProvas');
    
    container.innerHTML = '';
    loading.style.display = 'block';

    try {
        const provas = await api.get('/banco_provas');
        provasData = provas;
        loading.style.display = 'none';

        if (provas.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:3rem; color: var(--color-text-secondary);">
                    <i class="fa-solid fa-file-circle-question fa-3x" style="margin-bottom:1rem; opacity:0.5;"></i>
                    <h3>Nenhuma prova no banco ainda.</h3>
                    <p>Clique em "Gerar Nova Prova" para começar.</p>
                </div>
            `;
            return;
        }

        provas.forEach(prova => {
            const dataStr = prova.criadoEm ? new Date(prova.criadoEm).toLocaleDateString('pt-BR') : 'Data desconhecida';
            const card = document.createElement('div');
            card.className = 'exam-card';
            card.innerHTML = `
                <div class="exam-body">
                    <h3 class="exam-title">${prova.titulo}</h3>
                    <p style="font-size:0.9rem; color: var(--color-text-secondary); margin-bottom:1rem;">${prova.descricao}</p>
                    <div class="exam-stats">
                        <span><i class="fa-solid fa-list-ol"></i> ${prova.questoes.length} Questões</span> &bull; 
                        <span><i class="fa-regular fa-calendar"></i> ${dataStr}</span>
                    </div>
                </div>
                <div class="exam-footer">
                    <button class="btn btn-outline" onclick="excluirProva('${prova.id}')" style="padding: 0.4rem 0.6rem; color: #ef4444; border-color: #ef4444;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    <button class="btn btn-primary" onclick="baixarPdf('${prova.id}')" style="padding: 0.4rem 1rem;">
                        <i class="fa-solid fa-file-pdf"></i> Baixar PDF
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        loading.innerHTML = 'Erro ao carregar provas. Verifique a conexão com o servidor.';
    }
}

function openGerarModal() {
    document.getElementById('inputTema').value = '';
    document.getElementById('inputQtd').value = 5;
    document.getElementById('gerarLoading').style.display = 'none';
    document.getElementById('gerarFooter').style.display = 'flex';
    document.getElementById('modalGerar').classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

async function gerarProva() {
    const tema = document.getElementById('inputTema').value.trim();
    const qtd = document.getElementById('inputQtd').value;
    const nivel = document.getElementById('inputNivel').value;

    if (!tema) {
        Toast.error('Erro', 'Por favor, digite um tema para a prova.');
        return;
    }

    document.getElementById('gerarLoading').style.display = 'block';
    document.getElementById('gerarFooter').style.display = 'none';

    try {
        // 1. Chamar a IA para gerar as questões
        const provaGerada = await api.post('/banco_provas/gerar', { tema, quantidade: qtd, nivel });

        // 2. Salvar no banco
        await api.post('/banco_provas', {
            titulo: provaGerada.titulo || `Prova de Geografia: ${tema}`,
            descricao: provaGerada.descricao || `Avaliação gerada por IA sobre ${tema}.`,
            tema: tema,
            questoes: provaGerada.questoes
        });

        Toast.success('Sucesso', 'Prova gerada e salva no banco!');
        closeModal('modalGerar');
        loadProvas();
    } catch (err) {
        console.error(err);
        const msg = err.message || "Erro ao gerar prova. Tente novamente.";
        Toast.error('Erro', msg);
    } finally {
        document.getElementById('gerarLoading').style.display = 'none';
        document.getElementById('gerarFooter').style.display = 'flex';
    }
}

async function excluirProva(id) {
    if(!confirm("Tem certeza que deseja excluir esta prova do banco?")) return;
    try {
        await api.delete('/banco_provas/' + id);
        Toast.success('Excluída', 'Prova removida com sucesso.');
        loadProvas();
    } catch(err) {
        console.error(err);
        Toast.error('Erro', 'Não foi possível excluir a prova.');
    }
}

// ==========================
// GERAÇÃO DE PDF (PDFMAKE)
// ==========================

function baixarPdf(provaId) {
    const prova = provasData.find(p => p.id === provaId);
    if (!prova) return Toast.error('Erro', 'Prova não encontrada localmente.');

    // Construir o docDefinition para o pdfmake
    const content = [];

    // CABEÇALHO
    content.push({ text: 'COLÉGIO GEOEDUCA', style: 'header', alignment: 'center' });
    content.push({ text: 'Avaliação de Geografia', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] });
    
    // CAMPOS DE ALUNO
    content.push({
        columns: [
            { text: 'Aluno(a): _________________________________________________', width: '*' },
            { text: 'Turma: _________', width: 100 }
        ],
        margin: [0, 0, 0, 10]
    });
    content.push({
        columns: [
            { text: 'Data: ___/___/20__', width: 150 },
            { text: 'Professor(a): ________________________', width: '*' },
            { text: 'Nota: _______', width: 100 }
        ],
        margin: [0, 0, 0, 20]
    });

    // TÍTULO DA PROVA E DESCRIÇÃO
    content.push({ text: prova.titulo.toUpperCase(), style: 'examTitle', margin: [0, 10, 0, 5] });
    content.push({ text: prova.descricao, italics: true, margin: [0, 0, 0, 20], color: '#4b5563' });

    // QUESTÕES
    prova.questoes.forEach((q, index) => {
        const num = index + 1;
        content.push({
            text: `${num}) ${q.enunciado}`,
            style: 'questionText'
        });

        // Alternativas
        const letters = ['A', 'B', 'C', 'D'];
        letters.forEach(letra => {
            if (q.alternativas[letra]) {
                content.push({
                    text: `(  ) ${letra}) ${q.alternativas[letra]}`,
                    style: 'alternativeText'
                });
            }
        });
        
        content.push({ text: '', margin: [0, 0, 0, 15] }); // Espaçamento
    });

    // QUEBRA DE PÁGINA PARA O GABARITO (OPCIONAL/SÓ PARA O PROFESSOR)
    content.push({ text: '', pageBreak: 'before' });
    content.push({ text: 'GABARITO DO PROFESSOR', style: 'header', alignment: 'center', margin: [0,0,0,20] });
    content.push({ text: prova.titulo, style: 'subheader', alignment: 'center', margin: [0,0,0,20] });
    
    const gabaritoBody = [];
    prova.questoes.forEach((q, index) => {
        gabaritoBody.push([
            { text: `Questão ${index + 1}`, bold: true },
            { text: q.correta, bold: true, color: 'blue' }
        ]);
    });

    content.push({
        table: {
            headerRows: 1,
            widths: ['*', 100],
            body: [
                [{ text: 'Questão', style: 'tableHeader' }, { text: 'Resposta Correta', style: 'tableHeader' }],
                ...gabaritoBody
            ]
        },
        layout: 'lightHorizontalLines'
    });


    // DEFINIÇÃO DE ESTILOS
    const docDefinition = {
        content: content,
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                color: '#111827'
            },
            subheader: {
                fontSize: 14,
                color: '#6b7280'
            },
            examTitle: {
                fontSize: 16,
                bold: true,
                color: '#cca43b' // Dourado do GeoEduca
            },
            questionText: {
                fontSize: 11,
                bold: true,
                margin: [0, 5, 0, 5],
                alignment: 'justify'
            },
            alternativeText: {
                fontSize: 11,
                margin: [15, 3, 0, 3]
            },
            tableHeader: {
                bold: true,
                fontSize: 12,
                color: 'black'
            }
        },
        defaultStyle: {
            columnGap: 20
        }
    };

    // GERAR E BAIXAR
    try {
        pdfMake.createPdf(docDefinition).download(`Prova_${prova.titulo.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
        console.error(e);
        Toast.error("Erro", "Não foi possível gerar o PDF.");
    }
}
