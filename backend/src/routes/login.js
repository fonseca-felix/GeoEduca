const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../../firebase/firebase-admin');
const { csrfProtection } = require('../../middleware/csrf');

const router = express.Router();

// Unified login route (professor or aluno)
router.post('/', csrfProtection, async (req, res) => {
  try {
    // Determine login type based on provided fields
    const { email, nome, password, rm } = req.body;

    // Professor login (email + password)
    if ((email || nome) && password) {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }
      const professoresRef = db.collection('professores');
      const professorQuery = email ? professoresRef.where('email', '==', email) : professoresRef.where('nome', '==', nome);
      const snapshot = await professorQuery.limit(1).get();
      if (snapshot.empty) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      const professor = snapshot.docs[0];
      const professorData = professor.data();
      const senhaValida = await bcrypt.compare(password, professorData.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      const token = jwt.sign(
        { id: professor.id, tipo: 'prof', email: professorData.email },
        process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      return res.json({
        token,
        usuario: {
          id: professor.id,
          nome: professorData.nome,
          email: professorData.email,
          tipo: 'prof'
        }
      });
    }

    // Aluno login (rm + password)
    if (rm && password) {
      const alunosRef = db.collection('alunos');
      const snapshot = await alunosRef.where('rm', '==', rm).limit(1).get();
      if (snapshot.empty) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      const aluno = snapshot.docs[0];
      const alunoData = aluno.data();
      const senhaValida = await bcrypt.compare(password, alunoData.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }
      const token = jwt.sign(
        { id: aluno.id, tipo: 'aluno', rm: alunoData.rm },
        process.env.JWT_SECRET || 'geoeduca_secret_default_key_2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      return res.json({
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
    }

    // If none matched
    return res.status(400).json({ error: 'Dados de login incompletos ou tipo desconhecido' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

module.exports = router;
