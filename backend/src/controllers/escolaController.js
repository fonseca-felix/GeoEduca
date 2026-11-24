const { db } = require('../../firebase/firebase-admin');
const bcrypt = require('bcryptjs');

const escolaController = {
  // Cria um novo professor vinculado à escola (login via Nome)
  createProfessor: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const { nome, senha } = req.body;

      if (!nome || !senha) {
        return res.status(400).json({ error: 'Nome do professor e senha inicial são obrigatórios.' });
      }

      const cleanNome = nome.trim();
      if (cleanNome.length < 3) {
        return res.status(400).json({
          error: 'O nome do professor deve ter no mínimo 3 caracteres.'
        });
      }

      if (cleanNome.length > 80) {
        return res.status(400).json({
          error: 'O nome do professor não pode ultrapassar 80 caracteres.'
        });
      }

      // Validação de senha
      if (senha.length < 8 || senha.length > 20 || !/[A-Z]/.test(senha) || !/[-!@#$%^&*(),.?":{}|<>+=_]/.test(senha)) {
        return res.status(400).json({
          error: 'A senha deve ter entre 8 e 20 caracteres, pelo menos 1 letra maiúscula e 1 caractere especial.'
        });
      }

      // Verificar se já existe um professor com esse nome (suporta acentuação, 'ç', espaços múltiplos e case-insensitive)
      const allProfsSnap = await db.collection('professores').get();
      const normalizedNovoNome = cleanNome.toLowerCase().replace(/\s+/g, ' ');

      const nomeExiste = allProfsSnap.docs.some(doc => {
        const d = doc.data();
        const existingNome = (d.nome || '').trim().toLowerCase().replace(/\s+/g, ' ');
        return existingNome === normalizedNovoNome;
      });

      if (nomeExiste) {
        return res.status(400).json({
          error: `Já existe um professor cadastrado com o nome "${cleanNome}". Por favor, informe um nome diferente ou adicione um sobrenome para diferenciar.`
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(senha, salt);

      const novoProf = {
        nome: cleanNome,
        email: cleanNome, // O login de acesso passa a ser o próprio nome
        emailRecuperacao: cleanNome,
        senha: hashedPassword,
        escolaId,
        tipo: 'prof',
        emailVerificado: true,
        criadoEm: new Date().toISOString()
      };

      const docRef = await db.collection('professores').add(novoProf);

      res.status(201).json({
        id: docRef.id,
        message: `Professor(a) "${cleanNome}" cadastrado com sucesso! O login de acesso é o próprio nome.`
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

      const professores = profDocs.map(doc => {
        const data = doc.data();
        const profId = doc.id;

        // Provas criadas por este professor
        const profProvas = provasSnap.docs.filter(d => d.data().professorId === profId);
        const provaIdsSet = new Set(profProvas.map(d => d.id));

        // Alunos disponíveis para este professor (384 alunos da escola, ou filtrado se tiver turmas específicas)
        let alunosCount = alunosSnap.size;
        if (Array.isArray(data.salas) && data.salas.length > 0) {
          const profSalasSet = new Set(data.salas);
          alunosCount = alunosSnap.docs.filter(aDoc => {
            const aData = aDoc.data();
            const aSalas = Array.isArray(aData.salas) ? aData.salas : (aData.salaId ? [aData.salaId] : []);
            return aSalas.some(sId => profSalasSet.has(sId));
          }).length;
        }

        // Provas respondidas/feitas deste professor
        const provasFeitasCount = provaRespSnap.docs.filter(r => provaIdsSet.has(r.data().provaId)).length;

        return {
          id: doc.id,
          nome: data.nome,
          email: data.email,
          emailRecuperacao: data.emailRecuperacao || data.email,
          emailVerificado: true,
          criadoEm: data.criadoEm,
          totalAlunos: alunosCount,
          totalProvas: profProvas.length,
          totalProvasFeitas: provasFeitasCount
        };
      });

      res.json(professores);
    } catch (error) {
      console.error('Erro ao listar professores:', error);
      res.status(500).json({ error: 'Erro ao listar professores' });
    }
  },

  // Estatísticas completas da Escola para o Dashboard Administrativo com Gráficos
  getStats: async (req, res) => {
    try {
      const escolaId = req.user.id;
      const [
        allProfsSnap,
        alunosSnap,
        salasSnap,
        provasSnap,
        provaRespSnap,
        quizzesSnap,
        atividadesSnap
      ] = await Promise.all([
        db.collection('professores').get(),
        db.collection('alunos').get(),
        db.collection('salas').get(),
        db.collection('provas').get(),
        db.collection('prova_respostas').get(),
        db.collection('quizzes').get(),
        db.collection('atividades').get()
      ]);

      const profDocs = req.user.tipo === 'master'
        ? allProfsSnap.docs
        : allProfsSnap.docs.filter(d => (d.data().escolaId || 'escola_ce399') === escolaId);

      // Mapeamento de Alunos por Turma
      const SALA_ORDER = [
        '6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B',
        '8º Ano A', '8º Ano B', '9º Ano A', '9º Ano B',
        '1ª Série A', '1ª Série B', '2ª Série A', '2ª Série B',
        '3ª Série A', '3ª Série B'
      ];

      const alunoSalaMap = {};
      const alunosPorSalaMap = {};
      alunosSnap.forEach(d => {
        const dt = d.data();
        const sala = dt.salaNome || (dt.salasNomes ? dt.salasNomes[0] : 'Outros');
        alunoSalaMap[d.id] = sala;
        alunosPorSalaMap[sala] = (alunosPorSalaMap[sala] || 0) + 1;
      });

      const turmasLabels = Object.keys(alunosPorSalaMap).sort((a, b) => {
        const ia = SALA_ORDER.indexOf(a);
        const ib = SALA_ORDER.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      });
      const turmasAlunosData = turmasLabels.map(l => alunosPorSalaMap[l] || 0);

      // Provas respondidas por Turma
      const respsPorSalaMap = {};
      provaRespSnap.forEach(r => {
        const dt = r.data();
        const sala = alunoSalaMap[dt.alunoId] || 'Outros';
        respsPorSalaMap[sala] = (respsPorSalaMap[sala] || 0) + 1;
      });
      const turmasRespostasData = turmasLabels.map(l => respsPorSalaMap[l] || 0);

      // Faixas de Desempenho / Notas das avaliações
      const faixasNotas = {
        excelente: 0, // >= 8.0
        bom: 0,       // 6.0 a 7.9
        regular: 0,   // 4.0 a 5.9
        atencao: 0    // < 4.0
      };
      provaRespSnap.forEach(r => {
        const dt = r.data();
        const nota = dt.notaManual !== null && dt.notaManual !== undefined
          ? Number(dt.notaManual)
          : (dt.notaAutomatica !== undefined ? Number(dt.notaAutomatica) : null);
        if (nota !== null && !isNaN(nota)) {
          if (nota >= 8) faixasNotas.excelente++;
          else if (nota >= 6) faixasNotas.bom++;
          else if (nota >= 4) faixasNotas.regular++;
          else faixasNotas.atencao++;
        }
      });

      // Professores resumo
      const professoresResumo = profDocs.map(doc => {
        const dt = doc.data();
        const pId = doc.id;
        const provasProf = provasSnap.docs.filter(p => p.data().professorId === pId);
        const pIds = new Set(provasProf.map(p => p.id));
        const respsProf = provaRespSnap.docs.filter(r => pIds.has(r.data().provaId)).length;
        return {
          id: pId,
          nome: dt.nome,
          email: dt.email,
          provasCriadas: provasProf.length,
          provasFeitas: respsProf
        };
      });

      res.json({
        totalProfessores: profDocs.length,
        totalAlunos: alunosSnap.size,
        totalSalas: salasSnap.size,
        totalProvasCriadas: provasSnap.size,
        totalProvasRealizadas: provaRespSnap.size,
        totalQuizzes: quizzesSnap.size,
        totalAtividades: atividadesSnap.size,
        turmasLabels,
        turmasAlunosData,
        turmasRespostasData,
        faixasNotas,
        professoresResumo
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

      // Provas criadas por este professor
      const profProvas = provasSnap.docs.filter(d => d.data().professorId === profId);
      const provaIdsSet = new Set(profProvas.map(d => d.id));
      const enviosProvas = provasEnvSnap.docs.map(d => d.data());

      // Alunos disponíveis para este professor (todos os 384 da escola, ou filtrado por turmas se houver)
      let alunosDocs = alunosSnap.docs;
      if (Array.isArray(data.salas) && data.salas.length > 0) {
        const profSalasSet = new Set(data.salas);
        alunosDocs = alunosSnap.docs.filter(aDoc => {
          const aData = aDoc.data();
          const aSalas = Array.isArray(aData.salas) ? aData.salas : (aData.salaId ? [aData.salaId] : []);
          return aSalas.some(sId => profSalasSet.has(sId));
        });
      }

      // Alunos mapeados com quantidade de provas feitas deste professor
      const alunos = alunosDocs.map(d => {
        const aData = d.data();
        const respsAluno = provaRespSnap.docs.filter(r => {
          const rData = r.data();
          return rData.alunoId === d.id && provaIdsSet.has(rData.provaId);
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

      // Provas criadas por este professor com métricas de envio e resposta
      const provas = profProvas.map(d => {
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

      // Salas da escola
      let salasDocs = salasSnap.docs;
      if (Array.isArray(data.salas) && data.salas.length > 0) {
        const profSalasSet = new Set(data.salas);
        salasDocs = salasSnap.docs.filter(s => profSalasSet.has(s.id));
      }
      const salas = salasDocs.map(s => ({
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
