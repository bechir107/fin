import os
import re

css_path = r"c:\nvprojetpfe\pfee\fra\frontend\nutrition-frontend\src\app\acceuil\acceuil.css"

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix btn-primary (Acceder a mon espace)
btn_primary_old = """.btn-primary {
  background: var(--bg-card);
  -webkit-
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--white);"""

btn_primary_new = """.btn-primary {
  background: var(--green-mid);
  color: var(--white);
  border: none;"""

content = content.replace(btn_primary_old, btn_primary_new)

# Fix btn-primary hover
content = content.replace(".btn-primary:hover {\n  background: var(--green-fresh);", ".btn-primary:hover {\n  background: var(--green-deep);")

# Fix map-placeholder visibility
map_old = """.map-placeholder {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);"""

map_new = """.map-placeholder {
  width: 100%;
  max-width: 420px;
  background: var(--bg-light);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);"""

content = content.replace(map_old, map_new)

with open(css_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated acceuil buttons and map successfully.")
