from flask import Flask, jsonify
from config import Config
from models import db
from routes.fornecedores import fornecedores_bp
from routes.guias import guias_bp
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    db.init_app(app)
    
    app.register_blueprint(fornecedores_bp)
    app.register_blueprint(guias_bp)

    @app.route("/")
    def home():
        return jsonify({"status": "API da Guia de Remessa ativa"})

    return app

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, host="0.0.0.0")
