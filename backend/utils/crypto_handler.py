"""
Unified Encryption/Decryption Handler for Zentrafuge
Handles all encryption/decryption operations consistently
Works without EmotionalSignature dependencies
"""

import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Union, List
from cryptography.fernet import Fernet, InvalidToken
import logging

logger = logging.getLogger(__name__)

class ZentraCrypto:
    """
    Unified encryption/decryption handler for all Zentrafuge data.
    
    Ensures consistent encryption across:
    - Conversation history
    - User data
    - Memory storage
    """
    
    def __init__(self, encryption_key: Optional[str] = None):
        """Initialize with encryption key from environment or parameter"""
        key = encryption_key or os.getenv("FERNET_SECRET_KEY")
        if not key:
            raise ValueError("No encryption key provided. Set FERNET_SECRET_KEY environment variable.")
        
        try:
            self.fernet = Fernet(key)
            logger.info("🔒 ZentraCrypto initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize encryption: {e}")
            raise
    
    def ensure_utc_datetime(self, dt: Union[datetime, str, None]) -> datetime:
        """
        Ensure datetime is UTC timezone-aware.
        Fixes the timezone mixing issues we've been having.
        """
        if dt is None:
            return datetime.now(timezone.utc)
        
        if isinstance(dt, str):
            try:
                # Try parsing ISO format
                if 'T' in dt:
                    dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
                else:
                    # Handle date-only strings
                    dt = datetime.fromisoformat(dt)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
            except:
                # Fallback to current time if parsing fails
                logger.warning(f"Failed to parse datetime string: {dt}")
                return datetime.now(timezone.utc)
        
        if isinstance(dt, datetime):
            # If naive datetime, assume UTC
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            # Convert to UTC if not already
            elif dt.tzinfo != timezone.utc:
                dt = dt.astimezone(timezone.utc)
        
        return dt
    
    def encrypt_text(self, text: str) -> str:
        """Safely encrypt a text string"""
        try:
            if not isinstance(text, str):
                text = str(text)
            return self.fernet.encrypt(text.encode()).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    def decrypt_text(self, encrypted_text: str) -> str:
        """Safely decrypt a text string"""
        try:
            return self.fernet.decrypt(encrypted_text.encode()).decode()
        except InvalidToken:
            logger.warning("Invalid token during decryption")
            raise ValueError("Invalid encryption token")
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise
    
    def prepare_signature_for_storage(self, user_message: str, cael_reply: str, 
                                    conversation_context: Dict = None) -> Dict[str, Any]:
        """
        Create a signature-compatible storage format that works with memory retrieval.
        
        This creates rich memory data without depending on EmotionalSignature classes.
        """
        try:
            # Parse emotional content from message
            from utils.emotion_parser import parse_emotion
            primary_emotion = parse_emotion(user_message)
            
            # Analyze message content for emotional themes
            emotional_themes = self._extract_emotional_themes(user_message)
            vulnerability_level = self._assess_vulnerability_level(user_message)
            support_needed = self._infer_support_needs(user_message)
            user_agency = self._assess_user_agency(user_message)
            
            # Enhanced NLP analysis if available
            try:
                from utils.nlp_analyzer import analyze_emotional_state
                analysis = analyze_emotional_state(user_message)
                emotional_intensity = analysis.get('intensity', 'moderate')
                if isinstance(emotional_intensity, str):
                    intensity_map = {'low': 0.3, 'moderate': 0.5, 'high': 0.8}
                    emotional_intensity = intensity_map.get(emotional_intensity, 0.5)
            except:
                emotional_intensity = 0.5
            
            # Create storage data with encryption
            storage_data = {
                # Encrypted conversation content
                "user_message": self.encrypt_text(user_message),
                "cael_reply": self.encrypt_text(cael_reply),
                "user_message_encrypted": True,
                "cael_reply_encrypted": True,
                
                # Signature data (searchable, so not encrypted)
                "primary_emotion": primary_emotion,
                "emotional_intensity": emotional_intensity,
                "emotional_themes": emotional_themes,
                "vulnerability_level": vulnerability_level,
                "support_type_needed": support_needed,
                "user_agency": user_agency,
                "conversation_depth": self._assess_conversation_depth(vulnerability_level),
                "insight_present": self._detect_insights(user_message),
                "patterns_emerging": self._detect_patterns(user_message),
                "time_of_day": self._get_time_context(),
                "seasonal_context": self._get_seasonal_context(),
                "related_themes_hash": hash(str(emotional_themes)),
                "conversation_cluster_id": f"cluster_{primary_emotion}",
                "recall_frequency": 0,
                
                # Timestamps (UTC aware)
                "created_timestamp": self.ensure_utc_datetime(None),
                "last_referenced": None,
                
                # Metadata
                "storage_version": "crypto_v1",
                "memory_enabled": True
            }
            
            # Add conversation context safely
            if conversation_context:
                for key, value in conversation_context.items():
                    if isinstance(value, (str, int, float, bool)) and len(str(value)) < 100:
                        storage_data[f"context_{key}"] = value
            
            return storage_data
                
        except Exception as e:
            logger.error(f"Error preparing signature for storage: {e}")
            return self._create_basic_signature_storage(user_message, cael_reply, conversation_context)
    
    def _extract_emotional_themes(self, user_message: str) -> List[str]:
        """Extract emotional themes from message"""
        message_lower = user_message.lower()
        themes = []
        
        theme_keywords = {
            'work': ['job', 'career', 'boss', 'workplace', 'colleague', 'meeting'],
            'relationship': ['partner', 'boyfriend', 'girlfriend', 'dating', 'marriage', 'love'],
            'family': ['mom', 'dad', 'parent', 'sibling', 'child', 'family'],
            'health': ['sick', 'pain', 'doctor', 'medical', 'illness', 'tired'],
            'grief': ['loss', 'death', 'died', 'funeral', 'mourning', 'miss'],
            'anxiety': ['worry', 'nervous', 'panic', 'stress', 'anxious', 'scared'],
            'depression': ['sad', 'hopeless', 'empty', 'worthless', 'depressed'],
            'growth': ['learning', 'insight', 'realize', 'understand', 'breakthrough'],
            'isolation': ['alone', 'lonely', 'isolated', 'disconnected', 'withdrawn']
        }
        
        for theme, keywords in theme_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                themes.append(theme)
        
        return themes[:3] if themes else ['general']
    
    def _assess_vulnerability_level(self, user_message: str) -> str:
        """Assess vulnerability level from message content"""
        message_lower = user_message.lower()
        
        deep_indicators = ['never told anyone', 'secret', 'ashamed', 'scared to tell']
        vulnerable_indicators = ['hard to talk about', 'difficult', 'struggling', 'overwhelming']
        trusting_indicators = ['feel safe', 'comfortable sharing', 'trust you']
        
        if any(indicator in message_lower for indicator in deep_indicators):
            return 'deep'
        elif any(indicator in message_lower for indicator in vulnerable_indicators):
            return 'vulnerable'
        elif any(indicator in message_lower for indicator in trusting_indicators):
            return 'trusting'
        else:
            return 'surface'
    
    def _infer_support_needs(self, user_message: str) -> List[str]:
        """Infer support needs from message content"""
        message_lower = user_message.lower()
        support_types = []
        
        if any(word in message_lower for word in ['help', 'advice', 'what should', 'how do']):
            support_types.append('guidance')
        if any(word in message_lower for word in ['understand', 'feel', 'validate', 'hear']):
            support_types.append('understanding')
        if any(word in message_lower for word in ['calm', 'breathe', 'overwhelmed', 'panic']):
            support_types.append('grounding')
        if any(word in message_lower for word in ['listen', 'share', 'presence']):
            support_types.append('presence')
        
        return support_types if support_types else ['understanding']
    
    def _assess_user_agency(self, user_message: str) -> str:
        """Assess user agency from message tone"""
        message_lower = user_message.lower()
        
        if any(word in message_lower for word in ['can\'t', 'won\'t', 'impossible', 'give up']):
            return 'resistant'
        elif any(word in message_lower for word in ['trying', 'want to', 'hoping', 'maybe']):
            return 'exploring'
        elif any(word in message_lower for word in ['will', 'going to', 'plan to', 'ready']):
            return 'determined'
        else:
            return 'open'
    
    def _assess_conversation_depth(self, vulnerability_level: str) -> str:
        """Map vulnerability to conversation depth"""
        depth_map = {
            'surface': 'light',
            'trusting': 'meaningful',
            'vulnerable': 'deep',
            'deep': 'profound'
        }
        return depth_map.get(vulnerability_level, 'surface')
    
    def _detect_insights(self, user_message: str) -> bool:
        """Check if message contains insights or realizations"""
        message_lower = user_message.lower()
        insight_indicators = ['realize', 'understand', 'see now', 'makes sense', 'learned', 'insight', 'clicked']
        return any(indicator in message_lower for indicator in insight_indicators)
    
    def _detect_patterns(self, user_message: str) -> bool:
        """Check if message indicates pattern recognition"""
        message_lower = user_message.lower()
        pattern_indicators = ['pattern', 'always', 'keep doing', 'happens again', 'cycle', 'same thing']
        return any(indicator in message_lower for indicator in pattern_indicators)
    
    def _create_basic_signature_storage(self, user_message: str, cael_reply: str, 
                                      conversation_context: Dict = None) -> Dict[str, Any]:
        """Fallback signature creation"""
        from utils.emotion_parser import parse_emotion
        
        return {
            "user_message": self.encrypt_text(user_message),
            "cael_reply": self.encrypt_text(cael_reply),
            "user_message_encrypted": True,
            "cael_reply_encrypted": True,
            "primary_emotion": parse_emotion(user_message),
            "emotional_intensity": 0.5,
            "emotional_themes": ["general"],
            "vulnerability_level": "surface",
            "support_type_needed": ["understanding"],
            "user_agency": "open",
            "conversation_depth": "surface",
            "insight_present": False,
            "patterns_emerging": False,
            "time_of_day": self._get_time_context(),
            "seasonal_context": self._get_seasonal_context(),
            "related_themes_hash": 0,
            "conversation_cluster_id": "general",
            "created_timestamp": self.ensure_utc_datetime(None),
            "last_referenced": None,
            "recall_frequency": 0,
            "storage_version": "crypto_v1_fallback",
            "memory_enabled": True
        }
    
    def _get_time_context(self) -> str:
        """Get current time context"""
        hour = datetime.now().hour
        if 5 <= hour < 12:
            return 'morning'
        elif 12 <= hour < 17:
            return 'afternoon'
        elif 17 <= hour < 21:
            return 'evening'
        else:
            return 'night'
    
    def _get_seasonal_context(self) -> Optional[str]:
        """Get seasonal context"""
        month = datetime.now().month
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        elif month in [9, 10, 11]:
            return 'autumn'
        return None


# Global instance for easy import
crypto = ZentraCrypto()


def encrypt_conversation(user_message: str, cael_reply: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Convenience function for encrypting conversation data with full signature generation.
    
    This replaces the old complex signature saving process.
    """
    conversation_context = metadata or {}
    return crypto.prepare_signature_for_storage(user_message, cael_reply, conversation_context)


def decrypt_conversation(encrypted_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function for decrypting conversation data.
    """
    decrypted = {}
    
    # Decrypt text fields
    if encrypted_data.get("user_message_encrypted", False):
        decrypted["user_message"] = crypto.decrypt_text(encrypted_data["user_message"])
    else:
        decrypted["user_message"] = encrypted_data.get("user_message", "")
    
    if encrypted_data.get("cael_reply_encrypted", False):
        decrypted["cael_reply"] = crypto.decrypt_text(encrypted_data["cael_reply"])
    else:
        decrypted["cael_reply"] = encrypted_data.get("cael_reply", "")
    
    # Copy non-encrypted fields
    for key, value in encrypted_data.items():
        if not key.endswith("_encrypted") and key not in ["user_message", "cael_reply"]:
            decrypted[key] = value
    
    return decrypted


def get_time_of_day() -> str:
    """Helper function to determine time of day for contextual responses"""
    current_hour = datetime.now().hour
    
    if 5 <= current_hour < 12:
        return 'morning'
    elif 12 <= current_hour < 17:
        return 'afternoon'
    elif 17 <= current_hour < 21:
        return 'evening'
    else:
        return 'night'
