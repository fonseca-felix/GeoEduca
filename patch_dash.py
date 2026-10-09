import re

with open('frontend/aluno/dashboard.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace XP TOTAL
xp_target = '''              <div class="dash-stat-body">
                <div class="dash-stat-value" id="stat-xp">0</div>
                <div class="dash-stat-label">XP TOTAL</div>
              </div>'''
xp_replace = '''              <div class="dash-stat-body">
                <div class="dash-stat-label">XP TOTAL</div>
                <div class="dash-stat-value" id="stat-xp">0</div>
              </div>'''
text = text.replace(xp_target, xp_replace)

# Replace NIVEL ATUAL
nivel_target = '''              <div class="dash-stat-body">
                <div class="dash-stat-value" id="stat-level">1</div>
                <div class="dash-stat-label">NÍVEL ATUAL</div>
              </div>'''
nivel_replace = '''              <div class="dash-stat-body">
                <div class="dash-stat-label">NÍVEL ATUAL</div>
                <div class="dash-stat-value" id="stat-level">1</div>
              </div>'''
text = text.replace(nivel_target, nivel_replace)

# Replace PENDÊNCIAS
pend_target = '''              <div class="dash-stat-body">
                <div class="dash-stat-value" id="stat-pend">0</div>
                <div class="dash-stat-label">PENDÊNCIAS</div>
              </div>'''
pend_replace = '''              <div class="dash-stat-body">
                <div class="dash-stat-label">PENDÊNCIAS</div>
                <div class="dash-stat-value" id="stat-pend">0</div>
              </div>'''
text = text.replace(pend_target, pend_replace)


with open('frontend/aluno/dashboard.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
