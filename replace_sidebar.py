import re

with open('frontend/aluno/jogos.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace CSS
css_old = r'/\* Leaderboard Sidebar \*/.*?\.rank-score \{ font-size: 0\.75rem; color: var\(--color-text-muted\); \}'
css_new = '''/* Character Sidebar */
    .character-panel {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      padding: 1.5rem;
      position: sticky;
      top: 2rem;
      box-shadow: var(--shadow-sm);
    }
    .character-title {
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 0.5rem;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .character-desc {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      margin-bottom: 1.25rem;
      line-height: 1.4;
    }
    .character-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .char-option {
      background: var(--color-surface-2);
      border: 2px solid transparent;
      border-radius: var(--radius-md);
      padding: 0.5rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.2s;
    }
    .char-option img {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }
    .char-option span {
      font-size: 0.65rem;
      font-weight: 600;
      margin-top: 0.25rem;
      color: var(--color-text-muted);
      text-transform: capitalize;
    }
    .char-option:hover {
      background: rgba(204, 164, 59, 0.1);
    }
    .char-option.selected {
      border-color: var(--gold);
      background: rgba(204, 164, 59, 0.15);
    }
    .char-option.selected span {
      color: var(--gold);
    }
    .character-preview {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--color-surface-2);
      padding: 1rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }
    .character-preview img {
      width: 80px;
      height: 80px;
      object-fit: contain;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
      animation: floatChar 3s ease-in-out infinite;
    }
    @keyframes floatChar {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .char-speech {
      font-size: 0.75rem;
      color: var(--color-text-primary);
      background: var(--color-surface);
      padding: 0.75rem;
      border-radius: 12px;
      border-top-left-radius: 0;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      flex: 1;
      font-weight: 500;
      line-height: 1.4;
    }'''

html = re.sub(css_old, css_new, html, flags=re.DOTALL)

# Replace HTML
html_old = r'<!-- Leaderboard Section -->.*?</aside>'
html_new = '''<!-- Character Section -->
        <aside class="character-panel">
          <h3 class="character-title">
            <i class="fa-solid fa-user-astronaut"></i> Seu Ajudante
          </h3>
          <p class="character-desc">Escolha um personagem para te acompanhar e dar dicas durante os jogos!</p>
          <div class="character-grid" id="character-grid">
            <!-- Injected via JS -->
          </div>
          <div id="character-preview" class="character-preview" style="display:none;">
            <img id="char-img" src="" alt="Personagem" />
            <div id="char-speech" class="char-speech">Estou pronto para a aventura! Vamos nessa!</div>
          </div>
        </aside>'''
        
html = re.sub(html_old, html_new, html, flags=re.DOTALL)

with open('frontend/aluno/jogos.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated jogos.html')
