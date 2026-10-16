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

const rawDb = admin.apps.length ? admin.firestore() : {
    collection: () => ({
        doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }), set: async () => {}, update: async () => {}, delete: async () => {} }),
        where: () => ({ get: async () => ({ empty: true, size: 0, docs: [], forEach: () => {} }) }),
        add: async () => ({ id: 'mock-id' }),
        get: async () => ({ empty: true, size: 0, docs: [], forEach: () => {} })
    }),
    batch: () => ({ update: () => {}, set: () => {}, delete: () => {}, commit: async () => {} })
};

// ============================================================================
// Camada de Cache em Memória com Deduplicação e Invalidação Automática
// Reduz drasticamente o consumo de leituras diárias da cota gratuita do Firestore
// ============================================================================
const CACHE_TTL_MS = 120 * 1000; // 2 minutos de cache para leituras repetidas
const collectionCaches = new Map(); // collectionName -> Map(cacheKey -> { value, expiresAt })
const inFlightQueries = new Map();  // globalKey -> Promise

function getColCache(colName) {
    if (!collectionCaches.has(colName)) {
        collectionCaches.set(colName, new Map());
    }
    return collectionCaches.get(colName);
}

function invalidateCollection(colName) {
    if (collectionCaches.has(colName)) {
        collectionCaches.get(colName).clear();
    }
}

function invalidateAllCollections() {
    for (const cache of collectionCaches.values()) {
        cache.clear();
    }
}

function getCached(colName, key) {
    const colCache = collectionCaches.get(colName);
    if (!colCache) return null;
    const entry = colCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        colCache.delete(key);
        return null;
    }
    return entry.value;
}

function setCached(colName, key, value, ttl = CACHE_TTL_MS) {
    const colCache = getColCache(colName);
    colCache.set(key, { value, expiresAt: Date.now() + ttl });
}

function fetchWithCache(colName, key, fetcher, onSuccess) {
    const cached = getCached(colName, key);
    if (cached !== null) {
        return Promise.resolve(cached);
    }

    const globalKey = `${colName}::${key}`;
    if (inFlightQueries.has(globalKey)) {
        return inFlightQueries.get(globalKey);
    }

    const promise = fetcher()
        .then(result => {
            setCached(colName, key, result);
            if (onSuccess) onSuccess(result);
            inFlightQueries.delete(globalKey);
            return result;
        })
        .catch(err => {
            inFlightQueries.delete(globalKey);
            throw err;
        });

    inFlightQueries.set(globalKey, promise);
    return promise;
}

function wrapQuery(colName, realQuery, ops = []) {
    return {
        where(field, op, val) {
            return wrapQuery(colName, realQuery.where(field, op, val), [...ops, ['w', field, op, val]]);
        },
        orderBy(field, dir = 'asc') {
            return wrapQuery(colName, realQuery.orderBy(field, dir), [...ops, ['o', field, dir]]);
        },
        limit(n) {
            return wrapQuery(colName, realQuery.limit(n), [...ops, ['l', n]]);
        },
        get() {
            const key = ops.length === 0 ? 'query:ALL' : `query:${JSON.stringify(ops)}`;
            return fetchWithCache(
                colName,
                key,
                () => realQuery.get(),
                (snap) => {
                    // Aproveita os documentos já lidos na query para popular o cache individual de .doc(id)
                    if (snap && Array.isArray(snap.docs)) {
                        for (const docSnap of snap.docs) {
                            if (docSnap && docSnap.id) {
                                setCached(colName, `doc:${docSnap.id}`, docSnap);
                            }
                        }
                    }
                }
            );
        }
    };
}

function wrapDocRef(colName, realDocRef, docId) {
    return new Proxy(realDocRef, {
        get(target, prop, receiver) {
            if (prop === 'get') {
                return () => {
                    const id = docId || target.id;
                    return fetchWithCache(colName, `doc:${id}`, () => target.get());
                };
            }
            if (prop === 'set' || prop === 'update' || prop === 'delete') {
                return async (...args) => {
                    const res = await target[prop](...args);
                    invalidateCollection(colName);
                    return res;
                };
            }
            const val = Reflect.get(target, prop, receiver);
            return typeof val === 'function' ? val.bind(target) : val;
        }
    });
}

const db = new Proxy(rawDb, {
    get(target, prop, receiver) {
        if (prop === 'collection') {
            return (colName) => {
                const realCol = target.collection(colName);
                const queryWrapper = wrapQuery(colName, realCol, []);
                return new Proxy(realCol, {
                    get(colTarget, colProp, colReceiver) {
                        if (colProp === 'get' || colProp === 'where' || colProp === 'orderBy' || colProp === 'limit') {
                            return queryWrapper[colProp].bind(queryWrapper);
                        }
                        if (colProp === 'doc') {
                            return (...args) => {
                                const realDoc = colTarget.doc(...args);
                                return wrapDocRef(colName, realDoc, args[0]);
                            };
                        }
                        if (colProp === 'add') {
                            return async (...args) => {
                                const res = await colTarget.add(...args);
                                invalidateCollection(colName);
                                return res;
                            };
                        }
                        const val = Reflect.get(colTarget, colProp, colReceiver);
                        return typeof val === 'function' ? val.bind(colTarget) : val;
                    }
                });
            };
        }
        if (prop === 'batch') {
            return () => {
                const realBatch = target.batch();
                return new Proxy(realBatch, {
                    get(batchTarget, batchProp, batchReceiver) {
                        if (batchProp === 'commit') {
                            return async (...args) => {
                                const res = await batchTarget.commit(...args);
                                invalidateAllCollections();
                                return res;
                            };
                        }
                        const val = Reflect.get(batchTarget, batchProp, batchReceiver);
                        return typeof val === 'function' ? val.bind(batchTarget) : val;
                    }
                });
            };
        }
        const val = Reflect.get(target, prop, receiver);
        return typeof val === 'function' ? val.bind(target) : val;
    }
});

const auth = admin.apps.length ? admin.auth() : {
    verifyIdToken: async () => ({ uid: 'mock-user-id' })
};

module.exports = { admin, db, auth, invalidateCollection, invalidateAllCollections };
