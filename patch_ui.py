import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('frontend/js/ui.js', 'r', encoding='utf-8') as f:
    text = f.read()

old_code = """    // Mobile Hamburger Button & Overlay
    if (!document.getElementById('mobile-menu-btn')) {
      const mobileBtn = document.createElement('button');
      mobileBtn.id = 'mobile-menu-btn';
      mobileBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`;
      document.body.appendChild(mobileBtn);
      
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-mobile-overlay';
      document.body.appendChild(overlay);

      mobileBtn.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden'; // prevent bg scroll
      });

      overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      });
    }"""

new_code = """    // Mobile Hamburger Button & Overlay
    let mobileBtn = document.getElementById('mobile-menu-btn');
    if (!mobileBtn) {
      mobileBtn = document.createElement('button');
      mobileBtn.id = 'mobile-menu-btn';
      mobileBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`;
      document.body.appendChild(mobileBtn);
    }
    
    let overlay = document.querySelector('.sidebar-mobile-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-mobile-overlay';
      document.body.appendChild(overlay);
    }

    mobileBtn.addEventListener('click', () => {
      sidebar.classList.add('mobile-open');
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden'; // prevent bg scroll
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    });"""

if old_code in text:
    text = text.replace(old_code, new_code)
    with open('frontend/js/ui.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print("SUCCESS")
else:
    print("NOT FOUND")
