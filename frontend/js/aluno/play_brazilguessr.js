// BrazilGuessr integrado ao GeoEduca: visual novo + regras do sistema
// (login, limite diário, pontuação salva no backend e retorno ao hub).
const HUB_URL = 'hub_brazilguessr.html';
const ASSETS = 'brazilguessr/assets/';
const jogoId = localStorage.getItem('bg_jogo_id') || 'brazilguessr';

document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
const usuario = initPage('aluno');

// Catálogo revisado (locais.js); região definida pela UF.
const regioesDoJogo = ["norte", "nordeste", "centro-oeste", "sudeste", "sul"];
const bancoLocais = {};
for (const regiao of regioesDoJogo) {
    bancoLocais[regiao] = locaisRevisados.filter(local => dadosEstados[local.uf].regiao === regiao);
}

let regiaoSorteada = "";
let localAtual = null;
let palpiteJogador = null;
let marcadorPalpite = null;
let marcadorReal = null;
let linhaConexao = null;
let jogoFinalizado = false;
let trocaEmAndamento = false;
let tempoEsgotadoSemPalpite = false;
let pontosTotais = 0;
let pontosDaRodada = 0;

// ------------------------------------------------------------------
// Tentativas diárias (backend)
// ------------------------------------------------------------------
let partidasRestantes = 0;
let estatisticasCarregadas = false;

function atualizarTentativas() {
    const texto = estatisticasCarregadas ? String(partidasRestantes) : '…';
    document.querySelectorAll('[data-tentativas]').forEach(el => {
        el.querySelector('b').innerText = texto;
        el.classList.toggle('esgotado', estatisticasCarregadas && partidasRestantes <= 0);
    });
    document.querySelectorAll('[data-tentativas-num]').forEach(el => { el.innerText = texto; });

    const btnIniciar = document.getElementById('btn-iniciar');
    btnIniciar.disabled = !estatisticasCarregadas || partidasRestantes <= 0;

    const btnNova = document.getElementById('btn-nova-exploracao');
    btnNova.firstChild.textContent = partidasRestantes > 0 ? 'Explorar de novo ' : 'Voltar ao hub ';

    const btnTrocar = document.getElementById('btn-trocar-local');
    if (!jogoFinalizado) btnTrocar.disabled = partidasRestantes < 2;
    btnTrocar.title = partidasRestantes < 2
        ? 'Sem tentativas suficientes para trocar: a troca gasta 1 tentativa e a nova rodada precisa de outra.'
        : 'Trocar local gasta 1 tentativa';
}

function definirRestantes(stats) {
    const limite = stats.limiteDiario || 10;
    partidasRestantes = Math.max(0, limite - (stats.partidasHoje || 0));
    estatisticasCarregadas = true;
    atualizarTentativas();
}

async function registrarRodada(pontos) {
    try {
        await api.post(`/jogos/${jogoId}/pontuacao`, { pontuacao: pontos });
        partidasRestantes = Math.max(0, partidasRestantes - 1);
        atualizarTentativas();
        return true;
    } catch (err) {
        console.error('Erro ao salvar pontos', err);
        if (String(err?.message || err).includes('Limite')) partidasRestantes = 0;
        avisar('error', 'Erro', 'Não foi possível salvar a rodada.');
        atualizarTentativas();
        return false;
    }
}

function avisar(tipo, titulo, msg) { if (typeof Toast !== 'undefined') Toast[tipo](titulo, msg); }

function irParaHub() { window.location.href = HUB_URL; }

if (usuario) {
    api.get(`/jogos/${jogoId}/estatisticas`).then(stats => {
        pontosTotais = stats.total || 0;
        atualizarPlacarTotal();
        definirRestantes(stats);
    }).catch(err => {
        console.error('Erro ao buscar estatísticas', err);
        avisar('error', 'Erro', 'Não foi possível carregar suas tentativas.');
    });
}

// Locais já sorteados persistem entre sessões (por id).
const CHAVE_SORTEADOS = 'bg_locais_sorteados_v2';
const locaisJaSorteadosPorRegiao = Object.fromEntries(regioesDoJogo.map(r => [r, new Set()]));
try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE_SORTEADOS));
    if (salvos) for (const r of regioesDoJogo) if (salvos[r]) locaisJaSorteadosPorRegiao[r] = new Set(salvos[r]);
} catch (e) { /* armazenamento corrompido: recomeça */ }

function salvarSorteados() {
    const dados = {};
    for (const r of regioesDoJogo) dados[r] = Array.from(locaisJaSorteadosPorRegiao[r]);
    localStorage.setItem(CHAVE_SORTEADOS, JSON.stringify(dados));
}

const iconePalpite = L.divIcon({ className: 'guess-pin-wrapper', html: '<span class="map-pin"></span>', iconSize: [25, 25], iconAnchor: [12, 25] });
const iconeReal = L.divIcon({ className: 'real-pin-wrapper', html: '<span class="map-pin real-pin"></span>', iconSize: [25, 25], iconAnchor: [12, 25] });

const limitesBrasil = L.latLngBounds(L.latLng(-34.5, -74.5), L.latLng(5.5, -32.0));

let tempoRestante = 120;
let intervaloCronometro = null;
let avisoPaisagemTimeout = null;
let ultimoLocalId = null;

function encerrarCarregamentoPaisagem() {
    clearTimeout(avisoPaisagemTimeout);
    avisoPaisagemTimeout = null;
    document.getElementById('paisagem-carregando').classList.add('hidden');
}

function carregarPaisagem() {
    encerrarCarregamentoPaisagem();
    document.getElementById('paisagem-carregando').classList.remove('hidden');
    const iframe = document.getElementById('sv-iframe');
    iframe.src = `https://www.google.com/maps?cbll=${localAtual.lat},${localAtual.lng}&layer=c&cbp=12,${localAtual.heading},0,0,0&output=svembed`;
    avisoPaisagemTimeout = setTimeout(() => {
        document.getElementById('paisagem-carregando-texto').innerText = 'Demorou para abrir? Use Trocar local abaixo (gasta 1 tentativa).';
    }, 12000);
}

document.getElementById('sv-iframe').addEventListener('load', encerrarCarregamentoPaisagem);
document.getElementById('sv-iframe').addEventListener('error', encerrarCarregamentoPaisagem);

// ------------------------------------------------------------------
// Trocar local: consome 1 tentativa (rodada registrada com 0 pontos)
// ------------------------------------------------------------------
const dialogoTroca = document.getElementById('confirmar-troca');

function pedirTrocaLocal() {
    if (jogoFinalizado || document.body.dataset.tela !== 'partida') return;
    if (partidasRestantes < 2) {
        avisar('warning', 'Sem tentativas para trocar', 'A troca gasta 1 tentativa e a nova rodada precisa de outra.');
        return;
    }
    document.getElementById('troca-restantes').innerText = String(partidasRestantes - 1);
    dialogoTroca.showModal();
}

async function confirmarTrocaLocal() {
    dialogoTroca.close();
    if (jogoFinalizado || trocaEmAndamento || partidasRestantes < 2) return;
    const btn = document.getElementById('btn-trocar-local');
    const btnEnviar = document.getElementById('btn-enviar');
    const btnCentro = document.getElementById('btn-marcar-centro');
    trocaEmAndamento = true;
    btn.disabled = true;
    btnEnviar.disabled = true;
    btnCentro.disabled = true;
    clearInterval(intervaloCronometro);

    const tentativaRegistrada = await registrarRodada(0);
    if (!tentativaRegistrada) {
        trocaEmAndamento = false;
        if (!jogoFinalizado) {
            btn.disabled = partidasRestantes < 2;
            btnCentro.disabled = false;
            interfaceJogo.palpite(Boolean(palpiteJogador));
            if (tempoRestante > 0) {
                intervaloCronometro = setInterval(contarTempo, 1000);
            } else {
                tempoEsgotadoSemPalpite = !palpiteJogador;
                verificarPalpite();
            }
        }
        return;
    }

    trocaEmAndamento = false;
    iniciarNovaRodada();
    interfaceJogo.painel('paisagem');
    interfaceJogo.anunciar(`Local trocado. 1 tentativa usada; restam ${partidasRestantes}. Você tem dois minutos para o novo cenário.`);
    avisar('info', 'Local trocado', `1 tentativa usada. Restam ${partidasRestantes} hoje.`);
}

document.getElementById('btn-confirmar-troca').addEventListener('click', confirmarTrocaLocal);
for (const id of ['btn-cancelar-troca', 'btn-fechar-troca']) {
    document.getElementById(id).addEventListener('click', () => dialogoTroca.close());
}

function atualizarPlacarTotal() {
    document.getElementById('placar-total').innerText = pontosTotais.toLocaleString('pt-BR');
}

function restaurarInterfaceCompleta() {
    document.getElementById('main-game').classList.remove('modo-resultado');
    document.getElementById('header-jogo').classList.add('hidden');
    for (const id of ['barra-tempo-wrapper', 'painel-streetview', 'painel-status', 'barra-acao']) {
        document.getElementById(id).classList.remove('hidden');
    }
    document.body.classList.remove('tempo-urgente');
    document.getElementById('btn-marcar-centro').disabled = false;
    setTimeout(() => map.invalidateSize({ animate: false }), 50);
}

function ativarModoMapaResultado() {
    document.getElementById('main-game').classList.add('modo-resultado');
    document.getElementById('header-jogo').classList.remove('hidden');
    for (const id of ['barra-tempo-wrapper', 'painel-streetview', 'painel-status', 'barra-acao']) {
        document.getElementById(id).classList.add('hidden');
    }
    interfaceJogo.painel('mapa');
    interfaceJogo.tela('mapa');
    setTimeout(() => {
        map.invalidateSize({ animate: false });
        if (marcadorPalpite && marcadorReal) map.fitBounds(L.featureGroup([marcadorPalpite, marcadorReal]).getBounds().pad(0.3));
        else if (localAtual) map.setView([localAtual.lat, localAtual.lng], 6);
    }, 60);
}

function voltarAoInicio() {
    clearInterval(intervaloCronometro);
    encerrarCarregamentoPaisagem();
    restaurarInterfaceCompleta();
    interfaceJogo.tela('inicio');
    document.getElementById('sv-iframe').src = 'about:blank';
    if (estatisticasCarregadas && partidasRestantes <= 0) irParaHub();
}

// ------------------------------------------------------------------
// Mapa (Leaflet)
// ------------------------------------------------------------------
const map = L.map('map', {
    zoomControl: false,
    maxBounds: limitesBrasil,
    maxBoundsViscosity: 1.0,
    minZoom: 3,
    maxZoom: 20,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    worldCopyJump: false
}).setView([-14.2350, -51.9253], 4);
L.control.zoom({ position: 'topright' }).addTo(map);
L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 100 }).addTo(map);
window.brazilGuessrMap = map;

let camadaMapa = null;
let geracaoMapa = 0;
let mapaCarregamentoTimeout = null;
const creditosMapa = '<a href="https://openfreemap.org/">OpenFreeMap</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> · Dados <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const mapaEstados = L.geoJSON(malhaEstados, {
    style: { color: '#a69d83', weight: 1, fillColor: '#e4dec9', fillOpacity: 1 },
    attribution: '<a href="https://www.naturalearthdata.com/">Natural Earth</a>'
});
const rotulosEstados = L.layerGroup();
for (const estado of malhaEstados.features) {
    const p = estado.properties;
    L.marker([p.latitude, p.longitude], {
        icon: L.divIcon({ className: 'state-label', html: p.postal, iconSize: [22, 14], iconAnchor: [11, 7] }),
        interactive: false, keyboard: false
    }).addTo(rotulosEstados);
}

async function trocarMapa(tipo) {
    const simplificado = tipo === 'estados';
    const geracao = ++geracaoMapa;
    clearTimeout(mapaCarregamentoTimeout);
    document.getElementById('btn-mapa-estados').setAttribute('aria-pressed', String(simplificado));
    document.getElementById('btn-mapa-ruas').setAttribute('aria-pressed', String(!simplificado));
    document.getElementById('mapa-indisponivel').classList.add('hidden');
    document.getElementById('mapa-carregando').classList.toggle('hidden', simplificado);
    if (camadaMapa) {
        map.removeLayer(camadaMapa);
        camadaMapa = null;
    }
    if (simplificado) {
        mapaEstados.addTo(map);
        rotulosEstados.addTo(map);
        return;
    }
    map.removeLayer(mapaEstados);
    map.removeLayer(rotulosEstados);
    const falha = () => {
        if (geracao !== geracaoMapa) return;
        clearTimeout(mapaCarregamentoTimeout);
        document.getElementById('mapa-carregando').classList.add('hidden');
        document.getElementById('mapa-indisponivel').classList.remove('hidden');
    };
    try {
        mapaCarregamentoTimeout = setTimeout(falha, 15000);
        const novaCamada = await criarCamadaRuas(creditosMapa);
        if (geracao !== geracaoMapa) return;
        clearTimeout(mapaCarregamentoTimeout);
        camadaMapa = novaCamada;
        let errosDaCamada = 0;
        camadaMapa.on('loading', () => {
            if (geracao !== geracaoMapa) return;
            errosDaCamada = 0;
            clearTimeout(mapaCarregamentoTimeout);
            mapaCarregamentoTimeout = setTimeout(falha, 15000);
        });
        camadaMapa.on('load', () => {
            if (geracao !== geracaoMapa || errosDaCamada) return;
            clearTimeout(mapaCarregamentoTimeout);
            document.getElementById('mapa-carregando').classList.add('hidden');
            document.getElementById('mapa-indisponivel').classList.add('hidden');
        });
        camadaMapa.on('tileerror', evento => {
            if (geracao !== geracaoMapa) return;
            errosDaCamada++;
            console.warn('Falha ao carregar cartografia:', evento.error);
            falha();
        });
        camadaMapa.addTo(map);
    } catch (erro) {
        console.warn('Não foi possível abrir o mapa detalhado.', erro);
        falha();
    }
}
trocarMapa('ruas');
document.getElementById('btn-mapa-estados').addEventListener('click', () => trocarMapa('estados'));
document.getElementById('btn-mapa-ruas').addEventListener('click', () => trocarMapa('ruas'));
document.getElementById('btn-recarregar-mapa').addEventListener('click', () => trocarMapa('ruas'));
document.getElementById('btn-usar-estados').addEventListener('click', () => trocarMapa('estados'));

document.getElementById('btn-ampliar-palpite').addEventListener('click', () => {
    if (!palpiteJogador || jogoFinalizado) return;
    map.setView(palpiteJogador, Math.max(18, map.getZoom()));
    interfaceJogo.anunciar('Mapa aproximado no seu palpite.');
});

let avisoMapaTimeout = null;
function mostrarAvisoMapa(mensagem) {
    const avisoMapa = document.getElementById('aviso-mapa');
    avisoMapa.innerText = mensagem;
    avisoMapa.classList.remove('hidden');
    clearTimeout(avisoMapaTimeout);
    avisoMapaTimeout = setTimeout(() => avisoMapa.classList.add('hidden'), 2200);
}

function registrarPalpite(evento) {
    if (jogoFinalizado) return;
    if (!limitesBrasil.contains(evento.latlng)) {
        mostrarAvisoMapa('Essa região não é brasileira.');
        return;
    }
    palpiteJogador = evento.latlng;
    tempoEsgotadoSemPalpite = false;
    if (marcadorPalpite) map.removeLayer(marcadorPalpite);
    marcadorPalpite = L.marker(palpiteJogador, { icon: iconePalpite }).addTo(map);
    interfaceJogo.palpite(true);
}
map.on('click', registrarPalpite);

// ------------------------------------------------------------------
// Fluxo de telas
// ------------------------------------------------------------------
function nomeRegiao(regiao) {
    return regiao === 'centro-oeste' ? 'Centro-Oeste' : regiao.charAt(0).toUpperCase() + regiao.slice(1);
}

function mostrarRegiaoDoDia() {
    if (!estatisticasCarregadas) return;
    if (partidasRestantes <= 0) {
        avisar('warning', 'Limite diário atingido', 'Você já usou suas 10 tentativas de hoje. Volte amanhã!');
        setTimeout(irParaHub, 1200);
        return;
    }
    clearInterval(intervaloCronometro);
    restaurarInterfaceCompleta();
    regiaoSorteada = regioesDoJogo[Math.floor(Math.random() * regioesDoJogo.length)];
    const nome = nomeRegiao(regiaoSorteada);
    document.getElementById('nome-regiao').innerText = nome;
    document.getElementById('badge-regiao').innerText = nome.toUpperCase();
    interfaceJogo.tela('regiao');
}

function comecarPartida() {
    restaurarInterfaceCompleta();
    interfaceJogo.tela('partida');
    interfaceJogo.painel('paisagem');
    iniciarNovaRodada();
    setTimeout(() => map.invalidateSize({ animate: false }), 100);
}

function iniciarNovaRodada() {
    interfaceJogo.palpite(false);
    for (const camada of [marcadorPalpite, marcadorReal, linhaConexao]) if (camada) map.removeLayer(camada);
    marcadorPalpite = null;
    marcadorReal = null;
    linhaConexao = null;
    palpiteJogador = null;
    jogoFinalizado = false;
    trocaEmAndamento = false;
    tempoEsgotadoSemPalpite = false;

    // Sorteio sem repetição até esgotar a região.
    const lista = bancoLocais[regiaoSorteada];
    const sorteados = locaisJaSorteadosPorRegiao[regiaoSorteada];
    let disponiveis = lista.filter(local => !sorteados.has(local.id));
    if (disponiveis.length === 0) {
        sorteados.clear();
        disponiveis = lista.slice();
    }
    if (disponiveis.length > 1) disponiveis = disponiveis.filter(local => local.id !== ultimoLocalId);
    localAtual = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    ultimoLocalId = localAtual.id;
    sorteados.add(localAtual.id);
    salvarSorteados();

    document.getElementById('paisagem-carregando-texto').innerText = 'Abrindo a paisagem em 360°…';
    carregarPaisagem();
    atualizarTentativas();

    interfaceJogo.enquadrarMapa = true;
    setTimeout(() => {
        if (document.getElementById('map').offsetWidth > 0) {
            map.fitBounds(limitesBrasil, { padding: [18, 18], animate: false });
            interfaceJogo.enquadrarMapa = false;
        }
    }, 60);
    setTimeout(() => map.invalidateSize({ animate: false }), 50);

    clearInterval(intervaloCronometro);
    tempoRestante = 120;
    atualizarInterfaceTempo();
    intervaloCronometro = setInterval(contarTempo, 1000);
}

function contarTempo() {
    if (jogoFinalizado) return;
    tempoRestante = Math.max(0, tempoRestante - 1);
    atualizarInterfaceTempo();
    if (tempoRestante === 0) {
        clearInterval(intervaloCronometro);
        tempoEsgotadoSemPalpite = !palpiteJogador;
        interfaceJogo.anunciar('O tempo acabou. Confira o local correto.');
        verificarPalpite();
    }
}

function atualizarInterfaceTempo() {
    const minutos = Math.floor(tempoRestante / 60).toString().padStart(2, '0');
    const segundos = (tempoRestante % 60).toString().padStart(2, '0');
    document.getElementById('cronometro').innerText = `${minutos}:${segundos}`;
    document.getElementById('barra-tempo').style.width = `${(tempoRestante / 120) * 100}%`;
    document.querySelector('.clock-metric').classList.toggle('urgent', tempoRestante <= 30);
    document.body.classList.toggle('tempo-urgente', tempoRestante <= 30);
    if (tempoRestante === 30) interfaceJogo.anunciar('Restam 30 segundos.');
}

function calcularPontuacao(distanciaKm) {
    if (distanciaKm <= 0.05) return 5000;
    if (distanciaKm > 3000) return 0;
    return Math.round(5000 * Math.exp(-distanciaKm / 300));
}

function atualizarModalResultado(distanciaTexto) {
    const estado = dadosEstados[localAtual.uf];
    const bomResultado = pontosDaRodada >= 4000;
    document.getElementById('resultado-local').innerText = localAtual.nome;
    document.getElementById('mapa-resultado-local').innerText = localAtual.nome;
    document.getElementById('resultado-rodada').innerText = pontosDaRodada.toLocaleString('pt-BR');
    document.getElementById('resultado-total').innerText = pontosTotais.toLocaleString('pt-BR');
    document.getElementById('resultado-distancia').innerText = distanciaTexto;
    document.getElementById('resultado-diferenca').innerText = distanciaTexto;
    document.getElementById('resultado-geografia').innerText = `${estado.nome} · Região ${nomeRegiao(estado.regiao)}`;

    const descoberta = curiosidadesLocais[localAtual.id];
    document.getElementById('resultado-curiosidade').innerText = descoberta?.texto
        || (localAtual.cidade === estado.capital ? descobertasRegioes[estado.regiao] : `${estado.nome} tem como capital ${estado.capital}.`);
    const fonte = document.getElementById('resultado-fonte');
    fonte.href = descoberta?.fonte || 'https://educa.ibge.gov.br/criancas/brasil/2850-nosso-territorio/19637-divisao-territorial.html';
    fonte.innerText = descoberta?.instituicao || 'IBGE Educa';

    document.getElementById('resultado-eyebrow').innerText = bomResultado
        ? 'COPERO: EXCELENTE LEITURA DAS PISTAS!'
        : pontosDaRodada > 0 ? 'COPERO: CADA PISTA AJUDA A IR MAIS LONGE.' : 'COPERO: VAMOS DESCOBRIR JUNTOS!';
    document.getElementById('titulo-resultado').innerHTML = bomResultado ? 'Olhar de<br>explorador!' : 'O Brasil<br>surpreende.';

    const copero = document.getElementById('copero-resultado');
    const pose = bomResultado ? 'comemorando' : pontosDaRodada >= 1500 ? 'bussola' : 'apresentando';
    copero.src = `${ASSETS}copero-explorador-${pose}.webp`;
    copero.alt = {
        comemorando: 'Copero explorador comemora sua descoberta com os braços levantados',
        bussola: 'Copero explorador observa as pistas com sua bússola',
        apresentando: 'Copero explorador convida você para uma nova exploração'
    }[pose];
    interfaceJogo.tela('resultado');
    copero.classList.remove('copero-reage');
    void copero.offsetWidth;
    copero.classList.add('copero-reage');
}

async function verificarPalpite() {
    if (jogoFinalizado || trocaEmAndamento) return;
    const semPalpite = !palpiteJogador;
    if (semPalpite) tempoEsgotadoSemPalpite = true;

    jogoFinalizado = true;
    clearInterval(intervaloCronometro);
    encerrarCarregamentoPaisagem();
    document.getElementById('btn-trocar-local').disabled = true;
    document.getElementById('btn-enviar').disabled = true;
    document.getElementById('btn-marcar-centro').disabled = true;

    const coordenadaReal = L.latLng(localAtual.lat, localAtual.lng);
    const distanciaKm = semPalpite ? null : map.distance(palpiteJogador, coordenadaReal) / 1000;

    pontosDaRodada = tempoEsgotadoSemPalpite ? 0 : calcularPontuacao(distanciaKm);

    marcadorReal = L.marker(coordenadaReal, { icon: iconeReal }).addTo(map)
        .bindPopup(`<b>${localAtual.nome}</b><br>Você ${semPalpite ? 'não marcou palpite' : `errou por ${distanciaKm.toFixed(1)} km.`}`)
        .openPopup();

    if (!semPalpite) {
        linhaConexao = L.polyline([palpiteJogador, coordenadaReal], { color: '#b38d28', weight: 3, dashArray: '6, 8' }).addTo(map);
        map.fitBounds(L.featureGroup([marcadorPalpite, marcadorReal]).getBounds().pad(0.3));
    } else {
        map.setView(coordenadaReal, 6);
    }

    if (await registrarRodada(pontosDaRodada)) {
        pontosTotais += pontosDaRodada;
    }
    atualizarPlacarTotal();

    atualizarModalResultado(semPalpite
        ? 'Sem palpite'
        : `${distanciaKm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`);
}

function novaExploracao() {
    if (partidasRestantes <= 0) irParaHub();
    else mostrarRegiaoDoDia();
}

document.getElementById('btn-fechar-resultado').addEventListener('click', ativarModoMapaResultado);
document.getElementById('btn-voltar-inicio-header').addEventListener('click', voltarAoInicio);
document.getElementById('btn-iniciar').addEventListener('click', mostrarRegiaoDoDia);
document.getElementById('btn-comecar').addEventListener('click', comecarPartida);
document.getElementById('btn-voltar-regiao').addEventListener('click', voltarAoInicio);
document.getElementById('btn-sair-partida').addEventListener('click', irParaHub);
document.getElementById('btn-inicio-resultado').addEventListener('click', voltarAoInicio);
document.getElementById('btn-enviar').addEventListener('click', verificarPalpite);
document.getElementById('btn-trocar-local').addEventListener('click', pedirTrocaLocal);
document.getElementById('btn-nova-exploracao').addEventListener('click', novaExploracao);
document.getElementById('btn-reabrir-resultado').addEventListener('click', () => interfaceJogo.tela('resultado'));
document.getElementById('btn-centralizar').addEventListener('click', () => map.fitBounds(limitesBrasil, { padding: [18, 18] }));
document.getElementById('btn-marcar-centro').addEventListener('click', () => registrarPalpite({ latlng: map.getCenter() }));

atualizarPlacarTotal();
atualizarTentativas();
