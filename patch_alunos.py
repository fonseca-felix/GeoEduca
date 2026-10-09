import sys

with open('backend/src/routes/alunos.js', 'r', encoding='utf-8') as f:
    text = f.read()

new_code = '''
// PUT - Aluno alterar a própria senha
router.put('/me/password', authenticateToken, requireAluno, async (req, res) => {
    try {
        const alunoId = req.user.id;
        const { senhaAtual, novaSenha } = req.body;
        
        if (!senhaAtual || !novaSenha) {
            return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
        }
        
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>\-+=_]).{8,}$/;
        if (!passwordRegex.test(novaSenha)) {
            return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres, 1 maiúscula e 1 caractere especial' });
        }
        
        const alunoRef = db.collection('alunos').doc(alunoId);
        const aluno = await alunoRef.get();
        if (!aluno.exists) return res.status(404).json({ error: 'Aluno não encontrado' });
        
        const alunoData = aluno.data();
        const senhaValida = await bcrypt.compare(senhaAtual, alunoData.senha);
        if (!senhaValida) return res.status(401).json({ error: 'Senha atual incorreta' });
        
        const hashedPassword = await bcrypt.hash(novaSenha, 10);
        
        await alunoRef.update({ 
            senha: hashedPassword,
            senhaVisivel: 'Redefinida pelo aluno' // Segurança
        });
        
        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao alterar senha' });
    }
});
'''

# 1. Add new route
if '/me/password' not in text:
    text = text.replace('// DELETE - Remover aluno', new_code + '\n// DELETE - Remover aluno')

# 2. Add validation to POST /
post_search = """        if (!rm || !nome || !senha || !salaId) {
            return res.status(400).json({ error: 'RM, nome, senha e sala são obrigatórios' });
        }"""
post_replace = post_search + """

        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>\-+=_]).{8,}$/;
        if (!passwordRegex.test(senha)) {
            return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres, 1 maiúscula e 1 caractere especial' });
        }"""
text = text.replace(post_search, post_replace)

# Try with ISO-8859-1 or whatever if utf-8 fails matching
post_search2 = """        if (!rm || !nome || !senha || !salaId) {
            return res.status(400).json({ error: 'RM, nome, senha e sala so obrigatrios' });
        }"""
post_replace2 = post_search2.replace('', '') + """

        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>\-+=_]).{8,}$/;
        if (!passwordRegex.test(senha)) {
            return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres, 1 maiúscula e 1 caractere especial' });
        }"""
text = text.replace(post_search2, post_replace2)


# 3. Add validation to PUT /:id
put_search = """        if (senha) {
            updates.senha = await bcrypt.hash(senha, 10);
            updates.senhaVisivel = senha;
        }"""
put_replace = """        if (senha) {
            const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>\-+=_]).{8,}$/;
            if (!passwordRegex.test(senha)) {
                return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres, 1 maiúscula e 1 caractere especial' });
            }
            updates.senha = await bcrypt.hash(senha, 10);
            updates.senhaVisivel = senha;
        }"""
text = text.replace(put_search, put_replace)


with open('backend/src/routes/alunos.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("Script finished!")
