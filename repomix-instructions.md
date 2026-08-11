# Instruções para o Repomix

Este repositório é a plataforma **GeoEduca** — um sistema educacional de geografia para escolas.

## Contexto para IA

Ao analisar este código, considere:

- **Backend**: API REST com Express.js, autenticação JWT, banco de dados Firebase Firestore
- **Frontend**: HTML/CSS/JS puro (sem framework), com foco em UX para estudantes do ensino básico/médio
- **IA integrada**: Rota de geração de conteúdo usando Google Generative AI
- **Upload**: Multer para upload de imagens de mapas e atividades

## O que priorizar na análise

1. Arquivos em `backend/src/` (rotas e lógica de negócio)
2. `backend/server.js` (configuração central da API)
3. Frontend em `frontend/` (interações do usuário)

## O que ignorar

- `firebase/` — credenciais de serviço (não incluídas no snapshot)
- `uploads/` — arquivos binários transientes
- `node_modules/` — dependências externas
