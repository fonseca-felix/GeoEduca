const { db } = require('./firebase/firebase-admin');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const professoresRef = db.collection('professores');
        
        // Verificar se já existe a jesiane
        const snapshot = await professoresRef.where('email', '==', 'jesiane').get();
        const hashedPassword = await bcrypt.hash('prof@jesi', 10);
        
        if (!snapshot.empty) {
            // Atualiza a senha se já existir
            const docId = snapshot.docs[0].id;
            await professoresRef.doc(docId).update({
                senha: hashedPassword,
                nome: 'Jesiane'
            });
            console.log('✅ Conta de admin (jesiane) atualizada com sucesso!');
        } else {
            // Cria nova
            await professoresRef.add({
                nome: 'Jesiane',
                email: 'jesiane',
                senha: hashedPassword,
                tipo: 'prof',
                createdAt: new Date().toISOString()
            });
            console.log('✅ Conta de admin (jesiane) criada com sucesso!');
        }
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

createAdmin();
