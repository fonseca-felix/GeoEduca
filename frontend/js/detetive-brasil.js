/* =========================================================
   DETETIVE DO BRASIL — Game Engine
   GeoEduca 2026
   ========================================================= */
'use strict';

// ── CONSTANTS ──────────────────────────────────────────────
const API_BASE = '/api';
const HORAS_INICIAIS    = 72;
const CUSTO_CONVERSAR   = 2;
const CUSTO_VIAJAR_CERTO  = 8;
const CUSTO_VIAJAR_ERRADO = 12;

const ESTADOS = [
    { sigla:'AC', nome:'Acre',               regiao:'Norte',        icon:'<i class="fa-solid fa-leaf"></i>' },
    { sigla:'AL', nome:'Alagoas',            regiao:'Nordeste',     icon:'<i class="fa-solid fa-water"></i>' },
    { sigla:'AP', nome:'Amapá',              regiao:'Norte',        icon:'<i class="fa-solid fa-dove"></i>' },
    { sigla:'AM', nome:'Amazonas',           regiao:'Norte',        icon:'<i class="fa-solid fa-tree"></i>' },
    { sigla:'BA', nome:'Bahia',              regiao:'Nordeste',     icon:'<i class="fa-solid fa-sailboat"></i>' },
    { sigla:'CE', nome:'Ceará',              regiao:'Nordeste',     icon:'<i class="fa-solid fa-sun"></i>' },
    { sigla:'DF', nome:'Distrito Federal',   regiao:'Centro-Oeste', icon:'<i class="fa-solid fa-building-columns"></i>' },
    { sigla:'ES', nome:'Espírito Santo',     regiao:'Sudeste',      icon:'<i class="fa-solid fa-mountain"></i>' },
    { sigla:'GO', nome:'Goiás',              regiao:'Centro-Oeste', icon:'<i class="fa-solid fa-wheat-awn"></i>' },
    { sigla:'MA', nome:'Maranhão',           regiao:'Nordeste',     icon:'<i class="fa-solid fa-umbrella-beach"></i>' },
    { sigla:'MT', nome:'Mato Grosso',        regiao:'Centro-Oeste', icon:'<i class="fa-solid fa-tractor"></i>' },
    { sigla:'MS', nome:'Mato Grosso do Sul', regiao:'Centro-Oeste', icon:'<i class="fa-solid fa-horse"></i>' },
    { sigla:'MG', nome:'Minas Gerais',       regiao:'Sudeste',      icon:'<i class="fa-solid fa-gem"></i>' },
    { sigla:'PA', nome:'Pará',               regiao:'Norte',        icon:'<i class="fa-solid fa-cloud-rain"></i>' },
    { sigla:'PB', nome:'Paraíba',            regiao:'Nordeste',     icon:'<i class="fa-solid fa-tree-city"></i>' },
    { sigla:'PR', nome:'Paraná',             regiao:'Sul',          icon:'<i class="fa-solid fa-tree"></i>' },
    { sigla:'PE', nome:'Pernambuco',         regiao:'Nordeste',     icon:'<i class="fa-solid fa-masks-theater"></i>' },
    { sigla:'PI', nome:'Piauí',              regiao:'Nordeste',     icon:'<i class="fa-solid fa-jar"></i>' },
    { sigla:'RJ', nome:'Rio de Janeiro',     regiao:'Sudeste',      icon:'<i class="fa-solid fa-mountain-sun"></i>' },
    { sigla:'RN', nome:'Rio Grande do Norte',regiao:'Nordeste',     icon:'<i class="fa-solid fa-umbrella-beach"></i>' },
    { sigla:'RS', nome:'Rio Grande do Sul',  regiao:'Sul',          icon:'<i class="fa-solid fa-mug-hot"></i>' },
    { sigla:'RO', nome:'Rondônia',           regiao:'Norte',        icon:'<i class="fa-solid fa-leaf"></i>' },
    { sigla:'RR', nome:'Roraima',            regiao:'Norte',        icon:'<i class="fa-solid fa-feather"></i>' },
    { sigla:'SC', nome:'Santa Catarina',     regiao:'Sul',          icon:'<i class="fa-solid fa-snowflake"></i>' },
    { sigla:'SP', nome:'São Paulo',          regiao:'Sudeste',      icon:'<i class="fa-solid fa-city"></i>' },
    { sigla:'SE', nome:'Sergipe',            regiao:'Nordeste',     icon:'<i class="fa-solid fa-masks-theater"></i>' },
    { sigla:'TO', nome:'Tocantins',          regiao:'Norte',        icon:'<i class="fa-solid fa-water"></i>' },
];
const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

// ── ESTADO DO JOGO ─────────────────────────────────────────
let G = criarEstadoInicial();

function criarEstadoInicial() {
    return {
        caso: null,
        rotaIndex: 0,
        horasRestantes: HORAS_INICIAIS,
        npcsConversados: new Set(),
        caderneta: [],
        errosViagem: 0,
        acertosViagem: 0,
        estadosVisitados: [],
        inicioPartida: null,
        ativo: false,
    };
}

let token = null;

// ── INIT ───────────────────────────────────────────────────
function init() {
    token = localStorage.getItem('geo_token');
    if (!token) { window.location.href = '/index.html'; return; }
    mostrarTela('tela-inicio');
}

// ── GESTÃO DE TELAS ────────────────────────────────────────
function mostrarTela(id) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    const el = document.getElementById(id);
    if (el) { el.classList.add('ativa'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

// ── API ────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
    const res = await fetch(API_BASE + path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(data.error || 'Erro na API'), { status: res.status, data });
    return data;
}

// ── INICIAR JOGO ───────────────────────────────────────────
async function iniciarJogo() {
    mostrarTela('tela-carregamento');
    setLoadingMsg('🔍 Gerando novo caso criminal...');
    ocultarBtnRetry();

    try {
        const data = await apiFetch('/detetive/novo-caso', { method: 'POST' });

        if (!data.sucesso || !data.caso) {
            throw new Error(data.error || 'Caso inválido recebido.');
        }

        G = criarEstadoInicial();
        G.caso = data.caso;
        G.estadosVisitados = [data.caso.rota[0]?.estadoAtual].filter(Boolean);
        G.inicioPartida = Date.now();
        G.ativo = true;

        mostrarBriefing();
    } catch (err) {
        console.error('Erro ao iniciar jogo:', err);
        setLoadingMsg('<i class="fa-solid fa-xmark"></i> ' + (err.message || 'Erro de conexão. Verifique a internet.'));
        mostrarBtnRetry();
    }
}

function setLoadingMsg(msg) {
    const el = document.getElementById('loading-msg');
    if (el) el.innerHTML = msg;
}
function mostrarBtnRetry() {
    const el = document.getElementById('btn-retry');
    if (el) el.style.display = 'inline-flex';
}
function ocultarBtnRetry() {
    const el = document.getElementById('btn-retry');
    if (el) el.style.display = 'none';
}

// ── TELA BRIEFING ──────────────────────────────────────────
function mostrarBriefing() {
    const { caso } = G;
    const primeiro = caso.rota[0];

    _set('briefing-patrimonio', caso.patrimonioRoubado);
    _set('briefing-desc', caso.descricaoRoubo);
    _set('briefing-crim-nome', `${caso.criminoso.nome}`);
    _set('briefing-crim-apelido', `"${caso.criminoso.apelido}"`);
    _set('briefing-crim-desc', caso.criminoso.descricao);
    _set('briefing-crim-motivo', caso.criminoso.motivacao);
    _set('briefing-local', `${primeiro.nomeEstado} (${primeiro.estadoAtual})`);

    mostrarTela('tela-briefing');
}

// ── TELA INVESTIGAÇÃO ──────────────────────────────────────
function mostrarInvestigacao() {
    const rotaAtual = G.caso.rota[G.rotaIndex];

    atualizarTopBar();
    renderizarProgressoRota();

    _set('inv-estado-sigla', rotaAtual.estadoAtual);
    _set('inv-estado-nome', rotaAtual.nomeEstado);

    const msgEl = document.getElementById('inv-mensagem');
    const alertaEl = document.getElementById('alerta-final');

    if (rotaAtual.ehEstadoFinal) {
        if (msgEl) { msgEl.textContent = 'Converse com as testemunhas para confirmar o esconderijo!'; msgEl.style.color = 'var(--text-muted)'; }
        if (alertaEl) { alertaEl.textContent = '🚨 ATENÇÃO! Evidências apontam que o criminoso está escondido AQUI!'; alertaEl.style.display = 'block'; }
    } else {
        if (msgEl) { msgEl.textContent = 'Converse com os moradores para descobrir o próximo paradeiro do suspeito.'; msgEl.style.color = 'var(--text-muted)'; }
        if (alertaEl) alertaEl.style.display = 'none';
    }

    // Mostrar/ocultar botão "Prender" vs "Aeroporto"
    const btnAeroporto = document.getElementById('btn-aeroporto');
    const btnPrender   = document.getElementById('btn-prender');
    if (rotaAtual.ehEstadoFinal) {
        if (btnAeroporto) btnAeroporto.style.display = 'none';
        if (btnPrender)   btnPrender.style.display = 'inline-flex';
    } else {
        if (btnAeroporto) btnAeroporto.style.display = 'inline-flex';
        if (btnPrender)   btnPrender.style.display = 'none';
    }

    renderizarNPCs(rotaAtual);
    mostrarTela('tela-investigacao');
}

function renderizarProgressoRota() {
    const rota = G.caso.rota;
    const container = document.getElementById('progresso-rota');
    if (!container) return;
    container.innerHTML = '';

    rota.forEach((passo, i) => {
        const div = document.createElement('div');
        div.className = 'rota-passo';

        if (i < G.rotaIndex) {
            div.classList.add('visitado');
            div.textContent = '✓';
            div.title = passo.nomeEstado;
        } else if (i === G.rotaIndex) {
            div.classList.add('atual');
            div.textContent = passo.estadoAtual;
            div.title = passo.nomeEstado;
        } else {
            div.classList.add('oculto');
            div.textContent = '?';
        }

        container.appendChild(div);

        if (i < rota.length - 1) {
            const linha = document.createElement('div');
            linha.className = 'rota-linha';
            container.appendChild(linha);
        }
    });
}

function renderizarNPCs(rotaAtual) {
    const grid = document.getElementById('npc-grid');
    if (!grid) return;
    grid.innerHTML = '';

    rotaAtual.npcs.forEach((npc, i) => {
        const chave = `${G.rotaIndex}-${i}`;
        const jaConversou = G.npcsConversados.has(chave);

        const card = document.createElement('div');
        card.className = `npc-card${jaConversou ? ' conversado' : ''}`;
        card.innerHTML = `
            ${jaConversou ? '<div class="badge-conversado"><i class="fa-solid fa-check"></i></div>' : ''}
            <div class="npc-emoji"><i class="${npc.iconClass || 'fa-solid fa-user'}"></i></div>
            <div class="npc-name">${npc.nome}</div>
            <div class="npc-job">${npc.profissao}</div>
            <div class="npc-cost">${jaConversou ? '<i class="fa-solid fa-check"></i> Já conversou' : `<i class="fa-solid fa-comment-dots"></i> Custo: −${CUSTO_CONVERSAR}h`}</div>
        `;

        if (!jaConversou) {
            card.addEventListener('click', () => abrirDialogoNPC(npc, chave, i));
        }

        grid.appendChild(card);
    });
}

// ── DIÁLOGO NPC ────────────────────────────────────────────
function abrirDialogoNPC(npc, chave, npcIndex) {
    if (!G.ativo || G.horasRestantes <= 0) return;

    G.horasRestantes -= CUSTO_CONVERSAR;
    G.npcsConversados.add(chave);

    const rotaAtual = G.caso.rota[G.rotaIndex];
    G.caderneta.push({
        estado:  `${rotaAtual.nomeEstado} (${rotaAtual.estadoAtual})`,
        npcNome: npc.nome,
        npcJob:  npc.profissao,
        dica:    npc.dica,
    });

    const emojiEl = document.getElementById('npc-dialog-emoji');
    if (emojiEl) emojiEl.innerHTML = `<i class="${npc.iconClass || 'fa-solid fa-user'}"></i>`;
    _set('npc-dialog-nome', npc.nome);
    _set('npc-dialog-job', npc.profissao);
    _set('npc-dialog-dica', `"${npc.dica}"`);

    mostrarTela('tela-npc');
    verificarFim();
}

// ── CADERNETA ──────────────────────────────────────────────
function mostrarCaderneta() {
    const lista = document.getElementById('caderneta-lista');
    if (!lista) return;
    lista.innerHTML = '';

    if (G.caderneta.length === 0) {
        lista.innerHTML = `<div class="caderneta-vazia">
            <i class="fa-solid fa-file-pen"></i> Caderneta vazia!<br>
            <span style="font-size:0.85rem">Converse com os moradores para coletar pistas.</span>
        </div>`;
    } else {
        G.caderneta.forEach(nota => {
            const div = document.createElement('div');
            div.className = 'nota-item';
            div.innerHTML = `
                <div class="nota-estado"><i class="fa-solid fa-location-dot"></i> ${nota.estado}</div>
                <div class="nota-npc">${nota.npcNome} — ${nota.npcJob}</div>
                <div class="nota-texto">${nota.dica}</div>
            `;
            lista.appendChild(div);
        });
    }

    mostrarTela('tela-caderneta');
}

// ── AEROPORTO ──────────────────────────────────────────────
function mostrarAeroporto() {
    const rotaAtual = G.caso.rota[G.rotaIndex];
    _set('aeroporto-estado-atual', `${rotaAtual.nomeEstado} (${rotaAtual.estadoAtual})`);
    _set('aeroporto-custo-certo', CUSTO_VIAJAR_CERTO + 'h');
    _set('aeroporto-custo-errado', CUSTO_VIAJAR_ERRADO + 'h');

    const container = document.getElementById('aeroporto-estados');
    if (!container) return;
    container.innerHTML = '';

    REGIOES.forEach(regiao => {
        const estadosDaRegiao = ESTADOS.filter(e => e.regiao === regiao);

        const section = document.createElement('div');
        section.className = 'regiao-section';

        const titulo = document.createElement('div');
        titulo.className = 'regiao-titulo';
        titulo.textContent = regiao;
        section.appendChild(titulo);

        const grid = document.createElement('div');
        grid.className = 'estados-grid';

        estadosDaRegiao.forEach(e => {
            const btn = document.createElement('button');
            const eAtual = e.sigla === rotaAtual.estadoAtual;
            btn.className = `estado-btn${eAtual ? ' atual-estado' : ''}`;
            btn.innerHTML = `
                <span class="estado-emoji">${e.icon}</span>
                <span class="estado-sigla">${e.sigla}</span>
                <span class="estado-nome">${e.nome}</span>
            `;
            btn.disabled = eAtual;
            btn.title = eAtual ? 'Você já está aqui' : `Viajar para ${e.nome}`;

            if (!eAtual) {
                btn.addEventListener('click', () => viajar(e.sigla, e.nome));
            }
            grid.appendChild(btn);
        });

        section.appendChild(grid);
        container.appendChild(section);
    });

    mostrarTela('tela-aeroporto');
}

// ── VIAJAR ─────────────────────────────────────────────────
function viajar(siglaDestino, nomeDestino) {
    if (!G.ativo) return;
    const rotaAtual = G.caso.rota[G.rotaIndex];
    const acertou = siglaDestino === rotaAtual.proximoEstado;

    if (acertou) {
        G.horasRestantes -= CUSTO_VIAJAR_CERTO;
        G.acertosViagem++;
        G.rotaIndex++;
        G.npcsConversados = new Set();
        G.estadosVisitados.push(siglaDestino);

        exibirModalViagem(true, nomeDestino, CUSTO_VIAJAR_CERTO, () => {
            verificarFim();
            if (G.ativo) mostrarInvestigacao();
        });
    } else {
        G.horasRestantes -= CUSTO_VIAJAR_ERRADO;
        G.errosViagem++;

        exibirModalViagem(false, nomeDestino, CUSTO_VIAJAR_ERRADO, () => {
            verificarFim();
            if (G.ativo) mostrarInvestigacao();
        });
    }
}

function exibirModalViagem(acertou, nomeDestino, custo, onFechar) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const box = document.createElement('div');
    box.className = `modal-box ${acertou ? 'acerto' : 'erro-modal'}`;

    if (acertou) {
        box.innerHTML = `
            <div class="modal-icon">✈️</div>
            <div class="modal-titulo" style="color:var(--success)">Destino Correto!</div>
            <div class="modal-desc">Você voou para <strong>${nomeDestino}</strong> e encontrou rastros frescos do suspeito!</div>
            <div class="modal-custo" style="color:var(--success)"><i class="fa-solid fa-stopwatch"></i> −${custo} horas gastas</div>
        `;
    } else {
        box.innerHTML = `
            <div class="modal-icon">🚫</div>
            <div class="modal-titulo" style="color:var(--danger)">Pista Errada!</div>
            <div class="modal-desc">O suspeito não passou por <strong>${nomeDestino}</strong>. Você perdeu tempo precioso!</div>
            <div class="modal-custo" style="color:var(--danger)"><i class="fa-solid fa-stopwatch"></i> −${custo} horas (com penalidade)</div>
        `;
    }

    const btn = document.createElement('button');
    btn.className = acertou ? 'btn btn-success' : 'btn btn-ghost';
    btn.textContent = acertou ? 'Continuar Investigação →' : '← Voltar e Investigar';
    btn.addEventListener('click', () => { overlay.remove(); onFechar(); });
    box.appendChild(btn);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

// ── PRENDER O CRIMINOSO ────────────────────────────────────
function prenderCriminoso() {
    if (!G.ativo) return;
    finalizarPartida('VITÓRIA');
}

// ── VERIFICAÇÃO DE FIM ─────────────────────────────────────
function verificarFim() {
    if (!G.ativo) return;
    if (G.horasRestantes <= 0) {
        G.horasRestantes = 0;
        finalizarPartida('DERROTA');
    }
}

// ── FINALIZAR PARTIDA ──────────────────────────────────────
async function finalizarPartida(resultado) {
    if (!G.ativo) return;
    G.ativo = false;

    mostrarFimDeJogo(resultado);

    try {
        await apiFetch('/detetive/finalizar-partida', {
            method: 'POST',
            body: JSON.stringify({
                resultado,
                tempo_jogado_segundos: Math.floor((Date.now() - G.inicioPartida) / 1000),
                erros_viagem:   G.errosViagem,
                acertos_viagem: G.acertosViagem,
                estados_visitados: G.estadosVisitados,
            }),
        });
    } catch (err) {
        console.warn('<i class="fa-solid fa-triangle-exclamation"></i> Não foi possível salvar a partida:', err.message);
    }
}

// ── FIM DE JOGO ────────────────────────────────────────────
function mostrarFimDeJogo(resultado) {
    const vitoria = resultado === 'VITÓRIA';
    const tempoS  = Math.floor((Date.now() - G.inicioPartida) / 1000);
    const pontuacao = vitoria
        ? Math.max(100, 1000 - G.errosViagem * 80 - Math.floor(tempoS / 60))
        : Math.max(0, G.acertosViagem * 30);

    _set('fim-icone', vitoria ? '<i class="fa-solid fa-trophy"></i>' : '⏰');

    const tituloEl = document.getElementById('fim-titulo');
    if (tituloEl) {
        tituloEl.textContent = vitoria ? 'Criminoso Preso!' : 'Tempo Esgotado!';
        tituloEl.className = `fim-titulo ${vitoria ? 'vitoria' : 'derrota'}`;
    }

    _set('fim-mensagem', vitoria
        ? `Excelente trabalho, Detetive! Você prendeu ${G.caso.criminoso.nome} e recuperou "${G.caso.patrimonioRoubado}" para o Brasil!`
        : `${G.caso.criminoso.nome} conseguiu escapar com "${G.caso.patrimonioRoubado}". Não desanime — tente novamente!`
    );

    _set('fim-acertos', G.acertosViagem);
    _set('fim-erros',   G.errosViagem);
    _set('fim-estados', G.estadosVisitados.length);
    _set('fim-tempo',   formatarTempo(tempoS));
    _set('fim-pontuacao', pontuacao);

    mostrarTela('tela-fim');
}

// ── TOP BAR ────────────────────────────────────────────────
function atualizarTopBar() {
    const h    = Math.max(0, G.horasRestantes);
    const dias = Math.floor(h / 24);
    const hrs  = h % 24;

    const timerEl = document.getElementById('timer-display');
    if (timerEl) {
        timerEl.textContent = `<i class="fa-solid fa-stopwatch"></i> ${dias}d ${hrs}h restantes`;
        timerEl.className   = `timer-display${h <= 16 ? ' urgente' : ''}`;
    }

    const locEl = document.getElementById('location-badge');
    if (locEl && G.caso?.rota[G.rotaIndex]) {
        locEl.textContent = G.caso.rota[G.rotaIndex].estadoAtual;
    }
}

// ── UTILS ──────────────────────────────────────────────────
function _set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function formatarTempo(s) {
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${s % 60}s`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
}

// ── START ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
