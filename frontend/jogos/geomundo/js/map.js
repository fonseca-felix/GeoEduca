let geoMap = null;
let paisSelecionadoCallback = null;

// Marcadores do modo exploração
let marcadorAtual = null;

/**
 * Inicializa o mapa Leaflet dentro da div #map.
 */
function initMap() {
  if (typeof L === "undefined") {
    const fallback = document.createElement("img"); fallback.src = "assets/atlas/mundo.svg";
    fallback.alt = "Mapa-múndi ilustrativo"; fallback.className = "atlas-map-fallback";
    document.getElementById("map").replaceChildren(fallback);
    document.getElementById("map-hint").textContent = "Mapa interativo indisponível. O quiz continua funcionando.";
    return;
  }
  geoMap = L.map("map", {
    center: [-15, -55],
    zoom: 3,
    minZoom: 2,
    maxZoom: 6,
    zoomControl: true,
    worldCopyJump: false,
    maxBounds: [[-85,-220],[85,220]],
    maxBoundsViscosity: 0.9
  });

  // The complete base map is local: no external tile service or API key.
  geoMap.attributionControl.setPrefix('Leaflet');
  geoMap.attributionControl.addAttribution('Natural Earth');
  const geography=window.GEO_MUNDO_GEOGRAPHY;
  const countryLayer=L.geoJSON(geography, {
    style: {color:'#8e9696',weight:0.8,fillColor:'#f7f3e9',fillOpacity:1},
    onEachFeature(feature,layer) {
      const name=feature.properties.NAME_PT||feature.properties.ADMIN;
      const label=document.createElement('span');label.textContent=name;
      layer.bindTooltip(label,{sticky:true,direction:'top',className:'country-hover'});
    }
  }).addTo(geoMap);
  const labels=L.layerGroup().addTo(geoMap);
  function updateLabels() {
    labels.clearLayers();
    const zoom=geoMap.getZoom();
    for(const feature of geography.features) {
      const props=feature.properties;
      if(props.ADMIN==='Antarctica'||props.LABEL_X==null||props.LABEL_Y==null)continue;
      if(zoom<2.5||props.LABELRANK>(zoom>=4.5?6:zoom>=3.5?4:2))continue;
      const text=document.createElement('span');text.textContent=props.NAME_PT||props.ADMIN;
      L.marker([props.LABEL_Y,props.LABEL_X],{interactive:false,keyboard:false,icon:L.divIcon({html:text,className:'country-label',iconSize:[100,20],iconAnchor:[50,10]})}).addTo(labels);
    }
  }
  geoMap.on('zoomend',updateLabels);updateLabels();

  geoMap.on("click", (e) => {
    onClickExploracao(e);
  });
}

/**
 * Cria um ícone de emoji para usar como marcador (sem depender
 * de imagens externas).
 */
function criarIconeEmoji(emoji, classeExtra) {
  return L.divIcon({
    html: `<div class="geo-marker-icon ${classeExtra || ""}"><svg viewBox="0 0 24 30" width="30" height="36" aria-hidden="true"><path d="M12 29S1 16 1 11a11 11 0 0 1 22 0c0 5-11 18-11 18Z" fill="#CCA43B" stroke="white" stroke-width="2"/><circle cx="12" cy="11" r="4" fill="#0B0A32"/></svg></div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 26]
  });
}

/**
 * Centraliza o mapa em uma coordenada [lng, lat] com um zoom específico.
 */
function centralizarMapa(coordenadasLngLat, zoom = 4) {
  if (!geoMap) return;
  const [lng, lat] = coordenadasLngLat;
  geoMap.flyTo([lat, lng], zoom, { duration: 0.6 });
}

/**
 * Aplica zoom em uma região do mundo (usado ao trocar de nível).
 */
const CENTRO_REGIAO = {
  "america-do-sul": { center: [-60, -15], zoom: 3 },
  "america-do-norte": { center: [-100, 45], zoom: 3 },
  europa: { center: [15, 50], zoom: 3.5 },
  asia: { center: [90, 35], zoom: 3 },
  africa: { center: [20, 2], zoom: 3 },
  oceania: { center: [140, -25], zoom: 3.2 },
  mundo: { center: [10, 15], zoom: 2 }
};

function centralizarRegiao(regiaoId) {
  const alvo = CENTRO_REGIAO[regiaoId] || CENTRO_REGIAO["mundo"];
  centralizarMapa(alvo.center, alvo.zoom);
}

/**
 * Adiciona um marcador simples no mapa (usado no modo exploração).
 */
function adicionarMarcador(coordenadasLngLat, label) {
  if (!geoMap) return;
  if (marcadorAtual) geoMap.removeLayer(marcadorAtual);
  const [lng, lat] = coordenadasLngLat;
  marcadorAtual = L.marker([lat, lng], { icon: criarIconeEmoji("📍") }).addTo(geoMap);
  if (label) { const content = document.createElement("span"); content.textContent = label; marcadorAtual.bindPopup(content).openPopup(); }
}

/**
 * Define a função chamada quando o jogador clica em um país no
 * modo exploração. Como os tiles do OSM não trazem fronteiras
 * vetoriais clicáveis, localizamos o país conhecido mais próximo
 * do ponto clicado (dentro de um raio razoável).
 */
function aoSelecionarPais(callback) {
  paisSelecionadoCallback = callback;
}

function onClickExploracao(e) {
  if (!paisSelecionadoCallback || typeof bancoPaises === "undefined") return;

  let maisProximo = null;
  let menorDistancia = Infinity;

  Object.entries(bancoPaises).forEach(([nome, dados]) => {
    const [lng, lat] = dados.coordenadas;
    const dist = calcularDistanciaKm(e.latlng.lat, e.latlng.lng, lat, lng);
    if (dist < menorDistancia) {
      menorDistancia = dist;
      maisProximo = nome;
    }
  });

  // só considera "clicou no país" se estiver a uma distância razoável
  if (maisProximo && menorDistancia <= 900) {
    paisSelecionadoCallback(maisProximo);
  }
}

/**
 * Calcula a distância em quilômetros entre duas coordenadas
 * geográficas usando a fórmula de Haversine (usada no modo
 * exploração para encontrar o país mais próximo do clique).
 */
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // raio médio da Terra em km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Funções mantidas por compatibilidade com o restante do código
 * (não fazem mais nada útil sem as fronteiras vetoriais do Mapbox,
 * mas evitam quebrar chamadas existentes).
 */
function destacarPais() {}
function limparDestaque() {}
