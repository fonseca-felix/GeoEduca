import sys
import re

# 1. Update frontend/aluno/perfil.html
with open('frontend/aluno/perfil.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add CSS for password eye
css_target = ".example-box {"
css_replacement = """.input-with-icon {
            position: relative;
            display: flex;
            align-items: center;
        }
        .input-with-icon .form-control {
            padding-right: 40px;
        }
        .toggle-password {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            color: var(--color-text-muted);
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .toggle-password:hover {
            color: var(--color-text-primary);
        }
        .example-box {"""
html = html.replace(css_target, css_replacement)

# Update inputs and add eyes
form_target = """                <form id="form-password">
                    <div class="form-group">
                        <label for="senhaAtual">Senha Atual</label>
                        <input type="password" id="senhaAtual" class="form-control" placeholder="Digite sua senha atual" required>
                    </div>

                    <div class="form-group">
                        <label for="novaSenha">Nova Senha</label>
                        <input type="password" id="novaSenha" class="form-control" placeholder="Digite a nova senha" required>
                    </div>

                    <div class="password-rules">
                        <h4>Criterios da Senha:</h4>
                        <ul>
                            <li id="rule-length"><i class="fa-solid fa-circle-xmark rule-fail"></i> Minimo de 8 caracteres</li>
                            <li id="rule-upper"><i class="fa-solid fa-circle-xmark rule-fail"></i> Pelo menos 1 letra maiuscula</li>
                            <li id="rule-special"><i class="fa-solid fa-circle-xmark rule-fail"></i> Pelo menos 1 caractere especial (!@#$%)</li>
                        </ul>
                        <div style="font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px;">Exemplo de senha aceita:</div>
                        <div class="example-box">Abcd1234@</div>
                    </div>

                    <div class="form-group">
                        <label for="novaSenha2">Repetir Nova Senha</label>
                        <input type="password" id="novaSenha2" class="form-control" placeholder="Repita a nova senha" required>
                        <div id="match-error" style="color: var(--danger); font-size: 12px; margin-top: 4px; display: none;">
                            As senhas nao coincidem.
                        </div>
                    </div>"""

form_replacement = """                <form id="form-password">
                    <div class="form-group">
                        <label for="senhaAtual">Senha Atual</label>
                        <div class="input-with-icon">
                            <input type="password" id="senhaAtual" class="form-control" placeholder="Digite sua senha atual" required maxlength="20">
                            <button type="button" class="toggle-password" onclick="toggleVisibility('senhaAtual', this)" aria-label="Mostrar senha"><i class="fa-regular fa-eye"></i></button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="novaSenha">Nova Senha</label>
                        <div class="input-with-icon">
                            <input type="password" id="novaSenha" class="form-control" placeholder="Digite a nova senha" required maxlength="20">
                            <button type="button" class="toggle-password" onclick="toggleVisibility('novaSenha', this)" aria-label="Mostrar senha"><i class="fa-regular fa-eye"></i></button>
                        </div>
                    </div>

                    <div class="password-rules">
                        <h4>Criterios da Senha:</h4>
                        <ul>
                            <li id="rule-length"><i class="fa-solid fa-circle-xmark rule-fail"></i> Minimo de 8 e maximo de 20 caracteres</li>
                            <li id="rule-upper"><i class="fa-solid fa-circle-xmark rule-fail"></i> Pelo menos 1 letra maiuscula</li>
                            <li id="rule-special"><i class="fa-solid fa-circle-xmark rule-fail"></i> Pelo menos 1 caractere especial (!@#$%)</li>
                        </ul>
                        <div style="font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px;">Exemplo de senha aceita:</div>
                        <div class="example-box">Abcd1234@</div>
                    </div>

                    <div class="form-group">
                        <label for="novaSenha2">Repetir Nova Senha</label>
                        <div class="input-with-icon">
                            <input type="password" id="novaSenha2" class="form-control" placeholder="Repita a nova senha" required maxlength="20">
                            <button type="button" class="toggle-password" onclick="toggleVisibility('novaSenha2', this)" aria-label="Mostrar senha"><i class="fa-regular fa-eye"></i></button>
                        </div>
                        <div id="match-error" style="color: var(--danger); font-size: 12px; margin-top: 4px; display: none;">
                            As senhas nao coincidem.
                        </div>
                    </div>"""
html = html.replace(form_target, form_replacement)

# Add toggleVisibility function
js_target = """    // Submit do form"""
js_replacement = """    // Mostrar/Esconder Senha
    window.toggleVisibility = function(inputId, btn) {
        const input = document.getElementById(inputId);
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };

    // Submit do form"""
html = html.replace(js_target, js_replacement)

# Update validation JS logic
js_val_target = """        // Comprimento (min 8)
        if (pass.length >= 8) {
            ruleLength.innerHTML = '<i class="fa-solid fa-circle-check rule-pass"></i> Minimo de 8 caracteres';
        } else {
            ruleLength.innerHTML = '<i class="fa-solid fa-circle-xmark rule-fail"></i> Minimo de 8 caracteres';
            isValid = false;
        }"""
js_val_replacement = """        // Comprimento (min 8, max 20)
        if (pass.length >= 8 && pass.length <= 20) {
            ruleLength.innerHTML = '<i class="fa-solid fa-circle-check rule-pass"></i> Minimo de 8 e maximo de 20 caracteres';
        } else {
            ruleLength.innerHTML = '<i class="fa-solid fa-circle-xmark rule-fail"></i> Minimo de 8 e maximo de 20 caracteres';
            isValid = false;
        }"""
html = html.replace(js_val_target, js_val_replacement)

with open('frontend/aluno/perfil.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update backend regex
with open('backend/src/routes/alunos.js', 'r', encoding='utf-8') as f:
    backend = f.read()

backend = backend.replace('.{8,}$', '.{8,20}$')
backend = backend.replace('mínimo 8 caracteres', 'mínimo 8 e máximo de 20 caracteres')
backend = backend.replace('minimo 8 caracteres', 'minimo 8 e maximo de 20 caracteres')

with open('backend/src/routes/alunos.js', 'w', encoding='utf-8') as f:
    f.write(backend)

print("Done")
