# Validação da reformulação

## Código e regras

`npm test`: **262 verificações aprovadas**. Executa o `script.js` e o `data.js` reais em um DOM simulado com relógio controlado, sem depender de internet ou pacotes externos. Cobertura: IDs e vínculos HTML/JS, arquivos locais, 27 entradas, seis avatares e 24 expressões, exigência de nome, modalidade e região, alternativas distintas, resposta correta/incorreta, bloqueio de resposta duplicada, tempo esgotado, avanço automático, XP da sessão, precisão, resultado, replay, cancelamento de timers ao sair, coleção, perfil e persistência nas chaves anteriores.

`node --check script.js` e `node --check data.js`: aprovados.

A comparação SHA-256 confirmou que `data.js` e as 24 imagens originais de expressões em `assets/personagens/` são idênticos aos da versão recebida. As bandeiras, fotos de biomas e o GSAP local também foram preservados.

## Navegador real

Conferência no Chrome, com as larguras e alturas abaixo reproduzidas em um quadro de teste da página:

- 1366 × 768: abertura e preparação.
- 1280 × 720: preparação, perguntas, resultado, coleção e ranking.
- 390 × 844: abertura e preparação.
- 320 × 568: abertura, preparação e Biomas, incluindo troca de avatar e acerto.

A partida completa de Capitais / Sul teve três acertos, 100% de precisão e 42 XP. O avatar Explorador escolhido apareceu na comemoração final. Também foram conferidos acertos em Bandeiras, exigência do nome, início de Biomas com 27 perguntas, persistência do nome/avatar, saída da partida e acesso ao ranking e à coleção.

As telas principais verificadas em notebook não apresentaram rolagem da página. Celulares usam rolagem vertical quando necessária; nas dimensões verificadas não houve rolagem horizontal. Foi corrigido o contraste de Opções na abertura móvel e a separação entre o botão e a área azul em telas baixas.

Não foram observados erros de aplicação nos registros do navegador durante a conferência final. O teste visual foi realizado no Chrome; não foi feita uma matriz de navegadores ou teste em aparelho físico.

## Entrega

O ZIP contém o jogo completo. Não contém dados dos jogadores de teste, servidores de prévia, diretórios de instalação nem a página interna usada para conferir tamanhos. Abra `index.html` ou use Go Live. Para publicar, envie os arquivos da pasta do jogo para a hospedagem.
