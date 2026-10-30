# BrazilGuessr · GeoEduca

Reformulação visual com a composição, a paleta e a fonte da série GeoEduca. O Copero tem agora uma versão exploradora própria para o BrazilGuessr: sem o traje de detetive, com colete verde, camiseta bege, lenço azul-marinho e bússola. As três poses foram geradas com base nas referências do personagem, mantendo suas características visuais.

## Abrir o jogo

1. Extraia todo o ZIP.
2. Abra a pasta `BrazilGuessr` no VS Code.
3. Execute `index.html` pelo Live Server, ou sirva a pasta com um servidor HTTP estático.

Para hospedar, envie `index.html`, `style.css`, `interface.js`, `locais.js`, `mapa-ruas.js`, `script.js` e a pasta `assets` juntos, preservando os caminhos. O projeto continua em HTML, CSS e JavaScript puro, sem instalação de pacotes, framework ou backend.

## O que mudou

- Abertura dourada com curva azul-marinho e o Copero explorador.
- Apresentação da região em fundo claro, com tipografia e hierarquia da série.
- Partida com dois painéis, placar compacto, marcadores próprios e sinalização do tempo.
- Celular com alternância entre Paisagem 360° e Meu palpite.
- Resultado com distância, pontos da rodada, total acumulado e pose de celebração quando a rodada rende pelo menos 4.000 pontos.
- Comparação entre o palpite e o local real em um mapa amplo.
- Ajuda por diálogo, foco de teclado e suporte à preferência por menos animações.
- Leaflet, fonte e imagens incluídos localmente. Sem Tailwind ou Lucide por CDN.

## Mapas e conexão

O mapa principal agora é **Ruas e lugares**, com dados OpenStreetMap distribuídos pelo OpenFreeMap. Ao ampliar, ele mostra ruas nomeadas, referências de rodovias, construções, números, bairros, aeroportos e pontos de interesse quando esses dados estão cadastrados. O máximo é zoom 20. Após marcar, **Aproximar meu palpite** leva a câmera ao zoom 18 sobre o próprio palpite, preservando um zoom maior já escolhido. O botão não usa a posição da resposta. A escala em metros ajuda no ajuste fino; outro clique muda a marcação.

O desenho usa Leaflet e Protomaps Leaflet 5.1.0 em Canvas 2D. Funciona sem WebGL e mantém o projeto em HTML, CSS e JavaScript puro, sem framework, instalação de pacotes ou backend. A biblioteca e sua licença BSD estão incluídas em `assets/vendor/protomaps`. As regras de desenho ficam no arquivo `mapa-ruas.js`.

A cartografia requer conexão. O jogo carrega o TileJSON oficial `https://tiles.openfreemap.org/planet/latest` para obter a versão atual dos dados e desenha apenas os tiles do enquadramento. Não baixa o país inteiro para uso offline. Os créditos OpenFreeMap, OpenMapTiles e OpenStreetMap permanecem visíveis. A seleção **Estados** oferece a malha simplificada local Natural Earth como alternativa; ela não possui ruas e não substitui os detalhes para um palpite em uma rua.

Falhas da fonte e dos tiles apresentam **Tentar novamente** e **Usar Estados**. Respostas de carregamentos antigos não reativam uma base que o jogador já trocou. Requisições canceladas ao mudar o zoom não são tratadas como falhas da conexão. A troca de base preserva a marcação e a posição da câmera. O total de pontos e o tempo não mudam por trocar a base.

A cobertura de endereços e referências varia conforme os dados cadastrados no OpenStreetMap. Não se promete que todo prédio ou número esteja mapeado, nem precisão topográfica. O mapa detalhado foi observado com nomes de ruas, construções, números e pontos de interesse em São Paulo e Ouro Preto nesta data.

O Street View permanece sendo o iframe original do Google e precisa de internet. Todos os 99 pontos originais foram abertos em uma conferência visual em 27/10/2026. Vinte e quatro retornaram “Street View não disponível” e foram retirados do sorteio. Também foram excluídos cinco interiores comerciais sem boas pistas geográficas e uma sobreposição no MASP. A seleção ativa contém 69 cenários: Norte 12, Nordeste 14, Centro-Oeste 12, Sudeste 15 e Sul 16. Essa é uma observação datada: o Google pode mudar a cobertura ou o panorama escolhido depois.

## Exibição do Street View na rodada

O cabeçalho do iframe que revela endereço e cidade fica fora da área visível do painel. O iframe tem sua altura compensada para manter o rodapé com logo, direitos e links do Google dentro do enquadramento. A opção de tela cheia do iframe foi desabilitada para não revelar novamente o cabeçalho fora desse enquadramento.

Ajuste visual em `style.css`: `.street-frame` usa `overflow: hidden` e a variável `--street-header-cut: 120px`; `#sv-iframe` é deslocado para cima e tem a altura compensada. Em `index.html`, o iframe não contém `allowfullscreen` e declara `allow="fullscreen 'none'"`.

Essa é uma correção de apresentação: não remove as coordenadas da página nem o conteúdo original do iframe. Rótulos de ruas gerados pelo Google e placas presentes no cenário podem continuar aparecendo. Não descreva essa versão como proteção contra inspeção do código ou contra todas as formas de consulta ao local.

## Melhorias nas rodadas

- Região calculada pela UF do cenário: Salvador/BA e Carolina/MA agora estão no Nordeste.
- Nomes ajustados à cena conferida; referências não confirmadas de atrações foram substituídas pela cidade. O embed escolhe o panorama próximo da coordenada, não necessariamente o monumento que constava no nome original.
- **Trocar local** está sempre disponível na paisagem durante a rodada. Sorteia outro cenário na mesma região, limpa marcações, reinicia os 120 segundos e preserva o total. Não repete imediatamente o último cenário nem na renovação do ciclo. Não é uma rodada pontuada.
- Indicador durante a abertura do iframe, com orientação após 12 segundos se o documento não responder. O evento `load` não prova que o Google encontrou um panorama: o conteúdo é de outra origem, portanto a troca manual continua disponível após o carregamento. Não foi implementada detecção automática da mensagem interna do Google.
- Resultado com cidade, estado, região, distância e uma descoberta sobre a região/capital, além de curiosidades específicas para Teatro Amazonas e Ouro Preto. A fonte abre em outra aba.
- Reação do Copero conforme os pontos: celebração a partir de 4.000, bússola de 1.500 a 3.999 e acolhimento abaixo disso, com mensagem encorajadora. Animação curta ao revelar o resultado, desativada quando o dispositivo pede menos movimento.
- O histórico dos 99 pontos, com inclusão/exclusão e correções, está em `REVISAO_LOCAIS.csv`.

## Regras preservadas

As cinco regiões e a fórmula de pontuação foram preservadas. O catálogo foi revisado conforme descrito acima. Há 2 minutos por rodada; os locais não se repetem dentro de uma região até sua lista se esgotar; até 50 metros rende 5.000 pontos; acima de 3.000 km rende zero. O total continua acumulado na sessão e é reiniciado ao recarregar a página.

A confirmação fica disponível depois da marcação. O fim do tempo revela o resultado mesmo sem palpite. Sair da partida interrompe o cronômetro. A câmera do mapa se adapta ao tamanho do painel.

As coordenadas dos cenários mantidos continuam sendo as referências do original. Foram corrigidos o agrupamento regional e os nomes incompatíveis com a cena observada. A validação territorial do palpite ainda usa o retângulo de limites do original, não o contorno exato do país. A revisão não equivale a uma medição topográfica nem garante disponibilidade futura do fornecedor.

## Arquivos para manutenção

- `index.html`: estrutura e textos das telas.
- `style.css`: cores, composição e responsividade.
- `interface.js`: navegação visual e ajuda.
- `locais.js`: catálogo ativo, UFs, capitais e conteúdo educativo.
- `mapa-ruas.js`: fonte, ruas, construções, rótulos e pontos de interesse.
- `script.js`: sorteio, seleção de bases, tempo, troca de cenário e regras.
- `REVISAO_LOCAIS.csv`: conferência datada dos 99 pontos originais.
- `assets`: mascotes, fonte, biblioteca e malha local.
- `tests`: verificação das regras e dos fluxos sem rede.

Execute `node tests/verificar.cjs` para repetir as verificações. Veja `VALIDACAO.md` para o escopo do teste.

## Fontes e licenças

- Leaflet 1.9.4: https://leafletjs.com/ ; licença incluída em `assets/vendor/leaflet/LICENSE.txt`.
- Malha: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_1_states_provinces.geojson . Foram mantidas as 27 feições do Brasil e reduzidas apenas as propriedades textuais.
- Natural Earth: https://www.naturalearthdata.com/about/terms-of-use/ .
- OpenStreetMap: https://www.openstreetmap.org/copyright .
- OpenFreeMap: https://openfreemap.org/quick_start/ ; dados do esquema OpenMapTiles.
- Protomaps Leaflet: https://github.com/protomaps/protomaps-leaflet ; versão 5.1.0, licença em `assets/vendor/protomaps/LICENSE`. O projeto está em manutenção e foi escolhido como renderizador Canvas para a base Leaflet existente.
- Google Street View: iframe e controles originais do serviço, sem ocultação dos créditos.
- Fonte: a mesma do pacote Detetive Brasil; licença em `assets/fonts/LICENCA.txt`.

## Fontes do conteúdo educativo

- IBGE Educa, Divisão territorial: https://educa.ibge.gov.br/criancas/brasil/2850-nosso-territorio/19637-divisao-territorial.html (regiões, estados e capitais).
- Prefeitura de Manaus: https://www.manaus.am.gov.br/turismo/o-que-ver-e-fazer-em-manaus/ (Teatro Amazonas).
- Iphan: https://www.gov.br/iphan/pt-br/assuntos/noticias/ouro-preto-mg-celebra-45-anos-como-patrimonio-mundial-da-humanidade (Ouro Preto).

As informações educativas são reveladas somente na tela de resultado. Não são descrições automáticas geradas a partir de uma imagem.
