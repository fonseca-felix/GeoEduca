const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Inicializar Firebase Admin
try {
    if (!admin.apps.length) {
        let serviceAccount;
        if (process.env.FIREBASE_CREDENTIALS) {
            serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
        } else {
            // Fallback for local development
            try {
                serviceAccount = require('../geo-mundo-c3b24-firebase-adminsdk-fbsvc-eb43e50248.json');
            } catch (e) {
                console.warn('⚠️ ATENÇÃO: Arquivo de credenciais do Firebase não encontrado.');
                console.warn('⚠️ O banco de dados NÃO VAI FUNCIONAR até que você coloque o arquivo JSON na raiz do backend ou configure o .env.');
            }
        }
        
        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
        }
    }
} catch (error) {
    console.error('❌ Erro crítico ao inicializar o Firebase:', error);
}

// Export mock objects if admin is not initialized so the server doesn't crash completely
const db = admin.apps.length ? admin.firestore() : {
    collection: () => ({
        doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }), set: async () => {}, update: async () => {} }),
        where: () => ({ get: async () => ({ empty: true, forEach: () => {} }) }),
        add: async () => ({ id: 'mock-id' }),
        get: async () => ({ empty: true, forEach: () => {} })
    })
};

const auth = admin.apps.length ? admin.auth() : {
    verifyIdToken: async () => ({ uid: 'mock-user-id' })
};

module.exports = { admin, db, auth };
