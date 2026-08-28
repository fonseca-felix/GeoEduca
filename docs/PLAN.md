# Atualização da Página de Login com Parallax (GSAP)

## Contexto
O usuário forneceu um vídeo (`login.novo.mp4`) demonstrando uma nova interface de login usando **Scrollytelling / Parallax**. O objetivo é transformar o `index.html` (que era split-screen) em uma página única que rola, com um globo terrestre fixo ao fundo que se move dependendo da posição do scroll, passando pelas seções Hero -> Features -> Login.

## Tarefas (Frontend)
- [ ] 1. Atualizar o `index.html` para incluir as bibliotecas GSAP (`gsap.min.js`, `ScrollTrigger.min.js`).
- [ ] 2. Reestruturar o `index.html` removendo a divisão `.login-left` e `.login-right`.
- [ ] 3. Criar a estrutura base: `div.bg-fixed` (com canvas de estrelas e globo) e `main.scroll-content` (com `<section>` para Hero, Features, Login).
- [ ] 4. Ocultar e animar as sections usando GSAP `ScrollTrigger` com pin/scrub.
- [ ] 5. Mover a lógica atual e o formulário de login intactos para a última section (`.sec-login`).
- [ ] 6. Atualizar o `css/login.css` para aplicar o estilo Brutalist/Dark (fundo escuro, tipografia massiva, botões dourados/primary) e fazer os layouts da section em flex/grid centralizados.
- [ ] 7. Preservar o script de Auth e o canvas de background original (modificado para estrelas simples ou usando o que já tem).

## Projeto
Tipo: WEB.
Agentes envolvidos: `frontend-specialist`.
