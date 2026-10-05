-- Script de Criação de Tabelas para Supabase (PostgreSQL)
-- Alterado de UUID para TEXT para manter a compatibilidade com os IDs antigos do Firebase Firestore.
-- Cole este script no SQL Editor do Supabase e execute (se você já tiver executado o anterior, apague as tabelas primeiro).

-- Escolas
CREATE TABLE escolas (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    "criadoEm" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Professores
CREATE TABLE professores (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    tipo TEXT DEFAULT 'prof',
    "escolaId" TEXT REFERENCES escolas(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "criadoEm" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salas
CREATE TABLE salas (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    serie TEXT,
    turma TEXT,
    "profId" TEXT REFERENCES professores(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alunos
CREATE TABLE alunos (
    id TEXT PRIMARY KEY,
    rm TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    senha TEXT NOT NULL,
    "salaId" TEXT REFERENCES salas(id) ON DELETE CASCADE,
    "salaNome" TEXT,
    "profId" TEXT REFERENCES professores(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atividades
CREATE TABLE atividades (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    imagem TEXT,
    link TEXT,
    descricao TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atividades Enviadas
CREATE TABLE atividades_enviadas (
    id TEXT PRIMARY KEY,
    "salaId" TEXT REFERENCES salas(id) ON DELETE CASCADE,
    "atividadeId" TEXT REFERENCES atividades(id) ON DELETE CASCADE,
    "dataLimite" TEXT,
    "professorId" TEXT REFERENCES professores(id) ON DELETE CASCADE,
    visualizado BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visualizações Atividades
CREATE TABLE visualizacoes_atividades (
    id TEXT PRIMARY KEY,
    "atividadeEnviadaId" TEXT REFERENCES atividades_enviadas(id) ON DELETE CASCADE,
    "alunoId" TEXT REFERENCES alunos(id) ON DELETE CASCADE,
    "dataVisualizacao" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes
CREATE TABLE quizzes (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    imagem TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Perguntas
CREATE TABLE quiz_perguntas (
    id TEXT PRIMARY KEY,
    "quizId" TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    opcoes JSONB,
    correta TEXT,
    valor NUMERIC
);

-- Quizzes Enviados
CREATE TABLE quizzes_enviados (
    id TEXT PRIMARY KEY,
    "quizId" TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
    "alunoId" TEXT REFERENCES alunos(id) ON DELETE CASCADE,
    "salaId" TEXT REFERENCES salas(id) ON DELETE CASCADE,
    "professorId" TEXT REFERENCES professores(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provas
CREATE TABLE provas (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    imagem TEXT,
    rubrica TEXT,
    "profId" TEXT REFERENCES professores(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prova Questoes
CREATE TABLE prova_questoes (
    id TEXT PRIMARY KEY,
    "provaId" TEXT REFERENCES provas(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    tipo TEXT NOT NULL,
    opcoes JSONB,
    correta TEXT,
    valor NUMERIC
);

-- Provas Enviadas
CREATE TABLE provas_enviadas (
    id TEXT PRIMARY KEY,
    "provaId" TEXT REFERENCES provas(id) ON DELETE CASCADE,
    "alunoId" TEXT REFERENCES alunos(id) ON DELETE CASCADE,
    "salaId" TEXT REFERENCES salas(id) ON DELETE CASCADE,
    "professorId" TEXT REFERENCES professores(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notificacoes
CREATE TABLE notificacoes (
    id TEXT PRIMARY KEY,
    "alunoId" TEXT REFERENCES alunos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensagem TEXT,
    tipo TEXT,
    lida BOOLEAN DEFAULT FALSE,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jogos
CREATE TABLE jogos (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL,
    imagem TEXT,
    link TEXT,
    "pontuacaoMaxima" NUMERIC,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jogo Pontuacoes
CREATE TABLE jogo_pontuacoes (
    id TEXT PRIMARY KEY,
    "jogoId" TEXT REFERENCES jogos(id) ON DELETE CASCADE,
    "alunoId" TEXT REFERENCES alunos(id) ON DELETE CASCADE,
    pontuacao NUMERIC,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Respostas
CREATE TABLE quiz_respostas (
    id TEXT PRIMARY KEY,
    "quizId" TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
    "alunoId" TEXT REFERENCES alunos(id) ON DELETE CASCADE,
    respostas JSONB,
    pontuacao NUMERIC,
    "pontuacaoMaxima" NUMERIC,
    "dataResposta" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prova Respostas
CREATE TABLE prova_respostas (
    id TEXT PRIMARY KEY,
    "provaId" TEXT REFERENCES provas(id) ON DELETE CASCADE,
    "alunoId" TEXT REFERENCES alunos(id) ON DELETE CASCADE,
    respostas JSONB,
    status TEXT DEFAULT 'pendente',
    "dataEnvio" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nota NUMERIC,
    feedback TEXT,
    "dataCorrecao" TIMESTAMP WITH TIME ZONE
);
