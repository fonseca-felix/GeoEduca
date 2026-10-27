# Detetive do Brasil · Copero

Design aprovado implementado em 23/10/2026. HTML, CSS e JavaScript sem dependências externas.

## Testar a demonstração

Abra `index.html` ou `demo.html` depois de extrair toda a pasta. O caso fictício percorre Bahia, Minas Gerais, Rio de Janeiro, São Paulo e Paraná. Não usa login, não gera novos casos pela IA e não envia partidas ao ranking. Para usar servidor local: `python -m http.server 8000`.

## Integrar à plataforma

Copie `detetive-brasil.html`, `detetive-brasil.css`, `detetive-brasil.js` e a pasta `assets/` para a mesma pasta em que o HTML será servido na plataforma. Preserve os caminhos relativos entre esses arquivos. A página integrada não carrega `demo-caso.js` e mantém `data-mode="integrado"`.

O HTML integrado usa o login já existente: lê `geo_token` do navegador e redireciona para `/index.html` se ele estiver ausente. Os links Outros jogos continuam em `aluno/jogos.html`, como no arquivo fornecido.

A integração mantém:

- `POST /api/detetive/novo-caso`, com `Authorization: Bearer <geo_token>`; espera `{ sucesso: true, caso: ... }`.
- `POST /api/detetive/finalizar-partida`, com o mesmo cabeçalho e os campos originais `resultado`, `tempo_jogado_segundos`, `erros_viagem`, `acertos_viagem`, `estados_visitados`.

A estrutura do caso continua contendo `patrimonioRoubado`, `descricaoRoubo`, `criminoso` (`nome`, `apelido`, `descricao`, `motivacao`) e `rota`. Cada etapa da rota contém `estadoAtual`, `nomeEstado`, `proximoEstado`, `ehEstadoFinal` e `npcs` (`nome`, `profissao`, `dica`). O código aceita de uma a cinco etapas coerentes, com UFs válidas. O último estado deve ter `ehEstadoFinal: true`; os demais devem indicar a próxima UF. Não é necessário alterar o formato das rotas documentadas no código original.

## Regras preservadas

O caso começa com 72h, consumidas por ações: conversa nova −2h, viagem correta −8h, viagem errada −12h. Um destino errado mantém a etapa atual. As pistas são salvas automaticamente; reler uma pista não cobra de novo. As próximas etapas só são reveladas conforme o jogador avança. No último estado, aparece Prender suspeito. Chegar a zero horas encerra o caso, inclusive ao viajar corretamente.

A pontuação de vitória é `max(100, 1000 - erros * 80 - minutos_reais)`. Na derrota, é `max(0, viagens_certas * 30)`. O tempo real é separado do saldo fictício de horas. Na demonstração, os pontos só são exibidos nesta tela.

## Arquivos visuais

As três imagens de Copero detetive escolhidas pelo usuário estão em `assets/`, com originais PNG e versões WebP sem perdas, ambas em 1920 × 1920 px com transparência. O jogo carrega as versões WebP; a comparação confirmou os mesmos pixels RGBA nos três arquivos. O total transferido pelas três imagens passou de 8,16 MB para 5,53 MB (redução de 32,3%). As poses, expressões, roupas e cores enviadas foram preservadas; houve somente ajuste de resolução. A pose com lupa aparece na capa, no cabeçalho e no resumo do caso; a comemoração aparece na vitória; a pata estendida aparece nas orientações, nas viagens e ao tentar novamente. Os mapas usam as geometrias já incluídas no GeoBr, com o estado atual destacado. Licença da fonte em `assets/fonts/LICENCA.txt`.

## Validação

Execute `node tests/check.cjs`. São 130 verificações com DOM, relógio e respostas HTTP simulados. A conferência visual foi feita separadamente no navegador. Consulte `VALIDACAO.md`.

O servidor da plataforma não foi fornecido. A integração com a API real e o ranking da plataforma precisa ser conferida no ambiente da plataforma; a demonstração publicada permite avaliar e jogar o fluxo com um caso fictício local.
