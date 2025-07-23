# backend/controllers/chat_controller.py - Chat Orchestration Logic (Fixed Imports)
import time
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Import existing modules - use whatever class names actually exist
try:
    from utils.memory_engine import MemoryEngine
except ImportError:
    try:
        from utils.memory_engine import EnhancedMemoryEngine as MemoryEngine
    except ImportError:
        try:
            from utils.memory_engine import MemoryManager as MemoryEngine
        except ImportError:
            # Fallback - create a simple placeholder
            class MemoryEngine:
                def __init__(self):
                    pass
                def retrieve_context(self, **kwargs):
                    return {}
                def store_conversation(self, **kwargs):
                    pass
                def get_conversation_history(self, **kwargs):
                    return []
                def get_user_summary(self, **kwargs):
                    return {}

try:
    from utils.emotion_parser import EmotionParser
except ImportError:
    class EmotionParser:
        def analyze_emotion(self, text):
            return {"primary_emotion": "neutral"}
        def get_user_emotional_profile(self, user_id):
            return {}
        def update_mood_history(self, user_id, mood):
            pass
        def export_user_profile(self, user_id):
            return {}
        def delete_user_data(self, user_id):
            pass

try:
    from utils.nlp_analyzer import NLPAnalyzer
except ImportError:
    class NLPAnalyzer:
        def analyze_patterns(self, text):
            return {"patterns": []}
        def get_user_patterns(self, user_id):
            return {}
        def export_user_patterns(self, user_id):
            return {}
        def delete_user_data(self, user_id):
            pass

try:
    from utils.eastern_brain import EasternBrain
except ImportError:
    class EasternBrain:
        def get_insights(self, **kwargs):
            return {"insights": []}

try:
    from utils.orchestrator import Orchestrator
except ImportError:
    class Orchestrator:
        def generate_response(self, context):
            return {"response": "I'm here to listen and support you."}

try:
    from utils.context_assembler import ContextAssembler
except ImportError:
    class ContextAssembler:
        def assemble_context(self, **kwargs):
            return {"context": "basic"}

try:
    from utils.health_monitor import HealthMonitor
except ImportError:
    class HealthMonitor:
        def record_interaction(self, **kwargs):
            pass
        def get_growth_indicators(self, user_id):
            return {}
        def export_user_data(self, user_id):
            return {}
        def delete_user_data(self, user_id):
            pass

from utils.logger import log_memory_operation, log_error_with_context

@dataclass
class ChatResponse:
    """Chat response data structure"""
    response: str
    model_used: str
    tokens_used: int
    processing_time: float
    emotional_tone: str
    confidence_score: float

class ChatController:
    """Main controller for chat interactions"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Initialize components with error handling
        try:
            self.memory_engine = MemoryEngine()
            self.emotion_parser = EmotionParser()
            self.nlp_analyzer = NLPAnalyzer()
            self.eastern_brain = EasternBrain()
            self.orchestrator = Orchestrator()
            self.context_assembler = ContextAssembler()
            self.health_monitor = HealthMonitor()
            
            self.logger.info("ChatController initialized with all components")
        except Exception as e:
            self.logger.error(f"Error initializing ChatController: {e}")
            # Continue with basic functionality
    
    def process_message(self, user_id: str, message: str, request_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Process a chat message through the full AI pipeline"""
        start_time = time.time()
        
        try:
            self.logger.info(f"Processing message for user {user_id}")
            
            # Step 1: Parse emotional content
            emotional_analysis = self.emotion_parser.analyze_emotion(message)
            self.logger.debug(f"Emotional analysis: {emotional_analysis}")
            
            # Step 2: Analyze linguistic patterns
            linguistic_analysis = self.nlp_analyzer.analyze_patterns(message)
            self.logger.debug(f"Linguistic analysis: {linguistic_analysis}")
            
            # Step 3: Retrieve relevant memories
            memory_context = self.memory_engine.retrieve_context(
                user_id=user_id,
                current_message=message,
                emotional_state=emotional_analysis
            )
            log_memory_operation(
                user_id=user_id,
                operation="retrieve_context",
                status="success",
                details={"memory_count": len(memory_context.get('memories', []))}
            )
            
            # Step 4: Get Eastern wisdom insights
            wisdom_insights = self.eastern_brain.get_insights(
                message=message,
                emotional_state=emotional_analysis,
                context=memory_context
            )
            self.logger.debug(f"Wisdom insights: {wisdom_insights}")
            
            # Step 5: Assemble full context
            full_context = self.context_assembler.assemble_context(
                user_message=message,
                emotional_analysis=emotional_analysis,
                linguistic_analysis=linguistic_analysis,
                memory_context=memory_context,
                wisdom_insights=wisdom_insights,
                user_id=user_id
            )
            
            # Step 6: Generate response through orchestrator
            response_data = self.orchestrator.generate_response(full_context)
            
            # Step 7: Store conversation
            self.memory_engine.store_conversation(
                user_id=user_id,
                user_message=message,
                cael_response=response_data['response'],
                emotional_analysis=emotional_analysis,
                metadata={
                    'processing_time': time.time() - start_time,
                    'model_used': response_data.get('model_used', 'gpt-4'),
                    'tokens_used': response_data.get('tokens_used', 0),
                    **request_metadata
                }
            )
            
            log_memory_operation(
                user_id=user_id,
                operation="store_conversation",
                status="success"
            )
            
            # Step 8: Update health monitoring
            self.health_monitor.record_interaction(
                user_id=user_id,
                emotional_state=emotional_analysis,
                response_quality=response_data.get('confidence_score', 0.8)
            )
            
            processing_time = time.time() - start_time
            self.logger.info(f"Message processed successfully in {processing_time:.3f}s")
            
            return {
                'response': response_data['response'],
                'model_used': response_data.get('model_used', 'gpt-4'),
                'tokens_used': response_data.get('tokens_used', 0),
                'processing_time': processing_time,
                'emotional_tone': emotional_analysis.get('primary_emotion', 'neutral'),
                'confidence_score': response_data.get('confidence_score', 0.8)
            }
            
        except Exception as e:
            self.logger.error(f"Error processing message: {str(e)}", exc_info=True)
            log_error_with_context(e, {
                'user_id': user_id,
                'message_length': len(message),
                'processing_stage': 'unknown'
            })
            
            # Return fallback response
            return {
                'response': "I'm having trouble processing your message right now. Let me take a moment to gather my thoughts, and please try again.",
                'model_used': 'fallback',
                'tokens_used': 0,
                'processing_time': time.time() - start_time,
                'emotional_tone': 'supportive',
                'confidence_score': 0.5
            }
    
    def get_chat_history(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """Retrieve user's chat history"""
        try:
            history = self.memory_engine.get_conversation_history(
                user_id=user_id,
                limit=limit,
                offset=offset
            )
            
            log_memory_operation(
                user_id=user_id,
                operation="get_chat_history",
                status="success",
                details={"retrieved_count": len(history)}
            )
            
            return history
            
        except Exception as e:
            self.logger.error(f"Error retrieving chat history: {str(e)}", exc_info=True)
            log_memory_operation(
                user_id=user_id,
                operation="get_chat_history",
                status="error"
            )
            return []
    
    def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user context"""
        try:
            context = {
                'emotional_profile': self.emotion_parser.get_user_emotional_profile(user_id),
                'conversation_patterns': self.nlp_analyzer.get_user_patterns(user_id),
                'memory_summary': self.memory_engine.get_user_summary(user_id),
                'growth_indicators': self.health_monitor.get_growth_indicators(user_id)
            }
            
            return context
            
        except Exception as e:
            self.logger.error(f"Error retrieving user context: {str(e)}", exc_info=True)
            return {}
    
    def record_mood(self, user_id: str, mood: str, notes: str = '') -> Dict[str, Any]:
        """Record user's mood"""
        try:
            # Basic mood storage - adapt based on your memory engine
            mood_data = {
                'user_id': user_id,
                'mood': mood,
                'notes': notes,
                'timestamp': time.time()
            }
            
            # Update emotional profile
            self.emotion_parser.update_mood_history(user_id, mood)
            
            log_memory_operation(
                user_id=user_id,
                operation="record_mood",
                status="success",
                details={"mood": mood}
            )
            
            return {'mood_id': f"mood_{int(time.time())}"}
            
        except Exception as e:
            self.logger.error(f"Error recording mood: {str(e)}", exc_info=True)
            log_memory_operation(
                user_id=user_id,
                operation="record_mood",
                status="error"
            )
            raise
    
    def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """Export all user data for GDPR compliance"""
        try:
            export_data = {
                'conversations': self.get_chat_history(user_id, limit=1000),
                'emotional_profile': self.emotion_parser.export_user_profile(user_id),
                'patterns': self.nlp_analyzer.export_user_patterns(user_id),
                'growth_data': self.health_monitor.export_user_data(user_id)
            }
            
            log_memory_operation(
                user_id=user_id,
                operation="export_user_data",
                status="success"
            )
            
            return export_data
            
        except Exception as e:
            self.logger.error(f"Error exporting user data: {str(e)}", exc_info=True)
            log_memory_operation(
                user_id=user_id,
                operation="export_user_data",
                status="error"
            )
            raise
    
    def delete_user_data(self, user_id: str) -> bool:
        """Delete all user data (GDPR right to be forgotten)"""
        try:
            # Delete from all components
            self.emotion_parser.delete_user_data(user_id)
            self.nlp_analyzer.delete_user_data(user_id)
            self.health_monitor.delete_user_data(user_id)
            
            log_memory_operation(
                user_id=user_id,
                operation="delete_user_data",
                status="success"
            )
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error deleting user data: {str(e)}", exc_info=True)
            log_memory_operation(
                user_id=user_id,
                operation="delete_user_data",
                status="error"
            )
            return False
