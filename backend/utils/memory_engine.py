"""
Zentrafuge v8 Memory Engine
Handles user-scoped memory storage and retrieval with emotional context
"""

import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
import hashlib

logger = logging.getLogger(__name__)

@dataclass
class ConversationMemory:
    """Represents a stored conversation with emotional context"""
    message_id: str
    timestamp: str
    user_message: str
    cael_reply: str
    emotional_tone: str
    time_since_last: str
    mood_score: Optional[float] = None
    themes: List[str] = None
    
    def __post_init__(self):
        if self.themes is None:
            self.themes = []

@dataclass
class UserProfile:
    """Persistent user identity and preferences"""
    user_id: str
    preferred_name: str
    support_style: str  # "gentle", "direct", "exploratory"
    communication_pace: str  # "slow", "moderate", "responsive"
    trigger_topics: List[str]
    growth_areas: List[str]
    created_at: str
    last_active: str

def retrieve_relevant_memories(user_id: str, current_input: str, firestore_client=None, limit: int = 3) -> str:
    """
    Main function called by orchestrator - retrieves relevant memories
    """
    try:
        if not firestore_client:
            return "Memory system offline - responding in present moment"
        
        memories = get_user_memories(user_id, firestore_client, limit=10)
        relevant_memories = find_relevant_memories(memories, current_input, limit)
        
        return format_memory_recall(relevant_memories)
        
    except Exception as e:
        logger.error(f"Error retrieving memories: {e}")
        return "Memory retrieval error - responding authentically to current moment"

def store_conversation(user_id: str, user_message: str, cael_reply: str, firestore_client, emotional_tone: str = "neutral"):
    """
    Store a conversation in user-scoped memory
    """
    try:
        if not firestore_client:
            logger.warning("No firestore client - conversation not stored")
            return
        
        # Calculate time since last message
        time_since_last = calculate_time_since_last(user_id, firestore_client)
        
        # Create message ID
        message_id = generate_message_id(user_message, datetime.now())
        
        # Extract themes from the conversation
        themes = extract_conversation_themes(user_message, cael_reply)
        
        # Create memory object
        memory = ConversationMemory(
            message_id=message_id,
            timestamp=datetime.now().isoformat(),
            user_message=user_message,
            cael_reply=cael_reply,
            emotional_tone=emotional_tone,
            time_since_last=time_since_last,
            themes=themes
        )
        
        # Store in Firestore
        doc_ref = firestore_client.collection("users").document(user_id).collection("messages").document(message_id)
        doc_ref.set(asdict(memory))
        
        logger.info(f"Stored conversation for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error storing conversation: {e}")

def get_user_memories(user_id: str, firestore_client, limit: int = 10) -> List[ConversationMemory]:
    """
    Retrieve recent memories for a user
    """
    try:
        # Query user's messages, ordered by timestamp
        messages_ref = firestore_client.collection("users").document(user_id).collection("messages")
        query = messages_ref.order_by("timestamp", direction="DESCENDING").limit(limit)
        
        memories = []
        for doc in query.stream():
            data = doc.to_dict()
            memory = ConversationMemory(**data)
            memories.append(memory)
        
        return memories
        
    except Exception as e:
        logger.error(f"Error getting user memories: {e}")
        return []

def find_relevant_memories(memories: List[ConversationMemory], current_input: str, limit: int = 3) -> List[ConversationMemory]:
    """
    Find memories most relevant to current input using keyword matching and themes
    """
    current_input_lower = current_input.lower()
    scored_memories = []
    
    for memory in memories:
        relevance_score = calculate_relevance_score(memory, current_input_lower)
        if relevance_score > 0:
            scored_memories.append((memory, relevance_score))
    
    # Sort by relevance score and return top matches
    scored_memories.sort(key=lambda x: x[1], reverse=True)
    return [memory for memory, score in scored_memories[:limit]]

def calculate_relevance_score(memory: ConversationMemory, current_input: str) -> float:
    """
    Calculate how relevant a memory is to current input
    """
    score = 0.0
    
    # Check for keyword matches in user message
    user_words = set(memory.user_message.lower().split())
    current_words = set(current_input.split())
    keyword_overlap = len(user_words.intersection(current_words))
    score += keyword_overlap * 0.3
    
    # Check for theme matches
    input_themes = extract_themes_from_text(current_input)
    theme_overlap = len(set(memory.themes).intersection(set(input_themes)))
    score += theme_overlap * 0.5
    
    # Boost score for recent conversations
    days_ago = calculate_days_since_timestamp(memory.timestamp)
    if days_ago <= 1:
        score += 0.3
    elif days_ago <= 7:
        score += 0.1
    
    # Boost score for emotional continuity
    current_emotion = extract_emotional_keywords(current_input)
    memory_emotion = extract_emotional_keywords(memory.user_message)
    if current_emotion and memory_emotion and current_emotion == memory_emotion:
        score += 0.4
    
    return score

def format_memory_recall(memories: List[ConversationMemory]) -> str:
    """
    Format memories into natural language for Cael
    """
    if not memories:
        return "No relevant memories found - this feels like a fresh conversation."
    
    recall_parts = []
    
    for memory in memories:
        time_context = format_time_context(memory.timestamp)
        emotional_context = f"(feeling {memory.emotional_tone})" if memory.emotional_tone != "neutral" else ""
        
        recall_part = f"{time_context}, you shared: \"{memory.user_message[:100]}...\" {emotional_context}"
        recall_parts.append(recall_part)
    
    return "Relevant memories:\n" + "\n".join(recall_parts)

def extract_conversation_themes(user_message: str, cael_reply: str) -> List[str]:
    """
    Extract thematic content from conversation
    """
    theme_keywords = {
        "work_stress": ["job", "work", "boss", "career", "workplace", "colleagues"],
        "relationships": ["relationship", "partner", "friend", "family", "dating", "love"],
        "anxiety": ["anxious", "worry", "scared", "nervous", "panic", "stress"],
        "depression": ["sad", "depressed", "hopeless", "empty", "lonely", "down"],
        "growth": ["learning", "growing", "changing", "improving", "progress", "development"],
        "health": ["tired", "sleep", "energy", "exercise", "health", "physical"],
        "creativity": ["creative", "art", "writing", "music", "project", "inspiration"],
        "identity": ["who am I", "purpose", "meaning", "values", "identity", "self"]
    }
    
    text = (user_message + " " + cael_reply).lower()
    detected_themes = []
    
    for theme, keywords in theme_keywords.items():
        if any(keyword in text for keyword in keywords):
            detected_themes.append(theme)
    
    return detected_themes[:3]  # Limit to top 3 themes

def extract_themes_from_text(text: str) -> List[str]:
    """
    Extract themes from a single text input
    """
    return extract_conversation_themes(text, "")

def extract_emotional_keywords(text: str) -> str:
    """
    Extract primary emotional keyword from text
    """
    emotional_keywords = {
        "sad": ["sad", "depressed", "down", "blue", "crying"],
        "anxious": ["anxious", "worried", "scared", "nervous", "panic"],
        "angry": ["angry", "mad", "frustrated", "irritated", "furious"],
        "happy": ["happy", "joyful", "excited", "glad", "cheerful"],
        "tired": ["tired", "exhausted", "drained", "weary", "burnout"]
    }
    
    text_lower = text.lower()
    for emotion, keywords in emotional_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            return emotion
    
    return ""

def calculate_time_since_last(user_id: str, firestore_client) -> str:
    """
    Calculate time since user's last message
    """
    try:
        # Get most recent message
        messages_ref = firestore_client.collection("users").document(user_id).collection("messages")
        query = messages_ref.order_by("timestamp", direction="DESCENDING").limit(1)
        
        docs = list(query.stream())
        if not docs:
            return "first_conversation"
        
        last_timestamp = docs[0].to_dict()["timestamp"]
        last_time = datetime.fromisoformat(last_timestamp.replace('Z', '+00:00'))
        time_diff = datetime.now() - last_time.replace(tzinfo=None)
        
        return format_time_difference(time_diff)
        
    except Exception as e:
        logger.error(f"Error calculating time since last: {e}")
        return "unknown"

def format_time_difference(time_diff: timedelta) -> str:
    """
    Format time difference into human-readable string
    """
    total_seconds = int(time_diff.total_seconds())
    
    if total_seconds < 60:
        return "just_now"
    elif total_seconds < 3600:  # Less than 1 hour
        minutes = total_seconds // 60
        return f"{minutes}_minutes_ago"
    elif total_seconds < 86400:  # Less than 1 day
        hours = total_seconds // 3600
        return f"{hours}_hours_ago"
    else:
        days = total_seconds // 86400
        return f"{days}_days_ago"

def format_time_context(timestamp: str) -> str:
    """
    Format timestamp into conversational context
    """
    try:
        time_obj = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        now = datetime.now()
        diff = now - time_obj.replace(tzinfo=None)
        
        if diff.days == 0:
            return "Earlier today"
        elif diff.days == 1:
            return "Yesterday"
        elif diff.days < 7:
            return f"{diff.days} days ago"
        else:
            return f"{diff.days // 7} weeks ago"
    except:
        return "Recently"

def calculate_days_since_timestamp(timestamp: str) -> int:
    """
    Calculate number of days since timestamp
    """
    try:
        time_obj = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        now = datetime.now()
        diff = now - time_obj.replace(tzinfo=None)
        return diff.days
    except:
        return 999  # Large number if parsing fails

def generate_message_id(message: str, timestamp: datetime) -> str:
    """
    Generate unique message ID
    """
    content = f"{message}_{timestamp.isoformat()}"
    return hashlib.md5(content.encode()).hexdigest()[:12]

# User profile management
def get_user_profile(user_id: str, firestore_client) -> Optional[UserProfile]:
    """
    Retrieve user profile from memory
    """
    try:
        doc_ref = firestore_client.collection("users").document(user_id).collection("memory").document("profile")
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            return UserProfile(**data)
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        return None

def update_user_profile(profile: UserProfile, firestore_client):
    """
    Update user profile in memory
    """
    try:
        doc_ref = firestore_client.collection("users").document(profile.user_id).collection("memory").document("profile")
        doc_ref.set(asdict(profile))
        logger.info(f"Updated profile for user {profile.user_id}")
        
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
