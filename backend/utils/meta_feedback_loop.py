# backend/utils/meta_feedback_loop.py - Zentrafuge Learning Loop Engine
"""
Meta-Learning System for Zentrafuge
Analyzes conversation patterns and continuously improves Cael's emotional intelligence

This is the core competitive advantage: learning loops that make Cael smarter with every interaction
"""

import logging
import json
import time
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import statistics
import firebase_admin
from firebase_admin import firestore

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ConversationOutcome:
    """Measures the success of a conversation interaction"""
    user_id: str
    timestamp: datetime
    user_message: str
    cael_response: str
    user_emotional_state: str
    response_strategy: str  # e.g., "validation", "reflection", "gentle_challenge"
    
    # Outcome metrics
    conversation_continued: bool  # Did user respond?
    response_depth_score: float  # 0-1: How vulnerable/deep was next message?
    time_to_next_message: Optional[float]  # Minutes until next user message
    session_length_after: int  # How many more messages in this session?
    user_mood_improvement: Optional[float]  # -1 to 1: mood change
    memory_relevance_rating: Optional[float]  # 0-1: How relevant were recalled memories?
    
    # Meta-analysis
    themes_discussed: List[str]
    trauma_indicators: List[str]
    growth_indicators: List[str]
    safety_concerns: List[str]

@dataclass
class LearningInsight:
    """A learned pattern about what works in conversations"""
    pattern_type: str  # "emotional_response", "memory_timing", "support_style"
    context: Dict[str, Any]  # When this pattern applies
    strategy: str  # What strategy works
    confidence: float  # 0-1: How confident we are in this insight
    sample_size: int  # How many conversations this is based on
    last_updated: datetime
    performance_score: float  # How well this strategy performs

class MetaFeedbackLoop:
    """
    The core learning engine that makes Zentrafuge exponentially smarter
    """
    
    def __init__(self, firestore_client=None):
        self.db = firestore_client or firestore.client()
        self.insights_cache = {}
        self.load_existing_insights()
    
    def analyze_conversation_outcome(self, user_id: str, conversation_data: Dict) -> ConversationOutcome:
        """
        Analyze the outcome of a specific conversation exchange
        """
        try:
            # Extract conversation details
            user_message = conversation_data.get('user_message', '')
            cael_response = conversation_data.get('cael_response', '')
            timestamp = datetime.now()
            
            # Get emotional context
            emotional_state = self._extract_emotional_state(user_message)
            response_strategy = self._identify_response_strategy(cael_response)
            
            # Analyze conversation flow
            next_message_data = self._get_next_user_message(user_id, timestamp)
            
            outcome = ConversationOutcome(
                user_id=user_id,
                timestamp=timestamp,
                user_message=user_message,
                cael_response=cael_response,
                user_emotional_state=emotional_state,
                response_strategy=response_strategy,
                conversation_continued=bool(next_message_data),
                response_depth_score=self._calculate_depth_score(next_message_data),
                time_to_next_message=self._calculate_response_time(timestamp, next_message_data),
                session_length_after=self._calculate_session_length(user_id, timestamp),
                user_mood_improvement=self._calculate_mood_change(user_id, timestamp),
                memory_relevance_rating=conversation_data.get('memory_relevance', None),
                themes_discussed=self._extract_themes(user_message + ' ' + cael_response),
                trauma_indicators=self._detect_trauma_indicators(user_message),
                growth_indicators=self._detect_growth_indicators(user_message),
                safety_concerns=self._detect_safety_concerns(user_message)
            )
            
            # Store for analysis
            self._store_conversation_outcome(outcome)
            
            return outcome
            
        except Exception as e:
            logger.error(f"Error analyzing conversation outcome: {e}")
            return None
    
    def generate_learning_insights(self, timeframe_days: int = 7) -> List[LearningInsight]:
        """
        Analyze recent conversations to generate actionable insights
        """
        try:
            # Get recent conversation outcomes
            cutoff_date = datetime.now() - timedelta(days=timeframe_days)
            outcomes = self._get_conversation_outcomes_since(cutoff_date)
            
            insights = []
            
            # Pattern 1: What emotional response strategies work best?
            emotional_insights = self._analyze_emotional_response_patterns(outcomes)
            insights.extend(emotional_insights)
            
            # Pattern 2: When should memories be recalled?
            memory_insights = self._analyze_memory_timing_patterns(outcomes)
            insights.extend(memory_insights)
            
            # Pattern 3: What support styles work for different trauma types?
            trauma_insights = self._analyze_trauma_response_patterns(outcomes)
            insights.extend(trauma_insights)
            
            # Pattern 4: How to recognize and nurture growth moments?
            growth_insights = self._analyze_growth_facilitation_patterns(outcomes)
            insights.extend(growth_insights)
            
            # Pattern 5: Safety intervention timing
            safety_insights = self._analyze_safety_intervention_patterns(outcomes)
            insights.extend(safety_insights)
            
            # Store and cache insights
            for insight in insights:
                self._store_learning_insight(insight)
                self.insights_cache[f"{insight.pattern_type}:{hash(str(insight.context))}"] = insight
            
            logger.info(f"Generated {len(insights)} learning insights from {len(outcomes)} conversations")
            return insights
            
        except Exception as e:
            logger.error(f"Error generating learning insights: {e}")
            return []
    
    def get_response_recommendations(self, user_context: Dict) -> Dict[str, Any]:
        """
        Get real-time recommendations for how Cael should respond
        Based on learned patterns
        """
        try:
            recommendations = {
                "emotional_approach": self._recommend_emotional_approach(user_context),
                "memory_usage": self._recommend_memory_strategy(user_context),
                "support_style": self._recommend_support_style(user_context),
                "safety_considerations": self._check_safety_recommendations(user_context),
                "growth_opportunities": self._identify_growth_opportunities(user_context)
            }
            
            # Add confidence scores
            recommendations["overall_confidence"] = self._calculate_recommendation_confidence(recommendations)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting response recommendations: {e}")
            return {"error": "Could not generate recommendations"}
    
    def update_orchestrator_intelligence(self) -> Dict[str, Any]:
        """
        Feed learning insights back into the orchestrator system
        This is where the learning loop closes!
        """
        try:
            # Get high-confidence insights
            high_confidence_insights = [
                insight for insight in self.insights_cache.values()
                if insight.confidence > 0.7 and insight.sample_size >= 10
            ]
            
            # Generate orchestrator improvements
            improvements = {
                "emotional_response_rules": self._generate_emotional_rules(high_confidence_insights),
                "memory_timing_rules": self._generate_memory_rules(high_confidence_insights),
                "support_style_mappings": self._generate_support_mappings(high_confidence_insights),
                "safety_triggers": self._generate_safety_triggers(high_confidence_insights),
                "growth_facilitation_rules": self._generate_growth_rules(high_confidence_insights)
            }
            
            # Store for orchestrator to use
            self._update_orchestrator_config(improvements)
            
            logger.info(f"Updated orchestrator with {len(high_confidence_insights)} learning insights")
            return improvements
            
        except Exception as e:
            logger.error(f"Error updating orchestrator intelligence: {e}")
            return {}
    
    # === PATTERN ANALYSIS METHODS ===
    
    def _analyze_emotional_response_patterns(self, outcomes: List[ConversationOutcome]) -> List[LearningInsight]:
        """Analyze which emotional response strategies work best"""
        insights = []
        
        # Group by emotional state and response strategy
        pattern_groups = defaultdict(list)
        for outcome in outcomes:
            key = (outcome.user_emotional_state, outcome.response_strategy)
            pattern_groups[key].append(outcome)
        
        for (emotion, strategy), group in pattern_groups.items():
            if len(group) >= 5:  # Need minimum sample size
                # Calculate success metrics
                continuation_rate = sum(1 for o in group if o.conversation_continued) / len(group)
                avg_depth = statistics.mean([o.response_depth_score for o in group if o.response_depth_score])
                avg_mood_improvement = statistics.mean([o.user_mood_improvement for o in group if o.user_mood_improvement])
                
                performance_score = (continuation_rate * 0.4 + avg_depth * 0.4 + (avg_mood_improvement + 1) / 2 * 0.2)
                
                if performance_score > 0.6:  # Only learn from successful patterns
                    insight = LearningInsight(
                        pattern_type="emotional_response",
                        context={"user_emotion": emotion, "themes": self._extract_common_themes(group)},
                        strategy=strategy,
                        confidence=min(performance_score, len(group) / 20),  # Confidence based on performance and sample size
                        sample_size=len(group),
                        last_updated=datetime.now(),
                        performance_score=performance_score
                    )
                    insights.append(insight)
        
        return insights
    
    def _analyze_memory_timing_patterns(self, outcomes: List[ConversationOutcome]) -> List[LearningInsight]:
        """Learn when memory recall helps vs. hinders conversation flow"""
        insights = []
        
        # Separate conversations with and without memory usage
        with_memory = [o for o in outcomes if o.memory_relevance_rating is not None]
        without_memory = [o for o in outcomes if o.memory_relevance_rating is None]
        
        if len(with_memory) >= 10 and len(without_memory) >= 10:
            # Compare outcomes
            memory_success = statistics.mean([o.response_depth_score for o in with_memory if o.response_depth_score])
            no_memory_success = statistics.mean([o.response_depth_score for o in without_memory if o.response_depth_score])
            
            # Analyze when memory helps most
            high_relevance_memories = [o for o in with_memory if o.memory_relevance_rating > 0.7]
            if high_relevance_memories:
                common_contexts = self._find_common_contexts(high_relevance_memories)
                
                insight = LearningInsight(
                    pattern_type="memory_timing",
                    context=common_contexts,
                    strategy="recall_relevant_memories",
                    confidence=len(high_relevance_memories) / 50,
                    sample_size=len(high_relevance_memories),
                    last_updated=datetime.now(),
                    performance_score=memory_success
                )
                insights.append(insight)
        
        return insights
    
    def _analyze_trauma_response_patterns(self, outcomes: List[ConversationOutcome]) -> List[LearningInsight]:
        """Learn optimal responses for different trauma indicators"""
        insights = []
        
        trauma_conversations = [o for o in outcomes if o.trauma_indicators]
        
        # Group by trauma type and response strategy
        for outcome in trauma_conversations:
            for trauma_type in outcome.trauma_indicators:
                # Find other conversations with same trauma type
                similar_conversations = [
                    o for o in trauma_conversations 
                    if trauma_type in o.trauma_indicators and o.response_strategy == outcome.response_strategy
                ]
                
                if len(similar_conversations) >= 5:
                    avg_success = statistics.mean([
                        (o.response_depth_score or 0) * 0.5 + (o.conversation_continued and 1 or 0) * 0.5
                        for o in similar_conversations
                    ])
                    
                    if avg_success > 0.6:
                        insight = LearningInsight(
                            pattern_type="trauma_response",
                            context={"trauma_type": trauma_type},
                            strategy=outcome.response_strategy,
                            confidence=min(avg_success, len(similar_conversations) / 20),
                            sample_size=len(similar_conversations),
                            last_updated=datetime.now(),
                            performance_score=avg_success
                        )
                        insights.append(insight)
        
        return insights
    
    def _analyze_growth_facilitation_patterns(self, outcomes: List[ConversationOutcome]) -> List[LearningInsight]:
        """Learn how to recognize and nurture growth moments"""
        insights = []
        
        growth_conversations = [o for o in outcomes if o.growth_indicators]
        
        # Find patterns that lead to continued growth discussions
        growth_continuations = [
            o for o in growth_conversations 
            if o.session_length_after > 3  # Continued deep conversation
        ]
        
        if len(growth_continuations) >= 10:
            common_strategies = Counter([o.response_strategy for o in growth_continuations])
            most_effective = common_strategies.most_common(3)
            
            for strategy, count in most_effective:
                if count >= 5:
                    success_rate = count / len([o for o in growth_conversations if o.response_strategy == strategy])
                    
                    insight = LearningInsight(
                        pattern_type="growth_facilitation",
                        context={"growth_stage": "emergence"},
                        strategy=strategy,
                        confidence=min(success_rate, count / 20),
                        sample_size=count,
                        last_updated=datetime.now(),
                        performance_score=success_rate
                    )
                    insights.append(insight)
        
        return insights
    
    def _analyze_safety_intervention_patterns(self, outcomes: List[ConversationOutcome]) -> List[LearningInsight]:
        """Learn optimal timing and approach for safety interventions"""
        insights = []
        
        safety_conversations = [o for o in outcomes if o.safety_concerns]
        
        for outcome in safety_conversations:
            # Analyze if intervention was helpful (user continued conversation safely)
            if outcome.conversation_continued and not outcome.safety_concerns:
                insight = LearningInsight(
                    pattern_type="safety_intervention",
                    context={"safety_concern_types": outcome.safety_concerns},
                    strategy=outcome.response_strategy,
                    confidence=0.9,  # High confidence for safety patterns
                    sample_size=1,
                    last_updated=datetime.now(),
                    performance_score=1.0
                )
                insights.append(insight)
        
        return insights
    
    # === HELPER METHODS ===
    
    def _extract_emotional_state(self, message: str) -> str:
        """Extract primary emotional state from user message"""
        # This would integrate with your emotion_parser
        try:
            from utils.emotion_parser import parse_emotional_tone
            return parse_emotional_tone(message)
        except ImportError:
            # Fallback simple emotion detection
            emotion_keywords = {
                "anxious": ["anxious", "worried", "stressed", "nervous"],
                "sad": ["sad", "depressed", "down", "hopeless"],
                "angry": ["angry", "frustrated", "annoyed", "mad"],
                "happy": ["happy", "good", "great", "excited"],
                "confused": ["confused", "lost", "unsure", "don't know"]
            }
            
            message_lower = message.lower()
            for emotion, keywords in emotion_keywords.items():
                if any(keyword in message_lower for keyword in keywords):
                    return emotion
            return "neutral"
    
    def _identify_response_strategy(self, response: str) -> str:
        """Identify the strategy used in Cael's response"""
        response_lower = response.lower()
        
        if any(phrase in response_lower for phrase in ["i hear", "i understand", "that sounds", "i can see"]):
            return "validation"
        elif any(phrase in response_lower for phrase in ["what do you think", "how does that feel", "what comes up"]):
            return "reflection"
        elif any(phrase in response_lower for phrase in ["remember when", "you mentioned", "last time"]):
            return "memory_connection"
        elif any(phrase in response_lower for phrase in ["what if", "have you considered", "another way"]):
            return "gentle_challenge"
        elif any(phrase in response_lower for phrase in ["take a breath", "ground yourself", "safe space"]):
            return "grounding"
        else:
            return "supportive_presence"
    
    def _calculate_depth_score(self, next_message: Optional[Dict]) -> float:
        """Calculate how vulnerable/deep the user's next message was"""
        if not next_message:
            return 0.0
        
        message = next_message.get('message', '').lower()
        
        # Vulnerability indicators
        vulnerability_indicators = [
            "i feel", "i'm scared", "i never told", "i worry", "deep down",
            "honestly", "i think", "i realize", "i notice", "part of me"
        ]
        
        depth_score = sum(1 for indicator in vulnerability_indicators if indicator in message)
        return min(depth_score / 5, 1.0)  # Normalize to 0-1
    
    def _get_next_user_message(self, user_id: str, timestamp: datetime) -> Optional[Dict]:
        """Get the user's next message after this timestamp"""
        try:
            # Query Firestore for next message
            next_messages = self.db.collection('conversations')\
                .where('user_id', '==', user_id)\
                .where('timestamp', '>', timestamp)\
                .order_by('timestamp')\
                .limit(1)\
                .get()
            
            if next_messages:
                return next_messages[0].to_dict()
            return None
        except Exception as e:
            logger.error(f"Error getting next message: {e}")
            return None
    
    def _store_conversation_outcome(self, outcome: ConversationOutcome):
        """Store conversation outcome for analysis"""
        try:
            self.db.collection('conversation_outcomes').add(asdict(outcome))
        except Exception as e:
            logger.error(f"Error storing conversation outcome: {e}")
    
    def _store_learning_insight(self, insight: LearningInsight):
        """Store learning insight for future use"""
        try:
            insight_id = f"{insight.pattern_type}_{hash(str(insight.context))}"
            self.db.collection('learning_insights').document(insight_id).set(asdict(insight))
        except Exception as e:
            logger.error(f"Error storing learning insight: {e}")
    
    def _update_orchestrator_config(self, improvements: Dict):
        """Update orchestrator configuration with learned improvements"""
        try:
            self.db.collection('orchestrator_config').document('learned_patterns').set({
                **improvements,
                'last_updated': datetime.now(),
                'version': 'meta_learning_v1'
            })
        except Exception as e:
            logger.error(f"Error updating orchestrator config: {e}")
    
    def load_existing_insights(self):
        """Load existing learning insights into cache"""
        try:
            insights_docs = self.db.collection('learning_insights').get()
            for doc in insights_docs:
                data = doc.to_dict()
                insight = LearningInsight(**data)
                cache_key = f"{insight.pattern_type}:{hash(str(insight.context))}"
                self.insights_cache[cache_key] = insight
            
            logger.info(f"Loaded {len(self.insights_cache)} existing learning insights")
        except Exception as e:
            logger.error(f"Error loading existing insights: {e}")

# === MAIN LEARNING LOOP FUNCTION ===

def run_learning_cycle(firestore_client=None):
    """
    Run a complete learning cycle - this should be called regularly
    """
    try:
        logger.info("🧠 Starting Zentrafuge meta-learning cycle...")
        
        meta_loop = MetaFeedbackLoop(firestore_client)
        
        # Generate new insights from recent conversations
        insights = meta_loop.generate_learning_insights(timeframe_days=7)
        
        # Update orchestrator with learned patterns
        improvements = meta_loop.update_orchestrator_intelligence()
        
        logger.info(f"✅ Learning cycle complete: {len(insights)} new insights, orchestrator updated")
        
        return {
            "insights_generated": len(insights),
            "orchestrator_improvements": len(improvements),
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"❌ Learning cycle failed: {e}")
        return {"status": "error", "error": str(e)}

# === INTEGRATION HOOKS ===

def analyze_conversation_async(user_id: str, conversation_data: Dict):
    """
    Async version for real-time conversation analysis
    Call this after each conversation exchange
    """
    try:
        meta_loop = MetaFeedbackLoop()
        outcome = meta_loop.analyze_conversation_outcome(user_id, conversation_data)
        
        # Get recommendations for next response
        if outcome:
            user_context = {
                "emotional_state": outcome.user_emotional_state,
                "themes": outcome.themes_discussed,
                "trauma_indicators": outcome.trauma_indicators,
                "safety_concerns": outcome.safety_concerns
            }
            recommendations = meta_loop.get_response_recommendations(user_context)
            return recommendations
        
    except Exception as e:
        logger.error(f"Error in async conversation analysis: {e}")
        return None

if __name__ == "__main__":
    # Run a learning cycle for testing
    result = run_learning_cycle()
    print(f"Learning cycle result: {result}")
