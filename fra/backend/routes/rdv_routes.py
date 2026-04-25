from flask import Blueprint, request, jsonify
from db import get_db
from datetime import datetime, timedelta

rdv_bp = Blueprint('rdv', __name__)

@rdv_bp.route('/prendrerdv', methods=['POST'])
def prendrerdv():
    data = request.get_json()
    nom = data.get('nom')
    prenom = data.get('prenom')
    email = data.get('email')
    date = data.get('date')
    hrdv = data.get('hrdv')

    if not all([nom, prenom, email, date, hrdv]):
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
        current += timedelta(hours=1)
    
    return creneaux
@rdv_bp.route('/disponibilite', methods=['GET'])
def get_disponibilite():
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("SELECT jour, heure_debut, heure_fin FROM disponibilite")
        rows = cur.fetchall()
        result = [{"jour": r[0], "heure_debut": str(r[1])[:5], 
                   "heure_fin": str(r[2])[:5]} for r in rows]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        db.close()


@rdv_bp.route('/disponibilite', methods=['POST'])
def sauvegarder_disponibilite():
    try:
        data = request.get_json()
        db = get_db()
        cur = db.cursor()
        cur.execute("DELETE FROM disponibilite")
        for slot in data:
            cur.execute(
                "INSERT INTO disponibilite (jour, heure_debut, heure_fin) VALUES (%s,%s,%s)",
                (slot['jour'], slot['heure_debut'], slot['heure_fin'])
            )
        db.commit()
        return jsonify({'message': 'Disponibilités sauvegardées'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        db.close()
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
        cur.execute("SELECT id, nom, prenom, email, hrdv, daterdv, statut FROM rdv")
        rdvs = cur.fetchall()
        result = [{"id": r[0], "nom": r[1], "prenom": r[2],
                   "email": r[3], "hrdv": r[4], "date_rdv": r[5], "statut": r[6]} for r in rdvs]
        return jsonify({"patients": result}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        
        cur.close()
        db.close()


@rdv_bp.route('/supprdv/<int:id>', methods=['GET'])
def annuler_rdv(id):
    try:
        db = get_db()
        cur = db.cursor()

        cur.execute("SELECT * FROM rdv WHERE id=%s", (id,))
        rdv = cur.fetchone()

        if not rdv:
            return jsonify({'message': 'RDV introuvable'}), 404

        cur.execute("DELETE FROM rdv WHERE id=%s", (id,))
        db.commit()

        return jsonify({'message': 'RDV annulé avec succès'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        db.close()

@rdv_bp.route('/accepter_rdv/<int:id>', methods=['PUT'])
def accepter_rdv(id):
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("UPDATE rdv SET statut='confirmed' WHERE id=%s", (id,))
        db.commit()
        return jsonify({'message': 'RDV accepté avec succès'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        db.close()