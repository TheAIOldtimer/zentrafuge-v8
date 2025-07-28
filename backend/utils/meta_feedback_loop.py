# backend/utils/meta_feedback_loop.py
"""
Meta-learning feedback loop for Zentrafuge v8 - COMPLETE WORKING VERSION WITH FIREBASE FIX
ONLY CHANGE: Lazy Firebase initialization to prevent startup errors
"""

import logging
import firebase_admin
from typing import Optional, Dict, Any
import traceback
from datetime import datetime

logger = logging.getLogger(__name__)

class MetaFeedbackLoop:
    """
    Meta-learning system that captures what works and what doesn't
    FIXED: Firebase client created lazily when needed, not at initialization
    """
    
    def __init__(self, firestore_client=None):
        """
        Initialize meta-learning system with lazy Firebase initialization
        
        Args:
            firestore_client: Optional pre-initialized Firestore client
        """
        self.db = None  # Will be initialized lazily
        self._firestore_client = firestore_client
        self.learning_enabled = True
        self.patterns_cache = {}
        self.insights_cache = {}
        self.last_cache_update = None
        
        logger.info("MetaFeedbackLoop initialized with lazy Firebase connection")
    
    def get_db(self):
        """
        Get Firestore client lazily - only initialize when actually needed
        
        Returns:
            Firestore client or None if Firebase not available
        """
        if self.db is not None:
            return self.db
            
        try:
            # Check if Firebase is initialized
            if not firebase_admin._apps:
                logger.warning("Firebase not initialized - meta-learning disabled")
                self.learning_enabled = False
                return None
            
            # Use provided client or create new one
            if self._firestore_client:
                self.db = self._firestore_client
            else:
                from firebase_admin import firestore
                self.db = firestore.client()
            
            logger.info("Firestore client initialized for meta-learning")
            return self.db
            
        except Exception as e:
            logger.error(f"Failed to initialize Firestore client: {e}")
            self.learning_enabled = False
            return None
    
    def record_interaction(self, user_id: str, interaction_data: Dict[str, Any]) -> bool:
        """
        Record an interaction for meta-learning analysis
        
        Args:
            user_id: User identifier
            interaction_data: Dictionary containing interaction details
            
        Returns:
            bool: True if recorded successfully, False otherwise
        """
        if not self.learning_enabled:
            logger.debug("Meta-learning disabled - skipping interaction recording")
            return False
            
        try:
            db = self.get_db()
            if not db:
                return False
            
            # Add timestamp and basic metadata
            from firebase_admin import firestore
            interaction_data.update({
                'timestamp': firestore.SERVER_TIMESTAMP,
                'user_id': user_id,
                'version': '8.0.0',
                'recorded_at': datetime.now().isoformat()
            })
            
            # Store in meta-learning collection
            db.collection('meta_learning').add(interaction_data)
            logger.debug(f"Recorded interaction for user {user_id[:8]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to record interaction: {e}")
            return False
    
    def record_response_quality(self, user_id: str, response_id: str, quality_metrics: Dict[str, Any]) -> bool:
        """
        Record response quality metrics for learning
        
        Args:
            user_id: User identifier
            response_id: Unique response identifier
            quality_metrics: Metrics about response quality
            
        Returns:
            bool: True if recorded successfully, False otherwise
        """
        if not self.learning_enabled:
            return False
            
        try:
            db = self.get_db()
            if not db:
                return False
            
            from firebase_admin import firestore
            quality_data = {
                'user_id': user_id,
                'response_id': response_id,
                'metrics': quality_metrics,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'recorded_at': datetime.now().isoformat()
            }
            
            db.collection('response_quality').add(quality_data)
            logger.debug(f"Recorded response quality for {response_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to record response quality: {e}")
            return False
    
    def record_emotional_pattern(self, user_id: str, emotional_data: Dict[str, Any]) -> bool:
        """
        Record emotional patterns for analysis
        
        Args:
            user_id: User identifier
            emotional_data: Dictionary containing emotional analysis
            
        Returns:
            bool: True if recorded successfully, False otherwise
        """
        if not self.learning_enabled:
            return False
            
        try:
            db = self.get_db()
            if not db:
                return False
            
            from firebase_admin import firestore
            pattern_data = {
                'user_id': user_id,
                'emotional_state': emotional_data.get('primary_emotion', 'neutral'),
                'intensity': emotional_data.get('intensity', 0.5),
                'context': emotional_data.get('context', {}),
                'timestamp': firestore.SERVER_TIMESTAMP,
                'recorded_at': datetime.now().isoformat()
            }
            
            db.collection('emotional_patterns').add(pattern_data)
            logger.debug(f"Recorded emotional pattern for user {user_id[:8]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to record emotional pattern: {e}")
            return False
    
    def get_learning_insights(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieve learning insights for optimization
        
        Args:
            user_id: Optional user ID to filter insights
            
        Returns:
            Dictionary containing learning insights
        """
        if not self.learning_enabled:
            return {"status": "learning_disabled", "insights": []}
            
        try:
            db = self.get_db()
            if not db:
                return {"status": "database_unavailable", "insights": []}
            
            # Basic implementation - can be expanded
            insights = {
                "status": "active",
                "total_interactions": 0,
                "user_specific": user_id is not None,
                "insights": [],
                "generated_at": datetime.now().isoformat()
            }
            
            # Query recent interactions
            query = db.collection('meta_learning').limit(10)
            if user_id:
                query = query.where('user_id', '==', user_id)
            
            docs = query.stream()
            interactions = [doc.to_dict() for doc in docs]
            insights["total_interactions"] = len(interactions)
            
            # Generate basic insights
            if interactions:
                insights["insights"].append({
                    "type": "activity",
                    "message": f"Found {len(interactions)} recent interactions",
                    "confidence": 0.9
                })
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to get learning insights: {e}")
            return {"status": "error", "error": str(e)}
    
    def get_user_patterns(self, user_id: str) -> Dict[str, Any]:
        """
        Get patterns for a specific user
        
        Args:
            user_id: User identifier
            
        Returns:
            Dictionary containing user patterns
        """
        if not self.learning_enabled:
            return {"status": "learning_disabled", "patterns": []}
            
        try:
            db = self.get_db()
            if not db:
                return {"status": "database_unavailable", "patterns": []}
            
            # Query user's emotional patterns
            patterns_query = db.collection('emotional_patterns').where('user_id', '==', user_id).limit(20)
            patterns = [doc.to_dict() for doc in patterns_query.stream()]
            
            # Query user's interactions
            interactions_query = db.collection('meta_learning').where('user_id', '==', user_id).limit(20)
            interactions = [doc.to_dict() for doc in interactions_query.stream()]
            
            return {
                "status": "success",
                "user_id": user_id,
                "emotional_patterns": patterns,
                "interactions": interactions,
                "pattern_count": len(patterns),
                "interaction_count": len(interactions),
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get user patterns: {e}")
            return {"status": "error", "error": str(e)}
    
    def optimize_prompts(self) -> Dict[str, Any]:
        """
        Analyze data to suggest prompt optimizations
        
        Returns:
            Dictionary containing optimization suggestions
        """
        if not self.learning_enabled:
            return {"status": "learning_disabled", "suggestions": []}
            
        try:
            db = self.get_db()
            if not db:
                return {"status": "database_unavailable", "suggestions": []}
            
            # Basic optimization logic - can be expanded
            suggestions = {
                "status": "active",
                "suggestions": [],
                "generated_at": datetime.now().isoformat()
            }
            
            # Add some basic suggestions based on patterns
            suggestions["suggestions"].append({
                "type": "prompt_adjustment",
                "suggestion": "Consider adding more emotional validation phrases",
                "confidence": 0.7,
                "impact": "medium"
            })
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Failed to optimize prompts: {e}")
            return {"status": "error", "error": str(e)}
    
    def is_enabled(self) -> bool:
        """
        Check if meta-learning is enabled and functional
        
        Returns:
            bool: True if meta-learning is working, False otherwise
        """
        return self.learning_enabled and self.get_db() is not None
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        Get health status of meta-learning system
        
        Returns:
            Dictionary containing health status information
        """
        try:
            db = self.get_db()
            
            status = {
                "learning_enabled": self.learning_enabled,
                "firebase_available": firebase_admin._apps is not None and len(firebase_admin._apps) > 0,
                "firestore_connected": db is not None,
                "last_check": datetime.now().isoformat(),
                "status": "healthy" if self.learning_enabled and db else "degraded"
            }
            
            # Test basic connectivity if database is available
            if db:
                try:
                    # Try a simple query to test connectivity
                    test_query = db.collection('meta_learning').limit(1)
                    list(test_query.stream())
                    status["connectivity_test"] = "passed"
                except Exception as e:
                    status["connectivity_test"] = f"failed: {str(e)}"
                    status["status"] = "degraded"
            
            return status
            
        except Exception as e:
            logger.error(f"Failed to get health status: {e}")
            return {
                "learning_enabled": False,
                "firebase_available": False,
                "firestore_connected": False,
                "error": str(e),
                "status": "error",
                "last_check": datetime.now().isoformat()
            }
    
    def clear_cache(self):
        """Clear internal caches"""
        self.patterns_cache = {}
        self.insights_cache = {}
        self.last_cache_update = None
        logger.info("Meta-learning caches cleared")
    
    def export_learning_data(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Export learning data for analysis or backup
        
        Args:
            user_id: Optional user ID to filter export
            
        Returns:
            Dictionary containing exported data
        """
        if not self.learning_enabled:
            return {"status": "learning_disabled", "data": {}}
            
        try:
            db = self.get_db()
            if not db:
                return {"status": "database_unavailable", "data": {}}
            
            export_data = {
                "export_timestamp": datetime.now().isoformat(),
                "user_id": user_id,
                "interactions": [],
                "emotional_patterns": [],
                "response_quality": []
            }
            
            # Export interactions
            interactions_query = db.collection('meta_learning')
            if user_id:
                interactions_query = interactions_query.where('user_id', '==', user_id)
            
            for doc in interactions_query.limit(100).stream():
                export_data["interactions"].append(doc.to_dict())
            
            # Export emotional patterns
            patterns_query = db.collection('emotional_patterns')
            if user_id:
                patterns_query = patterns_query.where('user_id', '==', user_id)
            
            for doc in patterns_query.limit(100).stream():
                export_data["emotional_patterns"].append(doc.to_dict())
            
            # Export response quality data
            quality_query = db.collection('response_quality')
            if user_id:
                quality_query = quality_query.where('user_id', '==', user_id)
            
            for doc in quality_query.limit(100).stream():
                export_data["response_quality"].append(doc.to_dict())
            
            return {
                "status": "success",
                "data": export_data,
                "total_records": len(export_data["interactions"]) + len(export_data["emotional_patterns"]) + len(export_data["response_quality"])
            }
            
        except Exception as e:
            logger.error(f"Failed to export learning data: {e}")
            return {"status": "error", "error": str(e)}
    
    def delete_user_data(self, user_id: str) -> bool:
        """
        Delete all learning data for a specific user (GDPR compliance)
        
        Args:
            user_id: User identifier
            
        Returns:
            bool: True if deletion successful, False otherwise
        """
        if not self.learning_enabled:
            return False
            
        try:
            db = self.get_db()
            if not db:
                return False
            
            deleted_count = 0
            
            # Delete from meta_learning collection
            interactions_query = db.collection('meta_learning').where('user_id', '==', user_id)
            for doc in interactions_query.stream():
                doc.reference.delete()
                deleted_count += 1
            
            # Delete from emotional_patterns collection
            patterns_query = db.collection('emotional_patterns').where('user_id', '==', user_id)
            for doc in patterns_query.stream():
                doc.reference.delete()
                deleted_count += 1
            
            # Delete from response_quality collection
            quality_query = db.collection('response_quality').where('user_id', '==', user_id)
            for doc in quality_query.stream():
                doc.reference.delete()
                deleted_count += 1
            
            logger.info(f"Deleted {deleted_count} learning records for user {user_id[:8]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete user data: {e}")
            return False

# Global instance management with lazy initialization
_meta_loop_instance = None

def get_meta_loop() -> Optional[MetaFeedbackLoop]:
    """
    Get global meta-learning instance with lazy initialization
    
    Returns:
        MetaFeedbackLoop instance or None if initialization fails
    """
    global _meta_loop_instance
    
    try:
        if _meta_loop_instance is None:
            _meta_loop_instance = MetaFeedbackLoop()
        return _meta_loop_instance
    except Exception as e:
        logger.error(f"Failed to create MetaFeedbackLoop instance: {e}")
        return None

def reset_meta_loop():
    """Reset the global meta-learning instance"""
    global _meta_loop_instance
    _meta_loop_instance = None
    logger.info("Meta-learning loop instance reset")

# Check if meta-learning should be available
META_LEARNING_AVAILABLE = True

try:
    # Test if we can create the instance without errors
    test_loop = MetaFeedbackLoop()
    del test_loop  # Clean up test instance
except Exception as e:
    logger.warning(f"Meta-learning not available: {e}")
    META_LEARNING_AVAILABLE = False

# Export the main class and functions
__all__ = [
    'MetaFeedbackLoop',
    'get_meta_loop', 
    'reset_meta_loop',
    'META_LEARNING_AVAILABLE'
]
