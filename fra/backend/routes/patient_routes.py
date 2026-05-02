from flask import Blueprint, request, jsonify
from db import get_db

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/ajoutep', methods=['POST'])
def ajoutep():
    try:
        data = request.get_json()
        db = get_db()
        cur = db.cursor()
        sql = """INSERT INTO patient
                 (nom, prenom, age, genre, email, password, tel, adresse,
                  note_interne, taille, poids_actuiele, allergies,
                  condition_med, niveau_act, objectif, description)
                 VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"""
        values = (
            data.get('nom'), data.get('prenom'), data.get('age'),
            data.get('sexe'), data.get('email'), data.get('password'),
            data.get('tel'), data.get('adress'), data.get('note_interne'),
            data.get('taille'), data.get('poids_actuiele'), data.get('allergie'),
            data.get('Conditions_me'), data.get('niveau_act'),
            data.get('objectif'), data.get('description')
        )
        cur.execute(sql, values)
        db.commit()
        return jsonify({'message': 'Patient ajouté avec succès'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        db.close()


@patient_bp.route('/allpatient', methods=['GET'])
def getallpatient():
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT * FROM patient")
    patients = cur.fetchall()
    cur.close()
    db.close()
    result = []
    for p in patients:
        result.append({
            "id": p[0], "nom": 
            p[1], "prenom": p[2], "age": p[3],
            "genre": p[4], "email": p[5], "tel": p[7], "adresse": p[8],
            "taille": p[10], "poids_actuiele": p[11], "objectif": p[15],"description": p[16],"condition_med": p[13],"allergies": p[12],"niveau_act": p[14]
        })
    return jsonify({"personnes": result}), 200


@patient_bp.route('/patientex/<chercher>', methods=['GET'])
def getpatient(chercher):
    db = get_db()
    cur = db.cursor()
    search_term = f"%{chercher}%"
    cur.execute("SELECT * FROM patient WHERE nom LIKE %s OR prenom LIKE %s OR email LIKE %s", (search_term, search_term, search_term))
    patients = cur.fetchall()
    cur.close()
    db.close()
    result = []
    for p in patients:
        result.append({
            "id": p[0], "nom": p[1], "prenom": p[2], "age": p[3],
            "genre": p[4], "email": p[5], "tel": p[7], "adresse": p[8],
            "taille": p[10], "poids_actuiele": p[11], "objectif": p[15],
            "description": p[16], "condition_med": p[13], "allergies": p[12], "niveau_act": p[14]
        })
    return jsonify({"patients": result}), 200


@patient_bp.route('/suppatient/<int:idp>', methods=['GET'])
def supppatient(idp):
    try:
        db = get_db()

        cur = db.cursor()
        cur.execute("DELETE FROM patient WHERE id=%s", (idp,))
        db.commit()
        return jsonify({'message': 'Patient supprimé avec succès'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        db.close()



@patient_bp.route('/getId/<int:id>', methods=['GET'])
def get_by_id(id):
    db = get_db()
    cur = db.cursor()  
    cur.execute("SELECT * FROM patient WHERE id=%s", (id,))
    p = cur.fetchone()
    cur.close()
    db.close()
    if not p:
        return jsonify({'message': 'Patient introuvable'}), 404
    return jsonify({
        "id": p[0], "nom": p[1], "prenom": p[2],
        "email": p[5], "tel": p[7], "adresse": p[8],
        "taille": p[10], "poids_actuiele": p[11],"password":p[6],
    }), 200


@patient_bp.route('/upmdp/<int:id>', methods=['PUT'])
def upmdp(id):
    try:
        data = request.get_json()
        newpass = data.get('newpasswrod') or data.get('newpass')
        print(f"Update password for patient {id}")
        db = get_db()
        cur = db.cursor()
        cur.execute("UPDATE patient SET password = %s WHERE id = %s", (newpass, id))
        db.commit()
        return jsonify({'message': 'Mot de passe modifié avec succès'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cur.close()
        db.close()
        