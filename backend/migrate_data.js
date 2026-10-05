require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');

// 1. Verificar credenciais
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('❌ Faltam credenciais do Supabase no .env (SUPABASE_URL, SUPABASE_KEY)');
    process.exit(1);
}

// 2. Inicializar Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 3. Inicializar Firebase
let serviceAccount;
try {
    if (process.env.FIREBASE_CREDENTIALS) {
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } else {
        // Tenta pegar de um arquivo json (coloque o nome correto do seu arquivo)
        serviceAccount = require('./firebase-key.json');
    }
} catch (e) {
    console.error('❌ Falha ao carregar credenciais do Firebase. Verifique FIREBASE_CREDENTIALS no .env ou crie o arquivo firebase-key.json na pasta backend.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 4. Mapeamento de coleções (Ordem importa para evitar problemas de Chaves Estrangeiras)
const collections = [
    'escolas',
    'professores',
    'salas',
    'alunos',
    'atividades',
    'quizzes',
    'provas',
    'jogos',
    'atividades_enviadas',
    'visualizacoes_atividades',
    'quiz_perguntas',
    'quiz_respostas',
    'quizzes_enviados',
    'prova_questoes',
    'prova_respostas',
    'provas_enviadas',
    'notificacoes',
    'jogo_pontuacoes'
];

async function migrateCollection(collectionName) {
    console.log(`\n⏳ Migrando coleção: ${collectionName}...`);
    try {
        const snapshot = await db.collection(collectionName).get();
        if (snapshot.empty) {
            console.log(`   Vazia. Pulando.`);
            return;
        }

        const dataToInsert = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Injetar o ID original do Firestore no dado que vai para o Supabase
            data.id = doc.id;
            dataToInsert.push(data);
        });

        // Inserir os dados no Supabase (fazendo upsert em caso de teste duplo)
        const { error } = await supabase.from(collectionName).upsert(dataToInsert);
        if (error) {
            console.error(`   ❌ Erro no Supabase (${collectionName}):`, error.message);
            console.error(`   Detalhes:`, error.details, error.hint);
        } else {
            console.log(`   ✅ ${dataToInsert.length} documentos migrados em ${collectionName}.`);
        }
    } catch (e) {
        console.error(`   ❌ Erro ao ler do Firestore (${collectionName}):`, e.message);
    }
}

async function run() {
    console.log('🚀 Iniciando migração de dados (Firestore -> Supabase)...');
    for (const col of collections) {
        await migrateCollection(col);
    }
    console.log('\n🎉 Migração finalizada!');
    process.exit(0);
}

run();
