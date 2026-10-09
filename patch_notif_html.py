import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('frontend/aluno/notificacoes.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\\n</head>', '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n</head>')

with open('frontend/aluno/notificacoes.html', 'w', encoding='utf-8') as f:
    f.write(text)
print('SUCCESS')
