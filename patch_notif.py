import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('frontend/js/aluno/notificacoes.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("return '📋';", "return '<i class=\"fa-solid fa-clipboard-list\"></i>';")
content = content.replace("return '🎮';", "return '<i class=\"fa-solid fa-gamepad\"></i>';")
content = content.replace("return '🔔';", "return '<i class=\"fa-solid fa-bell\"></i>';")

with open('frontend/js/aluno/notificacoes.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('SUCCESS')
