# backend/routes/chat_routes.py
"""
Chat Routes for Zentrafuge v8 - ENHANCED WITH LEARNING LOOPS
Handles chat interactions with real-time learning and feedback capture
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

@chat_bp.route('/index', methods=['POST'])
def chat_endpoint():
    """
    Main chat endpoint with learning integration
    ENHANCED: Now returns learning metadata and captures signals
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
        
        # Get Firestore client for learning
        firestore_client = get_firestore_client() if firebase_available else None
        
        # Process chat message with learning enhancement
        response_data = orchestrate_response(
            user_id=user_id,
            user_input=message,
            firestore_client=firestore_client,
            ai_name="Cael"
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
        logger.info(f"Chat interaction completed for user {user_id[:8]} in {duration:.3f}s")
        logger.info(f"Strategy: {response_data.get('strategy_used')}, Confidence: {response_data.get('confidence'):.2f}")
        
        # Return enhanced response
        return jsonify({
            'response': response_data['response'],
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
    NEW: Allows users to teach Cael what works and what doesn't
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
        
        # Get Firestore client
        firestore_client = get_firestore_client() if firebase_available else None
        
        # Process the feedback
        success = process_user_feedback(
            signal_id=signal_id,
            feedback_type=feedback_type,
            feedback_details=feedback_details if feedback_details else None,
            firestore_client=firestore_client
        )
        
        if success:
            logger.info(f"Feedback captured: {feedback_type} for signal {signal_id}")
            return jsonify({
                'success': True,
                'message': 'Feedback received - thank you for helping me learn!'
            })
        else:
            logger.warning(f"Failed to capture feedback for signal {signal_id}")
            return jsonify({
                'success': False,
                'message': 'Feedback received but could not be stored'
            })
        
    except Exception as e:
        logger.error(f"Feedback endpoint error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to process feedback',
            'success': False
        }), 500

@chat_bp.route('/capture-reply', methods=['POST'])
def capture_reply_endpoint():
    """
    Capture user reply signals for resonance calculation
    NEW: Measures how well Cael's responses are landing
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        signal_id = data.get('signal_id', '').strip()
        reply_message = data.get('reply_message', '').strip()
        time_since_response = data.get('time_since_response', 0)
        
        if not signal_id:
            return jsonify({'error': 'Signal ID is required'}), 400
        
        if not reply_message:
            return jsonify({'error': 'Reply message is required'}), 400
        
        # Get Firestore client
        firestore_client = get_firestore_client() if firebase_available else None
        
        # Capture the reply signal
        resonance_score = capture_user_reply_signal(
            signal_id=signal_id,
            reply_message=reply_message,
            time_since_response=float(time_since_response),
            firestore_client=firestore_client
        )
        
        if resonance_score is not None:
            logger.debug(f"Reply signal captured: {resonance_score:.2f} resonance for {signal_id}")
            return jsonify({
                'success': True,
                'resonance_score': round(resonance_score, 3),
                'message': 'Reply signal captured successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Reply signal could not be processed'
            })
        
    except Exception as e:
        logger.error(f"Capture reply endpoint error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to capture reply signal',
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
                'adaptive_prompts': True
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
        
        # Get Firestore client
        firestore_client = get_firestore_client() if firebase_available else None
        
        if not firestore_client:
            return jsonify({
                'error': 'Learning statistics not available - Firebase not configured',
                'user_id': user_id,
                'stats': {}
            }), 503
        
        # Try to get learning engine to fetch stats
        try:
            from utils.realtime_learning_engine import RealtimeLearningEngine
            learning_engine = RealtimeLearningEngine(firestore_client)
            
            # Get user patterns and growth data
            patterns = learning_engine.get_user_patterns(user_id)
            
            # Basic stats calculation
            stats = {
                'user_id': user_id,
                'total_interactions': patterns.get('interaction_count', 0),
                'emotional_patterns': len(patterns.get('emotional_patterns', [])),
                'learning_enabled': True,
                'last_updated': patterns.get('generated_at'),
                'growth_indicators': {
                    'engagement_trend': 'stable',  # Would be calculated from actual data
                    'emotional_stability': 'improving',
                    'conversation_depth': 'moderate'
                }
            }
            
            return jsonify({
                'success': True,
                'stats': stats,
                'patterns': patterns
            })
            
        except ImportError:
            return jsonify({
                'error': 'Learning engine not available',
                'user_id': user_id,
                'stats': {}
            }), 503
        
    except Exception as e:
        logger.error(f"Learning stats error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to retrieve learning statistics',
            'user_id': user_id,
            'stats': {}
        }), 500

@chat_bp.route('/debug/prompt', methods=['POST'])
def debug_prompt_endpoint():
    """
    Debug endpoint to view the generated prompt
    Useful for testing and development
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
        
        # Get the debug prompt
        from utils.orchestrator import get_debug_prompt
        debug_prompt = get_debug_prompt(
            user_input=message,
            user_id=user_id,
            firestore_client=firestore_client,
            ai_name="Cael"
        )
        
        return jsonify({
            'success': True,
            'prompt': debug_prompt,
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
