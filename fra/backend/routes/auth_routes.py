from flask import Blueprint, request, jsonify
from db import get_db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400

    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM patient WHERE email=%s AND password=%s", (email, password))
    user = cursor.fetchone()
    cursor.close()
    db.close()

    if not user:
        return jsonify({'message': 'Email ou mot de passe incorrect'}), 401

    return jsonify({'message': 'Connexion réussie', 'nom': user[1], 'prenom': user[2]}), 200


@auth_bp.route('/loginNut', methods=['POST'])
def loginNut():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis'}), 400

    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE email=%s AND password=%s", (email, password))
    user = cursor.fetchone()
    cursor.close()
    db.close()

    if not user:
        return jsonify({'message': 'Email ou mot de passe incorrect'}), 401

    return jsonify({'message': 'Connexion réussie', 'nom': user[0], 'prenom': user[1]}), 200