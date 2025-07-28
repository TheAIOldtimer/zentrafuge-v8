# backend/utils/realtime_learning_engine.py
"""
Real-Time Learning Engine for Zentrafuge v8
Captures micro-signals and adapts Cael's responses in real-time
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from firebase_admin import firestore
import json

from .learning_data_structures import (
    InteractionSignal, WeeklyLearningReport, UserPreference, 
    EmotionalGrowthArc, ResonancePattern,
    create_interaction_signal, calculate_resonance_score, analyze_user_segment
)

logger = logging.getLogger(__name__)

class RealtimeLearningEngine:
    """
    Real-time learning engine that makes Cael smarter with every interaction
    """
    
    def __init__(self, firestore_client=None):
        """Initialize with optional Firestore client"""
        self.db = firestore_client
        self.learning_enabled = firestore_client is not None
        self.pending_signals = []  # For offline operation
        
        logger.info(f"RealtimeLearningEngine initialized (learning_enabled: {self.learning_enabled})")
    
    def capture_interaction_start(
        self,
        user_id: str,
        user_message: str,
        emotional_analysis: Dict[str, Any],
        memory_context: Dict[str, Any]
    ) -> str:
        """Capture the start of an interaction"""
        
        signal = create_interaction_signal(
            user_id=user_id,
            user_message=user_message,
            cael_response="",  # Will be set later
            emotional_analysis_before=emotional_analysis,
            memory_used=bool(memory_context.get('memory_recalled')),
            response_style="adaptive"  # Will be determined by strategy
        )
        
        # Store signal ID for completion later
        signal_id = signal.message_id
        
        if self.learning_enabled:
            try:
                self.db.collection('interaction_signals').document(signal_id).set(signal.to_dict())
                logger.debug(f"Captured interaction start: {signal_id}")
            except Exception as e:
                logger.error(f"Failed to store interaction signal: {e}")
                self.pending_signals.append(signal)
        
        return signal_id
    
    def complete_interaction(
        self,
        signal_id: str,
        cael_response: str,
        response_style: str,
        memory_type: Optional[str] = None
    ) -> bool:
        """Complete an interaction signal with Cael's response"""
        
        if not self.learning_enabled:
            return False
            
        try:
            signal_ref = self.db.collection('interaction_signals').document(signal_id)
            signal_ref.update({
                'cael_response': cael_response,
                'response_style': response_style,
                'memory_type': memory_type,
                'response_timestamp': firestore.SERVER_TIMESTAMP
            })
            
            logger.debug(f"Completed interaction: {signal_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to complete interaction signal: {e}")
            return False
    
    def capture_user_reply(
        self,
        signal_id: str,
        reply_message: str,
        emotional_analysis_after: Dict[str, Any],
        time_since_response: float
    ) -> Optional[float]:
        """Capture user's reply and calculate resonance score"""
        
        if not self.learning_enabled:
            return None
            
        try:
            # Analyze the follow-up depth (simple heuristic)
            followup_depth = self._analyze_message_depth(reply_message)
            
            # Calculate emotional shift
            emotional_shift = self._calculate_emotional_shift(signal_id, emotional_analysis_after)
            
            # Calculate resonance score
            resonance_score = calculate_resonance_score(
                time_to_reply=time_since_response,
                emotional_shift=emotional_shift,
                followup_depth=followup_depth
            )
            
            # Update the interaction signal
            signal_ref = self.db.collection('interaction_signals').document(signal_id)
            signal_ref.update({
                'time_to_reply': time_since_response,
                'emotional_tone_after': emotional_analysis_after.get('primary_emotion'),
                'intensity_after': emotional_analysis_after.get('intensity'),
                'followup_depth': followup_depth,
                'resonance_score': resonance_score,
                'reply_timestamp': firestore.SERVER_TIMESTAMP
            })
            
            logger.debug(f"Captured user reply for {signal_id}: resonance={resonance_score:.2f}")
            
            # Trigger real-time adaptation if score is very high or very low
            if resonance_score > 0.9 or resonance_score < 0.3:
                self._trigger_realtime_adaptation(signal_id, resonance_score)
            
            return resonance_score
            
        except Exception as e:
            logger.error(f"Failed to capture user reply: {e}")
            return None
    
    def capture_explicit_feedback(
        self,
        signal_id: str,
        feedback_type: str,  # "helpful", "not_quite", "perfect", "unhelpful"
        feedback_details: Optional[str] = None
    ) -> bool:
        """Capture explicit user feedback on a response"""
        
        if not self.learning_enabled:
            return False
            
        try:
            signal_ref = self.db.collection('interaction_signals').document(signal_id)
            
            # Update the signal with feedback
            update_data = {
                'user_feedback': feedback_type,
                'feedback_timestamp': firestore.SERVER_TIMESTAMP
            }
            
            if feedback_details:
                update_data['feedback_details'] = feedback_details
            
            signal_ref.update(update_data)
            
            # Recalculate resonance score with feedback
            signal_doc = signal_ref.get()
            if signal_doc.exists:
                signal_data = signal_doc.to_dict()
                new_resonance = calculate_resonance_score(
                    time_to_reply=signal_data.get('time_to_reply', 60),
                    emotional_shift=signal_data.get('emotional_shift', 0),
                    followup_depth=signal_data.get('followup_depth', 3),
                    user_feedback=feedback_type
                )
                signal_ref.update({'resonance_score': new_resonance})
            
            # Store as user preference if strong signal
            if feedback_type in ['perfect', 'unhelpful']:
                self._update_user_preferences(signal_id, feedback_type, feedback_details)
            
            logger.debug(f"Captured explicit feedback for {signal_id}: {feedback_type}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to capture explicit feedback: {e}")
            return False
    
    def get_adaptive_strategy(self, user_id: str, current_context: Dict[str, Any]) -> Dict[str, Any]:
        """Get adaptive strategy based on user's learning history"""
        
        if not self.learning_enabled:
            return {'strategy': 'default', 'confidence': 0.5}
            
        try:
            # Get recent interaction history
            recent_signals = self._get_recent_signals(user_id, limit=10)
            
            # Get user preferences
            preferences = self._get_user_preferences(user_id)
            
            # Determine user segment
            user_segment = analyze_user_segment(user_id, recent_signals)
            
            # Get best patterns for this segment
            best_patterns = self._get_resonance_patterns(user_segment, current_context)
            
            # Calculate adaptive strategy
            strategy = self._calculate_adaptive_strategy(
                recent_signals, preferences, best_patterns, current_context
            )
            
            logger.debug(f"Generated adaptive strategy for {user_id}: {strategy['approach']}")
            return strategy
            
        except Exception as e:
            logger.error(f"Failed to get adaptive strategy: {e}")
            return {'strategy': 'default', 'confidence': 0.5}
    
    def generate_weekly_report(self, user_id: str) -> Optional[WeeklyLearningReport]:
        """Generate weekly learning report for a user"""
        
        if not self.learning_enabled:
            return None
            
        try:
            week_start = datetime.now() - timedelta(days=7)
            
            # Get week's interactions
            week_signals = self._get_signals_since(user_id, week_start)
            
            if not week_signals:
                return None
            
            # Calculate metrics
            avg_resonance = sum(s.resonance_score or 0.5 for s in week_signals) / len(week_signals)
            
            # Find what worked best
            best_memory_type = self._find_best_performing(week_signals, 'memory_type')
            best_response_style = self._find_best_performing(week_signals, 'response_style')
            
            # Calculate trends
            mood_trend = self._calculate_mood_trend(week_signals)
            engagement_trend = self._calculate_engagement_trend(week_signals)
            
            # Generate recommendations
            suggestions = self._generate_adaptations(week_signals, avg_resonance)
            
            report = WeeklyLearningReport(
                user_id=user_id,
                week_start=week_start,
                total_interactions=len(week_signals),
                avg_resonance_score=avg_resonance,
                mood_improvement_trend=mood_trend,
                engagement_trend=engagement_trend,
                best_memory_type=best_memory_type,
                best_response_style=best_response_style,
                optimal_message_length=self._calculate_optimal_length(week_signals),
                emotional_stability_score=self._calculate_stability_score(week_signals),
                vulnerability_depth_trend=self._calculate_depth_trend(week_signals),
                insight_frequency=self._calculate_insight_frequency(week_signals),
                suggested_adaptations=suggestions
            )
            
            # Store the report
            self.db.collection('weekly_reports').add(report.to_dict())
            
            logger.info(f"Generated weekly report for {user_id}: {avg_resonance:.2f} avg resonance")
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate weekly report: {e}")
            return None
    
    # Private helper methods
    
    def _analyze_message_depth(self, message: str) -> int:
        """Analyze the emotional depth of a message (1-5 scale)"""
        if not message:
            return 1
            
        # Simple depth indicators
        depth_indicators = {
            'shallow': ['ok', 'fine', 'good', 'thanks', 'yes', 'no'],
            'medium': ['feel', 'think', 'maybe', 'sometimes', 'usually'],
            'deep': ['realize', 'understand', 'remember', 'afraid', 'hope'],
            'very_deep': ['vulnerable', 'scared', 'ashamed', 'grateful', 'healing'],
            'profound': ['transform', 'breakthrough', 'forgive', 'accept', 'love']
        }
        
        message_lower = message.lower()
        depth_score = 1
        
        for level, indicators in depth_indicators.items():
            if any(indicator in message_lower for indicator in indicators):
                if level == 'medium':
                    depth_score = max(depth_score, 2)
                elif level == 'deep':
                    depth_score = max(depth_score, 3)
                elif level == 'very_deep':
                    depth_score = max(depth_score, 4)
                elif level == 'profound':
                    depth_score = 5
        
        # Factor in message length (longer often = deeper)
        if len(message) > 200:
            depth_score = min(5, depth_score + 1)
        
        return depth_score
    
    def _calculate_emotional_shift(self, signal_id: str, emotional_analysis_after: Dict[str, Any]) -> float:
        """Calculate emotional shift from before to after (-1 to 1)"""
        try:
            signal_doc = self.db.collection('interaction_signals').document(signal_id).get()
            if not signal_doc.exists:
                return 0.0
                
            signal_data = signal_doc.to_dict()
            intensity_before = signal_data.get('intensity_before', 0.5)
            intensity_after = emotional_analysis_after.get('intensity', 0.5)
            
            # Positive emotions: higher intensity = better
            # Negative emotions: lower intensity = better
            emotion_after = emotional_analysis_after.get('primary_emotion', 'neutral')
            
            positive_emotions = ['joy', 'peace', 'gratitude', 'hope', 'love', 'calm']
            negative_emotions = ['anxiety', 'sadness', 'anger', 'fear', 'shame', 'overwhelmed']
            
            if emotion_after in positive_emotions:
                return intensity_after - intensity_before  # Higher positive intensity = better
            elif emotion_after in negative_emotions:
                return intensity_before - intensity_after  # Lower negative intensity = better
            else:
                return 0.0  # Neutral
                
        except Exception as e:
            logger.error(f"Failed to calculate emotional shift: {e}")
            return 0.0
    
    def _trigger_realtime_adaptation(self, signal_id: str, resonance_score: float):
        """Trigger real-time adaptation based on resonance score"""
        try:
            if resonance_score > 0.9:
                # Very high resonance - reinforce this pattern
                logger.info(f"High resonance detected ({resonance_score:.2f}) - reinforcing pattern")
                # TODO: Implement pattern reinforcement
                
            elif resonance_score < 0.3:
                # Very low resonance - avoid this pattern
                logger.warning(f"Low resonance detected ({resonance_score:.2f}) - flagging pattern")
                # TODO: Implement pattern avoidance
                
        except Exception as e:
            logger.error(f"Failed to trigger realtime adaptation: {e}")
    
    def _get_recent_signals(self, user_id: str, limit: int = 10) -> List[InteractionSignal]:
        """Get recent interaction signals for a user"""
        # Implementation would query Firestore and convert to InteractionSignal objects
        # For now, return empty list
        return []
    
    def _get_user_preferences(self, user_id: str) -> List[UserPreference]:
        """Get stored user preferences"""
        # Implementation would query Firestore and convert to UserPreference objects
        return []
    
    def _calculate_adaptive_strategy(
        self, 
        recent_signals: List[InteractionSignal],
        preferences: List[UserPreference],
        patterns: List[ResonancePattern],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate the best adaptive strategy for current context"""
        
        # Default strategy
        strategy = {
            'approach': 'gentle_grounding',
            'memory_use': 'moderate',
            'response_style': 'warm_validation',
            'message_length': 'medium',
            'confidence': 0.7
        }
        
        # Analyze recent performance
        if recent_signals:
            avg_recent_resonance = sum(s.resonance_score or 0.5 for s in recent_signals) / len(recent_signals)
            
            if avg_recent_resonance > 0.8:
                # Recent interactions going well - maintain approach
                strategy['confidence'] = 0.9
            elif avg_recent_resonance < 0.4:
                # Recent interactions struggling - try different approach
                strategy['approach'] = 'gentle_exploration'
                strategy['confidence'] = 0.6
        
        # Apply user preferences
        for pref in preferences:
            if pref.preference_type == 'tone' and pref.confidence > 0.8:
                strategy['response_style'] = pref.preference_value
                strategy['confidence'] = min(1.0, strategy['confidence'] + 0.1)
        
        return strategy
    
    # Additional helper methods would be implemented here...
    # _find_best_performing, _calculate_mood_trend, etc.
