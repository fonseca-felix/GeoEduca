import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('backend/src/controllers/authController.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = "usuario: { id: aluno.id, rm: d.rm, nome: d.nome, salaId: d.salaId, salaNome: d.salaNome, tipo: 'aluno' }"
new_str = "usuario: { id: aluno.id, rm: d.rm, nome: d.nome, salaId: d.salaId, salaNome: d.salaNome, tipo: 'aluno', tituloAtual: d.tituloAtual, bordaAtual: d.bordaAtual, iconeAtual: d.iconeAtual }"

if old_str in content:
    content = content.replace(old_str, new_str)
    with open('backend/src/controllers/authController.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS')
else:
    print('NOT FOUND')
