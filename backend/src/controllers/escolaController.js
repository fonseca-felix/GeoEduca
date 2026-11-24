const { db } = require('../../firebase/firebase-admin');
const bcrypt = require('bcryptjs');

const escolaController = {
  // Cria um novo professor vinculado à escola
  createProfessor: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
          error: 'Informe um endereço de e-mail válido.'
        });
      }

      if (senha.length < 8 || senha.length > 20 || !/[A-Z]/.test(senha) || !/[!@#$%^&*(),.?":{}|<>\-+=_]/.test(senha)) {
        return res.status(400).json({
          error: 'A senha deve ter entre 8 e 20 caracteres, pelo menos 1 letra maiúscula e 1 caractere especial.'
        });
      }

      // Check if email already exists
      const allProfsSnap = await db.collection('professores').get();
      const emailExists = allProfsSnap.docs.some(doc => {
        const d = doc.data();
        return (d.email || '').toLowerCase() === cleanEmail;
      });
      if (emailExists) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado para outro professor.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senha, salt);

      const novoProf = {
        nome: nome.trim(),
        email: cleanEmail,
        senha: hashedPassword,
        escolaId,
        emailVerificado: true,
        criadoEm: new Date().toISOString(),
      };

      const docRef = await db.collection('professores').add(novoProf);

      res.status(201).json({
        id: docRef.id,
        message: 'Professor cadastrado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao criar professor:', error);
      res.status(500).json({ error: 'Erro ao criar professor' });
    }
  },

  // Redefine a senha do professor diretamente pela coordenação da escola
  resetProfessorPassword: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const profId = req.params.id;
      const { novaSenha } = req.body;

      if (!novaSenha) {
        return res.status(400).json({ error: 'A nova senha é obrigatória.' });
      }

      if (novaSenha.length < 8 || novaSenha.length > 20 || !/[A-Z]/.test(novaSenha) || !/[!@#$%^&*(),.?":{}|<>\-+=_]/.test(novaSenha)) {
        return res.status(400).json({
          error: 'A nova senha deve ter entre 8 e 20 caracteres, pelo menos 1 letra maiúscula e 1 caractere especial.'
        });
      }

      const profDoc = await db.collection('professores').doc(profId).get();
      if (!profDoc.exists) {
        return res.status(404).json({ error: 'Professor não encontrado.' });
      }

      const profEscolaId = profDoc.data().escolaId || 'escola_ce399';
      if (req.user.tipo !== 'master' && profEscolaId !== escolaId) {
        return res.status(403).json({ error: 'Acesso negado: Este professor não pertence à sua escola.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(novaSenha, salt);

      await db.collection('professores').doc(profId).update({
        senha: hashedPassword,
        emailVerificado: true,
        codigoVerificacao: null,
        codigoRecuperacao: null
      });

      res.json({ message: 'Senha do professor redefinida com sucesso!' });
    } catch (error) {
      console.error('Erro ao redefinir senha do professor:', error);
      res.status(500).json({ error: 'Erro ao redefinir senha do professor' });
    }
  },

  // Atualiza o email de um professor existente
  updateProfessorEmail: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const profId = req.params.id;
      const { emailRecuperacao } = req.body;

      if (!emailRecuperacao || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRecuperacao.trim())) {
        return res.status(400).json({ error: 'Informe um endereço de e-mail válido.' });
      }

      const cleanEmail = emailRecuperacao.trim().toLowerCase();
      const profDoc = await db.collection('professores').doc(profId).get();
      const profEscolaId = profDoc.exists ? (profDoc.data().escolaId || 'escola_ce399') : null;
      if (!profDoc.exists || (req.user.tipo !== 'master' && profEscolaId !== escolaId)) {
        return res.status(404).json({ error: 'Professor não encontrado' });
      }

      await db.collection('professores').doc(profId).update({
        emailRecuperacao: cleanEmail,
        email: cleanEmail
      });

      res.json({
        message: `E-mail atualizado com sucesso!`,
        email: cleanEmail
      });
    } catch (error) {
      console.error('Erro ao atualizar e-mail do professor:', error);
      res.status(500).json({ error: 'Erro ao atualizar e-mail do professor' });
    }
  },

  // Lista os professores da escola com contagem real de alunos e provas feitas
  getProfessores: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const [allProfsSnap, alunosSnap, provasSnap, provasEnvSnap, provaRespSnap] = await Promise.all([
        db.collection('professores').get(),
        db.collection('alunos').get(),
        db.collection('provas').get(),
        db.collection('provas_enviadas').get(),
        db.collection('prova_respostas').get()
      ]);

      const profDocs = req.user.tipo === 'master'
        ? allProfsSnap.docs
        : allProfsSnap.docs.filter(d => {
            const pEscId = d.data().escolaId || 'escola_ce399';
            return pEscId === escolaId;
          });

      const singleProf = profDocs.length === 1;
      const professores = profDocs.map(doc => {
        const data = doc.data();
        const profId = doc.id;

        // Envios de prova feitos por este professor
        const envios = provasEnvSnap.docs.filter(d => d.data().professorId === profId);
        const alunoIdsSet = new Set(envios.map(d => d.data().alunoId));
        const provaIdsSet = new Set(envios.map(d => d.data().provaId));
        const salaIdsSet = new Set(envios.map(d => d.data().salaId).filter(Boolean));

        if (Array.isArray(data.salas)) {
          data.salas.forEach(sId => salaIdsSet.add(sId));
        }

        if (salaIdsSet.size > 0) {
          alunosSnap.docs.forEach(aDoc => {
            const aData = aDoc.data();
            const aSalas = Array.isArray(aData.salas) ? aData.salas : (aData.salaId ? [aData.salaId] : []);
            if (aSalas.some(sId => salaIdsSet.has(sId))) {
              alunoIdsSet.add(aDoc.id);
            }
          });
        }

        let alunosCount = alunoIdsSet.size;
        let provasCount = provaIdsSet.size;
        if (singleProf && alunosCount === 0) alunosCount = alunosSnap.size;
        if (singleProf && provasCount === 0) provasCount = provasSnap.size;

        // Provas respondidas/feitas
        const respostas = provaRespSnap.docs.filter(r => {
          const rData = r.data();
          return provaIdsSet.has(rData.provaId) || (alunoIdsSet.has(rData.alunoId) && alunoIdsSet.size > 0);
        });

        const provasFeitasCount = singleProf && respostas.length === 0
          ? provaRespSnap.size
          : respostas.length;

        return {
          id: doc.id,
          nome: data.nome,
          email: data.email,
          emailRecuperacao: data.emailRecuperacao || data.email,
          emailVerificado: true,
          criadoEm: data.criadoEm,
          totalAlunos: alunosCount,
          totalProvas: provasCount,
          totalProvasFeitas: provasFeitasCount
        };
      });

      res.json(professores);
    } catch (error) {
      console.error('Erro ao listar professores:', error);
      res.status(500).json({ error: 'Erro ao listar professores' });
    }
  },

  // Estatísticas da Escola
  getStats: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const [allProfsSnap, alunosSnap, provasSnap] = await Promise.all([
        db.collection('professores').get(),
        db.collection('alunos').get(),
        db.collection('provas').get()
      ]);

      const profDocs = req.user.tipo === 'master'
        ? allProfsSnap.docs
        : allProfsSnap.docs.filter(d => (d.data().escolaId || 'escola_ce399') === escolaId);

      res.json({
        totalProfessores: profDocs.length,
        totalAlunos: alunosSnap.size,
        totalProvas: provasSnap.size
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas da escola:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  },
  
  // Detalhes completos do professor (usado pela Escola)
  getProfessorDetalhes: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const profId = req.params.id;
      
      const profDoc = await db.collection('professores').doc(profId).get();
      const profEscolaId = profDoc.exists ? (profDoc.data().escolaId || 'escola_ce399') : null;
      if (!profDoc.exists || (req.user.tipo !== 'master' && profEscolaId !== escolaId)) {
        return res.status(404).json({ error: 'Professor não encontrado ou não pertence a esta escola' });
      }
      
      const data = profDoc.data();
      const [
        alunosSnap,
        provasSnap,
        salasSnap,
        atividadesSnap,
        quizzesSnap,
        provasEnvSnap,
        provaRespSnap,
        atividadesEnvSnap,
        quizzesEnvSnap
      ] = await Promise.all([
        db.collection('alunos').get(),
        db.collection('provas').get(),
        db.collection('salas').get(),
        db.collection('atividades').get(),
        db.collection('quizzes').get(),
        db.collection('provas_enviadas').where('professorId', '==', profId).get(),
        db.collection('prova_respostas').get(),
        db.collection('atividades_enviadas').where('professorId', '==', profId).get(),
        db.collection('quizzes_enviados').where('professorId', '==', profId).get()
      ]);

      const enviosProvas = provasEnvSnap.docs.map(d => d.data());
      const alunoIdsSet = new Set(enviosProvas.map(d => d.alunoId));
      const provaIdsSet = new Set(enviosProvas.map(d => d.provaId));
      const salaIdsSet = new Set(enviosProvas.map(d => d.salaId).filter(Boolean));

      atividadesEnvSnap.docs.forEach(d => {
        const dt = d.data();
        if (dt.alunoId) alunoIdsSet.add(dt.alunoId);
        if (dt.salaId) salaIdsSet.add(dt.salaId);
      });
      quizzesEnvSnap.docs.forEach(d => {
        const dt = d.data();
        if (dt.alunoId) alunoIdsSet.add(dt.alunoId);
        if (dt.salaId) salaIdsSet.add(dt.salaId);
      });

      if (Array.isArray(data.salas)) {
        data.salas.forEach(sId => salaIdsSet.add(sId));
      }

      if (salaIdsSet.size > 0) {
        alunosSnap.docs.forEach(aDoc => {
          const aData = aDoc.data();
          const aSalas = Array.isArray(aData.salas) ? aData.salas : (aData.salaId ? [aData.salaId] : []);
          if (aSalas.some(sId => salaIdsSet.has(sId))) {
            alunoIdsSet.add(aDoc.id);
          }
        });
      }

      // Alunos filtrados e mapeados com quantidade de provas feitas
      const alunos = alunosSnap.docs
        .filter(d => alunoIdsSet.has(d.id))
        .map(d => {
          const aData = d.data();
          const respsAluno = provaRespSnap.docs.filter(r => {
            const rData = r.data();
            return rData.alunoId === d.id && (provaIdsSet.has(rData.provaId) || provaIdsSet.size === 0);
          });

          return {
            id: d.id,
            nome: aData.nome,
            rm: aData.rm,
            salaNome: aData.salaNome || (aData.salasNomes ? aData.salasNomes[0] : ''),
            provasFeitas: respsAluno.length,
            notaMedia: respsAluno.length > 0
              ? (respsAluno.reduce((acc, cur) => acc + (Number(cur.data().notaAutomatica) || 0), 0) / respsAluno.length).toFixed(1)
              : null
          };
        });

      // Ordenar alunos pelo nome
      alunos.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

      // Provas mapeadas com total enviadas e total feitas
      const provas = provasSnap.docs
        .filter(d => provaIdsSet.has(d.id))
        .map(d => {
          const pData = d.data();
          const envs = enviosProvas.filter(e => e.provaId === d.id);
          const resps = provaRespSnap.docs.filter(r => r.data().provaId === d.id);
          return {
            id: d.id,
            titulo: pData.titulo,
            rubrica: pData.rubrica || '',
            totalEnviadas: envs.length,
            totalFeitas: resps.length,
            createdAt: pData.createdAt
          };
        });

      // Salas mapeadas
      const salas = salasSnap.docs
        .filter(d => salaIdsSet.has(d.id))
        .map(s => ({
          id: s.id,
          nome: s.data().nome,
          serie: s.data().serie,
          turma: s.data().turma
        }));

      const totalProvasFeitas = provaRespSnap.docs.filter(r => provaIdsSet.has(r.data().provaId)).length;

      res.json({
        id: profDoc.id,
        nome: data.nome,
        email: data.email,
        emailVerificado: true,
        totalAlunos: alunos.length,
        totalProvas: provas.length,
        totalProvasFeitas: totalProvasFeitas,
        totalAtividades: atividadesEnvSnap.size + quizzesEnvSnap.size,
        alunos,
        provas,
        salas
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do professor:', error);
      res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
  }
};

module.exports = escolaController;
