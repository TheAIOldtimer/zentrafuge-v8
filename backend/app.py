# backend/app.py - Zentrafuge v8 Application with Firebase Initialization
from flask import Flask
from flask_cors import CORS
import os
import logging

# CRITICAL: Initialize Firebase FIRST before any other imports that use it
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    import json
    
    # Load Firebase credentials from environment
    firebase_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
    
    if firebase_json:
        cred_dict = json.loads(firebase_json)
        cred = credentials.Certificate(cred_dict)
        
        # Initialize Firebase if not already done
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully")
        else:
            print("✅ Firebase already initialized")
    else:
        print("⚠️  Warning: FIREBASE_CREDENTIALS_JSON not found - Firebase features disabled")
        
except Exception as e:
    print(f"❌ Firebase initialization failed: {e}")
    print("⚠️  Continuing without Firebase - some features may be limited")

# Now import route modules AFTER Firebase is initialized
try:
    from routes.chat_routes import chat_bp
    chat_routes_available = True
except ImportError as e:
    print(f"Warning: chat_routes not found - {e}")
    chat_routes_available = False

try:
    from routes.debug_routes import debug_bp
    debug_routes_available = True
except ImportError as e:
    print(f"Warning: debug_routes not found - {e}")
    debug_routes_available = False

try:
    from routes.auth_routes import auth_bp
    auth_routes_available = True
except ImportError as e:
    print(f"Warning: auth_routes not found - {e}")
    auth_routes_available = False

try:
    from routes.translation_routes import translation_bp
    translation_routes_available = True
except ImportError as e:
    print(f"Warning: translation_routes not found - {e}")
    translation_routes_available = False

# Import configuration
try:
    from utils.config import Config
    config_available = True
except ImportError:
    print("Warning: config not found, using defaults")
    config_available = False
    class Config:
        SECRET_KEY = 'zentrafuge-dev-key'
        DEBUG = False

try:
    from utils.logger import setup_logging
    logging_available = True
except ImportError:
    print("Warning: custom logging not found, using default")
    logging_available = False

def create_app():
    """Application factory pattern with proper Firebase initialization"""
    app = Flask(__name__)
    
    # Load configuration
    if config_available:
        app.config.from_object(Config)
    else:
        app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'zentrafuge-dev-key')
        app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Setup CORS
    CORS(app, origins=[
        "https://zentrafuge-v8.netlify.app",
        "http://localhost:3000",
        "http://127.0.0.1:5000"
    ])
    
    # Setup logging
    if logging_available:
        setup_logging(app)
    else:
        logging.basicConfig(level=logging.INFO)
    
    # Register available blueprints
    if chat_routes_available:
        app.register_blueprint(chat_bp)
        print("✅ Registered chat routes")
    
    if debug_routes_available:
        app.register_blueprint(debug_bp)
        print("✅ Registered debug routes")
    
    if auth_routes_available:
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        print("✅ Registered auth routes")
    
    if translation_routes_available:
        app.register_blueprint(translation_bp, url_prefix='/api/translate')
        print("✅ Registered translation routes")
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {
            'status': 'healthy',
            'firebase': 'initialized' if firebase_admin._apps else 'not_initialized',
            'routes': {
                'chat': chat_routes_available,
                'debug': debug_routes_available,
                'auth': auth_routes_available,
                'translation': translation_routes_available
            }
        }
    
    return app

# Create the app instance
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
