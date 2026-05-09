import os
import re
import hashlib
import json

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from db import get_db
from routes.rdv_routes import rdv_bp


# =============================================================================
#  APPLICATION
# =============================================================================

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ─── Configuration e-mail ────────────────────────────────────────────────────
app.config['MAIL_SERVER']         = 'smtp.gmail.com'
app.config['MAIL_PORT']           = 465
app.config['MAIL_USE_TLS']        = False
app.config['MAIL_USE_SSL']        = True
app.config['MAIL_USERNAME']       = 'kanzari386@gmail.com'
app.config['MAIL_PASSWORD']       = 'mjbm hvgn rnmp zesz'
app.config['MAIL_DEFAULT_SENDER'] = ('Dr. Farouk Mrad', 'kanzari386@gmail.com')

mail = Mail(app)


# =============================================================================
#  UTILITAIRES
# =============================================================================

def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode('utf-8')).hexdigest()


def parse_int(value, default=0) -> int:
    try:
        return int(value) if value not in (None, '', 'null') else default
    except (ValueError, TypeError):
        return default


def is_valid_email(email: str) -> bool:
    return bool(re.match(r'^[\w.+-]+@[\w-]+\.[a-z]{2,}$', email, re.I))


# =============================================================================
#  AUTHENTIFICATION
# =============================================================================

@app.route('/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400

    db     = get_db()
    cursor = db.cursor()
    cursor.execute(
        "SELECT id, nom, prenom, email, password FROM user WHERE email = %s", (email,)
    )
    user = cursor.fetchone()

    if not user:
        cursor.close(); db.close()
        return jsonify({'message': 'Email introuvable'}), 401

    if user[4] != hash_password(password) and user[4] != password:
        cursor.close(); db.close()
        return jsonify({'message': 'Mot de passe incorrect'}), 401

    user_id = user[0]

    cursor.execute("SELECT id_patient FROM patient WHERE id_user = %s", (user_id,))
    is_patient = cursor.fetchone() is not None

    cursor.execute("SELECT id_nutritionniste FROM nutritionniste WHERE id_user = %s", (user_id,))
    is_nutritionniste = cursor.fetchone() is not None

    cursor.close(); db.close()

    role = 'nutritionniste' if is_nutritionniste else ('patient' if is_patient else 'user')

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
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT email FROM user WHERE email = %s LIMIT 1", (email,))
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
      <div style="background: #f9f9f9; padding: 16px; text-align: center;
                  border-top: 1px solid #eee;">
        <p style="margin: 0; color: #aaa; font-size: 12px;">© 2025 Dr. Farouk Mrad</p>
      </div>
    </div>
    """
    mail.send(msg)


# =============================================================================
#  GESTION DES PATIENTS
# =============================================================================

@app.route('/createPatient', methods=['POST'])
def createPatient():
    data              = request.get_json()
    nom               = data.get('nom', '').strip()
    prenom            = data.get('prenom', '').strip()
    ddn               = data.get('ddn', '').strip()
    email             = data.get('email', '').strip()
    password          = data.get('password', '').strip()
    telephone         = parse_int(data.get('telephone'))
    sexe              = data.get('sexe', '').strip()
    adresse           = data.get('adresse', '').strip()
    taille            = parse_int(data.get('taille'))
    allergie          = data.get('allergie', '').strip()
    maladie_chronique = data.get('maladie_chronique', '').strip()
    objectif          = data.get('objectif', '').strip()

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

    try:
        cursor.execute(
            "INSERT INTO user (nom, prenom, ddn, email, password, telephone) VALUES (%s,%s,%s,%s,%s,%s)",
            (nom, prenom, ddn, email, hash_password(password), telephone)
        )
        user_id = cursor.lastrowid

        cursor.execute(
            """INSERT INTO patient
               (id_user, sexe, adresse, taille, allergie, maladie_chronique, objectif, ddc)
               VALUES (%s,%s,%s,%s,%s,%s,%s, CURDATE())""",
            (user_id, sexe, adresse, taille,
             allergie or None, maladie_chronique or None, objectif)
        )
        db.commit()
        cursor.close(); db.close()
        return jsonify({"message": "Patient créé avec succès.", "id_user": user_id}), 201
    except Exception as e:
        db.rollback()
        cursor.close(); db.close()
        return jsonify({"message": f"Erreur serveur : {str(e)}"}), 500


@app.route('/checkEmail/<email>', methods=['GET'])
def checkEmail(email):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
    exists = cursor.fetchone() is not None
    cursor.close(); db.close()
    return jsonify({"exists": exists}), 200


@app.route('/me/<email>', methods=['GET'])
def get_user_profile(email):
    try:
        db     = get_db()
        cursor = db.cursor()

        cursor.execute(
            "SELECT id, nom, prenom, ddn, email, telephone FROM user WHERE email = %s",
            (email,)
        )
        user = cursor.fetchone()

        if not user:
            cursor.close(); db.close()
            return jsonify({"message": "Utilisateur non trouvé"}), 404

        user_id = user[0]

        cursor.execute(
            "SELECT sexe, adresse, taille, allergie, maladie_chronique, objectif FROM patient WHERE id_user = %s",
            (user_id,)
        )
        patient = cursor.fetchone()
        cursor.close(); db.close()

        result = {
            "id":        user_id,
            "nom":       user[1],
            "prenom":    user[2],
            "ddn":       str(user[3]) if user[3] else None,
            "email":     user[4],
            "telephone": user[5],
        }

        if patient:
            result.update({
                "sexe":              patient[0],
                "adresse":           patient[1],
                "taille":            patient[2],
                "allergie":          patient[3] or "",
                "maladie_chronique": patient[4] or "",
                "objectif":          patient[5],
            })

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"message": f"Erreur : {str(e)}"}), 500


@app.route('/updateProfile', methods=['POST'])
def update_profile():
    data  = request.get_json()
    email = data.get('email', '').strip()

    if not email:
        return jsonify({"message": "Email requis"}), 400

    db     = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "Utilisateur non trouvé"}), 404

        user_id = user[0]

        cursor.execute("""
            UPDATE user
            SET nom = %s, prenom = %s, ddn = %s, telephone = %s
            WHERE id = %s
        """, (data.get('nom'), data.get('prenom'), data.get('ddn'),
              parse_int(data.get('telephone')), user_id))

        cursor.execute("""
            UPDATE patient
            SET sexe = %s, adresse = %s, taille = %s,
                allergie = %s, maladie_chronique = %s, objectif = %s
            WHERE id_user = %s
        """, (data.get('sexe'), data.get('adresse'), parse_int(data.get('taille')),
              data.get('allergie', '').strip() or None,
              data.get('maladie_chronique', '').strip() or None,
              data.get('objectif'), user_id))

        db.commit()
        return jsonify({"message": "Profil mis à jour avec succès"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Erreur : {str(e)}"}), 500
    finally:
        cursor.close(); db.close()


@app.route('/allpatient', methods=['GET'])
def getallpatient():
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT u.id, u.nom, u.prenom, u.ddn, u.email, u.telephone,
               p.id_patient, p.sexe, p.adresse, p.taille,
               p.allergie, p.maladie_chronique, p.objectif, p.ddc
        FROM user u
        INNER JOIN patient p ON u.id = p.id_user
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
            "id_patient":        r[6],
            "sexe":              r[7],
            "adresse":           r[8],
            "taille":            r[9],
            "allergie":          r[10],
            "maladie_chronique": r[11],
            "objectif":          r[12],
            "ddc":               str(r[13]) if r[13] else None,
        })
    cursor.close(); db.close()
    return jsonify({"patients": patients}), 200


@app.route('/patient/<int:id_patient>', methods=['GET'])
def getPatient(id_patient):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT u.id, u.nom, u.prenom, u.ddn, u.email, u.telephone,
               p.id_patient, p.sexe, p.adresse, p.taille,
               p.allergie, p.maladie_chronique, p.objectif, p.ddc
        FROM user u
        INNER JOIN patient p ON u.id = p.id_user
        WHERE p.id_patient = %s
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
        "id_patient":        r[6],
        "sexe":              r[7],
        "adresse":           r[8],
        "taille":            r[9],
        "allergie":          r[10],
        "maladie_chronique": r[11],
        "objectif":          r[12],
        "ddc":               str(r[13]) if r[13] else None,
    }), 200


@app.route('/patientex/<chercher>', methods=['GET'])
def getpatient(chercher):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT u.id, u.nom, u.prenom, p.id_patient, p.objectif, p.maladie_chronique
        FROM user u
        INNER JOIN patient p ON u.id = p.id_user
        WHERE u.nom = %s
    """, (chercher,))
    patients = []
    for r in cursor.fetchall():
        patients.append({
            "id": r[0], "nom": r[1], "prenom": r[2],
            "id_patient": r[3], "objectif": r[4], "maladie_chronique": r[5]
        })
    cursor.close(); db.close()
    return jsonify({"patients": patients}), 200


@app.route('/supppatient/<int:id_patient>', methods=['DELETE'])
def supppatient(id_patient):
    db     = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("SELECT id_user FROM patient WHERE id_patient = %s", (id_patient,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'message': 'Patient introuvable'}), 404

        id_user = row[0]
        cursor.execute("DELETE FROM user WHERE id = %s", (id_user,))
        db.commit()
        return jsonify({'message': 'Patient supprimé avec succès'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close(); db.close()


# =============================================================================
#  INSCRIPTION PATIENT (API register)
# =============================================================================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    required = ['nom', 'prenom', 'ddn', 'email', 'password',
                'telephone', 'sexe', 'adresse', 'taille', 'objectif']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'message': f"Champs manquants : {', '.join(missing)}"}), 400

    if not is_valid_email(data['email']):
        return jsonify({'message': 'Adresse email invalide.'}), 400

    if len(data['password']) < 8:
        return jsonify({'message': 'Le mot de passe doit contenir au moins 8 caractères.'}), 400

    taille = parse_int(data['taille'])
    if not (50 <= taille <= 250):
        return jsonify({'message': 'Taille invalide (entre 50 et 250 cm).'}), 400

    telephone = parse_int(data.get('telephone'))

    db     = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT id FROM user WHERE email = %s", (data['email'],))
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({'message': 'Un compte avec cet email existe déjà.'}), 409

    try:
        cursor.execute(
            "INSERT INTO user (nom, prenom, ddn, email, password, telephone) VALUES (%s,%s,%s,%s,%s,%s)",
            (
                data['nom'].strip(),
                data['prenom'].strip(),
                data['ddn'],
                data['email'].strip().lower(),
                hash_password(data['password']),
                telephone,
            )
        )
        user_id = cursor.lastrowid

        cursor.execute(
            """INSERT INTO patient
               (id_user, sexe, adresse, taille, allergie, maladie_chronique, objectif, ddc)
               VALUES (%s,%s,%s,%s,%s,%s,%s, CURDATE())""",
            (
                user_id,
                data['sexe'],
                data['adresse'].strip(),
                taille,
                data.get('allergie', '').strip() or None,
                data.get('maladie_chronique', '').strip() or None,
                data['objectif'],
            )
        )
        db.commit()
        return jsonify({'message': 'Compte créé avec succès.', 'user_id': user_id}), 201

    except Exception as e:
        db.rollback()
        return jsonify({'message': f'Erreur serveur : {str(e)}'}), 500
    finally:
        cursor.close(); db.close()


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
        INNER JOIN patient p ON rv.id_patient = p.id_patient
        INNER JOIN user u ON p.id_user = u.id
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
    data              = request.get_json()
    id_patient        = data.get('id_patient')
    id_nutritionniste = data.get('id_nutritionniste')
    date_rendez_vous  = data.get('date_rendez_vous')
    heure             = data.get('heure')

    if not all([id_patient, id_nutritionniste, date_rendez_vous, heure]):
        return jsonify({'message': 'Données manquantes (id_patient, id_nutritionniste, date, heure requis)'}), 400

    db     = get_db()
    cursor = db.cursor()

    cursor.execute(
        "SELECT id_rendez_vous FROM rendez_vous WHERE id_nutritionniste = %s AND date_rendez_vous = %s AND heure = %s",
        (id_nutritionniste, date_rendez_vous, heure)
    )
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({'message': 'Ce créneau est déjà réservé pour ce nutritionniste'}), 409

    cursor.execute(
        """INSERT INTO rendez_vous (id_patient, id_nutritionniste, date_rendez_vous, heure, statut)
           VALUES (%s,%s,%s,%s,'en_attente')""",
        (id_patient, id_nutritionniste, date_rendez_vous, heure)
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
    page     = parse_int(request.args.get('page'), 1)
    per_page = parse_int(request.args.get('per_page'), 10)
    search     = request.args.get('search', '').strip()
    diagnostic = request.args.get('diagnostic', '').strip()

    db     = get_db()
    cursor = db.cursor()

    query = """
        SELECT c.id_consultation, c.date_consultation, c.poids,
               c.tension_arterielle, c.glycemie, c.diagnostic, c.remarque,
               c.id_rendez_vous,
               u.nom, u.prenom, p.id_patient
        FROM consultation c
        INNER JOIN rendez_vous rv ON c.id_rendez_vous = rv.id_rendez_vous
        INNER JOIN patient p ON rv.id_patient = p.id_patient
        INNER JOIN user u ON p.id_user = u.id
        WHERE 1=1
    """
    params = []

    if search:
        query += " AND (c.remarque LIKE %s OR c.diagnostic LIKE %s)"
        params.extend([f"%{search}%", f"%{search}%"])
    if diagnostic:
        query += " AND c.diagnostic = %s"
        params.append(diagnostic)

    query += " ORDER BY c.date_consultation DESC"

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()

    total           = len(rows)
    start           = (page - 1) * per_page
    end             = start + per_page
    paginated_rows  = rows[start:end] if per_page > 0 else rows

    consultations = []
    for r in paginated_rows:
        consultations.append({
            "id_consultation":    r[0],
            "date_consultation":  str(r[1]) if r[1] else None,
            "poids":              float(r[2]) if r[2] else None,
            "tension_arterielle": r[3],
            "glycemie":           r[4],
            "diagnostic":         r[5],
            "remarque":           r[6],
            "id_rendez_vous":     r[7],
            "nom":                r[8],
            "prenom":             r[9],
            "id_patient":         r[10],
        })

    cursor.close(); db.close()
    return jsonify({
        "data":  consultations,
        "total": total,
        "page":  page,
        "pages": (total + per_page - 1) // per_page if per_page else 1
    }), 200


@app.route('/consultations', methods=['POST'])
def addConsultation():
    data              = request.get_json()
    date_consultation = data.get('date_consultation')
    poids             = data.get('poids')
    tension           = data.get('tension_arterielle')
    glycemie          = data.get('glycemie')
    diagnostic        = data.get('diagnostic')
    remarque          = data.get('remarque')
    id_rendez_vous    = data.get('id_rendez_vous')

    if not id_rendez_vous:
        return jsonify({'message': 'id_rendez_vous requis'}), 400

    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO consultation
        (id_rendez_vous, date_consultation, poids, tension_arterielle, glycemie, diagnostic, remarque)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (id_rendez_vous, date_consultation, poids, tension, glycemie, diagnostic, remarque))
    db.commit()
    new_id = cursor.lastrowid
    cursor.close(); db.close()
    return jsonify({'message': 'Consultation ajoutée avec succès', 'id_consultation': new_id}), 201


@app.route('/consultation/patient/<int:id_patient>', methods=['GET'])
def getConsultationsPatient(id_patient):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT c.id_consultation, c.date_consultation, c.poids,
               c.tension_arterielle, c.glycemie, c.diagnostic, c.remarque,
               c.id_rendez_vous
        FROM consultation c
        INNER JOIN rendez_vous rv ON c.id_rendez_vous = rv.id_rendez_vous
        WHERE rv.id_patient = %s
        ORDER BY c.date_consultation DESC
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


@app.route('/consultations/<int:id_consultation>', methods=['PUT'])
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


@app.route('/consultations/<int:id_consultation>', methods=['DELETE'])
def deleteConsultation(id_consultation):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("DELETE FROM consultation WHERE id_consultation = %s", (id_consultation,))
    db.commit()
    cursor.close(); db.close()
    return jsonify({'message': 'Consultation supprimée'}), 200


@app.route('/consultations/stats', methods=['GET'])
def getConsultationsStats():
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT COUNT(*), AVG(poids) FROM consultation")
    r           = cursor.fetchone()
    total       = r[0] if r else 0
    poids_moyen = float(r[1]) if r and r[1] else 0.0

    cursor.execute("""
        SELECT diagnostic, COUNT(*)
        FROM consultation
        WHERE diagnostic IS NOT NULL AND diagnostic != ''
        GROUP BY diagnostic
    """)
    par_diagnostic = [{"label": row[0], "count": row[1]} for row in cursor.fetchall()]

    cursor.close(); db.close()
    return jsonify({
        "total":          total,
        "poids_moyen":    round(poids_moyen, 1),
        "par_diagnostic": par_diagnostic
    }), 200


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
    telephone = parse_int(data.get('telephone'))

    if not all([nom, prenom, email, password]):
        return jsonify({"message": "Champs obligatoires manquants."}), 400

    db     = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({"message": "Cet e-mail est déjà utilisé."}), 409

    try:
        cursor.execute(
            "INSERT INTO user (nom, prenom, ddn, email, password, telephone) VALUES (%s,%s,%s,%s,%s,%s)",
            (nom, prenom, ddn, email, hash_password(password), telephone)
        )
        user_id = cursor.lastrowid
        cursor.execute("INSERT INTO nutritionniste (id_user) VALUES (%s)", (user_id,))
        db.commit()
        cursor.close(); db.close()
        return jsonify({"message": "Nutritionniste créé avec succès.", "id": user_id}), 201
    except Exception as e:
        db.rollback()
        cursor.close(); db.close()
        return jsonify({"message": f"Erreur serveur : {str(e)}"}), 500


# =============================================================================
#  DISPONIBILITÉS
# =============================================================================

# @app.route('/disponibilites/<int:id_nutritionniste>', methods=['GET'])
# def getDisponibilites(id_nutritionniste):
#     db     = get_db()
#     cursor = db.cursor()
#     cursor.execute("""
#         SELECT id_disponibilite, date, heure_debut, heure_fin, statut
#         FROM disponibilite
#         WHERE id_nutritionniste = %s
#         ORDER BY date, heure_debut
#     """, (id_nutritionniste,))
#     dispos = []
#     for r in cursor.fetchall():
#         dispos.append({
#             "id_disponibilite": r[0],
#             "date":             str(r[1]),
#             "heure_debut":      str(r[2]),
#             "heure_fin":        str(r[3]),
#             "statut":           r[4],
#         })
#     cursor.close(); db.close()
#     return jsonify({"disponibilites": dispos}), 200


# @app.route('/disponibilite', methods=['POST'])
# def addDisponibilite():
#     data              = request.get_json()
#     id_nutritionniste = data.get('id_nutritionniste')
#     date              = data.get('date')
#     heure_debut       = data.get('heure_debut')
#     heure_fin         = data.get('heure_fin')
#     statut            = data.get('statut', 'disponible')
# 
#     if not all([id_nutritionniste, date, heure_debut, heure_fin]):
#         return jsonify({'message': 'Données manquantes'}), 400
# 
#     db     = get_db()
#     cursor = db.cursor()
#     try:
#         cursor.execute("""
#             INSERT INTO disponibilite (id_nutritionniste, date, heure_debut, heure_fin, statut)
#             VALUES (%s,%s,%s,%s,%s)
#         """, (id_nutritionniste, date, heure_debut, heure_fin, statut))
#         db.commit()
#         new_id = cursor.lastrowid
#         return jsonify({'message': 'Disponibilité ajoutée', 'id_disponibilite': new_id}), 201
#     except Exception as e:
#         db.rollback()
#         return jsonify({'message': str(e)}), 500
#     finally:
#         cursor.close(); db.close()


# @app.route('/disponibilite/<int:id_disponibilite>', methods=['DELETE'])
# def deleteDisponibilite(id_disponibilite):
#     db     = get_db()
#     cursor = db.cursor()
#     try:
#         cursor.execute("DELETE FROM disponibilite WHERE id_disponibilite = %s", (id_disponibilite,))
#         db.commit()
#         return jsonify({'message': 'Disponibilité supprimée'}), 200
#     except Exception as e:
#         db.rollback()
#         return jsonify({'message': str(e)}), 500
#     finally:
#         cursor.close(); db.close()


# =============================================================================
#  CHAT
# =============================================================================

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data    = request.get_json() or {}
    user    = (data.get('user') or 'anonymous').strip()
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    openai_key = os.getenv('OPENAI_API_KEY')
    if not openai_key:
        return jsonify({'error': 'OPENAI_API_KEY not configured on server'}), 500

    system_prompt = (
        "You are NutriCare, an expert clinical nutritionist and dietitian. "
        "Respond concisely and helpfully to user questions about nutrition, diets, allergies, "
        "meal planning, and general healthy eating. Ask clarifying questions when necessary, "
        "be mindful of medical conditions and allergies, and avoid giving prescriptive medical "
        "advice—recommend consulting a healthcare professional when appropriate."
    )

    try:
        from ai_service import get_nutrition_reply
        assistant_json_str = get_nutrition_reply(user, message, [], system_prompt)
        try:
            parsed        = json.loads(assistant_json_str)
            assistant_msg = parsed.get("response", "Désolé, je n'ai pas pu formuler ma réponse.")
            suggestions   = parsed.get("suggestions", [])
        except json.JSONDecodeError:
            assistant_msg = assistant_json_str
            suggestions   = []
    except ImportError:
        return jsonify({'error': 'Module ai_service introuvable'}), 500
    except Exception as e:
        app.logger.exception('AI service failed')
        return jsonify({'error': 'AI service failed', 'detail': str(e)}), 502

    return jsonify({'reply': assistant_msg, 'suggestions': suggestions}), 200


@app.route('/chat/clear', methods=['POST'])
def clear_chat():
    data = request.get_json() or {}
    user = (data.get('user') or 'anonymous').strip()
    try:
        from chat_memory import clear_user
        clear_user(user)
        return jsonify({'message': 'Memory cleared'}), 200
    except ImportError:
        return jsonify({'error': 'Module chat_memory introuvable'}), 500
    except Exception as e:
        app.logger.exception('Failed to clear memory')
        return jsonify({'error': 'Failed to clear memory', 'detail': str(e)}), 500


# =============================================================================
#  BLUEPRINTS & ENTRY POINT
# =============================================================================

app.register_blueprint(rdv_bp)

if __name__ == '__main__':
    app.run(port=5000, debug=True)