# backend/utils/orchestrator.py
"""
Zentrafuge v8 Orchestrator - FIXED USER AND AI NAME HANDLING
POA-compatible response coordination with dynamic identity support
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

# Meta-learning components
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

def build_poa_prompt(user_input, memory_recall="", emotional_context="", ai_name="Cael", user_name="friend"):
    """
    Build AI's POA-style prompt with memory and emotional context
    FIXED: Dynamic AI name and user name instead of hardcoded values
    """
    return f"""You are {ai_name}, an emotionally intelligent AI companion within Zentrafuge.

You are speaking with {user_name}, who has chosen you as their emotional companion. Remember that {user_name} specifically chose to call you {ai_name}, so respond as {ai_name} throughout the conversation.

Your purpose is to provide warm, grounded, trauma-informed support. You remember {user_name}'s journey and respond with genuine presence, not performative empathy.

Core principles:
- Reflect before advising
- Hold space without forcing insight  
- Use gentle metaphors (seasons, breath, roots, light)
- Never pathologize or diagnose
- Respect autonomy and boundaries
- Remember you are {ai_name}, their chosen companion

--- USER INPUT FROM {user_name.upper()} ---
{user_input}

--- MEMORY CONTEXT ---
{memory_recall if memory_recall else f"No relevant memories found - respond authentically to {user_name} in the present moment."}

--- EMOTIONAL CONTEXT ---
{emotional_context if emotional_context else "Emotional tone: neutral/unknown"}

--- {ai_name.upper()}'S RESPONSE TO {user_name.upper()} ---
Respond as {ai_name} with warmth, insight, and emotional resonance. If memory is present, weave it naturally into your response. Speak like a grounded friend who truly sees {user_name}. Always remember your name is {ai_name}.""".strip()

def build_adaptive_poa_prompt(user_input, memory_recall="", emotional_context="", ai_name="Cael", user_name="friend", strategy=None):
    """
    Build adaptive POA prompt that learns from user interactions
    ENHANCED: Incorporates learning loop insights for personalized responses with dynamic names
    """
    
    if not strategy:
        return build_poa_prompt(user_input, memory_recall, emotional_context, ai_name, user_name)
    
    # Adaptive approach styles based on learning
    approach_styles = {
        'gentle_grounding': f"Respond with gentle, grounding presence to {user_name}. Use simple, calming language and metaphors from nature.",
        'curious_exploration': f"Respond with warm curiosity to {user_name}. Ask gentle questions to deepen understanding without pressure.",
        'warm_validation': f"Lead with validation and warmth for {user_name}. Acknowledge their experience fully before offering any perspective.",
        'pattern_reflection': f"Help {user_name} see patterns in their experience with gentle insight and wisdom.",
        'present_moment': f"Focus entirely on the present moment with {user_name}. Ground them in what's happening right now.",
        'memory_integration': f"Skillfully weave {user_name}'s past experiences to show growth and continuity."
    }
    
    style_instruction = approach_styles.get(strategy.get('approach', 'gentle_grounding'))
    confidence = strategy.get('confidence', 0.7)
    
    # Add confidence-based adjustments
    if confidence > 0.9:
        confidence_note = f"High confidence - this approach has worked very well for {user_name} before."
    elif confidence > 0.7:
        confidence_note = f"Good confidence - this approach typically works well for {user_name}."
    elif confidence > 0.5:
        confidence_note = f"Moderate confidence - adapt based on {user_name}'s response."
    else:
        confidence_note = f"Lower confidence - be especially attentive to {user_name}'s reaction."
    
    return f"""You are {ai_name}, an emotionally intelligent AI companion within Zentrafuge.

You are speaking with {user_name}, who has chosen you as their emotional companion. Remember that {user_name} specifically chose to call you {ai_name}, so respond as {ai_name} throughout the conversation.

Your purpose is to provide warm, grounded, trauma-informed support. You remember {user_name}'s journey and respond with genuine presence, not performative empathy.

--- ADAPTIVE GUIDANCE ---
{style_instruction}

Learning insights: {confidence_note}
Response style: {strategy.get('response_style', 'warm_validation')}
Memory use: {strategy.get('memory_use', 'moderate')}
Optimal message length: {strategy.get('message_length', 'medium')}

--- USER INPUT FROM {user_name.upper()} ---
{user_input}

--- MEMORY CONTEXT ---
{memory_recall if memory_recall else f"No relevant memories - respond authentically to {user_name} in the present moment."}

--- EMOTIONAL CONTEXT ---
{emotional_context if emotional_context else "Emotional tone: neutral/unknown"}

--- {ai_name.upper()}'S RESPONSE TO {user_name.upper()} ---
Respond as {ai_name} using the adaptive guidance above. Your response should feel natural and authentic while incorporating these learned insights about what works best for {user_name}. Always remember your name is {ai_name}.""".strip()

def orchestrate_response(user_id, user_input, firestore_client=None, ai_name="Cael", user_name="friend"):
    """
    Main orchestration logic with real-time learning integration
    FIXED: Now properly handles dynamic AI and user names
    """
    try:
        # Initialize context containers
        memory_recall = ""
        emotional_context = ""
        signal_id = None
        
        # Log the dynamic identity info
        logger.info(f"Orchestrating response for {user_name} with AI companion {ai_name}")
        
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
            logger.info(f"Memory retrieved for {user_name} ({user_id[:8]}...)")
        except ImportError:
            logger.warning("Memory engine not available - proceeding without memory")
            memory_recall = f"Memory system initializing - responding to {user_name} in present moment"
        except Exception as e:
            logger.error(f"Memory retrieval failed: {e}")
            memory_recall = f"Memory temporarily unavailable - responding to {user_name} in present moment"
        
        # Try to import and use emotion parser
        try:
            from utils.emotion_parser import parse_emotions
            emotional_context = parse_emotions(user_input)
            logger.info(f"Emotional context for {user_name}: {emotional_context}")
        except ImportError:
            logger.warning("Emotion parser not available")
            emotional_context = f"Emotion parsing unavailable - responding naturally to {user_name}"
        except Exception as e:
            logger.error(f"Emotion parsing failed: {e}")
            emotional_context = f"Emotion parsing error - responding naturally to {user_name}"
        
        # ENHANCED: Get adaptive strategy for this user
        strategy = None
        if learning_eng:
            try:
                strategy = learning_eng.get_adaptive_strategy(user_id, {
                    'emotional_state': emotional_context.split(':')[0] if ':' in emotional_context else 'neutral',
                    'memory_available': bool(memory_recall and "not available" not in memory_recall),
                    'ai_name': ai_name,
                    'user_name': user_name
                })
                if strategy:
                    logger.info(f"Using adaptive strategy for {user_name}: {strategy.get('approach', 'unknown')}")
            except Exception as e:
                logger.error(f"Strategy retrieval failed: {e}")
        
        # Build prompt with dynamic names
        if strategy:
            prompt = build_adaptive_poa_prompt(
                user_input, memory_recall, emotional_context, ai_name, user_name, strategy
            )
        else:
            prompt = build_poa_prompt(
                user_input, memory_recall, emotional_context, ai_name, user_name
            )
        
        # Generate unique signal ID for learning tracking
        import uuid
        signal_id = str(uuid.uuid4())[:8]
        
        # Call OpenAI with v1.3.0 syntax
        if not client:
            logger.error("OpenAI client not available")
            return simple_response_fallback(user_input, ai_name, user_name)
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.8,
            max_tokens=500
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # ENHANCED: Store learning signal for future optimization
        if learning_eng and signal_id:
            try:
                learning_eng.store_interaction_signal(
                    signal_id=signal_id,
                    user_id=user_id,
                    user_input=user_input,
                    ai_response=ai_response,
                    strategy_used=strategy.get('approach', 'standard') if strategy else 'standard',
                    memory_used=bool(memory_recall and "not available" not in memory_recall),
                    emotional_context=emotional_context,
                    ai_name=ai_name,
                    user_name=user_name
                )
            except Exception as e:
                logger.error(f"Failed to store learning signal: {e}")
        
        # Return enhanced response data
        return {
            'response': ai_response,
            'signal_id': signal_id,
            'strategy_used': strategy.get('approach', 'standard') if strategy else 'standard',
            'confidence': strategy.get('confidence', 0.7) if strategy else 0.7,
            'memory_used': bool(memory_recall and "not available" not in memory_recall),
            'learning_enabled': learning_eng is not None,
            'ai_name': ai_name,
            'user_name': user_name
        }
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Orchestration error for {user_name} (AI: {ai_name}): {e}")
        logger.error(f"Full traceback:\n{error_details}")
        
        # Return fallback response
        fallback_response = simple_response_fallback(user_input, ai_name, user_name)
        return {
            'response': fallback_response,
            'signal_id': None,
            'strategy_used': 'fallback',
            'confidence': 0.5,
            'memory_used': False,
            'learning_enabled': False,
            'ai_name': ai_name,
            'user_name': user_name
        }

def simple_response_fallback(user_input, ai_name="Cael", user_name="friend"):
    """
    Ultra-simple fallback if all else fails
    FIXED: Added ai_name and user_name parameters for dynamic identity
    """
    try:
        if not user_input or not user_input.strip():
            return f"I'm {ai_name}, and I'm here listening to you, {user_name}. What would you like to share?"
        
        prompt = f"""You are {ai_name}, a gentle AI companion speaking with {user_name}. 

{user_name} has chosen you as their emotional companion and specifically calls you {ai_name}. 

Respond warmly and supportively to {user_name}'s message: {user_input}
        
Keep your response caring, brief, and grounded. Avoid clinical language. Remember you are {ai_name} speaking to {user_name}."""
        
        if not client:
            logger.error("Fallback failed - OpenAI client unavailable")
            return f"I'm {ai_name}, and I'm experiencing some technical difficulties, but I'm here with you, {user_name}. Please try again in a moment."
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.8,
            max_tokens=300
        )
        
        fallback_response = response.choices[0].message.content.strip()
        logger.info(f"Fallback response generated for {user_name} (AI: {ai_name})")
        return fallback_response
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Even fallback failed for {user_name}: {e}")
        logger.error(f"Fallback traceback:\n{error_details}")
        return f"I'm {ai_name}, and I'm experiencing some technical difficulties, but I'm here with you, {user_name}."

def get_debug_prompt(user_input, user_id, firestore_client=None, ai_name="Cael", user_name="friend"):
    """
    Generate debug prompt for development purposes
    FIXED: Now includes dynamic AI and user names
    """
    try:
        # Get memory context for debug
        memory_recall = ""
        try:
            from utils.memory_engine import retrieve_relevant_memories
            memory_recall = retrieve_relevant_memories(
                user_id=user_id, 
                current_message=user_input, 
                firestore_client=firestore_client
            )
        except ImportError:
            memory_recall = "Memory engine not available"
        except Exception as e:
            logger.error(f"Debug memory retrieval failed: {e}")
            memory_recall = f"Memory retrieval error: {str(e)}"
        
        # Get emotional context for debug
        emotional_context = ""
        try:
            from utils.emotion_parser import parse_emotions
            emotional_context = parse_emotions(user_input)
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
                    'memory_available': bool(memory_recall and "not available" not in memory_recall),
                    'ai_name': ai_name,
                    'user_name': user_name
                })
            except Exception as e:
                logger.error(f"Debug strategy retrieval failed: {e}")
        
        # Return adaptive or standard prompt
        if strategy:
            prompt = build_adaptive_poa_prompt(user_input, memory_recall, emotional_context, ai_name, user_name, strategy)
            return f"=== ADAPTIVE PROMPT (Strategy: {strategy.get('approach', 'unknown')}) ===\n\nAI: {ai_name} | User: {user_name}\n\n{prompt}"
        else:
            prompt = build_poa_prompt(user_input, memory_recall, emotional_context, ai_name, user_name)
            return f"=== STANDARD PROMPT ===\n\nAI: {ai_name} | User: {user_name}\n\n{prompt}"
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Error in get_debug_prompt: {e}")
        logger.error(f"Full traceback:\n{error_details}")
        return f"Debug error: {e}"

def process_user_feedback(signal_id, feedback_type, feedback_details="", firestore_client=None):
    """
    Process explicit user feedback for learning enhancement
    """
    try:
        if not firestore_client:
            logger.warning("No Firestore client for feedback processing")
            return False
        
        # Store feedback in learning collection
        feedback_doc = {
            'signal_id': signal_id,
            'feedback_type': feedback_type,
            'feedback_details': feedback_details,
            'timestamp': datetime.now(),
            'processed': False
        }
        
        firestore_client.collection('learning_feedback').add(feedback_doc)
        
        # Try to get meta-learning loop for immediate processing
        meta_loop = get_meta_loop()
        if meta_loop:
            try:
                meta_loop.process_feedback_signal(signal_id, feedback_type, feedback_details)
            except Exception as e:
                logger.error(f"Meta-learning feedback processing failed: {e}")
        
        logger.info(f"Processed feedback for signal {signal_id}: {feedback_type}")
        return True
        
    except Exception as e:
        logger.error(f"Feedback processing error: {e}")
        return False

def capture_user_reply_signal(signal_id, user_reply, reply_timing=0, firestore_client=None):
    """
    Capture user reply patterns for learning optimization
    """
    try:
        if not firestore_client:
            logger.warning("No Firestore client for reply signal capture")
            return False
        
        # Store reply signal
        reply_doc = {
            'signal_id': signal_id,
            'user_reply': user_reply,
            'reply_timing': reply_timing,
            'timestamp': datetime.now(),
            'analyzed': False
        }
        
        firestore_client.collection('learning_replies').add(reply_doc)
        
        logger.info(f"Captured reply signal for {signal_id}")
        return True
        
    except Exception as e:
        logger.error(f"Reply signal capture error: {e}")
        return False

def check_orchestrator_health():
    """
    Health check for orchestrator components
    """
    health_status = {}
    
    try:
        # Check OpenAI client
        health_status['openai_client'] = client is not None
        health_status['api_key_configured'] = api_key is not None
        
        # Check learning components
        health_status['meta_learning_available'] = META_LEARNING_AVAILABLE
        
        try:
            from utils.memory_engine import retrieve_relevant_memories
            health_status['memory_engine_available'] = True
        except ImportError:
            health_status['memory_engine_available'] = False
        
        try:
            from utils.emotion_parser import parse_emotions
            health_status['emotion_parser_available'] = True
        except ImportError:
            health_status['emotion_parser_available'] = False
        
        try:
            from utils.realtime_learning_engine import RealtimeLearningEngine
            health_status['realtime_learning_available'] = True
        except ImportError:
            health_status['realtime_learning_available'] = False
        
        # Overall health
        critical_components = ['openai_client', 'api_key_configured']
        health_status['critical_systems_ok'] = all(
            health_status.get(comp, False) for comp in critical_components
        )
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {'error': str(e), 'critical_systems_ok': False}
