// ==========================================
// MOTOR DE JOGOS - GEOEDUCA
// 10 mini jogos completos de geografia do Brasil
// Usa tokens.css / components.css do design system
// ==========================================

// -------- DADOS GEOGRÁFICOS REAIS --------
const estadosBR = [
  {nome:"Acre",          sigla:"AC", capital:"Rio Branco",       regiao:"Norte",        icon:"🟢"},
  {nome:"Alagoas",       sigla:"AL", capital:"Maceió",           regiao:"Nordeste",     icon:"🏖️"},
  {nome:"Amapá",         sigla:"AP", capital:"Macapá",           regiao:"Norte",        icon:"🌿"},
  {nome:"Amazonas",      sigla:"AM", capital:"Manaus",           regiao:"Norte",        icon:"🌳"},
  {nome:"Bahia",         sigla:"BA", capital:"Salvador",         regiao:"Nordeste",     icon:"🥁"},
  {nome:"Ceará",         sigla:"CE", capital:"Fortaleza",        regiao:"Nordeste",     icon:"🌞"},
  {nome:"Espírito Santo",sigla:"ES", capital:"Vitória",          regiao:"Sudeste",      icon:"☕"},
  {nome:"Goiás",         sigla:"GO", capital:"Goiânia",          regiao:"Centro-Oeste", icon:"🌾"},
  {nome:"Maranhão",      sigla:"MA", capital:"São Luís",         regiao:"Nordeste",     icon:"🏘️"},
  {nome:"Mato Grosso",   sigla:"MT", capital:"Cuiabá",           regiao:"Centro-Oeste", icon:"🐊"},
  {nome:"Mato Grosso do Sul",sigla:"MS",capital:"Campo Grande",  regiao:"Centro-Oeste", icon:"🦜"},
  {nome:"Minas Gerais",  sigla:"MG", capital:"Belo Horizonte",   regiao:"Sudeste",      icon:"🧀"},
  {nome:"Pará",          sigla:"PA", capital:"Belém",            regiao:"Norte",        icon:"🌧️"},
  {nome:"Paraíba",       sigla:"PB", capital:"João Pessoa",      regiao:"Nordeste",     icon:"🌅"},
  {nome:"Paraná",        sigla:"PR", capital:"Curitiba",         regiao:"Sul",          icon:"🌲"},
  {nome:"Pernambuco",    sigla:"PE", capital:"Recife",           regiao:"Nordeste",     icon:"🌂"},
  {nome:"Piauí",         sigla:"PI", capital:"Teresina",         regiao:"Nordeste",     icon:"🌵"},
  {nome:"Rio de Janeiro",sigla:"RJ", capital:"Rio de Janeiro",   regiao:"Sudeste",      icon:"🏔️"},
  {nome:"Rio Grande do Norte",sigla:"RN",capital:"Natal",        regiao:"Nordeste",     icon:"🐪"},
  {nome:"Rio Grande do Sul",sigla:"RS",capital:"Porto Alegre",   regiao:"Sul",          icon:"🧉"},
  {nome:"Rondônia",      sigla:"RO", capital:"Porto Velho",      regiao:"Norte",        icon:"🚂"},
  {nome:"Roraima",       sigla:"RR", capital:"Boa Vista",        regiao:"Norte",        icon:"⛰️"},
  {nome:"Santa Catarina",sigla:"SC", capital:"Florianópolis",    regiao:"Sul",          icon:"🍎"},
  {nome:"São Paulo",     sigla:"SP", capital:"São Paulo",        regiao:"Sudeste",      icon:"🏙️"},
  {nome:"Sergipe",       sigla:"SE", capital:"Aracaju",          regiao:"Nordeste",     icon:"🦀"},
  {nome:"Tocantins",     sigla:"TO", capital:"Palmas",           regiao:"Norte",        icon:"🌻"},
  {nome:"Distrito Federal",sigla:"DF",capital:"Brasília",        regiao:"Centro-Oeste", icon:"🏛️"}
];

const biomasData = [
  {bioma:"Amazônia",      char:"Maior floresta tropical do mundo",       cor:"#1a7a4a"},
  {bioma:"Caatinga",      char:"Único bioma exclusivamente brasileiro",   cor:"#c47c1e"},
  {bioma:"Cerrado",       char:"Savana com maior biodiversidade do mundo",cor:"#8b7536"},
  {bioma:"Mata Atlântica",char:"Um dos biomas mais ameaçados do planeta", cor:"#2d6e2d"},
  {bioma:"Pampa",         char:"Campos do extremo sul com pecuária",      cor:"#5a7a30"},
  {bioma:"Pantanal",      char:"Maior planície alagável do planeta",      cor:"#1a6080"}
];

const riosData = [
  {nome:"Rio Amazonas",      ext:"6.992 km", info:"O mais caudaloso do mundo"},
  {nome:"Rio São Francisco",  ext:"2.863 km", info:"'Rio da integração nacional'"},
  {nome:"Rio Paraná",        ext:"4.880 km", info:"Forma fronteira com Paraguai e Argentina"},
  {nome:"Rio Tocantins",     ext:"2.640 km", info:"Nasce em Goiás, deságua no Pará"},
  {nome:"Rio Negro",         ext:"1.700 km", info:"Principal afluente esquerdo do Amazonas"},
  {nome:"Rio Paraguai",      ext:"2.621 km", info:"Banha o Pantanal Mato-Grossense"}
];

const perguntasPositivoData = [
  {p:"Qual estado fica ao norte de Santa Catarina?",   r:"Paraná",        err:["Rio Grande do Sul","São Paulo","Mato Grosso"]},
  {p:"Qual estado fica ao sul do Pará?",               r:"Mato Grosso",   err:["Tocantins","Maranhão","Amazonas"]},
  {p:"Qual estado fica mais a oeste do Brasil?",        r:"Acre",          err:["Rondônia","Amazonas","Roraima"]},
  {p:"Qual estado fica ao norte do Maranhão?",         r:"Pará",          err:["Ceará","Piauí","Tocantins"]},
  {p:"Qual estado não possui litoral?",                r:"Minas Gerais",  err:["Espírito Santo","Rio de Janeiro","Bahia"]},
  {p:"Qual estado é cortado pela Linha do Equador?",   r:"Amapá",         err:["Pará","Roraima","Maranhão"]},
  {p:"Qual estado fica ao leste de Mato Grosso?",      r:"Goiás",         err:["Mato Grosso do Sul","Tocantins","Rondônia"]},
  {p:"Qual estado fica ao sul do Amazonas?",           r:"Rondônia",      err:["Acre","Mato Grosso","Roraima"]},
  {p:"Qual estado faz fronteira com o Uruguai?",       r:"Rio Grande do Sul",err:["Santa Catarina","Paraná","Mato Grosso do Sul"]},
  {p:"Qual estado fica entre Pará e Maranhão?",        r:"Tocantins",     err:["Goiás","Piauí","Bahia"]}
];

const fronteirasData = {
  "MG": ["ES","RJ","SP","GO","MS","BA","PI","TO"],
  "SP": ["RJ","MG","MS","PR"],
  "RJ": ["SP","MG","ES"],
  "PR": ["SP","SC","MS"],
  "SC": ["PR","RS"],
  "RS": ["SC"],
  "MS": ["SP","PR","MG","MT","GO"],
  "MT": ["AM","PA","RO","MS","GO","TO","PA"],
  "GO": ["MT","MS","MG","TO","BA","DF"],
  "BA": ["SE","AL","PE","PI","TO","GO","MG","ES"],
  "AM": ["RR","PA","MT","RO","AC","AP"],
  "PA": ["AP","AM","RR","MT","TO","MA"],
  "PE": ["PB","CE","PI","BA","AL"],
  "CE": ["RN","PB","PE","PI"],
  "MA": ["PA","TO","PI"],
  "PI": ["MA","CE","PE","PB","BA","TO"],
  "RN": ["PB","CE"],
  "PB": ["RN","PE","CE"],
  "AL": ["SE","PE","BA"],
  "SE": ["BA","AL"],
  "ES": ["MG","RJ","BA"],
  "TO": ["PA","MA","PI","BA","GO","MT"],
  "DF": ["GO"],
  "RO": ["AM","MT","AC"],
  "AC": ["AM","RO"],
  "RR": ["AM","PA"],
  "AP": ["PA","AM"]
};

// -------- UTILITÁRIOS --------
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function pickRandom(arr, n) { return shuffle(arr).slice(0, n); }

// -------- ESTADO GLOBAL DO JOGO --------
let currentGameId = null;
let currentScore = 0;
let timeElapsed = 0;
let timerInterval = null;
let container = null;
let maxScore = 60;

// -------- CONTROLE DO MODAL --------
window.fecharJogo = function() {
  document.getElementById('game-modal-overlay').classList.remove('open');
  if (timerInterval) clearInterval(timerInterval);
};

window.abrirJogo = function(gameId, title) {
  currentGameId = gameId;
  currentScore  = 0;
  timeElapsed   = 0;
  maxScore      = 60;
  document.getElementById('active-game-title').innerText = title;
  container = document.getElementById('game-container');
  container.innerHTML = '';

  document.getElementById('game-modal-overlay').classList.add('open');
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => timeElapsed++, 1000);

  const fn = window['initJogo' + gameId];
  if (fn) fn();
  else container.innerHTML = '<p style="color:var(--color-text-secondary)">Jogo não implementado.</p>';
};

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// -------- FEEDBACK --------
function setFeedback(msg, ok) {
  let fb = document.getElementById('gfb');
  if (!fb) {
    fb = document.createElement('div');
    fb.id = 'gfb';
    fb.style.cssText = 'font-weight:600;font-size:15px;min-height:22px;margin:8px 0;transition:color .2s;';
    container.appendChild(fb);
  }
  fb.style.color = ok ? 'var(--color-success)' : 'var(--color-danger)';
  fb.textContent = msg;
}

// -------- HEADER PADRÃO --------
function renderHeader(pontoAtual, pontoAlvo, extra) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;
      background:var(--color-surface-2);border:1px solid var(--color-border);
      border-radius:var(--radius-md);padding:10px 16px;font-size:13px;font-weight:600;color:var(--color-text-secondary);">
      <span>🏆 Pontos: <strong id="p-score" style="color:var(--gold)">${pontoAtual}</strong></span>
      <span>Meta: ${pontoAlvo} pts</span>
      ${extra || ''}
    </div>`;
}

// -------- FINALIZAR JOGO --------
function finalizarJogo(bonus) {
  if (timerInterval) clearInterval(timerInterval);
  const finalScore = currentScore + (bonus || 0);
  const tempo = formatTime(timeElapsed);
  const pct = Math.min(100, Math.round((finalScore / maxScore) * 100));
  const estrelas = pct >= 80 ? '⭐⭐⭐' : pct >= 50 ? '⭐⭐' : '⭐';

  container.innerHTML = `
    <div style="padding:24px 16px;display:flex;flex-direction:column;align-items:center;gap:16px;">
      <div style="font-size:56px;">${estrelas}</div>
      <h2 style="color:var(--gold);margin:0;font-family:var(--font-display)">Fim de Jogo!</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:340px;">
        <div style="background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:var(--color-success)">${finalScore}</div>
          <div style="font-size:12px;color:var(--color-text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Pontos</div>
        </div>
        <div style="background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:var(--navy)">${tempo}</div>
          <div style="font-size:12px;color:var(--color-text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Tempo</div>
        </div>
      </div>
      <div style="width:100%;max-width:340px;background:var(--color-border);border-radius:99px;height:8px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:var(--gold);border-radius:99px;transition:width .5s"></div>
      </div>
      <p style="color:var(--color-text-secondary);font-size:14px;margin:0">${pct}% da pontuação máxima</p>
      <button class="btn btn-primary btn-lg" onclick="fecharJogo()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        Voltar ao Painel
      </button>
    </div>`;

  // Salvar resultado real no localStorage (lido pelo painel da professora)
  try {
    const hist = JSON.parse(localStorage.getItem('geoeduca_results') || '[]');
    // Pega nome e sala do objeto salvo por jogos.js no load da página
    const geoUser = JSON.parse(localStorage.getItem('geoeduca_user') || '{}');
    const nome = geoUser.name || localStorage.getItem('geoeduca_user_name') || 'Aluno';
    const sala = geoUser.sala || '';
    hist.push({
      gameId: currentGameId,
      aluno: nome,
      sala: sala,
      pontuacao: finalScore,
      tempo: tempo,
      data: new Date().toISOString(),
      pct: pct
    });
    localStorage.setItem('geoeduca_results', JSON.stringify(hist));
    if (window.Toast) Toast.success('Resultado salvo! ' + estrelas);
  } catch(e) { console.error(e); }
}

// ==========================================
// JOGO 1 — BANDEIRA E ESTADO
// Mostra ícone/emoji representando o estado
// Usuário escolhe o nome correto
// ==========================================
window.initJogo1 = function() {
  maxScore = 60;
  const alvos = pickRandom(estadosBR, 4);
  const correto = alvos[0];

  container.innerHTML = `
    ${renderHeader(currentScore, maxScore)}
    <p style="color:var(--color-text-secondary);margin:0;font-size:14px;">Qual estado é representado por este símbolo?</p>
    <div style="font-size:72px;margin:8px 0;filter:drop-shadow(0 4px 8px rgba(0,0,0,.15))">${correto.icon}</div>
    <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:8px;">Sigla: <strong style="color:var(--navy)">${correto.sigla}</strong></div>
    <div id="opcoes" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:440px;margin:0 auto;"></div>
    <div id="gfb" style="font-weight:600;font-size:15px;min-height:22px;margin:8px 0;"></div>`;

  const opcoes = document.getElementById('opcoes');
  shuffle(alvos).forEach(e => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.cssText = 'height:auto;padding:14px 10px;font-size:14px;white-space:normal;';
    btn.textContent = e.nome;
    btn.onclick = () => {
      Array.from(opcoes.children).forEach(b => b.disabled = true);
      if (e.sigla === correto.sigla) {
        btn.style.background = 'var(--color-success-light)';
        btn.style.borderColor = 'var(--color-success)';
        btn.style.color = 'var(--color-success)';
        currentScore += 10;
        document.getElementById('p-score').textContent = currentScore;
        setFeedback('✓ Correto! +10 pontos', true);
        if (currentScore >= maxScore) setTimeout(finalizarJogo, 900);
        else setTimeout(initJogo1, 900);
      } else {
        btn.style.background = 'var(--color-danger-light)';
        btn.style.borderColor = 'var(--color-danger)';
        btn.style.color = 'var(--color-danger)';
        setFeedback(`✗ Incorreto! Era: ${correto.nome}`, false);
        setTimeout(initJogo1, 1200);
      }
    };
    opcoes.appendChild(btn);
  });
};

// ==========================================
// JOGO 2 — ENCONTRE A CAPITAL
// Exibe nome do estado, escolhe a capital certa
// ==========================================
window.initJogo2 = function() {
  maxScore = 60;
  const alvos = pickRandom(estadosBR, 4);
  const correto = alvos[0];

  container.innerHTML = `
    ${renderHeader(currentScore, maxScore)}
    <p style="color:var(--color-text-secondary);margin:0;font-size:14px;">Qual é a capital deste estado?</p>
    <div style="background:linear-gradient(135deg,var(--navy),#1a1960);border-radius:var(--radius-lg);padding:24px 16px;margin:8px 0;color:white;">
      <div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;opacity:.7;margin-bottom:6px;">Estado</div>
      <div style="font-size:28px;font-weight:700;font-family:var(--font-display)">${correto.nome}</div>
      <div style="font-size:13px;opacity:.6;margin-top:4px;">${correto.sigla} · ${correto.regiao}</div>
    </div>
    <div id="opcoes" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:440px;margin:0 auto;"></div>
    <div id="gfb" style="font-weight:600;font-size:15px;min-height:22px;margin:8px 0;"></div>`;

  const opcoes = document.getElementById('opcoes');
  shuffle(alvos).forEach(e => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.cssText = 'height:auto;padding:14px 10px;font-size:14px;';
    btn.textContent = e.capital;
    btn.onclick = () => {
      Array.from(opcoes.children).forEach(b => b.disabled = true);
      if (e.capital === correto.capital) {
        btn.className = 'btn btn-primary';
        currentScore += 10;
        document.getElementById('p-score').textContent = currentScore;
        setFeedback('✓ Correto! +10 pontos', true);
        if (currentScore >= maxScore) setTimeout(finalizarJogo, 900);
        else setTimeout(initJogo2, 900);
      } else {
        btn.style.background = 'var(--color-danger-light)';
        btn.style.borderColor = 'var(--color-danger)';
        btn.style.color = 'var(--color-danger)';
        setFeedback(`✗ Errado! A capital é ${correto.capital}`, false);
        setTimeout(initJogo2, 1300);
      }
    };
    opcoes.appendChild(btn);
  });
};

// ==========================================
// JOGO 3 — QUIZ DE SIGLAS
// Exibe sigla, escolhe o estado
// Combo de acertos consecutivos
// ==========================================
let j3Combo = 0;
window.initJogo3 = function() {
  maxScore = 60;
  const alvos = pickRandom(estadosBR, 4);
  const correto = alvos[0];

  container.innerHTML = `
    ${renderHeader(currentScore, maxScore, `<span>🔥 Combo: <strong id="j3-combo" style="color:var(--color-danger)">${j3Combo}</strong></span>`)}
    <p style="color:var(--color-text-secondary);margin:0;font-size:14px;">De qual estado é esta sigla?</p>
    <div style="background:linear-gradient(135deg,var(--gold),var(--gold-dark));border-radius:var(--radius-lg);
      padding:28px;margin:8px 0;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:52px;font-weight:800;font-family:var(--font-display);color:var(--navy);letter-spacing:0.1em">${correto.sigla}</span>
    </div>
    <div id="opcoes" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:440px;margin:0 auto;"></div>
    <div id="gfb" style="font-weight:600;font-size:15px;min-height:22px;margin:8px 0;"></div>`;

  const opcoes = document.getElementById('opcoes');
  shuffle(alvos).forEach(e => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.cssText = 'height:auto;padding:14px 10px;font-size:14px;white-space:normal;';
    btn.textContent = e.nome;
    btn.onclick = () => {
      Array.from(opcoes.children).forEach(b => b.disabled = true);
      if (e.sigla === correto.sigla) {
        j3Combo++;
        btn.className = 'btn btn-primary';
        currentScore += 10 + (j3Combo > 2 ? 5 : 0);
        document.getElementById('p-score').textContent = currentScore;
        document.getElementById('j3-combo').textContent = j3Combo;
        setFeedback(j3Combo > 1 ? `🔥 COMBO x${j3Combo}! +${10 + (j3Combo > 2 ? 5 : 0)} pontos` : '✓ Correto! +10 pontos', true);
        if (currentScore >= maxScore) setTimeout(finalizarJogo, 900);
        else setTimeout(() => { initJogo3(); }, 900);
      } else {
        j3Combo = 0;
        btn.style.background = 'var(--color-danger-light)';
        btn.style.borderColor = 'var(--color-danger)';
        btn.style.color = 'var(--color-danger)';
        setFeedback(`✗ Era: ${correto.nome} (${correto.sigla}) — Combo zerado!`, false);
        setTimeout(initJogo3, 1300);
      }
    };
    opcoes.appendChild(btn);
  });
};

// ==========================================
// JOGO 4 — MEMÓRIA DOS BIOMAS
// Cards virados, achar pares bioma/característica
// ==========================================
let j4Viradas = [], j4Encontradas = 0, j4Bloqueado = false;
window.initJogo4 = function() {
  maxScore = 40;
  j4Viradas = []; j4Encontradas = 0; j4Bloqueado = false;
  const pares = biomasData.map((b, i) => ([
    {id: i, texto: b.bioma,    cor: b.cor, tipo:'nome'},
    {id: i, texto: b.char,     cor: b.cor, tipo:'char'}
  ])).flat();
  const embaralhados = shuffle(pares);

  container.innerHTML = `
    ${renderHeader(currentScore, maxScore, `<span>Pares: <strong id="j4-pares" style="color:var(--color-success)">0</strong>/6</span>`)}
    <p style="color:var(--color-text-secondary);margin:0;font-size:14px;">Encontre os pares: nome do bioma e sua característica.</p>
    <div id="j4-grade" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:100%;"></div>
    <div id="gfb" style="font-weight:600;font-size:15px;min-height:22px;margin:8px 0;"></div>`;

  const grade = document.getElementById('j4-grade');
  embaralhados.forEach((c, idx) => {
    const div = document.createElement('div');
    div.dataset.id = c.id;
    div.dataset.idx = idx;
    div.style.cssText = `height:70px;border-radius:var(--radius-md);cursor:pointer;
      display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;
      background:var(--navy);color:transparent;transition:.3s;border:2px solid var(--navy);
      text-align:center;padding:6px;line-height:1.3;user-select:none;`;
    div.textContent = c.texto;
    div.onclick = () => virarCarta4(div, c);
    grade.appendChild(div);
  });
};

function virarCarta4(div, c) {
  if (j4Bloqueado || j4Viradas.find(v => v.div === div) || div.dataset.found) return;
  div.style.background = c.tipo === 'nome' ? c.cor : '#555';
  div.style.borderColor = c.cor;
  div.style.color = '#fff';
  j4Viradas.push({div, id: c.id, cor: c.cor});

  if (j4Viradas.length === 2) {
    j4Bloqueado = true;
    setTimeout(() => {
      if (j4Viradas[0].id === j4Viradas[1].id) {
        j4Viradas.forEach(v => {
          v.div.style.background = v.cor;
          v.div.style.opacity = '0.7';
          v.div.style.cursor = 'default';
          v.div.dataset.found = 'true';
        });
        j4Encontradas++;
        document.getElementById('j4-pares').textContent = j4Encontradas;
        currentScore += 10;
        document.getElementById('p-score').textContent = currentScore;
        setFeedback('✓ Par encontrado! +10 pontos', true);
        if (j4Encontradas >= 6) setTimeout(finalizarJogo, 1000);
      } else {
        j4Viradas.forEach(v => {
          v.div.style.background = 'var(--navy)';
          v.div.style.borderColor = 'var(--navy)';
          v.div.style.color = 'transparent';
        });
        setFeedback('✗ Não é um par! Tente novamente.', false);
      }
      j4Viradas = [];
      j4Bloqueado = false;
    }, 900);
  }
}

// ==========================================
// JOGO 5 — ORDENANDO POR REGIÃO
// Mostra estado, clica na região certa
// ==========================================
window.initJogo5 = function() {
  maxScore = 60;
  const lista = shuffle([...estadosBR]);
  let idx = 0;
  const regioes = ["Norte","Nordeste","Centro-Oeste","Sudeste","Sul"];
  const cores = {"Norte":"#1a7a4a","Nordeste":"#c47c1e","Centro-Oeste":"#8b5e1e","Sudeste":"#0b5394","Sul":"#6a2080"};

  const renderItem = () => {
    if (idx >= lista.length || currentScore >= maxScore) { finalizarJogo(); return; }
    const est = lista[idx];
    container.innerHTML = `
      ${renderHeader(currentScore, maxScore, `<span>Estado ${idx+1}/${lista.length}</span>`)}
      <p style="color:var(--color-text-secondary);margin:0;font-size:14px;">Em qual região do Brasil fica este estado?</p>
      <div style="background:linear-gradient(135deg,var(--navy),#1a1960);border-radius:var(--radius-lg);
        padding:24px 16px;margin:8px 0;color:white;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px">${est.icon}</div>
        <div style="font-size:26px;font-weight:700;font-family:var(--font-display)">${est.nome}</div>
        <div style="font-size:13px;opacity:.6;margin-top:4px;">${est.sigla}</div>
      </div>
      <div id="opcoes" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:440px;margin:0 auto;"></div>
      <div id="gfb" style="font-weight:600;font-size:15px;min-height:22px;margin:8px 0;"></div>`;

    const opcoes = document.getElementById('opcoes');
    shuffle(regioes).forEach(r => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.style.cssText = `padding:10px 16px;font-size:14px;font-weight:600;border-left:3px solid ${cores[r]};`;
      btn.textContent = r;
      btn.onclick = () => {
        Array.from(opcoes.children).forEach(b => b.disabled = true);
        if (r === est.regiao) {
          btn.style.background = 'var(--color-success-light)';
          btn.style.borderColor = 'var(--color-success)';
          btn.style.color = 'var(--color-success)';
          currentScore += 10;
          document.getElementById('p-score').textContent = currentScore;
          setFeedback('✓ Correto! +10 pontos', true);
          idx++;
          if (currentScore >= maxScore) setTimeout(finalizarJogo, 900);
          else setTimeout(renderItem, 900);
        } else {
          btn.style.background = 'var(--color-danger-light)';
          btn.style.borderColor = 'var(--color-danger)';
          btn.style.color = 'var(--color-danger)';
          setFeedback(`✗ Errado! ${est.nome} fica no ${est.regiao}`, false);
          idx++;
          setTimeout(renderItem, 1300);
        }
      };
      opcoes.appendChild(btn);
    });
  };
  renderItem();
};

// ==========================================
// JOGO 6 — HIDROGRAFIAS
// Exibe nome do rio, escolhe a descrição correta
// ==========================================
window.initJogo6 = function() {
  maxScore = 50;
  const alvos = pickRandom(riosData, 4);
  const correto = alvos[0];

  container.innerHTML = `
    ${renderHeader(currentScore, maxScore)}
    <p style="color:var(--color-text-secondary);margin:0;font-size:14px;">Qual informação corresponde a este rio brasileiro?</p>
    <div style="background:linear-gradient(135deg,#0e4d87,#1565a0);border-radius:var(--radius-lg);padding:20px 16px;
      margin:8px 0;color:white;text-align:center;">
      <div style="font-size:28px;margin-bottom:4px">🌊</div>
      <div style="font-size:24px;font-weight:700;font-family:var(--font-display)">${correto.nome}</div>
      <div style="font-size:13px;opacity:.7;margin-top:4px">Extensão: ${correto.ext}</div>
    </div>
    <div id="opcoes" style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:440px;margin:0 auto;"></div>
    <div id="gfb" style="font-weight:600;font-size:15px;min-height:22px;margin:8px 0;"></div>`;

  const opcoes = document.getElementById('opcoes');
  shuffle(alvos).forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.cssText = 'height:auto;padding:14px 16px;font-size:14px;text-align:left;white-space:normal;';
    btn.textContent = r.info;
    btn.onclick = () => {
      Array.from(opcoes.children).forEach(b => b.disabled = true);
      if (r.nome === correto.nome) {
        btn.className = 'btn btn-navy';
        currentScore += 10;
        document.getElementById('p-score').textContent = currentScore;
        setFeedback('✓ Correto! +10 pontos', true);
        if (currentScore >= maxScore) setTimeout(finalizarJogo, 900);
        else setTimeout(initJogo6, 900);
      } else {
        btn.style.background = 'var(--color-danger-light)';
        btn.style.borderColor = 'var(--color-danger)';
        btn.style.color = 'var(--color-danger)';
        setFeedback(`✗ Errado! "${correto.info}" é do ${correto.nome}`, false);
        setTimeout(initJogo6, 1400);
      }
    };
    opcoes.appendChild(btn);
  });
};

// ==========================================
// JOGO 7 — DESAFIO DA POSIÇÃO
// Múltipla escolha sobre localização/fronteiras
// ==========================================
window.initJogo7 = function() {
  maxScore = 50;
  const banco = shuffle([...perguntasPositivoData]);
  let idx = 0;

  const renderPergunta = () => {
    if (idx >= banco.length || currentScore >= maxScore) { finalizarJogo(); return; }
    const q = banco[idx];
    const opcoes = shuffle([q.r, ...q.err]);

    container.innerHTML = `
      ${renderHeader(currentScore, maxScore, `<span>Pergunta ${idx+1}/${banco.length}</span>`)}
      <div style="background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:var(--radius-lg);
        padding:20px;font-size:17px;font-weight:600;color:var(--color-text-primary);line-height:1.5;text-align:left">
        🧭 ${q.p}
      </div>
      <div id="opcoes" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:440px;margin:0 auto;"></div>
      <div id="gfb" style="font-weight:600;font-size:15px;min-height:22px;margin:8px 0;"></div>`;

    const opcoesEl = document.getElementById('opcoes');
    opcoes.forEach(o => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.style.cssText = 'height:auto;padding:14px;font-size:14px;white-space:normal;';
      btn.textContent = o;
      btn.onclick = () => {
        Array.from(opcoesEl.children).forEach(b => b.disabled = true);
        if (o === q.r) {
          btn.className = 'btn btn-primary';
          currentScore += 10;
          document.getElementById('p-score').textContent = currentScore;
          setFeedback('✓ Correto! +10 pontos', true);
          idx++;
          if (currentScore >= maxScore) setTimeout(finalizarJogo, 900);
          else setTimeout(renderPergunta, 900);
        } else {
          btn.style.background = 'var(--color-danger-light)';
          btn.style.borderColor = 'var(--color-danger)';
          btn.style.color = 'var(--color-danger)';
          setFeedback(`✗ Errado! A resposta era: ${q.r}`, false);
          idx++;
          setTimeout(renderPergunta, 1400);
        }
      };
      opcoesEl.appendChild(btn);
    });
  };
  renderPergunta();
};

// ==========================================
// JOGO 8 — CAÇA-PALAVRAS REGIONAL
// Grade 10x10, clicar letras sequencialmente
// Palavras: capitais e estados brasileiros
// ==========================================
const j8Palavras = ["ACRE","BELEM","NATAL","GOIAS","CEARA","PARANA","RECIFE","MANAUS","SALVADOR","BRASILIA"];
window.initJogo8 = function() {
  maxScore = 50;
  const palavrasUsadas = pickRandom(j8Palavras, 5);
  let gradeData = [];
  const chars = "ABCDEFGHIJKLMNOPRSTUVWXYZ";
  // Preenche aleatório
  for (let i = 0; i < 100; i++) gradeData.push(chars[Math.floor(Math.random() * chars.length)]);
  // Inserir palavras horizontalmente em linhas fixas sem colisão
  palavrasUsadas.forEach((p, pi) => {
    const row = pi * 2;
    const maxCol = 10 - p.length;
    const col = Math.floor(Math.random() * (maxCol + 1));
    for (let i = 0; i < p.length; i++) gradeData[row * 10 + col + i] = p[i];
  });

  let selecao = [];
  let faltam = palavrasUsadas.length;

  container.innerHTML = `
    ${renderHeader(currentScore, maxScore, `<span>Palavras: <strong id="j8-faltam" style="color:var(--color-success)">${faltam}</strong> restantes</span>`)}
    <p style="color:var(--color-text-secondary);margin:0;font-size:13px;">Clique nas letras em sequência para formar as palavras: <strong style="color:var(--gold)">${palavrasUsadas.join(', ')}</strong></p>
    <div id="j8-grade" style="display:grid;grid-template-columns:repeat(10,1fr);gap:2px;width:100%;font-family:monospace;"></div>
    <div id="gfb" style="font-weight:600;font-size:15px;min-height:22px;margin:8px 0;"></div>`;

  const grade = document.getElementById('j8-grade');
  gradeData.forEach((l, i) => {
    const d = document.createElement('div');
    d.textContent = l;
    d.dataset.idx = i;
    d.dataset.letra = l;
    d.style.cssText = `aspect-ratio:1;display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:13px;cursor:pointer;border-radius:2px;background:var(--color-surface-2);
      border:1px solid var(--color-border);transition:.15s;user-select:none;`;
    d.onmouseenter = () => { if (!d.dataset.found) d.style.background = 'var(--color-border)'; };
    d.onmouseleave = () => { if (!d.dataset.found && !d.dataset.sel) d.style.background = 'var(--color-surface-2)'; };
    d.onclick = () => {
      if (d.dataset.found) return;
      d.style.background = 'rgba(204,164,59,.3)';
      d.style.borderColor = 'var(--gold)';
      d.dataset.sel = '1';
      selecao.push(d);
      const formada = selecao.map(s => s.dataset.letra).join('');
      if (palavrasUsadas.includes(formada)) {
        selecao.forEach(s => { s.style.background = 'var(--color-success-light)'; s.style.borderColor = 'var(--color-success)'; s.style.color = 'var(--color-success)'; s.dataset.found = '1'; delete s.dataset.sel; });
        selecao = [];
        faltam--;
        document.getElementById('j8-faltam').textContent = faltam;
        currentScore += 10;
        document.getElementById('p-score').textContent = currentScore;
        setFeedback(`✓ "${formada}" encontrado! +10 pontos`, true);
        if (faltam === 0 || currentScore >= maxScore) setTimeout(finalizarJogo, 1000);
      } else if (!palavrasUsadas.some(p => p.startsWith(formada))) {
        selecao.forEach(s => { if (!s.dataset.found) { s.style.background = 'var(--color-surface-2)'; s.style.borderColor = 'var(--color-border)'; delete s.dataset.sel; } });
        selecao = [];
        setFeedback('✗ Sequência inválida. Tente novamente.', false);
      }
    };
    grade.appendChild(d);
  });
};

// ==========================================
// JOGO 9 — COMPLETE O MUNICÍPIO
// Lacunas com letras ocultas, digitar a capital
// ==========================================
window.initJogo9 = function() {
  maxScore = 50;
  const alvo = pickRandom(estadosBR, 1)[0];
  const nome = alvo.capital.toUpperCase();
  // Mostrar ~60% das letras, ocultar o resto com _
  const lacuna = nome.split('').map(c => c === ' ' ? ' ' : (Math.random() > 0.55 ? c : '_')).join('');
  let tentativas = 3;

  container.innerHTML = `
    ${renderHeader(currentScore, maxScore)}
    <p style="color:var(--color-text-secondary);margin:0;font-size:14px;">Complete o nome da capital do estado indicado.</p>
    <div style="background:linear-gradient(135deg,var(--navy),#1a1960);border-radius:var(--radius-lg);
      padding:20px 16px;margin:8px 0;color:white;text-align:center;">
      <div style="font-size:13px;opacity:.7;margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:.08em">Estado — Região ${alvo.regiao}</div>
      <div style="font-size:22px;font-weight:700">${alvo.nome} (${alvo.sigla})</div>
      <div style="font-size:13px;opacity:.6;margin-top:4px">${alvo.icon}</div>
    </div>
    <div style="font-size:28px;font-family:monospace;font-weight:700;letter-spacing:8px;color:var(--gold);
      background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:var(--radius-md);
      padding:16px;text-align:center">${lacuna}</div>
    <div style="width:100%;max-width:340px;margin:0 auto;">
      <input id="j9-input" type="text" class="form-control" placeholder="Digite a capital completa..."
        style="text-align:center;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:3px;"
        maxlength="30" autocomplete="off">
    </div>
    <div style="display:flex;gap:8px;max-width:340px;margin:0 auto;width:100%;">
      <button class="btn btn-primary" style="flex:1" onclick="j9Verificar()">Confirmar</button>
      <button class="btn btn-secondary" onclick="j9Dica()" id="j9-dica-btn">💡 Dica (${tentativas})</button>
    </div>
    <div id="gfb" style="font-weight:600;font-size:15px;min-height:22px;margin:8px 0;"></div>`;

  document.getElementById('j9-input').addEventListener('keydown', e => { if (e.key === 'Enter') j9Verificar(); });

  window.j9Verificar = () => {
    const val = document.getElementById('j9-input').value.trim().toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const ans = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (val === ans) {
      currentScore += 10;
      document.getElementById('p-score').textContent = currentScore;
      setFeedback('✓ Correto! +10 pontos', true);
      if (currentScore >= maxScore) setTimeout(finalizarJogo, 900);
      else setTimeout(initJogo9, 900);
    } else {
      setFeedback(`✗ Incorreto! Tente novamente.`, false);
    }
  };

  window.j9Dica = () => {
    if (tentativas <= 0) return;
    tentativas--;
    document.getElementById('j9-dica-btn').textContent = `💡 Dica (${tentativas})`;
    document.getElementById('j9-input').value = nome.substring(0, Math.ceil(nome.length / 2));
    setFeedback(`💡 Dica: começa com "${nome.substring(0, 3)}"`, true);
  };
};

// ==========================================
// JOGO 10 — CRONÔMETRO DAS FRONTEIRAS
// Exibe estado, marcar vizinhos em 15 segundos
// ==========================================
let j10Timer = null, j10Ativo = false;
window.initJogo10 = function() {
  maxScore = 60;
  if (j10Timer) clearInterval(j10Timer);
  const estados = shuffle(Object.keys(fronteirasData));
  let idx = 0;
  let rodadas = 0;

  const renderRodada = () => {
    if (idx >= estados.length || rodadas >= 6 || currentScore >= maxScore) { finalizarJogo(); return; }
    const sigla = estados[idx];
    const est = estadosBR.find(e => e.sigla === sigla);
    if (!est) { idx++; renderRodada(); return; }
    const vizinhosCorretos = fronteirasData[sigla] || [];
    let tempo = 15;
    let acertos = 0;
    let clicados = new Set();
    j10Ativo = true;

    // Montar pool: todos os vizinhos + extras aleatórios (sem repetir)
    const extras = shuffle(estadosBR.filter(e => e.sigla !== sigla && !vizinhosCorretos.includes(e.sigla))).slice(0, 6);
    const pool = shuffle([...vizinhosCorretos.map(s => estadosBR.find(e => e.sigla === s)).filter(Boolean), ...extras]);

    container.innerHTML = `
      ${renderHeader(currentScore, maxScore, `<span>Rodada ${rodadas+1}/6</span>`)}
      <p style="color:var(--color-text-secondary);margin:0;font-size:14px;">Clique em todos os estados que fazem <strong>fronteira</strong> com:</p>
      <div style="background:linear-gradient(135deg,var(--navy),#1a1960);border-radius:var(--radius-lg);
        padding:16px;color:white;text-align:center;">
        <div style="font-size:24px;margin-bottom:4px">${est.icon}</div>
        <div style="font-size:24px;font-weight:700;font-family:var(--font-display)">${est.nome} (${sigla})</div>
        <div style="font-size:13px;opacity:.6">Clique nos vizinhos — ${vizinhosCorretos.length} fronteiras</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;background:var(--color-danger-light);
        border:1px solid var(--color-danger);border-radius:var(--radius-md);padding:10px 16px;">
        <span style="color:var(--color-danger);font-weight:700;font-size:18px;">⏱ <span id="j10-tempo">${tempo}</span>s</span>
        <span style="font-size:13px;color:var(--color-danger);font-weight:600">Acertos: <span id="j10-acertos">0</span>/${vizinhosCorretos.length}</span>
      </div>
      <div id="j10-opcoes" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:440px;margin:0 auto;"></div>
      <div id="gfb" style="font-weight:600;font-size:15px;min-height:22px;margin:8px 0;"></div>`;

    const opcoes = document.getElementById('j10-opcoes');
    pool.forEach(e => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.style.cssText = 'padding:8px 14px;font-size:13px;font-weight:700;';
      btn.textContent = e.sigla;
      btn.title = e.nome;
      btn.onclick = () => {
        if (!j10Ativo || clicados.has(e.sigla)) return;
        clicados.add(e.sigla);
        btn.disabled = true;
        if (vizinhosCorretos.includes(e.sigla)) {
          acertos++;
          btn.className = 'btn btn-primary';
          currentScore += 5;
          document.getElementById('p-score').textContent = currentScore;
          document.getElementById('j10-acertos').textContent = acertos;
          setFeedback(`✓ ${e.nome} faz fronteira! +5 pontos`, true);
          if (acertos === vizinhosCorretos.length) {
            j10Ativo = false;
            clearInterval(j10Timer);
            setFeedback(`🎯 Todos os vizinhos encontrados! +10 bônus`, true);
            currentScore += 10;
            document.getElementById('p-score').textContent = currentScore;
            rodadas++;
            idx++;
            setTimeout(renderRodada, 1200);
          }
        } else {
          btn.style.background = 'var(--color-danger-light)';
          btn.style.borderColor = 'var(--color-danger)';
          btn.style.color = 'var(--color-danger)';
          setFeedback(`✗ ${e.nome} não faz fronteira!`, false);
        }
      };
      opcoes.appendChild(btn);
    });

    j10Timer = setInterval(() => {
      tempo--;
      const el = document.getElementById('j10-tempo');
      if (el) el.textContent = tempo;
      if (tempo <= 0) {
        clearInterval(j10Timer);
        j10Ativo = false;
        setFeedback(`⏰ Tempo esgotado! Acertou ${acertos}/${vizinhosCorretos.length}`, false);
        rodadas++;
        idx++;
        setTimeout(renderRodada, 1500);
      }
    }, 1000);
  };
  renderRodada();
};
