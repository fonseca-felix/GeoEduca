# GeoBr · Copero

Versão do design aprovado em 23/10/2026, integrada ao jogo funcional.

## Abrir

Extraia a pasta inteira e abra `index.html`. Para servir localmente, execute `python -m http.server 8000` nesta pasta e acesse `http://localhost:8000`.

## Fluxo

Início → nome, modo, região e personagem → desafio → resultado.

- Modos Bandeiras, Capitais e Biomas; banco original dos 26 estados e do Distrito Federal.
- Três vidas e cinco segundos por pergunta, conforme as regras existentes.
- Dica elimina duas alternativas e pode ser usada uma vez por pergunta.
- Acerto concede 12 XP; erro ou tempo esgotado concede 2 XP e consome uma vida. A pontuação do desafio mantém a regra original de 10 pontos por acerto.
- O resultado mostra acertos, precisão sobre respostas processadas e XP ganho nesta partida.
- Bandeiras, mapas de estados, imagens de biomas, fontes e personagens locais.
- Filtro por região para Bandeiras e Capitais. Biomas mantém o banco nacional original.
- Respostas, dicas, retorno ao início, nova partida, ranking e ajuda disponíveis.

## Personagens e dados

As 24 expressões originais dos seis Coperos foram preservadas byte a byte. As comemorações aprovadas estão em `assets/celebracao`. O layout usa os mesmos tons de azul-marinho, dourado e marfim de Missão Brasil.

O ranking e as preferências são salvos somente neste navegador. Limpar os dados do navegador apaga esses registros. Não há conta de jogador ou sincronização entre dispositivos.

## Desenvolvimento

Não é necessário instalar dependências. A camada visual está em `serie.css` e `interface.css`, com navegação complementar em `interface.js`. Os arquivos `atlas.css` e `atlas.js` antigos do GeoBr são mantidos como referência e não são carregados. No GeoMundo, `atlas.js` mantém a seleção de personagem e a integração do ranking.

Para repetir os testes de regras e navegação com Node.js: `node tests/check.cjs`. O teste usa DOM e relógio simulados; a validação visual foi feita separadamente no navegador. Consulte `VALIDACAO.md`.
