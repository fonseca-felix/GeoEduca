# Validação · 23/10/2026

## Enquadramento e imagens otimizadas

- Três imagens WebP sem perdas, 1920 × 1920 px, com os mesmos pixels RGBA dos originais PNG, inclusive o canal de transparência.
- Peso total das imagens carregadas pelo jogo: de 8.157.226 para 5.526.264 bytes, redução de 32,3%. Pré-carregamento da pose usada na abertura.
- 130 verificações automatizadas aprovadas; conferência visual do resultado no Chrome em 1363 × 936 px e em viewports simuladas de 768 × 768, 390 × 844 e 320 × 568 px.
- As partidas de demonstração chegaram à vitória nos quatro tamanhos. Imagens dentro dos limites horizontais; no celular, a pose aparece abaixo do conteúdo, sem sobreposição dos controles.
- Os PNGs originais permanecem no pacote. O teste móvel foi feito por simulação de viewport, sem aparelho físico.

## Remoção da faixa superior

Removidos o elemento da faixa, sua ativação e o espaçamento reservado no CSS. Os modos de demonstração e integração permanecem distintos. As 128 verificações passaram. Conferido no Chrome: faixa ausente, início do jogo e cabeçalho posicionados em 0 px no topo.

## Atualização das três poses escolhidas

- Mantidas as expressões, as roupas e os gestos das três últimas imagens enviadas pelo usuário.
- Conferidos os três PNGs completos: 1920 × 1920 px, RGBA e transparência; cópias de publicação iguais às imagens do pacote escolhido.
- As 128 verificações automatizadas passaram após a atualização das referências.
- Conferência atual no Chrome, em 1363 × 936 px: abertura, resumo, pista com a pata estendida, feedback de viagem e partida completa pelos cinco estados até a vitória com comemoração.
- A API real da plataforma continua fora do ambiente desta demonstração; seus endpoints e campos foram preservados.

## Verificações automatizadas

`node tests/check.cjs`: 128 verificações aprovadas com DOM, relógio e API simulados. Verificados início e reinício, caderneta vazia e preenchida, ausência de revelação de estados futuros, cobrança única por pista, busca sem acentos, filtros, seleção de destino, viagens certas e erradas, captura apenas no último estado, bloqueio de viagens duplicadas, fechamento do diálogo de viagem por Escape, derrota por esgotamento de horas, pontos de vitória e derrota, tempo real separado, envio único de resultado, mesmos endpoints e campos originais, redirecionamento sem token, respostas de API inválidas, mensagens tratadas como texto e descarte de respostas antigas após voltar ao início.

IDs únicos, arquivos locais do HTML, 27 mapas e ausência do caso de demonstração na página integrada também foram verificados. Sintaxe JavaScript conferida com `node --check`.

## Navegador

Chrome em ambiente de teste. Notebook de 1280 × 720 px; formatos de celular de 390 × 844 px e 320 × 568 px. Conferidos capa, resumo, investigação, conversa, caderneta, busca, filtros, seleção, diálogos de viagem e encerramento de caso. No notebook, uma partida completa passou pelos cinco estados com uma viagem errada, pistas coletadas e captura. No celular, verificadas coleta, caderneta, busca sem acentos, cancelamento e confirmação de saída. Sem rolagem horizontal nas telas conferidas. Em celulares e telas baixas, o conteúdo pode ter rolagem vertical.

## Limites

As requisições de integração foram verificadas com respostas HTTP simuladas, sem conectar ao servidor real da plataforma. A demonstração não autentica alunos nem registra ranking. Não foram feitos testes em celular físico, Safari ou testes de carga. O caso local é fictício e serve para avaliação do fluxo; os casos reais continuam vindo da API existente.
