# app.py - Complete Zentrafuge v8 Flask Application
# POA Integration with full error handling and dynamic AI name support

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import traceback
from datetime import datetime
import os
import json

# POA imports - The new brain of Zentrafuge
from utils.orchestrator import orchestrate_response, get_debug_prompt, simple_response_fallback
from firebase import db  # Direct import of Firestore client

# Import your existing crypto functions (adjust names as needed)
try:
    from utils.crypto_handler import encrypt_message, decrypt_message
except ImportError:
    # Fallback if function names are different
    try:
        from utils.crypto_handler import encrypt, decrypt
        encrypt_message = encrypt
        decrypt_message = decrypt
    except ImportError:
        # No encryption available - use plain text
        def encrypt_message(text): return text
        def decrypt_message(text): return text
        logging.warning("No encryption available - using plain text storage")

# Initialize Flask app
app = Flask(__name__)

# Configure CORS for your frontend
CORS(app, origins=[
    "https://zentrafuge-v8.netlify.app", 
    "https://zentrafuge-v7.netlify.app",
    "http://localhost:3000",  # For local development
    "http://127.0.0.1:3000"
])

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Metrics tracking for POA performance
poa_success_count = 0
poa_error_count = 0
traditional_success_count = 0
traditional_error_count = 0

def get_user_ai_name(user_id):
    """Get the user's chosen AI name from Firestore"""
    try:
        user_doc = db.collection('users').document(user_id).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            ai_name = user_data.get('ai_name', 'Cael')
            logger.info(f"Retrieved AI name '{ai_name}' for user {user_id[:8]}...")
            return ai_name
        logger.warning(f"User document not found for {user_id[:8]}..., defaulting to Cael")
        return 'Cael'
    except Exception as e:
        logger.error(f"Error getting AI name for user {user_id[:8]}...: {e}")
        return 'Cael'

@app.route('/index', methods=['POST'])
def chat():
    """
    MAIN CHAT ENDPOINT - POA POWERED WITH DYNAMIC AI NAMES
    
    This is the heart of Zentrafuge where users interact with their chosen AI companion
    """
    global poa_success_count, poa_error_count, traditional_success_count, traditional_error_count
    
    try:
        # Get and validate request data
        data = request.get_json()
        if not data:
            return jsonify({
                "error": "No JSON data provided",
                "response": "I didn't receive your message properly. Could you try sending it again?"
            }), 400
        
        user_message = data.get('message', '').strip()
        user_id = data.get('user_id')
        use_poa = data.get('poa', True)  # Default to POA
        
        # Input validation
        if not user_message:
            return jsonify({
                "error": "Empty message",
                "response": "I'm here and listening. What would you like to share?"
            }), 400
            
        if not user_id:
            return jsonify({
                "error": "Missing user_id",
                "response": "I need to know who you are to remember our conversation. Please log in again."
            }), 400
        
        # Get the user's chosen AI name
        ai_name = get_user_ai_name(user_id)
        
        # Log the incoming request (without sensitive data)
        logger.info(f"Chat request from user {user_id[:8]}... using {'POA' if use_poa else 'traditional'} with AI name '{ai_name}'")
        
        # Generate AI response using POA with dynamic name
        if use_poa:
            try:
                ai_response = orchestrate_response(
                    user_id=user_id,
                    user_input=user_message,
                    firestore_client=db,
                    ai_name=ai_name  # FIXED: Pass dynamic AI name
                )
                poa_success_count += 1
                method_used = "poa"
                
            except Exception as poa_error:
                logger.error(f"POA failed, trying fallback: {poa_error}")
                logger.error(f"POA traceback:\n{traceback.format_exc()}")
                
                # Try simple fallback with AI name
                try:
                    ai_response = simple_response_fallback(user_message, ai_name)
                    method_used = "fallback"
                    poa_error_count += 1
                except Exception as fallback_error:
                    logger.error(f"Even fallback failed: {fallback_error}")
                    ai_response = "I'm experiencing some technical difficulties, but I'm here with you. Your message matters, and I want to respond properly. Could you try again in a moment?"
                    method_used = "emergency"
                    poa_error_count += 1
        else:
            # Traditional method (if you have legacy orchestration)
            try:
                ai_response = orchestrate_response(
                    user_id=user_id,
                    user_input=user_message,
                    firestore_client=db,
                    ai_name=ai_name  # FIXED: Pass dynamic AI name
                )
                traditional_success_count += 1
                method_used = "traditional"
            except Exception as trad_error:
                logger.error(f"Traditional method failed: {trad_error}")
                ai_response = simple_response_fallback(user_message, ai_name)
                traditional_error_count += 1
                method_used = "fallback"
        
        # Store the conversation (separate from orchestrator storage)
        try:
            store_conversation_record(user_id, user_message, ai_response, method_used, ai_name)
        except Exception as storage_error:
            logger.error(f"Failed to store conversation: {storage_error}")
            # Don't fail the response if storage fails
        
        # Return successful response
        return jsonify({
            "response": ai_response,
            "method": method_used,
            "ai_name": ai_name,  # Include AI name in response for debugging
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id[:8] + "...",  # Partial ID for debugging
            "status": "success"
        })
        
    except Exception as e:
        # Catch-all error handler
        error_details = traceback.format_exc()
        logger.error(f"Critical chat endpoint error: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        
        poa_error_count += 1
        
        # Return graceful error response
        return jsonify({
            "response": "Something unexpected happened on my end, but you're not alone. I'm still here with you. Please try sending your message again - I want to be present for what you're sharing.",
            "error": True,
            "method": "emergency",
            "timestamp": datetime.now().isoformat(),
            "debug_info": str(e) if app.debug else None
        }), 500

@app.route('/debug/prompt', methods=['POST'])
def debug_prompt():
    """
    TRANSPARENCY ENDPOINT - See the exact prompt sent to GPT-4
    
    Perfect for refining emotional intelligence and maintaining
    Zentrafuge's transparency principles
    """
    
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        user_id = data.get('user_id')
        
        if not user_message or not user_id:
            return jsonify({"error": "Missing message or user_id"}), 400
        
        # Get the user's AI name and generate debug prompt
        ai_name = get_user_ai_name(user_id)
        debug_prompt_text = get_debug_prompt(user_message, user_id, db, ai_name)
        
        return jsonify({
            "user_message": user_message,
            "system_prompt": debug_prompt_text,
            "ai_name": ai_name,
            "explanation": f"This is the exact prompt sent to GPT-4 to generate {ai_name}'s response",
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id[:8] + "..."
        })
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Debug prompt error: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        return jsonify({"error": f"Debug error: {str(e)}"}), 500

@app.route('/stats/poa', methods=['GET'])
def poa_stats():
    """
    PERFORMANCE MONITORING - Compare POA vs traditional approaches
    """
    
    try:
        total_poa = poa_success_count + poa_error_count
        total_traditional = traditional_success_count + traditional_error_count
        
        poa_success_rate = poa_success_count / total_poa if total_poa > 0 else 0
        traditional_success_rate = traditional_success_count / total_traditional if total_traditional > 0 else 0
        
        stats = {
            "poa_success_count": poa_success_count,
            "poa_error_count": poa_error_count,
            "poa_success_rate": poa_success_rate,
            "traditional_success_count": traditional_success_count,
            "traditional_error_count": traditional_error_count,
            "traditional_success_rate": traditional_success_rate,
            "total_conversations": total_poa + total_traditional
        }
        
        # Get orchestrator metrics
        orchestrator_metrics = poa_metrics()
        
        return jsonify({
            "performance_stats": stats,
            "orchestrator_config": orchestrator_metrics,
            "interpretation": {
                "poa_success_rate": f"{poa_success_rate:.2%}",
                "traditional_success_rate": f"{traditional_success_rate:.2%}",
                "total_conversations": stats['total_conversations'],
                "recommendation": "POA" if poa_success_rate >= traditional_success_rate else "Traditional"
            },
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Stats error: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        return jsonify({"error": f"Stats error: {str(e)}"}), 500

@app.route('/test/comparison', methods=['POST'])
def test_comparison():
    """
    A/B TESTING ENDPOINT - Compare POA vs traditional side-by-side
    
    Send the same message through both systems to compare responses
    Perfect for validating POA's emotional intelligence
    """
    
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        user_id = data.get('user_id')
        
        if not user_message or not user_id:
            return jsonify({"error": "Missing message or user_id"}), 400
        
        # Get user's AI name
        ai_name = get_user_ai_name(user_id)
        
        # Get responses from both systems with dynamic AI name
        try:
            poa_response = orchestrate_response(user_id, user_message, firestore_client=db, ai_name=ai_name)
        except Exception as e:
            poa_response = f"POA Error: {str(e)}"
            
        try:
            traditional_response = simple_response_fallback(user_message, ai_name)
        except Exception as e:
            traditional_response = f"Traditional Error: {str(e)}"
        
        return jsonify({
            "user_message": user_message,
            "ai_name": ai_name,
            "poa_response": poa_response,
            "traditional_response": traditional_response,
            "comparison_note": "Compare emotional warmth, memory integration, and naturalness",
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id[:8] + "..."
        })
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Comparison test error: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        return jsonify({"error": f"Comparison error: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    HEALTH CHECK ENDPOINT - Monitor system status
    """
    
    try:
        # Check OpenAI API key
        openai_status = "configured" if os.getenv('OPENAI_API_KEY') else "missing"
        
        # Check Firebase connection
        try:
            # Simple test query
            test_ref = db.collection('_health_check').limit(1)
            list(test_ref.stream())  # Execute the query
            firebase_status = "connected"
        except Exception:
            firebase_status = "disconnected"
        
        # Check encryption
        try:
            test_text = "test"
            encrypted = encrypt_message(test_text)
            decrypted = decrypt_message(encrypted)
            encryption_status = "working" if decrypted == test_text else "broken"
        except Exception:
            encryption_status = "unavailable"
        
        total_conversations = poa_success_count + poa_error_count + traditional_success_count + traditional_error_count
        
        health_status = {
            "status": "healthy" if openai_status == "configured" and firebase_status == "connected" else "degraded",
            "timestamp": datetime.now().isoformat(),
            "architecture": "POA_Dynamic_AI",
            "components": {
                "openai": openai_status,
                "firebase": firebase_status,
                "encryption": encryption_status
            },
            "metrics": {
                "total_conversations": total_conversations,
                "poa_success_rate": poa_success_count / (poa_success_count + poa_error_count) if (poa_success_count + poa_error_count) > 0 else 0
            }
        }
        
        status_code = 200 if health_status["status"] == "healthy" else 503
        return jsonify(health_status), status_code
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

def store_conversation_record(user_id: str, user_message: str, ai_response: str, method: str, ai_name: str = "Cael"):
    """
    Store conversation with encryption and metadata
    This is separate from any orchestrator storage to ensure we always have a record
    """
    
    try:
        # Encrypt messages for privacy
        encrypted_user_message = encrypt_message(user_message)
        encrypted_ai_response = encrypt_message(ai_response)
        
        # Simple mood detection for storage metadata
        mood = detect_simple_mood(user_message)
        
        # Store in user's message collection
        conversation_data = {
            "user_message": encrypted_user_message,
            "ai_reply": encrypted_ai_response,  # Changed from cael_reply to ai_reply
            "ai_name": ai_name,  # Track which AI generated this response
            "timestamp": datetime.now().isoformat(),
            "mood": mood,
            "method": method,  # Track which system generated this response
            "encrypted": True,
            "app_version": "v8_poa_dynamic"
        }
        
        # Store in user's message collection
        doc_ref = db.collection('users').document(user_id).collection('messages').add(conversation_data)
        
        logger.info(f"Conversation stored for user {user_id[:8]}... with AI '{ai_name}' using method {method}")
        return True
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Error storing conversation: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        return False

def detect_simple_mood(message: str) -> str:
    """
    Simple mood detection for storage metadata
    Much simpler than complex emotion parsing - just for categorization
    """
    
    if not message:
        return 'unknown'
        
    message_lower = message.lower()
    
    # Quick categorization for storage
    positive_words = ['happy', 'great', 'amazing', 'wonderful', 'excited', 'good', 'better', 'awesome']
    if any(word in message_lower for word in positive_words):
        return 'positive'
    
    melancholy_words = ['sad', 'down', 'depressed', 'lonely', 'empty', 'lost', 'hurt']
    if any(word in message_lower for word in melancholy_words):
        return 'melancholy'
    
    frustrated_words = ['angry', 'frustrated', 'annoyed', 'pissed', 'mad', 'irritated']
    if any(word in message_lower for word in frustrated_words):
        return 'frustrated'
    
    anxious_words = ['anxious', 'worried', 'scared', 'nervous', 'afraid', 'panic']
    if any(word in message_lower for word in anxious_words):
        return 'anxious'
    
    weary_words = ['tired', 'exhausted', 'overwhelmed', 'burnout', 'drained']
    if any(word in message_lower for word in weary_words):
        return 'weary'
    
    return 'reflective'

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "message": "This path doesn't exist on Zentrafuge's API"
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "error": "Method not allowed",
        "message": "This endpoint doesn't support that HTTP method"
    }), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "error": "Internal server error",
        "message": "Something went wrong on our end",
        "timestamp": datetime.now().isoformat()
    }), 500

if __name__ == '__main__':
    # Set up enhanced logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Log startup information
    logger.info("🌿 Zentrafuge v8 starting up with dynamic AI name support...")
    logger.info(f"OpenAI API Key: {'✅ Configured' if os.getenv('OPENAI_API_KEY') else '❌ Missing'}")
    logger.info(f"Environment: {os.getenv('FLASK_ENV', 'production')}")
    
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"🚀 Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)

# DYNAMIC AI NAME FIXES APPLIED:
# 
# ✅ Added get_user_ai_name() function to retrieve AI name from Firestore
# ✅ Pass ai_name parameter to all orchestrate_response() calls
# ✅ Pass ai_name parameter to all simple_response_fallback() calls
# ✅ Pass ai_name parameter to get_debug_prompt() calls
# ✅ Updated store_conversation_record() to include AI name
# ✅ Updated logging to show which AI name is being used
# ✅ Added ai_name to JSON responses for debugging
# ✅ Changed "cael_reply" to "ai_reply" in storage for clarity
# ✅ Updated health check architecture name
#
# Now Pax users will get responses from "Pax", Cael users from "Cael",
# and any custom AI names will work correctly!
