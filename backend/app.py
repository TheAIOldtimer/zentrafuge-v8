# backend/app.py - Minimal Application Router
from flask import Flask
from flask_cors import CORS
import os

# Import route modules
from routes.chat_routes import chat_bp
from routes.debug_routes import debug_bp
from routes.auth_routes import auth_bp
from routes.translation_routes import translation_bp

# Import configuration
from utils.config import Config
from utils.logger import setup_logging

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Setup CORS
    CORS(app, origins=[
        "https://zentrafuge-v8.netlify.app",
        "http://localhost:3000",
        "http://127.0.0.1:5000"
    ])
    
    # Setup logging
    setup_logging(app)
    
    # Register blueprints
    app.register_blueprint(chat_bp)
    app.register_blueprint(debug_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(translation_bp)
    
    # Root endpoint
    @app.route('/')
    def root():
        return {
            "status": "healthy",
            "service": "Zentrafuge Backend",
            "version": "8.0.0"
        }
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
