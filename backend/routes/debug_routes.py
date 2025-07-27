# backend/routes/debug_routes.py
from flask import Blueprint, jsonify
import time
import os
import logging
from datetime import datetime

debug_bp = Blueprint('debug', __name__)
logger = logging.getLogger(__name__)

@debug_bp.route('/health', methods=['GET'])
def health_check():
    """Comprehensive health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'zentrafuge-v8',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '8.0.0'
    }), 200

@debug_bp.route('/status', methods=['GET'])
def system_status():
    """System status information"""
    try:
        return jsonify({
            'status': 'ok',
            'service': 'zentrafuge-v8',
            'timestamp': datetime.utcnow().isoformat(),
            'environment': {
                'render_hostname': os.environ.get('RENDER_EXTERNAL_HOSTNAME', 'localhost'),
                'port': os.environ.get('PORT', '5000'),
                'python_version': f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}"
            },
            'routes_available': [
                '/health',
                '/status', 
                '/ping',
                '/routes',
                '/test',
                '/index',
                '/history',
                '/context',
                '/mood',
                '/export'
            ]
        }), 200
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@debug_bp.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint"""
    return jsonify({'message': 'pong', 'timestamp': time.time()}), 200

@debug_bp.route('/routes', methods=['GET'])
def list_routes():
    """List all available routes"""
    from flask import current_app
    
    routes = []
    for rule in current_app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'rule': str(rule)
        })
    
    return jsonify({
        'total_routes': len(routes),
        'routes': routes
    }), 200
