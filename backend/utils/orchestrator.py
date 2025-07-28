# backend/utils/orchestrator.py
"""
Zentrafuge v8 Orchestrator - ENHANCED WITH LEARNING LOOPS
POA-compatible response coordination with real-time learning and adaptation
"""

import os
import logging
import traceback
from datetime import datetime
from openai import OpenAI
from typing import Dict, Any, Optional

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
learning_engine = None  # Will be created lazily when first needed

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

def get_learning_engine(firestore_client=None):
    """Get real-time learning engine instance, created lazily"""
    global learning_engine
    if learning_engine is None and firestore_client:
        try:
            from utils.realtime_learning_engine import RealtimeLearningEngine
            learning_engine = RealtimeLearningEngine(firestore_client)
            logger.info("Real-time learning engine initialized")
        except Exception as e:
            logger.warning(f"Learning engine initialization failed: {e}")
    return learning_engine

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

def build_adaptive_poa_prompt(user_input, memory_recall="", emotional_context="", ai_name="Cael", strategy=None):
    """
    Build adaptive POA prompt that learns from user interactions
    ENHANCED: Incorporates learning loop insights for personalized responses
    """
    
    if not strategy:
        return build_poa_prompt(user_input, memory_recall, emotional_context, ai_name)
    
    # Adaptive approach styles based on learning
    approach_styles = {
        'gentle_grounding': "Respond with gentle, grounding presence. Use simple, calming language and metaphors from nature.",
        'curious_exploration': "Respond with warm curiosity. Ask gentle questions to deepen understanding without pressure.",
        'warm_validation': "Lead with validation and warmth. Acknowledge their experience fully before offering any perspective.",
        'pattern_reflection': "Help them see patterns in their experience with gentle insight and wisdom.",
        'present_moment': "Focus entirely on the present moment. Ground them in what's happening right now.",
        'memory_integration': "Skillfully weave their past experiences to show growth and continuity."
    }
    
    style_instruction = approach_styles.get(strategy.get('approach', 'gentle_grounding'))
    confidence = strategy.get('confidence', 0.7)
    
    # Add confidence-based adjustments
    if confidence > 0.9:
        confidence_note = "High confidence - this approach has worked very well for this user before."
    elif confidence > 0.7:
        confidence_note = "Good confidence - this approach typically works well for this user."
    elif confidence > 0.5:
        confidence_note = "Moderate confidence - adapt based on their response."
    else:
        confidence_note = "Lower confidence - be especially attentive to their reaction."
    
    return f"""You are {ai_name}, an emotionally intelligent AI companion within Zentrafuge.

Your purpose is to provide warm, grounded, trauma-informed support. You remember users' journeys and respond with genuine presence, not performative empathy.

--- ADAPTIVE GUIDANCE ---
{style_instruction}

Learning insights: {confidence_note}
Response style: {strategy.get('response_style', 'warm_validation')}
Memory use: {strategy.get('memory_use', 'moderate')}
Optimal message length: {strategy.get('message_length', 'medium')}

--- USER INPUT ---
{user_input}

--- MEMORY CONTEXT ---
{memory_recall if memory_recall else "No relevant memories - respond authentically in the present moment."}

--- EMOTIONAL CONTEXT ---
{emotional_context if emotional_context else "Emotional tone: neutral/unknown"}

--- {ai_name.upper()}'S RESPONSE ---
Respond as {ai_name} using the adaptive guidance above. Your response should feel natural and authentic while incorporating these learned insights about what works best for this person.""".strip()

def orchestrate_response(user_id, user_input, firestore_client=None, ai_name="Cael"):
    """
    Main orchestration logic with real-time learning integration
    ENHANCED: Now captures learning signals and adapts responses in real-time
    """
    try:
        # Initialize context containers
        memory_recall = ""
        emotional_context = ""
        signal_id = None
        
        # ENHANCED: Get learning engine for this interaction
        learning_eng = get_learning_engine(firestore_client)
        
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
        emotional_analysis = {}
        try:
            from utils.emotion_parser import parse_emotional_tone
            emotional_context = parse_emotional_tone(user_input)
            
            # Create structured emotional analysis for learning
            emotional_analysis = {
                'primary_emotion': emotional_context.split(':')[0] if ':' in emotional_context else 'neutral',
                'intensity': 0.5,  # Default, would be enhanced by actual emotion parser
                'context': emotional_context
            }
            
            logger.info(f"Emotional context: {emotional_context}")
        except ImportError:
            logger.warning("Emotion parser not available - proceeding without emotional analysis")
            emotional_context = "Emotional analysis unavailable"
            emotional_analysis = {'primary_emotion': 'neutral', 'intensity': 0.5}
        except Exception as e:
            logger.error(f"Emotion parsing failed: {e}")
            emotional_context = "Emotional analysis temporarily unavailable"
            emotional_analysis = {'primary_emotion': 'neutral', 'intensity': 0.5}
        
        # ENHANCED: Capture interaction start for learning
        if learning_eng:
            try:
                signal_id = learning_eng.capture_interaction_start(
                    user_id=user_id,
                    user_message=user_input,
                    emotional_analysis=emotional_analysis,
                    memory_context={'memory_recalled': bool(memory_recall and memory_recall != "Memory temporarily unavailable")}
                )
                logger.debug(f"Learning signal started: {signal_id}")
            except Exception as e:
                logger.warning(f"Failed to start learning signal: {e}")
        
        # ENHANCED: Get adaptive strategy based on learning history
        strategy = None
        if learning_eng:
            try:
                strategy = learning_eng.get_adaptive_strategy(user_id, {
                    'emotional_state': emotional_analysis.get('primary_emotion'),
                    'memory_available': bool(memory_recall and memory_recall != "Memory temporarily unavailable"),
                    'time_of_day': datetime.now().hour,
                    'interaction_context': 'chat'
                })
                logger.debug(f"Adaptive strategy: {strategy.get('approach', 'default')}")
            except Exception as e:
                logger.warning(f"Failed to get adaptive strategy: {e}")
        
        # Check if OpenAI client is available
        if not client:
            logger.error("OpenAI client not initialized - API key missing")
            return "I'm experiencing a configuration issue. Please check back in a moment while we resolve this."
        
        # ENHANCED: Build adaptive prompt or fall back to standard
        if strategy:
            prompt = build_adaptive_poa_prompt(user_input, memory_recall, emotional_context, ai_name, strategy)
            response_style = strategy.get('response_style', 'adaptive')
        else:
            prompt = build_poa_prompt(user_input, memory_recall, emotional_context, ai_name)
            response_style = 'standard'
        
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
        
        # ENHANCED: Complete the learning signal with response details
        if learning_eng and signal_id:
            try:
                memory_type = None
                if memory_recall and "recent context" in memory_recall.lower():
                    memory_type = "contextual"
                elif memory_recall and "previous" in memory_recall.lower():
                    memory_type = "conversational"
                
                learning_eng.complete_interaction(
                    signal_id=signal_id,
                    cael_response=raw_reply,
                    response_style=response_style,
                    memory_type=memory_type
                )
                logger.debug(f"Learning signal completed: {signal_id}")
            except Exception as e:
                logger.warning(f"Failed to complete learning signal: {e}")
        
        # ENHANCED: Store interaction in meta-learning if available
        try:
            loop = get_meta_loop()
            if loop:
                loop.record_interaction(user_id, {
                    'input': user_input,
                    'response': raw_reply,
                    'memory_used': bool(memory_recall and memory_recall != "Memory temporarily unavailable"),
                    'emotion_detected': bool(emotional_context and emotional_context != "Emotional analysis unavailable"),
                    'strategy_used': strategy.get('approach') if strategy else 'standard',
                    'signal_id': signal_id
                })
        except Exception as meta_e:
            logger.warning(f"Meta-learning recording failed: {meta_e}")
            # Don't let meta-learning errors break the main flow
        
        # ENHANCED: Return response with learning metadata for frontend
        return {
            'response': raw_reply,
            'signal_id': signal_id,
            'strategy_used': strategy.get('approach') if strategy else 'standard',
            'confidence': strategy.get('confidence') if strategy else 0.7,
            'memory_used': bool(memory_recall and memory_recall != "Memory temporarily unavailable"),
            'learning_enabled': learning_eng is not None
        }
        
    except Exception as e:
        # FIXED: Add comprehensive error logging
        error_details = traceback.format_exc()
        logger.error(f"Error in orchestrate_response: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        
        # Return graceful fallback with dynamic name
        return {
            'response': "I'm here with you, but something went wrong on my side. You're not alone — let's try again in a moment.",
            'signal_id': None,
            'strategy_used': 'fallback',
            'confidence': 0.5,
            'memory_used': False,
            'learning_enabled': False
        }

def process_user_feedback(signal_id: str, feedback_type: str, feedback_details: str = None, firestore_client=None):
    """
    Process explicit user feedback on a response
    NEW: Allows users to teach Cael what works and what doesn't
    """
    learning_eng = get_learning_engine(firestore_client)
    if not learning_eng or not signal_id:
        return False
    
    try:
        success = learning_eng.capture_explicit_feedback(
            signal_id=signal_id,
            feedback_type=feedback_type,
            feedback_details=feedback_details
        )
        
        if success:
            logger.info(f"Captured user feedback: {feedback_type} for {signal_id}")
        
        return success
        
    except Exception as e:
        logger.error(f"Failed to process user feedback: {e}")
        return False

def capture_user_reply_signal(signal_id: str, reply_message: str, time_since_response: float, firestore_client=None):
    """
    Capture user's reply to calculate resonance and learning signals
    NEW: Measures how well Cael's responses are landing
    """
    learning_eng = get_learning_engine(firestore_client)
    if not learning_eng or not signal_id:
        return None
    
    try:
        # Simple emotional analysis of reply (would be enhanced with actual parser)
        emotional_analysis_after = {
            'primary_emotion': 'neutral',
            'intensity': 0.5
        }
        
        # Try to use real emotion parser if available
        try:
            from utils.emotion_parser import parse_emotional_tone
            reply_emotion = parse_emotional_tone(reply_message)
            emotional_analysis_after['primary_emotion'] = reply_emotion.split(':')[0] if ':' in reply_emotion else 'neutral'
        except:
            pass
        
        resonance_score = learning_eng.capture_user_reply(
            signal_id=signal_id,
            reply_message=reply_message,
            emotional_analysis_after=emotional_analysis_after,
            time_since_response=time_since_response
        )
        
        if resonance_score:
            logger.debug(f"Captured reply signal: {resonance_score:.2f} resonance for {signal_id}")
        
        return resonance_score
        
    except Exception as e:
        logger.error(f"Failed to capture user reply signal: {e}")
        return None

def get_debug_prompt(user_input, user_id, firestore_client=None, ai_name="Cael"):
    """
    Return the full prompt for debugging purposes
    ENHANCED: Shows adaptive strategy in debug output
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
        
        # ENHANCED: Get adaptive strategy for debug
        learning_eng = get_learning_engine(firestore_client)
        strategy = None
        if learning_eng:
            try:
                strategy = learning_eng.get_adaptive_strategy(user_id, {
                    'emotional_state': emotional_context.split(':')[0] if ':' in emotional_context else 'neutral',
                    'memory_available': bool(memory_recall and "not available" not in memory_recall)
                })
            except Exception as e:
                logger.error(f"Debug strategy retrieval failed: {e}")
        
        # Return adaptive or standard prompt
        if strategy:
            prompt = build_adaptive_poa_prompt(user_input, memory_recall, emotional_context, ai_name, strategy)
            return f"=== ADAPTIVE PROMPT (Strategy: {strategy.get('approach', 'unknown')}) ===\n\n{prompt}"
        else:
            prompt = build_poa_prompt(user_input, memory_recall, emotional_context, ai_name)
            return f"=== STANDARD PROMPT ===\n\n{prompt}"
        
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

def check_orchestrator_health():
    """
    Check the health of orchestrator components
    ENHANCED: Includes learning system health
    """
    health_status = {
        "openai_client": bool(client),
        "api_key_configured": bool(os.getenv("OPENAI_API_KEY")),
        "memory_engine_available": False,
        "emotion_parser_available": False,
        "meta_learning_available": META_LEARNING_AVAILABLE,
        "realtime_learning_available": learning_engine is not None
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
    
    # Check learning engine health
    if learning_engine:
        try:
            health_status["learning_engine_status"] = "active"
        except Exception as e:
            health_status["learning_engine_status"] = f"error: {e}"
    
    return health_status

# Export the new learning-enhanced functions
__all__ = [
    'orchestrate_response',
    'get_debug_prompt', 
    'simple_response_fallback',
    'check_orchestrator_health',
    'process_user_feedback',
    'capture_user_reply_signal',
    'build_adaptive_poa_prompt'
]
