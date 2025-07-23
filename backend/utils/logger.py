# backend/utils/logger.py - Structured Logging
import logging
import logging.handlers
import json
import sys
from datetime import datetime
from typing import Any, Dict
from flask import Flask, request, g
from functools import wraps

class ZentraFugeFormatter(logging.Formatter):
    """Custom formatter for Zentrafuge logs"""
    
    def format(self, record):
        # Create log entry
        log_entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'module': record.name,
            'message': record.getMessage(),
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add request context if available
        if hasattr(g, 'user_id'):
            log_entry['user_id'] = g.user_id
            
        if request:
            log_entry['request'] = {
                'method': request.method,
                'path': request.path,
                'remote_addr': request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            }
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'extra_data'):
            log_entry['extra'] = record.extra_data
            
        return json.dumps(log_entry, ensure_ascii=False)

def setup_logging(app: Flask) -> None:
    """Setup application logging"""
    
    # Get log level from config
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO'))
    
    # Create formatter
    formatter = ZentraFugeFormatter()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(log_level)
    
    # File handler (if specified)
    if app.config.get('LOG_FILE'):
        file_handler = logging.handlers.RotatingFileHandler(
            app.config['LOG_FILE'],
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(log_level)
        app.logger.addHandler(file_handler)
    
    # Add handlers to app logger
    app.logger.addHandler(console_handler)
    app.logger.setLevel(log_level)
    
    # Configure root logger
    logging.getLogger().setLevel(log_level)
    
    # Silence noisy loggers
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)

def log_with_context(extra_data: Dict[str, Any] = None):
    """Decorator to add context to log messages"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger = logging.getLogger(func.__module__)
            
            try:
                # Log function entry
                logger.info(f"Entering {func.__name__}", extra={'extra_data': extra_data})
                
                result = func(*args, **kwargs)
                
                # Log successful completion
                logger.info(f"Completed {func.__name__}", extra={'extra_data': extra_data})
                
                return result
                
            except Exception as e:
                # Log error
                logger.error(
                    f"Error in {func.__name__}: {str(e)}", 
                    exc_info=True,
                    extra={'extra_data': extra_data}
                )
                raise
                
        return wrapper
    return decorator

def log_chat_interaction(user_id: str, message: str, response: str, duration: float):
    """Log chat interactions for analysis"""
    logger = logging.getLogger('zentrafuge.chat')
    
    log_data = {
        'user_id': user_id,
        'message_length': len(message),
        'response_length': len(response),
        'duration_seconds': duration,
        'interaction_type': 'chat'
    }
    
    logger.info("Chat interaction completed", extra={'extra_data': log_data})

def log_memory_operation(user_id: str, operation: str, status: str, details: Dict[str, Any] = None):
    """Log memory operations for debugging"""
    logger = logging.getLogger('zentrafuge.memory')
    
    log_data = {
        'user_id': user_id,
        'operation': operation,
        'status': status,
        'details': details or {}
    }
    
    logger.info(f"Memory operation: {operation}", extra={'extra_data': log_data})

def log_error_with_context(error: Exception, context: Dict[str, Any] = None):
    """Log errors with full context"""
    logger = logging.getLogger('zentrafuge.error')
    
    log_data = {
        'error_type': type(error).__name__,
        'error_message': str(error),
        'context': context or {}
    }
    
    logger.error("Application error occurred", exc_info=True, extra={'extra_data': log_data})

# Custom log levels
CHAT_LEVEL = 25
logging.addLevelName(CHAT_LEVEL, "CHAT")

def chat_log(self, message, *args, **kwargs):
    if self.isEnabledFor(CHAT_LEVEL):
        self._log(CHAT_LEVEL, message, args, **kwargs)

logging.Logger.chat = chat_log
