"""
Debug routes for Zentrafuge - Production stub
"""

from flask import Blueprint, jsonify

debug_bp = Blueprint('debug', __name__)

@debug_bp.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'zentrafuge-debug'}), 200

@debug_bp.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint"""
    return jsonify({'message': 'pong'}), 200
