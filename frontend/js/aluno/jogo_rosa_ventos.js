const DIRECTIONS = [
  { id: 'N', label: 'NORTE (N)' },
  { id: 'S', label: 'SUL (S)' },
  { id: 'L', label: 'LESTE (L)' },
  { id: 'O', label: 'OESTE (O)' },
  { id: 'NE', label: 'NORDESTE (NE)' },
  { id: 'NO', label: 'NOROESTE (NO)' },
  { id: 'SE', label: 'SUDESTE (SE)' },
  { id: 'SO', label: 'SUDOESTE (SO)' }
];

const TOTAL_ROUNDS = 10;
const ROUND_TIME = 10; // seconds

let currentRound = 0;
let score = 0;
let currentTarget = null;
let timerInterval = null;
let timeLeft = 0;
let isAnimating = false;

window.startGame = function() {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';
  document.getElementById('game-over-screen').classList.remove('active');
  
  currentRound = 0;
  score = 0;
  updateStats();
  
  nextRound();
};

function nextRound() {
  if (currentRound >= TOTAL_ROUNDS) {
    endGame();
    return;
  }
  
  currentRound++;
  isAnimating = false;
  
  // Pick random direction different from last one
  let newTarget;
  do {
    newTarget = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  } while (currentTarget && newTarget.id === currentTarget.id);
  
  currentTarget = newTarget;
  document.getElementById('target-direction').textContent = currentTarget.label;
  
  startTimer();
  updateStats();
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = ROUND_TIME;
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleDirectionClick(null, true); // Timeout
    }
  }, 1000);
}

function updateTimerDisplay() {
  const display = document.getElementById('timer-display');
  display.textContent = `${timeLeft}s`;
  if (timeLeft <= 3) {
    display.style.color = 'var(--error)';
  } else {
    display.style.color = 'var(--gold)';
  }
}

function updateStats() {
  document.getElementById('round-display').textContent = `${currentRound}/${TOTAL_ROUNDS}`;
  document.getElementById('score-display').textContent = score;
}

window.handleDirectionClick = function(clickedId, isTimeout = false) {
  if (isAnimating) return;
  
  clearInterval(timerInterval);
  isAnimating = true;
  
  const svg = document.getElementById('compass-svg');
  
  if (isTimeout || clickedId !== currentTarget.id) {
    // Wrong or timeout
    svg.classList.add('feedback-wrong');
    Toast.error(isTimeout ? 'Tempo esgotado!' : 'Direção Incorreta!', `O correto era ${currentTarget.label}.`);
  } else {
    // Correct
    svg.classList.add('feedback-correct');
    
    // Calculate points (max 100 per round, based on speed)
    // Formula: Base 50 + (timeLeft / ROUND_TIME) * 50
    let points = 50 + Math.floor((timeLeft / ROUND_TIME) * 50);
    score += points;
    Toast.success('Correto!', `+${points} pontos`);
  }
  
  updateStats();
  
  // Remove animation class after it finishes
  setTimeout(() => {
    svg.classList.remove('feedback-wrong');
    svg.classList.remove('feedback-correct');
    nextRound();
  }, 1000); // give 1 second delay between rounds
};

function endGame() {
  clearInterval(timerInterval);
  document.getElementById('game-over-screen').classList.add('active');
  document.getElementById('final-score').textContent = score;
  
  // Save results
  saveGameResult();
}

function saveGameResult() {
  const maxPossible = TOTAL_ROUNDS * 100;
  const pct = Math.round((score / maxPossible) * 100);
  
  const results = JSON.parse(localStorage.getItem('geoeduca_results') || '[]');
  const currentUser = JSON.parse(localStorage.getItem('geoeduca_user') || '{}');
  
  results.push({
    gameId: 'rosa_ventos',
    aluno: currentUser.nome || 'Aluno Anônimo',
    sala: currentUser.salaNome || 'Desconhecida',
    pontuacao: score,
    maxPontuacao: maxPossible,
    pct: pct,
    data: new Date().toISOString()
  });
  
  localStorage.setItem('geoeduca_results', JSON.stringify(results));
  console.log('Resultado salvo localmente:', results[results.length - 1]);
}
