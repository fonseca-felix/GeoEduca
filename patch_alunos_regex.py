import re

with open('backend/src/routes/alunos.js', 'r', encoding='utf-8') as f:
    text = f.read()

# We only want to remove it from POST / and PUT /:id
# BUT we want to KEEP it in PUT /me/password

# Find where PUT /me/password starts
me_idx = text.find('/me/password')

if me_idx != -1:
    before = text[:me_idx]
    after = text[me_idx:]
    
    # Remove all passwordRegex blocks in the `before` section
    before = re.sub(r'[ \t]*const passwordRegex = /[^/]+/;[ \t]*\n[ \t]*if \(!passwordRegex\.test\(senha\)\) \{[ \t]*\n[ \t]*return res\.status\(400\)\.json\(\{ error: [^}]+\} \);?[ \t]*\n[ \t]*\}[ \t]*\n?', '', before, flags=re.DOTALL)
    
    # Also catch cases where it might use double quotes or different spacing
    before = re.sub(r'[ \t]*const passwordRegex = /[^/]+/;[ \t]*\n[ \t]*if \(!passwordRegex\.test\(senha\)\) \{.*?\}[ \t]*\n?', '', before, flags=re.DOTALL)
    
    text = before + after

with open('backend/src/routes/alunos.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
