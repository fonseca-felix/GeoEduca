// ============================================================
// ROTA 27 - LÓGICA DE INTEGRAÇÃO COM IA
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Inject sidebar
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
    
    // Auth Check
    const user = Auth.getUser();
    if (!user) {
        window.location.href = '../login.html';
        return;
    }

    if (document.getElementById('user-initial')) {
        document.getElementById('user-initial').textContent = user.nome.charAt(0).toUpperCase();
    }

    // Populate Sidebar Info
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    
    if (nameEl) nameEl.textContent = user.nome;
    if (roleEl) roleEl.textContent = `Turma: ${user.salaNome || '-'}`;
    if (avatarEl) {
        const names = user.nome.split(' ');
        const initials = names.length > 1 
            ? names[0].charAt(0) + names[names.length - 1].charAt(0) 
            : names[0].charAt(0);
        avatarEl.textContent = initials.toUpperCase();
    }
    
    // Configura botões do rodapé da sidebar (logout e tema)
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', () => { Auth.logout(); });
    });
    // Se o darkmode.js tiver Theme.toggle():
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
        if(typeof Theme !== 'undefined' && Theme.toggle) {
            btn.addEventListener('click', () => Theme.toggle());
        } else {
            // fallback para darkmode.js simples
            btn.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
            });
        }
    });
});

function mostrarErro(mensagem) {
    const errorContainer = document.getElementById("errorContainer");
    const errorText = document.getElementById("errorText");
    errorText.textContent = mensagem;
    errorContainer.classList.remove("hidden");
    
    // Esconde o erro após 8 segundos
    setTimeout(() => {
        errorContainer.classList.add("hidden");
    }, 8000);
}

function ocultarErro() {
    document.getElementById("errorContainer").classList.add("hidden");
}

async function buscarDados(endpoint, callbackRender) {
    const tema = document.getElementById("inputTema").value.trim();
    if (!tema) {
        mostrarErro("Por favor, digite um tema geográfico primeiro no topo da página!");
        return;
    }

    ocultarErro();

    const loader = document.getElementById("loader");
    const painel = document.getElementById("painelResultado");
    
    loader.classList.remove("hidden");
    painel.classList.add("hidden");

    try {
        const token = localStorage.getItem('geo_token');

        // Detecta URL do backend da mesma forma que api.js
        let API_BASE;
        if (window.location.protocol === 'file:') {
            API_BASE = 'http://localhost:3000/api';
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            API_BASE = 'http://localhost:3000/api';
        } else {
            API_BASE = `${window.location.origin}/api`;
        }

        const response = await fetch(`${API_BASE}/estudos${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ tema })
        });

        const resultadoJson = await response.json();

        if (resultadoJson.sucesso) {
            callbackRender(resultadoJson.dados);
            painel.classList.remove("hidden");
            painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            mostrarErro("Erro da IA: " + (resultadoJson.erro || "Resposta inválida do servidor."));
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        mostrarErro("Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3000.");
    } finally {
        loader.classList.add("hidden");
    }
}

function fecharPainel() {
    document.getElementById("painelResultado").classList.add("hidden");
}

/* FUNÇÃO DE INVERSÃO DO CARD (FLIP) */
function flipCard(btn) {
    const container = btn.closest('.flashcard-container');
    container.classList.toggle('flipped');
}

/* LÓGICA DE SELEÇÃO INTERATIVA DO QUIZ */
window.verificarAlternativa = function(elemento, escolha, correta, explicacaoId) {
    const containerQuestao = elemento.closest('.questao-box');
    
    if (containerQuestao.dataset.respondido === "true") return;
    containerQuestao.dataset.respondido = "true";

    const alternativas = containerQuestao.querySelectorAll('.alternativa-item');
    
    alternativas.forEach(alt => {
        const letra = alt.dataset.letra;
        alt.style.cursor = 'default';

        if (letra === correta) {
            alt.style.background = 'rgba(16, 185, 129, 0.15)';
            alt.style.borderColor = 'var(--color-success)';
            alt.style.fontWeight = '700';
            alt.style.color = 'var(--color-text-primary)';
        } else if (letra === escolha && escolha !== correta) {
            alt.style.background = 'rgba(239, 68, 68, 0.1)';
            alt.style.borderColor = 'var(--color-danger)';
            alt.style.fontWeight = '700';
            alt.style.color = 'var(--color-text-primary)';
        }
    });

    const expEl = document.getElementById(explicacaoId);
    if (expEl) expEl.style.display = 'block';
}

window.renderizarEstudo = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-solid fa-graduation-cap" style="color: var(--color-success);"></i> Plano de Estudos: ${dados.tema}`;

    let topicosHtml = dados.explicacao_topicos.map(t => `
        <div style="margin-bottom: 1rem; padding: 1rem 1.25rem; background: var(--color-surface-2); border-radius: var(--radius-lg); border-left: 3px solid var(--navy);">
            <h4 style="font-weight: 700; font-size: 0.95rem; color: var(--navy); margin: 0 0 0.35rem 0; font-family: var(--font-display);">${t.titulo}</h4>
            <p style="white-space: pre-line; font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.6; margin: 0;">${t.conteudo}</p>
        </div>
    `).join('');

    let curiosidadesHtml = dados.curiosidades.map(c => `
        <li style="font-size: 0.875rem; color: var(--color-text-primary); padding: 0.4rem 0; border-bottom: 1px solid var(--color-border); display: flex; align-items: flex-start; gap: 0.5rem;">
            <i class="fa-solid fa-circle-dot" style="color: var(--gold); margin-top: 3px; font-size: 0.6rem; flex-shrink: 0;"></i>
            <span>${c}</span>
        </li>
    `).join('');

    document.getElementById("conteudoResultado").innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div>
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--navy); margin: 0 0 0.5rem 0; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em;">Introducao</h3>
                <p style="font-size: 0.9rem; color: var(--color-text-secondary); line-height: 1.7; margin: 0;">${dados.introducao}</p>
            </div>
            <div>
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--navy); margin: 0 0 0.75rem 0; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em;">Explicacao Detalhada</h3>
                ${topicosHtml}
            </div>
            <div>
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--navy); margin: 0 0 0.5rem 0; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em;">Curiosidades</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">${curiosidadesHtml}</ul>
            </div>
            <div style="background: var(--color-surface-2); padding: 1.25rem; border-radius: var(--radius-lg); border: 1px solid var(--gold);">
                <h3 style="font-size: 1rem; font-weight: 700; color: var(--gold-dark, #a8842e); margin: 0 0 0.5rem 0; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em;">Resumo para Memorizacao</h3>
                <p style="font-size: 0.875rem; color: var(--color-text-primary); margin: 0; line-height: 1.6;">${dados.resumo}</p>
            </div>
        </div>
    `;
}

window.renderizarFlashcards = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-solid fa-layer-group" style="color: var(--gold);"></i> Flashcards (${dados.flashcards.length})`;

    let gridHtml = dados.flashcards.map((f, index) => `
        <div class="flashcard-container">
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <div>
                        <div style="font-size: 0.65rem; font-weight: 800; color: var(--gold); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem; font-family: var(--font-display);">Card ${index + 1}</div>
                        <div style="font-weight: 600; font-size: 0.9rem; color: var(--color-text-primary); text-align: center; line-height: 1.5;">${f.frente}</div>
                    </div>
                    <button onclick="flipCard(this)" style="width: 100%; margin-top: 1rem; padding: 0.6rem; background: var(--navy); color: white; border: none; border-radius: var(--radius-lg); font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-family: var(--font-body);">
                        <i class="fa-solid fa-rotate"></i> Ver Resposta
                    </button>
                </div>
                <div class="flashcard-back">
                    <div>
                        <div style="font-size: 0.65rem; font-weight: 800; color: var(--color-success); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem; font-family: var(--font-display);">Resposta</div>
                        <div style="font-size: 0.875rem; color: var(--color-text-primary); font-weight: 500; text-align: center; overflow-y: auto; max-height: 120px; line-height: 1.5;">${f.verso}</div>
                    </div>
                    <button onclick="flipCard(this)" style="width: 100%; margin-top: 1rem; padding: 0.6rem; background: transparent; color: var(--navy); border: 1.5px solid var(--color-border); border-radius: var(--radius-lg); font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-family: var(--font-body);">
                        <i class="fa-solid fa-rotate"></i> Voltar
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById("conteudoResultado").innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem;">
            ${gridHtml}
        </div>
    `;
}

window.renderizarQuiz = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-solid fa-circle-question" style="color: var(--color-info);"></i> Quiz Tematico Interativo`;

    let perguntasHtml = dados.quiz.map((q, i) => {
        const explicacaoId = `explicacao_${i}`;
        const correta = q.resposta_correta.trim().toUpperCase();
        const letras = ['A', 'B', 'C', 'D'];

        const alternativasHtml = letras.map(letra => `
            <div data-letra="${letra}" onclick="verificarAlternativa(this, '${letra}', '${correta}', '${explicacaoId}')"
                 class="alternativa-item"
                 style="padding: 0.75rem 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); font-size: 0.875rem; cursor: pointer; color: var(--color-text-primary); transition: all 0.2s; user-select: none;">
                <strong style="color: var(--color-info); margin-right: 0.35rem; font-family: var(--font-display);">${letra})</strong>${q.opcoes[letra]}
            </div>
        `).join('');

        return `
            <div class="questao-box" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 1.5rem; margin-bottom: 1.25rem;" data-respondido="false">
                <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem;">
                    <span style="background: var(--navy); color: white; font-weight: 800; font-size: 0.75rem; border-radius: var(--radius-md); padding: 0.2rem 0.55rem; flex-shrink: 0; font-family: var(--font-display);">${i + 1}</span>
                    <p style="font-weight: 600; font-size: 0.95rem; color: var(--color-text-primary); margin: 0; line-height: 1.5;">${q.pergunta}</p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
                    ${alternativasHtml}
                </div>
                <div id="${explicacaoId}" style="margin-top: 1rem; padding: 1rem; background: var(--color-success-light, #F0FFF4); border: 1px solid var(--color-success); border-radius: var(--radius-lg); display: none;">
                    <p style="font-weight: 700; color: var(--color-success); font-size: 0.8rem; margin: 0 0 0.25rem 0; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em;">Resposta correta: ${correta}</p>
                    <p style="font-size: 0.875rem; color: var(--color-text-primary); font-weight: 500; margin: 0; line-height: 1.5;">${q.explicacao}</p>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById("conteudoResultado").innerHTML = `<div>${perguntasHtml}</div>`;
}

window.renderizarMapas = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-solid fa-map" style="color: var(--color-danger);"></i> Midias e Referencias`;

    let midiasHtml = dados.midias.map(m => `
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem; border-top: 3px solid var(--color-danger);">
            <div>
                <span style="display: inline-block; font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.5rem; background: var(--color-surface-2); color: var(--color-danger); border-radius: var(--radius-md); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; font-family: var(--font-display);">${m.tipo}</span>
                <h4 style="font-weight: 700; font-size: 0.95rem; color: var(--color-text-primary); margin: 0 0 0.25rem 0;">${m.titulo}</h4>
                <p style="font-size: 0.8rem; color: var(--color-text-muted); margin: 0;">Fonte: <strong style="color: var(--color-text-secondary);">${m.sugestao_fonte}</strong></p>
            </div>
            <a href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(m.termo_busca_google)}" target="_blank"
               style="display: flex; align-items: center; justify-content: center; gap: 0.4rem; text-align: center; font-size: 0.8rem; font-weight: 700; padding: 0.6rem; border: 1.5px solid var(--color-danger); color: var(--color-danger); border-radius: var(--radius-lg); text-decoration: none; background: transparent; transition: all 0.2s;"
               onmouseover="this.style.background='var(--color-danger)'; this.style.color='white';"
               onmouseout="this.style.background='transparent'; this.style.color='var(--color-danger)';">
                <i class="fa-solid fa-images"></i> Buscar Imagens
            </a>
        </div>
    `).join('');

    document.getElementById("conteudoResultado").innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;">
            ${midiasHtml}
        </div>
    `;
}

window.renderizarVideos = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-brands fa-youtube" style="color: #C53030;"></i> Videos Recomendados`;

    let videosHtml = dados.videos_recommendedados.map(v => `
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: 1.1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.9rem; min-width: 0;">
                <div style="width: 40px; height: 40px; border-radius: var(--radius-lg); background: rgba(197,48,48,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i class="fa-brands fa-youtube" style="color: var(--color-danger); font-size: 1.1rem;"></i>
                </div>
                <div style="min-width: 0;">
                    <h4 style="font-weight: 700; color: var(--color-text-primary); font-size: 0.9rem; margin: 0 0 0.2rem 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${v.titulo_sugerido}</h4>
                    <p style="font-size: 0.78rem; color: var(--color-text-muted); margin: 0;">Canal: <strong style="color: var(--color-danger);">${v.canal}</strong></p>
                </div>
            </div>
            <a href="${v.url_busca_pronta}" target="_blank"
               style="flex-shrink: 0; display: flex; align-items: center; gap: 0.35rem; padding: 0.55rem 1rem; background: var(--navy); color: white; border-radius: var(--radius-lg); font-weight: 700; font-size: 0.8rem; text-decoration: none; white-space: nowrap; transition: background 0.2s;"
               onmouseover="this.style.background='var(--navy-light)'"
               onmouseout="this.style.background='var(--navy)'">
                Assistir <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.65rem;"></i>
            </a>
        </div>
    `).join('');

    document.getElementById("conteudoResultado").innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${videosHtml}
        </div>
    `;
}



    let curiosidadesHtml = dados.curiosidades.map(c => `<li style="font-size: 0.875rem; color: var(--color-text-primary); margin-bottom: 0.25rem;">💡 ${c}</li>`).join('');

    document.getElementById("conteudoResultado").innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div>
                <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--color-text-primary); margin-bottom: 0.25rem;">📌 Introdução</h3>
                <p style="font-size: 0.875rem; color: var(--color-text-muted); line-height: 1.6;">${dados.introducao}</p>
            </div>
            <div>
                <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--color-text-primary); margin-bottom: 0.5rem;">🌎 Explicação Detalhada</h3>
                ${topicosHtml}
            </div>
            <div>
                <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--color-text-primary); margin-bottom: 0.25rem;">🧠 Fatos & Curiosidades</h3>
                <ul style="list-style: none; padding: 0;">${curiosidadesHtml}</ul>
            </div>
            <div style="background: var(--color-surface-2); padding: 1rem; border-radius: var(--radius-lg); border: 1px solid var(--color-warning);">
                <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--color-warning); margin-bottom: 0.25rem;">📝 Resumo para Memorização</h3>
                <p style="font-size: 0.875rem; color: var(--color-text-primary);">${dados.resumo}</p>
            </div>
        </div>
    `;
}

window.renderizarFlashcards = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-solid fa-layer-group" style="color: var(--color-warning);"></i> Flashcards Criados (${dados.flashcards.length})`;
    
    let gridHtml = dados.flashcards.map((f, index) => `
        <div class="flashcard-container" style="margin-bottom: 1rem;">
            <div class="flashcard-inner">
                <div class="flashcard-front geo-card" style="padding: 1.5rem; justify-content: space-between;">
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 900; color: var(--color-warning); text-transform: uppercase; margin-bottom: 0.5rem;">Card #${index + 1}</div>
                        <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-text-primary); text-align: center;">❓ ${f.frente}</div>
                    </div>
                    <button class="btn btn-primary" onclick="flipCard(this)" style="width: 100%; margin-top: 1rem; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span>VER RESPOSTA</span> <i class="fa-solid fa-rotate"></i>
                    </button>
                </div>
                <div class="flashcard-back geo-card" style="padding: 1.5rem; justify-content: space-between; border-color: var(--color-success);">
                    <div>
                        <div style="font-size: 0.75rem; font-weight: 900; color: var(--color-success); text-transform: uppercase; margin-bottom: 0.5rem;">Resposta</div>
                        <div style="font-size: 0.85rem; color: var(--color-text-primary); font-weight: 600; text-align: center; overflow-y: auto; max-height: 110px;">${f.verso}</div>
                    </div>
                    <button class="btn btn-outline" onclick="flipCard(this)" style="width: 100%; margin-top: 1rem; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span>VOLTAR</span> <i class="fa-solid fa-rotate"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById("conteudoResultado").innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; padding: 0.5rem;">
            ${gridHtml}
        </div>
    `;
}

window.renderizarQuiz = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-solid fa-circle-question" style="color: var(--color-info);"></i> Quiz Temático Interativo`;
    
    let perguntasHtml = dados.quiz.map((q, i) => {
        const explicacaoId = `explicacao_${i}`;
        const correta = q.resposta_correta.trim().toUpperCase();

        return `
            <div class="questao-box geo-card" style="margin-bottom: 1.5rem; padding: 1.5rem;" data-respondido="false">
                <h4 style="font-weight: 700; font-size: 1rem; color: var(--color-text-primary); margin-bottom: 1rem;">${i+1}. ${q.pergunta}</h4>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; margin-bottom: 0.5rem;">
                    <div data-letra="A" onclick="verificarAlternativa(this, 'A', '${correta}', '${explicacaoId}')" 
                         class="alternativa-item" style="padding: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.875rem; cursor: pointer; color: var(--color-text-primary); transition: all 0.2s;">
                        <strong style="color: var(--color-info); margin-right: 0.25rem;">A)</strong> ${q.opcoes.A}
                    </div>
                    <div data-letra="B" onclick="verificarAlternativa(this, 'B', '${correta}', '${explicacaoId}')" 
                         class="alternativa-item" style="padding: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.875rem; cursor: pointer; color: var(--color-text-primary); transition: all 0.2s;">
                        <strong style="color: var(--color-info); margin-right: 0.25rem;">B)</strong> ${q.opcoes.B}
                    </div>
                    <div data-letra="C" onclick="verificarAlternativa(this, 'C', '${correta}', '${explicacaoId}')" 
                         class="alternativa-item" style="padding: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.875rem; cursor: pointer; color: var(--color-text-primary); transition: all 0.2s;">
                        <strong style="color: var(--color-info); margin-right: 0.25rem;">C)</strong> ${q.opcoes.C}
                    </div>
                    <div data-letra="D" onclick="verificarAlternativa(this, 'D', '${correta}', '${explicacaoId}')" 
                         class="alternativa-item" style="padding: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 0.875rem; cursor: pointer; color: var(--color-text-primary); transition: all 0.2s;">
                        <strong style="color: var(--color-info); margin-right: 0.25rem;">D)</strong> ${q.opcoes.D}
                    </div>
                </div>

                <div id="${explicacaoId}" style="margin-top: 1rem; padding: 1rem; background: var(--color-surface-2); border: 1px solid var(--color-success); border-radius: var(--radius-md); display: none; transition: all 0.3s;">
                    <p style="font-weight: 700; color: var(--color-success); font-size: 0.85rem; margin-bottom: 0.25rem;">Gabarito Correto: Alternativa [ ${correta} ]</p>
                    <p style="font-size: 0.85rem; color: var(--color-text-primary); font-weight: 500; line-height: 1.5;">${q.explicacao}</p>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById("conteudoResultado").innerHTML = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">${perguntasHtml}</div>`;
}

window.renderizarMapas = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-solid fa-map" style="color: var(--color-danger);"></i> Recomendações Geográficas de Mídia`;
    
    let midiasHtml = dados.midias.map(m => `
        <div class="geo-card" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; border-color: var(--color-danger);">
            <div>
                <span style="display: inline-block; font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.4rem; background: var(--color-surface-2); color: var(--color-danger); border-radius: 4px; margin-bottom: 0.5rem;">${m.tipo}</span>
                <h4 style="font-weight: 700; font-size: 0.95rem; color: var(--color-text-primary); margin-bottom: 0.25rem;">${m.titulo}</h4>
                <p style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 1rem;">Fonte: <strong>${m.sugestao_fonte}</strong></p>
            </div>
            <a href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(m.termo_busca_google)}" target="_blank" class="btn btn-outline" style="text-align: center; font-size: 0.8rem; font-weight: 700; padding: 0.5rem; width: 100%; border-color: var(--color-danger); color: var(--color-danger);">
                <i class="fa-solid fa-images" style="margin-right: 0.25rem;"></i> Buscar Imagens
            </a>
        </div>
    `).join('');

    document.getElementById("conteudoResultado").innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            ${midiasHtml}
        </div>
    `;
}

window.renderizarVideos = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-brands fa-youtube" style="color: #FF0000;"></i> Vídeos Educativos Recomendados`;
    
    let videosHtml = dados.videos_recommendedados.map(v => `
        <div class="geo-card" style="padding: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fa-solid fa-circle-play" style="font-size: 1.5rem; color: #FF0000;"></i>
                <div>
                    <h4 style="font-weight: 700; color: var(--color-text-primary); font-size: 0.95rem; margin: 0;">${v.titulo_sugerido}</h4>
                    <p style="font-size: 0.75rem; color: var(--color-text-muted); margin: 0;">Canal: <strong style="color: var(--color-danger);">${v.canal}</strong></p>
                </div>
            </div>
            <a href="${v.url_busca_pronta}" target="_blank" class="btn btn-primary" style="background: #FF0000; font-weight: 700; padding: 0.5rem 1rem; font-size: 0.8rem; display: flex; align-items: center; gap: 0.25rem; white-space: nowrap;">
                Assistir <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.6rem;"></i>
            </a>
        </div>
    `).join('');

    document.getElementById("conteudoResultado").innerHTML = `<div style="display: flex; flex-direction: column;">${videosHtml}</div>`;
}
