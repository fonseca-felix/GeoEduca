const express = require('express');
// csrfProtection import removido; não é necessário aqui
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const { generateCsrfToken } = require('./middleware/csrf');

// Middlewares
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
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
const detetivedRoutes = require('./src/routes/detetive');
const bancoProvasRoutes = require('./src/routes/banco_provas');
const masterRoutes = require('./src/routes/master');
const escolaRoutes = require('./src/routes/escola');

// Rotas de CSRF
const loginRoutes = require('./src/routes/login');
app.get('/api/csrf-token', generateCsrfToken);
app.use('/api/auth', authRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/alunos', alunoRoutes);
app.use('/api/salas', salaRoutes);
app.use('/api/atividades', atividadeRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/provas', provaRoutes);
app.use('/api/jogos', jogoRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/estudos', estudoRoutes);
app.use('/api/detetive', detetivedRoutes);
app.use('/api/banco_provas', bancoProvasRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/escola', escolaRoutes);

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

// Iniciar servidor
async function startServer() {
    console.log(`📡 Supabase PG conectando...`);
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`📝 API e Frontend disponíveis em http://localhost:${PORT}`);
    });
}

startServer();



