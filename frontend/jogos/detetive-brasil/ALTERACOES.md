# Alterações

## Enquadramento e carregamento · 23/10/2026

- Ajustado o enquadramento das poses no resultado, exibindo os dois braços no desktop e centralizando a imagem no celular.
- WebP sem perdas nas três poses: mesma resolução e mesmos pixels RGBA; redução total de 32,3% em relação aos PNGs.
- Pré-carregamento da imagem de abertura; originais PNG preservados.

## Remoção da faixa superior · 23/10/2026

- Removida a faixa de demonstração do topo e o espaço de 26 px que ela reservava.

## Atualização dos mascotes · 23/10/2026

- Aplicadas exatamente as três últimas imagens escolhidas: lupa, comemoração e pata estendida.
- Mantidos o rosto, as expressões, os gestos e o figurino dessas imagens. PNGs exportados em 1920 × 1920 px com transparência.
- Atualizados a capa, o cabeçalho, o resumo, os diálogos, os feedbacks de viagem e as telas finais.

## Implementação anterior

- Aplicação das telas aprovadas: capa, carregamento, resumo, investigação, diálogo, caderneta, aeroporto, feedback de viagem, último estado e resultados de vitória/derrota.
- Mesma paleta e tipografia da série; Copero de terno original nas poses neutra e de comemoração.
- Uso dos mapas locais do GeoBr e remoção da dependência de fontes e ícones externos.
- Caderneta organizada por estados com pistas coletadas; releitura sem nova cobrança.
- Busca e filtros por região, destino selecionado explicitamente antes do embarque.
- Regras de horas e pontuação, autenticação e contrato das duas APIs mantidos.
- Correções de ícones exibidos como texto HTML, guardas contra cliques duplicados e captura antecipada, cancelamento de respostas antigas, mensagens de erro seguras e estados de falha de carregamento/registro.
- Demonstração independente explicitamente identificada, sem chamadas à API e sem ranking.
- Testes reproduzíveis e instruções de integração incluídos.
