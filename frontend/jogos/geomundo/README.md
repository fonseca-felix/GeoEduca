# GeoMundo · Copero

Versão do design aprovado em 23/10/2026, integrada ao jogo funcional.

## Abrir

Extraia a pasta inteira e abra `index.html`. Para servir localmente, execute `python -m http.server 8000` nesta pasta e acesse `http://localhost:8000`.

## Fluxo

Início → nome e personagem → perguntas com mapa → resultado da etapa → próxima etapa → conclusão da jornada. Ao perder as três vidas, aparece o resultado da partida.

- Sete etapas: América do Sul, América do Norte, Europa, Ásia, África, Oceania e Mundo.
- Cinco acertos completam cada etapa; as três vidas são renovadas ao avançar.
- Mantidas as regras originais: +100 XP por acerto, −25 XP por erro com mínimo de zero, −15 XP por dica; bônus de sequência de +50 XP no terceiro e +100 XP no quinto acerto.
- Sem cronômetro para responder. Feedback com avanço automático ou botão Continuar.
- Banco original de 300 perguntas e cadastro original de 37 países preservados.
- Mapa vetorial e Leaflet incluídos localmente. Não exige serviço de mapas, chave de API ou conexão para a base cartográfica. Fonte e licença em `data/GEOGRAFIA.md` e `vendor/LICENSE`.
- A base cartográfica é uma representação global simplificada. As descobertas seguem o cadastro de países existente no jogo.
- Na abertura via arquivo, `data/local-data.js` evita a restrição de fetch do navegador. Após editar os JSONs de perguntas/países, execute `python atualizar-banco-local.py` para atualizar essa cópia.

## Personagens e dados

As 24 expressões originais dos seis Coperos foram preservadas byte a byte. As comemorações aprovadas estão em `assets/celebracao`. O layout usa os mesmos tons de azul-marinho, dourado e marfim de Missão Brasil.

O ranking e as preferências são salvos somente neste navegador. Limpar os dados do navegador apaga esses registros. Não há conta de jogador ou sincronização entre dispositivos.

## Desenvolvimento

Não é necessário instalar dependências. A camada visual está em `serie.css` e `interface.css`, com navegação complementar em `interface.js`. Os arquivos `atlas.css` e `atlas.js` antigos do GeoBr são mantidos como referência e não são carregados. No GeoMundo, `atlas.js` mantém a seleção de personagem e a integração do ranking.

Para repetir os testes de regras e navegação com Node.js: `node tests/check.cjs`. O teste usa DOM e relógio simulados; a validação visual foi feita separadamente no navegador. Consulte `VALIDACAO.md`.
