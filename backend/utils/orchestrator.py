"""
Zentrafuge v8 Orchestrator
POA-compatible response coordination with memory integration
"""

import os
import logging
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
    """
    try:
        # Initialize context containers
        memory_recall = ""
        emotional_context = ""
        
        # Try to import and use memory engine if available
        try:
            from utils.memory_engine import retrieve_relevant_memories
            memory_recall = retrieve_relevant_memories(user_id, user_input, firestore_client)
        except ImportError:
            logger.warning("Memory engine not available - proceeding without memory")
            memory_recall = "Memory system initializing - responding in present moment"
        
        # Try to import and use emotion parser if available  
        try:
            from utils.emotion_parser import parse_emotional_tone
            emotional_context = parse_emotional_tone(user_input)
        except ImportError:
            logger.warning("Emotion parser not available - proceeding without emotional analysis")
            emotional_context = "Emotional analysis unavailable"
        
        # Check if OpenAI client is available
        if not client:
            logger.error("OpenAI client not initialized - API key missing")
            return "I'm experiencing a configuration issue. Please check back in a moment while we resolve this."
        
        # Build the POA prompt
        prompt = build_poa_prompt(user_input, memory_recall, emotional_context)
        
        # Query OpenAI with modern syntax
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.8,
            max_tokens=500
        )
        
        raw_reply = response.choices[0].message.content.strip()
        
        # Store the interaction in memory if possible
        try:
            from utils.memory_engine import store_conversation
            store_conversation(user_id, user_input, raw_reply, firestore_client)
        except ImportError:
            logger.warning("Could not store conversation - memory engine unavailable")
        
        return raw_reply
        
    except Exception as e:
        logger.error(f"Error in orchestrate_response: {e}")
        return "I'm here with you, but something went wrong on my side. You're not alone — let's try again in a moment."

def get_debug_prompt(user_input, user_id, firestore_client=None):
    """
    Return the full prompt for debugging purposes
    """
    try:
        # Simulate the same flow as orchestrate_response
        memory_recall = ""
        emotional_context = ""
        
        try:
            from utils.memory_engine import retrieve_relevant_memories
            memory_recall = retrieve_relevant_memories(user_id, user_input, firestore_client)
        except ImportError:
            memory_recall = "Memory system not available"
            
        try:
            from utils.emotion_parser import parse_emotional_tone
            emotional_context = parse_emotional_tone(user_input)
        except ImportError:
            emotional_context = "Emotion parser not available"
            
        return build_poa_prompt(user_input, memory_recall, emotional_context)
        
    except Exception as e:
        logger.error(f"Error in get_debug_prompt: {e}")
        return f"Debug error: {e}"

def poa_metrics():
    """
    Return POA configuration metrics
    """
    return {
        "model": "gpt-4",
        "temperature": 0.8,
        "max_tokens": 500,
        "prompt_style": "POA v8 with memory-aware phrasing",
        "architecture": "modular_fallback",
        "memory_enabled": True,
        "emotion_parsing_enabled": True,
        "last_updated": datetime.now().isoformat()
    }

# Fallback functions for graceful degradation
def simple_response_fallback(user_input):
    """
    Ultra-simple fallback if all else fails
    """
    prompt = f"""You are Cael, a gentle AI companion. Respond warmly to: {user_input}"""
    
    try:
        if not client:
            return "Configuration issue - OpenAI client unavailable"
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.8,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Even fallback failed: {e}")
        return "I'm experiencing some technical difficulties, but I'm here with you. Please try again in a moment."
