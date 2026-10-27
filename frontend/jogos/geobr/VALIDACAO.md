# Validação · GeoBr

Data: 23/10/2026.

## Automática

`node tests/check.cjs`: 72 verificações aprovadas, com DOM e relógio simulados. Abrangem validação do nome, seis personagens, transição de telas, pontuação, vidas, erros, dicas, progresso, encerramento, ranking e reinício. No GeoBr, incluem fim por tempo, filtro regional, mapas e biomas. No GeoMundo, incluem uma jornada completa de 35 acertos nas sete etapas, bônus, renovação das vidas e proteção contra ranking duplicado.

Sintaxe JavaScript verificada com `node --check`. Referências locais do HTML e IDs únicos verificados. As 24 expressões dos personagens são idênticas às originais. Os bancos geográficos originais foram mantidos.

## Navegador

Chrome em ambiente de teste, com largura de notebook de 1280 px e/ou janela de 1363 px; formato de celular de 390 × 844 px. Conferidas abertura, preparação, nome obrigatório, seleção, quiz, alternativas, feedback e navegação. Sem rolagem horizontal nas telas conferidas. Em telas menores, o conteúdo pode ter rolagem vertical.

GeoBr: partida de três perguntas no celular com dica, resposta, avanço, tempo esgotado e resultado (1 acerto, 33%, 16 XP); abertura dos modos Capitais e Biomas.
GeoMundo: cinco acertos reais no navegador, etapa concluída com 650 XP e passagem para América do Norte; mapa vetorial local, zoom, marcação da descoberta, quiz e erro no formato de celular.

## Limites

A simulação não substitui teste em todos os aparelhos. Não foi feito teste em um celular físico ou em Safari. O ranking permanece local ao navegador. Não houve revisão pedagógica das perguntas originais.
