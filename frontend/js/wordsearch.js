// Wordsearch sets – 10 geography-themed word lists
window.wordsearchSets = [
  ["ACRE", "PARA", "PIAUI", "CEARA", "GOIAS"],
  ["ALAGOAS", "RORAIMA", "PERNAMBUCO", "CEARA", "MATO GROSSO"],
  ["MINAS", "SAO PAULO", "RIO DE JANEIRO", "PARANA", "SANTA CATARINA"],
  ["AMAPA", "MARANHAO", "PARA", "TOCANTINS", "RONDONIA"],
  ["RIO GRANDE", "SERGIPE", "PIAUI", "ALAGOAS", "BAHIA"],
  ["MATO GROSSO", "MATO GROSSO DO SUL", "DISTRITO FEDERAL", "GOIAS", "FEDERAL"],
  ["RIO NEGRO", "BOLIVAR", "CUIABA", "BAGE", "PRAIA"],
  ["CAMPINAS", "BARRA", "FLORESTA", "MACEIO", "ARACAJU"],
  ["VILA", "ESTRELA", "LAR", "SOL", "LUA"],
  ["NORTE", "SUL", "LESTE", "OESTE", "CENTRO"]
];
window.currentSetIndex = 0;

// Load next wordsearch set; returns true if a new set was loaded
window.loadNextWordsearch = function(){
  if (window.currentSetIndex >= window.wordsearchSets.length) {
    showMsg('j8-feedback', 'Todas as Caças‑Palavras concluídas! Volte ao menu.', true);
    // Clear controls
    const ctrl = document.getElementById('j8-controls');
    if (ctrl) ctrl.innerHTML = '';
    return false;
  }
  window.j8Palavras = window.wordsearchSets[window.currentSetIndex];
  window.currentSetIndex++;
  initJogo8();
  return true;
};

// Override initJogo8 to reset state and attach drag listeners
const _origInitJogo8 = window.initJogo8;
window.initJogo8 = function(){
  // reset temporary selection
  window.j8Selecao = [];
  _origInitJogo8();
  // Reset remaining words count based on new set
  window.j8Faltam = window.j8Palavras.length;
  const restantesElem = document.getElementById('j8-restantes');
  if (restantesElem) restantesElem.innerText = window.j8Faltam;
  const grade = document.getElementById('j8-grade');
  if (!grade) return;
  // ensure controls are present
  const ctrl = document.getElementById('j8-controls');
  if (ctrl) {
    ctrl.innerHTML = `
      <button onclick="if(window.loadNextWordsearch()){}">Próxima Caça‑Palavras</button>
      <button onclick="mudarJogo(1)">Voltar ao Menu</button>
    `;
  }
  // drag selection logic using pointer events for better compatibility
  let isDragging = false;
  let selection = [];
  // Prevent adding listeners multiple times
  if (window._wordsearchListenersAttached) return;
  window._wordsearchListenersAttached = true;
  // Ensure the grid can receive pointer events without scrolling
  grade.style.touchAction = 'none';

  // Helper function to get letter element under pointer
  const getLetterElement = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el && el.classList && el.classList.contains('letra') ? el : null;
  };

  // Start drag on a letter
  grade.addEventListener('pointerdown', e => {
    const target = getLetterElement(e.clientX, e.clientY);
    if (target) {
      e.preventDefault();
      isDragging = true;
      selection = [target];
      target.classList.add('selecting');
    }
  });
  
  // Track movement over letters while dragging
  document.addEventListener('pointermove', e => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling on touch
    const target = getLetterElement(e.clientX, e.clientY);
    if (target && !selection.includes(target)) {
      selection.push(target);
      target.classList.add('selecting');
    }
  }, { passive: false });
  
  // Finish drag
  document.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;
    const formed = selection.map(d => d.innerText).join('');
    // Check both forward and reverse directions
    const reversed = selection.map(d => d.innerText).reverse().join('');
    
    const idx = window.j8Palavras.findIndex(w => {
      const cleanW = w.replace(/\s+/g, '');
      return cleanW === formed || cleanW === reversed;
    });
    
    if (idx !== -1) {
      // Correct word – mark cells as found
      selection.forEach(d => d.classList.remove('selecting'));
      selection.forEach(d => d.classList.add('found'));
      window.j8Palavras.splice(idx, 1);
      window.j8Faltam--;
      
      const restantesElem = document.getElementById('j8-restantes');
      if(restantesElem) restantesElem.innerText = window.j8Faltam;
      
      if (typeof addPonto === 'function') addPonto();
      
      if (window.j8Faltam === 0) {
        if (typeof showMsg === 'function') showMsg('j8-feedback', 'Você achou todas!', true);
        // Mostrar o botão de próxima rodada destacando
        const ctrl = document.getElementById('j8-controls');
        if (ctrl) ctrl.classList.add('pulse');
      }
    } else {
      // Incorrect – clear selection visuals
      selection.forEach(d => d.classList.remove('selecting'));
    }
    selection = [];
  });
};
