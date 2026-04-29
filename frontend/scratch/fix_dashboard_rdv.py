import os

# 1. Update dashboard.css
dash_path = r"c:\nvprojetpfe\pfee\fra\frontend\nutrition-frontend\src\app\dashboard\dashboard.css"
if os.path.exists(dash_path):
    with open(dash_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace("background: #1f2a37;", "background: var(--green-deep);")
    content = content.replace("background: #1e293b;", "background: var(--green-deep);") # SIDEBAR FIX area
    content = content.replace("background: #10b981;", "background: var(--gold);")
    content = content.replace("background: #374151;", "background: rgba(255, 255, 255, 0.1);")
    content = content.replace("background: red;", "background: var(--gold);")
    
    with open(dash_path, "w", encoding="utf-8") as f:
        f.write(content)


# 2. Update rdv.css
rdv_path = r"c:\nvprojetpfe\pfee\fra\frontend\nutrition-frontend\src\app\rdv\rdv.css"
if os.path.exists(rdv_path):
    with open(rdv_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Theming the root variables
    root_replacement = """:root {
  --ink:           var(--text-dark);
  --ink-soft:      var(--text-mid);
  --muted:         var(--text-muted);
  --white:         var(--white);
  --cream:         var(--bg-light);
  --surface:       var(--bg-card);
  --blue-deep:     var(--green-deep);
  --blue-mid:      var(--green-mid);
  --blue-soft:     rgba(76, 175, 80, 0.1);
  --blue-border:   rgba(76, 175, 80, 0.3);
  --green-deep:    var(--green-deep);
  --green-mid:     var(--green-mid);
  --green-soft:    var(--green-fresh);
  --green-pale:    rgba(46, 125, 50, 0.05);
  --green-border:  rgba(46, 125, 50, 0.2);
  --amber:         var(--gold);
  --amber-pale:    var(--gold-light);
  --amber-border:  #fde68a;
  --border:        var(--border-subtle);
  --border-hover:  #cbd5e1;"""
    
    import re
    # Replace the top of root
    content = re.sub(r":root \{[^}]*--border-hover:\s*#[0-9a-fA-F]+;", root_replacement, content, count=1)
    
    # Replace hardcoded blue background
    content = content.replace("rgba(37,99,235,0.055)", "rgba(46, 125, 50, 0.05)")
    content = content.replace("rgba(37,99,235,0.06)", "rgba(46, 125, 50, 0.05)")
    content = content.replace("rgba(37,99,235,0.32)", "rgba(46, 125, 50, 0.3)")
    content = content.replace("rgba(37,99,235,0.22)", "rgba(46, 125, 50, 0.2)")
    content = content.replace("rgba(37,99,235,0.28)", "rgba(46, 125, 50, 0.25)")
    content = content.replace("rgba(37,99,235,0.38)", "rgba(46, 125, 50, 0.35)")
    content = content.replace("rgba(37,99,235,0.3)", "rgba(46, 125, 50, 0.3)")
    
    # Replace #f0f5ff (blue light bg) to a soft green or just keep f7f9fc
    content = content.replace("#f0f5ff", "var(--bg-light)")
    content = content.replace("#f7f9fc", "var(--bg-light)")
    content = content.replace("#f0fdf4", "var(--bg-light)")
    
    # Linear gradient fixes
    content = content.replace("linear-gradient(135deg, var(--blue-mid), #1d4ed8)", "background: var(--green-mid)")
    content = content.replace("linear-gradient(135deg, #3b82f6, var(--blue-mid))", "background: var(--green-deep)")
    
    # Replace #1e293b in rdv.css sidebar fix if exists
    content = content.replace("background: #1e293b;", "background: var(--green-deep);")

    with open(rdv_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated dashboard.css and rdv.css successfully.")
