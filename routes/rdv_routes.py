from flask import Blueprint, request, jsonify
from db import get_db
from datetime import datetime, timedelta

rdv_bp = Blueprint('rdv', __name__)

@rdv_bp.route('/rdv_tel', methods=['POST'])
def add_rdv_tel():
    try:
        data = request.get_json()
        nom = data.get('nom')
        telephone = data.get('telephone')
        date = data.get('date_rendez_vous')
        heure = data.get('heure')
        id_nutritionniste = data.get('id_nutritionniste', 1)
        statut = data.get('statut', 'en_attente')

        if not all([nom, telephone, date, heure]):
            return jsonify({'message': 'Données manquantes'}), 400

        db = get_db()
        cur = db.cursor()
        cur.execute("""
            INSERT INTO rendez_vous_telephone (nom, telephone, date_rendez_vous, heure, id_nutritionniste, statut)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (nom, telephone, date, heure, id_nutritionniste, statut))
        db.commit()
        new_id = cur.lastrowid
        cur.close()
        db.close()
        return jsonify({'message': 'RDV téléphonique ajouté', 'id': new_id}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@rdv_bp.route('/prendrerdv', methods=['POST'])
def prendrerdv():
    data = request.get_json()
    nom = data.get('nom')
    prenom = data.get('prenom')
    email = data.get('email')
    date = data.get('date')
    hrdv = data.get('hrdv')

    if not all([nom, prenom, date, hrdv]):
        return jsonify({'message': 'Données manquantes'}), 400

    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT * FROM rdv WHERE daterdv=%s AND hrdv=%s", (date, hrdv))
    if cur.fetchone():
        cur.close()
        db.close()
        return jsonify({'message': 'Créneau déjà réservé'}), 409

    cur.execute("INSERT INTO rdv (nom, prenom, email, hrdv, daterdv) VALUES (%s,%s,%s,%s,%s)",
                (nom, prenom, email, hrdv, date))
    db.commit()
    cur.close()
    db.close()
    return jsonify({'message': 'RDV ajouté avec succès'}), 201


def get_nom_jour(date_str):
    jours = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    return jours[date_obj.weekday()]

def generer_creneaux(heure_debut, heure_fin):
    creneaux = []
    if isinstance(heure_debut, timedelta):
        total = int(heure_debut.total_seconds())
        heure_debut = datetime.strptime(f"{total//3600:02d}:{(total%3600)//60:02d}", '%H:%M').time()
    
    if isinstance(heure_fin, timedelta):
        total = int(heure_fin.total_seconds())
        heure_fin = datetime.strptime(f"{total//3600:02d}:{(total%3600)//60:02d}", '%H:%M').time()

    current = datetime.combine(datetime.today(), heure_debut)
    fin     = datetime.combine(datetime.today(), heure_fin)
    
    while current < fin:
        creneaux.append(current.strftime('%H:%M'))
        current += timedelta(minutes=45)
    
    return creneaux

@rdv_bp.route('/disponibilite', methods=['GET'])
def get_disponibilite():
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("SELECT jour, heure_debut, heure_fin FROM disponibilite")
        rows = cur.fetchall()
        result = []
        for r in rows:
            # Format timedelta to HH:MM
            h_debut = ""
            if r[1]:
                td = r[1]
                h_debut = f"{int(td.total_seconds() // 3600):02d}:{int((td.total_seconds() % 3600) // 60):02d}"
            
            h_fin = ""
            if r[2]:
                td = r[2]
                h_fin = f"{int(td.total_seconds() // 3600):02d}:{int((td.total_seconds() % 3600) // 60):02d}"

            result.append({
                "jour": r[0],
                "heure_debut": h_debut,
                "heure_fin": h_fin
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if 'db' in locals() and db: db.close()

@rdv_bp.route('/disponibilite', methods=['POST'])
def sauvegarder_disponibilite():
    try:
        data = request.get_json()
        db = get_db()
        cur = db.cursor()
        cur.execute("DELETE FROM disponibilite")
        for slot in data:
            cur.execute(
                "INSERT INTO disponibilite (id_nutritionniste, jour, heure_debut, heure_fin) VALUES (%s,%s,%s,%s)",
                (1, slot['jour'], slot['heure_debut'], slot['heure_fin'])
            )
        db.commit()
        return jsonify({'message': 'Disponibilités sauvegardées'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if 'db' in locals() and db: db.close()

@rdv_bp.route('/heures/<datehdv>', methods=['GET'])
def get_heures(datehdv):
    try:
        db = get_db()
        cur = db.cursor()

        nom_jour = get_nom_jour(datehdv)

        cur.execute("SELECT heure_debut, heure_fin FROM disponibilite WHERE jour=%s", (nom_jour,))
        dispos = cur.fetchall()

        if not dispos:
            cur.close()
            db.close()
            return jsonify({'disponibles': [], 'prises': [], 
                          'message': 'Pas de disponibilité ce jour'}), 200

        tous_creneaux = []
        for dispo in dispos:
            tous_creneaux += generer_creneaux(dispo[0], dispo[1])

        cur.execute("SELECT hrdv FROM rdv WHERE daterdv=%s", (datehdv,))
        heures_prises = [str(row[0])[:5] for row in cur.fetchall()]

        cur.execute("SELECT heure FROM rendez_vous_telephone WHERE date_rendez_vous=%s", (datehdv,))
        heures_prises += [str(row[0])[:5] for row in cur.fetchall()]

        cur.close()
        db.close()
        return jsonify({'disponibles': tous_creneaux, 'prises': heures_prises}), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500
        
@rdv_bp.route('/patient', methods=['GET'])
def patient():
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("""
            SELECT id, nom, prenom, email, hrdv, daterdv, statut, 'online' as source FROM rdv
            UNION ALL
            SELECT id_rdv_tel as id, nom, '' as prenom, '' as email, heure as hrdv, date_rendez_vous as daterdv, statut, 'phone' as source FROM rendez_vous_telephone
        """)
        rdvs = cur.fetchall()
        result = [{"id": r[0], "nom": r[1], "prenom": r[2],
                   "email": r[3], "hrdv": str(r[4])[:5] if r[4] else None, 
                   "date_rdv": str(r[5]), "statut": r[6], "source": r[7]} for r in rdvs]
        return jsonify({"patients": result}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if 'db' in locals() and db: db.close()


@rdv_bp.route('/supprdv/<int:id>', methods=['GET'])
def annuler_rdv(id):
    try:
        db = get_db()
        cur = db.cursor()

        cur.execute("SELECT nom, prenom, email, hrdv, daterdv FROM rdv WHERE id=%s", (id,))
        rdv = cur.fetchone()

        if not rdv:
            return jsonify({'message': 'RDV introuvable'}), 404

        cur.execute("DELETE FROM rdv WHERE id=%s", (id,))
        db.commit()

        if rdv[2]: # Si email existe
            nom, prenom, email, hrdv, daterdv = rdv
            from flask_mail import Message
            from routes.email_routes import mail
            if mail:
                msg = Message(
                    subject="Annulation de votre rendez-vous",
                    recipients=[email]
                )
                msg.body = f"Bonjour {nom} {prenom},\n\nNous vous informons que votre rendez-vous du {daterdv} à {hrdv} a été annulé par le cabinet.\n\nCordialement,\nCabinet de Nutrition"
                try:
                    mail.send(msg)
                except Exception as e:
                    print("Erreur envoi email: ", e)

        return jsonify({'message': 'RDV annulé avec succès'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        if 'cur' in locals() and cur: cur.close()
        if 'db' in locals() and db: db.close()

@rdv_bp.route('/accepter_rdv/<int:id>', methods=['PUT'])
def accepter_rdv(id):
    try:
        db = get_db()
        cur = db.cursor()
        
        cur.execute("SELECT nom, prenom, email, hrdv, daterdv FROM rdv WHERE id=%s", (id,))
        rdv = cur.fetchone()

        cur.execute("UPDATE rdv SET statut='confirmed' WHERE id=%s", (id,))
        db.commit()

        if rdv and rdv[2]: # Si email existe
            nom, prenom, email, hrdv, daterdv = rdv
            from flask_mail import Message
            from routes.email_routes import mail
            if mail:
                msg = Message(
                    subject="Confirmation de votre rendez-vous",
                    recipients=[email]
                )
                msg.body = f"Bonjour {nom} {prenom},\n\nVotre rendez-vous prévu le {daterdv} à {hrdv} a été confirmé.\n\nCordialement,\nCabinet de Nutrition"
                try:
                    mail.send(msg)
                except Exception as e:
                    print("Erreur envoi email: ", e)

        return jsonify({'message': 'RDV accepté avec succès'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        db.close()