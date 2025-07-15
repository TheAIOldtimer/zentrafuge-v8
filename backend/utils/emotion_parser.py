"""
Zentrafuge v8 Emotion Parser
Detects emotional tone and underlying states for Cael's responses
"""

import re
import logging
from typing import Dict, List, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class EmotionalSignature:
    """Represents detected emotional state"""
    primary_tone: str
    intensity: float  # 0.0 to 1.0
    underlying_states: List[str]
    masked_emotions: List[str]  # emotions hidden behind surface tone
    energy_level: str  # "low", "moderate", "high"
    regulation_state: str  # "regulated", "dysregulated", "recovering"

# Emotional lexicons for pattern matching
TONE_INDICATORS = {
    "distressed": ["overwhelmed", "breaking", "can't handle", "falling apart", "drowning"],
    "weary": ["tired", "exhausted", "drained", "burnt out", "empty", "heavy"],
    "anxious": ["worried", "scared", "nervous", "panicking", "afraid", "stressed"],
    "frustrated": ["angry", "irritated", "fed up", "annoyed", "stuck", "blocked"],
    "sad": ["depressed", "down", "blue", "hopeless", "lonely", "isolated"],
    "reflective": ["thinking", "wondering", "processing", "contemplating", "considering"],
    "hopeful": ["better", "improving", "optimistic", "looking forward", "excited"],
    "grateful": ["thankful", "appreciative", "blessed", "fortunate", "grateful"],
    "calm": ["peaceful", "centered", "grounded", "stable", "balanced", "serene"],
    "curious": ["interested", "exploring", "learning", "discovering", "questioning"]
}

MASKING_PATTERNS = {
    "humor_masking_pain": [r"lol.*but", r"haha.*actually", r"funny.*not really"],
    "minimizing": [r"it's fine", r"no big deal", r"whatever", r"doesn't matter"],
    "deflecting": [r"anyway", r"moving on", r"enough about me", r"but how are you"]
}

ENERGY_INDICATORS = {
    "low": ["can't", "barely", "struggling", "heavy", "dragging", "no energy"],
    "moderate": ["okay", "managing", "getting by", "doing alright", "fine"],
    "high": ["excited", "energized", "motivated", "pumped", "ready", "charged"]
}

def parse_emotional_tone(user_input: str) -> str:
    """
    Main function called by orchestrator - returns emotional context string
    """
    try:
        signature = analyze_emotional_signature(user_input)
        return format_emotional_context(signature)
    except Exception as e:
        logger.error(f"Error in parse_emotional_tone: {e}")
        return "Emotional tone: Unable to analyze - responding with presence"

def analyze_emotional_signature(text: str) -> EmotionalSignature:
    """
    Deep analysis of emotional state from text
    """
    text_lower = text.lower()
    
    # Detect primary tone
    primary_tone = detect_primary_tone(text_lower)
    
    # Calculate intensity based on language patterns
    intensity = calculate_emotional_intensity(text_lower)
    
    # Detect underlying states
    underlying_states = detect_underlying_states(text_lower)
    
    # Check for masked emotions
    masked_emotions = detect_masked_emotions(text_lower)
    
    # Assess energy level
    energy_level = assess_energy_level(text_lower)
    
    # Determine regulation state
    regulation_state = assess_regulation_state(text_lower, intensity)
    
    return EmotionalSignature(
        primary_tone=primary_tone,
        intensity=intensity,
        underlying_states=underlying_states,
        masked_emotions=masked_emotions,
        energy_level=energy_level,
        regulation_state=regulation_state
    )

def detect_primary_tone(text: str) -> str:
    """
    Identify the dominant emotional tone
    """
    tone_scores = {}
    
    for tone, indicators in TONE_INDICATORS.items():
        score = 0
        for indicator in indicators:
            if indicator in text:
                score += 1
        tone_scores[tone] = score
    
    # Return highest scoring tone, or "neutral" if none detected
    if max(tone_scores.values()) == 0:
        return "neutral"
    
    return max(tone_scores, key=tone_scores.get)

def calculate_emotional_intensity(text: str) -> float:
    """
    Calculate emotional intensity based on language patterns
    """
    intensity_markers = {
        "high": ["extremely", "incredibly", "totally", "completely", "absolutely", "really really"],
        "caps": len(re.findall(r'[A-Z]{2,}', text)) > 0,
        "exclamation": text.count('!'),
        "repetition": len(re.findall(r'(.)\1{2,}', text)) > 0,  # repeated characters
        "swearing": any(word in text for word in ["damn", "shit", "fuck", "hell"])
    }
    
    base_intensity = 0.3  # baseline
    
    # Add intensity based on markers
    if any(marker in text for marker in intensity_markers["high"]):
        base_intensity += 0.3
    if intensity_markers["caps"]:
        base_intensity += 0.2
    if intensity_markers["exclamation"] > 0:
        base_intensity += min(0.2, intensity_markers["exclamation"] * 0.1)
    if intensity_markers["repetition"]:
        base_intensity += 0.1
    if intensity_markers["swearing"]:
        base_intensity += 0.2
    
    return min(1.0, base_intensity)

def detect_underlying_states(text: str) -> List[str]:
    """
    Identify underlying emotional states that may not be the primary tone
    """
    states = []
    
    # Check for multiple emotional indicators
    for tone, indicators in TONE_INDICATORS.items():
        if any(indicator in text for indicator in indicators):
            states.append(tone)
    
    return states[:3]  # Limit to top 3 to avoid noise

def detect_masked_emotions(text: str) -> List[str]:
    """
    Detect when someone might be hiding emotions behind surface expressions
    """
    masked = []
    
    for pattern_type, patterns in MASKING_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                masked.append(pattern_type)
    
    return masked

def assess_energy_level(text: str) -> str:
    """
    Determine energy level from language patterns
    """
    energy_scores = {}
    
    for level, indicators in ENERGY_INDICATORS.items():
        score = sum(1 for indicator in indicators if indicator in text)
        energy_scores[level] = score
    
    if max(energy_scores.values()) == 0:
        return "moderate"
    
    return max(energy_scores, key=energy_scores.get)

def assess_regulation_state(text: str, intensity: float) -> str:
    """
    Determine emotional regulation state
    """
    dysregulation_indicators = [
        "can't think", "losing it", "falling apart", "out of control",
        "spiraling", "breaking down", "overwhelmed"
    ]
    
    recovery_indicators = [
        "getting better", "working on", "trying to", "learning to",
        "slowly", "step by step", "taking time"
    ]
    
    if any(indicator in text for indicator in dysregulation_indicators) or intensity > 0.8:
        return "dysregulated"
    elif any(indicator in text for indicator in recovery_indicators):
        return "recovering"
    else:
        return "regulated"

def format_emotional_context(signature: EmotionalSignature) -> str:
    """
    Format emotional signature into context string for Cael
    """
    context_parts = [
        f"Primary tone: {signature.primary_tone}",
        f"Intensity: {signature.intensity:.1f}/1.0",
        f"Energy: {signature.energy_level}",
        f"Regulation: {signature.regulation_state}"
    ]
    
    if signature.underlying_states:
        context_parts.append(f"Underlying: {', '.join(signature.underlying_states[:2])}")
    
    if signature.masked_emotions:
        context_parts.append(f"Possible masking: {', '.join(signature.masked_emotions)}")
    
    return " | ".join(context_parts)

# Utility function for debugging
def get_detailed_analysis(text: str) -> Dict:
    """
    Return detailed emotional analysis for debugging
    """
    signature = analyze_emotional_signature(text)
    return {
        "text": text,
        "signature": signature.__dict__,
        "formatted_context": format_emotional_context(signature),
        "raw_tone_scores": {tone: sum(1 for indicator in indicators if indicator in text.lower()) 
                          for tone, indicators in TONE_INDICATORS.items()}
    }
