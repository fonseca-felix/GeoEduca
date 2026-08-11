# GeoEduca — Instruções para IA (CLAUDE.md)

> **Leia este arquivo antes de qualquer resposta técnica.** Ele contém o contexto essencial do projeto e as regras de trabalho.

---

## 🗺️ Sobre o Projeto

**GeoEduca** é uma plataforma educacional de geografia voltada para o ensino básico/médio. Permite que professores criem salas de aula, atribuam atividades e acompanhem o progresso dos alunos através de jogos e quizzes interativos de geografia.

- **Stack**: Node.js (Express) + Firebase Firestore (backend) | HTML/CSS/JS puro (frontend)
- **Autenticação**: JWT + Firebase Auth
- **Upload de arquivos**: Multer
- **IA integrada**: Google Generative AI (`@google/generative-ai`)

---

## 📁 Estrutura do Projeto

```
GeoEduca/
├── backend/
│   ├── server.js          # Ponto de entrada do servidor Express
│   ├── src/               # Rotas, middlewares, controllers
│   ├── firebase/          # Configurações do Firebase (NÃO commitar credenciais)
│   └── uploads/           # Arquivos enviados pelos usuários (ignorado no git)
├── frontend/
│   ├── index.html         # Página principal
│   ├── jogos_geografia.html
│   ├── aluno/             # Páginas do perfil de aluno
│   ├── professor/         # Páginas do perfil de professor
│   ├── css/               # Estilos globais
│   └── js/                # Scripts do frontend
├── repomix.config.json    # Configuração do Repomix (token saver)
├── repomix-output.txt     # Snapshot do codebase gerado pelo Repomix
└── CLAUDE.md              # Este arquivo
```

---

## 🔄 Repomix — Atualização do Contexto

O **Repomix** compacta o codebase em um único arquivo de texto (`repomix-output.txt`), economizando tokens ao enviar contexto para a IA.

### ▶️ Atualizar o snapshot do codebase

Execute este comando na **raiz do projeto** sempre que fizer mudanças significativas:

```bash
# Windows (cmd)
cmd /c "npx repomix"

# macOS / Linux
npx repomix
```

O arquivo `repomix-output.txt` será sobrescrito com o estado atual do código.

### 📌 Quando atualizar

| Situação | Atualizar? |
|----------|-----------|
| Adicionou novo arquivo `.js`, `.html`, `.css` | ✅ Sim |
| Modificou rotas ou controllers | ✅ Sim |
| Mudou estrutura de pastas | ✅ Sim |
| Só mudou variáveis de ambiente (`.env`) | ❌ Não (ignorado) |
| Atualizou `node_modules` | ❌ Não (ignorado) |

### ⚙️ Arquivos ignorados pelo Repomix

- `node_modules/`, `.venv/`, `venv/`
- `uploads/`, `firebase/` (credenciais)
- `*.env`, `*.key`, `*.pem`, `*.cert`
- `dist/`, `build/`, `.next/`, `coverage/`
- `*.log`, `package-lock.json`, `*.min.js`, `*.min.css`

> ⚠️ **NUNCA** envie `repomix-output.txt` contendo dados sensíveis para repositórios públicos.

---

## 🛑 Regras de Desenvolvimento

1. **Variáveis de ambiente**: Sempre usar `.env` — nunca hardcodar credenciais
2. **Firebase credentials**: O arquivo de service account fica em `backend/firebase/` e **jamais** vai para o git
3. **Uploads**: Arquivos em `backend/uploads/` são transientes — não commitar
4. **Segurança**: Todas as rotas autenticadas usam middleware JWT; novos endpoints devem seguir o mesmo padrão

---

## 🚀 Como rodar o projeto

```bash
# Backend
cd backend
npm install
node server.js   # ou: npm run dev (com nodemon)

# Frontend
# Abrir index.html diretamente no browser ou via extensão Live Server
```

---

*Última atualização do CLAUDE.md: 2026-07-31*
