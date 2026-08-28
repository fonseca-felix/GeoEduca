import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the head
head_match = re.search(r'(<head>.*?</head>)', content, re.DOTALL)
head = head_match.group(1)

# Modify head to include GSAP and new CSS
gsap_scripts = """  <!-- GSAP -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
</head>"""
head = head.replace('</head>', gsap_scripts)

# Find scripts at the bottom
scripts_match = re.search(r'(<script src="js/api\.js">.*?)</body>', content, re.DOTALL)
scripts = scripts_match.group(1) if scripts_match else ""

# Extract login form inner HTML (from <div class="login-form-container"> up to </div> right before scripts)
form_match = re.search(r'(<div class="login-form-container">.*?</div>\s*</div>\s*</div>)', content, re.DOTALL)
login_form = form_match.group(1) if form_match else ""

# Extract brand info if needed
brand_svg = """<svg class="login-brand-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px; margin-right: 8px; color: var(--gold);">
          <circle cx="18" cy="18" r="17" stroke="currentColor" stroke-width="1.5"/>
          <ellipse cx="18" cy="18" rx="8" ry="17" stroke="currentColor" stroke-width="1.5"/>
          <line x1="1" y1="18" x2="35" y2="18" stroke="currentColor" stroke-width="1.5"/>
          <line x1="3" y1="11" x2="33" y2="11" stroke="currentColor" stroke-width="1"/>
          <line x1="3" y1="25" x2="33" y2="25" stroke="currentColor" stroke-width="1"/>
        </svg>"""

new_body = f"""<body>

<div id="parallax-wrapper">
  
  <!-- Fixed Background -->
  <div class="bg-fixed">
    <!-- Starry background using the existing canvas logic -->
    <canvas id="bg-canvas"></canvas>
    
    <!-- The Globe Image -->
    <div id="hero-globe">
      <img src="assets/earth.png" alt="Globo Terrestre">
    </div>
  </div>

  <header class="main-header">
    <div class="brand">
      {brand_svg}
      <span>GeoEduca</span>
    </div>
  </header>

  <!-- Scroll Sections -->
  <main class="scroll-content">
    
    <!-- Section 1: Hero -->
    <section class="sec-hero">
      <div class="hero-content">
        <h1 class="hero-title">
          Explorando o mundo<br>
          através da <span class="highlight">geografia</span>
        </h1>
        <p class="hero-subtitle">
          Plataforma educacional completa para professores gerenciarem atividades,
          quizzes e provas — e alunos aprenderem de forma interativa.
        </p>
        <button id="btn-start-scroll" class="btn btn-primary btn-explore">Comece a explorar <i class="fa-solid fa-arrow-down" style="margin-left: 8px;"></i></button>
      </div>
    </section>

    <!-- Section 2: Features -->
    <section class="sec-features">
      <div class="features-wrapper">
        <div class="f-card c-1">
          <span class="f-num">01 / CONTINENTES</span>
          <h2>Quizzes interativos</h2>
          <p>Perguntas geradas por tema, região e nível de dificuldade. Feedback imediato e ranking da turma a cada rodada.</p>
        </div>
        <div class="f-card c-2">
          <span class="f-num">02 / OCEANOS</span>
          <h2>Provas digitais</h2>
          <p>Monte avaliações completas em minutos, aplique com tempo cronometrado e receba a correção automática.</p>
        </div>
        <div class="f-card c-3">
          <span class="f-num">03 / ATMOSFERA</span>
          <h2>Jogos de geografia</h2>
          <p>Mapas, capitais, relevo e clima em desafios que prendem a atenção da turma do primeiro ao último minuto.</p>
        </div>
      </div>
    </section>

    <!-- Section 3: Login -->
    <section class="sec-login">
      <div class="login-box-wrapper">
        <div class="login-theme-toggle" style="position: absolute; top: 16px; right: 16px; z-index: 10;">
          <button class="theme-toggle" id="login-theme-toggle" aria-label="Alternar tema">
            <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
        </div>
{login_form}
      </div>
    </section>

  </main>

</div>

{scripts}

<script>
  // Wait for DOM
  document.addEventListener("DOMContentLoaded", (event) => {{
    gsap.registerPlugin(ScrollTrigger);

    // Setup initial state
    gsap.set('#hero-globe img', {{ scale: 1 }});
    gsap.set('.f-card', {{ opacity: 0, x: -50 }}); // Cards start hidden and offset

    // Define mm for responsiveness
    let mm = gsap.matchMedia();

    mm.add("(min-width: 800px)", () => {{
      // Desktop Animations
      
      // Hero section globe animation (Globe moves up and right)
      gsap.to('#hero-globe', {{
        scrollTrigger: {{
          trigger: '.sec-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }},
        y: '-10vh',
        x: '25vw',
        scale: 1.5
      }});

      // Features animation - Pinning the section
      const tlFeatures = gsap.timeline({{
        scrollTrigger: {{
          trigger: '.sec-features',
          start: 'top top',
          end: '+=200%', // Pin for 200% of viewport height
          pin: true,
          scrub: 1
        }}
      }});

      // Fade in and slide up each card sequentially
      tlFeatures
        .to('.c-1', {{ opacity: 1, x: 0, duration: 1 }})
        .to('.c-2', {{ opacity: 1, x: 0, duration: 1 }}, "+=0.5")
        .to('.c-3', {{ opacity: 1, x: 0, duration: 1 }}, "+=0.5");

      // Login section globe animation (Globe moves center and fades out slightly)
      gsap.to('#hero-globe', {{
        scrollTrigger: {{
          trigger: '.sec-login',
          start: 'top bottom',
          end: 'center center',
          scrub: 1
        }},
        y: '0',
        x: '0',
        scale: 1,
        opacity: 0.15
      }});
    }});

    // Button to start scrolling
    document.getElementById('btn-start-scroll')?.addEventListener('click', () => {{
      window.scrollTo({{ top: window.innerHeight, behavior: 'smooth' }});
    }});
  }});
</script>

</body>"""

new_content = f"<!DOCTYPE html>\n<html lang=\"pt-BR\">\n{head}\n{new_body}\n</html>"

with open('frontend/index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Updated index.html")
