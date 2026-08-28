import re

with open('frontend/js/aluno/jogos.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace renderLeaderboard call
js = js.replace('renderLeaderboard();', 'renderCharacterSelector();')

# Replace the renderLeaderboard function definition
js_old = r'async function renderLeaderboard\(\) \{.*?\}\s*\}'
js_new = '''function renderCharacterSelector() {
    const grid = document.getElementById('character-grid');
    const preview = document.getElementById('character-preview');
    const charImg = document.getElementById('char-img');
    
    if (!grid) return;

    const chars = [
      { id: 'maloka', name: 'Maloka' },
      { id: 'escot', name: 'Escoteiro' },
      { id: 'terno', name: 'Terno' },
      { id: 'brasa', name: 'Brasil' },
      { id: 'classic', name: 'Clássico' },
      { id: 'bone', name: 'Boné' }
    ];
    
    // Load saved character or default
    let selectedChar = localStorage.getItem('geoeduca_character') || 'maloka';

    function updatePreview(id) {
      charImg.src = `../assets/personagens/${id}_1.webp`;
      preview.style.display = 'flex';
      
      // Update UI selection
      document.querySelectorAll('.char-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === id);
      });
    }

    grid.innerHTML = chars.map(c => `
      <div class="char-option ${c.id === selectedChar ? 'selected' : ''}" data-id="${c.id}">
        <img src="../assets/personagens/${c.id}_1.webp" alt="${c.name}" />
        <span>${c.name}</span>
      </div>
    `).join('');

    // Attach click events
    document.querySelectorAll('.char-option').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        selectedChar = id;
        localStorage.setItem('geoeduca_character', id);
        updatePreview(id);
      });
    });

    // Initial preview
    if (selectedChar) {
      updatePreview(selectedChar);
    }
  }'''

js = re.sub(js_old, js_new, js, flags=re.DOTALL)

with open('frontend/js/aluno/jogos.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Updated jogos.js')
