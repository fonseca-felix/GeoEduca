/* Cartografia OpenMapTiles desenhada em Canvas 2D, sem WebGL.
   Ruas, prédios e referências aparecem progressivamente ao ampliar. */
let configuracaoRuas = null;

async function criarCamadaRuas(creditos) {
    if (!configuracaoRuas) {
        configuracaoRuas = fetch('https://tiles.openfreemap.org/planet/latest')
            .then(resposta => {
                if (!resposta.ok) throw new Error('Cartografia indisponível');
                return resposta.json();
            })
            .catch(erro => { configuracaoRuas = null; throw erro; });
    }
    const fonte = await configuracaoRuas;
    if (!Array.isArray(fonte.tiles) || !fonte.tiles[0]) {
        configuracaoRuas = null;
        throw new Error('Fonte de mapa inválida');
    }
    const p = protomapsL;
    const temNome = (z, f) => Boolean(f.props.name || f.props['name:pt']);
    const nome = ['name:pt', 'name', 'name:en'];
    const texto = (tamanho, cor, peso = '') => new p.CenteredTextSymbolizer({
        labelProps: nome, font: `${peso} ${tamanho}px Arial`.trim(),
        fill: cor, stroke: '#fffdf8', width: 2, maxLineChars: 24
    });
    const principal = (z, f) => ['motorway', 'trunk', 'primary', 'secondary'].includes(f.props.class);
    const camada = p.leafletLayer({
        url: fonte.tiles[0], maxDataZoom: fonte.maxzoom || 14,
        maxZoom: 20, noWrap: true, attribution: creditos,
        backgroundColor: '#f6f2e8', lang: 'pt',
        paintRules: [
            { dataLayer: 'landcover', symbolizer: new p.PolygonSymbolizer({ fill: '#dce8cd' }) },
            { dataLayer: 'landuse', symbolizer: new p.PolygonSymbolizer({ fill: '#e7e1d4' }) },
            { dataLayer: 'park', symbolizer: new p.PolygonSymbolizer({ fill: '#d4e5c4' }) },
            { dataLayer: 'water', symbolizer: new p.PolygonSymbolizer({ fill: '#b7d9e8' }) },
            { dataLayer: 'waterway', symbolizer: new p.LineSymbolizer({ color: '#9fcadf', width: 1.5 }) },
            { dataLayer: 'boundary', symbolizer: new p.LineSymbolizer({ color: '#aaa398', width: 1, dash: [4, 3] }) },
            { dataLayer: 'aeroway', symbolizer: new p.PolygonSymbolizer({ fill: '#d7d3ce' }) },
            { dataLayer: 'building', minzoom: 14, symbolizer: new p.PolygonSymbolizer({ fill: '#d8cfbe', stroke: '#bfb39c', width: 0.6 }) },
            { dataLayer: 'transportation', minzoom: 8, symbolizer: new p.LineSymbolizer({ color: '#c9bfae', width: z => z < 12 ? 2 : z < 16 ? 4 : 9 }) },
            { dataLayer: 'transportation', minzoom: 10, symbolizer: new p.LineSymbolizer({ color: '#fffdfa', width: z => z < 12 ? 1 : z < 16 ? 2.5 : 7 }) },
            { dataLayer: 'transportation', filter: principal, symbolizer: new p.LineSymbolizer({ color: '#e2b96b', width: z => z < 8 ? 1 : z < 13 ? 2.5 : z < 17 ? 5 : 10 }) },
            { dataLayer: 'transportation', minzoom: 11, filter: (z, f) => f.props.class === 'rail', symbolizer: new p.LineSymbolizer({ color: '#9b9590', width: 1, dash: [4, 3] }) },
            { dataLayer: 'poi', minzoom: 15, filter: temNome, symbolizer: new p.CircleSymbolizer({ radius: 2.5, fill: '#557250', stroke: '#fffdf8', width: 1 }) }
        ],
        labelRules: [
            { dataLayer: 'place', minzoom: 3, maxzoom: 8, filter: (z, f) => ['country', 'state'].includes(f.props.class) && temNome(z, f), symbolizer: texto(12, '#5a625e', '600') },
            { dataLayer: 'place', minzoom: 5, maxzoom: 16, filter: (z, f) => ['city', 'town', 'village'].includes(f.props.class) && temNome(z, f), symbolizer: texto(13, '#3c4648', '600') },
            { dataLayer: 'place', minzoom: 12, filter: (z, f) => ['suburb', 'quarter', 'neighbourhood'].includes(f.props.class) && temNome(z, f), symbolizer: texto(11, '#6a6b5f') },
            { dataLayer: 'aerodrome_label', minzoom: 9, filter: temNome, symbolizer: texto(12, '#655478', '600') },
            { dataLayer: 'transportation_name', minzoom: 7, filter: (z, f) => principal(z, f) && Boolean(f.props.ref), symbolizer: new p.LineLabelSymbolizer({ labelProps: ['ref'], font: '600 10px Arial', fill: '#6a562c', stroke: '#fffdfa', width: 3, repeatDistance: 350 }) },
            { dataLayer: 'transportation_name', minzoom: 13, filter: temNome, symbolizer: new p.LineLabelSymbolizer({ labelProps: nome, font: '11px Arial', fill: '#544e44', stroke: '#fffdfa', width: 2, repeatDistance: 180, maxLabelChars: 60 }) },
            { dataLayer: 'poi', minzoom: 15, filter: temNome, sort: (a, b) => (Number(a.rank) || 100) - (Number(b.rank) || 100), symbolizer: texto(11, '#355c3b') },
            { dataLayer: 'water_name', minzoom: 10, filter: temNome, symbolizer: texto(11, '#447c96') },
            { dataLayer: 'housenumber', minzoom: 18, symbolizer: new p.CenteredTextSymbolizer({ labelProps: ['housenumber'], font: '9px Arial', fill: '#837464', stroke: '#fffdfa', width: 1 }) }
        ]
    });
    // O renderizador termina o tile mesmo quando a busca falha. Propaga a
    // falha da fonte como evento Leaflet para o jogo oferecer recuperação.
    for (const view of camada.views.values()) {
        const fonteTiles = view.tileCache.source;
        const buscar = fonteTiles.get.bind(fonteTiles);
        fonteTiles.get = async (coordenada, tamanho) => {
            try { return await buscar(coordenada, tamanho); }
            catch (erro) {
                // Mudar o zoom cancela requisições do enquadramento anterior.
                if (erro.name !== 'AbortError') camada.fire('tileerror', { error: erro, coords: coordenada });
                throw erro;
            }
        };
    }
    return camada;
}
