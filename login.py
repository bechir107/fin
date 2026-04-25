from flask import Blueprint, request, jsonify
from db import get_db  # ← importe ta fonction get_db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST']) 
def login():
    data = request.json
    email    = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400
    else:
        db     = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

    if not user:
     return jsonify({'message': 'Email introuvable'}), 401

    if user[2] != password:  # ← index [2] pour le password

            return jsonify({'message': 'Mot de passe incorrect'}), 401
            return jsonify({
                'message': 'Connexion réussie',
            'email':   user[1],
            'role':    user[3]   
        }), 200