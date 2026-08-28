import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_bg = """<!-- Fixed Background -->
  <div class="bg-fixed">
    <div style="position:absolute;inset:0;background:url('assets/fundo.jfif') center/cover no-repeat; opacity:0.4;"></div>
    <canvas id="bg-canvas"></canvas>
    
    <!-- The Spinning Globe -->
    <div id="hero-globe">
      <div class="globe-texture"></div>
      <div class="globe-overlay"></div>
    </div>
  </div>"""

content = re.sub(r'<!-- Fixed Background -->.*?</div>\s*</div>', new_bg, content, flags=re.DOTALL)

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated index.html")
