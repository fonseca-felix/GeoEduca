# Validação — 27/10/2026

## Automática

`node tests/verificar.cjs`: 398 verificações passaram.

A fórmula de pontuação continua comparada por SHA-256 com a original. Foram conferidos: 69 cenários ativos, IDs únicos, coordenadas de referência iguais às do banco original, correspondência entre UF e região, Salvador e Carolina no Nordeste, exclusão dos 24 pontos sem panorama, sorteio sem repetição e renovação dos ciclos nas cinco regiões.

O fluxo verifica início e fim do cronômetro, palpite exato, distância, total acumulado, timeout em 120 segundos sem palpite, saída da partida e prevenção de pontuação duplicada. A troca verifica novo cenário na mesma região, reinício em 120 segundos, limpeza do palpite, confirmação desabilitada, manutenção do total, um único cronômetro, foco de teclado, bloqueio após o resultado e ausência de repetição imediata na renovação do ciclo. Também foram conferidos o encerramento do aviso de carregamento, conteúdo e fonte educativos e as três poses por faixa de pontuação.

`node --check` em script.js, locais.js, mapa-ruas.js e interface.js: aprovado. IDs únicos e referências de arquivos locais também conferidos.

Os testes usam DOM e Leaflet simulados. Não certificam serviços de terceiros.

## Conferência dos locais

Os 99 pontos foram abertos em lotes de seis no Chrome, observando os panoramas e a árvore de acessibilidade do iframe. Resultado: 24 sem Street View, cinco cenas comerciais sem boas pistas e uma sobreposição de cenário retiradas. Restam 69 ativos. O histórico completo está em REVISAO_LOCAIS.csv. Rótulos de atrações não confirmadas foram reduzidos à cidade; referências reconhecíveis nas imagens foram mantidas. Os dois pontos em regiões erradas foram realocados conforme sua UF.

Essa disponibilidade foi observada nesta data; o Google pode mudar a cobertura, selecionar outro panorama ou falhar por conexão. O evento load do iframe não permite confirmar que há panorama. A recuperação incluída é manual, por Trocar local.

## Navegador e layout

Chrome, janela de 1363 × 936: início, região, cena real, marcação, troca após marcar um palpite, novo cenário da mesma região, relógio reiniciado, confirmação novamente desabilitada, envio e resultado com curiosidade de Ouro Preto e fonte conferidos. O cabeçalho do Google ficou fora do enquadramento e os créditos permaneceram visíveis.

Simulações em iframes de mesma origem: 390 × 844 e 320 × 568. Foram conferidos: cena real, Trocar local, alternância Paisagem/Meu palpite, marcação, envio, conteúdo educativo, comparação no mapa e reabertura do resultado. Um ajuste de tipografia eliminou a sobreposição do título com o Copero. Ações do resultado e conteúdo visíveis sem rolagem nessas dimensões. As simulações não equivalem a aparelhos físicos.

A mudança do personagem já havia sido conferida: três poses de 1920 × 1920 px, transparência RGBA e WebP sem perdas. Elas foram reaproveitadas, sem gerar outro personagem. A animação respeita prefers-reduced-motion por CSS; não foi realizado teste em dispositivo físico com essa preferência.

## Limites

O provedor de imagens do mapa original foi substituído: agora o detalhamento usa dados vetoriais OpenFreeMap/OpenStreetMap desenhados em Canvas 2D. O mapa de estados continua disponível localmente como alternativa simplificada. O Street View precisa de conexão e é de outra origem. A ocultação do endereço é visual: coordenadas, conteúdo acessível do iframe, rótulos de rua e placas não são uma proteção contra consulta ao local. A validação do palpite usa os limites retangulares do projeto original.

## Pacote

ZIP com fontes, recursos locais, histórico da revisão, instruções e testes. Não inclui Git, credenciais, páginas temporárias de conferência ou duplicação da pasta dist. A integridade do ZIP e a extração real são verificadas antes da entrega.

## Correção do mapa detalhado

Ruas e lugares agora é a base padrão. São desenhados nomes de ruas, referências de rodovias, edifícios, números e pontos de interesse quando presentes nos dados. Aproximar meu palpite usa a coordenada marcada pelo jogador no zoom 18 e preserva zooms mais próximos; limite da câmera em 20 e escala métrica incluída. A implementação final não usa WebGL.

Os testes adicionais verificam base padrão, encerramento do carregamento, falha da fonte, falha de tile propagada pelo adaptador, recuperação, cancelamentos de zoom, troca rápida de base, callbacks antigos, conservação do palpite e aproximação em escala de rua. Canvas e fonte são simulados nesses testes; o conteúdo real foi observado no navegador.

Chrome sem WebGL: mapa real da Avenida Paulista no zoom 18 exibiu nomes de ruas, contornos de edifícios, números e referências como MASP e Parque Siqueira Campos. Ouro Preto exibiu ruas, edifícios, Museu da Inconfidência e outros lugares. Foram usados o mesmo mapa-ruas.js e a mesma biblioteca do jogo, em uma página de conferência temporária. No jogo foram conferidos base padrão, marcação, escala de 50 m ao aproximar, alternância Estados/Ruas e envio ao resultado. Nos tamanhos simulados 390 × 844 e 320 × 568 foram conferidos controles e enquadramento, aproximação, ausência de falso aviso em requisições canceladas e conclusão da partida; em 390 px também foi conferida a troca de base mantendo o palpite.

As páginas temporárias foram retiradas antes de empacotar. Os dados de ruas continuam externos e podem variar em disponibilidade e cobertura. As coordenadas, tempo, fórmula de pontos, seleção de cenários e imagens do Copero não foram alterados nesta correção.
