const express = require('express');
const { db } = require('../../firebase/firebase-admin');
const { authenticateToken, requireProfessor, requireAluno } = require('../middleware/auth');
const { gerarCasoDetetive } = require('../services/geminiService');

const router = express.Router();

// Valida estrutura básica do caso gerado pela IA
function validarCaso(caso) {
    if (!caso || typeof caso !== 'object') return false;
    if (!caso.patrimonioRoubado || !caso.criminoso || !caso.rota) return false;
    if (!Array.isArray(caso.rota) || caso.rota.length < 2) return false;
    for (const passo of caso.rota) {
        if (!passo.estadoAtual || !Array.isArray(passo.npcs) || passo.npcs.length === 0) return false;
        for (const npc of passo.npcs) {
            if (!npc.nome || !npc.dica) return false;
        }
    }
    // Garante que o último estado tem ehEstadoFinal = true
    const ultimo = caso.rota[caso.rota.length - 1];
    if (!ultimo.ehEstadoFinal) ultimo.ehEstadoFinal = true;
    if (ultimo.proximoEstado === undefined) ultimo.proximoEstado = null;
    return true;
}

// POST /api/detetive/novo-caso — Gera novo caso via IA
router.post('/novo-caso', authenticateToken, async (req, res) => {
    try {
        const resultado = await gerarCasoDetetive();

        if (!resultado.sucesso) {
            return res.status(503).json({
                sucesso: false,
                error: resultado.erro || 'A IA não conseguiu gerar o caso. Tente novamente.'
            });
        }

        if (!validarCaso(resultado.dados)) {
            console.warn('⚠️ Caso inválido recebido da IA:', JSON.stringify(resultado.dados).substring(0, 200));
            return res.status(422).json({
                sucesso: false,
                error: 'A IA retornou um caso incompleto. Tente novamente em alguns segundos.'
            });
        }

        res.json({ sucesso: true, caso: resultado.dados });
    } catch (error) {
        console.error('❌ Erro ao gerar caso detetive:', error);
        res.status(500).json({ sucesso: false, error: 'Erro interno ao gerar caso.' });
    }
});

// POST /api/detetive/finalizar-partida — Salva resultado da partida
router.post('/finalizar-partida', authenticateToken, requireAluno, async (req, res) => {
    try {
        const alunoId = req.user.id;
        const { resultado, tempo_jogado_segundos, erros_viagem, acertos_viagem, estados_visitados } = req.body;

        if (!resultado || !['VITÓRIA', 'DERROTA'].includes(resultado)) {
            return res.status(400).json({ error: 'Campo "resultado" deve ser "VITÓRIA" ou "DERROTA".' });
        }

        const partida = {
            alunoId,
            alunoNome: req.user.nome || 'Aluno',
            salaId: req.user.salaId || null,
            resultado,
            tempo_jogado_segundos: Math.max(0, Number(tempo_jogado_segundos) || 0),
            erros_viagem: Math.max(0, Number(erros_viagem) || 0),
            acertos_viagem: Math.max(0, Number(acertos_viagem) || 0),
            estados_visitados: Array.isArray(estados_visitados) ? estados_visitados : [],
            data_partida: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('detetive_partidas').add(partida);

        // Pontuação para o ranking geral de jogos (compatível com jogo_pontuacoes)
        const pontuacao = resultado === 'VITÓRIA'
            ? Math.max(100, 1000 - (partida.erros_viagem * 80) - Math.floor(partida.tempo_jogado_segundos / 60))
            : Math.max(0, partida.acertos_viagem * 30);

        // Verificar limite diário de 10 partidas
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const jogadasSnap = await db.collection('jogo_pontuacoes')
            .where('jogoId', '==', 'detetive-brasil')
            .where('alunoId', '==', alunoId)
            .get();

        let jogadasHoje = 0;
        jogadasSnap.forEach(doc => {
            if (doc.data().data >= startOfDay.toISOString()) jogadasHoje++;
        });

        if (jogadasHoje < 10) {
            await db.collection('jogo_pontuacoes').add({
                jogoId: 'detetive-brasil',
                alunoId,
                pontuacao,
                data: new Date().toISOString()
            });
        }

        res.status(201).json({
            message: 'Partida finalizada com sucesso!',
            id: docRef.id,
            pontuacao
        });
    } catch (error) {
        console.error('❌ Erro ao finalizar partida detetive:', error);
        res.status(500).json({ error: 'Erro ao salvar partida.' });
    }
});

// GET /api/detetive/relatorio/:salaId — Relatório para professor
router.get('/relatorio/:salaId', authenticateToken, requireProfessor, async (req, res) => {
    try {
        const { salaId } = req.params;

        // Buscar alunos da sala
        const alunosSnap = await db.collection('alunos').where('salaId', '==', salaId).get();
        if (alunosSnap.empty) {
            return res.json({ salaId, alunos: [], totalPartidas: 0 });
        }

        const alunosMap = {};
        alunosSnap.forEach(doc => { alunosMap[doc.id] = doc.data(); });

        // Buscar todas as partidas e filtrar pela sala em memória
        const partidasSnap = await db.collection('detetive_partidas').get();

        const porAluno = {};

        partidasSnap.forEach(doc => {
            const d = doc.data();
            if (!alunosMap[d.alunoId]) return; // Aluno não é desta sala

            if (!porAluno[d.alunoId]) {
                porAluno[d.alunoId] = {
                    alunoId: d.alunoId,
                    alunoNome: d.alunoNome || alunosMap[d.alunoId]?.nome || 'Aluno',
                    totalPartidas: 0,
                    vitorias: 0,
                    derrotas: 0,
                    acertosTotal: 0,
                    errosTotal: 0,
                    tempoMedioSegundos: 0,
                    partidas: []
                };
            }

            const stat = porAluno[d.alunoId];
            stat.totalPartidas++;
            if (d.resultado === 'VITÓRIA') stat.vitorias++;
            else stat.derrotas++;
            stat.acertosTotal += d.acertos_viagem || 0;
            stat.errosTotal += d.erros_viagem || 0;
            stat.tempoMedioSegundos += d.tempo_jogado_segundos || 0;
            stat.partidas.push({
                id: doc.id,
                resultado: d.resultado,
                data_partida: d.data_partida,
                tempo_jogado_segundos: d.tempo_jogado_segundos,
                erros_viagem: d.erros_viagem,
                acertos_viagem: d.acertos_viagem,
                estados_visitados: d.estados_visitados
            });
        });

        // Calcular tempo médio real
        const alunosResult = Object.values(porAluno).map(a => ({
            ...a,
            tempoMedioSegundos: a.totalPartidas > 0
                ? Math.round(a.tempoMedioSegundos / a.totalPartidas)
                : 0,
            taxaVitoria: a.totalPartidas > 0
                ? Math.round((a.vitorias / a.totalPartidas) * 100)
                : 0
        })).sort((a, b) => b.vitorias - a.vitorias || a.errosTotal - b.errosTotal);

        const totalPartidas = alunosResult.reduce((s, a) => s + a.totalPartidas, 0);

        res.json({ salaId, alunos: alunosResult, totalPartidas });
    } catch (error) {
        console.error('❌ Erro ao buscar relatório detetive:', error);
        res.status(500).json({ error: 'Erro ao buscar relatório.' });
    }
});

module.exports = router;
