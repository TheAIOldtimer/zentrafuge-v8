# backend/routes/chat_routes.py - Chat Endpoints
from flask import Blueprint, request, jsonify, g
import time
import logging
from typing import Dict, Any

from controllers.chat_controller import ChatController
from utils.logger import log_with_context, log_chat_interaction, log_error_with_context
from utils.validators import validate_chat_request
from utils.rate_limiter import rate_limit

# Create blueprint
chat_bp = Blueprint('chat', __name__)

# Initialize controller
chat_controller = ChatController()

# Get logger
logger = logging.getLogger(__name__)

@chat_bp.route('/index', methods=['POST'])
@rate_limit(per_minute=20, per_hour=100)
@log_with_context({'endpoint': 'chat'})
def chat_endpoint():
    """Main chat endpoint for Cael interactions"""
    start_time = time.time()
    
    try:
        # Validate request
        data = validate_chat_request(request)
        message = data['message']
        user_id = data['user_id']
        
        # Store user_id in context for logging
        g.user_id = user_id
        
        # Process chat message
        response = chat_controller.process_message(
            user_id=user_id,
            message=message,
            request_metadata={
                'ip_address': request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr),
                'user_agent': request.headers.get('User-Agent', ''),
                'timestamp': time.time()
            }
        )
        
        # Calculate processing time
        duration = time.time() - start_time
        
        # Log interaction
        log_chat_interaction(
            user_id=user_id,
            message=message,
            response=response['response'],
            duration=duration
        )
        
        return jsonify({
            'response': response['response'],
            'metadata': {
                'processing_time': round(duration, 3),
                'model_used': response.get('model_used', 'gpt-4'),
                'tokens_used': response.get('tokens_used', 0)
            }
        })
        
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        return jsonify({'error': 'Invalid request format'}), 400
        
    except Exception as e:
        log_error_with_context(e, {
            'endpoint': 'chat',
            'user_id': getattr(g, 'user_id', 'unknown'),
            'message_length': len(request.get_json().get('message', '')) if request.get_json() else 0
        })
        
        return jsonify({
            'error': 'Internal server error',
            'message': 'I\'m having trouble processing your message right now. Please try again.'
        }), 500

@chat_bp.route('/history', methods=['GET'])
@rate_limit(per_minute=10, per_hour=50)
@log_with_context({'endpoint': 'history'})
def get_chat_history():
    """Get user's chat history"""
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id parameter required'}), 400
        
        # Store user_id in context
        g.user_id = user_id
        
        # Get pagination parameters
        limit = min(int(request.args.get('limit', 20)), 100)  # Max 100 messages
        offset = int(request.args.get('offset', 0))
        
        # Retrieve history
        history = chat_controller.get_chat_history(
            user_id=user_id,
            limit=limit,
            offset=offset
        )
        
        return jsonify({
            'history': history,
            'pagination': {
                'limit': limit,
                'offset': offset,
                'total': len(history)
            }
        })
        
    except Exception as e:
        log_error_with_context(e, {
            'endpoint': 'history',
            'user_id': request.args.get('user_id', 'unknown')
        })
        
        return jsonify({'error': 'Failed to retrieve chat history'}), 500

@chat_bp.route('/context', methods=['GET'])
@rate_limit(per_minute=5, per_hour=25)
@log_with_context({'endpoint': 'context'})
def get_user_context():
    """Get user's emotional and memory context"""
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id parameter required'}), 400
        
        g.user_id = user_id
        
        # Get context data
        context = chat_controller.get_user_context(user_id)
        
        return jsonify(context)
        
    except Exception as e:
        log_error_with_context(e, {
            'endpoint': 'context',
            'user_id': request.args.get('user_id', 'unknown')
        })
        
        return jsonify({'error': 'Failed to retrieve user context'}), 500

@chat_bp.route('/mood', methods=['POST'])
@rate_limit(per_minute=10, per_hour=30)
@log_with_context({'endpoint': 'mood'})
def record_mood():
    """Record user's current mood"""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data or 'mood' not in data:
            return jsonify({'error': 'user_id and mood required'}), 400
        
        user_id = data['user_id']
        mood = data['mood']
        notes = data.get('notes', '')
        
        g.user_id = user_id
        
        # Record mood
        result = chat_controller.record_mood(
            user_id=user_id,
            mood=mood,
            notes=notes
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Mood recorded successfully',
            'mood_id': result.get('mood_id')
        })
        
    except Exception as e:
        log_error_with_context(e, {
            'endpoint': 'mood',
            'user_id': data.get('user_id', 'unknown') if 'data' in locals() else 'unknown'
        })
        
        return jsonify({'error': 'Failed to record mood'}), 500

@chat_bp.route('/export', methods=['GET'])
@rate_limit(per_minute=2, per_hour=5)
@log_with_context({'endpoint': 'export'})
def export_user_data():
    """Export user's data (GDPR compliance)"""
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id parameter required'}), 400
        
        g.user_id = user_id
        
        # Export all user data
        export_data = chat_controller.export_user_data(user_id)
        
        return jsonify({
            'export_timestamp': time.time(),
            'user_id': user_id,
            'data': export_data
        })
        
    except Exception as e:
        log_error_with_context(e, {
            'endpoint': 'export',
            'user_id': request.args.get('user_id', 'unknown')
        })
        
        return jsonify({'error': 'Failed to export user data'}), 500
