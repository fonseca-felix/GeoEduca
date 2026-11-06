async function getAlunoDocsByIds(db, alunoIds) {
    const result = [];
    for (const alunoId of alunoIds) {
        const alunoDoc = await db.collection('alunos').doc(alunoId).get();
        if (alunoDoc.exists) {
            result.push({ id: alunoDoc.id, ...alunoDoc.data() });
        }
    }
    return result;
}

function normalizeAlunoIds(alunoId, alunoIds) {
    if (Array.isArray(alunoIds) && alunoIds.length > 0) {
        return [...new Set(alunoIds.filter(Boolean))];
    }
    if (alunoId) return [alunoId];
    return [];
}

async function getAlunosBySalaId(db, salaId) {
    if (!salaId) return [];
    const alunosRef = db.collection('alunos');
    const [snap1, snap2] = await Promise.all([
        alunosRef.where('salaId', '==', salaId).get(),
        alunosRef.where('salas', 'array-contains', salaId).get()
    ]);
    const docsMap = new Map();
    snap1.docs.forEach(doc => docsMap.set(doc.id, doc));
    snap2.docs.forEach(doc => docsMap.set(doc.id, doc));
    return Array.from(docsMap.values());
}

async function getAlunoDocsBySalaId(db, salaId) {
    const docs = await getAlunosBySalaId(db, salaId);
    return docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

module.exports = { getAlunoDocsByIds, normalizeAlunoIds, getAlunosBySalaId, getAlunoDocsBySalaId };
