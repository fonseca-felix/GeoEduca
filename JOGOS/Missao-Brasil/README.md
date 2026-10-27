# Missão Brasil · Azul e dourado

Abra `index.html` no navegador ou use **Go Live** no VS Code. O jogo é HTML, CSS e JavaScript puro: não precisa de instalação, compilação ou servidor de aplicação. Para publicar, envie o conteúdo desta pasta para a pasta pública da hospedagem.

## Visual

Abertura com fundo dourado, curva azul, título e botão Começar. Preparação com nome, modalidade, região e os seis avatares originais. Pergunta em fundo claro com imagem à esquerda e respostas à direita. Resultado azul com três indicadores e a capivara escolhida. No celular, os blocos se empilham e permitem rolagem vertical quando necessário.

A capivara original e suas quatro expressões foram preservadas. A pose de comemoração é a primeira aprovada anteriormente, reutilizada a partir das artes transparentes de 1920 × 1920, codificadas em WebP para o jogo. Não houve redesenho do personagem nesta versão.

## Arquivos

- `index.html`: as quatro telas e os diálogos.
- `interface.css`: todo o visual novo e a adaptação a diferentes telas.
- `script.js`: regras existentes com os vínculos necessários ao novo layout.
- `data.js`: base geográfica original, sem alterações.
- `assets/personagens/`: personagens originais, sem alterações.
- `assets/celebracao/`: comemorações aprovadas em resolução maior.
- `assets/fonts/`: fonte local e licença para o título funcionar sem internet.

Os estilos antigos foram mantidos como referência, mas não são carregados pelo HTML novo. Não misture os links dos estilos antigos com `interface.css`.

## Funcionamento preservado

Bandeiras, capitais, biomas, filtro por região, cinco segundos por resposta, avanço automático após cinco segundos, botão Próxima, pontuação, XP, sequência, ranking local, coleção, conquistas e preferências. Os dados continuam nas chaves de armazenamento existentes. O menu Opções dá acesso às funções secundárias sem ocupar a abertura.

O progresso e o ranking ficam no navegador; não são um banco de dados compartilhado entre dispositivos. A exigência de nome continua ativa. A limpeza local do ranking conserva o mecanismo anterior.

## Verificação

Com Node.js instalado, execute `npm test` ou `node tests/verify.cjs`, sem instalar dependências. O teste executa as regras reais com DOM e relógio simulados. A verificação visual é separada; veja `VALIDACAO.md`.
