from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
import MySQLdb

app = Flask(__name__)
CORS(app)
mail = Mail(app)

def get_db():
    return MySQLdb.connect(
        host="localhost",
        user="root",
        password="",
        database="nutrition_db"
    )
@app.route('/login', methods=['POST'])
def login():
    data =request.get_json()
    email= data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400
    else:
        db     = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM patient WHERE email = %s", (email,))
        user_by_email = cursor.fetchone()

        if not user_by_email:
            return jsonify({'message': 'Email introuvable'}), 401

        cursor.execute("SELECT * FROM patient WHERE email = %s and password = %s", (email, password))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Mot de passe incorrect'}), 401

        return jsonify({
            'message': 'Connexion réussie',
            'nom':user[1],
            'prenom':user[2],
           
            
        }), 200
@app.route('/loginNut', methods=['POST'])
def loginNut():
    data =request.get_json()
    email= data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400
    else:
        db     = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user_by_email = cursor.fetchone()

        if not user_by_email:
            return jsonify({'message': 'Email introuvable'}), 401

        cursor.execute("SELECT * FROM users WHERE email = %s and password = %s", (email, password))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Mot de passe incorrect'}), 401

        return jsonify({
            'message': 'Connexion réussie',
            'nom':user[0],
            'prenom':user[1],
        })
           
            
        
@app.route('/patient')
def patient():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM rdv")
        patients = cursor.fetchall()
        patients_list = []
        for patient in patients:
            patients_list.append({
                "id": patient[0],
                "nom": patient[1],
                "prenom": patient[2],
                "email":patient[3],
                "hrdv": patient[4],
                "date_rdv": patient[5]
            })
        return jsonify({"patients": patients_list}), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

    finally:
        cursor.close()
        db.close()


@app.route('/accesP/<email>', methods=['GET'])
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
    msg.body = f"""
    Bonjour,

    Voici vos identifiants de connexion :
    Email : {email}
    Mot de passe : {password}
    
    L'équipe Nature & Énergie.
    """
    mail.send(msg)




@app.route('/prendrerdv', methods=['POST'])
def prendrerdv():
    data = request.get_json()
    db=get_db()
    nom = data.get('nom')
    prenom = data.get('prenom')
    email = data.get('email')
    date = data.get('date')
    hrdv = data.get('hrdv')

    if not all([nom, prenom, email, date, hrdv]):
        return jsonify({'message': 'Données manquantes'}), 400

    cur = db.cursor()
    cur.execute("SELECT * FROM rdv WHERE daterdv = %s AND hrdv = %s", (date, hrdv))
    row = cur.fetchone()

    if row:
        return jsonify({'message': 'Cette date et heure sont déjà réservées'})
    cur.execute(
        "INSERT INTO rdv (nom, prenom, email, hrdv, daterdv) VALUES (%s, %s, %s, %s, %s)",
        (nom, prenom, email, hrdv, date))
    db.commit()
    

    return jsonify({'message': 'RDV ajouté avec succès'})



  

@app.route('/heures/<datehdv>', methods=['GET'])
def get_heures(datehdv):
    db=get_db()
    cursor =db.cursor()
    cursor.execute("SELECT hrdv FROM rdv WHERE daterdv = %s",(datehdv,))
    data = cursor.fetchall()

    heures = [row[0] for row in data]

    return jsonify(heures)

@app.route('/ajoutep',methods=[('POST')])
def ajoutep():
       try:
        
            db=get_db()
            data = request.get_json()
            nom = data.get('nom')
            prenom = data.get('prenom')
            age = data.get('age')
            sexe = data.get('sexe')
            email = data.get('email')
            password= data.get('password')
            tel = data.get('tel')
            adress = data.get('adress')
            note_interne = data.get('note_interne')
            taille=data.get('taille')
            poids_actuiele = data.get('poids_actuiele')
            allergie=data.get('allergie')
            Conditions_me = data.get('Conditions_me')
            niveau_act = data.get('niveau_act')
            objectif = data.get('objectif')
            description=data.get('description')
            cur=db.cursor()

            sql = """
                INSERT INTO patient
                (nom, prenom, age,genre, email,password, tel, adresse, note_interne,taille, poids_actuiele,allergies, condition_med, niveau_act, objectif,description)
                VALUES (%s, %s,%s, %s,%s, %s, %s, %s, %s,%s, %s, %s,%s, %s, %s,%s)
            """
            values = (nom, prenom, age,sexe, email, password,tel, adress, note_interne,
                 taille, poids_actuiele,allergie, Conditions_me, niveau_act,objectif,description)

            cur.execute(sql, values)
            db.commit()
            cur.close()

            db.close()

            return jsonify({'message': 'Patient ajouté avec succès !'}), 201

       except Exception as e:
          print(e)
       return jsonify({'error': 'Impossible d’ajouter le patient'}), 500

@app.route('/patientex/<chercher>',methods=['GET'])
def getpatient(chercher):
     db=get_db()
     cur=db.cursor()
     cur.execute("select nom,prenom,age,objectif,description from patient where nom= %s",(chercher,))
     patients = cur.fetchall()
     patient_list =[]
     for patient in patients:
            patient_list.append({
                "nom": patient[0],
                 "prenom": patient [1],
                 "age":patient[2],
                 "objectif":patient[3],
                 "description":patient[4]
            })
     return jsonify({"patients": patient_list}), 200
@app.route('/allpatient',methods=['GET'])
def getallpatient():
     db=get_db()
     cur=db.cursor()
     cur.execute("select *  from patient")
     patients = cur.fetchall()
     nut =[]
     for patient in patients:
            nut.append({
                "id":patient[0],
                "nom": patient[1],
                 "prenom": patient [2],
                 "age":patient[3],
                 "genre":patient[4],
                 "email":patient[5],
                 "password":patient[6],
                 "tel":patient[7],
                 "adresse":patient[8],
                 "note_interne":patient[9],
                 "taille":patient[10],
                 "poids_actuiele":patient[11],
                 "allergies":patient[12],
                 "condition_med":patient[13],
                 "niveau_act":patient[14],
                 "objectif":patient[15],
                 "description":patient[16]
            })
     return jsonify({"personnes": nut}), 200  
 

@app.route('/supppatient/<idp>', methods=['GET'])
def supppatient(idp):
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("DELETE FROM patient WHERE id = %s", (idp,))
        db.commit()
        return jsonify({'message': 'Patient supprimé avec succès'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        db.close()


if __name__ == '__main__':
    app.run(debug=True)