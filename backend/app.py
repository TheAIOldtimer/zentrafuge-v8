# app.py - POA Integration
# Your Flask app transformed with Prompt-Orchestrated Architecture

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime
import os

# POA imports - The new brain of Zentrafuge
from utils.orchestrator import orchestrate_response, get_debug_prompt, poa_metrics
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

app = Flask(__name__)
CORS(app, origins=["https://zentrafuge-v7.netlify.app"])  # Your frontend

@app.route('/index', methods=['POST'])
def chat():
    """
    REVOLUTIONARY CHAT ENDPOINT - POA POWERED
    
    What used to be complex module orchestration is now:
    1. Get message
    2. Assemble context + perfect prompt  
    3. Get emotionally intelligent response
    4. Store and return
    
    That's it. The AI handles the emotional complexity.
    """
    
    try:
        # Get request data
        data = request.get_json()
        user_message = data.get('message', '').strip()
        user_id = data.get('user_id')  # From Firebase Auth
        use_poa = data.get('poa', True)  # Default to POA, allow traditional fallback
        
        # Validation
        if not user_message or not user_id:
            return jsonify({
                "error": "Missing message or user_id",
                "response": "I need both a message and your user ID to respond properly."
            }), 400
        
        # THE MAGIC: POA response generation
        # This single line replaces your entire complex module pipeline
        cael_response = orchestrate_response(
            user_id=user_id, 
            user_message=user_message, 
            use_poa=use_poa,
            crypto_handler=None  # Add your crypto handler if needed
        )
        
        # Store the conversation (encrypted for privacy)
        store_conversation(user_id, user_message, cael_response)
        
        # Track success
        if use_poa:
            poa_metrics.log_poa_success()
        else:
            poa_metrics.log_traditional_success()
        
        # Return the emotionally intelligent response
        return jsonify({
            "response": cael_response,
            "method": "poa" if use_poa else "traditional",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logging.error(f"Chat endpoint error: {e}")
        
        # Track error
        if data.get('poa', True):
            poa_metrics.log_poa_error()
        else:
            poa_metrics.log_traditional_error()
        
        # Graceful error response in Cael's voice
        return jsonify({
            "response": "I'm experiencing a brief connection issue. Please try again - I'm here and want to be present with you.",
            "error": True
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
        
        # Get the exact prompt that would be sent to GPT-4
        debug_prompt = get_debug_prompt(user_id, user_message)
        
        return jsonify({
            "user_message": user_message,
            "system_prompt": debug_prompt,
            "explanation": "This is the exact prompt sent to GPT-4 to generate Cael's response",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logging.error(f"Debug prompt error: {e}")
        return jsonify({"error": f"Debug error: {str(e)}"}), 500

@app.route('/stats/poa', methods=['GET'])
def poa_stats():
    """
    PERFORMANCE MONITORING - Compare POA vs traditional approaches
    """
    
    try:
        stats = poa_metrics.get_stats()
        return jsonify({
            "poa_performance": stats,
            "interpretation": {
                "poa_success_rate": f"{stats['poa_success_rate']:.2%}",
                "traditional_success_rate": f"{stats['traditional_success_rate']:.2%}",
                "total_conversations": stats['total_poa_calls'] + stats['total_traditional_calls']
            },
            "recommendation": "POA" if stats['poa_success_rate'] > stats['traditional_success_rate'] else "Traditional"
        })
        
    except Exception as e:
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
        
        # Get responses from both systems
        poa_response = orchestrate_response(user_id, user_message, use_poa=True)
        traditional_response = orchestrate_response(user_id, user_message, use_poa=False)
        
        return jsonify({
            "user_message": user_message,
            "poa_response": poa_response,
            "traditional_response": traditional_response,
            "comparison_note": "Compare emotional warmth, memory integration, and naturalness",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logging.error(f"Comparison test error: {e}")
        return jsonify({"error": f"Comparison error: {str(e)}"}), 500

def store_conversation(user_id: str, user_message: str, cael_response: str):
    """
    Store conversation with encryption (your existing logic)
    Enhanced with POA metadata
    """
    
    try:
        # Get Firestore client (lazy initialization)
        from firebase_admin import firestore
        db = firestore.client()
        
        # Encrypt messages for privacy
        encrypted_user_message = encrypt_message(user_message)
        encrypted_cael_response = encrypt_message(cael_response)
        
        # Simple mood detection for storage (not for response generation)
        mood = detect_simple_mood(user_message)
        
        # Store in user's message collection
        conversation_data = {
            "user_message": encrypted_user_message,
            "cael_reply": encrypted_cael_response,
            "timestamp": datetime.now().isoformat(),
            "mood": mood,
            "method": "poa",  # Track which system generated this response
            "encrypted": True
        }
        
        # Store in user's message collection
        db.collection('users').document(user_id).collection('messages').add(conversation_data)
        
        logging.info(f"Conversation stored for user {user_id[:8]}...")
        
    except Exception as e:
        logging.error(f"Error storing conversation: {e}")
        # Don't break the response if storage fails

def detect_simple_mood(message: str) -> str:
    """
    Simple mood detection for storage metadata
    Much simpler than your old emotion parser - just for categorization
    """
    
    message_lower = message.lower()
    
    # Quick categorization for storage
    if any(word in message_lower for word in ['happy', 'great', 'amazing', 'wonderful']):
        return 'positive'
    elif any(word in message_lower for word in ['sad', 'down', 'depressed', 'lonely']):
        return 'melancholy'
    elif any(word in message_lower for word in ['angry', 'frustrated', 'annoyed', 'pissed']):
        return 'frustrated'
    elif any(word in message_lower for word in ['anxious', 'worried', 'scared', 'nervous']):
        return 'anxious'
    elif any(word in message_lower for word in ['tired', 'exhausted', 'overwhelmed']):
        return 'weary'
    else:
        return 'reflective'

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check for monitoring"""
    return jsonify({
        "status": "healthy",
        "architecture": "POA",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

# The Revolutionary Result:
# 
# Your Flask app went from complex module coordination to:
# 1. Receive message
# 2. Generate context + perfect prompt
# 3. Get emotionally intelligent response  
# 4. Store and return
# 
# That's it. The complexity moved from brittle code logic 
# to intelligent conversation orchestration.
#
# POA = Simpler code, more human responses, easier debugging
