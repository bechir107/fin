import os
import re

def update_file(path, replacements):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    # Also handle some regex if needed
    content = re.sub(r"font-family:\s*'Playfair Display',\s*serif;", "font-family: var(--font-display);", content)
    content = re.sub(r"font-family:\s*'DM Sans',\s*sans-serif;", "font-family: var(--font-body);", content)
    content = re.sub(r"font-family:\s*'Cormorant Garamond',\s*'Georgia',\s*serif;", "font-family: var(--font-display);", content)
    content = re.sub(r"font-family:\s*'Nunito',\s*'Helvetica Neue',\s*sans-serif;", "font-family: var(--font-body);", content)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {path}")

base_path = r"c:\nvprojetpfe\pfee\fra\frontend\nutrition-frontend\src\app"

# Acceuil CSS
acceuil_css = os.path.join(base_path, "acceuil", "acceuil.css")
acceuil_replacements = [
    ("background: var(--cream);", "background: transparent;"),
    ("background: var(--cream-dark);", "background: transparent;"),
    ("background: var(--white);", "background: var(--bg-card);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border: 1px solid var(--border-glass);"),
    ("color: var(--green-deep);", "color: var(--green-neon);"),
    ("color: var(--green-fresh);", "color: var(--green-teal);"),
    ("background: var(--green-deep);", "background: var(--bg-card);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border-top: 1px solid var(--border-glass);\n  border-bottom: 1px solid var(--border-glass);"),
    ("box-shadow: 0 30px 80px rgba(26, 61, 43, 0.13);", "box-shadow: 0 30px 80px rgba(0, 255, 135, 0.05);"),
    ("box-shadow: 0 20px 50px rgba(26, 61, 43, 0.1);", "box-shadow: 0 20px 50px rgba(0, 255, 135, 0.1);"),
    ("rgba(76,175,111,0.1)", "rgba(0,255,135,0.05)"),
    ("rgba(200,150,62,0.07)", "rgba(96,239,255,0.05)"),
    ("color: var(--text-dark);", "color: var(--text-dark);"), # Keep it but the variable changed
    ("background: var(--green-light);", "background: var(--green-glow);"),
    ("color: rgba(255, 255, 255, 0.9);", "color: var(--text-dark);"),
]

# Login CSS
login_css = os.path.join(base_path, "login", "login.css")
login_replacements = [
    ("background: var(--green-deep);", "background: transparent;"),
    ("background: var(--white);", "background: var(--bg-card);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border: 1px solid var(--border-glass);"),
    ("background: var(--cream);", "background: rgba(255,255,255,0.03);"),
    ("background: var(--green-mist);", "background: rgba(0,255,135,0.05);"),
    ("border: 0.5px solid var(--border-mid);", "border: 1px solid rgba(255,255,255,0.1);"),
    ("color: var(--text-dark);", "color: var(--text-dark);"),
    ("color: var(--text-mid);", "color: var(--text-mid);"),
]

def remove_root_block(content):
    return re.sub(r":root\s*{[^}]*}", "", content, flags=re.DOTALL)

def update_file_custom(path, replacements, custom_transformer=None):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    content = re.sub(r"font-family:\s*'Playfair Display',\s*serif;", "font-family: var(--font-display);", content)
    content = re.sub(r"font-family:\s*'DM Sans',\s*sans-serif;", "font-family: var(--font-body);", content)
    content = re.sub(r"font-family:\s*'Cormorant Garamond',\s*'Georgia',\s*serif;", "font-family: var(--font-display);", content)
    content = re.sub(r"font-family:\s*'Nunito',\s*'Helvetica Neue',\s*sans-serif;", "font-family: var(--font-body);", content)
    
    if custom_transformer:
        content = custom_transformer(content)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {path}")

update_file_custom(acceuil_css, acceuil_replacements)
update_file_custom(login_css, login_replacements, remove_root_block)

# Navbar and Footer if they exist
navbar_css = os.path.join(base_path, "shared", "navbar", "navbar.css")
footer_css = os.path.join(base_path, "shared", "footer", "footer.css")

if os.path.exists(navbar_css):
    update_file(navbar_css, [
        ("background: var(--white);", "background: var(--bg-dark);\n  border-bottom: 1px solid var(--border-glass);"),
        ("background: var(--cream);", "background: transparent;")
    ])

if os.path.exists(footer_css):
    update_file(footer_css, [
        ("background: var(--green-deep);", "background: var(--bg-darker);\n  border-top: 1px solid var(--border-glass);")
    ])

