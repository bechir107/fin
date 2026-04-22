import os
import re

base_path = r"c:\nvprojetpfe\pfee\fra\frontend\nutrition-frontend\src\app\login"
html_path = os.path.join(base_path, "login.html")
css_path = os.path.join(base_path, "login.css")
ts_path = os.path.join(base_path, "login.ts")

# 1. Update HTML
with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

# Remove old err-box
err_box_code = """        <div class="err-box" *ngIf="errorMsg">
          <svg viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.4" />
            <path d="M10 6.5v4M10 12.5v1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <span>{{ errorMsg }}</span>
        </div>"""
html_content = html_content.replace(err_box_code, "")

# Append Modals to the end of the file
modals_html = """

  <!-- Error Modal -->
  <div class="modal-overlay" *ngIf="errorMsg">
    <div class="modal modal-error">
      <div class="modal__icon error-icon">
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <h2 class="modal__title">Erreur de connexion</h2>
      <p class="modal__body">{{ errorMsg }}</p>
      <button class="modal__btn error-btn" type="button" (click)="errorMsg = ''">Réessayer</button>
    </div>
  </div>

  <!-- Success Modal -->
  <div class="modal-overlay" *ngIf="successMsg">
    <div class="modal modal-success">
      <div class="modal__icon success-icon">
        <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <h2 class="modal__title">Connexion réussie</h2>
      <p class="modal__body">{{ successMsg }}</p>
      <div class="modal-loader"></div>
    </div>
  </div>
"""
if "modal-overlay" not in html_content:
    html_content += modals_html

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

# 2. Update CSS
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

modals_css = """
/* MODALS */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-card);
  padding: 40px;
  border-radius: 24px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  animation: fadeSlideUp 0.3s ease-out;
}

.modal__icon {
  width: 64px; height: 64px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}

.error-icon { background: #FFF3E0; color: #E65100; }
.success-icon { background: var(--green-light); color: var(--green-deep); }

.modal__title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--text-dark);
  margin-bottom: 12px;
}

.modal__body {
  font-size: 0.95rem;
  color: var(--text-mid);
  line-height: 1.6;
  margin-bottom: 24px;
}

.modal__btn {
  width: 100%;
  padding: 12px;
  color: var(--white);
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.error-btn { background: #FF9800; }
.error-btn:hover { background: #E65100; }

.modal-loader {
  width: 24px; height: 24px;
  border: 3px solid var(--green-light);
  border-top-color: var(--green-deep);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
"""
if "modal-overlay" not in css_content:
    css_content += modals_css

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css_content)

# 3. Update TS
with open(ts_path, "r", encoding="utf-8") as f:
    ts_content = f.read()

if "successMsg" not in ts_content:
    ts_content = ts_content.replace("errorMsg     = '';", "errorMsg     = '';\n  successMsg   = '';")
    
    # Success navigation replacement
    old_success_1 = """        if (res.message === 'Connexion réussie') {
          this.service.cuurrentUser = res;
          this.router.navigate(['escpacep/rdvp']);
        }"""
    new_success_1 = """        if (res.message === 'Connexion réussie') {
          this.service.cuurrentUser = res;
          this.successMsg = 'Redirection vers votre espace...';
          setTimeout(() => this.router.navigate(['escpacep/rdvp']), 1500);
        }"""
    ts_content = ts_content.replace(old_success_1, new_success_1)
    
    old_success_2 = """            if (res.message === 'Connexion réussie') {
              this.router.navigate(['dashboard/rdv']);
            }"""
    new_success_2 = """            if (res.message === 'Connexion réussie') {
              this.successMsg = 'Redirection vers le tableau de bord...';
              setTimeout(() => this.router.navigate(['dashboard/rdv']), 1500);
            }"""
    ts_content = ts_content.replace(old_success_2, new_success_2)

with open(ts_path, "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Modals added successfully.")
