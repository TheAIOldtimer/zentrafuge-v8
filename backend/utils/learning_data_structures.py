# backend/utils/learning_data_structures.py
"""
Learning Loop Data Structures for Zentrafuge v8
Captures micro-interactions for emotional intelligence evolution
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

@dataclass
class InteractionSignal:
    """Captures micro-signals from each user interaction"""
    user_id: str
    message_id: str
    timestamp: datetime
    
    # Input analysis
    user_message: str
    emotional_tone_before: str
    intensity_before: float
    
    # Cael's response
    cael_response: str
    memory_recalled: bool
    memory_type: Optional[str]  # "mood-based", "identity-based", "trauma-linked"
    response_style: str  # "poetic", "clinical", "grounded", "expansive"
    
    # Post-response signals
    time_to_reply: Optional[float]  # seconds until user replied
    emotional_tone_after: Optional[str]
    intensity_after: Optional[float]
    followup_depth: Optional[int]  # 1-5 scale of how deep their next message was
    
    # Learning metrics
    resonance_score: Optional[float]  # 0-1, how well it landed
    user_feedback: Optional[str]  # "helpful", "not_quite", "perfect"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data

@dataclass
class WeeklyLearningReport:
    """Weekly aggregation of what's working"""
    user_id: str
    week_start: datetime
    total_interactions: int
    
    # Performance metrics
    avg_resonance_score: float
    mood_improvement_trend: float  # -1 to 1
    engagement_trend: float  # based on reply times and depth
    
    # What worked best this week
    best_memory_type: str
    best_response_style: str
    optimal_message_length: int
    
    # User growth indicators
    emotional_stability_score: float
    vulnerability_depth_trend: float
    insight_frequency: float
    
    # Recommendations for next week
    suggested_adaptations: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['week_start'] = self.week_start.isoformat()
        return data

@dataclass
class UserPreference:
    """Explicit user preferences for Cael's behavior"""
    user_id: str
    preference_type: str  # "tone", "memory_use", "response_length", "intervention_timing"
    preference_value: str
    confidence: float  # 0-1, how certain we are about this preference
    learned_from: str  # "explicit_feedback", "behavior_pattern", "A_B_test"
    created_at: datetime
    last_reinforced: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['created_at'] = self.created_at.isoformat()
        data['last_reinforced'] = self.last_reinforced.isoformat()
        return data

@dataclass
class EmotionalGrowthArc:
    """Tracks user's emotional journey over time"""
    user_id: str
    
    # Baseline metrics (first 2 weeks)
    baseline_mood_variance: float
    baseline_vulnerability_level: float
    baseline_insight_frequency: float
    
    # Current metrics (rolling 2-week window)
    current_mood_variance: float
    current_vulnerability_level: float
    current_insight_frequency: float
    
    # Growth indicators
    stability_improvement: float  # reduction in mood variance
    depth_growth: float  # increase in vulnerability comfort
    wisdom_accumulation: float  # increase in self-insight
    
    # Milestones achieved
    milestones: List[str]  # ["first_deep_share", "mood_stabilizing", "self_coaching"]
    
    # Trajectory prediction
    projected_growth_areas: List[str]
    estimated_healing_velocity: float  # rate of positive change
    
    last_updated: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['last_updated'] = self.last_updated.isoformat()
        return data

@dataclass
class ResonancePattern:
    """What emotional strategies work for different user segments"""
    pattern_id: str
    user_segment: str  # "veterans_burnout", "neurodivergent_anxiety", "new_parents_overwhelm"
    
    # Conditions
    emotional_state: str
    time_of_day: Optional[str]
    conversation_length: Optional[int]
    
    # Strategy that worked
    memory_approach: str  # "gentle_recall", "direct_reference", "pattern_reflection"
    emotional_tone: str  # "warm_validation", "grounded_presence", "curious_exploration"
    response_structure: str  # "reflect_then_guide", "validate_then_expand", "ground_then_uplift"
    
    # Results
    avg_resonance_score: float
    sample_size: int
    confidence_interval: float
    
    # Meta-learning
    discovered_date: datetime
    times_applied: int
    success_rate: float
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['discovered_date'] = self.discovered_date.isoformat()
        return data

# Learning Loop Storage Collections
LEARNING_COLLECTIONS = {
    'interaction_signals': InteractionSignal,
    'weekly_reports': WeeklyLearningReport,
    'user_preferences': UserPreference,
    'growth_arcs': EmotionalGrowthArc,
    'resonance_patterns': ResonancePattern
}

def create_interaction_signal(
    user_id: str,
    user_message: str,
    cael_response: str,
    emotional_analysis_before: Dict[str, Any],
    memory_used: bool = False,
    response_style: str = "grounded"
) -> InteractionSignal:
    """Factory function to create interaction signals"""
    return InteractionSignal(
        user_id=user_id,
        message_id=f"{user_id}_{datetime.now().timestamp()}",
        timestamp=datetime.now(),
        user_message=user_message,
        emotional_tone_before=emotional_analysis_before.get('primary_emotion', 'neutral'),
        intensity_before=emotional_analysis_before.get('intensity', 0.5),
        cael_response=cael_response,
        memory_recalled=memory_used,
        memory_type=None,  # Will be set by memory engine
        response_style=response_style,
        time_to_reply=None,  # Set when user replies
        emotional_tone_after=None,  # Set when user replies
        intensity_after=None,
        followup_depth=None,
        resonance_score=None,  # Calculated later
        user_feedback=None
    )

def calculate_resonance_score(
    time_to_reply: float,
    emotional_shift: float,
    followup_depth: int,
    user_feedback: Optional[str] = None
) -> float:
    """Calculate how well Cael's response resonated (0-1 scale)"""
    
    # Base score from timing (quick reply = good engagement)
    timing_score = min(1.0, max(0.2, (300 - time_to_reply) / 300))  # 5 min optimal
    
    # Emotional improvement score
    emotion_score = max(0.0, min(1.0, (emotional_shift + 1) / 2))  # -1 to 1 mapped to 0-1
    
    # Depth of follow-up (deeper = better)
    depth_score = followup_depth / 5.0
    
    # User feedback override
    feedback_multiplier = 1.0
    if user_feedback == "perfect":
        feedback_multiplier = 1.2
    elif user_feedback == "helpful":
        feedback_multiplier = 1.1
    elif user_feedback == "not_quite":
        feedback_multiplier = 0.7
    elif user_feedback == "unhelpful":
        feedback_multiplier = 0.3
    
    # Weighted average
    resonance = (timing_score * 0.3 + emotion_score * 0.4 + depth_score * 0.3) * feedback_multiplier
    
    return min(1.0, max(0.0, resonance))

def analyze_user_segment(user_id: str, interaction_history: List[InteractionSignal]) -> str:
    """Determine user segment for pattern matching"""
    if not interaction_history:
        return "new_user"
    
    # Analyze patterns in emotional themes, timing, etc.
    emotional_themes = [signal.emotional_tone_before for signal in interaction_history[-10:]]
    
    # Simple segmentation logic (can be enhanced)
    if 'overwhelmed' in emotional_themes and 'exhausted' in emotional_themes:
        return "burnout_pattern"
    elif 'anxious' in emotional_themes and 'scattered' in emotional_themes:
        return "anxiety_pattern"
    elif 'sad' in emotional_themes and 'lonely' in emotional_themes:
        return "depression_pattern"
    elif 'frustrated' in emotional_themes and 'stuck' in emotional_themes:
        return "transition_pattern"
    else:
        return "general_support"
