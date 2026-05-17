import os
import re
import hashlib
import json
from datetime import datetime, timedelta
import datetime as dt

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
import MySQLdb.cursors
from db import get_db
from routes.rdv_routes import rdv_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

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
def hash_password(pwd):
    return hashlib.sha256(pwd.encode('utf-8')).hexdigest()

def parse_int(value, default=0):
    try:
        return int(value) if value not in (None, '', 'null') else default
    except (ValueError, TypeError):
        return default

def is_valid_email(email):
    return bool(re.match(r'^[\w.+-]+@[\w-]+\.[a-z]{2,}$', email, re.I))

# =============================================================================
#  AUTH
# =============================================================================
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email    = data.get('email', '').strip()
    password = data.get('password', '').strip()
    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400

    db = get_db(); cursor = db.cursor()
    cursor.execute("SELECT id, nom, prenom, email, password FROM user WHERE email = %s", (email,))
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
    return jsonify({'message': 'Connexion réussie', 'role': role,
                    'id': user_id, 'nom': user[1], 'prenom': user[2]}), 200

# =============================================================================
#  MOT DE PASSE & ACCÈS
# =============================================================================
@app.route('/accesP/<email>', methods=['GET'])
def accesP(email):
    db = get_db(); cursor = db.cursor()
    cursor.execute("SELECT email FROM user WHERE email = %s LIMIT 1", (email,))
    user = cursor.fetchone()
    cursor.close(); db.close()
    if user is None:
        return jsonify({"message": "Aucun compte trouvé avec cet e-mail."}), 404
    try:
        msg = Message(subject="Récupération mot de passe", recipients=[user[0]])
        msg.html = "<p>Contactez le cabinet pour réinitialiser votre mot de passe.</p>"
        mail.send(msg)
        return jsonify({"message": "E-mail envoyé."}), 200
    except Exception as e:
        return jsonify({"message": f"Erreur d'envoi : {str(e)}"}), 500

# =============================================================================
#  REGISTER  (CORRIGÉ : fusion compte temporaire + nouveau patient)
# =============================================================================
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    required = ['nom', 'prenom', 'ddn', 'email', 'password', 'telephone',
                'sexe', 'adresse', 'objectif']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'message': f"Champs manquants : {', '.join(missing)}"}), 400
    if not is_valid_email(data['email']):
        return jsonify({'message': 'Email invalide.'}), 400
    if len(data['password']) < 8:
        return jsonify({'message': 'Mot de passe trop court (min 8 caractères).'}), 400
    telephone = parse_int(data.get('telephone'))

    db = get_db(); cursor = db.cursor()

    # Vérifier si l'email est déjà utilisé par un compte ACTIF
    cursor.execute("SELECT id FROM user WHERE email = %s AND status = 'actif'", (data['email'],))
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({'message': 'Email déjà utilisé.'}), 409

    try:
        # --- Scénario Yassine : chercher un compte TEMPORAIRE par téléphone ---
        cursor.execute(
            "SELECT id FROM user WHERE telephone = %s AND status = 'temporaire' LIMIT 1",
            (telephone,)
        )
        existing = cursor.fetchone()

        if existing:
            # Le patient avait un RDV téléphonique → on COMPLÈTE son compte
            user_id = existing[0]
            cursor.execute("""
                UPDATE user
                SET nom=%s, prenom=%s, ddn=%s, email=%s, password=%s, status='actif'
                WHERE id=%s
            """, (data['nom'].strip(), data['prenom'].strip(), data['ddn'],
                  data['email'].strip().lower(), hash_password(data['password']), user_id))

            # Compléter la ligne patient existante (créée lors du RDV téléphonique)
            cursor.execute("""
                UPDATE patient
                SET sexe=%s, adresse=%s,
                    allergie=%s, maladie_chronique=%s, objectif=%s
                WHERE id_user=%s
            """, (data['sexe'], data['adresse'].strip(),
                  data.get('allergie', '').strip() or None,
                  data.get('maladie_chronique', '').strip() or None,
                  data['objectif'], user_id))

        else:
            # Nouveau patient sans RDV préalable → création classique
            cursor.execute("""
                INSERT INTO user (nom, prenom, ddn, email, password, telephone, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'actif')
            """, (data['nom'].strip(), data['prenom'].strip(), data['ddn'],
                  data['email'].strip().lower(), hash_password(data['password']), telephone))
            user_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO patient (id_user, sexe, adresse, allergie, maladie_chronique, objectif, ddc)
                VALUES (%s, %s, %s, %s, %s, %s, CURDATE())
            """, (user_id, data['sexe'], data['adresse'].strip(),
                  data.get('allergie', '').strip() or None,
                  data.get('maladie_chronique', '').strip() or None,
                  data['objectif']))

        db.commit()
        return jsonify({'message': 'Compte créé avec succès.', 'user_id': user_id}), 201

    except Exception as e:
        db.rollback()
        return jsonify({'message': f'Erreur : {str(e)}'}), 500
    finally:
        cursor.close(); db.close()

# =============================================================================
#  PATIENTS
# =============================================================================
@app.route('/createPatient', methods=['POST'])
def createPatient():
    data = request.get_json()
    nom    = data.get('nom', '').strip()
    prenom = data.get('prenom', '').strip()
    ddn    = data.get('ddn', '').strip()
    email  = data.get('email', '').strip()
    password = data.get('password', '').strip()
    telephone = parse_int(data.get('telephone'))
    sexe   = data.get('sexe', '').strip()
    adresse = data.get('adresse', '').strip()
    allergie = data.get('allergie', '').strip()
    maladie_chronique = data.get('maladie_chronique', '').strip()
    objectif = data.get('objectif', '').strip()

    if not all([nom, prenom, email, password]):
        return jsonify({"message": "Champs obligatoires manquants."}), 400

    db = get_db(); cursor = db.cursor()
    cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({"message": "E-mail déjà utilisé."}), 409
    try:
        cursor.execute("""
            INSERT INTO user (nom, prenom, ddn, email, password, telephone, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'actif')
        """, (nom, prenom, ddn, email, hash_password(password), telephone))
        user_id = cursor.lastrowid
        cursor.execute("""
            INSERT INTO patient (id_user, sexe, adresse, allergie, maladie_chronique, objectif, ddc)
            VALUES (%s, %s, %s, %s, %s, %s, CURDATE())
        """, (user_id, sexe, adresse,
              allergie or None, maladie_chronique or None, objectif))
        db.commit()
        return jsonify({"message": "Patient créé.", "id_user": user_id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Erreur : {str(e)}"}), 500
    finally:
        cursor.close(); db.close()

@app.route('/api/patient/simple', methods=['POST'])
def createPatientSimple():
    data = request.get_json()
    nom       = (data.get('nom', '') or '').strip()
    prenom    = (data.get('prenom', '') or '').strip()
    email     = (data.get('email', '') or '').strip()
    telephone = (data.get('telephone', '') or '').strip()

    if not all([nom, prenom, email]):
        return jsonify({"message": "Nom, prénom et email sont obligatoires."}), 400
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return jsonify({"message": "Adresse email invalide."}), 400

    temp_password = "Nutri" + os.urandom(3).hex()

    db = get_db(); cursor = db.cursor()
    cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({"message": "E-mail déjà utilisé."}), 409
    try:
        cursor.execute("""
            INSERT INTO user (nom, prenom, email, password, telephone, status)
            VALUES (%s, %s, %s, %s, %s, 'actif')
        """, (nom, prenom, email, hash_password(temp_password), telephone or None))
        user_id = cursor.lastrowid
        cursor.execute("""
            INSERT INTO patient (id_user, sexe, adresse, allergie, maladie_chronique, objectif, ddc)
            VALUES (%s, '', '', NULL, NULL, '', CURDATE())
        """, (user_id,))
        db.commit()
        return jsonify({
            "message": "Patient créé avec succès.",
            "id_user": user_id,
            "mot_de_passe_temp": temp_password
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Erreur : {str(e)}"}), 500
    finally:
        cursor.close(); db.close()

@app.route('/checkEmail/<email>', methods=['GET'])
def checkEmail(email):
    db = get_db(); cursor = db.cursor()
    cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
    exists = cursor.fetchone() is not None
    cursor.close(); db.close()
    return jsonify({"exists": exists}), 200

@app.route('/me/<email>', methods=['GET'])
def get_user_profile(email):
    db = get_db(); cursor = db.cursor()
    cursor.execute("SELECT id, nom, prenom, ddn, email, telephone FROM user WHERE email = %s", (email,))
    user = cursor.fetchone()
    if not user:
        cursor.close(); db.close()
        return jsonify({"message": "Utilisateur non trouvé"}), 404
    cursor.execute("""
        SELECT sexe, adresse, allergie, maladie_chronique, objectif
        FROM patient WHERE id_user = %s
    """, (user[0],))
    patient = cursor.fetchone()
    cursor.close(); db.close()
    result = {
        "id": user[0], "nom": user[1], "prenom": user[2],
        "ddn": str(user[3]) if user[3] else None,
        "email": user[4], "telephone": user[5]
    }
    if patient:
        result.update({
            "sexe": patient[0], "adresse": patient[1],
            "allergie": patient[2] or "", "maladie_chronique": patient[3] or "",
            "objectif": patient[4]
        })
    return jsonify(result), 200

@app.route('/updateProfile', methods=['POST'])
def update_profile():
    data = request.get_json()
    email = data.get('email', '').strip()
    if not email:
        return jsonify({"message": "Email requis"}), 400
    db = get_db(); cursor = db.cursor()
    try:
        cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "Utilisateur non trouvé"}), 404
        user_id = user[0]
        cursor.execute("""
            UPDATE user SET nom=%s, prenom=%s, ddn=%s, telephone=%s WHERE id=%s
        """, (data.get('nom'), data.get('prenom'), data.get('ddn'),
              parse_int(data.get('telephone')), user_id))
        cursor.execute("""
            UPDATE patient
            SET sexe=%s, adresse=%s, allergie=%s, maladie_chronique=%s, objectif=%s
            WHERE id_user=%s
        """, (data.get('sexe'), data.get('adresse'),
              data.get('allergie', '').strip() or None,
              data.get('maladie_chronique', '').strip() or None,
              data.get('objectif'), user_id))
        db.commit()
        return jsonify({"message": "Profil mis à jour"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Erreur : {str(e)}"}), 500
    finally:
        cursor.close(); db.close()

@app.route('/allpatient', methods=['GET'])
def getallpatient():
    db = get_db(); cursor = db.cursor()
    cursor.execute("""
        SELECT u.id, u.nom, u.prenom, u.ddn, u.email, u.telephone,
               p.id_patient, p.sexe, p.adresse,
               p.allergie, p.maladie_chronique, p.objectif, p.ddc
        FROM user u
        INNER JOIN patient p ON u.id = p.id_user
    """)
    patients = [{
        "id": r[0], "nom": r[1], "prenom": r[2],
        "ddn": str(r[3]) if r[3] else None,
        "email": r[4], "telephone": r[5], "id_patient": r[6],
        "sexe": r[7], "adresse": r[8],
        "allergie": r[9], "maladie_chronique": r[10],
        "objectif": r[11], "ddc": str(r[12]) if r[12] else None
    } for r in cursor.fetchall()]
    cursor.close(); db.close()
    return jsonify({"patients": patients}), 200

@app.route('/patient/<int:id_patient>', methods=['GET'])
def getPatient(id_patient):
    db = get_db(); cursor = db.cursor()
    cursor.execute("""
        SELECT u.id, u.nom, u.prenom, u.ddn, u.email, u.telephone,
               p.id_patient, p.sexe, p.adresse,
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
        "id": r[0], "nom": r[1], "prenom": r[2],
        "ddn": str(r[3]) if r[3] else None,
        "email": r[4], "telephone": r[5], "id_patient": r[6],
        "sexe": r[7], "adresse": r[8],
        "allergie": r[9], "maladie_chronique": r[10],
        "objectif": r[11], "ddc": str(r[12]) if r[12] else None
    }), 200

@app.route('/patientex/<chercher>', methods=['GET'])
def getpatient(chercher):
    db = get_db(); cursor = db.cursor()
    cursor.execute("""
        SELECT u.id, u.nom, u.prenom, p.id_patient, p.objectif, p.maladie_chronique
        FROM user u
        INNER JOIN patient p ON u.id = p.id_user
        WHERE u.nom = %s
    """, (chercher,))
    patients = [{
        "id": r[0], "nom": r[1], "prenom": r[2],
        "id_patient": r[3], "objectif": r[4], "maladie_chronique": r[5]
    } for r in cursor.fetchall()]
    cursor.close(); db.close()
    return jsonify({"patients": patients}), 200

@app.route('/supppatient/<int:id_patient>', methods=['DELETE'])
def supppatient(id_patient):
    db = get_db(); cursor = db.cursor()
    try:
        cursor.execute("SELECT id_user FROM patient WHERE id_patient = %s", (id_patient,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'message': 'Patient introuvable'}), 404
        cursor.execute("DELETE FROM user WHERE id = %s", (row[0],))
        db.commit()
        return jsonify({'message': 'Patient supprimé'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close(); db.close()

@app.route('/api/patients', methods=['GET'])
def get_patients_list():
    db = get_db(); cursor = db.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute("""
        SELECT p.id_patient, CONCAT(u.prenom, ' ', u.nom) AS nom_complet
        FROM patient p
        JOIN user u ON p.id_user = u.id
        ORDER BY u.nom, u.prenom
    """)
    rows = cursor.fetchall()
    cursor.close(); db.close()
    return jsonify(rows), 200

# =============================================================================
#  RENDEZ-VOUS — PRISE PAR TÉLÉPHONE (secrétaire/nutritionniste)
#  Route : POST /api/appointments/telephonique  OU  POST /api/rendez-vous
#  CORRECTION : une seule déclaration pour éviter le conflit de route Flask
# =============================================================================
@app.route('/api/appointments/telephonique', methods=['POST'])
@app.route('/api/rendez-vous', methods=['POST'])
def prendre_rdv_telephonique():
    data = request.get_json()
    nom              = data.get('nom', '').strip()
    prenom           = data.get('prenom', '').strip()
    telephone        = data.get('telephone')
    date_rdv         = data.get('date_rendez_vous')
    heure_rdv        = data.get('heure')
    id_nutritionniste = data.get('id_nutritionniste', 1)

    if not all([nom, prenom, telephone, date_rdv, heure_rdv, id_nutritionniste]):
        return jsonify({'message': 'Veuillez remplir tous les champs nécessaires.'}), 400

    db = get_db(); cursor = db.cursor()
    try:
        cursor.execute("SELECT id FROM user WHERE telephone = %s LIMIT 1", (telephone,))
        user_row = cursor.fetchone()

        if user_row:
            user_id = user_row[0]
            cursor.execute("SELECT id_patient FROM patient WHERE id_user = %s LIMIT 1", (user_id,))
            patient_row = cursor.fetchone()
            if patient_row:
                id_patient_final = patient_row[0]
            else:
                cursor.execute("INSERT INTO patient (id_user, ddc) VALUES (%s, CURDATE())", (user_id,))
                id_patient_final = cursor.lastrowid
        else:
            cursor.execute("""
                INSERT INTO user (nom, prenom, ddn, email, password, telephone, status)
                VALUES (%s, %s, NULL, NULL, NULL, %s, 'temporaire')
            """, (nom, prenom, telephone))
            user_id = cursor.lastrowid
            cursor.execute("INSERT INTO patient (id_user, ddc) VALUES (%s, CURDATE())", (user_id,))
            id_patient_final = cursor.lastrowid

        cursor.execute("""
            INSERT INTO rendez_vous (id_patient, id_nutritionniste, date_rendez_vous, heure, statut)
            VALUES (%s, %s, %s, %s, 'confirme')
        """, (id_patient_final, id_nutritionniste, date_rdv, heure_rdv))
        new_rdv_id = cursor.lastrowid
        db.commit()
        return jsonify({'message': 'Rendez-vous enregistré avec succès !', 'id_rendez_vous': new_rdv_id}), 201

    except Exception as e:
        db.rollback()
        return jsonify({'message': "Erreur interne lors de l'enregistrement.", 'error': str(e)}), 500
    finally:
        cursor.close(); db.close()

# =============================================================================
#  RENDEZ-VOUS — RÉCUPÉRATION (GET)
# =============================================================================
@app.route('/rendez_vous', methods=['GET'])
def getAllRdv():
    db = get_db(); cursor = db.cursor()
    cursor.execute("""
        SELECT rv.id_rendez_vous, rv.date_rendez_vous, rv.heure, rv.statut,
               u.nom, u.prenom, u.email
        FROM rendez_vous rv
        INNER JOIN patient p  ON rv.id_patient = p.id_patient
        INNER JOIN user u     ON p.id_user = u.id
    """)
    rdv_list = [{
        "id_rendez_vous": r[0],
        "date_rendez_vous": str(r[1]) if r[1] else None,
        "heure": str(r[2]) if r[2] else None,
        "statut": r[3], "nom": r[4], "prenom": r[5], "email": r[6]
    } for r in cursor.fetchall()]
    cursor.close(); db.close()
    return jsonify({"rendez_vous": rdv_list}), 200

@app.route('/api/appointments', methods=['GET'])
@app.route('/api/rendez-vous', methods=['GET'])
def get_appointments():
    from datetime import date as date_type
    date_param = request.args.get('date', date_type.today().isoformat())
    db = get_db(); cursor = db.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute("""
        SELECT rv.id_rendez_vous, rv.id_patient, rv.id_nutritionniste,
               rv.date_rendez_vous,
               TIME_FORMAT(rv.heure, '%%H:%%i') AS heure,
               rv.statut,
               u.nom AS patient_nom, u.prenom AS patient_prenom,
               u.telephone, u.email,
               p.sexe, p.adresse, p.allergie, p.maladie_chronique, p.objectif, p.ddc,
               (SELECT COUNT(*) FROM consultation c WHERE c.id_rendez_vous = rv.id_rendez_vous) AS has_consultation
        FROM rendez_vous rv
        JOIN patient p ON rv.id_patient = p.id_patient
        JOIN user u    ON p.id_user = u.id
        WHERE rv.date_rendez_vous = %s
        ORDER BY rv.heure ASC
    """, (date_param,))
    results = cursor.fetchall()
    for r in results:
        if r.get('date_rendez_vous'): r['date_rendez_vous'] = r['date_rendez_vous'].isoformat()
        if r.get('ddc'):              r['ddc'] = r['ddc'].isoformat()
    cursor.close(); db.close()
    return jsonify(results), 200

# =============================================================================
#  RENDEZ-VOUS — CRÉATION WEB (depuis Angular patient connecté)
# =============================================================================
@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    data = request.get_json()
    id_patient  = data.get('id_patient')
    date_rdv    = data.get('date_rendez_vous')
    heure       = data.get('heure')
    id_nutri    = data.get('id_nutritionniste', 1)
    if not all([id_patient, date_rdv, heure]):
        return jsonify({'error': 'Champs manquants'}), 400
    db = get_db(); cursor = db.cursor()
    try:
        cursor.execute("""
            INSERT INTO rendez_vous (id_patient, id_nutritionniste, date_rendez_vous, heure, statut)
            VALUES (%s, %s, %s, %s, 'en_attente')
        """, (id_patient, id_nutri, date_rdv, heure))
        db.commit()
        new_id = cursor.lastrowid
        return jsonify({'message': 'RDV créé', 'id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 409
    finally:
        cursor.close(); db.close()

@app.route('/prendrerdv', methods=['POST'])
def prendrerdv():
    data = request.get_json()
    id_patient        = data.get('id_patient')
    id_nutritionniste = data.get('id_nutritionniste')
    date_rendez_vous  = data.get('date_rendez_vous')
    heure             = data.get('heure')
    if not all([id_patient, id_nutritionniste, date_rendez_vous, heure]):
        return jsonify({'message': 'Données manquantes'}), 400
    db = get_db(); cursor = db.cursor()
    cursor.execute("""
        SELECT id_rendez_vous FROM rendez_vous
        WHERE id_nutritionniste = %s AND date_rendez_vous = %s AND heure = %s
    """, (id_nutritionniste, date_rendez_vous, heure))
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({'message': 'Créneau déjà réservé'}), 409
    cursor.execute("""
        INSERT INTO rendez_vous (id_patient, id_nutritionniste, date_rendez_vous, heure, statut)
        VALUES (%s, %s, %s, %s, 'en_attente')
    """, (id_patient, id_nutritionniste, date_rendez_vous, heure))
    db.commit()
    new_id = cursor.lastrowid
    cursor.close(); db.close()
    return jsonify({'message': 'Rendez-vous ajouté', 'id_rendez_vous': new_id}), 201

# =============================================================================
#  RENDEZ-VOUS — STATUT / SUPPRESSION
# =============================================================================
@app.route('/api/appointments/<int:rdv_id>/statut', methods=['PATCH', 'PUT'])
@app.route('/api/rendez-vous/<int:rdv_id>/statut', methods=['PATCH', 'PUT'])
def update_statut(rdv_id):
    data   = request.get_json()
    statut = data.get('statut', '').strip()
    if statut not in ('en_attente', 'confirme', 'annule'):
        return jsonify({'error': 'Statut invalide'}), 400
    db = get_db(); cursor = db.cursor()
    cursor.execute("UPDATE rendez_vous SET statut = %s WHERE id_rendez_vous = %s", (statut, rdv_id))
    db.commit(); cursor.close(); db.close()
    return jsonify({'success': True, 'id': rdv_id, 'statut': statut}), 200

@app.route('/rdv/<int:id_rdv>/statut', methods=['PUT'])
def updateStatutRdv(id_rdv):
    data   = request.get_json()
    statut = data.get('statut', '').strip()
    if not statut:
        return jsonify({'message': 'Statut requis'}), 400
    db = get_db(); cursor = db.cursor()
    cursor.execute("UPDATE rendez_vous SET statut = %s WHERE id_rendez_vous = %s", (statut, id_rdv))
    db.commit(); cursor.close(); db.close()
    return jsonify({'message': 'Statut mis à jour'}), 200

@app.route('/api/appointments/<int:rdv_id>', methods=['DELETE'])
def delete_appointment(rdv_id):
    db = get_db(); cursor = db.cursor()
    cursor.execute("DELETE FROM rendez_vous WHERE id_rendez_vous = %s", (rdv_id,))
    db.commit(); cursor.close(); db.close()
    return jsonify({'message': 'RDV supprimé'}), 200

@app.route('/heures/<date_rdv>', methods=['GET'])
def get_heures(date_rdv):
    db = get_db(); cursor = db.cursor()
    cursor.execute("SELECT heure FROM rendez_vous WHERE date_rendez_vous = %s", (date_rdv,))
    heures = [str(row[0]) for row in cursor.fetchall()]
    cursor.close(); db.close()
    return jsonify(heures), 200

@app.route('/api/available-slots/<date_rdv>', methods=['GET'])
def get_available_slots(date_rdv):
    jours = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
    try:
        date_obj = datetime.strptime(date_rdv, '%Y-%m-%d')
    except Exception:
        return jsonify([]), 400
    nom_jour = jours[date_obj.weekday()]

    db = get_db(); cursor = db.cursor()
    
    cursor.execute("SELECT heure_debut, heure_fin FROM disponibilite WHERE jour = %s", (nom_jour,))
    dispos = cursor.fetchall()
    
    tous_creneaux = []
    for dispo in dispos:
        h_deb, h_fin = dispo[0], dispo[1]
        
        if isinstance(h_deb, dt.timedelta):
            s = int(h_deb.total_seconds())
            h_deb = dt.time(s // 3600, (s % 3600) // 60)
        if isinstance(h_fin, dt.timedelta):
            s = int(h_fin.total_seconds())
            h_fin = dt.time(s // 3600, (s % 3600) // 60)
            
        current = datetime.combine(date_obj, h_deb)
        fin = datetime.combine(date_obj, h_fin)
        
        while current < fin:
            tous_creneaux.append(current.strftime('%H:%M'))
            current += timedelta(minutes=45)
            
    cursor.execute("SELECT heure FROM rendez_vous WHERE date_rendez_vous = %s", (date_rdv,))
    prises = []
    for r in cursor.fetchall():
        h = r[0]
        if isinstance(h, dt.timedelta):
            s = int(h.total_seconds())
            prises.append(f"{s // 3600:02d}:{(s % 3600) // 60:02d}")
        else:
            prises.append(str(h)[:5])
            
    cursor.close(); db.close()
    
    disponibles = [c for c in tous_creneaux if c not in prises]
    return jsonify(disponibles), 200

@app.route('/rdv/patient/<int:id_patient>', methods=['GET'])
def getRdvPatient(id_patient):
    db = get_db(); cursor = db.cursor()
    cursor.execute("""
        SELECT id_rendez_vous, date_rendez_vous, heure, statut
        FROM rendez_vous WHERE id_patient = %s
    """, (id_patient,))
    rdv_list = [{
        "id_rendez_vous": r[0],
        "date_rendez_vous": str(r[1]) if r[1] else None,
        "heure": str(r[2]) if r[2] else None,
        "statut": r[3]
    } for r in cursor.fetchall()]
    cursor.close(); db.close()
    return jsonify({"rendez_vous": rdv_list}), 200

# =============================================================================
#  CONSULTATIONS
# =============================================================================
@app.route('/consultations', methods=['GET'])
def getAllConsultations():
    page     = parse_int(request.args.get('page'), 1)
    per_page = parse_int(request.args.get('per_page'), 10)
    search     = request.args.get('search', '').strip()
    diagnostic = request.args.get('diagnostic', '').strip()

    db = get_db(); cursor = db.cursor()
    query = """
        SELECT c.id_consultation, c.date_consultation, c.poids, c.tension_arterielle,
               c.glycemie, c.diagnostic, c.remarque, c.id_rendez_vous,
               u.nom, u.prenom, p.id_patient
        FROM consultation c
        INNER JOIN rendez_vous rv ON c.id_rendez_vous = rv.id_rendez_vous
        INNER JOIN patient p      ON rv.id_patient = p.id_patient
        INNER JOIN user u         ON p.id_user = u.id
        WHERE 1=1
    """
    params = []
    if search:
        query += " AND (c.remarque LIKE %s OR c.diagnostic LIKE %s OR u.nom LIKE %s OR u.prenom LIKE %s)"
        params.extend([f"%{search}%"] * 4)
    if diagnostic:
        query += " AND c.diagnostic = %s"
        params.append(diagnostic)
    query += " ORDER BY c.date_consultation DESC"
    cursor.execute(query, tuple(params))
    raw_rows = cursor.fetchall()

    # Dédoublonner par id_consultation (un patient peut avoir plusieurs rendez_vous)
    seen = set()
    rows = []
    for r in raw_rows:
        if r[0] not in seen:
            seen.add(r[0])
            rows.append(r)

    total = len(rows)
    start = (page - 1) * per_page
    consultations = [{
        "id_consultation": r[0],
        "date_consultation": str(r[1]) if r[1] else None,
        "poids": float(r[2]) if r[2] else None,
        "tension_arterielle": r[3], "glycemie": r[4],
        "diagnostic": r[5], "remarque": r[6],
        "id_rendez_vous": r[7], "nom": r[8], "prenom": r[9], "id_patient": r[10]
    } for r in rows[start:start + per_page]]
    cursor.close(); db.close()
    return jsonify({
        "data": consultations, "total": total, "page": page,
        "pages": (total + per_page - 1) // per_page if per_page else 1
    }), 200

@app.route('/consultations', methods=['POST'])
@app.route('/api/consultations', methods=['POST'])
def addConsultation():
    data = request.get_json()
    if not data.get('id_rendez_vous'):
        return jsonify({'message': 'id_rendez_vous requis'}), 400
    db = get_db(); cursor = db.cursor()
    cursor.execute("""
        INSERT INTO consultation (id_rendez_vous, date_consultation, poids, tension_arterielle, glycemie, diagnostic, remarque)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (data.get('id_rendez_vous'), data.get('date_consultation'), data.get('poids'),
          data.get('tension_arterielle'), data.get('glycemie'),
          data.get('diagnostic'), data.get('remarque')))
    db.commit()
    new_id = cursor.lastrowid
    cursor.close(); db.close()
    return jsonify({'message': 'Consultation ajoutée', 'id_consultation': new_id}), 201

@app.route('/consultation/patient/<int:id_patient>', methods=['GET'])
@app.route('/api/consultations/patient/<int:id_patient>', methods=['GET'])
def getConsultationsPatient(id_patient):
    db = get_db(); cursor = db.cursor()
    cursor.execute("""
        SELECT c.id_consultation, c.date_consultation, c.poids, c.tension_arterielle,
               c.glycemie, c.diagnostic, c.remarque, c.id_rendez_vous
        FROM consultation c
        INNER JOIN rendez_vous rv ON c.id_rendez_vous = rv.id_rendez_vous
        WHERE rv.id_patient = %s
        ORDER BY c.date_consultation DESC
    """, (id_patient,))
    consultations = [{
        "id_consultation": r[0],
        "date_consultation": str(r[1]) if r[1] else None,
        "poids": float(r[2]) if r[2] else None,
        "tension_arterielle": r[3], "glycemie": r[4],
        "diagnostic": r[5], "remarque": r[6], "id_rendez_vous": r[7]
    } for r in cursor.fetchall()]
    cursor.close(); db.close()
    return jsonify({"consultations": consultations}), 200

@app.route('/consultations/<int:id_consultation>', methods=['PUT'])
def updateConsultation(id_consultation):
    data = request.get_json()
    db = get_db(); cursor = db.cursor()
    cursor.execute("""
        UPDATE consultation
        SET date_consultation=%s, poids=%s, tension_arterielle=%s,
            glycemie=%s, diagnostic=%s, remarque=%s
        WHERE id_consultation=%s
    """, (data.get('date_consultation'), data.get('poids'), data.get('tension_arterielle'),
          data.get('glycemie'), data.get('diagnostic'), data.get('remarque'), id_consultation))
    db.commit(); cursor.close(); db.close()
    return jsonify({'message': 'Consultation mise à jour'}), 200

@app.route('/consultations/<int:id_consultation>', methods=['DELETE'])
def deleteConsultation(id_consultation):
    db = get_db(); cursor = db.cursor()
    cursor.execute("DELETE FROM consultation WHERE id_consultation = %s", (id_consultation,))
    db.commit(); cursor.close(); db.close()
    return jsonify({'message': 'Consultation supprimée'}), 200

@app.route('/consultations/stats', methods=['GET'])
def getConsultationsStats():
    db = get_db(); cursor = db.cursor()
    cursor.execute("SELECT COUNT(*), AVG(poids) FROM consultation")
    r = cursor.fetchone()
    total       = r[0] if r else 0
    poids_moyen = float(r[1]) if r and r[1] else 0.0
    cursor.execute("""
        SELECT diagnostic, COUNT(*) FROM consultation
        WHERE diagnostic IS NOT NULL AND diagnostic != ''
        GROUP BY diagnostic
    """)
    par_diagnostic = [{"label": row[0], "count": row[1]} for row in cursor.fetchall()]
    cursor.close(); db.close()
    return jsonify({
        "total": total,
        "poids_moyen": round(poids_moyen, 1),
        "par_diagnostic": par_diagnostic
    }), 200

# =============================================================================
#  NUTRITIONNISTE — RDV DU JOUR
#  CORRECTION : cursor(MySQLdb.cursors.DictCursor) au lieu de cursor(dictionary=True)
# =============================================================================
@app.route('/api/nutritionniste/rdv-aujourdhui', methods=['GET'])
def get_rdv_aujourdhui():
    db = get_db()
    cursor = db.cursor(MySQLdb.cursors.DictCursor)   # ← CORRIGÉ
    query = """
        SELECT
            rv.id_rendez_vous,
            TIME_FORMAT(rv.heure, '%%H:%%i') AS heure,
            rv.statut,
            p.id_patient,
            u.nom,
            u.prenom,
            u.telephone,
            u.status
        FROM rendez_vous rv
        JOIN patient p ON rv.id_patient = p.id_patient
        JOIN user u    ON p.id_user = u.id
        WHERE rv.date_rendez_vous = CURDATE()
        ORDER BY rv.heure ASC
    """
    try:
        cursor.execute(query)
        rdvs = cursor.fetchall()
        return jsonify(rdvs), 200
    except Exception as e:
        return jsonify({'message': f'Erreur de récupération : {str(e)}'}), 500
    finally:
        cursor.close(); db.close()

# =============================================================================
#  NUTRITIONNISTE — CRÉATION DE COMPTE
# =============================================================================
@app.route('/createNutritionniste', methods=['POST'])
def createNutritionniste():
    data = request.get_json()
    nom       = data.get('nom', '').strip()
    prenom    = data.get('prenom', '').strip()
    ddn       = data.get('ddn', '').strip()
    email     = data.get('email', '').strip()
    password  = data.get('password', '').strip()
    telephone = parse_int(data.get('telephone'))
    if not all([nom, prenom, email, password]):
        return jsonify({"message": "Champs manquants."}), 400
    db = get_db(); cursor = db.cursor()
    cursor.execute("SELECT id FROM user WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close(); db.close()
        return jsonify({"message": "E-mail déjà utilisé."}), 409
    try:
        cursor.execute("""
            INSERT INTO user (nom, prenom, ddn, email, password, telephone, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'actif')
        """, (nom, prenom, ddn, email, hash_password(password), telephone))
        user_id = cursor.lastrowid
        cursor.execute("INSERT INTO nutritionniste (id_user) VALUES (%s)", (user_id,))
        db.commit()
        return jsonify({"message": "Nutritionniste créé.", "id": user_id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"message": f"Erreur : {str(e)}"}), 500
    finally:
        cursor.close(); db.close()

# =============================================================================
#  LANCEMENT
# =============================================================================
if __name__ == '__main__':
    app.run(debug=True, port=5000)