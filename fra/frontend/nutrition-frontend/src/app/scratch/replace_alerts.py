import re
import os

files = [
    r"c:\Users\LENOVO\project\fra\frontend\nutrition-frontend\src\app\patient\patient.ts",
    r"c:\Users\LENOVO\project\fra\frontend\nutrition-frontend\src\app\rdvp\rdvp.ts",
    r"c:\Users\LENOVO\project\fra\frontend\nutrition-frontend\src\app\profil\profil.ts"
]

def replace_alerts(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, does not exist.")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # We want to replace alert('something') with this.showNotif('something', type)
    # determine type based on content of the alert
    
    def replacer(match):
        msg = match.group(1)
        type_str = 'error'
        if 'succès' in msg.lower() or 'modfier' in msg.lower() or '✅' in msg:
            type_str = 'success'
        
        # Remove emojis for cleaner notifs
        msg_clean = msg.replace('⚠️ ', '').replace('✅ ', '').replace('❌ ', '')
        
        return f"this.showNotif({msg_clean}, '{type_str}')"
        
    new_content = re.sub(r"alert\((['\"].*?['\"])\)", replacer, content)
    
    # Also add the state variables and function to the class if not present
    if "showNotif(" not in new_content:
        # find the end of the class
        last_brace_idx = new_content.rfind('}')
        if last_brace_idx != -1:
            insertion = """
  // ── NOTIFICATIONS ─────────────────────────────────
  notifVisible = false;
  notifMessage = '';
  notifType = 'success';

  showNotif(msg: string, type: 'success' | 'error' | 'warning' = 'success') {
    this.notifMessage = msg;
    this.notifType = type;
    this.notifVisible = true;
    setTimeout(() => this.notifVisible = false, 3000);
  }
"""
            new_content = new_content[:last_brace_idx] + insertion + new_content[last_brace_idx:]
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Replaced alerts in {filepath}")

for f in files:
    replace_alerts(f)
