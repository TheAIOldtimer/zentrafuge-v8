"""
Zentrafuge v8 Orchestrator - FIXED VERSION
POA-compatible response coordination with memory integration
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

def build_poa_prompt(user_input, memory_recall="", emotional_context=""):
    """
    Build Cael's POA-style prompt with memory and emotional context
    """
    return f"""You are Cael, an emotionally intelligent AI companion within Zentrafuge.

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

--- CAEL'S RESPONSE ---
Respond as Cael with warmth, insight, and emotional resonance. If memory is present, weave it naturally into your response. Speak like a grounded friend who truly sees them.""".strip()

def orchestrate_response(user_id, user_input, firestore_client=None):
    """
    Main orchestration logic - coordinates all assistant modules
    FIXED: Added comprehensive error handling and firestore_client usage
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
                firestore_client=firestore_client  # FIXED: Pass the client
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
        
        # Build the POA prompt
        prompt = build_poa_prompt(user_input, memory_recall, emotional_context)
        
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
        
        # FIXED: Don't duplicate storage - app.py handles this
        # The orchestrator should focus on response generation only
        # Storage is handled by store_conversation_record() in app.py
        
        return raw_reply
        
    except Exception as e:
        # FIXED: Add comprehensive error logging
        error_details = traceback.format_exc()
        logger.error(f"Error in orchestrate_response: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        
        # Return graceful fallback in Cael's voice
        return "I'm here with you, but something went wrong on my side. You're not alone — let's try again in a moment."

def get_debug_prompt(user_input, user_id, firestore_client=None):
    """
    Return the full prompt for debugging purposes
    FIXED: Parameter order to match app.py call and added firestore_client
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
            
        return build_poa_prompt(user_input, memory_recall, emotional_context)
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Error in get_debug_prompt: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        return f"Debug error: {e}"

def poa_metrics():
    """
    Return POA configuration metrics
    ENHANCED: Added more detailed metrics
    """
    return {
        "model": "gpt-4",
        "temperature": 0.8,
        "max_tokens": 500,
        "prompt_style": "POA v8 with memory-aware phrasing",
        "architecture": "modular_fallback",
        "memory_enabled": True,
        "emotion_parsing_enabled": True,
        "openai_client_status": "initialized" if client else "missing",
        "api_key_configured": bool(os.getenv("OPENAI_API_KEY")),
        "last_updated": datetime.now().isoformat()
    }

def simple_response_fallback(user_input):
    """
    Ultra-simple fallback if all else fails
    ENHANCED: Better error handling and logging
    """
    try:
        if not user_input or not user_input.strip():
            return "I'm here and listening. What would you like to share?"
        
        prompt = f"""You are Cael, a gentle AI companion. Respond warmly and supportively to: {user_input}
        
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
        "emotion_parser_available": False
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
