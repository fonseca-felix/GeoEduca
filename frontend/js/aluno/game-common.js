// game-common.js - shared data and utilities for individual game pages (Brutalist, Green/Yellow)
// =============================================================
// Data definitions (copied from motor-jogos.js)
const estadosBR = [
  {nome:"Acre",          sigla:"AC", capital:"Rio Branco",       regiao:"Norte",        icon:"🟢"},
  {nome:"Alagoas",       sigla:"AL", capital:"Maceió",           regiao:"Nordeste",     icon:"🏖️"},
  {nome:"Amapá",         sigla:"AP", capital:"Macapá",           regiao:"Norte",        icon:'<i class="fa-solid fa-leaf"></i>'},
  {nome:"Amazonas",      sigla:"AM", capital:"Manaus",           regiao:"Norte",        icon:"🌳"},
  {nome:"Bahia",         sigla:"BA", capital:"Salvador",         regiao:"Nordeste",     icon:"🥁"},
  {nome:"Ceará",         sigla:"CE", capital:"Fortaleza",        regiao:"Nordeste",     icon:"🌞"},
  {nome:"Espírito Santo",sigla:"ES", capital:"Vitória",          regiao:"Sudeste",      icon:"☕"},
  {nome:"Goiás",         sigla:"GO", capital:"Goiânia",          regiao:"Centro-Oeste", icon:'<i class="fa-solid fa-wheat-awn"></i>'},
  {nome:"Maranhão",      sigla:"MA", capital:"São Luís",         regiao:"Nordeste",     icon:"🏘️"},
  {nome:"Mato Grosso",   sigla:"MT", capital:"Cuiabá",           regiao:"Centro-Oeste", icon:"🐊"},
  {nome:"Mato Grosso do Sul",sigla:"MS",capital:"Campo Grande",  regiao:"Centro-Oeste", icon:"🦜"},
  {nome:"Minas Gerais",  sigla:"MG", capital:"Belo Horizonte",   regiao:"Sudeste",      icon:"🧀"},
  {nome:"Pará",          sigla:"PA", capital:"Belém",            regiao:"Norte",        icon:"🌧️"},
  {nome:"Paraíba",       sigla:"PB", capital:"João Pessoa",      regiao:"Nordeste",     icon:"🌅"},
  {nome:"Paraná",        sigla:"PR", capital:"Curitiba",         regiao:"Sul",          icon:'<i class="fa-solid fa-tree"></i>'},
  {nome:"Pernambuco",    sigla:"PE", capital:"Recife",           regiao:"Nordeste",     icon:"🌂"},
  {nome:"Piauí",         sigla:"PI", capital:"Teresina",         regiao:"Nordeste",     icon:"🌵"},
  {nome:"Rio de Janeiro",sigla:"RJ", capital:"Rio de Janeiro",   regiao:"Sudeste",      icon:"🏔️"},
  {nome:"Rio Grande do Norte",sigla:"RN",capital:"Natal",        regiao:"Nordeste",     icon:"🐪"},
  {nome:"Rio Grande do Sul",sigla:"RS",capital:"Porto Alegre",   regiao:"Sul",          icon:"🧉"},
  {nome:"Rondônia",      sigla:"RO", capital:"Porto Velho",      regiao:"Norte",        icon:"🚂"},
  {nome:"Roraima",       sigla:"RR", capital:"Boa Vista",        regiao:"Norte",        icon:"⛰️"},
  {nome:"Santa Catarina",sigla:"SC", capital:"Florianópolis",    regiao:"Sul",          icon:"🍎"},
  {nome:"São Paulo",     sigla:"SP", capital:"São Paulo",        regiao:"Sudeste",      icon:'<i class="fa-solid fa-city"></i>'},
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

// -----------------------------------------------------------------
// Utility functions (same as motor-jogos.js but without abrirJogo/fecharJogo)
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function pickRandom(arr, n) { return shuffle(arr).slice(0, n); }

let currentScore = 0, maxScore = 60, timerInterval = null, timeElapsed = 0;
let container = null;

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

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

function renderHeader(pontoAtual, pontoAlvo, extra) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;background:var(--color-surface-2);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:10px 16px;font-size:13px;font-weight:600;color:var(--color-text-secondary);">
      <span><i class="fa-solid fa-trophy"></i> Pontos: <strong id="p-score" style="color:var(--gold)">${pontoAtual}</strong></span>
      <span>Meta: ${pontoAlvo} pts</span>
      ${extra || ''}
    </div>`;
}

function finalizarJogo(bonus) {
  if (timerInterval) clearInterval(timerInterval);
  const finalScore = currentScore + (bonus || 0);
  const tempo = formatTime(timeElapsed);
  const pct = Math.min(100, Math.round((finalScore / maxScore) * 100));
  const estrelas = pct >= 80 ? '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>'
                : pct >= 50 ? '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>'
                : '<i class="fa-solid fa-star"></i';
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
      <button class="btn btn-primary btn-lg" onclick="window.location.href='jogos.html'">Voltar ao Painel</button>
    </div>`;
  // Save result to localStorage (same format as original)
  try {
    const hist = JSON.parse(localStorage.getItem('geoeduca_results') || '[]');
    const geoUser = JSON.parse(localStorage.getItem('geoeduca_user') || '{}');
    const nome = geoUser.name || localStorage.getItem('geoeduca_user_name') || 'Aluno';
    const sala = geoUser.sala || '';
    hist.push({gameId: window.currentGameId, aluno: nome, sala: sala, pontuacao: finalScore, tempo: tempo, data: new Date().toISOString(), pct: pct});
    localStorage.setItem('geoeduca_results', JSON.stringify(hist));
    if (window.Toast) Toast.success('Resultado salvo! ' + estrelas);
  } catch(e) { console.error(e); }
}

// Export init functions (will be defined later in this file)
// The individual game init functions are appended after this block.
