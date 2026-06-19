document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('app-layout').insertAdjacentHTML('afterbegin', buildAlunoSidebar());
    const user = initPage('aluno');
    if (!user) return;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    const jogoId = localStorage.getItem('bg_jogo_id') || 'brazilguessr';
    let partidasRestantes = 10;
    let pontosTotais = 0;
    let partidasHoje = 0;
    let limiteDiario = 10;
    
    // Buscar status inicial no backend
    api.get(`/jogos/${jogoId}/estatisticas`).then(stats => {
        pontosTotais = stats.total || 0;
        limiteDiario = stats.limiteDiario || 10;
        partidasHoje = stats.partidasHoje || 0;
        partidasRestantes = limiteDiario - partidasHoje;
        if (partidasRestantes < 0) partidasRestantes = 0;
        document.getElementById('header-partidas-restantes').innerText = `Tentativas Restantes: ${partidasRestantes}`;
        const placar = document.getElementById('placar-total');
        if(placar) placar.innerText = pontosTotais.toString();
    }).catch(err => {
        console.error('Erro ao buscar estatísticas', err);
        document.getElementById('header-partidas-restantes').innerText = `Erro ao carregar dados`;
    });

    const regioesDoJogo = ["norte", "nordeste", "centro-oeste", "sudeste", "sul"];

    const bancoLocais = {
        "norte": [
            { nome: "Teatro Amazonas - Manaus, AM", lat: -3.1302, lng: -60.0234, heading: 135 },
            { nome: "Mercado Ver-o-Peso - Belém, PA", lat: -1.4522, lng: -48.5037, heading: 300 },
            { nome: "Marco Zero do Equador - Macapá, AP", lat: 0.0006, lng: -51.0853, heading: 90 },
            { nome: "Praça da República - Belém, PA", lat: -1.4563, lng: -48.5021, heading: 180 },
            { nome: "Orla de Santarém - Santarém, PA", lat: -2.4433, lng: -54.7084, heading: 120 },
            { nome: "Forte do Presépio - Belém, PA", lat: -1.4538, lng: -48.5045, heading: 90 },
            { nome: "Ponta Negra - Manaus, AM", lat: -3.0788, lng: -60.0898, heading: 180 },
            { nome: "Praça das Águas - Boa Vista, RR", lat: -2.8190, lng: -60.6730, heading: 45 },
            { nome: "Palácio Rio Branco - Rio Branco, AC", lat: -9.9740, lng: -67.8100, heading: 90 },
            { nome: "Estrada de Ferro Madeira-Mamoré - Porto Velho, RO", lat: -8.7600, lng: -63.9050, heading: 180 },
            { nome: "Praça dos Girassóis - Palmas, TO", lat: -10.1840, lng: -48.3330, heading: 0 },
            { nome: "Bumbódromo - Parintins, AM", lat: -2.6280, lng: -56.7360, heading: 90 },
            { nome: "Orla de Marabá - Marabá, PA", lat: -5.3520, lng: -49.1170, heading: 120 },
            { nome: "Parque Anauá - Boa Vista, RR", lat: -2.8390, lng: -60.6580, heading: 270 },
            { nome: "Basílica de Nazaré - Belém, PA", lat: -1.4520, lng: -48.4760, heading: 90 },
            { nome: "Praia da Graciosa - Palmas, TO", lat: -10.1760, lng: -48.3610, heading: 180 },
            { nome: "Arena da Amazônia - Manaus, AM", lat: -3.0830, lng: -60.0280, heading: 0 }
        ],
        "nordeste": [
            { nome: "Pelourinho - Salvador, BA", lat: -12.9716, lng: -38.5089, heading: 0 },
            { nome: "Elevador Lacerda - Salvador, BA", lat: -12.9753, lng: -38.5129, heading: 45 },
            { nome: "Praia de Ponta Negra - Natal, RN", lat: -5.8856, lng: -35.1719, heading: 45 },
            { nome: "Marco Zero - Recife, PE", lat: -8.0632, lng: -34.8715, heading: 120 },
            { nome: "Lençóis Maranhenses - Barreirinhas, MA", lat: -2.4755, lng: -43.1239, heading: 0 },
            { nome: "Farol da Barra - Salvador, BA", lat: -13.0105, lng: -38.5328, heading: 270 },
            { nome: "Centro Histórico - Olinda, PE", lat: -8.0135, lng: -34.8553, heading: 90 },
            { nome: "Dragão do Mar - Fortaleza, CE", lat: -3.7212, lng: -38.5118, heading: 180 },
            { nome: "Praia de Tambaú - João Pessoa, PB", lat: -7.1140, lng: -34.8210, heading: 90 },
            { nome: "Praia de Pajuçara - Maceió, AL", lat: -9.6730, lng: -35.7140, heading: 180 },
            { nome: "Orla de Atalaia - Aracaju, SE", lat: -10.9950, lng: -37.0370, heading: 45 },
            { nome: "Ponte Estaiada - Teresina, PI", lat: -5.0740, lng: -42.7930, heading: 270 },
            { nome: "Palácio dos Leões - São Luís, MA", lat: -2.5270, lng: -44.3060, heading: 0 },
            { nome: "Praia do Futuro - Fortaleza, CE", lat: -3.7380, lng: -38.4520, heading: 90 },
            { nome: "Boa Viagem - Recife, PE", lat: -8.1300, lng: -34.9000, heading: 180 },
            { nome: "Lagoa do Abaeté - Salvador, BA", lat: -12.9460, lng: -38.3560, heading: 45 },
            { nome: "Açude Velho - Campina Grande, PB", lat: -7.2220, lng: -35.8830, heading: 135 }
        ],
        "centro-oeste": [
            { nome: "Esplanada dos Ministérios - Brasília, DF", lat: -15.8005, lng: -47.8642, heading: 90 },
            { nome: "Catedral de Brasília - Brasília, DF", lat: -15.7821, lng: -47.8750, heading: 180 },
            { nome: "Praça Cívica - Goiânia, GO", lat: -16.6732, lng: -49.2559, heading: 180 },
            { nome: "Parque Mãe Bonifácia - Cuiabá, MT", lat: -15.6091, lng: -56.1103, heading: 135 },
            { nome: "Morada dos Baís - Campo Grande, MS", lat: -20.4486, lng: -54.6159, heading: 300 },
            { nome: "Pontão do Lago Sul - Brasília, DF", lat: -15.8306, lng: -47.8571, heading: 45 },
            { nome: "Praça do Rádio Clube - Campo Grande, MS", lat: -20.4608, lng: -54.6152, heading: 90 },
            { nome: "Parque Flamboyant - Goiânia, GO", lat: -16.7080, lng: -49.2340, heading: 180 },
            { nome: "Arena Pantanal - Cuiabá, MT", lat: -15.6030, lng: -56.1210, heading: 270 },
            { nome: "Parque das Nações Indígenas - Campo Grande, MS", lat: -20.4500, lng: -54.5800, heading: 90 },
            { nome: "Memorial JK - Brasília, DF", lat: -15.7840, lng: -47.9130, heading: 0 },
            { nome: "Parque Vaca Brava - Goiânia, GO", lat: -16.7120, lng: -49.2730, heading: 45 },
            { nome: "Chapada dos Guimarães (Centro) - MT", lat: -15.4600, lng: -55.7490, heading: 180 },
            { nome: "Praça da Liberdade - Bonito, MS", lat: -21.1260, lng: -56.4810, heading: 90 },
            { nome: "Praça do Coreto - Goiás Velho, GO", lat: -15.9330, lng: -50.1400, heading: 0 }
        ],
        "sudeste": [
            { nome: "Avenida Paulista - São Paulo, SP", lat: -23.5615, lng: -46.6560, heading: 210 },
            { nome: "MASP - São Paulo, SP", lat: -23.5617, lng: -46.6558, heading: 0 },
            { nome: "Copacabana - Rio de Janeiro, RJ", lat: -22.9711, lng: -43.1843, heading: 120 },
            { nome: "Cristo Redentor - Rio de Janeiro, RJ", lat: -22.9519, lng: -43.2105, heading: 180 },
            { nome: "Praça da Liberdade - Belo Horizonte, MG", lat: -19.9323, lng: -43.9380, heading: 220 },
            { nome: "Parque Ibirapuera - São Paulo, SP", lat: -23.5874, lng: -46.6576, heading: 45 },
            { nome: "Museu do Amanhã - Rio de Janeiro, RJ", lat: -22.8945, lng: -43.1795, heading: 90 },
            { nome: "Praça Tiradentes - Ouro Preto, MG", lat: -20.3855, lng: -43.5036, heading: 180 },
            { nome: "Maracanã - Rio de Janeiro, RJ", lat: -22.9120, lng: -43.2300, heading: 270 },
            { nome: "Igreja da Pampulha - Belo Horizonte, MG", lat: -19.8580, lng: -43.9800, heading: 135 },
            { nome: "Praça do Papa - Vitória, ES", lat: -20.3150, lng: -40.2900, heading: 90 },
            { nome: "Convento da Penha - Vila Velha, ES", lat: -20.3290, lng: -40.2860, heading: 180 },
            { nome: "Beco do Batman - São Paulo, SP", lat: -23.5560, lng: -46.6860, heading: 270 },
            { nome: "Arcos da Lapa - Rio de Janeiro, RJ", lat: -22.9140, lng: -43.1790, heading: 0 },
            { nome: "Mercado Central - Belo Horizonte, MG", lat: -19.9210, lng: -43.9430, heading: 45 },
            { nome: "Lagoa do Taquaral - Campinas, SP", lat: -22.8750, lng: -47.0540, heading: 180 },
            { nome: "Praia de Pitangueiras - Guarujá, SP", lat: -23.9980, lng: -46.2570, heading: 90 },
            { nome: "Boulevard Olímpico - Rio de Janeiro, RJ", lat: -22.8970, lng: -43.1810, heading: 135 },
            { nome: "Praia Vermelha (Pão de Açúcar) - Rio de Janeiro, RJ", lat: -22.9550, lng: -43.1650, heading: 45 }
        ],
        "sul": [
            { nome: "Ópera de Arame - Curitiba, PR", lat: -25.3853, lng: -49.2765, heading: 180 },
            { nome: "Jardim Botânico - Curitiba, PR", lat: -25.4455, lng: -49.2366, heading: 45 },
            { nome: "Ponte Hercílio Luz - Florianópolis, SC", lat: -27.5934, lng: -48.5636, heading: 300 },
            { nome: "Estátua do Laçador - Porto Alegre, RS", lat: -29.9934, lng: -51.1712, heading: 15 },
            { nome: "Usina do Gasômetro - Porto Alegre, RS", lat: -30.0344, lng: -51.2352, heading: 270 },
            { nome: "Cataratas do Iguaçu - Foz do Iguaçu, PR", lat: -25.6953, lng: -54.4367, heading: 90 },
            { nome: "Rua Coberta - Gramado, RS", lat: -29.3808, lng: -50.8732, heading: 180 },
            { nome: "Praia Central - Balneário Camboriú, SC", lat: -26.9856, lng: -48.6322, heading: 45 },
            { nome: "Museu do Olho (MON) - Curitiba, PR", lat: -25.4100, lng: -49.2660, heading: 0 },
            { nome: "Praia de Jurerê - Florianópolis, SC", lat: -27.4390, lng: -48.4950, heading: 90 },
            { nome: "Parque Redenção - Porto Alegre, RS", lat: -30.0350, lng: -51.2140, heading: 180 },
            { nome: "Rua das Palmeiras - Joinville, SC", lat: -26.3010, lng: -48.8450, heading: 45 },
            { nome: "Lago Igapó - Londrina, PR", lat: -23.3230, lng: -51.1720, heading: 270 },
            { nome: "Catedral de Maringá - Maringá, PR", lat: -23.4260, lng: -51.9380, heading: 180 },
            { nome: "Vila Germânica - Blumenau, SC", lat: -26.9150, lng: -49.0840, heading: 90 },
            { nome: "Catedral de Pedra - Canela, RS", lat: -29.3630, lng: -50.8140, heading: 0 }
        ]
    };

    let regiaoSorteada = "";
    let localAtual = null;
    let palpiteJogador = null;
    let marcadorPalpite = null;
    let marcadorReal = null;
    let linhaConexao = null;
    let jogoFinalizado = false;
    let tempoEsgotadoSemPalpite = false;
    let pontosDaRodada = 0;

    let locaisIniciais = { norte: new Set(), nordeste: new Set(), "centro-oeste": new Set(), sudeste: new Set(), sul: new Set() };
    try {
        const salvos = JSON.parse(localStorage.getItem('bg_locais_sorteados'));
        if (salvos) {
            for (let r in salvos) locaisIniciais[r] = new Set(salvos[r]);
        }
    } catch(e) {}
    const locaisJaSorteadosPorRegiao = locaisIniciais;

    function salvarSorteados() {
        let p = {};
        for(let r of Object.keys(locaisJaSorteadosPorRegiao)) p[r] = Array.from(locaisJaSorteadosPorRegiao[r]);
        localStorage.setItem('bg_locais_sorteados', JSON.stringify(p));
    }

    const limitesBrasil = L.latLngBounds(
        L.latLng(-34.5, -74.5),
        L.latLng(5.5, -32.0)
    );

    const limitesVisuais = L.latLngBounds(
        L.latLng(-50.0, -90.0), // Expansão para o sul e oeste
        L.latLng(15.0, -20.0)   // Expansão para o norte e leste
    );

    let tempoRestante = 120; 
    let intervaloCronometro = null;

    // Inicialização do Mapa
    const map = L.map('map', {
        zoomControl: false,
        maxBounds: limitesVisuais,
        maxBoundsViscosity: 0.8,
        minZoom: 3,
        maxZoom: 18,
        worldCopyJump: false
    }).setView([-14.2350, -51.9253], 4);
    L.control.zoom({ position: 'topright' }).addTo(map);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Destacar o Brasil
    fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson')
        .then(res => res.json())
        .then(data => {
            L.geoJSON(data, {
                style: {
                    color: '#10b981',
                    weight: 2,
                    opacity: 0.6,
                    fillColor: '#10b981',
                    fillOpacity: 0.1
                }
            }).addTo(map);
        })
        .catch(err => console.log('Erro ao carregar mapa do Brasil', err));

    let avisoMapaTimeout = null;

    function mostrarAvisoMapa(mensagem) {
        const avisoMapa = document.getElementById('aviso-mapa');
        if (!avisoMapa) return;
        avisoMapa.innerText = mensagem;
        avisoMapa.classList.remove('hidden');
        if (avisoMapaTimeout) clearTimeout(avisoMapaTimeout);
        avisoMapaTimeout = setTimeout(() => avisoMapa.classList.add('hidden'), 2200);
    }

    map.on('click', function(evento) {
        if (jogoFinalizado) return;
        if (!limitesBrasil.contains(evento.latlng)) {
            mostrarAvisoMapa('Fora da região válida.');
            return;
        }
        palpiteJogador = evento.latlng;
        tempoEsgotadoSemPalpite = false;
        if (marcadorPalpite) map.removeLayer(marcadorPalpite);
        marcadorPalpite = L.marker(palpiteJogador).addTo(map);
    });

    window.mostrarRegiaoDoDia = function() {
        if (partidasRestantes <= 0) {
            alert('Você já atingiu o limite diário de partidas!');
            window.location.href = 'hub_brazilguessr.html';
            return;
        }

        document.getElementById('tela-inicio').classList.add('opacity-0', 'pointer-events-none');
        
        const regioes = Object.keys(bancoLocais);
        regiaoSorteada = regioes[Math.floor(Math.random() * regioes.length)];
        
        document.getElementById('nome-regiao').innerText = regiaoSorteada;
        document.getElementById('badge-regiao').innerText = regiaoSorteada.toUpperCase();
        
        const popupRegiao = document.getElementById('tela-regiao');
        popupRegiao.classList.remove('hidden');
        popupRegiao.classList.add('flex');

        setTimeout(() => map.invalidateSize({ animate: false }), 50);
    };

    window.comecarPartida = function() {
        document.getElementById('tela-regiao').classList.remove('flex');
        document.getElementById('tela-regiao').classList.add('hidden');
        document.getElementById('tela-inicio').style.display = 'none';

        document.getElementById('main-game-container').classList.remove('modo-resultado');
        document.getElementById('painel-streetview').style.display = 'block';
        document.getElementById('barra-acao').style.display = 'flex';
        
        iniciarNovaRodada();
        setTimeout(() => map.invalidateSize({ animate: false }), 100);
    };

    function iniciarNovaRodada() {
        if (marcadorPalpite) map.removeLayer(marcadorPalpite);
        if (marcadorReal) map.removeLayer(marcadorReal);
        if (linhaConexao) map.removeLayer(linhaConexao);
        
        palpiteJogador = null;
        jogoFinalizado = false;
        tempoEsgotadoSemPalpite = false;
        const btnEnviar = document.getElementById('btn-enviar');
        btnEnviar.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5"></i> Confirmar Palpite`;
        btnEnviar.onclick = window.verificarPalpite;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const listaLocaisDaRegiao = bancoLocais[regiaoSorteada];
        const indicesDisponiveis = listaLocaisDaRegiao
            .map((_, indice) => indice)
            .filter(indice => !locaisJaSorteadosPorRegiao[regiaoSorteada].has(indice));

        if (indicesDisponiveis.length === 0) {
            locaisJaSorteadosPorRegiao[regiaoSorteada].clear();
            salvarSorteados();
        }

        const indicesRecarregados = listaLocaisDaRegiao
            .map((_, indice) => indice)
            .filter(indice => !locaisJaSorteadosPorRegiao[regiaoSorteada].has(indice));
        const indiceAleatorio = indicesRecarregados[Math.floor(Math.random() * indicesRecarregados.length)];
        localAtual = listaLocaisDaRegiao[indiceAleatorio];
        locaisJaSorteadosPorRegiao[regiaoSorteada].add(indiceAleatorio);
        salvarSorteados();

        const iframe = document.getElementById('sv-iframe');
        iframe.src = `https://www.google.com/maps?cbll=${localAtual.lat},${localAtual.lng}&layer=c&cbp=12,${localAtual.heading},0,0,0&output=svembed`;

        map.setView([-14.2350, -51.9253], 4);
        setTimeout(() => map.invalidateSize({ animate: false }), 50);

        clearInterval(intervaloCronometro);
        tempoRestante = 120;
        atualizarInterfaceTempo();
        intervaloCronometro = setInterval(contarTempo, 1000);
    }

    function contarTempo() {
        if (tempoRestante > 0 && !jogoFinalizado) {
            tempoRestante--;
            atualizarInterfaceTempo();
        } else if (tempoRestante <= 0 && !jogoFinalizado) {
            clearInterval(intervaloCronometro);
            tempoEsgotadoSemPalpite = !palpiteJogador;
            window.verificarPalpite();
        }
    }

    function atualizarInterfaceTempo() {
        const minutos = Math.floor(tempoRestante / 60).toString().padStart(2, '0');
        const segundos = (tempoRestante % 60).toString().padStart(2, '0');
        document.getElementById('cronometro').innerText = `${minutos}:${segundos}`;
        const porcentagem = (tempoRestante / 120) * 100;
        document.getElementById('barra-tempo').style.width = `${porcentagem}%`;
    }

    function calcularPontuacao(distanciaKm) {
        if (distanciaKm <= 0.05) return 5000; 
        if (distanciaKm > 3000) return 0;
        const pontos = 5000 * Math.exp(-distanciaKm / 300);
        return Math.round(pontos);
    }

    window.verificarPalpite = async function() {
        if (jogoFinalizado) return;

        const semPalpite = !palpiteJogador;
        if (semPalpite) tempoEsgotadoSemPalpite = true;

        jogoFinalizado = true;
        clearInterval(intervaloCronometro);

        const coordenadaRealLatLng = L.latLng(localAtual.lat, localAtual.lng);
        const distanciaKm = semPalpite ? null : map.distance(palpiteJogador, coordenadaRealLatLng) / 1000;

        pontosDaRodada = tempoEsgotadoSemPalpite ? 0 : calcularPontuacao(distanciaKm);
        pontosTotais += pontosDaRodada;
        document.getElementById('placar-total').innerText = pontosTotais.toString();

        marcadorReal = L.marker(coordenadaRealLatLng).addTo(map)
            .bindPopup(`<b>${localAtual.nome}</b><br>Você ${semPalpite ? 'não marcou palpite' : `errou por ${distanciaKm.toFixed(1)} km.`}`)
            .openPopup();

        if (!semPalpite) {
            linhaConexao = L.polyline([palpiteJogador, coordenadaRealLatLng], {
                color: '#f59e0b', weight: 3, dashArray: '6, 8'
            }).addTo(map);
        }

        if (!semPalpite && marcadorPalpite) {
            const grupoMarcadores = new L.featureGroup([marcadorPalpite, marcadorReal].filter(m => m !== null));
            map.fitBounds(grupoMarcadores.getBounds().pad(0.3));
        } else {
            map.setView(coordenadaRealLatLng, 6);
        }

        // Salvar pontuação
        try {
            await api.post(`/jogos/${jogoId}/pontuacao`, { pontuacao: pontosDaRodada });
        } catch (err) {
            console.error('Erro ao salvar pontos', err);
        }

        partidasRestantes--;
        partidasHoje++;
        document.getElementById('header-partidas-restantes').innerText = `Tentativas Restantes: ${partidasRestantes}`;

        const diffStr = semPalpite ? 'Sem palpite' : `${distanciaKm.toFixed(1)} km`;
        document.getElementById('resultado-local').innerText = localAtual.nome;
        document.getElementById('resultado-rodada').innerText = pontosDaRodada.toString();
        document.getElementById('resultado-total').innerText = pontosTotais.toString();
        document.getElementById('resultado-diferenca').innerText = diffStr;

        const btnProxima = document.getElementById('btn-proxima-rodada');
        if (partidasRestantes <= 0) {
            btnProxima.innerText = "Ver Resultados Finais";
            btnProxima.onclick = () => window.location.href = 'hub_brazilguessr.html';
        } else {
            btnProxima.innerText = `Próxima Rodada (${partidasRestantes} restantes)`;
        }

        document.getElementById('tela-resultado').classList.remove('hidden');
        document.getElementById('tela-resultado').classList.add('flex');
    };

    window.proximaRodada = function() {
        if (partidasRestantes <= 0) {
            window.location.href = 'hub_brazilguessr.html';
        } else {
            document.getElementById('tela-resultado').classList.remove('flex');
            document.getElementById('tela-resultado').classList.add('hidden');
            window.mostrarRegiaoDoDia();
        }
    };

    window.fecharResultadoEVerMapa = function() {
        document.getElementById('tela-resultado').classList.remove('flex');
        document.getElementById('tela-resultado').classList.add('hidden');
        
        document.getElementById('main-game-container').classList.add('modo-resultado');
        document.getElementById('painel-streetview').style.display = 'none';
        document.getElementById('barra-acao').style.display = 'none';
        
        setTimeout(() => map.invalidateSize({ animate: false }), 50);

        // Altera botão enviar para "Próxima Rodada" ou voltar
        document.getElementById('barra-acao').style.display = 'flex';
        document.getElementById('btn-enviar').innerHTML = partidasRestantes <= 0 
            ? `<i data-lucide="rotate-ccw" class="w-5 h-5"></i> Voltar ao Início`
            : `Próxima Rodada <i data-lucide="arrow-right" class="w-5 h-5"></i>`;
        document.getElementById('btn-enviar').onclick = window.proximaRodada;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };
});
