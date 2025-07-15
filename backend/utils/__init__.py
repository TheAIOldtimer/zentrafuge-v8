"""
Zentrafuge v8 Utils Module
Emotional AI assistant modules for Cael
"""

# Version info
__version__ = "8.0.0"
__author__ = "Zentrafuge Team"

# Core module imports
from .orchestrator import orchestrate_response, get_debug_prompt, poa_metrics
from .emotion_parser import parse_emotional_tone, analyze_emotional_signature
from .memory_engine import retrieve_relevant_memories, store_conversation, get_user_profile

# Module availability flags
MODULES_AVAILABLE = {
    "orchestrator": True,
    "emotion_parser": True,
    "memory_engine": True,
    "nlp_analyzer": False,  # Not yet implemented
    "eastern_brain": False,  # Not yet implemented
    "crypto_handler": False  # Not yet implemented
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
