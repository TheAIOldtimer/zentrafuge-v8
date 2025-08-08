# backend/utils/orchestrator.py
"""
Zentrafuge v8 Orchestrator - FIXED USER AND AI NAME HANDLING
POA-compatible response coordination with dynamic identity support
"""

import os
import logging
import traceback
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)

# --- OpenAI client (v1.3.0) ---
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

# --- ZP-1 hooks ---
from utils.move_logger import log_move, save_move_to_firestore
from utils.move_detector import detect_move
ZP_LOGGING_ENABLED = os.getenv("ZP_LOGGING_ENABLED", "true").lower() == "true"

# --- Optional encryption layer ---
def _encrypt_and_store_interaction(
    firestore_client,
    user_id: str,
    user_input: str,
    ai_response: str,
    ai_name: str,
    user_name: str,
    emotional_context: Optional[str] = None,
):
    """
    Save encrypted transcript if crypto handler is present. No-ops safely otherwise.
    """
    if not firestore_client:
        return
    try:
        from utils.crypto_handler import encrypt_text  # your existing function
    except Exception:
        encrypt_text = None

    try:
        doc = {
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "ai_name": ai_name,
            "user_name": user_name,
            "emotional_context": emotional_context,
        }
        if encrypt_text:
            doc["user_input_enc"] = encrypt_text(user_input or "")
            doc["ai_response_enc"] = encrypt_text(ai_response or "")
        else:
            # fall back to plaintext only if encryption is unavailable
            doc["user_input"] = user_input
            doc["ai_response"] = ai_response

        firestore_client.collection("conversations").add(doc)
    except Exception as e:
        logger.warning(f"Encrypted save failed (non-fatal): {e}")

# --- Optional: meta-learning components (lazy) ---
META_LEARNING_AVAILABLE = True
meta_loop = None
learning_engine = None

def get_meta_loop():
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
    if not strategy:
        return build_poa_prompt(user_input, memory_recall, emotional_context, ai_name, user_name)

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
    Main orchestration logic with real-time learning integration.
    """
    try:
        memory_recall = ""
        emotional_context = ""
        signal_id = None

        logger.info(f"Orchestrating response for {user_name} with AI companion {ai_name}")

        learning_eng = get_learning_engine(firestore_client)

        # Memory recall (optional module)
        try:
            from utils.memory_engine import retrieve_relevant_memories
            memory_recall = retrieve_relevant_memories(
                user_id=user_id,
                current_message=user_input,
                firestore_client=firestore_client
            )
        except ImportError:
            logger.warning("Memory engine not available - proceeding without memory")
        except Exception as e:
            logger.error(f"Memory retrieval failed: {e}")

        # Emotion parsing (optional module)
        try:
            from utils.emotion_parser import parse_emotions
            emotional_context = parse_emotions(user_input)
        except ImportError:
            logger.warning("Emotion parser not available")
        except Exception as e:
            logger.error(f"Emotion parsing failed: {e}")

        # Adaptive strategy (optional)
        strategy = None
        if learning_eng:
            try:
                strategy = learning_eng.get_adaptive_strategy(user_id, {
                    'emotional_state': emotional_context.split(':')[0] if ':' in emotional_context else 'neutral',
                    'memory_available': bool(memory_recall),
                    'ai_name': ai_name,
                    'user_name': user_name
                })
            except Exception as e:
                logger.error(f"Strategy retrieval failed: {e}")

        # Build prompt
        prompt = build_adaptive_poa_prompt(user_input, memory_recall, emotional_context, ai_name, user_name, strategy) \
                 if strategy else \
                 build_poa_prompt(user_input, memory_recall, emotional_context, ai_name, user_name)

        signal_id = str(uuid.uuid4())[:8]

        if not client:
            logger.error("OpenAI client not available")
            return simple_response_fallback(user_input, ai_name, user_name)

        # --- OpenAI call (clean message roles) ---
        completion = client.chat.completions.create(
            model=OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_input},
            ],
            temperature=0.8,
            max_tokens=500
        )
        ai_response = completion.choices[0].message.content.strip()

        # --- Save encrypted interaction (if crypto available) ---
        try:
            _encrypt_and_store_interaction(
                firestore_client=firestore_client,
                user_id=user_id,
                user_input=user_input,
                ai_response=ai_response,
                ai_name=ai_name,
                user_name=user_name,
                emotional_context=emotional_context
            )
        except Exception as e:
            logger.warning(f"Interaction save failed: {e}")

        # --- ZP-1: detect & log conversational move ---
        try:
            move_name = detect_move(ai_response)
            move_log = log_move(
                user_id=user_id,
                move_name=move_name,
                context={
                    "source_text": user_input,
                    "ai_output": ai_response,
                    "emotion": emotional_context,
                },
                trust_effect=+1,
                clarity_effect=+1,
                resonance_effect=+2,
                uncertainty_change=0,
            )
            if ZP_LOGGING_ENABLED:
                save_move_to_firestore(move_log)
        except Exception as e:
            logger.warning(f"ZP logging error: {e}")

        # Store learning signal (optional)
        if learning_eng and signal_id:
            try:
                learning_eng.store_interaction_signal(
                    signal_id=signal_id,
                    user_id=user_id,
                    user_input=user_input,
                    ai_response=ai_response,
                    strategy_used=strategy.get('approach', 'standard') if strategy else 'standard',
                    memory_used=bool(memory_recall),
                    emotional_context=emotional_context,
                    ai_name=ai_name,
                    user_name=user_name
                )
            except Exception as e:
                logger.error(f"Failed to store learning signal: {e}")

        return {
            'response': ai_response,
            'signal_id': signal_id,
            'strategy_used': strategy.get('approach', 'standard') if strategy else 'standard',
            'confidence': strategy.get('confidence', 0.7) if strategy else 0.7,
            'memory_used': bool(memory_recall),
            'learning_enabled': learning_eng is not None,
            'ai_name': ai_name,
            'user_name': user_name
        }

    except Exception as e:
        logger.error(f"Orchestration error for {user_name} (AI: {ai_name}): {e}\n{traceback.format_exc()}")
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
    """
    try:
        prompt = f"""You are {ai_name}, a gentle AI companion speaking with {user_name}.
Respond warmly and supportively to {user_name}'s message: {user_input}
Keep your response caring, brief, and grounded."""
        if not client:
            return f"I'm {ai_name}, and I'm here with you, {user_name}. Please try again in a moment."
        completion = client.chat.completions.create(
            model=OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_input or ""},
            ],
            temperature=0.8,
            max_tokens=300
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Fallback error: {e}\n{traceback.format_exc()}")
        return f"I'm {ai_name}, and I'm experiencing some technical difficulties, but I'm here with you, {user_name}."

def get_debug_prompt(user_input, user_id, firestore_client=None, ai_name="Cael", user_name="friend"):
    """
    Generate debug prompt for development purposes
    """
    try:
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
            memory_recall = f"Memory retrieval error: {str(e)}"

        emotional_context = ""
        try:
            from utils.emotion_parser import parse_emotions
            emotional_context = parse_emotions(user_input)
        except ImportError:
            emotional_context = "Emotion parser not available"
        except Exception as e:
            emotional_context = f"Emotion parsing error: {str(e)}"

        learning_eng = get_learning_engine(firestore_client)
        strategy = None
        if learning_eng:
            try:
                strategy = learning_eng.get_adaptive_strategy(user_id, {
                    'emotional_state': emotional_context.split(':')[0] if ':' in emotional_context else 'neutral',
                    'memory_available': bool(memory_recall),
                    'ai_name': ai_name,
                    'user_name': user_name
                })
            except Exception:
                pass

        prompt = build_adaptive_poa_prompt(user_input, memory_recall, emotional_context, ai_name, user_name, strategy) \
                 if strategy else \
                 build_poa_prompt(user_input, memory_recall, emotional_context, ai_name, user_name)

        return f"=== {'ADAPTIVE' if strategy else 'STANDARD'} PROMPT ===\n\nAI: {ai_name} | User: {user_name}\n\n{prompt}"

    except Exception as e:
        logger.error(f"Error in get_debug_prompt: {e}\n{traceback.format_exc()}")
        return f"Debug error: {e}"

def process_user_feedback(signal_id, feedback_type, feedback_details="", firestore_client=None):
    try:
        if not firestore_client:
            logger.warning("No Firestore client for feedback processing")
            return False
        feedback_doc = {
            'signal_id': signal_id,
            'feedback_type': feedback_type,
            'feedback_details': feedback_details,
            'timestamp': datetime.now(),
            'processed': False
        }
        firestore_client.collection('learning_feedback').add(feedback_doc)
        meta = get_meta_loop()
        if meta:
            try:
                meta.process_feedback_signal(signal_id, feedback_type, feedback_details)
            except Exception:
                pass
        return True
    except Exception as e:
        logger.error(f"Feedback processing error: {e}")
        return False

def capture_user_reply_signal(signal_id, user_reply, reply_timing=0, firestore_client=None):
    try:
        if not firestore_client:
            logger.warning("No Firestore client for reply signal capture")
            return False
        reply_doc = {
            'signal_id': signal_id,
            'user_reply': user_reply,
            'reply_timing': reply_timing,
            'timestamp': datetime.now(),
            'analyzed': False
        }
        firestore_client.collection('learning_replies').add(reply_doc)
        return True
    except Exception as e:
        logger.error(f"Reply signal capture error: {e}")
        return False

def check_orchestrator_health():
    health_status = {}
    try:
        health_status['openai_client'] = client is not None
        health_status['api_key_configured'] = api_key is not None

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

        health_status['critical_systems_ok'] = bool(health_status['openai_client'] and health_status['api_key_configured'])
        return health_status

    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {'error': str(e), 'critical_systems_ok': False}
