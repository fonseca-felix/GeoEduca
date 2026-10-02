const fs = require('fs');
let code = fs.readFileSync('frontend/index.html', 'utf8');

// Remove .roles div
code = code.replace(/<div class="roles">[\s\S]*?<\/div>\s*<form/m, '<form');

// Update login fields
code = code.replace('id="login-field-label">Nome</span>', 'id="login-field-label">Email ou RM</span>');
code = code.replace('placeholder="Seu nome"', 'placeholder="Identificador (Email, Nome, RM)"');

// Update submit button text
code = code.replace('id="submit-btn">Entrar como Professor</button>', 'id="submit-btn">Entrar na Plataforma</button>');
code = code.replace('id="submit-btn">Entrar como Aluno</button>', 'id="submit-btn">Entrar na Plataforma</button>');

// Remove JS role logic
code = code.replace(/var role = 'professor';[\s\S]*?updateFormForRole\(btn\.dataset\.role\);\s*}\);\s*}\);/m, 'var loginInput = document.getElementById(\'login-input\');');

// Update form submission JS logic
code = code.replace(/if \(!credential \|\| !senha\) \{[\s\S]*?submitBtn\.textContent = 'Entrar como ' \+ \(role === 'professor' \? 'Professor' : 'Aluno'\);\s*\}/m, 
`if (!credential || !senha) {
      loginError.textContent = 'Preencha todos os campos.';
      loginError.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar na Plataforma';
      return;
    }

    try {
      var data = await api.post('/auth/login', { identificador: credential, senha: senha });

      Auth.save(data.token, data.usuario);

      if (data.usuario.tipo === 'master') {
        window.location.href = '/master/dashboard.html';
      } else if (data.usuario.tipo === 'escola') {
        window.location.href = '/escola/dashboard.html';
      } else if (data.usuario.tipo === 'prof') {
        window.location.href = '/professor/dashboard.html';
      } else {
        window.location.href = '/aluno/dashboard.html';
      }
    } catch (err) {
      loginError.textContent = err.message || 'Erro ao fazer login. Tente novamente.';
      loginError.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar na Plataforma';
    }`);

// Update Auth.isLoggedIn check
code = code.replace(/if \(user && user\.tipo === 'prof'\) \{[\s\S]*?\}\s*\}/m,
`if (user) {
      if (user.tipo === 'master') window.location.href = '/master/dashboard.html';
      else if (user.tipo === 'escola') window.location.href = '/escola/dashboard.html';
      else if (user.tipo === 'prof') window.location.href = '/professor/dashboard.html';
      else if (user.tipo === 'aluno') window.location.href = '/aluno/dashboard.html';
    }
  }`);

fs.writeFileSync('frontend/index.html', code);
console.log('Update done');
