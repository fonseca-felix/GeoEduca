import re

with open('frontend/aluno/dashboard.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Pattern to find the value and label divs
pattern = r'(<div class="dash-stat-body">\s*)(<div class="dash-stat-value" id="stat-[^"]+">[^<]+</div>)(\s*)(<div class="dash-stat-label">[^<]+</div>)(\s*</div>)'

# Swap group 2 (value) and group 4 (label)
def swap_order(match):
    return match.group(1) + match.group(4) + match.group(3) + match.group(2) + match.group(5)

text = re.sub(pattern, swap_order, text)

with open('frontend/aluno/dashboard.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
