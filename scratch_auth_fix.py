import os

# 1. Update backend app.py
app_path = r"c:\nvprojetpfe\pfee\fra\app.py"
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

# Fix patient login
old_patient_login = """        cursor.execute("SELECT * FROM patient WHERE email = %s and password = %s", (email, password))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Email introuvable ou passwrod '}), 401"""

new_patient_login = """        cursor.execute("SELECT * FROM patient WHERE email = %s", (email,))
        user_by_email = cursor.fetchone()

        if not user_by_email:
            return jsonify({'message': 'Email introuvable'}), 401

        cursor.execute("SELECT * FROM patient WHERE email = %s and password = %s", (email, password))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Mot de passe incorrect'}), 401"""
app_content = app_content.replace(old_patient_login, new_patient_login)

# Fix nut login
old_nut_login = """        cursor.execute("SELECT * FROM users WHERE email = %s and password = %s", (email, password))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Email introuvable ou passwrod '}), 401"""

new_nut_login = """        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user_by_email = cursor.fetchone()

        if not user_by_email:
            return jsonify({'message': 'Email introuvable'}), 401

        cursor.execute("SELECT * FROM users WHERE email = %s and password = %s", (email, password))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Mot de passe incorrect'}), 401"""
app_content = app_content.replace(old_nut_login, new_nut_login)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_content)


# 2. Update frontend login.ts
ts_path = r"c:\nvprojetpfe\pfee\fra\frontend\nutrition-frontend\src\app\login\login.ts"
with open(ts_path, "r", encoding="utf-8") as f:
    ts_content = f.read()

old_ts_logic = """      error: () => {
        // Échec patient → tentative nutritionniste
        this.service.loginNut(this.email, this.password).subscribe({
          next: (res: any) => {
            this.loading = false;
            if (res.message === 'Connexion réussie') {
              this.successMsg = 'Redirection vers le tableau de bord...';
              this.cdr.detectChanges();
              setTimeout(() => {
                this.router.navigate(['dashboard/rdv']);
              }, 1500);
            } else {
                this.cdr.detectChanges();
            }
          },
          error: (err: any) => {
            this.errorMsg = err.error?.message ?? 'Identifiants incorrects. Veuillez réessayer.';
            this.loading  = false;
            this.cdr.detectChanges();
          }
        });
      }"""

new_ts_logic = """      error: (errPatient: any) => {
        if (errPatient.status === 401 && errPatient.error?.message === 'Mot de passe incorrect') {
          this.errorMsg = 'Mot de passe incorrect';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // Échec patient (Email introuvable) → tentative nutritionniste
        this.service.loginNut(this.email, this.password).subscribe({
          next: (res: any) => {
            this.loading = false;
            if (res.message === 'Connexion réussie') {
              this.successMsg = 'Redirection vers le tableau de bord...';
              this.cdr.detectChanges();
              setTimeout(() => {
                this.router.navigate(['dashboard/rdv']);
              }, 1500);
            } else {
                this.cdr.detectChanges();
            }
          },
          error: (errNut: any) => {
            if (errNut.status === 401 && errNut.error?.message === 'Mot de passe incorrect') {
                this.errorMsg = 'Mot de passe incorrect';
            } else {
                this.errorMsg = 'Email introuvable';
            }
            this.loading  = false;
            this.cdr.detectChanges();
          }
        });
      }"""

ts_content = ts_content.replace(old_ts_logic, new_ts_logic)

with open(ts_path, "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Updated backend logic and frontend login logic successfully.")
