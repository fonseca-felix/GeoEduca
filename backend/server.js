const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));
app.use(cors({
    origin: '*',
    credentials: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir o frontend estático (pasta ../frontend)
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Rate limiting
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 1000,
    message: { error: 'Muitas requisições, tente novamente mais tarde' }
});
app.use('/api/', limiter);

// Rotas
const authRoutes = require('./src/routes/auth');
const alunoRoutes = require('./src/routes/alunos');
const salaRoutes = require('./src/routes/salas');
const atividadeRoutes = require('./src/routes/atividades');
const quizRoutes = require('./src/routes/quizzes');
const provaRoutes = require('./src/routes/provas');
const jogoRoutes = require('./src/routes/jogos');
const notificacaoRoutes = require('./src/routes/notificacoes');
const dashboardRoutes = require('./src/routes/dashboard');
const estudoRoutes = require('./src/routes/estudo');

app.use('/api/auth', authRoutes);
app.use('/api/alunos', alunoRoutes);
app.use('/api/salas', salaRoutes);
app.use('/api/atividades', atividadeRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/provas', provaRoutes);
app.use('/api/jogos', jogoRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/estudos', estudoRoutes);

// Rota de teste da API
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'Firebase Firestore' });
});

// Fallback: se a rota não for da API, serve o index.html (evita 'Cannot GET /')
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        res.status(404).json({ error: 'Endpoint não encontrado' });
    }
});

// Inicialização - criar coleções padrão
async function initFirestore() {
    const { db } = require('./firebase/firebase-admin');
    
    // Verificar se já existem dados iniciais
    const professoresRef = db.collection('professores');
    const snapshot = await professoresRef.limit(1).get();
    
    if (snapshot.empty) {
        console.log('📦 Criando dados iniciais...');
        
        // Criar professora padrão
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('123', 10);
        
        const professorRef = await professoresRef.add({
            nome: 'Jesiane',
            email: 'jesi',
            senha: hashedPassword,
            tipo: 'prof',
            createdAt: new Date().toISOString()
        });
        
        // Criar salas padrão
        const salasRef = db.collection('salas');
        const sala6ARef = await salasRef.add({
            nome: '6º Ano A',
            serie: '6º',
            turma: 'A',
            createdAt: new Date().toISOString()
        });
        
        const sala6BRef = await salasRef.add({
            nome: '6º Ano B',
            serie: '6º',
            turma: 'B',
            createdAt: new Date().toISOString()
        });
        
        // Criar aluno padrão
        const alunoPassword = await bcrypt.hash('123', 10);
        const alunosRef = db.collection('alunos');
        const alunoRef = await alunosRef.add({
            rm: 'felix',
            nome: 'Félix Mendes',
            senha: alunoPassword,
            salaId: sala6ARef.id,
            salaNome: '6º Ano A',
            createdAt: new Date().toISOString()
        });
        
        // Criar atividades padrão
        const atividadesRef = db.collection('atividades');
        await atividadesRef.add({
            titulo: 'Biomas Brasileiros',
            tipo: 'infografico',
            imagem: 'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg',
            link: 'https://pt.wikipedia.org/wiki/Biomas_do_Brasil',
            descricao: 'Conheça os principais biomas do Brasil: Amazônia, Cerrado, Caatinga, Mata Atlântica, Pampa e Pantanal.',
            createdAt: new Date().toISOString()
        });
        
        await atividadesRef.add({
            titulo: 'Hidrografia do Brasil',
            tipo: 'video',
            imagem: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg',
            link: 'https://www.youtube.com/embed/0zsXQ2OZ-HU',
            descricao: 'Vídeo explicativo sobre as bacias hidrográficas brasileiras.',
            createdAt: new Date().toISOString()
        });
        
        // Criar quiz padrão
        const quizzesRef = db.collection('quizzes');
        const quizRef = await quizzesRef.add({
            titulo: 'Regiões do Brasil',
            imagem: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
            createdAt: new Date().toISOString()
        });
        
        const perguntasRef = db.collection('quiz_perguntas');
        await perguntasRef.add({
            quizId: quizRef.id,
            texto: 'Qual é a região mais extensa do Brasil?',
            opcoes: ['Norte', 'Nordeste', 'Sudeste', 'Sul'],
            correta: 'Norte',
            valor: 1
        });
        
        await perguntasRef.add({
            quizId: quizRef.id,
            texto: 'Qual bioma é exclusivamente brasileiro?',
            opcoes: ['Amazônia', 'Cerrado', 'Caatinga', 'Pantanal'],
            correta: 'Caatinga',
            valor: 1
        });
        
        // Criar prova padrão
        const provasRef = db.collection('provas');
        const provaRef = await provasRef.add({
            titulo: 'Prova Bimestral - Geografia do Brasil',
            imagem: 'https://images.pexels.com/photos/2387796/pexels-photo-2387796.jpeg',
            rubrica: 'Critérios de avaliação:\n• Clareza e objetividade (0-2 pontos)\n• Uso correto de conceitos geográficos (0-2 pontos)\n• Capacidade de argumentação (0-1 ponto)\nTotal: 5 pontos por questão descritiva',
            createdAt: new Date().toISOString()
        });
        
        const questoesRef = db.collection('prova_questoes');
        await questoesRef.add({
            provaId: provaRef.id,
            texto: 'Explique a importância da Bacia Amazônica para o clima brasileiro.',
            tipo: 'descritiva',
            valor: 5
        });
        
        await questoesRef.add({
            provaId: provaRef.id,
            texto: 'Qual a capital do estado do Amazonas?',
            tipo: 'alternativa',
            opcoes: ['Belém', 'Manaus', 'Porto Velho', 'Rio Branco'],
            correta: 'Manaus',
            valor: 5
        });
        
        // Criar notificações padrão
        const notificacoesRef = db.collection('notificacoes');
        await notificacoesRef.add({
            alunoId: alunoRef.id,
            titulo: 'Nova atividade!',
            mensagem: 'A professora Jesiane adicionou um novo infográfico sobre Biomas Brasileiros.',
            tipo: 'atividade',
            lida: false,
            data: new Date().toISOString()
        });
        
        await notificacoesRef.add({
            alunoId: alunoRef.id,
            titulo: 'Quiz disponível',
            mensagem: "Quiz 'Regiões do Brasil' foi liberado para sua turma. Responda até o final do mês!",
            tipo: 'quiz',
            lida: false,
            data: new Date().toISOString()
        });
        
        await notificacoesRef.add({
            alunoId: alunoRef.id,
            titulo: 'Prova bimestral',
            mensagem: 'Prova de Geografia do Brasil disponível. Prazo de entrega: 30/06/2026.',
            tipo: 'prova',
            lida: false,
            data: new Date().toISOString()
        });
        
        // Criar quizzes e provas enviadas (para o aluno ver somente o que foi liberado)
        const quizzesEnviadosRef = db.collection('quizzes_enviados');
        await quizzesEnviadosRef.doc(`${quizRef.id}_${alunoRef.id}`).set({
            quizId: quizRef.id,
            alunoId: alunoRef.id,
            salaId: sala6ARef.id,
            professorId: professorRef.id,
            createdAt: new Date().toISOString()
        });

        const provasEnviadasRef = db.collection('provas_enviadas');
        await provasEnviadasRef.doc(`${provaRef.id}_${alunoRef.id}`).set({
            provaId: provaRef.id,
            alunoId: alunoRef.id,
            salaId: sala6ARef.id,
            professorId: professorRef.id,
            createdAt: new Date().toISOString()
        });

        // Criar atividades enviadas
        const atividadesEnviadasRef = db.collection('atividades_enviadas');
        await atividadesEnviadasRef.add({
            salaId: sala6ARef.id,
            atividadeId: (await atividadesRef.limit(1).get()).docs[0].id,
            dataLimite: '2026-06-15',
            professorId: professorRef.id,
            visualizado: false,
            createdAt: new Date().toISOString()
        });
        
        console.log('✅ Dados iniciais criados com sucesso!');
    }
}

// Iniciar servidor
async function startServer() {
    try {
        await initFirestore();
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📝 API disponível em http://localhost:${PORT}/api`);
            console.log(`🔥 Firebase Firestore conectado`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
    }
}

startServer();

module.exports = app;
