import glob
import sys
sys.stdout.reconfigure(encoding='utf-8')

for f_path in glob.glob('frontend/**/*.html', recursive=True):
    with open(f_path, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()
    if '\\n</head>' in text:
        text = text.replace('\\n</head>', '\n</head>')
        with open(f_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Fixed {f_path}")
print('DONE')
