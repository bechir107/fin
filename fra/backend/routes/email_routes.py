from flask import Blueprint, jsonify
from flask_mail import Message
from  db import get_db

email_bp = Blueprint('email', __name__)
mail = None  # sera injecté depuis app.py

def init_mail(m):
    global mail
    mail = m

@email_bp.route('/accesP/<email>', methods=['GET'])
def accesP(email):
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT nom, prenom, email, password FROM patient WHERE email=%s", (email,))
    user = cur.fetchone()
    cur.close()
    db.close()

    if not user:
        return jsonify({"message": "Patient introuvable"}), 404

    msg = Message(
        subject="Vos accès au portail patient",
        recipients=[user[2]]
    )
    msg.body = f"Bonjour {user[0]} {user[1]},\n\nEmail : {user[2]}\nMot de passe : {user[3]}\n\nCordialement"
    mail.send(msg)
    return jsonify({"message": "Email envoyé avec succès"}), 200
