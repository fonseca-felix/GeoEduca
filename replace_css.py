import re

with open('frontend/css/login.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace the #hero-globe rules
globe_css = """#hero-globe {
  position: absolute;
  bottom: -15vh;
  left: 50%;
  transform: translateX(-50%);
  width: 70vw;
  height: 70vw;
  max-width: 800px;
  max-height: 800px;
  z-index: 1;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: inset -20px -20px 50px rgba(0,0,0,0.9),
              inset 10px 10px 30px rgba(255,255,255,0.1),
              0 0 50px rgba(204,164,59,0.2);
  pointer-events: none;
}

.globe-texture {
  width: 200%;
  height: 100%;
  background: url('../assets/word-texture.jfif') repeat-x left center / auto 100%;
  animation: spinGlobe 40s linear infinite;
  transform-style: preserve-3d;
}

@keyframes spinGlobe {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.globe-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, transparent 30%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,1) 100%);
  pointer-events: none;
}"""

css = re.sub(r'#hero-globe\s*{.*?#hero-globe img\s*{.*?}', globe_css, css, flags=re.DOTALL)

with open('frontend/css/login.css', 'w', encoding='utf-8') as f:
    f.write(css)
print("Updated login.css")
