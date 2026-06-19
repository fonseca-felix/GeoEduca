const admin = require('firebase-admin');
const serviceAccount = require('./geo-mundo-c3b24-firebase-adminsdk-fbsvc-eb43e50248.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
}
const db = admin.firestore();

const novasSalas = [
    { nome: '6º Ano A', serie: '6º', turma: 'A', assunto: 'Fundamentos Geográficos' },
    { nome: '6º Ano B', serie: '6º', turma: 'B', assunto: 'Fundamentos Geográficos' },
    { nome: '7º Ano A', serie: '7º', turma: 'A', assunto: 'Cartografia Básica' },
    { nome: '7º Ano B', serie: '7º', turma: 'B', assunto: 'Cartografia Básica' },
    { nome: '8º Ano A', serie: '8º', turma: 'A', assunto: 'Geografia do Brasil' },
    { nome: '8º Ano B', serie: '8º', turma: 'B', assunto: 'Geografia do Brasil' },
    { nome: '9º Ano A', serie: '9º', turma: 'A', assunto: 'Geopolítica Mundial' },
    { nome: '9º Ano B', serie: '9º', turma: 'B', assunto: 'Geopolítica Mundial' },
    { nome: '1ª Série A', serie: '1º Médio', turma: 'A', assunto: 'Espaço Geográfico' },
    { nome: '1ª Série B', serie: '1º Médio', turma: 'B', assunto: 'Espaço Geográfico' },
    { nome: '2ª Série A', serie: '2º Médio', turma: 'A', assunto: 'Geografia Física' },
    { nome: '2ª Série B', serie: '2º Médio', turma: 'B', assunto: 'Geografia Física' },
    { nome: '3ª Série A', serie: '3º Médio', turma: 'A', assunto: 'Revisão Geral e Atualidades' },
    { nome: '3ª Série B', serie: '3º Médio', turma: 'B', assunto: 'Revisão Geral e Atualidades' }
];

async function seedSalas() {
    try {
        console.log('Deletando alunos existentes...');
        const alunosSnap = await db.collection('alunos').get();
        for (const doc of alunosSnap.docs) {
            await doc.ref.delete();
        }

        console.log('Deletando salas existentes...');
        const salasSnap = await db.collection('salas').get();
        for (const doc of salasSnap.docs) {
            await doc.ref.delete();
        }

        console.log('Inserindo 14 novas salas...');
        for (const sala of novasSalas) {
            await db.collection('salas').add({
                nome: sala.nome,
                serie: sala.serie,
                turma: sala.turma,
                assunto: sala.assunto,
                createdAt: new Date().toISOString()
            });
        }
        
        console.log('✅ Seeding completo!');
        process.exit(0);
    } catch (e) {
        console.error('Erro no seeding:', e);
        process.exit(1);
    }
}

seedSalas();
