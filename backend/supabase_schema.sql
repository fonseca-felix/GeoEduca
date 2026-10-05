-- Script de Criação de Tabelas para Supabase (PostgreSQL)
-- Cole este script no SQL Editor do Supabase e execute.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Escolas
CREATE TABLE escolas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    "criadoEm" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Professores
CREATE TABLE professores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    tipo TEXT DEFAULT 'prof',
    "escolaId" UUID REFERENCES escolas(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "criadoEm" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salas
CREATE TABLE salas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    serie TEXT,
    turma TEXT,
    "profId" UUID REFERENCES professores(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alunos
CREATE TABLE alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rm TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    senha TEXT NOT NULL,
    "salaId" UUID REFERENCES salas(id) ON DELETE CASCADE,
    "salaNome" TEXT,
    "profId" UUID REFERENCES professores(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atividades
CREATE TABLE atividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    imagem TEXT,
    link TEXT,
    descricao TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atividades Enviadas
CREATE TABLE atividades_enviadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "salaId" UUID REFERENCES salas(id) ON DELETE CASCADE,
    "atividadeId" UUID REFERENCES atividades(id) ON DELETE CASCADE,
    "dataLimite" TEXT,
    "professorId" UUID REFERENCES professores(id) ON DELETE CASCADE,
    visualizado BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visualizações Atividades
CREATE TABLE visualizacoes_atividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "atividadeEnviadaId" UUID REFERENCES atividades_enviadas(id) ON DELETE CASCADE,
    "alunoId" UUID REFERENCES alunos(id) ON DELETE CASCADE,
    "dataVisualizacao" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    imagem TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Perguntas
CREATE TABLE quiz_perguntas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "quizId" UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    opcoes JSONB,
    correta TEXT,
    valor NUMERIC
);

-- Quizzes Enviados
CREATE TABLE quizzes_enviados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "quizId" UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    "alunoId" UUID REFERENCES alunos(id) ON DELETE CASCADE,
    "salaId" UUID REFERENCES salas(id) ON DELETE CASCADE,
    "professorId" UUID REFERENCES professores(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provas
CREATE TABLE provas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    imagem TEXT,
    rubrica TEXT,
    "profId" UUID REFERENCES professores(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prova Questoes
CREATE TABLE prova_questoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "provaId" UUID REFERENCES provas(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    tipo TEXT NOT NULL,
    opcoes JSONB,
    correta TEXT,
    valor NUMERIC
);

-- Provas Enviadas
CREATE TABLE provas_enviadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "provaId" UUID REFERENCES provas(id) ON DELETE CASCADE,
    "alunoId" UUID REFERENCES alunos(id) ON DELETE CASCADE,
    "salaId" UUID REFERENCES salas(id) ON DELETE CASCADE,
    "professorId" UUID REFERENCES professores(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notificacoes
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "alunoId" UUID REFERENCES alunos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensagem TEXT,
    tipo TEXT,
    lida BOOLEAN DEFAULT FALSE,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela adicional para os dados administrativos caso precise (Ex: admin_master)
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jogos
CREATE TABLE jogos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "jogoId" UUID REFERENCES jogos(id) ON DELETE CASCADE,
    "alunoId" UUID REFERENCES alunos(id) ON DELETE CASCADE,
    pontuacao NUMERIC,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Respostas
CREATE TABLE quiz_respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "quizId" UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    "alunoId" UUID REFERENCES alunos(id) ON DELETE CASCADE,
    respostas JSONB,
    pontuacao NUMERIC,
    "pontuacaoMaxima" NUMERIC,
    "dataResposta" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prova Respostas
CREATE TABLE prova_respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "provaId" UUID REFERENCES provas(id) ON DELETE CASCADE,
    "alunoId" UUID REFERENCES alunos(id) ON DELETE CASCADE,
    respostas JSONB,
    status TEXT DEFAULT 'pendente',
    "dataEnvio" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nota NUMERIC,
    feedback TEXT,
    "dataCorrecao" TIMESTAMP WITH TIME ZONE
);

