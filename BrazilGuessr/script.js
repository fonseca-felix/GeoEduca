// Catálogo e conteúdo educativo em locais.js; região definida pela UF.
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
let tempoEsgotadoSemPalpite = false;
let pontosTotais = 0;
let pontosDaRodada = 0;

const locaisJaSorteadosPorRegiao = {
    norte: new Set(),
    nordeste: new Set(),
    "centro-oeste": new Set(),
    sudeste: new Set(),
    sul: new Set()
};

const iconePalpite = L.divIcon({ className: 'guess-pin-wrapper', html: '<span class="map-pin"></span>', iconSize: [25, 25], iconAnchor: [12, 25] });
const iconeReal = L.divIcon({ className: 'real-pin-wrapper', html: '<span class="map-pin real-pin"></span>', iconSize: [25, 25], iconAnchor: [12, 25] });

const limitesBrasil = L.latLngBounds(
    L.latLng(-34.5, -74.5),
    L.latLng(5.5, -32.0)
);

// Controle de Tempo (2 minutos)
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
    // O iframe é de outra origem. load não comprova que há panorama.
    // A troca manual continua disponível, mesmo depois de load.
    avisoPaisagemTimeout = setTimeout(() => {
        document.getElementById('paisagem-carregando-texto').innerText = 'Demorou para abrir? Use Trocar local abaixo.';
    }, 12000);
}

document.getElementById('sv-iframe').addEventListener('load', encerrarCarregamentoPaisagem);
document.getElementById('sv-iframe').addEventListener('error', encerrarCarregamentoPaisagem);

function trocarLocalIndisponivel() {
    if (jogoFinalizado || document.body.dataset.tela !== 'partida') return;
    iniciarNovaRodada();
    interfaceJogo.painel('paisagem');
    interfaceJogo.anunciar('Local trocado na mesma região, sem desconto de pontos. Você tem dois minutos para o novo cenário.');
    document.getElementById('btn-trocar-local').focus({ preventScroll: true });
}

// Inicializa ícones visuais na tela (Biblioteca Lucide)
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

function atualizarPlacarTotal() {
    const elementoPlacar = document.getElementById('placar-total');
    if (elementoPlacar) {
        elementoPlacar.innerText = pontosTotais.toString();
    }
}

atualizarPlacarTotal();

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
}

// =========================================================================
// 2. INICIALIZAÇÃO DO MAPA (LEAFLET)
// =========================================================================

// A câmera se adapta ao espaço disponível sem mudar o sistema de palpites.
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
map.setMaxBounds(limitesBrasil);
window.brazilGuessrMap = map;

// Ruas, construções e pontos de interesse do OpenFreeMap, com dados OpenStreetMap.
// As bibliotecas ficam locais; só a cartografia é carregada pela rede.
let camadaMapa = null;
let tipoMapaAtual = 'ruas';
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
    tipoMapaAtual = simplificado ? 'estados' : 'ruas';
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
    } else {
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
}
trocarMapa('ruas');
document.getElementById('btn-mapa-estados').addEventListener('click', () => trocarMapa('estados'));
document.getElementById('btn-mapa-ruas').addEventListener('click', () => trocarMapa('ruas'));
document.getElementById('btn-recarregar-mapa').addEventListener('click', () => trocarMapa('ruas'));
document.getElementById('btn-usar-estados').addEventListener('click', () => trocarMapa('estados'));

function ampliarPalpite() {
    if (!palpiteJogador || jogoFinalizado) return;
    map.setView(palpiteJogador, Math.max(18, map.getZoom()));
    interfaceJogo.anunciar('Mapa aproximado no seu palpite. Use as ruas e construções para ajustar a marcação.');
}
document.getElementById('btn-ampliar-palpite').addEventListener('click', ampliarPalpite);

let avisoMapaTimeout = null;

function mostrarAvisoMapa(mensagem) {
    const avisoMapa = document.getElementById('aviso-mapa');
    if (!avisoMapa) return;

    avisoMapa.innerText = mensagem;
    avisoMapa.classList.remove('hidden');

    if (avisoMapaTimeout) {
        clearTimeout(avisoMapaTimeout);
    }

    avisoMapaTimeout = setTimeout(() => {
        avisoMapa.classList.add('hidden');
    }, 2200);
}

// Escuta o clique do jogador no mapa para registrar o palpite
function registrarPalpite(evento) {
    // Se a rodada já acabou, não deixa o jogador mudar o palpite
    if (jogoFinalizado) return;

    if (!limitesBrasil.contains(evento.latlng)) {
        mostrarAvisoMapa('Essa região não é brasileira.');
        return;
    }

    palpiteJogador = evento.latlng;
    tempoEsgotadoSemPalpite = false;

    // Se já existia um palpite anterior, remove para colocar o novo
    if (marcadorPalpite) {
        map.removeLayer(marcadorPalpite);
    }

    // Cria o marcador azul clássico no local do clique
    marcadorPalpite = L.marker(palpiteJogador, { icon: iconePalpite }).addTo(map);
    interfaceJogo.palpite(true);
}
map.on('click', registrarPalpite);

// =========================================================================
// 3. FLUXO DAS TELAS DE INÍCIO
// =========================================================================

// Passo 1: Executado ao clicar em "Iniciar Jogo" na primeira tela
function mostrarRegiaoDoDia() {
    clearInterval(intervaloCronometro);
    restaurarInterfaceCompleta();
    const indice = Math.floor(Math.random() * regioesDoJogo.length);
    regiaoSorteada = regioesDoJogo[indice];
    const nome = regiaoSorteada === 'centro-oeste' ? 'Centro-Oeste' : regiaoSorteada.charAt(0).toUpperCase() + regiaoSorteada.slice(1);
    document.getElementById('nome-regiao').innerText = nome;
    document.getElementById('badge-regiao').innerText = nome.toUpperCase();
    interfaceJogo.tela('regiao');
}

// Passo 2: Executado ao clicar em "Vamos lá!" no popup da região
function comecarPartida() {
    restaurarInterfaceCompleta();
    interfaceJogo.tela('partida');
    interfaceJogo.painel('paisagem');
    iniciarNovaRodada();
    setTimeout(() => map.invalidateSize({ animate: false }), 100);
}

// =========================================================================
// 4. LÓGICA DO JOGO (SORTEIO, TEMPO, DISTÂNCIA E PONTOS)
// =========================================================================

// Função que escolhe um lugar aleatório da região e atualiza o Street View
function iniciarNovaRodada() {
    interfaceJogo.palpite(false);
    // Limpa marcações anteriores do mapa se houver
    if (marcadorPalpite) map.removeLayer(marcadorPalpite);
    if (marcadorReal) map.removeLayer(marcadorReal);
    if (linhaConexao) map.removeLayer(linhaConexao);
    marcadorPalpite = null;
    marcadorReal = null;
    linhaConexao = null;

    palpiteJogador = null;
    jogoFinalizado = false;
    tempoEsgotadoSemPalpite = false;

    // Sorteia um local específico dentro da região sorteada do dia sem repetir até a lista acabar
    const listaLocaisDaRegiao = bancoLocais[regiaoSorteada];
    const indicesDisponiveis = listaLocaisDaRegiao
        .map((_, indice) => indice)
        .filter(indice => !locaisJaSorteadosPorRegiao[regiaoSorteada].has(indice));

    if (indicesDisponiveis.length === 0) {
        locaisJaSorteadosPorRegiao[regiaoSorteada].clear();
    }

    let indicesRecarregados = listaLocaisDaRegiao
        .map((_, indice) => indice)
        .filter(indice => !locaisJaSorteadosPorRegiao[regiaoSorteada].has(indice));
    // Evita receber o mesmo local ao trocar no limite entre dois ciclos.
    if (indicesRecarregados.length > 1) {
        indicesRecarregados = indicesRecarregados.filter(indice => listaLocaisDaRegiao[indice].id !== ultimoLocalId);
    }
    const indiceAleatorio = indicesRecarregados[Math.floor(Math.random() * indicesRecarregados.length)];
    localAtual = listaLocaisDaRegiao[indiceAleatorio];
    ultimoLocalId = localAtual.id;
    locaisJaSorteadosPorRegiao[regiaoSorteada].add(indiceAleatorio);

    document.getElementById('btn-trocar-local').disabled = false;
    document.getElementById('paisagem-carregando-texto').innerText = 'Abrindo a paisagem em 360°…';
    carregarPaisagem();

    // Reseta o mapa para o zoom inicial do Brasil
    interfaceJogo.enquadrarMapa = true;
    setTimeout(() => {
        if (document.getElementById('map').offsetWidth > 0) {
            map.fitBounds(limitesBrasil, { padding: [18, 18], animate: false });
            interfaceJogo.enquadrarMapa = false;
        }
    }, 60);
    setTimeout(() => map.invalidateSize({ animate: false }), 50);

    // Configura e inicia o cronômetro de 2 minutos
    clearInterval(intervaloCronometro);
    tempoRestante = 120;
    atualizarInterfaceTempo();
    intervaloCronometro = setInterval(contarTempo, 1000);
}

// Função que subtrai o tempo a cada segundo
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

// Atualiza o texto do relógio e a barra de progresso visual do topo
function atualizarInterfaceTempo() {
    const minutos = Math.floor(tempoRestante / 60).toString().padStart(2, '0');
    const segundos = (tempoRestante % 60).toString().padStart(2, '0');
    document.getElementById('cronometro').innerText = `${minutos}:${segundos}`;

    const porcentagem = (tempoRestante / 120) * 100;
    document.getElementById('barra-tempo').style.width = `${porcentagem}%`;
    document.querySelector('.clock-metric').classList.toggle('urgent', tempoRestante <= 30);
    document.body.classList.toggle('tempo-urgente', tempoRestante <= 30);
    if (tempoRestante === 30) interfaceJogo.anunciar('Restam 30 segundos.');
}

// Função matemática para calcular os pontos de 0 a 5000 (Fórmula baseada no GeoGuessr)
function calcularPontuacao(distanciaKm) {
    if (distanciaKm <= 0.05) return 5000; // Menos de 50 metros = Pontuação Máxima
    if (distanciaKm > 3000) return 0;     // Mais de 3000 km de distância = 0 pontos

    const pontos = 5000 * Math.exp(-distanciaKm / 300);
    return Math.round(pontos);
}

function atualizarModalResultado(localNome, distanciaTexto, pontosRodada, pontosTotaisAcumulados) {
    document.getElementById('resultado-local').innerText = localNome;
    document.getElementById('mapa-resultado-local').innerText = localNome;
    document.getElementById('resultado-rodada').innerText = pontosRodada.toLocaleString('pt-BR');
    document.getElementById('resultado-total').innerText = pontosTotaisAcumulados.toLocaleString('pt-BR');
    document.getElementById('resultado-distancia').innerText = distanciaTexto;
    document.getElementById('resultado-diferenca').innerText = distanciaTexto;
    document.getElementById('placar-total').innerText = pontosTotaisAcumulados.toLocaleString('pt-BR');
    const bomResultado = pontosRodada >= 4000;
    const estado = dadosEstados[localAtual.uf];
    const regiao = estado.regiao === 'centro-oeste' ? 'Centro-Oeste' : estado.regiao.charAt(0).toUpperCase() + estado.regiao.slice(1);
    document.getElementById('resultado-geografia').innerText = `${estado.nome} · Região ${regiao}`;
    const descoberta = curiosidadesLocais[localAtual.id];
    document.getElementById('resultado-curiosidade').innerText = descoberta?.texto || (localAtual.cidade === estado.capital ? descobertasRegioes[estado.regiao] : `${estado.nome} tem como capital ${estado.capital}.`);
    const fonte = document.getElementById('resultado-fonte');
    fonte.href = descoberta?.fonte || 'https://educa.ibge.gov.br/criancas/brasil/2850-nosso-territorio/19637-divisao-territorial.html';
    fonte.innerText = descoberta?.instituicao || 'IBGE Educa';
    document.getElementById('resultado-eyebrow').innerText = bomResultado ? 'COPERO: EXCELENTE LEITURA DAS PISTAS!' : pontosRodada > 0 ? 'COPERO: CADA PISTA AJUDA A IR MAIS LONGE.' : 'COPERO: VAMOS DESCOBRIR JUNTOS!';
    document.getElementById('titulo-resultado').innerHTML = bomResultado ? 'Olhar de<br>explorador!' : 'O Brasil<br>surpreende.';
    const copero = document.getElementById('copero-resultado');
    copero.src = bomResultado ? 'assets/copero-explorador-comemorando.webp' : pontosRodada >= 1500 ? 'assets/copero-explorador-bussola.webp' : 'assets/copero-explorador-apresentando.webp';
    copero.alt = bomResultado ? 'Copero explorador comemora sua descoberta com os braços levantados' : pontosRodada >= 1500 ? 'Copero explorador observa as pistas com sua bússola' : 'Copero explorador convida você para uma nova exploração';
    interfaceJogo.tela('resultado');
    copero.classList.remove('copero-reage');
    // Reaplica uma reação curta somente ao descobrir um resultado novo.
    void copero.offsetWidth;
    copero.classList.add('copero-reage');
}

function fecharResultadoEVoltar() {
    ativarModoMapaResultado();
}

// Função disparada ao clicar no botão "Confirmar Palpite"
function verificarPalpite() {
    if (jogoFinalizado) {
        // Se a rodada acabou e o botão virou "Voltar ao Início", recarrega a tela inicial
        voltarAoInicio();
        return;
    }

    const semPalpite = !palpiteJogador;
    if (semPalpite) {
        tempoEsgotadoSemPalpite = true;
    }

    jogoFinalizado = true;
    clearInterval(intervaloCronometro); // Para o relógio imediatamente
    encerrarCarregamentoPaisagem();
    document.getElementById('btn-trocar-local').disabled = true;
    document.getElementById('btn-enviar').disabled = true;

    // Calcula a distância usando o método nativo do Leaflet (converte de metros para Km)
    const coordenadaRealLatLng = L.latLng(localAtual.lat, localAtual.lng);
    const distanciaKm = semPalpite ? null : map.distance(palpiteJogador, coordenadaRealLatLng) / 1000;

    // Calcula a pontuação final da rodada
    pontosDaRodada = tempoEsgotadoSemPalpite ? 0 : calcularPontuacao(distanciaKm);
    pontosTotais += pontosDaRodada;
    document.getElementById('placar-total').innerText = pontosTotais.toString();

    // Revela a resposta correta no mapa com um marcador diferenciado
    marcadorReal = L.marker(coordenadaRealLatLng, { icon: iconeReal }).addTo(map)
        .bindPopup(`<b>${localAtual.nome}</b><br>Você ${semPalpite ? 'não marcou palpite' : `errou por ${distanciaKm.toFixed(1)} km.`}`)
        .openPopup();

    // Desenha uma linha pontilhada ligando o palpite à resposta real
    if (!semPalpite) {
        linhaConexao = L.polyline([palpiteJogador, coordenadaRealLatLng], {
            color: '#b38d28',
            weight: 3,
            dashArray: '6, 8'
        }).addTo(map);
    }

    // Ajusta a câmera do mapa para mostrar o palpite e a resposta ao mesmo tempo
    if (!semPalpite && marcadorPalpite) {
        const grupoMarcadores = new L.featureGroup([marcadorPalpite, marcadorReal].filter(m => m !== null));
        map.fitBounds(grupoMarcadores.getBounds().pad(0.3));
    } else {
        map.setView(coordenadaRealLatLng, 6);
    }

    // Exibe o resultado em um modal central
    atualizarModalResultado(localAtual.nome, semPalpite ? 'Sem palpite' : `${distanciaKm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`, pontosDaRodada, pontosTotais);
    // A comparação no mapa pode ser aberta a partir da tela de resultado.

    document.getElementById('btn-marcar-centro').disabled = true;
}

document.getElementById('btn-fechar-resultado').addEventListener('click', fecharResultadoEVoltar);
document.getElementById('btn-voltar-inicio-header').addEventListener('click', voltarAoInicio);

// Controles da nova apresentação; as regras da partida continuam acima.
document.getElementById('btn-iniciar').addEventListener('click', mostrarRegiaoDoDia);
document.getElementById('btn-comecar').addEventListener('click', comecarPartida);
document.getElementById('btn-voltar-regiao').addEventListener('click', voltarAoInicio);
document.getElementById('btn-sair-partida').addEventListener('click', voltarAoInicio);
document.getElementById('btn-inicio-resultado').addEventListener('click', voltarAoInicio);
document.getElementById('btn-enviar').addEventListener('click', verificarPalpite);
document.getElementById('btn-trocar-local').addEventListener('click', trocarLocalIndisponivel);
document.getElementById('btn-nova-exploracao').addEventListener('click', mostrarRegiaoDoDia);
document.getElementById('btn-reabrir-resultado').addEventListener('click', () => interfaceJogo.tela('resultado'));
document.getElementById('btn-centralizar').addEventListener('click', () => map.fitBounds(limitesBrasil, { padding: [18, 18] }));
document.getElementById('btn-marcar-centro').addEventListener('click', () => registrarPalpite({ latlng: map.getCenter() }));
