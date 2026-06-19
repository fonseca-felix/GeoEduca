const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../../firebase/firebase-admin');

const router = express.Router();

// Login de professor
router.post('/login/professor', async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }
        
        const professoresRef = db.collection('professores');
        const snapshot = await professoresRef.where('email', '==', email).limit(1).get();
        
        if (snapshot.empty) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const professor = snapshot.docs[0];
        const professorData = professor.data();
        
        const senhaValida = await bcrypt.compare(senha, professorData.senha);
        
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const token = jwt.sign(
            { id: professor.id, tipo: 'prof', email: professorData.email },
            process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.json({
            token,
            usuario: {
                id: professor.id,
                nome: professorData.nome,
                email: professorData.email,
                tipo: 'prof'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// Login de aluno
router.post('/login/aluno', async (req, res) => {
    try {
        const { rm, senha } = req.body;
        
        if (!rm || !senha) {
            return res.status(400).json({ error: 'RM e senha são obrigatórios' });
        }
        
        const alunosRef = db.collection('alunos');
        const snapshot = await alunosRef.where('rm', '==', rm).limit(1).get();
        
        if (snapshot.empty) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const aluno = snapshot.docs[0];
        const alunoData = aluno.data();
        
        const senhaValida = await bcrypt.compare(senha, alunoData.senha);
        
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const token = jwt.sign(
            { id: aluno.id, tipo: 'aluno', rm: alunoData.rm },
            process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.json({
            token,
            usuario: {
                id: aluno.id,
                rm: alunoData.rm,
                nome: alunoData.nome,
                salaId: alunoData.salaId,
                salaNome: alunoData.salaNome,
                tipo: 'aluno'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// Verificar token
router.get('/verify', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026');
        
        if (decoded.tipo === 'prof') {
            const professorRef = db.collection('professores').doc(decoded.id);
            const professor = await professorRef.get();
            
            if (!professor.exists) {
                return res.status(401).json({ error: 'Usuário não encontrado' });
            }
            
            const professorData = professor.data();
            res.json({
                valido: true,
                usuario: {
                    id: professor.id,
                    nome: professorData.nome,
                    email: professorData.email,
                    tipo: 'prof'
                }
            });
        } else {
            const alunoRef = db.collection('alunos').doc(decoded.id);
            const aluno = await alunoRef.get();
            
            if (!aluno.exists) {
                return res.status(401).json({ error: 'Usuário não encontrado' });
            }
            
            const alunoData = aluno.data();
            res.json({
                valido: true,
                usuario: {
                    id: aluno.id,
                    rm: alunoData.rm,
                    nome: alunoData.nome,
                    salaId: alunoData.salaId,
                    salaNome: alunoData.salaNome,
                    tipo: 'aluno'
                }
            });
        }
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
});

module.exports = router;
