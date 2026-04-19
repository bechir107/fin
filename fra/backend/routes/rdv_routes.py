from flask import Blueprint, request, jsonify
from db import get_db

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


@rdv_bp.route('/heures/<datehdv>', methods=['GET'])
def get_heures(datehdv):
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT hrdv FROM rdv WHERE daterdv=%s", (datehdv,))
    heures = [row[0] for row in cur.fetchall()]
    cur.close()
    db.close()
    return jsonify(heures), 200


@rdv_bp.route('/patient', methods=['GET'])
def patient():
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("SELECT * FROM rdv")
        rdvs = cur.fetchall()
        result = [{"id": r[0], "nom": r[1], "prenom": r[2],
                   "email": r[3], "hrdv": r[4], "date_rdv": r[5]} for r in rdvs]
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