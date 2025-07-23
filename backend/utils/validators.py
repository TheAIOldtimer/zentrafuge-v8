# backend/utils/validators.py - Request Validation
from flask import request
import re
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Custom validation error"""
    def __init__(self, message: str, field: str = None):
        super().__init__(message)
        self.message = message
        self.field = field

def validate_chat_request(request) -> Dict[str, Any]:
    """Validate chat request data"""
    if not request.is_json:
        raise ValidationError("Request must be JSON")
    
    data = request.get_json()
    
    if not data:
        raise ValidationError("Empty request body")
    
    # Validate required fields
    if 'message' not in data:
        raise ValidationError("Message field is required", "message")
    
    if 'user_id' not in data:
        raise ValidationError("User ID field is required", "user_id")
    
    message = data['message']
    user_id = data['user_id']
    
    # Validate message
    if not isinstance(message, str):
        raise ValidationError("Message must be a string", "message")
    
    message = message.strip()
    if len(message) == 0:
        raise ValidationError("Message cannot be empty", "message")
    
    if len(message) > 10000:  # 10KB limit
        raise ValidationError("Message too long (max 10,000 characters)", "message")
    
    # Check for suspicious patterns
    if is_suspicious_message(message):
        raise ValidationError("Message contains suspicious content", "message")
    
    # Validate user_id
    if not isinstance(user_id, str):
        raise ValidationError("User ID must be a string", "user_id")
    
    if not validate_user_id_format(user_id):
        raise ValidationError("Invalid user ID format", "user_id")
    
    # Sanitize message
    message = sanitize_message(message)
    
    return {
        'message': message,
        'user_id': user_id
    }

def validate_mood_request(request) -> Dict[str, Any]:
    """Validate mood recording request"""
    if not request.is_json:
        raise ValidationError("Request must be JSON")
    
    data = request.get_json()
    
    if not data:
        raise ValidationError("Empty request body")
    
    # Validate required fields
    required_fields = ['user_id', 'mood']
    for field in required_fields:
        if field not in data:
            raise ValidationError(f"{field} field is required", field)
    
    user_id = data['user_id']
    mood = data['mood']
    notes = data.get('notes', '')
    
    # Validate user_id
    if not isinstance(user_id, str) or not validate_user_id_format(user_id):
        raise ValidationError("Invalid user ID format", "user_id")
    
    # Validate mood
    valid_moods = [
        'happy', 'sad', 'anxious', 'calm', 'excited', 'depressed',
        'angry', 'peaceful', 'frustrated', 'hopeful', 'overwhelmed',
        'content', 'lonely', 'energetic', 'tired', 'confused',
        'grateful', 'stressed', 'relaxed', 'worried', 'neutral',
        'motivated', 'discouraged', 'confident', 'insecure', 'joyful'
    ]
    
    if not isinstance(mood, str) or mood.lower() not in valid_moods:
        raise ValidationError(f"Invalid mood. Must be one of: {', '.join(valid_moods)}", "mood")
    
    # Validate notes
    if not isinstance(notes, str):
        raise ValidationError("Notes must be a string", "notes")
    
    if len(notes) > 1000:
        raise ValidationError("Notes too long (max 1,000 characters)", "notes")
    
    return {
        'user_id': user_id,
        'mood': mood.lower(),
        'notes': sanitize_text(notes.strip())
    }

def validate_user_id_format(user_id: str) -> bool:
    """Validate user ID format (Firebase UID format)"""
    if not isinstance(user_id, str):
        return False
    
    if len(user_id) < 10 or len(user_id) > 128:
        return False
    
    # Firebase UIDs contain alphanumeric characters and some special chars
    if not re.match(r'^[a-zA-Z0-9_-]+$', user_id):
        return False
    
    return True

def validate_email(email: str) -> bool:
    """Validate email format"""
    if not isinstance(email, str):
        return False
    
    email = email.strip().lower()
    
    # Basic email regex
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        return False
    
    # Additional checks
    if len(email) > 254:  # RFC 5321 limit
        return False
    
    # Check for common invalid patterns
    invalid_patterns = [
        r'\.\.+',  # Multiple consecutive dots
        r'^\.|\.$',  # Starting or ending with dot
        r'@.*@',  # Multiple @ symbols
    ]
    
    for pattern in invalid_patterns:
        if re.search(pattern, email):
            return False
    
    return True

def validate_pagination_params(request) -> Dict[str, int]:
    """Validate pagination parameters"""
    limit = request.args.get('limit', '20')
    offset = request.args.get('offset', '0')
    
    try:
        limit = int(limit)
        offset = int(offset)
    except ValueError:
        raise ValidationError("Limit and offset must be integers")
    
    if limit < 1 or limit > 100:
        raise ValidationError("Limit must be between 1 and 100")
    
    if offset < 0:
        raise ValidationError("Offset must be non-negative")
    
    return {
        'limit': limit,
        'offset': offset
    }

def validate_export_request(request) -> Dict[str, Any]:
    """Validate data export request"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        raise ValidationError("User ID parameter required", "user_id")
    
    if not validate_user_id_format(user_id):
        raise ValidationError("Invalid user ID format", "user_id")
    
    # Optional format parameter
    export_format = request.args.get('format', 'json').lower()
    valid_formats = ['json', 'csv']
    
    if export_format not in valid_formats:
        raise ValidationError(f"Invalid format. Must be one of: {', '.join(valid_formats)}", "format")
    
    return {
        'user_id': user_id,
        'format': export_format
    }

def sanitize_message(message: str) -> str:
    """Sanitize user message"""
    # Remove null bytes
    message = message.replace('\x00', '')
    
    # Normalize whitespace
    message = re.sub(r'\s+', ' ', message)
    
    # Remove excessive punctuation
    message = re.sub(r'[!?]{4,}', '!!!', message)
    message = re.sub(r'[.]{4,}', '...', message)
    
    # Remove potentially harmful HTML/script tags
    message = re.sub(r'<[^>]*>', '', message)
    
    # Remove excessive capitalization (more than 3 consecutive caps)
    def replace_caps(match):
        text = match.group(0)
        if len(text) > 3:
            return text[:3]
        return text
    
    message = re.sub(r'[A-Z]{4,}', replace_caps, message)
    
    return message.strip()

def sanitize_text(text: str) -> str:
    """Basic text sanitization"""
    # Remove null bytes and control characters
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove HTML tags
    text = re.sub(r'<[^>]*>', '', text)
    
    return text.strip()

def is_suspicious_message(message: str) -> bool:
    """Check for suspicious message patterns"""
    # Convert to lowercase for pattern matching
    lower_message = message.lower()
    
    # Suspicious patterns
    suspicious_patterns = [
        # Potential injection attempts
        r'<script[^>]*>',
        r'javascript:',
        r'vbscript:',
        r'onload\s*=',
        r'onerror\s*=',
        r'eval\s*\(',
        
        # SQL injection patterns
        r'union\s+select',
        r'drop\s+table',
        r'delete\s+from',
        r'insert\s+into',
        
        # Excessive repetition (possible spam)
        r'(.)\1{50,}',  # Same character repeated 50+ times
        
        # Potential phishing
        r'click\s+here\s+to\s+claim',
        r'urgent\s+action\s+required',
        r'verify\s+your\s+account',
    ]
    
    for pattern in suspicious_patterns:
        if re.search(pattern, lower_message, re.IGNORECASE):
            logger.warning(f"Suspicious pattern detected: {pattern}")
            return True
    
    # Check for excessive URL patterns
    url_count = len(re.findall(r'https?://', lower_message))
    if url_count > 3:
        logger.warning(f"Excessive URLs detected: {url_count}")
        return True
    
    return False

def validate_file_upload(request) -> Dict[str, Any]:
    """Validate file upload request"""
    if 'file' not in request.files:
        raise ValidationError("No file provided", "file")
    
    file = request.files['file']
    user_id = request.form.get('user_id')
    purpose = request.form.get('purpose', 'general')
    
    # Validate user_id
    if not user_id or not validate_user_id_format(user_id):
        raise ValidationError("Invalid user ID", "user_id")
    
    # Validate file
    if file.filename == '':
        raise ValidationError("No file selected", "file")
    
    # Check file size (5MB limit)
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    
    if file_size > 5 * 1024 * 1024:  # 5MB
        raise ValidationError("File too large (max 5MB)", "file")
    
    # Check file type
    allowed_extensions = {'.txt', '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'}
    file_ext = get_file_extension(file.filename).lower()
    
    if file_ext not in allowed_extensions:
        raise ValidationError(f"File type not allowed. Allowed: {', '.join(allowed_extensions)}", "file")
    
    # Validate purpose
    valid_purposes = ['general', 'profile', 'document', 'image']
    if purpose not in valid_purposes:
        raise ValidationError(f"Invalid purpose. Must be one of: {', '.join(valid_purposes)}", "purpose")
    
    return {
        'file': file,
        'user_id': user_id,
        'purpose': purpose,
        'filename': secure_filename(file.filename),
        'file_size': file_size,
        'file_extension': file_ext
    }

def get_file_extension(filename: str) -> str:
    """Get file extension safely"""
    if '.' not in filename:
        return ''
    return '.' + filename.rsplit('.', 1)[1]

def secure_filename(filename: str) -> str:
    """Create a secure filename"""
    # Remove path components
    filename = filename.split('/')[-1].split('\\')[-1]
    
    # Remove dangerous characters
    filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
    
    # Limit length
    if len(filename) > 100:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:95] + ('.' + ext if ext else '')
    
    # Ensure not empty
    if not filename:
        filename = 'unnamed_file'
    
    return filename

def validate_user_preferences(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate user preferences update"""
    allowed_preferences = {
        'theme': ['light', 'dark', 'auto'],
        'notifications': [True, False],
        'language': ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ru', 'nl'],
        'communication_style': ['formal', 'casual', 'supportive', 'direct'],
        'response_length': ['short', 'medium', 'long'],
        'emotional_tone': ['calm', 'energetic', 'balanced']
    }
    
    validated = {}
    
    for key, value in data.items():
        if key not in allowed_preferences:
            continue  # Ignore unknown preferences
        
        allowed_values = allowed_preferences[key]
        if value in allowed_values:
            validated[key] = value
        else:
            raise ValidationError(f"Invalid value for {key}. Must be one of: {allowed_values}", key)
    
    return validated

def validate_json_request(request, required_fields: List[str] = None) -> Dict[str, Any]:
    """Generic JSON request validator"""
    if not request.is_json:
        raise ValidationError("Request must be JSON")
    
    data = request.get_json()
    
    if not data:
        raise ValidationError("Empty request body")
    
    if required_fields:
        for field in required_fields:
            if field not in data:
                raise ValidationError(f"{field} field is required", field)
    
    return data
