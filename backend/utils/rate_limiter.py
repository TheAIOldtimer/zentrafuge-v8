# backend/utils/rate_limiter.py - Complete Rate Limiting System
import time
import redis
import logging
from functools import wraps
from flask import request, jsonify, current_app
from typing import Optional
import os

logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiter using Redis or in-memory storage"""
    
    def __init__(self):
        self.redis_client = None
        self.memory_store = {}
        
        # Try to connect to Redis
        redis_url = os.environ.get('REDIS_URL')
        if redis_url:
            try:
                self.redis_client = redis.from_url(redis_url)
                self.redis_client.ping()
                logger.info("Connected to Redis for rate limiting")
            except Exception as e:
                logger.warning(f"Could not connect to Redis: {e}, using memory store")
        else:
            logger.info("No Redis URL provided, using memory store for rate limiting")
    
    def _get_client_id(self) -> str:
        """Get unique client identifier"""
        # Try to get real IP from headers (for proxy/load balancer setups)
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR')
        if client_ip:
            client_ip = client_ip.split(',')[0].strip()
        else:
            client_ip = request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
        
        # Include user agent for additional uniqueness
        user_agent = request.headers.get('User-Agent', '')[:50]  # Truncate
        
        return f"{client_ip}:{hash(user_agent)}"
    
    def _cleanup_memory_store(self):
        """Clean up expired entries from memory store"""
        current_time = time.time()
        expired_keys = []
        
        for key, data in self.memory_store.items():
            # Remove entries older than 1 hour
            if current_time - data.get('last_reset', 0) > 3600:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.memory_store[key]
    
    def is_rate_limited(self, client_id: str, per_minute: int, per_hour: int) -> tuple[bool, dict]:
        """Check if client is rate limited"""
        current_time = time.time()
        minute_window = int(current_time // 60)
        hour_window = int(current_time // 3600)
        
        if self.redis_client:
            return self._check_redis_limits(client_id, minute_window, hour_window, per_minute, per_hour)
        else:
            return self._check_memory_limits(client_id, minute_window, hour_window, per_minute, per_hour, current_time)
    
    def _check_redis_limits(self, client_id: str, minute_window: int, hour_window: int, 
                           per_minute: int, per_hour: int) -> tuple[bool, dict]:
        """Check rate limits using Redis"""
        try:
            pipe = self.redis_client.pipeline()
            
            # Keys for minute and hour windows
            minute_key = f"rate_limit:minute:{client_id}:{minute_window}"
            hour_key = f"rate_limit:hour:{client_id}:{hour_window}"
            
            # Get current counts
            pipe.get(minute_key)
            pipe.get(hour_key)
            results = pipe.execute()
            
            minute_count = int(results[0] or 0)
            hour_count = int(results[1] or 0)
            
            # Check limits
            if minute_count >= per_minute:
                return True, {
                    'limit_type': 'per_minute',
                    'limit': per_minute,
                    'current': minute_count,
                    'reset_time': (minute_window + 1) * 60
                }
            
            if hour_count >= per_hour:
                return True, {
                    'limit_type': 'per_hour',
                    'limit': per_hour,
                    'current': hour_count,
                    'reset_time': (hour_window + 1) * 3600
                }
            
            # Increment counters
            pipe = self.redis_client.pipeline()
            pipe.incr(minute_key)
            pipe.expire(minute_key, 120)  # 2 minutes TTL
            pipe.incr(hour_key)
            pipe.expire(hour_key, 7200)  # 2 hours TTL
            pipe.execute()
            
            return False, {
                'minute_count': minute_count + 1,
                'hour_count': hour_count + 1
            }
            
        except Exception as e:
            logger.error(f"Redis rate limiting error: {e}")
            # Fall back to memory store
            return self._check_memory_limits(client_id, minute_window, hour_window, per_minute, per_hour, time.time())
    
    def _check_memory_limits(self, client_id: str, minute_window: int, hour_window: int,
                            per_minute: int, per_hour: int, current_time: float) -> tuple[bool, dict]:
        """Check rate limits using memory store"""
        # Cleanup old entries periodically
        if len(self.memory_store) > 1000:
            self._cleanup_memory_store()
        
        if client_id not in self.memory_store:
            self.memory_store[client_id] = {
                'minute_window': minute_window,
                'hour_window': hour_window,
                'minute_count': 0,
                'hour_count': 0,
                'last_reset': current_time
            }
        
        data = self.memory_store[client_id]
        
        # Reset counters if window changed
        if data['minute_window'] != minute_window:
            data['minute_window'] = minute_window
            data['minute_count'] = 0
        
        if data['hour_window'] != hour_window:
            data['hour_window'] = hour_window
            data['hour_count'] = 0
        
        # Check limits
        if data['minute_count'] >= per_minute:
            return True, {
                'limit_type': 'per_minute',
                'limit': per_minute,
                'current': data['minute_count'],
                'reset_time': (minute_window + 1) * 60
            }
        
        if data['hour_count'] >= per_hour:
            return True, {
                'limit_type': 'per_hour',
                'limit': per_hour,
                'current': data['hour_count'],
                'reset_time': (hour_window + 1) * 3600
            }
        
        # Increment counters
        data['minute_count'] += 1
        data['hour_count'] += 1
        data['last_reset'] = current_time
        
        return False, {
            'minute_count': data['minute_count'],
            'hour_count': data['hour_count']
        }

# Global rate limiter instance
rate_limiter = RateLimiter()

def rate_limit(per_minute: int = 20, per_hour: int = 100):
    """Rate limiting decorator"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            client_id = rate_limiter._get_client_id()
            
            is_limited, info = rate_limiter.is_rate_limited(client_id, per_minute, per_hour)
            
            if is_limited:
                logger.warning(f"Rate limit exceeded for {client_id}: {info}")
                
                response = jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Limit: {info["limit"]} {info["limit_type"]}',
                    'retry_after': info['reset_time'] - time.time()
                })
                response.status_code = 429
                response.headers['Retry-After'] = str(int(info['reset_time'] - time.time()))
                return response
            
            # Add rate limit headers
            response = func(*args, **kwargs)
            
            if hasattr(response, 'headers'):
                response.headers['X-RateLimit-Limit-Minute'] = str(per_minute)
                response.headers['X-RateLimit-Limit-Hour'] = str(per_hour)
                response.headers['X-RateLimit-Remaining-Minute'] = str(max(0, per_minute - info.get('minute_count', 0)))
                response.headers['X-RateLimit-Remaining-Hour'] = str(max(0, per_hour - info.get('hour_count', 0)))
            
            return response
        
        return wrapper
    return decorator

def get_client_ip():
    """Get the real client IP address"""
    # Check for forwarded headers first (for proxies/load balancers)
    forwarded_ips = request.environ.get('HTTP_X_FORWARDED_FOR')
    if forwarded_ips:
        # Take the first IP in the chain
        return forwarded_ips.split(',')[0].strip()
    
    # Check other headers
    real_ip = request.environ.get('HTTP_X_REAL_IP')
    if real_ip:
        return real_ip
    
    # Fall back to remote_addr
    return request.remote_addr

def create_rate_limit_key(prefix: str = "rate_limit") -> str:
    """Create a rate limit key for the current request"""
    client_ip = get_client_ip()
    return f"{prefix}:{client_ip}"

# Specific rate limiters for different endpoints
def chat_rate_limit():
    """Rate limiter for chat endpoints"""
    return rate_limit(per_minute=10, per_hour=50)

def auth_rate_limit():
    """Rate limiter for authentication endpoints"""
    return rate_limit(per_minute=5, per_hour=20)

def export_rate_limit():
    """Rate limiter for data export endpoints"""
    return rate_limit(per_minute=1, per_hour=3)

def get_rate_limit_stats(client_id: str = None) -> dict:
    """Get rate limit statistics for debugging"""
    if not client_id:
        client_id = rate_limiter._get_client_id()
    
    if rate_limiter.redis_client:
        try:
            current_time = time.time()
            minute_window = int(current_time // 60)
            hour_window = int(current_time // 3600)
            
            minute_key = f"rate_limit:minute:{client_id}:{minute_window}"
            hour_key = f"rate_limit:hour:{client_id}:{hour_window}"
            
            pipe = rate_limiter.redis_client.pipeline()
            pipe.get(minute_key)
            pipe.get(hour_key)
            results = pipe.execute()
            
            return {
                'client_id': client_id,
                'minute_count': int(results[0] or 0),
                'hour_count': int(results[1] or 0),
                'storage': 'redis'
            }
        except Exception as e:
            logger.error(f"Error getting Redis rate limit stats: {e}")
    
    # Fall back to memory store
    data = rate_limiter.memory_store.get(client_id, {})
    return {
        'client_id': client_id,
        'minute_count': data.get('minute_count', 0),
        'hour_count': data.get('hour_count', 0),
        'storage': 'memory'
    }
