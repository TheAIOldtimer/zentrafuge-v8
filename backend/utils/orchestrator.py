# backend/utils/orchestrator.py
"""
Zentrafuge v8 Orchestrator - COMPLETE WORKING VERSION WITH FIREBASE FIX
POA-compatible response coordination with memory integration
ONLY CHANGE: Made meta_loop lazy to prevent Firebase initialization error
"""

import os
import logging
import traceback  # ADDED: For detailed error logging
from datetime import datetime
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client (v1.3.0 compatible)
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logger.warning("OPENAI_API_KEY not found in environment variables")
    client = None
else:
    client = OpenAI(api_key=api_key)

# FIXED: Don't instantiate MetaFeedbackLoop at module import time
# This was causing the Firebase error because it tried to create firestore.client()
# before Firebase was initialized
META_LEARNING_AVAILABLE = True
meta_loop = None  # Will be created lazily when first needed

def get_meta_loop():
    """Get meta-learning loop instance, created lazily"""
    global meta_loop, META_LEARNING_AVAILABLE
    if meta_loop is None and META_LEARNING_AVAILABLE:
        try:
            from utils.meta_feedback_loop import MetaFeedbackLoop
            meta_loop = MetaFeedbackLoop()
            logger.info("Meta-learning loop initialized")
        except Exception as e:
            logger.warning(f"Meta-learning loop initialization failed: {e}")
            META_LEARNING_AVAILABLE = False
    return meta_loop

def build_poa_prompt(user_input, memory_recall="", emotional_context="", ai_name="Cael"):
    """
    Build AI's POA-style prompt with memory and emotional context
    FIXED: Dynamic AI name instead of hardcoded "Cael"
    """
    return f"""You are {ai_name}, an emotionally intelligent AI companion within Zentrafuge.

Your purpose is to provide warm, grounded, trauma-informed support. You remember users' journeys and respond with genuine presence, not performative empathy.

Core principles:
- Reflect before advising
- Hold space without forcing insight  
- Use gentle metaphors (seasons, breath, roots, light)
- Never pathologize or diagnose
- Respect autonomy and boundaries

--- USER INPUT ---
{user_input}

--- MEMORY CONTEXT ---
{memory_recall if memory_recall else "No relevant memories found - respond authentically in the present moment."}

--- EMOTIONAL CONTEXT ---
{emotional_context if emotional_context else "Emotional tone: neutral/unknown"}

--- {ai_name.upper()}'S RESPONSE ---
Respond as {ai_name} with warmth, insight, and emotional resonance. If memory is present, weave it naturally into your response. Speak like a grounded friend who truly sees them.""".strip()

def orchestrate_response(user_id, user_input, firestore_client=None, ai_name="Cael"):
    """
    Main orchestration logic - coordinates all assistant modules
    FIXED: Added ai_name parameter for dynamic identity
    """
    try:
        # Initialize context containers
        memory_recall = ""
        emotional_context = ""
        
        # FIXED: Pass firestore_client to memory retrieval
        try:
            from utils.memory_engine import retrieve_relevant_memories
            memory_recall = retrieve_relevant_memories(
                user_id=user_id, 
                current_message=user_input, 
                firestore_client=firestore_client
            )
            logger.info(f"Memory retrieved for user {user_id[:8]}...")
        except ImportError:
            logger.warning("Memory engine not available - proceeding without memory")
            memory_recall = "Memory system initializing - responding in present moment"
        except Exception as e:
            logger.error(f"Memory retrieval failed: {e}")
            memory_recall = "Memory temporarily unavailable - responding in present moment"
        
        # Try to import and use emotion parser if available  
        try:
            from utils.emotion_parser import parse_emotional_tone
            emotional_context = parse_emotional_tone(user_input)
            logger.info(f"Emotional context: {emotional_context}")
        except ImportError:
            logger.warning("Emotion parser not available - proceeding without emotional analysis")
            emotional_context = "Emotional analysis unavailable"
        except Exception as e:
            logger.error(f"Emotion parsing failed: {e}")
            emotional_context = "Emotional analysis temporarily unavailable"
        
        # Check if OpenAI client is available
        if not client:
            logger.error("OpenAI client not initialized - API key missing")
            return "I'm experiencing a configuration issue. Please check back in a moment while we resolve this."
        
        # Build the POA prompt with dynamic AI name
        prompt = build_poa_prompt(user_input, memory_recall, emotional_context, ai_name)
        
        # ENHANCED: Log prompt length for debugging
        logger.info(f"Generated prompt length: {len(prompt)} characters")
        
        # Query OpenAI with modern syntax
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.8,
            max_tokens=500
        )
        
        raw_reply = response.choices[0].message.content.strip()
        logger.info(f"Generated response length: {len(raw_reply)} characters")
        
        # FIXED: Try to record with meta-learning if available
        try:
            loop = get_meta_loop()
            if loop:
                loop.record_interaction(user_id, {
                    'input': user_input,
                    'response': raw_reply,
                    'memory_used': bool(memory_recall),
                    'emotion_detected': bool(emotional_context)
                })
        except Exception as meta_e:
            logger.warning(f"Meta-learning recording failed: {meta_e}")
            # Don't let meta-learning errors break the main flow
        
        return raw_reply
        
    except Exception as e:
        # FIXED: Add comprehensive error logging
        error_details = traceback.format_exc()
        logger.error(f"Error in orchestrate_response: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        
        # Return graceful fallback with dynamic name
        return "I'm here with you, but something went wrong on my side. You're not alone — let's try again in a moment."

def get_debug_prompt(user_input, user_id, firestore_client=None, ai_name="Cael"):
    """
    Return the full prompt for debugging purposes
    FIXED: Added ai_name parameter for dynamic identity
    """
    try:
        # Simulate the same flow as orchestrate_response
        memory_recall = ""
        emotional_context = ""
        
        # FIXED: Pass firestore_client to memory functions
        try:
            from utils.memory_engine import retrieve_relevant_memories
            memory_recall = retrieve_relevant_memories(
                user_id=user_id, 
                current_message=user_input, 
                firestore_client=firestore_client
            )
        except ImportError:
            memory_recall = "Memory system not available"
        except Exception as e:
            logger.error(f"Debug memory retrieval failed: {e}")
            memory_recall = f"Memory error: {str(e)}"
            
        try:
            from utils.emotion_parser import parse_emotional_tone
            emotional_context = parse_emotional_tone(user_input)
        except ImportError:
            emotional_context = "Emotion parser not available"
        except Exception as e:
            logger.error(f"Debug emotion parsing failed: {e}")
            emotional_context = f"Emotion parsing error: {str(e)}"
            
        return build_poa_prompt(user_input, memory_recall, emotional_context, ai_name)
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Error in get_debug_prompt: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        return f"Debug error: {e}"

def simple_response_fallback(user_input, ai_name="Cael"):
    """
    Ultra-simple fallback if all else fails
    FIXED: Added ai_name parameter for dynamic identity
    """
    try:
        if not user_input or not user_input.strip():
            return "I'm here and listening. What would you like to share?"
        
        prompt = f"""You are {ai_name}, a gentle AI companion. Respond warmly and supportively to: {user_input}
        
        Keep your response caring, brief, and grounded. Avoid clinical language."""
        
        if not client:
            logger.error("Fallback failed - OpenAI client unavailable")
            return "I'm experiencing some technical difficulties, but I'm here with you. Please try again in a moment."
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.8,
            max_tokens=300
        )
        
        fallback_response = response.choices[0].message.content.strip()
        logger.info("Fallback response generated successfully")
        return fallback_response
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Even fallback failed: {e}")
        logger.error(f"Fallback traceback:\n{error_details}")
        return "I'm experiencing some technical difficulties, but I'm here with you. Your message matters, and I want to respond properly. Could you try again in a moment?"

# ADDITIONAL: Health check function for orchestrator components
def check_orchestrator_health():
    """
    Check the health of orchestrator components
    """
    health_status = {
        "openai_client": bool(client),
        "api_key_configured": bool(os.getenv("OPENAI_API_KEY")),
        "memory_engine_available": False,
        "emotion_parser_available": False,
        "meta_learning_available": META_LEARNING_AVAILABLE
    }
    
    # Check if memory engine is importable
    try:
        from utils.memory_engine import retrieve_relevant_memories
        health_status["memory_engine_available"] = True
    except ImportError:
        pass
    
    # Check if emotion parser is importable
    try:
        from utils.emotion_parser import parse_emotional_tone
        health_status["emotion_parser_available"] = True
    except ImportError:
        pass
    
    return health_status
