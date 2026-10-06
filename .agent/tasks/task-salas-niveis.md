# Plano de Implementação: Turmas Múltiplas e Sistema de Títulos/Níveis

## Visão Geral
Refatorar a estrutura do Aluno para suportar múltiplas turmas simultâneas e introduzir um sistema de progressão gamificado onde o XP desbloqueia cosméticos (títulos, cores de nome e bordas de perfil).

## Fase 1: Backend & Banco de Dados
- **Múltiplas Turmas:**
  - Atualizar a coleção `alunos` para substituir `turmaId` (string única) por um array `turmas` (lista de IDs).
  - Criar/Atualizar endpoints de Turma (`GET /api/turmas/aluno`) para retornar a lista de turmas em que o aluno está matriculado.
  - Atualizar o endpoint de "Entrar em Turma" para dar *append* no array em vez de sobrescrever.
- **Cosméticos & Níveis:**
  - Criar um catálogo de recompensas no backend (ou config local) relacionando Níveis -> Recompensas (ex: Nível 5 = Borda Ouro, Título "Explorador").
  - Adicionar campos no perfil do Aluno (`tituloAtual`, `bordaAtual`, `corAtual`).
  - Endpoint para "Equipar" cosmético (`POST /api/perfil/equipar`).

## Fase 2: Interface de Turmas (Nova Página)
- **Página `aluno/turmas.html`:**
  - Seguir a identidade visual (Sidebar + Header).
  - Grid de cards mostrando as turmas em que o aluno está.
  - Botão/Modal de "Entrar em nova turma" (código convite).
  - Cada card mostra o progresso do aluno especificamente naquela turma (se aplicável) e o nome do Professor.
- **Navegação:** Adicionar a página ao `sidebar.js` sob a seção "Aprender" ou "Comunidade".

## Fase 3: Interface de Níveis e Cosméticos (Nova Página)
- **Página `aluno/niveis.html`:**
  - Interface gamificada.
  - Exibição do Nível atual, XP atual e barra de progresso para o próximo nível.
  - Vitrine de Recompensas: Lista de Títulos, Bordas e Cores desbloqueadas e bloqueadas (com cadeado e requisito de nível).
  - Botões para "Equipar" o cosmético selecionado.
- **Renderização Global:**
  - Atualizar `ui.js` e o header padrão para renderizar a `bordaAtual` em volta da foto do avatar e exibir o `tituloAtual` onde o nome do usuário for exibido.

## Fase 4: Testes e Validação
- Testar matrícula em 2 turmas diferentes usando código de convite.
- Testar se os pontos de XP acumulados refletem no desbloqueio automático de cosméticos na página de níveis.
- Testar persistência do cosmético equipado após F5.
