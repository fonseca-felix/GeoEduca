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
        
        alt.classList.remove('hover:bg-gray-50', 'cursor-pointer');
        alt.classList.add('cursor-default');

        if (letra === correta) {
            alt.classList.remove('bg-white', 'border-gray-200');
            alt.classList.add('bg-emerald-50', 'border-emerald-500', 'text-emerald-900', 'font-bold');
        } else if (letra === escolha && escolha !== correta) {
            alt.classList.remove('bg-white', 'border-gray-200');
            alt.classList.add('bg-rose-50', 'border-rose-500', 'text-rose-900', 'font-bold');
        }
    });

    document.getElementById(explicacaoId).classList.remove('hidden');
}

window.renderizarEstudo = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-solid fa-graduation-cap text-emerald-600"></i> Plano de Estudos: ${dados.tema}`;
    
    let topicosHtml = dados.explicacao_topicos.map(t => `
        <div class="mb-4 p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-600 dark:bg-emerald-900/20">
            <h4 class="font-bold text-base text-emerald-900 dark:text-emerald-300 mb-1">${t.titulo}</h4>
            <p class="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">${t.conteudo}</p>
        </div>
    `).join('');

    let curiosidadesHtml = dados.curiosidades.map(c => `<li class="text-sm">💡 ${c}</li>`).join('');

    document.getElementById("conteudoResultado").innerHTML = `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-1">📌 Introdução</h3>
                <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">${dados.introducao}</p>
            </div>
            <div>
                <h3 class="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-2">🌎 Explicação Detalhada</h3>
                ${topicosHtml}
            </div>
            <div>
                <h3 class="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-1">🧠 Fatos & Curiosidades</h3>
                <ul class="list-none space-y-1.5 text-gray-700 dark:text-gray-300">${curiosidadesHtml}</ul>
            </div>
            <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                <h3 class="text-lg font-bold text-amber-800 dark:text-amber-400 mb-1">📝 Resumo para Memorização</h3>
                <p class="text-sm text-gray-700 dark:text-gray-300">${dados.resumo}</p>
            </div>
        </div>
    `;
}

window.renderizarFlashcards = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-solid fa-layer-group text-amber-600"></i> Flashcards Criados (${dados.flashcards.length})`;
    
    let gridHtml = dados.flashcards.map((f, index) => `
        <div class="flashcard-container">
            <div class="flashcard-inner">
                <div class="flashcard-front border-2 border-amber-200 rounded-xl p-4 bg-amber-50/40 dark:bg-amber-900/10 shadow-sm">
                    <div>
                        <div class="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase mb-2">Card #${index + 1}</div>
                        <div class="font-bold text-sm text-gray-800 dark:text-gray-200 text-center">❓ ${f.frente}</div>
                    </div>
                    <button onclick="flipCard(this)" class="w-full mt-2 font-bold text-xs text-amber-700 bg-amber-200/80 hover:bg-amber-200 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
                        <span>VER RESPOSTA</span> <i class="fa-solid fa-rotate"></i>
                    </button>
                </div>
                <div class="flashcard-back border-2 border-emerald-300 rounded-xl p-4 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm">
                    <div>
                        <div class="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase mb-2">Resposta</div>
                        <div class="text-xs text-emerald-950 dark:text-emerald-200 font-semibold text-center overflow-y-auto max-h-[110px] pr-1">${f.verso}</div>
                    </div>
                    <button onclick="flipCard(this)" class="w-full mt-2 font-bold text-xs text-emerald-700 bg-amber-200/80 hover:bg-amber-200 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
                        <span>VOLTAR À PERGUNTA</span> <i class="fa-solid fa-rotate"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById("conteudoResultado").innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-2">
            ${gridHtml}
        </div>
    `;
}

window.renderizarQuiz = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-solid fa-circle-question text-blue-600"></i> Quiz Temático Interativo`;
    
    let perguntasHtml = dados.quiz.map((q, i) => {
        const explicacaoId = `explicacao_${i}`;
        const correta = q.resposta_correta.trim().toUpperCase();

        return `
            <div class="questao-box mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" data-respondido="false">
                <h4 class="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">${i+1}. ${q.pergunta}</h4>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div data-letra="A" onclick="verificarAlternativa(this, 'A', '${correta}', '${explicacaoId}')" 
                         class="alternativa-item p-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors select-none text-gray-800 dark:text-gray-200">
                        <strong class="text-blue-600 dark:text-blue-400 mr-1">A)</strong> ${q.opcoes.A}
                    </div>
                    <div data-letra="B" onclick="verificarAlternativa(this, 'B', '${correta}', '${explicacaoId}')" 
                         class="alternativa-item p-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors select-none text-gray-800 dark:text-gray-200">
                        <strong class="text-blue-600 dark:text-blue-400 mr-1">B)</strong> ${q.opcoes.B}
                    </div>
                    <div data-letra="C" onclick="verificarAlternativa(this, 'C', '${correta}', '${explicacaoId}')" 
                         class="alternativa-item p-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors select-none text-gray-800 dark:text-gray-200">
                        <strong class="text-blue-600 dark:text-blue-400 mr-1">C)</strong> ${q.opcoes.C}
                    </div>
                    <div data-letra="D" onclick="verificarAlternativa(this, 'D', '${correta}', '${explicacaoId}')" 
                         class="alternativa-item p-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors select-none text-gray-800 dark:text-gray-200">
                        <strong class="text-blue-600 dark:text-blue-400 mr-1">D)</strong> ${q.opcoes.D}
                    </div>
                </div>

                <div id="${explicacaoId}" class="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg hidden transition-all">
                    <p class="font-bold text-emerald-800 dark:text-emerald-400 text-xs mb-0.5">Gabrito Correto: Alternativa [ ${correta} ]</p>
                    <p class="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">${q.explicacao}</p>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById("conteudoResultado").innerHTML = `<div class="space-y-1">${perguntasHtml}</div>`;
}

window.renderizarMapas = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-solid fa-map text-rose-600"></i> Recomendações Geográficas de Mídia`;
    
    let midiasHtml = dados.midias.map(m => `
        <div class="p-4 bg-rose-50/60 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800 flex flex-col justify-between">
            <div>
                <span class="inline-block text-[10px] font-bold px-1.5 py-0.5 bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-300 rounded mb-1.5">${m.tipo}</span>
                <h4 class="font-bold text-sm text-gray-800 dark:text-gray-200 mb-0.5">${m.titulo}</h4>
                <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-3">Fonte: <strong>${m.sugestao_fonte}</strong></p>
            </div>
            <a href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(m.termo_busca_google)}" target="_blank" 
               class="text-center text-xs font-bold bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-700 py-1.5 rounded-lg hover:bg-rose-700 hover:text-white dark:hover:bg-rose-800 dark:hover:text-white transition-all block">
                <i class="fa-solid fa-images mr-1"></i> Buscar no Google Imagens
            </a>
        </div>
    `).join('');

    document.getElementById("conteudoResultado").innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            ${midiasHtml}
        </div>
    `;
}

window.renderizarVideos = function(dados) {
    document.getElementById("tituloResultado").innerHTML = `<i class="fa-brands fa-youtube text-red-600"></i> Vídeos Educativos Recomendados`;
    
    let videosHtml = dados.videos_recommendedados.map(v => `
        <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 flex items-center justify-between gap-4">
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-circle-play text-2xl text-red-600 dark:text-red-500"></i>
                <div>
                    <h4 class="font-bold text-gray-800 dark:text-gray-200 text-xs md:text-sm">${v.titulo_sugerido}</h4>
                    <p class="text-[11px] text-gray-500 dark:text-gray-400">Canal: <strong class="text-red-700 dark:text-red-400">${v.canal}</strong></p>
                </div>
            </div>
            <a href="${v.url_busca_pronta}" target="_blank" 
               class="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1 transition-colors">
                Assistir <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
            </a>
        </div>
    `).join('');

    document.getElementById("conteudoResultado").innerHTML = `<div class="space-y-2">${videosHtml}</div>`;
}
