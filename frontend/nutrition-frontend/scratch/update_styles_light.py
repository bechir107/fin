import os
import re

base_path = r"c:\nvprojetpfe\pfee\fra\frontend\nutrition-frontend\src\app"

def clean_dark_mode(path):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove backdrop-filter lines
    content = re.sub(r"\s*backdrop-filter:\s*blur\(16px\);", "", content)
    content = re.sub(r"\s*-webkit-backdrop-filter:\s*blur\(16px\);", "", content)
    
    # Replace border-glass with border-subtle
    content = content.replace("var(--border-glass)", "var(--border-subtle)")
    
    # Replace bg-card dark shadow with light shadow
    content = content.replace("box-shadow: 0 30px 80px rgba(0, 255, 135, 0.05);", "box-shadow: 0 20px 40px rgba(0,0,0,0.05);")
    content = content.replace("box-shadow: 0 20px 50px rgba(0, 255, 135, 0.1);", "box-shadow: 0 20px 40px rgba(0,0,0,0.08);")
    
    # Replace transparent backgrounds on sections to light backgrounds
    content = content.replace("background: transparent;", "background: var(--bg-light);")
    
    # Replace green neon/teal with deep/mid
    content = content.replace("color: var(--green-neon);", "color: var(--green-deep);")
    content = content.replace("color: var(--green-teal);", "color: var(--green-mid);")
    content = content.replace("rgba(0,255,135,0.05)", "rgba(16, 185, 129, 0.08)")
    content = content.replace("rgba(96,239,255,0.05)", "rgba(245, 158, 11, 0.08)")
    content = content.replace("background: var(--green-glow);", "background: var(--green-light);")
    
    # Text colors
    content = content.replace("color: rgba(255, 255, 255, 0.9);", "color: var(--text-dark);")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {path}")

# Apply to acceuil, navbar, footer
clean_dark_mode(os.path.join(base_path, "acceuil", "acceuil.css"))
clean_dark_mode(os.path.join(base_path, "shared", "navbar", "navbar.css"))
clean_dark_mode(os.path.join(base_path, "shared", "footer", "footer.css"))
