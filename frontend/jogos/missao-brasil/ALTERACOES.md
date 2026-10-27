# Arquivos da reformulação

O visual segue a opção azul e dourada aprovada. O Copero usa as imagens originais e a primeira comemoração aprovada. A abertura e o resultado usam a comemoração em resolução maior; os avatares e as reações durante o jogo preservam os arquivos originais.

## Alterados

- `README.md`
- `VALIDACAO.md`
- `assets/celebracao/bone.webp`
- `assets/celebracao/brasa.webp`
- `assets/celebracao/classic.webp`
- `assets/celebracao/escot.webp`
- `assets/celebracao/maloka.webp`
- `assets/celebracao/terno.webp`
- `index.html`
- `package-lock.json`
- `package.json`
- `script.js`

## Acrescentados

- `ALTERACOES.md`
- `assets/brand-brasil.svg`
- `assets/fonts/LICENCA.txt`
- `assets/fonts/titulo.woff`
- `interface.css`
- `tests/verify.cjs`

## Testes

Os testes anteriores de layout e smoke dependiam do mapa e dos controles da interface substituída. Foram substituídos por `tests/verify.cjs`, sem dependências, e por verificação visual no navegador. As regras do jogo foram preservadas.

## Preservados

Base geográfica, bandeiras, imagens de biomas, 24 expressões originais dos personagens, biblioteca GSAP, chaves de progresso/ranking, cálculo de acertos, XP, sequência e coleção. Os estilos antigos continuam no pacote como referência, mas só `interface.css` é carregado pela nova página.
