import os
import re

# 1. Update app.py
app_path = r"c:\nvprojetpfe\pfee\fra\app.py"
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

old_accesp = """@app.route('/accesP/<email>', methods=['GET'])
def accesP(email):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT email, password FROM patient WHERE email=%s", (email,))
    user = cursor.fetchone()
    cursor.close()
    db.close()

    # ✅ تحقق أولاً إذا المريض موجود
    if user is None:
        return jsonify({"message": "Patient introuvable"}), 404

    send_email(user[0], user[1])
    return jsonify({"message": "Email envoyé"}), 200

def send_email(email, password):
    msg.body = f\"\"\"
    Email : {email}
    Mot de passe : {password}  ← هذا جاي من قاعدة البيانات مباشرة
    \"\"\"
    mail.send(msg)"""

new_accesp = """@app.route('/accesP/<email>', methods=['GET'])
def accesP(email):
    db = get_db()
    cursor = db.cursor()
    # Check patient
    cursor.execute("SELECT email, password FROM patient WHERE email=%s", (email,))
    user = cursor.fetchone()
    
    # Check nutritionist if not patient
    if user is None:
        cursor.execute("SELECT email, password FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()

    cursor.close()
    db.close()

    if user is None:
        return jsonify({"message": "Email introuvable"}), 404

    try:
        send_email(user[0], user[1])
        return jsonify({"message": "Un e-mail vous a été envoyé avec votre mot de passe."}), 200
    except Exception as e:
        print(f"Erreur d'envoi d'email: {e}")
        # Fallback if SMTP is not configured in Flask
        return jsonify({"message": f"Email non configuré. Votre mot de passe est: {user[1]}"}), 200

def send_email(email, password):
    msg = Message("Récupération de mot de passe", sender="contact@nature-energie.com", recipients=[email])
    msg.body = f\"\"\"
    Bonjour,

    Voici vos identifiants de connexion :
    Email : {email}
    Mot de passe : {password}
    
    L'équipe Nature & Énergie.
    \"\"\"
    mail.send(msg)"""

app_content = app_content.replace(old_accesp, new_accesp)
with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_content)


# 2. Update login.html
html_path = r"c:\nvprojetpfe\pfee\fra\frontend\nutrition-frontend\src\app\login\login.html"
with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

# Add link
options_old = """          <div class="options">
            <label class="check-label">
              <div class="custom-cb" [class.checked]="rememberMe" (click)="rememberMe = !rememberMe">
                <svg *ngIf="rememberMe" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </div>
              <span>Se souvenir de moi</span>
            </label>
          </div>"""

options_new = """          <div class="options">
            <label class="check-label">
              <div class="custom-cb" [class.checked]="rememberMe" (click)="rememberMe = !rememberMe">
                <svg *ngIf="rememberMe" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <span>Se souvenir de moi</span>
            </label>
            <a class="forgot-pwd" (click)="showForgotPwd = true" style="cursor:pointer; color:var(--green-deep); font-weight:600; font-size:0.85rem;">Mot de passe oublié ?</a>
          </div>"""
html_content = html_content.replace(options_old, options_new)

# Add Modal
modal_code = """

  <!-- Forgot Password Modal -->
  <div class="modal-overlay" *ngIf="showForgotPwd">
    <div class="modal">
      <div class="modal__icon" style="background:#E3F2FD; color:#1976D2;">
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <h2 class="modal__title">Mot de passe oublié</h2>
      <p class="modal__body" *ngIf="!forgotPwdMsg">Veuillez entrer votre e-mail pour recevoir votre mot de passe.</p>
      <p class="modal__body" *ngIf="forgotPwdMsg" style="color:var(--green-deep); font-weight:bold;">{{ forgotPwdMsg }}</p>
      
      <input type="email" [(ngModel)]="forgotEmail" placeholder="votre@email.com" class="inp" style="width:100%; padding:12px; margin-bottom:16px; border:1px solid #ccc; border-radius:8px; font-family:inherit;" *ngIf="!forgotPwdMsg"/>
      
      <button class="modal__btn" style="background:var(--green-deep); margin-bottom:8px;" (click)="sendForgotPassword()" *ngIf="!forgotPwdMsg" [disabled]="!forgotEmail || forgotLoading">
        {{ forgotLoading ? 'Envoi...' : 'Envoyer' }}
      </button>
      <button class="modal__btn" style="background:#eee; color:#333;" (click)="closeForgotPwd()">Fermer</button>
    </div>
  </div>
"""

if "Forgot Password Modal" not in html_content:
    html_content += modal_code

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)


# 3. Update login.ts
ts_path = r"c:\nvprojetpfe\pfee\fra\frontend\nutrition-frontend\src\app\login\login.ts"
with open(ts_path, "r", encoding="utf-8") as f:
    ts_content = f.read()

if "showForgotPwd = false;" not in ts_content:
    # Insert variables
    ts_content = ts_content.replace(
        "password     = '';",
        "password     = '';\n  showForgotPwd = false;\n  forgotEmail   = '';\n  forgotPwdMsg  = '';\n  forgotLoading = false;"
    )
    
    # Insert methods
    methods_code = """
  closeForgotPwd(): void {
    this.showForgotPwd = false;
    this.forgotEmail = '';
    this.forgotPwdMsg = '';
    this.forgotLoading = false;
    this.cdr.detectChanges();
  }

  sendForgotPassword(): void {
    if (!this.forgotEmail) return;
    this.forgotLoading = true;
    this.cdr.detectChanges();
    this.service.accesP(this.forgotEmail).subscribe({
      next: (res: any) => {
        this.forgotLoading = false;
        this.forgotPwdMsg = res.message;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.forgotLoading = false;
        this.forgotPwdMsg = err.error?.message ?? 'Erreur lors de la récupération.';
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {"""
    ts_content = ts_content.replace("  onSubmit(): void {", methods_code)

with open(ts_path, "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Forgot Password feature added successfully.")
