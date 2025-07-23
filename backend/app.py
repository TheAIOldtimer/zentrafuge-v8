# backend/app.py - Minimal Application Router
from flask import Flask
from flask_cors import CORS
import os

# Import only existing route modules
try:
    from routes.chat_routes import chat_bp
    chat_routes_available = True
except ImportError:
    print("Warning: chat_routes not found")
    chat_routes_available = False

try:
    from routes.debug_routes import debug_bp
    debug_routes_available = True
except ImportError:
    print("Warning: debug_routes not found")
    debug_routes_available = False

try:
    from routes.auth_routes import auth_bp
    auth_routes_available = True
except ImportError:
    print("Warning: auth_routes not found")
    auth_routes_available = False

try:
    from routes.translation_routes import translation_bp
    translation_routes_available = True
except ImportError:
    print("Warning: translation_routes not found")
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
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    if config_available:
        app.config.from_object(Config)
    else:
        app.config['SECRET_KEY'] = 'zentrafuge-dev-key'
    
    # Setup CORS
    CORS(app, origins=[
        "https://zentrafuge-v8.netlify.app",
        "http://localhost:3000",
        "http://127.0.0.1:5000"
    ])
    
    # Setup logging
    if logging_available:
        setup_logging(app)
    
    # Register available blueprints
    if chat_routes_available:
        app.register_blueprint(chat_bp)
        print("✅ Registered chat routes")
    
    if debug_routes_available:
        app.register_blueprint(debug_bp)
        print("✅ Registered debug routes")
    
    if auth_routes_available:
        app.register_blueprint(auth_bp)
        print("✅ Registered auth routes")
    
    if translation_routes_available:
        app.register_blueprint(translation_bp)
        print("✅ Registered translation routes")
    
    # Root endpoint
    @app.route('/')
    def root():
        return {
            "status": "healthy",
            "service": "Zentrafuge Backend",
            "version": "8.0.0",
            "routes_loaded": {
                "chat": chat_routes_available,
                "debug": debug_routes_available,
                "auth": auth_routes_available,
                "translation": translation_routes_available
            }
        }
    
    # Health check endpoint
    @app.route('/health')
    def health():
        return {"status": "healthy", "timestamp": os.environ.get('RENDER_EXTERNAL_HOSTNAME', 'localhost')}
    
    # Simple test endpoint
    @app.route('/test')
    def test():
        return {"message": "Zentrafuge backend is running!", "test": "success"}
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
