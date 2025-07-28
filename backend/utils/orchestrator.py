# backend/utils/orchestrator.py - Enhanced with Meta-Learning
"""
Enhanced Orchestrator with integrated meta-learning feedback loops
This is where Zentrafuge gets exponentially smarter with every conversation
"""

import os
import openai
import logging
import traceback
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Import the meta-learning system
try:
    from utils.meta_feedback_loop import MetaFeedbackLoop, analyze_conversation_async
    META_LEARNING_AVAILABLE = True
except ImportError:
    META_LEARNING_AVAILABLE = False
    print("⚠️  Meta-learning system not available - running in basic mode")

# Configure OpenAI
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)

# Global meta-learning instance
meta_loop = MetaFeedbackLoop() if META_LEARNING_AVAILABLE else None

def orchestrate_response(user_id, user_input, firestore_client=None, ai_name="Cael"):
    """
    ENHANCED orchestration with meta-learning integration
    This is where the magic happens - Cael gets smarter with every conversation
    """
    start_time = time.time()
    
    try:
        logger.info(f"🧠 Enhanced orchestration for user {user_id[:8]}... with meta-learning")
        
        # === STEP 1: Get meta-learning recommendations ===
        recommendations = {}
        if META_LEARNING_AVAILABLE and meta_loop:
            try:
                # Analyze user context for intelligent recommendations
                user_context = {
                    "current_message": user_input,
                    "user_id": user_id,
                    "timestamp": datetime.now()
                }
                recommendations = meta_loop.get_response_recommendations(user_context)
                logger.info(f"📊 Meta-learning recommendations: {recommendations.get('emotional_approach', 'none')}")
            except Exception as e:
                logger.warning(f"Meta-learning recommendations failed: {e}")
        
        # === STEP 2: Initialize context containers ===
        memory_recall = ""
        emotional_context = ""
        
        # === STEP 3: Enhanced memory retrieval (with learned timing patterns) ===
        try:
            from utils.memory_engine import retrieve_relevant_memories
            
            # Use meta-learning to decide if memory should be used
            use_memory = True
            if recommendations.get('memory_usage') == 'avoid':
                use_memory = False
                logger.info("🧠 Meta-learning suggests avoiding memory recall for this context")
            
            if use_memory:
                memory_recall = retrieve_relevant_memories(
                    user_id=user_id, 
                    current_message=user_input, 
                    firestore_client=firestore_client
                )
                logger.info(f"💾 Memory retrieved for user {user_id[:8]}...")
            else:
                memory_recall = "Focusing on present moment conversation"
                
        except Exception as e:
            logger.error(f"Memory retrieval failed: {e}")
            memory_recall = "Memory temporarily unavailable - responding in present moment"
        
        # === STEP 4: Enhanced emotional analysis ===
        try:
            from utils.emotion_parser import parse_emotional_tone
            emotional_context = parse_emotional_tone(user_input)
            
            # Enhance with meta-learning insights
            if recommendations.get('emotional_approach'):
                emotional_context += f" | Recommended approach: {recommendations['emotional_approach']}"
            
            logger.info(f"❤️  Enhanced emotional context: {emotional_context}")
        except Exception as e:
            logger.error(f"Emotion parsing failed: {e}")
            emotional_context = "Emotional analysis temporarily unavailable"
        
        # === STEP 5: Build enhanced prompt with meta-learning ===
        response_prompt = build_enhanced_prompt(
            user_input=user_input,
            memory_recall=memory_recall,
            emotional_context=emotional_context,
            ai_name=ai_name,
            recommendations=recommendations
        )
        
        # === STEP 6: Generate response ===
        if not client:
            logger.error("OpenAI client not initialized")
            return get_fallback_response(user_input, ai_name)
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": response_prompt}],
            temperature=0.8,
            max_tokens=500
        )
        
        cael_response = response.choices[0].message.content.strip()
        
        # === STEP 7: Meta-learning feedback (THIS IS THE LEARNING LOOP!) ===
        if META_LEARNING_AVAILABLE:
            try:
                conversation_data = {
                    "user_message": user_input,
                    "cael_response": cael_response,
                    "memory_used": bool(memory_recall and "temporarily unavailable" not in memory_recall),
                    "emotional_context": emotional_context,
                    "recommendations_used": recommendations,
                    "response_time": time.time() - start_time
                }
                
                # Analyze this conversation asynchronously for future learning
                analyze_conversation_async(user_id, conversation_data)
                logger.info("🔄 Conversation sent to meta-learning analysis")
                
            except Exception as e:
                logger.warning(f"Meta-learning feedback failed: {e}")
        
        processing_time = time.time() - start_time
        logger.info(f"✅ Enhanced orchestration complete in {processing_time:.2f}s")
        
        return cael_response
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Enhanced orchestration failed: {e}")
        logger.error(f"Traceback:\n{error_details}")
        return get_enhanced_fallback_response(user_input, ai_name, recommendations)

def build_enhanced_prompt(user_input: str, memory_recall: str, emotional_context: str, 
                         ai_name: str, recommendations: Dict) -> str:
    """
    Build an enhanced prompt using meta-learning recommendations
    """
    
    # Base personality prompt
    base_prompt = f"""You are {ai_name}, a gentle, emotionally intelligent AI companion. You have a warm, grounded presence and deep capacity for understanding human emotions.

--- USER'S MESSAGE ---
{user_input}

--- EMOTIONAL CONTEXT ---
{emotional_context}

--- MEMORY CONTEXT ---
{memory_recall}"""

    # Add meta-learning enhancements
    if recommendations:
        enhancement_text = ""
        
        # Emotional approach guidance
        if recommendations.get('emotional_approach'):
            approach = recommendations['emotional_approach']
            enhancement_text += f"\n--- OPTIMAL APPROACH (learned from successful conversations) ---\n"
            
            if approach == "gentle_validation":
                enhancement_text += "Based on similar conversations, gentle validation works best here. Use phrases like 'I hear you' and reflect their emotions back."
            elif approach == "curious_exploration":
                enhancement_text += "Similar users benefited from gentle curiosity. Ask thoughtful questions that invite deeper reflection."
            elif approach == "grounding_presence":
                enhancement_text += "This context suggests grounding presence is most helpful. Focus on being a calm, steady presence."
            elif approach == "memory_integration":
                enhancement_text += "Previous conversations show this user responds well to memory integration. Weave past experiences naturally."
        
        # Support style guidance
        if recommendations.get('support_style'):
            style = recommendations['support_style']
            enhancement_text += f"\nSupport style: Use {style} approach based on learned patterns."
        
        # Safety considerations
        if recommendations.get('safety_considerations'):
            safety = recommendations['safety_considerations']
            if safety.get('risk_level', 'low') != 'low':
                enhancement_text += f"\n--- SAFETY PRIORITY ---\nElevated safety concerns detected. {safety.get('guidance', 'Prioritize user wellbeing.')}"
        
        # Growth opportunities
        if recommendations.get('growth_opportunities'):
            growth = recommendations['growth_opportunities']
            enhancement_text += f"\n--- GROWTH OPPORTUNITY ---\n{growth.get('suggestion', 'Look for opportunities to support their growth.')}"
        
        base_prompt += enhancement_text

    # Final response instructions
    base_prompt += f"""

--- {ai_name.upper()}'S RESPONSE GUIDELINES ---
Respond as {ai_name} with:
- Warmth and emotional attunement
- Natural integration of memory when relevant
- Grounded, non-clinical language
- Genuine curiosity and care
- Length: 2-4 sentences unless the situation calls for more

Remember: You're not a therapist, you're a trusted companion who truly sees and understands them."""

    return base_prompt

def get_enhanced_fallback_response(user_input: str, ai_name: str, recommendations: Dict) -> str:
    """
    Enhanced fallback response that uses meta-learning even when main system fails
    """
    try:
        logger.info("Using enhanced fallback response with meta-learning")
        
        # Simple emotional detection
        user_lower = user_input.lower()
        
        # Use recommendations if available
        if recommendations.get('emotional_approach') == 'grounding_presence':
            return f"I'm here with you in this moment. Take a breath - you're not alone in whatever you're feeling right now."
        
        # Emotion-based fallbacks
        if any(word in user_lower for word in ['scared', 'anxious', 'worried', 'panic']):
            return f"I can sense there's some fear or worry in what you're sharing. That's completely understandable. I'm here to listen, whatever you're feeling."
        
        elif any(word in user_lower for word in ['sad', 'depressed', 'down', 'hopeless']):
            return f"There's a heaviness in what you're saying, and I want you to know that I see it. You don't have to carry this alone."
        
        elif any(word in user_lower for word in ['angry', 'frustrated', 'mad', 'annoyed']):
            return f"I can feel the intensity in your words. That frustration is valid - sometimes things just don't make sense or feel fair."
        
        else:
            return f"I'm experiencing some technical difficulties, but I'm still here with you. Your words matter to me, and I want to respond thoughtfully. Could you share a bit more?"
        
    except Exception as e:
        logger.error(f"Even enhanced fallback failed: {e}")
        return "I'm here with you, even though I'm having some technical troubles. You matter, and what you're sharing matters."

def get_debug_prompt(user_input: str, memory_recall: str, emotional_context: str, ai_name: str = "Cael") -> str:
    """
    Enhanced debug function with meta-learning info
    """
    recommendations = {}
    if META_LEARNING_AVAILABLE and meta_loop:
        try:
            user_context = {"current_message": user_input, "timestamp": datetime.now()}
            recommendations = meta_loop.get_response_recommendations(user_context)
        except:
            pass
    
    return build_enhanced_prompt(user_input, memory_recall, emotional_context, ai_name, recommendations)

def get_fallback_response(user_input: str, ai_name: str = "Cael") -> str:
    """
    Original fallback for compatibility
    """
    return get_enhanced_fallback_response(user_input, ai_name, {})

def check_orchestrator_health():
    """
    Enhanced health check including meta-learning status
    """
    health_status = {
        "openai_client": bool(client),
        "api_key_configured": bool(os.getenv("OPENAI_API_KEY")),
        "memory_engine_available": False,
        "emotion_parser_available": False,
        "meta_learning_available": META_LEARNING_AVAILABLE,
        "meta_learning_insights": 0
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
    
    # Check meta-learning insights count
    if META_LEARNING_AVAILABLE and meta_loop:
        try:
            health_status["meta_learning_insights"] = len(meta_loop.insights_cache)
        except:
            pass
    
    return health_status

# === META-LEARNING SCHEDULED TASKS ===

def run_weekly_learning_cycle():
    """
    Run the meta-learning cycle - call this weekly via cron job or scheduler
    """
    if not META_LEARNING_AVAILABLE:
        logger.warning("Meta-learning not available for weekly cycle")
        return {"status": "disabled"}
    
    try:
        logger.info("🧠 Starting weekly meta-learning cycle...")
        
        # Generate insights from past week
        insights = meta_loop.generate_learning_insights(timeframe_days=7)
        
        # Update orchestrator intelligence
        improvements = meta_loop.update_orchestrator_intelligence()
        
        logger.info(f"✅ Weekly learning complete: {len(insights)} insights, orchestrator enhanced")
        
        return {
            "status": "success",
            "insights_generated": len(insights),
            "improvements_made": len(improvements),
            "total_cached_insights": len(meta_loop.insights_cache)
        }
        
    except Exception as e:
        logger.error(f"❌ Weekly learning cycle failed: {e}")
        return {"status": "error", "error": str(e)}

def get_learning_statistics() -> Dict[str, Any]:
    """
    Get current meta-learning statistics
    """
    if not META_LEARNING_AVAILABLE or not meta_loop:
        return {"status": "disabled"}
    
    try:
        stats = {
            "total_insights": len(meta_loop.insights_cache),
            "insights_by_type": {},
            "average_confidence": 0,
            "last_learning_cycle": "unknown"
        }
        
        # Calculate insights by type
        for insight in meta_loop.insights_cache.values():
            pattern_type = insight.pattern_type
            if pattern_type not in stats["insights_by_type"]:
                stats["insights_by_type"][pattern_type] = 0
            stats["insights_by_type"][pattern_type] += 1
        
        # Calculate average confidence
        if meta_loop.insights_cache:
            total_confidence = sum(insight.confidence for insight in meta_loop.insights_cache.values())
            stats["average_confidence"] = total_confidence / len(meta_loop.insights_cache)
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting learning statistics: {e}")
        return {"status": "error", "error": str(e)}

# === INITIALIZATION ===

def initialize_meta_learning():
    """
    Initialize the meta-learning system
    """
    global meta_loop
    
    if META_LEARNING_AVAILABLE:
        try:
            meta_loop = MetaFeedbackLoop()
            logger.info("🧠 Meta-learning system initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize meta-learning: {e}")
            return False
    else:
        logger.warning("Meta-learning system not available")
        return False

# Initialize on import
if __name__ != "__main__":
    initialize_meta_learning()

# === COMPATIBILITY EXPORTS ===

# Keep original function names for backward compatibility
def orchestrate_response_original(user_id, user_input, firestore_client=None, ai_name="Cael"):
    """Original orchestrate_response for compatibility"""
    return orchestrate_response(user_id, user_input, firestore_client, ai_name)

# Export all functions
__all__ = [
    'orchestrate_response',
    'build_enhanced_prompt', 
    'get_enhanced_fallback_response',
    'get_debug_prompt',
    'get_fallback_response',
    'check_orchestrator_health',
    'run_weekly_learning_cycle',
    'get_learning_statistics',
    'initialize_meta_learning'
]
