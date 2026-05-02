import os

html_snippet = """

  <!-- Notification Toast -->
  <div class="notif-toast" [class.show]="notifVisible" [class.error]="notifType === 'error'" [class.warning]="notifType === 'warning'">
    <span class="notif-icon">
      {{ notifType === 'error' ? '❌' : (notifType === 'warning' ? '⚠️' : '✅') }}
    </span>
    <span class="notif-text">{{ notifMessage }}</span>
  </div>
"""

css_snippet = """
/* ── Notification Toast ───────────────────────── */
.notif-toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #ffffff;
  color: #1e293b;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-family: 'Plus Jakarta Sans', sans-serif;
  transform: translateY(100px);
  opacity: 0;
  visibility: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 10000;
  border-left: 5px solid #10b981;
}
.notif-toast.show {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}
.notif-toast.error { border-left-color: #ef4444; }
.notif-toast.warning { border-left-color: #f59e0b; }
"""

components = ['patient', 'rdvp', 'profil']
base_path = r"c:\Users\LENOVO\project\fra\frontend\nutrition-frontend\src\app"

for comp in components:
    html_path = os.path.join(base_path, comp, f"{comp}.html")
    css_path = os.path.join(base_path, comp, f"{comp}.css")
    
    if os.path.exists(html_path):
        with open(html_path, 'r', encoding='utf-8') as f:
            html = f.read()
        if "notif-toast" not in html:
            with open(html_path, 'a', encoding='utf-8') as f:
                f.write(html_snippet)
                
    if os.path.exists(css_path):
        with open(css_path, 'r', encoding='utf-8') as f:
            css = f.read()
        if "notif-toast" not in css:
            with open(css_path, 'a', encoding='utf-8') as f:
                f.write(css_snippet)

print("Injected HTML and CSS for notif-toast!")
