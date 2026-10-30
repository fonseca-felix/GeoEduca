# Estado atual do BrazilGuessr

Jogo de exploração geográfica do Brasil, com paisagem Google Street View, palpite em mapa Leaflet e pontuação calculada pela distância. Frontend puro, sem backend.

A apresentação foi integrada à identidade da série GeoEduca: dourado #cca43b, azul-marinho #0b0a32, verde #233b0b e fundo claro #f7f3e9. Usa a fonte e três poses do Copero explorador, produzidas com base nas referências do personagem.

Fluxo: início → sorteio de região → partida de 120 segundos → resultado → comparação no mapa ou nova exploração. O sorteio é aleatório por rodada; não é um desafio diário sincronizado com calendário. Os pontos são acumulados apenas durante a sessão.

`index.html` contém a estrutura, `style.css` a apresentação, `interface.js` a navegação visual e `locais.js` o catálogo e conteúdo educativo e `script.js` as regras. A base inicial é Ruas e lugares, com cartografia OpenFreeMap/OpenStreetMap e desenho Canvas via Protomaps Leaflet. O mapa de estados local é alternativa. A câmera chega ao zoom 20 e permite aproximar o próprio palpite ao zoom 18. O arquivo mapa-ruas.js configura a cartografia. O iframe Street View continua externo.

Regras, limitações, fontes, instruções de hospedagem e manutenção estão em `README.md`; os testes executados estão em `VALIDACAO.md`. Não considere o mapa local uma base de ruas e não declare todo o jogo offline: o Street View precisa da internet.

Atualização de 27/10/2026: 99 pontos conferidos visualmente, 69 ativos. Região determinada pela UF; nomes revisados. Troca manual do local na mesma região sem alterar pontos e com reinício do tempo; resultado educativo com fonte e três reações do Copero. O iframe externo não oferece comprovação automática de disponibilidade. Histórico em REVISAO_LOCAIS.csv.
