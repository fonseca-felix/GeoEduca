# GeoEduca 🌍

O **GeoEduca** é uma plataforma educacional completa, interativa e voltada para o ensino de Geografia. O sistema foi desenvolvido para facilitar a vida dos professores no gerenciamento de turmas, atividades, quizzes e provas, ao mesmo tempo em que oferece uma experiência de aprendizado dinâmica e gamificada para os alunos.

---

## 🚀 Tecnologias Utilizadas

### Frontend
*   **HTML5, CSS3**: Design construído do zero utilizando variáveis CSS, sem a necessidade de frameworks externos.
*   **JavaScript (Vanilla)**: Lógica de interface, controle de estado, tema Dark Mode e consumo da API (`fetch`).
*   **Design Responsivo e Moderno**: Animações no Canvas, gradientes dinâmicos e UI amigável.

### Backend
*   **Node.js & Express.js**: Criação de uma API RESTful robusta.
*   **Firebase (Firestore)**: Banco de dados NoSQL utilizado para armazenamento de dados em tempo real.
*   **Autenticação JWT (JSON Web Tokens)**: Sistema de login seguro e controle de acesso baseado em rotas para Professores e Alunos.
*   **Segurança (Helmet & Rate Limiting)**: Proteção contra ataques XSS e sobrecarga de requisições.

---

## 📁 Estrutura do Projeto

O repositório está dividido em duas partes principais:

*   `/frontend`: Contém toda a parte visual (páginas `.html`, estilos `.css`, e as funções `.js`).
*   `/backend`: Contém a API do sistema, rotas (`/api/auth`, `/api/quizzes`, etc.), configuração do Firebase e lógica de negócio.

---

## ⚙️ Como executar o projeto localmente

A execução local foi simplificada para facilitar testes durante o desenvolvimento. Siga os passos abaixo:

1. Certifique-se de que você possui o **[Node.js](https://nodejs.org/pt-br)** instalado no seu computador.
2. Abra a pasta raiz do projeto.
3. Dê um duplo clique no arquivo **`iniciar.bat`**.

> **O que o arquivo `iniciar.bat` faz?**
> Ele entra automaticamente na pasta do backend, instala todas as dependências (`npm install`), inicia o servidor Node.js e, logo em seguida, abre o arquivo `index.html` (Frontend) diretamente no seu navegador padrão.

⚠️ **Aviso:** Mantenha a janela preta do terminal do backend aberta enquanto estiver utilizando a plataforma localmente. Para desligar o servidor, basta fechar essa janela.

---

## 🌐 Deploy na Nuvem (Render)

O GeoEduca está configurado para fácil hospedagem. O próprio `server.js` do backend é responsável por servir de forma estática os arquivos do `frontend`. Sendo assim, o deploy pode ser feito de forma unificada (Web Service) no **Render** (ou plataforma similar).

### 🔐 Variáveis de Ambiente necessárias no Deploy:

Caso vá publicar o sistema, certifique-se de configurar as seguintes _Environment Variables_ no seu serviço de hospedagem:

*   `FIREBASE_CREDENTIALS`: String do JSON contendo as chaves do Firebase Admin (Service Account).
*   `JWT_SECRET`: (Opcional) Chave secreta de criptografia para login. Se não for especificada, o sistema utilizará uma chave de _fallback_ segura.
*   `JWT_EXPIRES_IN`: (Opcional) Tempo de expiração da sessão, ex: `7d` (7 dias).

---

## 👥 Perfis de Uso

O sistema possui fluxos de login separados para que cada usuário tenha a experiência correta:

1.  **Professor**: Tem controle total sobre a criação de Salas (Turmas), envio de Atividades, Quizzes, Provas e acompanhamento de estatísticas.
2.  **Aluno**: Possui um painel interativo focado nas tarefas da sua própria sala, recebendo notificações quando há novos exercícios ou avaliações disponíveis.

---

Feito  para transformar o ensino de Geografia!
