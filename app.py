from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
import MySQLdb
import hashlib

app = Flask(__name__)
CORS(app)

# ─── Configuration e-mail ────────────────────────────────────────────────────
app.config['MAIL_SERVER']         = 'smtp.gmail.com'
app.config['MAIL_PORT']           = 465
app.config['MAIL_USE_TLS']        = False
app.config['MAIL_USE_SSL']        = True
app.config['MAIL_USERNAME']       = 'kanzari386@gmail.com'
app.config['MAIL_PASSWORD']       = 'mjbm hvgn rnmp zesz'
app.config['MAIL_DEFAULT_SENDER'] = ('Dr. Farouk Mrad', 'kanzari386@gmail.com')

mail = Mail(app)

# ─── Connexion BDD ───────────────────────────────────────────────────────────
def get_db():
    return MySQLdb.connect(
        host="localhost",
        user="root",
        password="",
        database="nutrition_db"
    )

# ─── Utilitaires ─────────────────────────────────────────────────────────────
def hash_password(pwd: str) -> str:
    """SHA-256 du mot de passe."""
    return hashlib.sha256(pwd.encode('utf-8')).hexdigest()

def parse_int(value, default=0) -> int:
    """Convertit proprement une valeur en entier (gère None, '', 'null')."""
    try:
        return int(value) if value not in (None, '', 'null') else default
    except (ValueError, TypeError):
        return default


# =============================================================================
#  AUTHENTIFICATION
# =============================================================================

@app.route('/login', methods=['POST'])
def login():
    """
    Connexion unifiée.
    Corps JSON : email, password
    Réponse    : { message, role, id, nom, prenom }
    """
    data     = request.get_json()
    email    = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400

    db     = get_db()
    cursor = db.cursor()

    cursor.execute(
        "SELECT id, nom, prenom, email, password FROM user WHERE email = %s",
        (email,)
    )
    user = cursor.fetchone()

    if not user:
        cursor.close(); db.close()
        return jsonify({'message': 'Email introuvable'}), 401

    # Vérification du mot de passe (accepte le hash ou le mot de passe en clair pour l'admin)
    if user[4] != hash_password(password) and user[4] != password:
        cursor.close(); db.close()
        return jsonify({'message': 'Mot de passe incorrect'}), 401

    user_id = user[0]

    # Détecter le rôle
    cursor.execute("SELECT id_patient FROM patient WHERE id_patient = %s", (user_id,))
    is_patient = cursor.fetchone() is not None

    cursor.execute("SELECT id_nutritionniste FROM nutritionniste WHERE id_user = %s", (user_id,))
    is_nutritionniste = cursor.fetchone() is not None

    cursor.close(); db.close()

    role = 'patient' if is_patient else ('nutritionniste' if is_nutritionniste else 'user')

    return jsonify({
        'message': 'Connexion réussie',
        'role':    role,
        'id':      user_id,
        'nom':     user[1],
        'prenom':  user[2],
    }), 200


# =============================================================================
#  RÉCUPÉRATION MOT DE PASSE
# =============================================================================

@app.route('/accesP/<email>', methods=['GET'])
def accesP(email):
    """
    Envoie un e-mail de réinitialisation.
    ⚠️  Les mots de passe étant hashés, on envoie un lien de contact
        plutôt que le mot de passe en clair.
    """
    db     = get_db()
    cursor = db.cursor()
    cursor.execute(
        "SELECT email FROM user WHERE email = %s LIMIT 1", (email,)
    )
    user = cursor.fetchone()
    cursor.close(); db.close()

    if user is None:
        return jsonify({"message": "Aucun compte trouvé avec cet e-mail."}), 404

    try:
        send_reset_email(user[0])
        return jsonify({"message": "Un e-mail de récupération a été envoyé."}), 200
    except Exception as e:
        print(f"Erreur SMTP : {e}")
        return jsonify({"message": f"Erreur d'envoi : {str(e)}"}), 500


def send_reset_email(email: str):
    msg = Message(
        subject="🔑 Récupération de votre mot de passe",
        recipients=[email]
    )
    msg.html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;
                border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: #2e7d32; padding: 24px; text-align: center;">
        <h2 style="color: white; margin: 0;">Dr. Farouk Mrad</h2>
        <p style="color: #c8e6c9; margin: 4px 0 0;">Espace Patient</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333;">Bonjour,</p>
        <p style="color: #555;">
          Nous avons reçu une demande de récupération de mot de passe pour votre compte.<br>
          Veuillez contacter notre cabinet pour réinitialiser votre mot de passe.
        </p>
        <a href="http://localhost:4200/login"
           style="display: block; background: #2e7d32; color: white;
                  text-align: center; padding: 14px; border-radius: 8px;
                  text-decoration: none; font-weight: bold;">
          Retour à la connexion →
        </a>
      </div>
      <div style="background: #f9f9f9; padding: 16px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #aaa; font-size: 12px;">© 2025 Dr. Farouk Mrad</p>
      </div>
    </div>
    """
    mail.send(msg)


# =============================================================================
#  GESTION DES UTILISATEURS (user)
# =============================================================================

@app.route('/createUser', methods=['POST'])
def createUser():
    """
    Crée un compte dans `user`.
    Corps JSON : nom, prenom, ddn, email, password, telephone
    """
    data      = request.get_json()
    nom       = data.get('nom', '').strip()
    prenom    = data.get('prenom', '').strip()
    ddn       = data.get('ddn', '').strip()
    email     = data.get('email', '').strip()
    password  = data.get('password', '').strip()
    telephone = parse_int(data.get('telephone'))      # ← int(8) en BD

    if not all([nom, prenom, email, password]):
        return jsonify({"message": "Champs obligatoires manquants."}), 400

    db     = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({"message": "Cet e-mail est déjà utilisé."}), 409

    cursor.execute(
        "INSERT INTO user (nom, prenom, ddn, email, password, telephone) VALUES (%s,%s,%s,%s,%s,%s)",
        (nom, prenom, ddn, email, hash_password(password), telephone)
    )
    db.commit()
    new_id = cursor.lastrowid
    cursor.close(); db.close()
    return jsonify({"message": "Compte créé avec succès.", "id": new_id}), 201


@app.route('/checkEmail/<email>', methods=['GET'])
def checkEmail(email):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
    exists = cursor.fetchone() is not None
    cursor.close(); db.close()
    return jsonify({"exists": exists}), 200


# =============================================================================
#  GESTION DES PATIENTS
# =============================================================================

@app.route('/createPatient', methods=['POST'])
def createPatient():
    """
    Crée d'abord un user, puis insère dans patient.
    Corps JSON : nom, prenom, ddn, email, password, telephone,
                 sexe, adresse, taille, allergie, maladie_chronique, objectif, ddc
    """
    data              = request.get_json()
    nom               = data.get('nom', '').strip()
    prenom            = data.get('prenom', '').strip()
    ddn               = data.get('ddn', '').strip()
    email             = data.get('email', '').strip()
    password          = data.get('password', '').strip()
    telephone         = parse_int(data.get('telephone'))          # ← fix int
    sexe              = data.get('sexe', '').strip()
    adresse           = data.get('adresse', '').strip()
    taille            = parse_int(data.get('taille'))             # ← fix int NOT NULL
    allergie          = data.get('allergie', '').strip()
    maladie_chronique = data.get('maladie_chronique', '').strip()
    objectif          = data.get('objectif', '').strip()
    ddc               = data.get('ddc', '').strip()

    if not all([nom, prenom, email, password]):
        return jsonify({"message": "Champs obligatoires manquants."}), 400

    if taille <= 0:
        return jsonify({"message": "La taille est obligatoire et doit être supérieure à 0."}), 400

    db     = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({"message": "Cet e-mail est déjà utilisé."}), 409

    # 1. Insérer dans user (mot de passe hashé)
    cursor.execute(
        "INSERT INTO user (nom, prenom, ddn, email, password, telephone) VALUES (%s,%s,%s,%s,%s,%s)",
        (nom, prenom, ddn, email, hash_password(password), telephone)
    )
    user_id = cursor.lastrowid

    # 2. Insérer dans patient
    cursor.execute(
        """INSERT INTO patient
           (id_patient, sexe, adresse, taille, allergie, maladie_chronique, objectif, ddc)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        (user_id, sexe, adresse, taille, allergie, maladie_chronique, objectif, ddc)
    )
    db.commit()
    cursor.close(); db.close()
    return jsonify({"message": "Patient créé avec succès.", "id_patient": user_id}), 201


@app.route('/allpatient', methods=['GET'])
def getallpatient():
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT u.id, u.nom, u.prenom, u.ddn, u.email, u.telephone,
               p.sexe, p.adresse, p.taille, p.allergie, p.maladie_chronique, p.objectif, p.ddc
        FROM user u
        INNER JOIN patient p ON u.id = p.id_patient
    """)
    patients = []
    for r in cursor.fetchall():
        patients.append({
            "id":                r[0],
            "nom":               r[1],
            "prenom":            r[2],
            "ddn":               str(r[3]) if r[3] else None,
            "email":             r[4],
            "telephone":         r[5],
            "sexe":              r[6],
            "adresse":           r[7],
            "taille":            r[8],
            "allergie":          r[9],
            "maladie_chronique": r[10],
            "objectif":          r[11],
            "ddc":               str(r[12]) if r[12] else None,
        })
    cursor.close(); db.close()
    return jsonify({"patients": patients}), 200


@app.route('/patient/<int:id_patient>', methods=['GET'])
def getPatient(id_patient):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT u.id, u.nom, u.prenom, u.ddn, u.email, u.telephone,
               p.sexe, p.adresse, p.taille, p.allergie, p.maladie_chronique, p.objectif, p.ddc
        FROM user u
        INNER JOIN patient p ON u.id = p.id_patient
        WHERE u.id = %s
    """, (id_patient,))
    r = cursor.fetchone()
    cursor.close(); db.close()

    if not r:
        return jsonify({"message": "Patient introuvable"}), 404

    return jsonify({
        "id":                r[0],
        "nom":               r[1],
        "prenom":            r[2],
        "ddn":               str(r[3]) if r[3] else None,
        "email":             r[4],
        "telephone":         r[5],
        "sexe":              r[6],
        "adresse":           r[7],
        "taille":            r[8],
        "allergie":          r[9],
        "maladie_chronique": r[10],
        "objectif":          r[11],
        "ddc":               str(r[12]) if r[12] else None,
    }), 200


@app.route('/patientex/<chercher>', methods=['GET'])
def getpatient(chercher):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT u.id, u.nom, u.prenom, p.objectif, p.maladie_chronique
        FROM user u
        INNER JOIN patient p ON u.id = p.id_patient
        WHERE u.nom = %s
    """, (chercher,))
    patients = []
    for r in cursor.fetchall():
        patients.append({
            "id": r[0], "nom": r[1], "prenom": r[2],
            "objectif": r[3], "maladie_chronique": r[4]
        })
    cursor.close(); db.close()
    return jsonify({"patients": patients}), 200


@app.route('/supppatient/<int:idp>', methods=['DELETE'])
def supppatient(idp):
    try:
        db     = get_db()
        cursor = db.cursor()
        cursor.execute("DELETE FROM patient WHERE id_patient = %s", (idp,))
        cursor.execute("DELETE FROM user WHERE id = %s", (idp,))
        db.commit()
        return jsonify({'message': 'Patient supprimé avec succès'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        db.close()


# =============================================================================
#  RENDEZ-VOUS
# =============================================================================

@app.route('/rendez_vous', methods=['GET'])
def getAllRdv():
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT rv.id_rendez_vous, rv.date_rendez_vous, rv.heure, rv.statut,
               u.nom, u.prenom, u.email
        FROM rendez_vous rv
        INNER JOIN user u ON rv.id_patient = u.id
    """)
    rdv_list = []
    for r in cursor.fetchall():
        rdv_list.append({
            "id_rendez_vous":   r[0],
            "date_rendez_vous": str(r[1]) if r[1] else None,
            "heure":            str(r[2]) if r[2] else None,
            "statut":           r[3],
            "nom":              r[4],
            "prenom":           r[5],
            "email":            r[6],
        })
    cursor.close(); db.close()
    return jsonify({"rendez_vous": rdv_list}), 200


@app.route('/prendrerdv', methods=['POST'])
def prendrerdv():
    data             = request.get_json()
    id_patient       = data.get('id_patient')
    date_rendez_vous = data.get('date_rendez_vous')
    heure            = data.get('heure')

    if not all([id_patient, date_rendez_vous, heure]):
        return jsonify({'message': 'Données manquantes'}), 400

    db     = get_db()
    cursor = db.cursor()

    cursor.execute(
        "SELECT id_rendez_vous FROM rendez_vous WHERE date_rendez_vous = %s AND heure = %s",
        (date_rendez_vous, heure)
    )
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({'message': 'Ce créneau est déjà réservé'}), 409

    cursor.execute(
        "INSERT INTO rendez_vous (date_rendez_vous, heure, statut, id_patient) VALUES (%s,%s,%s,%s)",
        (date_rendez_vous, heure, 'en attente', id_patient)
    )
    db.commit()
    new_id = cursor.lastrowid
    cursor.close(); db.close()
    return jsonify({'message': 'Rendez-vous ajouté avec succès', 'id_rendez_vous': new_id}), 201


@app.route('/heures/<date_rdv>', methods=['GET'])
def get_heures(date_rdv):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute(
        "SELECT heure FROM rendez_vous WHERE date_rendez_vous = %s", (date_rdv,)
    )
    heures = [str(row[0]) for row in cursor.fetchall()]
    cursor.close(); db.close()
    return jsonify(heures), 200


@app.route('/rdv/patient/<int:id_patient>', methods=['GET'])
def getRdvPatient(id_patient):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute(
        "SELECT id_rendez_vous, date_rendez_vous, heure, statut FROM rendez_vous WHERE id_patient = %s",
        (id_patient,)
    )
    rdv_list = []
    for r in cursor.fetchall():
        rdv_list.append({
            "id_rendez_vous":   r[0],
            "date_rendez_vous": str(r[1]) if r[1] else None,
            "heure":            str(r[2]) if r[2] else None,
            "statut":           r[3],
        })
    cursor.close(); db.close()
    return jsonify({"rendez_vous": rdv_list}), 200


@app.route('/rdv/<int:id_rdv>/statut', methods=['PUT'])
def updateStatutRdv(id_rdv):
    data   = request.get_json()
    statut = data.get('statut', '').strip()
    if not statut:
        return jsonify({'message': 'Statut requis'}), 400

    db     = get_db()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE rendez_vous SET statut = %s WHERE id_rendez_vous = %s", (statut, id_rdv)
    )
    db.commit()
    cursor.close(); db.close()
    return jsonify({'message': 'Statut mis à jour'}), 200


# =============================================================================
#  CONSULTATIONS
# =============================================================================

@app.route('/consultations', methods=['GET'])
def getAllConsultations():
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT c.id_consultation, c.date_consultation, c.poids,
               c.tension_arterielle, c.glycemie, c.diagnostic, c.remarque,
               u.nom, u.prenom, c.id_patient, c.id_rendez_vous
        FROM consultation c
        INNER JOIN user u ON c.id_patient = u.id
    """)
    consultations = []
    for r in cursor.fetchall():
        consultations.append({
            "id_consultation":    r[0],
            "date_consultation":  str(r[1]) if r[1] else None,
            "poids":              float(r[2]) if r[2] else None,
            "tension_arterielle": r[3],
            "glycemie":           r[4],
            "diagnostic":         r[5],
            "remarque":           r[6],
            "nom":                r[7],
            "prenom":             r[8],
            "id_patient":         r[9],
            "id_rendez_vous":     r[10],
        })
    cursor.close(); db.close()
    return jsonify({"consultations": consultations}), 200


@app.route('/consultation', methods=['POST'])
def addConsultation():
    data              = request.get_json()
    date_consultation = data.get('date_consultation')
    poids             = data.get('poids')
    tension           = data.get('tension_arterielle')
    glycemie          = data.get('glycemie')
    diagnostic        = data.get('diagnostic')
    remarque          = data.get('remarque')
    id_patient        = data.get('id_patient')
    id_rendez_vous    = data.get('id_rendez_vous')

    if not id_patient:
        return jsonify({'message': 'id_patient requis'}), 400

    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO consultation
        (date_consultation, poids, tension_arterielle, glycemie, diagnostic, remarque, id_patient, id_rendez_vous)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (date_consultation, poids, tension, glycemie, diagnostic, remarque, id_patient, id_rendez_vous))
    db.commit()
    new_id = cursor.lastrowid
    cursor.close(); db.close()
    return jsonify({'message': 'Consultation ajoutée avec succès', 'id_consultation': new_id}), 201


@app.route('/consultation/patient/<int:id_patient>', methods=['GET'])
def getConsultationsPatient(id_patient):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT id_consultation, date_consultation, poids, tension_arterielle,
               glycemie, diagnostic, remarque, id_rendez_vous
        FROM consultation
        WHERE id_patient = %s
        ORDER BY date_consultation DESC
    """, (id_patient,))
    consultations = []
    for r in cursor.fetchall():
        consultations.append({
            "id_consultation":    r[0],
            "date_consultation":  str(r[1]) if r[1] else None,
            "poids":              float(r[2]) if r[2] else None,
            "tension_arterielle": r[3],
            "glycemie":           r[4],
            "diagnostic":         r[5],
            "remarque":           r[6],
            "id_rendez_vous":     r[7],
        })
    cursor.close(); db.close()
    return jsonify({"consultations": consultations}), 200


@app.route('/consultation/<int:id_consultation>', methods=['PUT'])
def updateConsultation(id_consultation):
    data   = request.get_json()
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        UPDATE consultation
        SET date_consultation = %s, poids = %s, tension_arterielle = %s,
            glycemie = %s, diagnostic = %s, remarque = %s
        WHERE id_consultation = %s
    """, (
        data.get('date_consultation'), data.get('poids'),
        data.get('tension_arterielle'), data.get('glycemie'),
        data.get('diagnostic'), data.get('remarque'),
        id_consultation
    ))
    db.commit()
    cursor.close(); db.close()
    return jsonify({'message': 'Consultation mise à jour'}), 200


# =============================================================================
#  NUTRITIONNISTE
# =============================================================================

@app.route('/createNutritionniste', methods=['POST'])
def createNutritionniste():
    data      = request.get_json()
    nom       = data.get('nom', '').strip()
    prenom    = data.get('prenom', '').strip()
    ddn       = data.get('ddn', '').strip()
    email     = data.get('email', '').strip()
    password  = data.get('password', '').strip()
    telephone = parse_int(data.get('telephone'))      # ← fix int

    if not all([nom, prenom, email, password]):
        return jsonify({"message": "Champs obligatoires manquants."}), 400

    db     = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({"message": "Cet e-mail est déjà utilisé."}), 409

    cursor.execute(
        "INSERT INTO user (nom, prenom, ddn, email, password, telephone) VALUES (%s,%s,%s,%s,%s,%s)",
        (nom, prenom, ddn, email, hash_password(password), telephone)
    )
    user_id = cursor.lastrowid
    cursor.execute("INSERT INTO nutritionniste (id_user) VALUES (%s)", (user_id,))
    db.commit()
    cursor.close(); db.close()
    return jsonify({"message": "Nutritionniste créé avec succès.", "id": user_id}), 201


# =============================================================================
if __name__ == '__main__':
    app.run(debug=True)