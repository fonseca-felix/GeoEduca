import glob

for f in glob.glob('frontend/master/*.html') + glob.glob('frontend/escola/*.html'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    if "document.body.insertAdjacentHTML('afterbegin'" in content:
        content = content.replace("document.body.insertAdjacentHTML('afterbegin'", "document.querySelector('.layout').insertAdjacentHTML('afterbegin'")
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print('Fixed sidebar injection in', f)
