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

module.exports = { getAlunoDocsByIds, normalizeAlunoIds };
