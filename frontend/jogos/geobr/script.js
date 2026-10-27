// ============================================================
// DADOS DOS ESTADOS COM BIOMAS E IMAGENS REAIS
// ============================================================
const estadosAPI = [
    { uf: "AC", name: "ACRE", capital: "RIO BRANCO", regiao: "Norte", bioma: "Amazônia", flag_url: "assets/flags/ac.svg", bioma_img: "img/amazonia.jpg", curiosidade: "Único estado brasileiro inteiramente na Amazônia Ocidental. Maior produtor de castanha-do-pará do país." },
    { uf: "AL", name: "ALAGOAS", capital: "MACEIÓ", regiao: "Nordeste", bioma: "Mata Atlântica", flag_url: "assets/flags/al.svg", bioma_img: "img/mata_atlantica.gif", curiosidade: "Famoso pelas lagoas Mundaú e Manguaba. Praias de Maragogi são conhecidas como 'Caribe Brasileiro'." },
    { uf: "AP", name: "AMAPÁ", capital: "MACAPÁ", regiao: "Norte", bioma: "Amazônia", flag_url: "assets/flags/ap.svg", bioma_img: "img/amazonia.jpg", curiosidade: "Cortado pela Linha do Equador. A cidade de Macapá não tem horário de verão." },
    { uf: "AM", name: "AMAZONAS", capital: "MANAUS", regiao: "Norte", bioma: "Amazônia", flag_url: "assets/flags/am.svg", bioma_img: "img/amazonia.jpg", curiosidade: "Maior estado brasileiro em área. Abriga o Encontro das Águas e a Zona Franca de Manaus." },
    { uf: "BA", name: "BAHIA", capital: "SALVADOR", regiao: "Nordeste", bioma: "Caatinga", flag_url: "assets/flags/ba.svg", bioma_img: "img/caatinga.jpg", curiosidade: "Primeira capital do Brasil (1549-1763). Berço do acarajé, samba de roda e axé." },
    { uf: "CE", name: "CEARÁ", capital: "FORTALEZA", regiao: "Nordeste", bioma: "Caatinga", flag_url: "assets/flags/ce.svg", bioma_img: "img/caatinga.jpg", curiosidade: "Primeiro estado a abolir a escravidão (1884). Famoso pelas dunas de Jericoacoara." },
    { uf: "DF", name: "DISTRITO FEDERAL", capital: "BRASÍLIA", regiao: "Centro-Oeste", bioma: "Cerrado", flag_url: "assets/flags/df.svg", bioma_img: "img/cerrado.webp", curiosidade: "Projetado por Oscar Niemeyer e Lúcio Costa. Patrimônio Mundial da UNESCO." },
    { uf: "ES", name: "ESPÍRITO SANTO", capital: "VITÓRIA", regiao: "Sudeste", bioma: "Mata Atlântica", flag_url: "assets/flags/es.svg", bioma_img: "img/mata_atlantica.gif", curiosidade: "Possui o Convento da Penha (1558). Praias de Guarapari são famosas pelas águas claras." },
    { uf: "GO", name: "GOIÁS", capital: "GOIÂNIA", regiao: "Centro-Oeste", bioma: "Cerrado", flag_url: "assets/flags/go.svg", bioma_img: "img/cerrado.webp", curiosidade: "Conhecido pelas águas termais de Caldas Novas, as maiores do mundo." },
    { uf: "MA", name: "MARANHÃO", capital: "SÃO LUÍS", regiao: "Nordeste", bioma: "Cerrado", flag_url: "assets/flags/ma.svg", bioma_img: "img/cerrado.webp", curiosidade: "Lar dos Lençóis Maranhenses, dunas com lagoas de água doce." },
    { uf: "MT", name: "MATO GROSSO", capital: "CUIABÁ", regiao: "Centro-Oeste", bioma: "Cerrado", flag_url: "assets/flags/mt.svg", bioma_img: "img/cerrado.webp", curiosidade: "Portal do Pantanal, maior planície alagável do mundo." },
    { uf: "MS", name: "MATO GROSSO DO SUL", capital: "CAMPO GRANDE", regiao: "Centro-Oeste", bioma: "Pantanal", flag_url: "assets/flags/ms.svg", bioma_img: "img/pantanal.jpg", curiosidade: "Abriga Bonito, referência mundial em ecoturismo e águas cristalinas." },
    { uf: "MG", name: "MINAS GERAIS", capital: "BELO HORIZONTE", regiao: "Sudeste", bioma: "Cerrado", flag_url: "assets/flags/mg.svg", bioma_img: "img/cerrado.webp", curiosidade: "Maior produtor de café do Brasil. Famoso pelo pão de queijo e cachaça." },
    { uf: "PA", name: "PARÁ", capital: "BELÉM", regiao: "Norte", bioma: "Amazônia", flag_url: "assets/flags/pa.svg", bioma_img: "img/amazonia.jpg", curiosidade: "Famoso pelo Mercado Ver-o-Peso e Círio de Nazaré. Maior produtor de açaí." },
    { uf: "PB", name: "PARAÍBA", capital: "JOÃO PESSOA", regiao: "Nordeste", bioma: "Caatinga", flag_url: "assets/flags/pb.svg", bioma_img: "img/caatinga.jpg", curiosidade: "Ponta do Seixas: ponto mais oriental das Américas, onde o sol nasce primeiro." },
    { uf: "PR", name: "PARANÁ", capital: "CURITIBA", regiao: "Sul", bioma: "Mata Atlântica", flag_url: "assets/flags/pr.svg", bioma_img: "img/mata_atlantica.gif", curiosidade: "Abriga as Cataratas do Iguaçu, uma das 7 Maravilhas Naturais do Mundo." },
    { uf: "PE", name: "PERNAMBUCO", capital: "RECIFE", regiao: "Nordeste", bioma: "Caatinga", flag_url: "assets/flags/pe.svg", bioma_img: "img/caatinga.jpg", curiosidade: "Berço do frevo e maracatu. Olinda é Patrimônio da Humanidade." },
    { uf: "PI", name: "PIAUÍ", capital: "TERESINA", regiao: "Nordeste", bioma: "Caatinga", flag_url: "assets/flags/pi.svg", bioma_img: "img/caatinga.jpg", curiosidade: "Parque Nacional Serra da Capivara tem pinturas rupestres de 25 mil anos." },
    { uf: "RJ", name: "RIO DE JANEIRO", capital: "RIO DE JANEIRO", regiao: "Sudeste", bioma: "Mata Atlântica", flag_url: "assets/flags/rj.svg", bioma_img: "img/mata_atlantica.gif", curiosidade: "Cristo Redentor é uma das 7 Maravilhas do Mundo Moderno." },
    { uf: "RN", name: "RIO GRANDE DO NORTE", capital: "NATAL", regiao: "Nordeste", bioma: "Caatinga", flag_url: "assets/flags/rn.svg", bioma_img: "img/caatinga.jpg", curiosidade: "Possui o maior cajueiro do mundo (8.500 m²). Dunas de Genipabu são famosas." },
    { uf: "RS", name: "RIO GRANDE DO SUL", capital: "PORTO ALEGRE", regiao: "Sul", bioma: "Pampa", flag_url: "assets/flags/rs.svg", bioma_img: "img/pampa.jpg", curiosidade: "Tradição do chimarrão, churrasco e fandango. Cultura gaúcha forte." },
    { uf: "RO", name: "RONDÔNIA", capital: "PORTO VELHO", regiao: "Norte", bioma: "Amazônia", flag_url: "assets/flags/ro.svg", bioma_img: "img/amazonia.jpg", curiosidade: "Nome em homenagem ao marechal Cândido Rondon. Estrada de Ferro Madeira-Mamoré." },
    { uf: "RR", name: "RORAIMA", capital: "BOA VISTA", regiao: "Norte", bioma: "Amazônia", flag_url: "assets/flags/rr.svg", bioma_img: "img/amazonia.jpg", curiosidade: "Monte Roraima: tepuy na tríplice fronteira Brasil-Venezuela-Guiana." },
    { uf: "SC", name: "SANTA CATARINA", capital: "FLORIANÓPOLIS", regiao: "Sul", bioma: "Mata Atlântica", flag_url: "assets/flags/sc.svg", bioma_img: "img/mata_atlantica.gif", curiosidade: "Forte influência alemã e italiana. Oktoberfest em Blumenau." },
    { uf: "SP", name: "SÃO PAULO", capital: "SÃO PAULO", regiao: "Sudeste", bioma: "Mata Atlântica", flag_url: "assets/flags/sp.svg", bioma_img: "img/mata_atlantica.gif", curiosidade: "Maior economia do país. Maior cidade da América Latina (12 milhões)." },
    { uf: "SE", name: "SERGIPE", capital: "ARACAJU", regiao: "Nordeste", bioma: "Mata Atlântica", flag_url: "assets/flags/se.svg", bioma_img: "img/mata_atlantica.gif", curiosidade: "Menor estado do Brasil em área (21.910 km²). Famoso pela laranja e coco." },
    { uf: "TO", name: "TOCANTINS", capital: "PALMAS", regiao: "Norte", bioma: "Cerrado", flag_url: "assets/flags/to.svg", bioma_img: "img/cerrado.webp", curiosidade: "Estado mais jovem do Brasil, criado pela Constituição de 1988." }
];

// Lista de biomas para alternativas
const biomasList = ["Amazônia", "Cerrado", "Mata Atlântica", "Caatinga", "Pantanal", "Pampa"];

// Ícone visual único: o quiz não usa emojis nas alternativas.
const biomaIcons = {
    "Amazônia": "fa-tree",
    "Cerrado": "fa-seedling",
    "Mata Atlântica": "fa-leaf",
    "Caatinga": "fa-sun",
    "Pantanal": "fa-water",
    "Pampa": "fa-mountain-sun"
};

// Cores para cada bioma
const biomaColors = {
    "Amazônia": "#2E7D32",
    "Cerrado": "#F9A825",
    "Mata Atlântica": "#43A047",
    "Caatinga": "#E65100",
    "Pantanal": "#00897B",
    "Pampa": "#78909C"
};

// ============================================================
// PATENTES
// ============================================================
const patentes = ["EXPLORADOR", "CONHECEDOR", "ESPECIALISTA", "CARTOGRAFO", "MESTRE DO BRASIL"];
const xpThresholds = [0, 30, 100, 220, 420];

// ============================================================
// RANKING ESCOLAR
// ============================================================
let ranking = [];
const PERFIS_JOGADORES_KEY = "geo_suite_profiles";

function carregarPerfisJogadores() {
    try {
        return JSON.parse(localStorage.getItem(PERFIS_JOGADORES_KEY)) || {};
    } catch {
        return {};
    }
}

function buscarPerfilJogador(nome) {
    return carregarPerfisJogadores()[normalizarNomeJogador(nome)] || null;
}

function salvarPerfilJogador(nome, xp, personagem, patente) {
    if (!nome) return;
    const perfis = carregarPerfisJogadores();
    const chave = normalizarNomeJogador(nome);
    const anterior = perfis[chave] || {};
    perfis[chave] = {
        ...anterior,
        nome: String(nome).trim().replace(/\s+/g, " "),
        xp: Number(xp) || 0,
        personagem: normalizarPersonagem(personagem),
        patente: patente || "EXPLORADOR",
        atualizadoEm: Date.now()
    };
    localStorage.setItem(PERFIS_JOGADORES_KEY, JSON.stringify(perfis));
}

function carregarRanking() {
    const saved = localStorage.getItem("missaoBrasil_ranking");
    if (saved && saved !== "[]") {
        ranking = JSON.parse(saved);
        ranking = ranking.slice(0, 5);
    } else {
        ranking = [];
    }
}

function salvarRanking() {
    ranking.sort((a, b) => b.xp - a.xp);
    ranking = ranking.slice(0, 5);
    localStorage.setItem("missaoBrasil_ranking", JSON.stringify(ranking));
}

function resetarRankingCompleto() {
    ranking = [];
    salvarRanking();
    atualizarRankingUI();
    mostrarNotificacao("RANKING RESETADO COM SUCESSO!", "info");
}

function limparRankingComoGeoMundo() {
    const confirmado = confirm("Tem certeza que deseja apagar todo o ranking? Essa ação não pode ser desfeita.");
    if (!confirmado) return;
    resetarRankingCompleto();
}

function atualizarRankingUI() {
    const container = document.getElementById("rankingList");
    container.replaceChildren();
    if (!ranking.length) { const empty=document.createElement("p");empty.className="ranking-empty";empty.textContent="Nenhuma partida registrada. Seu desafio pode começar este ranking.";container.append(empty);return; }
    ranking.slice(0,5).forEach((item,index)=>{
      const row=document.createElement("div");row.className="ranking-row";
      for(const [cls,text] of [["ranking-pos",index+1],["ranking-nome",item.nome],["ranking-xp",`${item.xp} XP`]]) {const span=document.createElement("span");span.className=cls;span.textContent=text;row.append(span);}
      container.append(row);
    });
}



function normalizarNomeJogador(nome) {
    return String(nome || "").trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");
}

function adicionarOuAtualizarRanking(nome, serie, xp, patente, personagem = "classica") {
    if (!nome || !serie) return;
    
    const nomeNormalizado = normalizarNomeJogador(nome);
    const index = ranking.findIndex(p => normalizarNomeJogador(p.nome) === nomeNormalizado);
    if (index !== -1) {
        const novoRecorde = xp >= ranking[index].xp;
        ranking[index].xp = Math.max(ranking[index].xp, xp);
        if (novoRecorde) ranking[index].patente = patente;
        ranking[index].personagem = normalizarPersonagem(personagem);
    } else {
        ranking.push({ nome, serie, xp, patente, personagem: normalizarPersonagem(personagem) });
    }
    salvarPerfilJogador(nome, xp, personagem, patente);
    salvarRanking();
    atualizarRankingUI();
}

// ============================================================
// PLAYER STATE
// ============================================================
let player = {
    nome: "",
    serie: "GEO BR",
    personagem: "classica",
    xp: 0,
    totalCorrect: 0,
    unlockedStates: new Array(27).fill(false),
    levelIndex: 0,
    maxCombo: 0,
    modoAtual: "bandeiras",
    achievements: {
        firstHit: false, fiveCombo: false, northComplete: false,
        northeastComplete: false, centerwestComplete: false,
        southeastComplete: false, southComplete: false, allFlags: false
    }
};

let modoPendenteAbertura = null;

function prepararNovoJogador() {
    player.nome = "";
    player.xp = 0;
    player.totalCorrect = 0;
    player.unlockedStates = new Array(27).fill(false);
    player.levelIndex = 0;
    player.maxCombo = 0;
    player.achievements = {
        firstHit: false, fiveCombo: false, northComplete: false,
        northeastComplete: false, centerwestComplete: false,
        southeastComplete: false, southComplete: false, allFlags: false
    };
}

// ============================================================
// GAME SESSION
// ============================================================
let gameSession = {
    currentIndex: 0,
    shuffledIndices: [],
    score: 0,
    combo: 0,
    answered: false,
    currentCorrect: null,
    timerInterval: null,
    secondsElapsed: 0,
    autoNextTimeout: null,
    regionFilter: "all",
    sessionMaxCombo: 0,
    modoJogo: "bandeiras",
    tempoQuestao: 5,
    tempoRestante: 5,
    vidas: 3,
    dicaUsada: false
};

// ============================================================
// PERSISTÊNCIA
// ============================================================
function salvarLocal() {
    localStorage.setItem("missaoBrasil_neo", JSON.stringify({
        serie: player.serie,
        personagem: player.personagem,
        xp: player.xp,
        totalCorrect: player.totalCorrect,
        unlocked: player.unlockedStates,
        levelIdx: player.levelIndex,
        maxCombo: player.maxCombo,
        modoAtual: player.modoAtual,
        achievements: player.achievements
    }));
}

function carregarLocal() {
    const data = localStorage.getItem("missaoBrasil_neo");
    if (data) {
        const p = JSON.parse(data);
        // O nome identifica apenas a sessão atual e nunca é recuperado do navegador.
        player.nome = "";
        player.serie = "GEO BR";
        player.personagem = normalizarPersonagem(p.personagem);
        player.xp = p.xp || 0;
        player.totalCorrect = p.totalCorrect || 0;
        player.unlockedStates = p.unlocked || new Array(27).fill(false);
        player.levelIndex = p.levelIdx || 0;
        player.maxCombo = p.maxCombo || 0;
        player.modoAtual = p.modoAtual || "bandeiras";
        player.achievements = p.achievements || {
            firstHit: false, fiveCombo: false, northComplete: false,
            northeastComplete: false, centerwestComplete: false,
            southeastComplete: false, southComplete: false, allFlags: false
        };
    }
    
    atualizarPatente();
    atualizarModoUI();
    // Migra automaticamente registros antigos, removendo o nome do perfil local.
    salvarLocal();
}



function atualizarPatente() {
    for (let i = xpThresholds.length - 1; i >= 0; i--) {
        if (player.xp >= xpThresholds[i]) {
            player.levelIndex = i;
            break;
        }
    }
    salvarLocal();
}

function adicionarXP(valor) {
    const nivelAntigo = player.levelIndex;
    player.xp += valor;
    atualizarPatente();
    atualizarBarraXP();
    
    if (player.nome && player.serie) {
        adicionarOuAtualizarRanking(player.nome, player.serie, player.xp, patentes[player.levelIndex], player.personagem);
    }
    
    if (player.levelIndex > nivelAntigo) {
        mostrarNotificacao(`SUBIU PARA ${patentes[player.levelIndex]}!`, "info");
    }
}

function atualizarBarraXP() {
    const atual = xpThresholds[player.levelIndex];
    const proximo = xpThresholds[player.levelIndex + 1] || xpThresholds[player.levelIndex] + 200;
    const xpNoNivel = player.xp - atual;
    const xpNecessario = proximo - atual;
    const porcentagem = Math.min(100, Math.max(0, (xpNoNivel / xpNecessario) * 100));
    
    const barra = document.getElementById("barraXP");
    if (barra) barra.style.width = `${porcentagem}%`;
    
    const xpTexto = document.getElementById("xpTexto");
    if (xpTexto) xpTexto.innerText = `${xpNoNivel} / ${xpNecessario}`;
    
    const proximoNivel = document.getElementById("proximoNivel");
    if (proximoNivel && player.levelIndex < patentes.length - 1) {
        proximoNivel.innerText = `PRÓXIMO: ${patentes[player.levelIndex + 1]}`;
    } else if (proximoNivel) {
        proximoNivel.innerText = "NÍVEL MÁXIMO!";
    }
}

// ============================================================
// NOTIFICAÇÕES
// ============================================================
function mostrarNotificacao(mensagem, tipo, xpBonus = null) {
    const feedback = document.getElementById("areaFeedback");
    if (!feedback) return;
    
    let tipoClass = "notification-info";
    if (tipo === "acerto") {
        tipoClass = "notification-correct";
    } else if (tipo === "erro") {
        tipoClass = "notification-wrong";
    }
    
    let xpHtml = "";
    if (xpBonus !== null) {
        xpHtml = `<div class="notification-xp">+${xpBonus} XP</div>`;
    }
    
    const reacao = tipo === "acerto" ? 2 : (tipo === "erro" ? 3 : 1);
    if (tipo === "acerto" || tipo === "erro") tocarSom(tipo);
    feedback.innerHTML = `
        <div class="notification ${tipoClass}">
            <img class="notification-mascot" src="${tipo === "acerto" ? caminhoCelebracao(player.personagem) : caminhoPersonagem(player.personagem, reacao)}" alt="">
            <div class="notification-content">
                <div class="notification-title">${tipo === "acerto" ? "ACERTOU!" : (tipo === "erro" ? "ERROU!" : "ATENÇÃO")}</div>
                <div class="notification-desc">${mensagem}</div>
            </div>
            ${xpHtml}
        </div>
    `;
}

// ============================================================
// CONQUISTAS
// ============================================================
function desbloquearConquista(id, nome) {
    if (player.achievements[id]) return;
    player.achievements[id] = true;
    salvarLocal();
    mostrarNotificacao(`CONQUISTA: ${nome}`, "info");
}

function verificarConquistas() {
    if (!player.achievements.firstHit && player.totalCorrect >= 1) desbloquearConquista('firstHit', "PRIMEIRO ACERTO");
    if (!player.achievements.fiveCombo && gameSession.sessionMaxCombo >= 5) desbloquearConquista('fiveCombo', "COMBO 5x");
    
    const regioes = { "Norte": 0, "Nordeste": 0, "Centro-Oeste": 0, "Sudeste": 0, "Sul": 0 };
    const totais = { "Norte": 7, "Nordeste": 9, "Centro-Oeste": 4, "Sudeste": 4, "Sul": 3 };
    
    estadosAPI.forEach((est, idx) => {
        if (player.unlockedStates[idx]) regioes[est.regiao]++;
    });
    
    if (!player.achievements.northComplete && regioes["Norte"] === totais["Norte"]) desbloquearConquista('northComplete', "REGIÃO NORTE");
    if (!player.achievements.northeastComplete && regioes["Nordeste"] === totais["Nordeste"]) desbloquearConquista('northeastComplete', "REGIÃO NORDESTE");
    if (!player.achievements.centerwestComplete && regioes["Centro-Oeste"] === totais["Centro-Oeste"]) desbloquearConquista('centerwestComplete', "CENTRO-OESTE");
    if (!player.achievements.southeastComplete && regioes["Sudeste"] === totais["Sudeste"]) desbloquearConquista('southeastComplete', "SUDESTE");
    if (!player.achievements.southComplete && regioes["Sul"] === totais["Sul"]) desbloquearConquista('southComplete', "SUL");
    if (!player.achievements.allFlags && player.unlockedStates.filter(u => u).length === 27) desbloquearConquista('allFlags', "COLEÇÃO COMPLETA");
}

// ============================================================
// UI
// ============================================================
function atualizarUI() {
    document.getElementById("nomeJogadorJogo").textContent = player.nome || "Jogador";
    atualizarAvatares();
}

function atualizarModoUI() {
    document.querySelectorAll(".neo-btn-modo").forEach(btn=>{const active=btn.dataset.modo===player.modoAtual;btn.classList.toggle("active",active);btn.setAttribute("aria-pressed",String(active));});
    gameSession.modoJogo=player.modoAtual;
    const biomas=player.modoAtual==="biomas";
    document.getElementById("containerFiltro").classList.toggle("hidden",biomas);
    document.getElementById("brBiomaNote").classList.toggle("hidden",!biomas);
    const region=biomas?"all":document.getElementById("filtroRegiao").value;
    const count=region==="all"?27:estadosAPI.filter(e=>e.regiao===region).length;
    document.getElementById("missionMeta").textContent=`${count} perguntas · 5 segundos por resposta`;
}

function obterPergunta(indice) {
    const estado = estadosAPI[indice];
    if (gameSession.modoJogo === "bandeiras") {
        return {
            texto: "Qual estado possui esta bandeira?",
            correta: estado.name,
            imagem: estado.flag_url,
            tipo: "bandeira",
            mostrarImagem: true,
            biomaImg: null
        };
    } else if (gameSession.modoJogo === "capitais") {
        return {
            texto: `Qual é a capital do estado ${estado.name}?`,
            correta: estado.capital,
            imagem: `assets/maps/${estado.uf.toLowerCase()}.svg`,
            tipo: "capital",
            mostrarImagem: true,
            biomaImg: null
        };
    } else {
        // MODO BIOMAS
        return {
            texto: `Qual é o bioma principal do estado ${estado.name}?`,
            correta: estado.bioma,
            imagem: estado.bioma_img,
            tipo: "bioma",
            mostrarImagem: true,
            biomaImg: estado.bioma_img,
            estadoNome: estado.name,
            regiao: estado.regiao
        };
    }
}

function obterAlternativas(correta, tipo) {
    if (tipo === "bioma") {
        let outras = biomasList.filter(b => b !== correta);
        for (let i = outras.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [outras[i], outras[j]] = [outras[j], outras[i]];
        }
        const distratores = outras.slice(0, 3);
        const alternativas = [correta, ...distratores];
        for (let i = alternativas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [alternativas[i], alternativas[j]] = [alternativas[j], alternativas[i]];
        }
        return alternativas.map(alt => ({
            nome: alt,
            icon: biomaIcons[alt] || "fa-leaf",
            className: `bioma-${alt.toLowerCase().replace(/ /g, '-')}`
        }));
    } else if (tipo === "bandeira") {
        let outras = estadosAPI.filter(e => e.name !== correta).map(e => e.name);
        for (let i = outras.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [outras[i], outras[j]] = [outras[j], outras[i]];
        }
        const distratores = outras.slice(0, 3);
        const alternativas = [correta, ...distratores];
        for (let i = alternativas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [alternativas[i], alternativas[j]] = [alternativas[j], alternativas[i]];
        }
        return alternativas.map(alt => ({ nome: alt }));
    } else {
        let outras = estadosAPI.filter(e => e.capital !== correta).map(e => e.capital);
        for (let i = outras.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [outras[i], outras[j]] = [outras[j], outras[i]];
        }
        const distratores = outras.slice(0, 3);
        const alternativas = [correta, ...distratores];
        for (let i = alternativas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [alternativas[i], alternativas[j]] = [alternativas[j], alternativas[i]];
        }
        return alternativas.map(alt => ({ nome: alt }));
    }
}

function animarPonto() {
    const pontuacaoSpan = document.getElementById("pontuacaoAtual");
    pontuacaoSpan.style.transform = "scale(1.2)";
    setTimeout(() => pontuacaoSpan.style.transform = "scale(1)", 150);
}

function atualizarVidas() {
    const valor = document.getElementById("vidasAtual");
    const container = document.getElementById("vidasJogo");
    if (valor) valor.innerText = gameSession.vidas;
    document.querySelectorAll("#vidasJogo .heart").forEach((heart,index)=>heart.classList.toggle("lost",index>=gameSession.vidas));
    if (container) {
        container.classList.toggle("danger", gameSession.vidas === 1);
        container.setAttribute("aria-label", `${gameSession.vidas} ${gameSession.vidas === 1 ? "vida" : "vidas"}`);
    }
}

function usarDica() {
    if (gameSession.answered || gameSession.dicaUsada) return;
    const incorretas = Array.from(document.querySelectorAll(".neo-alt"))
        .filter((card) => card.dataset.valor !== gameSession.currentCorrect);
    embaralhar(incorretas).slice(0, 2).forEach((card) => {
        card.classList.add("hint-hidden");
        card.setAttribute("aria-hidden", "true");
        card.disabled = true;
    });
    gameSession.dicaUsada = true;
    document.getElementById("btnDica").disabled = true;
    tocarSom("dica");
}

function renderizarPergunta() {
    const idx = gameSession.shuffledIndices[gameSession.currentIndex];
    const pergunta = obterPergunta(idx);
    document.getElementById("brNext").hidden=true;
    document.getElementById("questionProgressFill").style.width=`${(gameSession.currentIndex+1)/gameSession.shuffledIndices.length*100}%`;
    
    gameSession.currentCorrect = pergunta.correta;
    
    const modoLabel = document.getElementById("modoQuizLabel");
    if (modoLabel) {
        modoLabel.innerText = {
            bandeiras: "Bandeiras",
            capitais: "Capitais",
            biomas: "Biomas"
        }[gameSession.modoJogo] || "DESAFIO GEO BR";
    }
    
    document.getElementById("perguntaTexto").innerText = pergunta.texto;
    
    // Configurar imagem (bandeira ou bioma)
    const containerImg = document.getElementById("containerImagem");
    const bandeiraImg = document.getElementById("bandeiraImg");
    
    if (gameSession.modoJogo === "biomas") {
        bandeiraImg.style.display = "none";
        containerImg.className = "neo-bandeira bioma-mode";
        containerImg.style.borderColor = "var(--border)";
        containerImg.innerHTML = `
            <img id="bandeiraImg" class="neo-bandeira-img" src="" alt="Bandeira" style="display:none;">
            <img id="biomaDisplayImg" class="neo-bioma-img" src="${pergunta.imagem}" alt="Imagem do bioma">
        `;
    } else {
        containerImg.className = "neo-bandeira";
        bandeiraImg.style.display = "block";
        bandeiraImg.src = pergunta.imagem;
        containerImg.style.background = "var(--flag-bg)";
        containerImg.style.borderColor = "var(--border)";
        containerImg.innerHTML = `
            <img id="bandeiraImg" class="neo-bandeira-img" src="${pergunta.imagem}" alt="Bandeira">
        `;
    }
    
    const alternativas = obterAlternativas(pergunta.correta, pergunta.tipo);
    const container = document.getElementById("containerAlternativas");
    container.innerHTML = "";
    
    alternativas.forEach(alt => {
        const card = document.createElement("button");
        card.type = "button";
        if (pergunta.tipo === "bioma") {
            card.className = `neo-alt neo-alt-bioma ${alt.className || ''}`;
            card.innerHTML = `<span class="bioma-name">${alt.nome}</span>`;
            if (alt.nome && biomaColors[alt.nome]) {
                card.style.borderLeftColor = biomaColors[alt.nome];
                card.style.borderLeftWidth = "4px";
            }
        } else {
            card.className = "neo-alt";
            card.innerText = alt.nome;
        }
        card.dataset.valor = alt.nome;
        card.onclick = () => processarResposta(alt.nome);
        container.appendChild(card);
    });
    
    document.getElementById("areaFeedback").innerHTML = "";
    document.getElementById("perguntaTexto").focus({preventScroll:true});
    gameSession.dicaUsada = false;
    document.getElementById("btnDica").disabled = false;
    gameSession.answered = false;
    document.querySelectorAll(".neo-alt").forEach(card => { card.classList.remove("disabled"); card.disabled = false; });
    
    gameSession.tempoRestante = gameSession.tempoQuestao;
    const timerSpan = document.getElementById("timerSegundos");
    timerSpan.innerText = gameSession.tempoRestante;
    
    if (gameSession.timerInterval) clearInterval(gameSession.timerInterval);
    gameSession.timerInterval = setInterval(() => {
        if (!gameSession.answered && gameSession.tempoRestante > 0) {
            gameSession.tempoRestante--;
            timerSpan.innerText = gameSession.tempoRestante;
            if (gameSession.tempoRestante === 0) {
                clearInterval(gameSession.timerInterval);
                processarResposta(null);
            }
        } else if (gameSession.tempoRestante <= 0) {
            clearInterval(gameSession.timerInterval);
        }
    }, 1000);
}

function limparAutoProximo() {
    if (gameSession.autoNextTimeout) {
        clearTimeout(gameSession.autoNextTimeout);
        gameSession.autoNextTimeout = null;
    }
}

function iniciarTimerProximo() {
    limparAutoProximo();
    gameSession.autoNextTimeout = setTimeout(() => {
        proximaPergunta();
    }, gameSession.tempoQuestao * 1000);
}

function processarResposta(selecionada) {
    if (gameSession.answered || document.body.dataset.screen !== "telaJogo") return;
    if (gameSession.timerInterval) clearInterval(gameSession.timerInterval);
    gameSession.answered = true;
    limparAutoProximo();
    
    document.querySelectorAll(".neo-alt").forEach(card => {
        card.classList.add("disabled"); card.disabled = true;
        card.classList.toggle("correct", card.dataset.valor === gameSession.currentCorrect);
        card.classList.toggle("wrong", card.dataset.valor === selecionada && selecionada !== gameSession.currentCorrect);
    });
    
    const idx = gameSession.shuffledIndices[gameSession.currentIndex];
    const estado = estadosAPI[idx];
    const pergunta = obterPergunta(idx);
    const correta = (selecionada === pergunta.correta);
    
    // Animação no container da imagem
    const containerImg = document.getElementById("containerImagem");
    containerImg.classList.remove("correct", "wrong");
    void containerImg.offsetWidth;
    
    if (correta) {
        containerImg.classList.add("correct");
        gameSession.combo++;
        gameSession.sessionMaxCombo = Math.max(gameSession.sessionMaxCombo, gameSession.combo);
        player.maxCombo = Math.max(player.maxCombo, gameSession.sessionMaxCombo);
        
        const bonusCombo = Math.min(gameSession.combo * 2, 18);
        const xpGanho = 10 + bonusCombo;
        
        gameSession.score += 10;
        adicionarXP(xpGanho);
        player.totalCorrect++;
        
        let msgDesbloqueio = "";
        if (!player.unlockedStates[idx]) {
            player.unlockedStates[idx] = true;
            msgDesbloqueio = ` DESBLOQUEOU ${estado.name}!`;
            salvarLocal();
            verificarConquistas();
            atualizarUI();
        }
        
        let respostaCorreta = "";
        if (gameSession.modoJogo === "bandeiras") {
            respostaCorreta = estado.name;
        } else if (gameSession.modoJogo === "capitais") {
            respostaCorreta = `${estado.name} - ${estado.capital}`;
        } else {
            respostaCorreta = `${estado.bioma} (${estado.name})`;
        }
        mostrarNotificacao(`${respostaCorreta}!${msgDesbloqueio}`, "acerto", xpGanho);
        
        verificarConquistas();
        animarPonto();
    } else {
        containerImg.classList.add("wrong");
        gameSession.combo = 0;
        gameSession.vidas = Math.max(0, gameSession.vidas - 1);
        atualizarVidas();
        adicionarXP(2);
        
        let respostaCorreta = "";
        if (gameSession.modoJogo === "bandeiras") {
            respostaCorreta = estado.name;
        } else if (gameSession.modoJogo === "capitais") {
            respostaCorreta = `${estado.capital} (${estado.name})`;
        } else {
            respostaCorreta = `${estado.bioma} (${estado.name})`;
        }
        mostrarNotificacao(`A RESPOSTA É ${respostaCorreta}. ${estado.curiosidade.substring(0, 80)}...`, "erro", 2);
    }
    
    document.getElementById("comboAtual").innerText = gameSession.combo;
    document.getElementById("pontuacaoAtual").innerText = gameSession.score / 10;
    
    atualizarUI();
    salvarLocal();
    document.getElementById("brNext").hidden = gameSession.vidas <= 0;
    document.getElementById("brNext").textContent = gameSession.currentIndex+1 === gameSession.shuffledIndices.length ? "Resultado →" : "Próxima →";
    if (gameSession.vidas <= 0) {
        gameSession.endTimeout = setTimeout(() => { if (document.body.dataset.screen === "telaJogo") mostrarResultadoFinal(true); }, 1400);
    } else {
        iniciarTimerProximo();
    }
}

function proximaPergunta() {
    if (!gameSession.answered) return;
    if (!document.getElementById("telaJogo").classList.contains("active")) return;
    limparAutoProximo();
    if (gameSession.currentIndex + 1 < gameSession.shuffledIndices.length) {
        gameSession.currentIndex++;
        renderizarPergunta();
        document.getElementById("progressoAtual").innerText = gameSession.currentIndex + 1;
    } else {
        mostrarResultadoFinal();
    }
}

function mostrarResultadoFinal(encerrada = false) {
    if (gameSession.timerInterval) clearInterval(gameSession.timerInterval);
    clearTimeout(gameSession.endTimeout);
    limparAutoProximo();
    
    const totalAcertos = gameSession.score / 10;
    const totalPerguntas = gameSession.shuffledIndices.length;
    const respondidas = Math.min(gameSession.currentIndex + 1, totalPerguntas);
    const precisao = respondidas ? Math.round((totalAcertos / respondidas) * 100) : 0;
    document.getElementById("atlasSessionXP").textContent = player.xp - gameSession.xpStart;
    
    gameSession.secondsElapsed = Math.floor((Date.now() - gameSession.startedAt) / 1000);
    const minutos = Math.floor(gameSession.secondsElapsed / 60);
    const segundos = gameSession.secondsElapsed % 60;
    
    document.getElementById("finalAcertos").innerText = totalAcertos;
    document.getElementById("finalTotal").innerText = totalPerguntas;
    document.getElementById("finalPrecisao").innerText = precisao;
    document.getElementById("finalTempo").innerText = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    document.getElementById("finalPatente").innerText = patentes[player.levelIndex];
    document.getElementById("finalMaxCombo").innerText = gameSession.sessionMaxCombo;
    document.getElementById("tituloResultado").innerText = encerrada ? "Vamos tentar de novo?" : "Desafio concluído!";
    document.getElementById("mascoteResultado").src = (encerrada ? caminhoPersonagem(player.personagem, 4) : caminhoCelebracao(player.personagem));
    document.getElementById("mascoteResultado").alt = encerrada ? "Personagem triste" : "Personagem comemorando";
    tocarSom(encerrada ? "fim" : "vitoria");
    
    atualizarUI();
    
    document.getElementById("telaJogo").classList.remove("active");
    document.getElementById("telaResultado").classList.add("active");
    setView("result");
    document.getElementById("tituloResultado").focus({preventScroll:true});
}

function resetarSessao() {
    if (gameSession.timerInterval) clearInterval(gameSession.timerInterval);
    clearTimeout(gameSession.endTimeout);
    limparAutoProximo();
    
    let indicesFiltrados;
    if (gameSession.modoJogo === "biomas") {
        indicesFiltrados = [...Array(27).keys()];
    } else {
        indicesFiltrados = obterIndicesFiltrados();
    }
    
    gameSession.shuffledIndices = embaralhar([...indicesFiltrados]);
    gameSession.currentIndex = 0;
    gameSession.score = 0;
    gameSession.combo = 0;
    gameSession.sessionMaxCombo = 0;
    gameSession.answered = false;
    gameSession.secondsElapsed = 0;
    gameSession.startedAt = Date.now();
    gameSession.xpStart = player.xp;
    gameSession.vidas = 3;
    gameSession.dicaUsada = false;
    
    document.getElementById("timerSegundos").innerText = gameSession.tempoQuestao;
    document.getElementById("progressoAtual").innerText = "1";
    document.getElementById("totalPerguntas").innerText = indicesFiltrados.length;
    document.getElementById("pontuacaoAtual").innerText = "0";
    document.getElementById("comboAtual").innerText = "0";
    document.getElementById("areaFeedback").innerHTML = "";
    atualizarVidas();
    
    renderizarPergunta();
}

function obterIndicesFiltrados() {
    if (gameSession.regionFilter === "all") return [...Array(27).keys()];
    return estadosAPI.reduce((acc, est, idx) => {
        if (est.regiao === gameSession.regionFilter) acc.push(idx);
        return acc;
    }, []);
}

function embaralhar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function iniciarJogo() {
    if (!player.nome) {
        abrirModalAluno();
        return;
    }
    
    if (player.modoAtual !== "biomas") {
        gameSession.regionFilter = document.getElementById("filtroRegiao").value;
    } else {
        gameSession.regionFilter = "all";
    }
    
    gameSession.modoJogo = player.modoAtual;
    resetarSessao();

    document.getElementById("geoBrOpening").classList.add("hidden");
    document.getElementById("appRoot").classList.remove("hidden");
    document.getElementById("telaJogo").classList.add("active");
    setView("quiz");
    document.getElementById("telaResultado").classList.remove("active");
}

function voltarMenu() {
    if (gameSession.timerInterval) clearInterval(gameSession.timerInterval);
    clearTimeout(gameSession.endTimeout);
    limparAutoProximo();
    document.getElementById("telaJogo").classList.remove("active");
    document.getElementById("telaResultado").classList.remove("active");
    document.getElementById("appRoot").classList.add("hidden");
    document.getElementById("geoBrOpening").classList.remove("hidden");
    player.nome = "";
    setView("home");
    atualizarUI();
    atualizarRankingUI();
}

// ============================================================
// ÁLBUM E MODAIS
// ============================================================










function abrirModalAluno() {
    const modal = document.getElementById("modalAluno");
    const campoNome = document.getElementById("alunoNome");
    campoNome.value = "";
    document.getElementById("characterError").textContent = "";
    renderizarPersonagens(player.personagem);
    modal.classList.add("active");
    setView("setup");
    requestAnimationFrame(() => campoNome.focus());
}

function fecharModalAluno(cancelarPendente = true) {
    document.getElementById("modalAluno").classList.remove("active");
    if (cancelarPendente) { modoPendenteAbertura = null;setView("home"); }
}

function salvarAluno() {
    const nome = document.getElementById("alunoNome").value.trim();
    const serie = "GEO BR";
    
    if (nome === "") {
        document.getElementById("characterError").textContent = "Digite seu nome para continuar.";
        document.getElementById("alunoNome").focus();
        return;
    }
    if (!player.personagem) {
        document.getElementById("characterError").textContent = "Escolha uma capivara.";
        return;
    }
    
    const cadastroExistente = buscarPerfilJogador(nome)
        || ranking.find(item => normalizarNomeJogador(item.nome) === normalizarNomeJogador(nome));
    if (cadastroExistente) {
        player.nome = cadastroExistente.nome;
        player.xp = Number(cadastroExistente.xp) || 0;
        // Preserve the character selected in this setup.
    } else {
        player.nome = nome.replace(/\s+/g, " ");
        player.xp = 0;
    }
    player.serie = serie;
    atualizarPatente();
    salvarLocal();
    salvarRanking();
    adicionarOuAtualizarRanking(player.nome, player.serie, player.xp, patentes[player.levelIndex], player.personagem);
    fecharModalAluno(false);
    atualizarUI();
    if (modoPendenteAbertura) {
        modoPendenteAbertura = null;
        iniciarJogo();
    }
}

// ============================================================

document.getElementById("atlasStart").addEventListener("click",()=>{const mode=player.modoAtual;prepararNovoJogador();player.modoAtual=mode;modoPendenteAbertura=mode;atualizarModoUI();abrirModalAluno();});
document.getElementById("btnSalvarAluno").addEventListener("click",salvarAluno);
document.getElementById("alunoNome").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();salvarAluno();}});
document.getElementById("alunoNome").addEventListener("input",()=>document.getElementById("characterError").textContent="");
document.getElementById("btnCancelarAluno").addEventListener("click",()=>fecharModalAluno());
document.getElementById("btnVoltarMenu").addEventListener("click",voltarMenu);
document.getElementById("btnMenuResultado").addEventListener("click",voltarMenu);
document.getElementById("brandHome").addEventListener("click",event=>{event.preventDefault();fecharModalAluno();voltarMenu();});
document.getElementById("btnJogarNovamente").addEventListener("click",iniciarJogo);
document.getElementById("brNext").addEventListener("click",proximaPergunta);
document.getElementById("btnDica").addEventListener("click",usarDica);
document.getElementById("btnResetarRanking").addEventListener("click",limparRankingComoGeoMundo);
document.querySelectorAll(".neo-btn-modo").forEach(button=>button.addEventListener("click",()=>{player.modoAtual=button.dataset.modo;salvarLocal();atualizarModoUI();}));
document.getElementById("filtroRegiao").addEventListener("change",atualizarModoUI);
carregarRanking();carregarLocal();atualizarUI();atualizarRankingUI();
