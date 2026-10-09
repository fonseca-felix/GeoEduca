import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/aluno/dashboard.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix \n in HTML head
text = text.replace('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\\n</head>', '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n</head>')

# 1. Move dash-hero out of dash-main-col
# dash-hero block
hero_start = text.find('<!-- Hero -->')
stats_start = text.find('<!-- Quick Stats -->')
if hero_start != -1 and stats_start != -1:
    hero_block = text[hero_start:stats_start]
    text = text.replace(hero_block, '')
    text = text.replace('<div class="dash-grid">', f'{hero_block}\n      <div class="dash-grid">')

# 2. Add wrap for BrazilGuessr and Rota 27
bg_start = text.find('<!-- BrazilGuessr Card -->')
side_col_end = text.find('</div><!-- /dash-side-col -->')
if bg_start != -1 and side_col_end != -1:
    cards_block = text[bg_start:side_col_end]
    new_cards_block = '<div class="side-games-wrapper">\n          ' + cards_block.replace('\n', '\n          ') + '\n          </div>'
    text = text.replace(cards_block, new_cards_block)

# 3. Add CSS for side-games-wrapper and student-games grid
css_add = '''
    .side-games-wrapper {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    @media (max-width: 1100px) {
      .side-games-wrapper {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
    }
'''
text = text.replace('/* ── Responsive ──────────────────────────────────────── */', css_add + '\n    /* ── Responsive ──────────────────────────────────────── */')

# 4. Fix student-games for mobile to 2 columns
text = text.replace('#student-games { grid-template-columns: 1fr; }', '#student-games { grid-template-columns: 1fr 1fr; }')

with open('frontend/aluno/dashboard.html', 'w', encoding='utf-8') as f:
    f.write(text)
print("SUCCESS")
