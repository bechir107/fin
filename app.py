from dotenv import load_dotenv
load_dotenv()  
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
import MySQLdb
import os
import requests
import chat_memory
import ai_service


app = Flask(__name__)
CORS(app)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response


app.config['MAIL_SERVER']         = 'smtp.gmail.com'
app.config['MAIL_PORT']           = 465
app.config['MAIL_USE_TLS']        = False
app.config['MAIL_USE_SSL']        = True
app.config['MAIL_USERNAME']       = 'kanzari386@gmail.com'
app.config['MAIL_PASSWORD']       = 'mjbm hvgn rnmp zesz'
app.config['MAIL_DEFAULT_SENDER'] = ('Dr. Farouk Mrad', 'kanzari386@gmail.com')

mail = Mail(app)  # ← UNE SEULE FOIS, après la config
# ──────────────────────────────────────────────────────────────

def get_db():
    host = os.getenv('DB_HOST', '127.0.0.1')
    user = os.getenv('DB_USER', 'root')
    port = int(os.getenv('DB_PORT', '3306'))
    passwd = os.getenv('DB_PASS', 'spanzo')
    dbname = os.getenv('DB_NAME', 'nutrition_db')
    # Try TCP connection first, fall back to unix socket if needed
    try:
        return MySQLdb.connect(host=host, user=user, port=port, passwd=passwd, db=dbname, connect_timeout=5)
    except MySQLdb.OperationalError as e:
        app.logger.warning('MySQL TCP connection failed: %s', e)
        socket_path = os.getenv('DB_SOCKET', '/tmp/mysql.sock')
        try:
            return MySQLdb.connect(unix_socket=socket_path, user=user, passwd=passwd, db=dbname, connect_timeout=5)
        except Exception:
            app.logger.exception('MySQL connection failed (TCP and socket)')
            raise
@app.route('/loginUnified', methods=['POST'])
def loginUnified():
    data     = request.get_json()
    email    = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400

    db     = get_db()
    cursor = db.cursor()

    # Check patient first
    cursor.execute("SELECT * FROM patient WHERE email = %s", (email,))
    user = cursor.fetchone()
    if user:
        if user[6] != password:  # adjust index to your password column
            return jsonify({'message': 'Mot de passe incorrect'}), 401
        return jsonify({
            'message': 'Connexion réussie',
            'role':    'patient',
            'nom':     user[1],
            'prenom':  user[2],
        }), 200

    # Check nutritionist
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    if user:
        if user[2] != password:  # adjust index to your password column
            return jsonify({'message': 'Mot de passe incorrect'}), 401
        return jsonify({
            'message': 'Connexion réussie',
            'role':    'nutritionist',
            'nom':     user[0],
            'prenom':  user[1],
        }), 200

    return jsonify({'message': 'Email introuvable'}), 401

@app.route('/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400

    db     = get_db()
    cursor = db.cursor()

    # First try existing patient table
    cursor.execute("SELECT * FROM patient WHERE email = %s", (email,))
    user_by_email = cursor.fetchone()

    if user_by_email:
        # patient table uses `password` column at index 6 in this schema
        if user_by_email[6] != password:
            cursor.close()
            db.close()
            return jsonify({'message': 'Mot de passe incorrect'}), 401
        cursor.close()
        db.close()
        return jsonify({
            'message': 'Connexion réussie',
            'nom':     user_by_email[1],
            'prenom':  user_by_email[2],
        }), 200

    # Next, try nvpatient table (new patients). Column for password is `mot_de_passe`.
    cursor.execute("SELECT prenom, nom, mot_de_passe FROM nvpatient WHERE email = %s", (email,))
    nv = cursor.fetchone()
    if nv:
        prenom_nv, nom_nv, mot_de_passe = nv[0], nv[1], nv[2]
        if mot_de_passe != password:
            cursor.close()
            db.close()
            return jsonify({'message': 'Mot de passe incorrect'}), 401
        cursor.close()
        db.close()
        return jsonify({
            'message': 'Connexion réussie',
            'nom':     nom_nv,
            'prenom':  prenom_nv,
        }), 200

    # Finally, not found in patient or nvpatient
    cursor.close()
    db.close()
    return jsonify({'message': 'Email introuvable'}), 401


@app.route('/loginNut', methods=['POST'])
def loginNut():
    data     = request.get_json()
    email    = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400

    db     = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user_by_email = cursor.fetchone()

    if not user_by_email:
        return jsonify({'message': 'Email introuvable'}), 401

    cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))
    user = cursor.fetchone()

    if not user:
        return jsonify({'message': 'Mot de passe incorrect'}), 401

    return jsonify({
        'message': 'Connexion réussie',
        'nom':     user[0],
        'prenom':  user[1],
    }), 200


@app.route('/patient')
def patient():
    try:
        db     = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM rdv")
        patients      = cursor.fetchall()
        patients_list = []
        for p in patients:
            patients_list.append({
                "id":       p[0],
                "nom":      p[1],
                "prenom":   p[2],
                "email":    p[3],
                "hrdv":     p[4],
                "date_rdv": p[5]
            })
        return jsonify({"patients": patients_list}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        db.close()


# ─── Route accesP UNIQUE et correcte ──────────────────────────
@app.route('/accesP/<email>', methods=['GET'])
def accesP(email):
    db     = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT email, password FROM patient WHERE email = %s LIMIT 1", (email,))
    user = cursor.fetchone()

    if user is None:
        cursor.execute("SELECT email, password FROM users WHERE email = %s LIMIT 1", (email,))
        user = cursor.fetchone()

    cursor.close()
    db.close()

    if user is None:
        return jsonify({"message": "Aucun compte trouvé avec cet e-mail."}), 404

    try:
        send_reset_email(user[0], user[1])
        return jsonify({"message": "Votre mot de passe a été envoyé sur votre e-mail."}), 200
    except Exception as e:
        print(f"Erreur SMTP : {e}")
        return jsonify({"message": f"Erreur d'envoi : {str(e)}"}), 500


def send_reset_email(email, password):
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
        <p style="color: #555;">Voici vos identifiants de connexion :</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
          <p style="margin: 0; color: #555; font-size: 14px;">E-mail</p>
          <p style="margin: 4px 0 12px; font-weight: bold; color: #222;">{email}</p>
          <p style="margin: 0; color: #555; font-size: 14px;">Mot de passe</p>
          <p style="margin: 4px 0 0; font-weight: bold; font-size: 20px;
                    color: #2e7d32; letter-spacing: 2px;">{password}</p>
        </div>
        <a href="http://localhost:4200/login"
           style="display: block; background: #2e7d32; color: white;
                  text-align: center; padding: 14px; border-radius: 8px;
                  text-decoration: none; font-weight: bold;">
          Se connecter →
        </a>
      </div>
      <div style="background: #f9f9f9; padding: 16px; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #aaa; font-size: 12px;">© 2025 Dr. Farouk Mrad</p>
      </div>
    </div>
    """
    mail.send(msg)


@app.route('/prendrerdv', methods=['POST'])
def prendrerdv():
    data   = request.get_json()
    db     = get_db()
    nom    = data.get('nom')
    prenom = data.get('prenom')
    email  = data.get('email')
    date   = data.get('date')
    hrdv   = data.get('hrdv')

    if not all([nom, prenom, email, date, hrdv]):
        return jsonify({'message': 'Données manquantes'}), 400

    cur = db.cursor()
    cur.execute("SELECT * FROM rdv WHERE daterdv = %s AND hrdv = %s", (date, hrdv))
    if cur.fetchone():
        return jsonify({'message': 'Cette date et heure sont déjà réservées'})

    cur.execute(
        "INSERT INTO rdv (nom, prenom, email, hrdv, daterdv) VALUES (%s, %s, %s, %s, %s)",
        (nom, prenom, email, hrdv, date)
    )
    db.commit()
    return jsonify({'message': 'RDV ajouté avec succès'})


@app.route('/heures/<datehdv>', methods=['GET'])
def get_heures(datehdv):
    db     = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT hrdv FROM rdv WHERE daterdv = %s", (datehdv,))
    heures = [row[0] for row in cursor.fetchall()]
    return jsonify(heures)


@app.route('/ajoutep', methods=['POST'])
def ajoutep():
    try:
        db   = get_db()
        data = request.get_json()
        cur  = db.cursor()
        sql  = """
            INSERT INTO patient
            (nom, prenom, age, genre, email, password, tel, adresse, note_interne,
             taille, poids_actuiele, allergies, condition_med, niveau_act, objectif, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            data.get('nom'), data.get('prenom'), data.get('age'), data.get('sexe'),
            data.get('email'), data.get('password'), data.get('tel'), data.get('adress'),
            data.get('note_interne'), data.get('taille'), data.get('poids_actuiele'),
            data.get('allergie'), data.get('Conditions_me'), data.get('niveau_act'),
            data.get('objectif'), data.get('description')
        )
        cur.execute(sql, values)
        db.commit()
        cur.close()
        db.close()
        return jsonify({'message': 'Patient ajouté avec succès !'}), 201
    except Exception as e:
        print(e)
        return jsonify({'error': 'Impossible d\'ajouter le patient'}), 500


@app.route('/patientex/<chercher>', methods=['GET'])
def getpatient(chercher):
    db  = get_db()
    cur = db.cursor()
    cur.execute("SELECT nom, prenom, age, objectif, description FROM patient WHERE nom = %s", (chercher,))
    patient_list = []
    for p in cur.fetchall():
        patient_list.append({"nom": p[0], "prenom": p[1], "age": p[2], "objectif": p[3], "description": p[4]})
    return jsonify({"patients": patient_list}), 200


@app.route('/allpatient', methods=['GET'])
def getallpatient():
    db  = get_db()
    cur = db.cursor()
    cur.execute("SELECT * FROM patient")
    nut = []
    for p in cur.fetchall():
        nut.append({
            "id": p[0], "nom": p[1], "prenom": p[2], "age": p[3], "genre": p[4],
            "email": p[5], "password": p[6], "tel": p[7], "adresse": p[8],
            "note_interne": p[9], "taille": p[10], "poids_actuiele": p[11],
            "allergies": p[12], "condition_med": p[13], "niveau_act": p[14],
            "objectif": p[15], "description": p[16]
        })
    return jsonify({"personnes": nut}), 200


@app.route('/supppatient/<idp>', methods=['GET'])
def supppatient(idp):
    try:
        db  = get_db()
        cur = db.cursor()
        cur.execute("DELETE FROM patient WHERE id = %s", (idp,))
        db.commit()
        return jsonify({'message': 'Patient supprimé avec succès'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        db.close()


@app.route('/createPatient', methods=['POST'])
def createPatient():
    data           = request.get_json()
    prenom         = data.get('prenom', '').strip()
    nom            = data.get('nom', '').strip()
    email          = data.get('email', '').strip()
    telephone      = data.get('telephone', '').strip()
    date_naissance = data.get('date_naissance', '').strip()
    mot_de_passe   = data.get('mot_de_passe', '').strip()

    if not all([prenom, nom, email, mot_de_passe]):
        return jsonify({"message": "Champs obligatoires manquants."}), 400

    db     = get_db()
    cursor = db.cursor()
    # Ensure nvpatient table exists (some deployments use `patient` only)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS nvpatient (
            id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
            prenom VARCHAR(255),
            nom VARCHAR(255),
            email VARCHAR(255) UNIQUE,
            telephone VARCHAR(50),
            date_naissance DATE,
            mot_de_passe VARCHAR(255),
            date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)
    # Now safe to check for existing email
    cursor.execute("SELECT id FROM nvpatient WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close()
        db.close()
        return jsonify({"message": "Cet e-mail est déjà utilisé."}), 409

    cursor.execute("""
        INSERT INTO nvpatient (prenom, nom, email, telephone, date_naissance, mot_de_passe)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (prenom, nom, email, telephone, date_naissance, mot_de_passe))
    db.commit()
    cursor.close()
    db.close()
    return jsonify({"message": "Compte créé avec succès."}), 201


@app.route('/checkEmail/<email>', methods=['GET'])
def checkEmail(email):
    db = None
    cursor = None
    try:
        db     = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT id FROM nvpatient WHERE email = %s", (email,))
        exists = cursor.fetchone() is not None
        if not exists:
            cursor.execute("SELECT id FROM patient WHERE email = %s", (email,))
            exists = cursor.fetchone() is not None
        return jsonify({"exists": exists}), 200
    except Exception as e:
        app.logger.exception('checkEmail failed')
        return jsonify({'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@app.route('/dbstatus', methods=['GET'])
def dbstatus():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT 1')
        cursor.close()
        db.close()
        return jsonify({'db': 'ok'}), 200
    except Exception as e:
        app.logger.exception('DB status check failed')
        return jsonify({'db': 'error', 'message': str(e)}), 500


@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    """Simple chat endpoint that uses OpenAI Chat API."""
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.get_json() or {}
    user = (data.get('user') or 'anonymous').strip()
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    # Improveable system prompt for a nutritionist assistant
    system_prompt = (
        "You are NutriCare, an expert clinical nutritionist and dietitian. "
        "Respond concisely and helpfully to user questions about nutrition, diets, allergies, "
        "meal planning, and general healthy eating. Ask clarifying questions when necessary, "
        "be mindful of medical conditions and allergies, and avoid giving prescriptive medical "
        "advice—recommend consulting a healthcare professional when appropriate. Provide practical, "
        "evidence-based suggestions and clear, actionable steps the user can follow."
    )

    # load user's memory (list of messages)
    memory = chat_memory.get_messages(user)

    # build messages for the model: system + memory + new user message
    messages = [{"role": "system", "content": system_prompt}]
    # ensure memory items are in the form {role, content}
    for m in memory:
        messages.append({"role": m.get('role', 'user'), "content": m.get('content', '')})
    messages.append({"role": "user", "content": message})

    openai_key = os.getenv('OPENAI_API_KEY')
    if not openai_key:
        return jsonify({'error': 'OPENAI_API_KEY not configured on server'}), 500

    # Temporary disable memory for debugging
    memory = [] 
    
    import json
    try:
        assistant_json_str = ai_service.get_nutrition_reply(user, message, memory)
        print("======== OAI RAW RESPONSE ========")
        print(assistant_json_str)
        print("==================================")
        try:
            parsed = json.loads(assistant_json_str)
            assistant_msg = parsed.get("response", "Désolé, je n'ai pas pu formuler ma réponse.")
            suggestions = parsed.get("suggestions", [])
        except json.JSONDecodeError:
            assistant_msg = assistant_json_str
            suggestions = []
    except Exception as e:
        app.logger.exception('AI service failed')
        return jsonify({'error': 'AI service failed', 'detail': str(e)}), 502

    # Memory intentionally disabled per user request
    # try:
    #     chat_memory.add_message(user, 'user', message)
    #     if assistant_msg:
    #         chat_memory.add_message(user, 'assistant', assistant_msg)
    # except Exception:
    #     app.logger.exception('Failed to update chat memory')

    return jsonify({'reply': assistant_msg, 'suggestions': suggestions}), 200


@app.route('/chat/clear', methods=['POST'])
def clear_chat():
    data = request.get_json() or {}
    user = (data.get('user') or 'anonymous').strip()
    try:
        chat_memory.clear_user(user)
        return jsonify({'message': 'Memory cleared'}), 200
    except Exception as e:
        app.logger.exception('Failed to clear memory')
        return jsonify({'error': 'Failed to clear memory', 'detail': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)