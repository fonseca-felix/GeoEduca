const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Inicializar Firebase Admin
if (!admin.apps.length) {
    let serviceAccount;
    if (process.env.FIREBASE_CREDENTIALS) {
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } else {
        // Fallback for local development
        serviceAccount = require('../geo-mundo-c3b24-firebase-adminsdk-fbsvc-eb43e50248.json');
    }
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
