import os
import re

css_path = r"c:\nvprojetpfe\pfee\fra\frontend\nutrition-frontend\src\app\acceuil\acceuil.css"

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Macro Ring colors
content = re.sub(
    r"background: conic-gradient\([^)]+\);",
    "background: conic-gradient(\n    var(--green-mid) 0% 40%,\n    var(--gold) 40% 65%,\n    var(--green-deep) 65% 100%\n  );",
    content
)

# 2. How section
content = content.replace(".how-header .section-title {\n  color: var(--white);\n}", ".how-header .section-title {\n  color: var(--green-deep);\n}")
content = content.replace("color: rgba(168, 213, 181, 0.2);", "color: rgba(46, 125, 50, 0.15);")
content = content.replace(".step-title {\n  font-family: var(--font-display);\n  font-size: 1.2rem;\n  color: var(--white);\n  margin-bottom: 12px;\n}", ".step-title {\n  font-family: var(--font-display);\n  font-size: 1.2rem;\n  color: var(--green-deep);\n  margin-bottom: 12px;\n}")
content = content.replace("color: rgba(255, 255, 255, 0.65);", "color: var(--text-mid);")

# 3. Plans section
content = content.replace(".plans-header .section-title {\n  color: var(--white);\n}", ".plans-header .section-title {\n  color: var(--green-deep);\n}")
content = content.replace("background: rgba(255, 255, 255, 0.07);", "background: var(--bg-light);")
content = content.replace("color: rgba(255, 255, 255, 0.7);", "color: var(--text-mid);")
content = content.replace(".plan-card ul li::before {\n  content: '✓';\n  position: absolute;\n  left: 0;\n  color: var(--green-light);\n  font-weight: 700;\n}", ".plan-card ul li::before {\n  content: '✓';\n  position: absolute;\n  left: 0;\n  color: var(--green-mid);\n  font-weight: 700;\n}")
content = content.replace("color: var(--white);\n  text-align: center;\n  text-decoration: none;\n  font-size: 0.88rem;\n  font-weight: 600;\n  transition: all 0.2s;\n  font-family: var(--font-body);\n  cursor: pointer;", "color: var(--green-deep);\n  border-color: var(--green-deep);\n  text-align: center;\n  text-decoration: none;\n  font-size: 0.88rem;\n  font-weight: 600;\n  transition: all 0.2s;\n  font-family: var(--font-body);\n  cursor: pointer;")

# 4. Stats section
content = content.replace(".stat {\n  text-align: center;\n  color: var(--white);\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}", ".stat {\n  text-align: center;\n  color: var(--green-deep);\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}")
content = content.replace("color: var(--green-light);", "color: var(--gold);") # changes the huge numbers

# 5. Map info texts
content = content.replace(".map-info strong {\n  font-family: var(--font-display);\n  font-size: 1.15rem;\n  color: var(--white);\n}", ".map-info strong {\n  font-family: var(--font-display);\n  font-size: 1.15rem;\n  color: var(--green-deep);\n}")
content = content.replace("color: rgba(255, 255, 255, 0.55);", "color: var(--text-mid);")

with open(css_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated acceuil.css successfully.")
