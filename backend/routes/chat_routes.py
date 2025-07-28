# backend/routes/chat_routes.py
"""
Chat Routes for Zentrafuge v8 - FIXED AI NAME RETRIEVAL
Handles chat interactions with dynamic AI companion name support
"""

from flask import Blueprint, request, jsonify, g
import time
import logging
from typing import Dict, Any

# Import the enhanced orchestrator
from utils.orchestrator import (
    orchestrate_response, 
    process_user_feedback, 
    capture_user_reply_signal,
    check_orchestrator_health
)

# Import Firebase client getter
try:
    from firebase import get_firestore_client
    firebase_available = True
except ImportError:
    try:
        from firebase_admin import firestore
        def get_firestore_client():
            return firestore.client()
        firebase_available = True
    except ImportError:
        firebase_available = False
        def get_firestore_client():
            return None

# Create blueprint
chat_bp = Blueprint('chat', __name__)

# Get logger
logger = logging.getLogger(__name__)

def get_user_ai_name(user_id, firestore_client):
    """
    Retrieve the user's chosen AI companion name from Firestore
    Falls back to "Cael" if not found or on error
    """
    try:
        if not firestore_client or not user_id:
            logger.warning("No firestore client or user_id provided for AI name lookup")
            return "Cael"
        
        # Try to get AI name from user profile
        user_doc = firestore_client.collection("users").document(user_id).get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            
            # Check onboarding data first
            if 'onboarding_data' in user_data and user_data['onboarding_data'].get('ai_name'):
                ai_name = user_data['onboarding_data']['ai_name'].strip()
                if ai_name:
                    logger.info(f"Retrieved AI name from onboarding: {ai_name}")
                    return ai_name
            
            # Check ai_preferences for ai_name
            if 'ai_preferences' in user_data and user_data['ai_preferences'].get('ai_name'):
                ai_name = user_data['ai_preferences']['ai_name'].strip()
                if ai_name:
                    logger.info(f"Retrieved AI name from preferences: {ai_name}")
                    return ai_name
            
            # Check profile for ai_name
            if 'profile' in user_data and user_data['profile'].get('ai_name'):
                ai_name = user_data['profile']['ai_name'].strip()
                if ai_name:
                    logger.info(f"Retrieved AI name from profile: {ai_name}")
                    return ai_name
            
            # Check direct ai_name field
            if user_data.get('ai_name'):
                ai_name = user_data['ai_name'].strip()
                if ai_name:
                    logger.info(f"Retrieved AI name from direct field: {ai_name}")
                    return ai_name
        
        logger.info(f"No AI name found for user {user_id[:8]}, using default: Cael")
        return "Cael"
        
    except Exception as e:
        logger.error(f"Error retrieving AI name for user {user_id[:8]}: {e}")
        return "Cael"

def get_user_display_name(user_id, firestore_client):
    """
    Retrieve the user's display name from Firestore
    Falls back to "friend" if not found
    """
    try:
        if not firestore_client or not user_id:
            return "friend"
        
        user_doc = firestore_client.collection("users").document(user_id).get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            
            # Check various possible locations for user name
            if user_data.get('name'):
                return user_data['name'].strip()
            elif user_data.get('displayName'):
                return user_data['displayName'].strip()
            elif 'profile' in user_data and user_data['profile'].get('name'):
                return user_data['profile']['name'].strip()
            elif 'onboarding_data' in user_data and user_data['onboarding_data'].get('user_name'):
                return user_data['onboarding_data']['user_name'].strip()
        
        return "friend"
        
    except Exception as e:
        logger.error(f"Error retrieving user display name: {e}")
        return "friend"

@chat_bp.route('/index', methods=['POST'])
def chat_endpoint():
    """
    Main chat endpoint with dynamic AI name support
    FIXED: Now retrieves and uses the user's chosen AI companion name
    """
    start_time = time.time()
    
    try:
        # Validate request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        message = data.get('message', '').strip()
        user_id = data.get('user_id', '')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Store user_id in context for logging
        g.user_id = user_id
        
        # Get Firestore client for user data lookup
        firestore_client = get_firestore_client() if firebase_available else None
        
        # FIXED: Get the user's chosen AI companion name dynamically
        ai_name = get_user_ai_name(user_id, firestore_client)
        user_name = get_user_display_name(user_id, firestore_client)
        
        logger.info(f"Chat session - AI: {ai_name}, User: {user_name}")
        
        # Process chat message with dynamic AI name
        response_data = orchestrate_response(
            user_id=user_id,
            user_input=message,
            firestore_client=firestore_client,
            ai_name=ai_name,  # FIXED: Pass dynamic AI name
            user_name=user_name  # ENHANCED: Also pass user name
        )
        
        # Handle both old string format and new dict format
        if isinstance(response_data, str):
            # Legacy format - convert to new format
            response_data = {
                'response': response_data,
                'signal_id': None,
                'strategy_used': 'standard',
                'confidence': 0.7,
                'memory_used': False,
                'learning_enabled': False
            }
        
        # Calculate processing time
        duration = time.time() - start_time
        
        # Log the interaction
        logger.info(f"Chat interaction completed for {user_name} (AI: {ai_name}) in {duration:.3f}s")
        logger.info(f"Strategy: {response_data.get('strategy_used')}, Confidence: {response_data.get('confidence'):.2f}")
        
        # Return enhanced response with AI name confirmation
        return jsonify({
            'response': response_data['response'],
            'ai_name': ai_name,  # FIXED: Return the AI name used
            'user_name': user_name,  # ENHANCED: Return user name for frontend
            'signal_id': response_data.get('signal_id'),
            'strategy_used': response_data.get('strategy_used', 'standard'),
            'confidence': response_data.get('confidence', 0.7),
            'memory_used': response_data.get('memory_used', False),
            'learning_enabled': response_data.get('learning_enabled', False),
            'metadata': {
                'processing_time': round(duration, 3),
                'model_used': 'gpt-4',
                'timestamp': time.time()
            }
        })
        
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        return jsonify({'error': 'Invalid request format'}), 400
        
    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}", exc_info=True)
        
        return jsonify({
            'error': 'Internal server error',
            'response': "I'm having trouble processing your message right now. Please try again in a moment.",
            'ai_name': "Cael",  # Fallback name
            'signal_id': None,
            'strategy_used': 'error',
            'confidence': 0.5,
            'memory_used': False,
            'learning_enabled': False
        }), 500

@chat_bp.route('/feedback', methods=['POST'])
def feedback_endpoint():
    """
    Capture explicit user feedback on responses
    NEW: Allows users to teach their AI companion what works and what doesn't
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        signal_id = data.get('signal_id', '').strip()
        feedback_type = data.get('feedback_type', '').strip()
        feedback_details = data.get('feedback_details', '').strip()
        
        if not signal_id:
            return jsonify({'error': 'Signal ID is required'}), 400
        
        if not feedback_type:
            return jsonify({'error': 'Feedback type is required'}), 400
        
        # Validate feedback type
        valid_feedback_types = ['perfect', 'helpful', 'not_quite', 'unhelpful']
        if feedback_type not in valid_feedback_types:
            return jsonify({'error': f'Invalid feedback type. Must be one of: {valid_feedback_types}'}), 400
        
        # Get Firestore client for feedback storage
        firestore_client = get_firestore_client() if firebase_available else None
        
        # Process the feedback
        success = process_user_feedback(
            signal_id=signal_id,
            feedback_type=feedback_type,
            feedback_details=feedback_details,
            firestore_client=firestore_client
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Feedback received! This helps your companion learn.',
                'feedback_id': signal_id
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to process feedback'
            }), 500
        
    except Exception as e:
        logger.error(f"Feedback endpoint error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to process feedback',
            'success': False
        }), 500

@chat_bp.route('/capture-reply', methods=['POST'])
def capture_reply_endpoint():
    """
    Capture user reply signals for learning
    NEW: Tracks how users respond to AI messages for learning optimization
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        signal_id = data.get('signal_id', '').strip()
        user_reply = data.get('user_reply', '').strip()
        reply_timing = data.get('reply_timing', 0)  # seconds between AI response and user reply
        
        if not signal_id:
            return jsonify({'error': 'Signal ID is required'}), 400
        
        # Get Firestore client for signal storage
        firestore_client = get_firestore_client() if firebase_available else None
        
        # Capture the reply signal
        success = capture_user_reply_signal(
            signal_id=signal_id,
            user_reply=user_reply,
            reply_timing=reply_timing,
            firestore_client=firestore_client
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Reply signal captured for learning'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to capture reply signal'
            }), 500
        
    except Exception as e:
        logger.error(f"Capture reply endpoint error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to capture reply signal',
            'success': False
        }), 500

@chat_bp.route('/update-ai-name', methods=['POST'])
def update_ai_name_endpoint():
    """
    NEW: Allow users to update their AI companion's name
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        user_id = data.get('user_id', '').strip()
        new_ai_name = data.get('ai_name', '').strip()
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        if not new_ai_name:
            return jsonify({'error': 'AI name is required'}), 400
        
        # Validate AI name (basic sanitization)
        if len(new_ai_name) > 50:
            return jsonify({'error': 'AI name must be 50 characters or less'}), 400
        
        # Get Firestore client
        firestore_client = get_firestore_client() if firebase_available else None
        
        if not firestore_client:
            return jsonify({'error': 'Database not available'}), 503
        
        # Update user's AI name in multiple locations for reliability
        user_doc_ref = firestore_client.collection("users").document(user_id)
        
        # Update with merge to preserve other data
        user_doc_ref.update({
            'ai_preferences.ai_name': new_ai_name,
            'profile.ai_name': new_ai_name,
            'onboarding_data.ai_name': new_ai_name,
            'ai_name': new_ai_name,  # Direct field for easy access
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        logger.info(f"Updated AI name for user {user_id[:8]} to: {new_ai_name}")
        
        return jsonify({
            'success': True,
            'message': f'AI companion name updated to {new_ai_name}',
            'ai_name': new_ai_name
        })
        
    except Exception as e:
        logger.error(f"Update AI name endpoint error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to update AI name',
            'success': False
        }), 500

@chat_bp.route('/health', methods=['GET'])
def health_endpoint():
    """
    Health check endpoint with learning system status
    ENHANCED: Includes learning system health information
    """
    try:
        # Get orchestrator health
        health_status = check_orchestrator_health()
        
        # Add additional health checks
        health_status.update({
            'firebase_available': firebase_available,
            'routes_loaded': True,
            'timestamp': time.time(),
            'version': '8.0.0-learning'
        })
        
        # Determine overall status
        critical_systems = ['openai_client', 'api_key_configured']
        all_critical_ok = all(health_status.get(system, False) for system in critical_systems)
        
        overall_status = 'healthy' if all_critical_ok else 'degraded'
        
        return jsonify({
            'status': overall_status,
            'systems': health_status,
            'learning_features': {
                'real_time_adaptation': health_status.get('realtime_learning_available', False),
                'meta_learning': health_status.get('meta_learning_available', False),
                'memory_engine': health_status.get('memory_engine_available', False),
                'emotion_parsing': health_status.get('emotion_parser_available', False),
                'user_feedback': True,
                'adaptive_prompts': True,
                'dynamic_ai_names': True  # NEW feature
            }
        })
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': time.time()
        }), 500

@chat_bp.route('/learning-stats/<user_id>', methods=['GET'])
def learning_stats_endpoint(user_id):
    """
    Get learning statistics for a specific user
    NEW: Provides insights into user's interaction patterns and growth
    """
    try:
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Get Firestore client for stats retrieval
        firestore_client = get_firestore_client() if firebase_available else None
        
        if not firestore_client:
            return jsonify({'error': 'Database not available'}), 503
        
        # Get user's AI name for personalized response
        ai_name = get_user_ai_name(user_id, firestore_client)
        
        # Collect learning statistics
        stats = {
            'user_id': user_id,
            'ai_name': ai_name,
            'total_conversations': 0,
            'feedback_count': 0,
            'positive_feedback_rate': 0,
            'learning_adaptations': 0,
            'memory_usage': 0,
            'last_interaction': None
        }
        
        # Try to get actual stats from database
        try:
            # Get conversation count
            conversations = firestore_client.collection("users").document(user_id).collection("conversations").get()
            stats['total_conversations'] = len(conversations)
            
            # Get feedback stats if learning collection exists
            learning_docs = firestore_client.collection("learning_signals").where("user_id", "==", user_id).get()
            stats['feedback_count'] = len(learning_docs)
            
            # Calculate positive feedback rate
            if stats['feedback_count'] > 0:
                positive_feedback = sum(1 for doc in learning_docs if doc.to_dict().get('feedback_type') in ['perfect', 'helpful'])
                stats['positive_feedback_rate'] = round(positive_feedback / stats['feedback_count'] * 100, 1)
            
        except Exception as e:
            logger.warning(f"Could not retrieve detailed stats: {e}")
        
        return jsonify({
            'success': True,
            'stats': stats,
            'message': f'Learning statistics for {ai_name}'
        })
        
    except Exception as e:
        logger.error(f"Learning stats endpoint error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to retrieve learning statistics',
            'success': False
        }), 500

@chat_bp.route('/debug/prompt', methods=['POST'])
def debug_prompt_endpoint():
    """
    Debug endpoint to see the actual prompt being sent to OpenAI
    Useful for development and troubleshooting
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        message = data.get('message', '').strip()
        user_id = data.get('user_id', 'debug_user')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get Firestore client
        firestore_client = get_firestore_client() if firebase_available else None
        
        # Get dynamic AI name for debug
        ai_name = get_user_ai_name(user_id, firestore_client)
        
        # Get the debug prompt
        from utils.orchestrator import get_debug_prompt
        debug_prompt = get_debug_prompt(
            user_input=message,
            user_id=user_id,
            firestore_client=firestore_client,
            ai_name=ai_name  # FIXED: Pass dynamic AI name to debug
        )
        
        return jsonify({
            'success': True,
            'prompt': debug_prompt,
            'ai_name': ai_name,
            'user_id': user_id,
            'message': message,
            'timestamp': time.time()
        })
        
    except Exception as e:
        logger.error(f"Debug prompt error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to generate debug prompt',
            'details': str(e)
        }), 500

# Error handlers for the blueprint

@chat_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'available_endpoints': [
            'POST /index - Main chat endpoint',
            'POST /feedback - Submit feedback on responses',
            'POST /capture-reply - Capture reply signals',
            'POST /update-ai-name - Update AI companion name',
            'GET /health - Health check',
            'GET /learning-stats/<user_id> - Learning statistics',
            'POST /debug/prompt - Debug prompt generation'
        ]
    }), 404

@chat_bp.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({
        'error': 'Rate limit exceeded',
        'message': 'Please wait a moment before sending another message'
    }), 429

@chat_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error in chat routes: {error}")
    return jsonify({
        'error': 'Internal server error',
        'message': "I'm experiencing some difficulties. Please try again in a moment."
    }), 500

# Export the blueprint
__all__ = ['chat_bp']
