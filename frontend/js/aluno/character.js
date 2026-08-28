// ==========================================
// CHARACTER HELPER - GEOEDUCA
// Shows the selected character during games
// with reactions and speech bubbles
// ==========================================

const GeoCharacter = (() => {
  const CHARS = {
    maloka:  { name: 'Maloka',    prefix: 'maloka' },
    escot:   { name: 'Escoteiro', prefix: 'escot' },
    terno:   { name: 'Terno',     prefix: 'terno' },
    brasa:   { name: 'Brasil',    prefix: 'brasa' },
    classic: { name: 'Clássico',  prefix: 'classic' },
    bone:    { name: 'Boné',      prefix: 'bone' }
  };

  // Poses: _1 = neutral, _2 = happy, _3 = sad, _4 = thinking
  const POSES = { neutral: 1, happy: 2, sad: 3, thinking: 4 };

  const REACTIONS = {
    welcome: [
      'Bora jogar! Eu vou te ajudar nessa!',
      'E aí, preparado? Vamos arrasar!',
      'Fala, parceiro! Vamos nessa aventura!'
    ],
    correct: [
      'Isso aí! Mandou bem demais!',
      'Boa! Tá voando, hein!',
      'Acertou em cheio! Continua assim!',
      'Show! Sabia que você ia acertar!',
      'Perfeito! Você é fera!'
    ],
    wrong: [
      'Ih, errou... Mas não desiste não!',
      'Quase! Na próxima você acerta!',
      'Eita... Bola pra frente, vamos!',
      'Relaxa, errar faz parte. Tenta de novo!'
    ],
    hint: [
      'Hmm... Pensa bem antes de responder!',
      'Calma, lê com atenção...',
      'Dica: elimina as opções que não fazem sentido!',
      'Respira e pensa... Você sabe essa!'
    ],
    finish: [
      'Parabéns! Você completou o jogo!',
      'Arrasou! Foi incrível jogar com você!',
      'GG! Bora jogar de novo?'
    ],
    timeout: [
      'O tempo acabou! Mas foi legal, hein!',
      'Ih, acabou o tempo... Tenta de novo!',
      'Tempo esgotado! Na próxima vai ser melhor!'
    ]
  };

  const PAGE_INSTRUCTIONS = {
    'memoria_biomas.html': 'Jogo da memória! Vire as cartas e encontre os pares: bioma com a sua característica correspondente.',
    'ordenando_regioes.html': 'Arraste e solte os estados para as regiões corretas do Brasil.',
    'caca_palavras.html': 'Encontre as palavras escondidas nessa sopa de letras! Procure na horizontal e vertical.',
    'bandeira_estado.html': 'Olhe para a bandeira e adivinhe qual é o estado correto.',
    'complete_capital.html': 'Complete a lacuna com a capital certa do estado. Digite ou escolha a correta!',
    'desafio_posicao.html': 'Clique na região correta do mapa onde o estado se localiza.',
    'fronteiras_cronometro.html': 'Rápido! Adivinhe quais estados fazem fronteira antes que o tempo acabe.',
    'hidrografias.html': 'Responda as perguntas sobre os rios e hidrografia do Brasil.',
    'missao_brasil.html': 'Uma missão completa pelo Brasil! Siga as instruções e cumpra as tarefas.',
    'rota27.html': 'Trace a rota correta de viagem passando por todos os estados.',
    'quiz.html': 'Teste seus conhecimentos em um Quiz de Geografia. Escolha a alternativa correta.'
  };

  function getCharId() {
    return localStorage.getItem('geoeduca_character') || 'maloka';
  }

  function getImagePath(pose) {
    const charId = getCharId();
    const c = CHARS[charId] || CHARS.maloka;
    const poseNum = POSES[pose] || 1;
    return `../assets/personagens/${c.prefix}_${poseNum}.webp`;
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Inject the character widget into a container
  function mount(parentSelector, customInstruction) {
    const parent = document.querySelector(parentSelector);
    if (!parent) return;

    // Remove existing
    const existing = document.getElementById('geo-char-widget');
    if (existing) existing.remove();

    const widget = document.createElement('div');
    widget.id = 'geo-char-widget';
    widget.innerHTML = `
      <img id="geo-char-img" src="${getImagePath('neutral')}" alt="Personagem" />
      <div id="geo-char-bubble" class="geo-char-bubble"></div>
    `;
    parent.prepend(widget);

    // Inject styles if not present
    if (!document.getElementById('geo-char-styles')) {
      const style = document.createElement('style');
      style.id = 'geo-char-styles';
      style.textContent = `
        #geo-char-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          pointer-events: none;
          display: flex;
          flex-direction: row-reverse;
          align-items: flex-end;
          gap: 8px;
          padding: 0;
          margin: 0;
        }
        #geo-char-img {
          width: 72px;
          height: 72px;
          object-fit: contain;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.25));
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }
        #geo-char-img.bounce {
          animation: charBounce 0.5s ease;
        }
        @keyframes charBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-10px) scale(1.05); }
          60% { transform: translateY(-3px) scale(1.02); }
        }
        #geo-char-img.shake {
          animation: charShake 0.5s ease;
        }
        @keyframes charShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px) rotate(-3deg); }
          40% { transform: translateX(5px) rotate(3deg); }
          60% { transform: translateX(-3px) rotate(-1deg); }
          80% { transform: translateX(3px) rotate(1deg); }
        }
        .geo-char-bubble {
          background: var(--color-surface, #fff);
          color: var(--color-text-primary, #0B0A32);
          border: 1px solid var(--color-border, #E0DDD8);
          border-radius: 12px;
          border-bottom-right-radius: 0;
          padding: 10px 14px;
          font-size: 0.8rem;
          line-height: 1.4;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-width: 280px;
          opacity: 0;
          transform: translateY(5px);
          transition: opacity 0.3s, transform 0.3s;
        }
        .geo-char-bubble.show {
          opacity: 1;
          transform: translateY(0);
        }
      `;
      document.head.appendChild(style);
    }

    // Show welcome message
    react('welcome', customInstruction);
  }

  function react(type, customMsg) {
    const img = document.getElementById('geo-char-img');
    const bubble = document.getElementById('geo-char-bubble');
    if (!img || !bubble) return;

    let pose = 'neutral';
    let anim = '';

    switch (type) {
      case 'correct':
        pose = 'happy';
        anim = 'bounce';
        break;
      case 'wrong':
        pose = 'sad';
        anim = 'shake';
        break;
      case 'hint':
      case 'thinking':
        pose = 'thinking';
        break;
      case 'finish':
        pose = 'happy';
        anim = 'bounce';
        break;
      case 'timeout':
        pose = 'sad';
        anim = 'shake';
        break;
      case 'welcome':
        pose = 'neutral';
        anim = 'bounce';
        break;
      default:
        pose = 'neutral';
    }

    img.src = getImagePath(pose);

    // Trigger animation
    if (anim) {
      img.classList.remove('bounce', 'shake');
      void img.offsetWidth; // Force reflow
      img.classList.add(anim);
    }

    const msg = customMsg || randomFrom(REACTIONS[type] || REACTIONS.welcome);
    bubble.textContent = msg;
    bubble.classList.remove('show');
    requestAnimationFrame(() => {
      bubble.classList.add('show');
    });
  }

  // Hook into Toast globally if it exists, to automatically react to success/error messages
  const originalToast = window.Toast ? window.Toast.fire : null;
  if (originalToast) {
    window.Toast.fire = function(options) {
      if (options && options.icon === 'success') react('correct');
      if (options && options.icon === 'error') react('wrong');
      return originalToast.apply(this, arguments);
    };
  }

  // Hook into generic functions if available (some standalone games use feedback-msg element)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.id === 'feedback-msg' || mutation.target.id === 'gfb') {
        const text = mutation.target.textContent.toLowerCase();
        if (text.includes('correto') || text.includes('parab') || text.includes('acertou')) {
          react('correct');
        } else if (text.includes('incorreto') || text.includes('errado') || text.includes('errou')) {
          react('wrong');
        }
      }
    });
  });

  window.addEventListener('load', () => {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    
    // Auto mount on standalone game pages
    if (window.location.pathname.includes('.html') && !window.location.pathname.includes('jogos.html') && !window.location.pathname.includes('ranking.html') && document.querySelector('.app-main')) {
      const main = document.querySelector('.app-main');
      const charWrapper = document.createElement('div');
      charWrapper.id = 'geo-char-wrapper';
      const header = main.querySelector('header');
      if (header) {
        header.insertAdjacentElement('afterend', charWrapper);
      } else {
        main.prepend(charWrapper);
      }
      
      const fileName = window.location.pathname.split('/').pop();
      const instruction = PAGE_INSTRUCTIONS[fileName] || null;
      mount('#geo-char-wrapper', instruction);
    }
  });

  return { mount, react, getCharId, getImagePath };
})();

// Export for use in other scripts
window.GeoCharacter = GeoCharacter;
