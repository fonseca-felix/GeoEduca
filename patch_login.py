import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('backend/src/controllers/authController.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = "usuario: { id: aluno.id, rm: alunoData.rm, nome: alunoData.nome, salaId: alunoData.salaId, salaNome: alunoData.salaNome, tipo: 'aluno' }"
new_str = "usuario: { id: aluno.id, rm: alunoData.rm, nome: alunoData.nome, salaId: alunoData.salaId, salaNome: alunoData.salaNome, tipo: 'aluno', tituloAtual: alunoData.tituloAtual, bordaAtual: alunoData.bordaAtual, iconeAtual: alunoData.iconeAtual }"

if old_str in content:
    content = content.replace(old_str, new_str)
    with open('backend/src/controllers/authController.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS')
else:
    print('NOT FOUND')
