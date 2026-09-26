from flask import Flask
from dotenv import load_dotenv
import os

load_dotenv()


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///tinshed.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    from app import routes
    app.register_blueprint(routes.bp)

    return app
