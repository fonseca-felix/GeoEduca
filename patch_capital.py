import re

with open('frontend/aluno/complete_capital.html', 'r', encoding='utf-8') as f:
    html = f.read()

js_old = r'let currentScore = 0;.*?function finalizarJogo\(\) \{'
js_new = '''let currentScore = 0;
  let maxScore = 270;
  let secondsElapsed = 0;
  let timerInterval = null;
  let currentTarget = null;
  let targetName = "";
  let hintAttempts = 1;
  let statesQueue = [];

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function pickRandom(arr, n) { return shuffle(arr).slice(0, n); }

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => { secondsElapsed++; }, 1000);
  }

  function renderGame() {
    if (statesQueue.length === 0) {
      finalizarJogo();
      return;
    }

    currentTarget = statesQueue[0];
    targetName = currentTarget.capital.toUpperCase();
    hintAttempts = 1;

    // Show ~30% of letters, hide rest with _
    const lacuna = targetName.split('').map(c => c === ' ' ? ' ' : (Math.random() > 0.70 ? c : '_')).join('');

    const playArea = document.getElementById('play-area');
    playArea.innerHTML = `
      <p style="color:var(--color-text-secondary);font-size:0.95rem;margin:0 0 16px 0;font-weight:600;">Complete o nome da capital do estado indicado (${28 - statesQueue.length} de 27).</p>
      <div style="background:linear-gradient(135deg,var(--navy),#1a1960);border-radius:16px;
        padding:20px 16px;margin-bottom:20px;color:white;text-align:center;box-shadow:inset 0 0 15px rgba(0,0,0,0.1)">
        <div style="font-size:13px;opacity:.7;margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:.08em">Estado — Região ${currentTarget.regiao}</div>
        <div style="font-size:24px;font-weight:700;color:var(--gold);display:flex;align-items:center;justify-content:center;gap:8px;">${currentTarget.icon} ${currentTarget.nome} (${currentTarget.sigla})</div>
      </div>
      <div style="font-size:28px;font-family:monospace;font-weight:700;color:var(--gold);
        background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:12px;
        padding:18px;text-align:center;margin-bottom:20px;letter-spacing:10px;">${lacuna}</div>
      <div style="width:100%;max-width:360px;margin:0 auto 16px;">
        <input id="capital-input" type="text" class="form-control" placeholder="Digite a capital completa..."
          style="text-align:center;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:2px;padding:12px 14px;border-radius:10px;"
          maxlength="30" autocomplete="off">
      </div>
      <div style="display:flex;gap:10px;max-width:360px;margin:0 auto 16px;width:100%;">
        <button class="btn btn-primary" style="flex:1;border-radius:100px;" onclick="verificarResposta()">Confirmar</button>
        <button class="btn btn-secondary" style="border-radius:100px;background:var(--color-bg);color:var(--color-text-primary);" id="dica-btn" onclick="obterDica()"><i class="fa-solid fa-lightbulb" style="color:var(--gold)"></i> Dica (1)</button>
        <button class="btn btn-secondary" style="border-radius:100px;background:var(--color-bg);color:var(--color-text-muted);" title="Pular pergunta" onclick="pularPergunta()"><i class="fa-solid fa-forward"></i></button>
      </div>
      <div id="feedback-msg" style="font-weight:700;font-size:0.95rem;min-height:24px;margin-top:12px;"></div>
    `;

    document.getElementById('capital-input').addEventListener('keydown', e => { if (e.key === 'Enter') verificarResposta(); });
    document.getElementById('capital-input').focus();
  }

  window.verificarResposta = () => {
    const val = document.getElementById('capital-input').value.trim().toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const ans = targetName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const feedbackMsg = document.getElementById('feedback-msg');

    if (val === ans) {
      currentScore += 10;
      document.getElementById('game-score').textContent = currentScore;
      feedbackMsg.style.color = 'var(--color-success)';
      feedbackMsg.innerHTML = '✓ Correto! +10 pontos';
      statesQueue.shift(); // Remove da lista
      setTimeout(renderGame, 1000);
    } else {
      feedbackMsg.style.color = 'var(--color-danger)';
      feedbackMsg.innerHTML = '✗ Incorreto! Tente novamente.';
    }
  };

  window.pularPergunta = () => {
    const feedbackMsg = document.getElementById('feedback-msg');
    feedbackMsg.style.color = 'var(--color-text-muted)';
    feedbackMsg.innerHTML = '⏭ Pulou... A resposta era: ' + targetName;
    
    const pulado = statesQueue.shift();
    // Reinsere no final
    statesQueue.push(pulado);
    
    // Trigger hint reaction to look like thinking/skip
    if (window.GeoCharacter) GeoCharacter.react('thinking');
    
    setTimeout(renderGame, 1500);
  };

  window.obterDica = () => {
    if (hintAttempts <= 0) return;
    hintAttempts--;
    const btn = document.getElementById('dica-btn');
    btn.innerHTML = `<i class="fa-solid fa-lightbulb"></i> Dica (0)`;
    btn.disabled = true;
    btn.style.opacity = '0.5';
    
    document.getElementById('capital-input').value = targetName.substring(0, Math.ceil(targetName.length / 2));
    
    const feedbackMsg = document.getElementById('feedback-msg');
    feedbackMsg.style.color = 'var(--gold)';
    feedbackMsg.innerHTML = `<i class="fa-solid fa-lightbulb"></i> A capital começa com: <strong>"${targetName.substring(0, 3)}"</strong>`;
    
    if (window.GeoCharacter) GeoCharacter.react('hint');
  };

  function finalizarJogo() {'''

html = re.sub(js_old, js_new, html, flags=re.DOTALL)

# Add statesQueue initialization inside document.addEventListener('DOMContentLoaded'
init_old = r"initPage\('aluno'\);\s*startTimer\(\);\s*renderGame\(\);"
init_new = '''initPage('aluno');
    statesQueue = shuffle([...estadosBR]);
    startTimer();
    renderGame();'''

html = re.sub(init_old, init_new, html)

with open('frontend/aluno/complete_capital.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated complete_capital.html')
