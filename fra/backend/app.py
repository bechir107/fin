import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail
from config import Config
import  os

from routes.auth_routes import auth_bp
from routes.patient_routes import patient_bp
from routes.rdv_routes import rdv_bp
from routes.email_routes import email_bp, init_mail

app = Flask(__name__)



app.config.from_object(Config)
CORS(app)
mail = Mail(app)
init_mail(mail)

app.register_blueprint(auth_bp)
app.register_blueprint(patient_bp)
app.register_blueprint(rdv_bp)
app.register_blueprint(email_bp)

if __name__ == '__main__':
    app.run(debug=True)