# backend/utils/__init__.py
"""
Zentrafuge v8 Utils Module - COMPLETE WORKING VERSION WITH FIREBASE FIX
Emotional AI assistant modules for Cael
ONLY CHANGE: Removed meta_feedback_loop import that was causing Firebase error
"""

# Version info
__version__ = "8.0.0"
__author__ = "Zentrafuge Team"

# FIXED: Don't import orchestrator at module level if it has meta-learning dependencies
# Import these functions only when needed to avoid Firebase initialization issues
try:
    from .orchestrator import orchestrate_response, get_debug_prompt
    orchestrator_available = True
except ImportError as e:
    print(f"Warning: orchestrator not available: {e}")
    orchestrator_available = False

try:
    from .emotion_parser import parse_emotional_tone, analyze_emotional_signature
    emotion_parser_available = True
except ImportError as e:
    print(f"Warning: emotion_parser not available: {e}")
    emotion_parser_available = False

try:
    from .memory_engine import retrieve_relevant_memories, store_conversation, get_user_profile
    memory_engine_available = True
except ImportError as e:
    print(f"Warning: memory_engine not available: {e}")
    memory_engine_available = False

# Module availability flags
MODULES_AVAILABLE = {
    "orchestrator": orchestrator_available,
    "emotion_parser": emotion_parser_available,
    "memory_engine": memory_engine_available,
    "nlp_analyzer": False,  # Not yet implemented
    "eastern_brain": False,  # Not yet implemented
    "crypto_handler": False,  # Not yet implemented
    "meta_feedback_loop": False  # Available but not imported at startup to prevent Firebase errors
}

def get_module_status():
    """Return status of all utility modules"""
    return MODULES_AVAILABLE

def check_dependencies():
    """Check if all required dependencies are available"""
    required = ["openai", "firebase_admin"]
    missing = []
    
    for module in required:
        try:
            __import__(module)
        except ImportError:
            missing.append(module)
    
    return {
        "all_available": len(missing) == 0,
        "missing": missing,
        "modules": MODULES_AVAILABLE
    }

def get_orchestrator():
    """Get orchestrator functions with lazy loading"""
    try:
        from .orchestrator import orchestrate_response, get_debug_prompt
        return orchestrate_response, get_debug_prompt
    except ImportError as e:
        print(f"Error importing orchestrator: {e}")
        return None, None

def get_emotion_parser():
    """Get emotion parser functions with lazy loading"""
    try:
        from .emotion_parser import parse_emotional_tone, analyze_emotional_signature
        return parse_emotional_tone, analyze_emotional_signature
    except ImportError as e:
        print(f"Error importing emotion parser: {e}")
        return None, None

def get_memory_engine():
    """Get memory engine functions with lazy loading"""
    try:
        from .memory_engine import retrieve_relevant_memories, store_conversation, get_user_profile
        return retrieve_relevant_memories, store_conversation, get_user_profile
    except ImportError as e:
        print(f"Error importing memory engine: {e}")
        return None, None, None

def get_meta_feedback_loop():
    """Get meta feedback loop with lazy loading"""
    try:
        from .meta_feedback_loop import MetaFeedbackLoop
        return MetaFeedbackLoop
    except ImportError as e:
        print(f"Error importing meta feedback loop: {e}")
        return None

# Export available functions and classes
__all__ = [
    'get_module_status',
    'check_dependencies', 
    'get_orchestrator',
    'get_emotion_parser',
    'get_memory_engine',
    'get_meta_feedback_loop',
    'MODULES_AVAILABLE'
]

# Add functions to module if they imported successfully
if orchestrator_available:
    __all__.extend(['orchestrate_response', 'get_debug_prompt'])

if emotion_parser_available:
    __all__.extend(['parse_emotional_tone', 'analyze_emotional_signature'])

if memory_engine_available:
    __all__.extend(['retrieve_relevant_memories', 'store_conversation', 'get_user_profile'])
