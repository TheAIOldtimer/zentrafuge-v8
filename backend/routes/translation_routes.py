# backend/routes/translation_routes.py - AI Translation Endpoints
from flask import Blueprint, request, jsonify
from openai import OpenAI
import logging
from typing import Dict, Any

from utils.logger import log_with_context
from utils.validators import validate_json_request
from utils.rate_limiter import rate_limit
from utils.config import Config

# Initialize OpenAI client with v1.3.0 syntax
client = OpenAI(api_key=Config.OPENAI_API_KEY)

# Create blueprint
translation_bp = Blueprint('translation', __name__)

# Get logger
logger = logging.getLogger(__name__)

# Language mappings for better AI context
LANGUAGE_NAMES = {
    'en': 'English',
    'es': 'Spanish (Español)',
    'fr': 'French (Français)', 
    'de': 'German (Deutsch)',
    'it': 'Italian (Italiano)',
    'pt': 'Portuguese (Português)',
    'ja': 'Japanese (日本語)',
    'zh': 'Chinese (中文)',
    'ru': 'Russian (Русский)',
    'nl': 'Dutch (Nederlands)'
}

@translation_bp.route('/translate', methods=['POST'])
@rate_limit(per_minute=30, per_hour=200)  # Higher limits for translation
@log_with_context({'endpoint': 'translate'})
def translate_text():
    """Translate text using AI with emotional context preservation"""
    try:
        # Validate request
        data = validate_json_request(request, required_fields=['text', 'target_language'])
        
        text = data['text'].strip()
        target_language = data['target_language'].lower()
        context = data.get('context', 'general')
        preserve_tone = data.get('preserve_tone', False)
        
        # Validate inputs
        if not text:
            return jsonify({'error': 'Text cannot be empty'}), 400
            
        if target_language not in LANGUAGE_NAMES:
            return jsonify({'error': f'Unsupported language: {target_language}'}), 400
            
        if len(text) > 5000:  # Reasonable limit
            return jsonify({'error': 'Text too long for translation'}), 400
        
        # Skip translation if already English
        if target_language == 'en':
            return jsonify({
                'translated_text': text,
                'source_language': 'en',
                'target_language': target_language,
                'context': context
            })
        
        # Build context-aware prompt
        language_name = LANGUAGE_NAMES[target_language]
        
        if context == 'emotional_support' or preserve_tone:
            prompt = f"""
You are translating text for an emotional support AI companion named Cael. 
Translate the following text to {language_name}, preserving:
- Emotional tone and warmth
- Therapeutic language style
- Empathetic and caring nature
- Natural conversational flow

Text to translate: "{text}"

Provide only the translation, no explanations:"""

        elif context == 'ui':
            prompt = f"""
Translate this user interface text to {language_name}.
Keep it:
- Concise and clear
- Appropriate for app interface
- Natural for native speakers

Text: "{text}"

Translation:"""

        else:  # general context
            prompt = f"""
Translate this text to {language_name}, maintaining natural tone and meaning.

Text: "{text}"

Translation:"""
        
        # Call OpenAI API with v1.3.0 syntax
        response = client.chat.completions.create(
            model=Config.OPENAI_MODEL if context == 'emotional_support' else 'gpt-3.5-turbo',
            messages=[{"role": "user", "content": prompt}],
            max_tokens=min(len(text) * 2, 1000),  # Reasonable token limit
            temperature=0.3,  # Lower temperature for consistency
            top_p=0.9
        )
        
        translated_text = response.choices[0].message.content.strip()
        
        # Remove quotes if AI added them
        if translated_text.startswith('"') and translated_text.endswith('"'):
            translated_text = translated_text[1:-1]
        
        logger.info(f"Translation completed: {target_language}, context: {context}")
        
        return jsonify({
            'translated_text': translated_text,
            'source_language': 'en',
            'target_language': target_language,
            'context': context,
            'model_used': response.model,
            'tokens_used': response.usage.total_tokens
        })
        
    except Exception as e:
        # Handle new OpenAI v1.3.0 exceptions
        error_type = type(e).__name__
        
        if 'RateLimit' in error_type:
            logger.warning("OpenAI rate limit exceeded for translation")
            return jsonify({'error': 'Translation service temporarily unavailable'}), 429
        elif 'APIError' in error_type or 'OpenAI' in error_type:
            logger.error(f"OpenAI API error: {str(e)}")
            return jsonify({'error': 'Translation service error'}), 503
        else:
            logger.error(f"Translation error: {str(e)}", exc_info=True)
            return jsonify({'error': 'Translation failed'}), 500

@translation_bp.route('/languages', methods=['GET'])
@rate_limit(per_minute=10, per_hour=50)
def get_supported_languages():
    """Get list of supported languages"""
    try:
        languages = [
            {'code': code, 'name': name, 'native_name': name}
            for code, name in LANGUAGE_NAMES.items()
        ]
        
        return jsonify({
            'languages': languages,
            'default': 'en'
        })
        
    except Exception as e:
        logger.error(f"Error getting languages: {str(e)}")
        return jsonify({'error': 'Failed to get languages'}), 500

@translation_bp.route('/detect', methods=['POST'])
@rate_limit(per_minute=20, per_hour=100)
def detect_language():
    """Detect language of provided text"""
    try:
        data = validate_json_request(request, required_fields=['text'])
        text = data['text'].strip()
        
        if not text:
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        # Use OpenAI to detect language with v1.3.0 syntax
        prompt = f"""
Detect the language of this text and respond with only the 2-letter language code (en, es, fr, de, etc.):

Text: "{text}"

Language code:"""

        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[{"role": "user", "content": prompt}],
            max_tokens=10,
            temperature=0.1
        )
        
        detected_language = response.choices[0].message.content.strip().lower()
        
        # Validate detected language
        if detected_language not in LANGUAGE_NAMES:
            detected_language = 'en'  # Default to English if uncertain
        
        return jsonify({
            'detected_language': detected_language,
            'language_name': LANGUAGE_NAMES.get(detected_language, 'English'),
            'confidence': 'high'  # Could implement confidence scoring
        })
        
    except Exception as e:
        logger.error(f"Language detection error: {str(e)}")
        return jsonify({'error': 'Language detection failed'}), 500
