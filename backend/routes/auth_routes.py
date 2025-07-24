"""
Authentication routes for Zentrafuge - FIXED Firebase initialization
"""

from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore
import logging
from functools import wraps

# Create auth blueprint
auth_bp = Blueprint('auth', __name__)

def get_db():
    """Get Firestore client - called when needed, not at import"""
    return firestore.client()

def verify_firebase_token(f):
    """Decorator to verify Firebase ID token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Missing authorization header'}), 401
            
            id_token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(id_token)
            request.user_id = decoded_token['uid']
            request.user_email = decoded_token.get('email')
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logging.error(f"Token verification error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify Firebase ID token and return user info"""
    try:
        data = request.get_json()
        if not data or 'idToken' not in data:
            return jsonify({'error': 'ID token required'}), 400
        
        id_token = data['idToken']
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        
        # Get DB when needed
        db = get_db()
        user_doc = db.collection('users').document(uid).get()
        
        if not user_doc.exists:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = user_doc.to_dict()
        
        # Update last login
        db.collection('users').document(uid).update({
            'lastLogin': firestore.SERVER_TIMESTAMP
        })
        
        response_data = {
            'uid': uid,
            'email': decoded_token.get('email'),
            'emailVerified': decoded_token.get('email_verified', False),
            'name': user_data.get('name'),
            'onboardingComplete': user_data.get('onboardingComplete', False),
            'isVeteran': user_data.get('isVeteran', False),
            'subscription': user_data.get('subscription', 'free'),
            'language': user_data.get('language', 'en')
        }
        
        return jsonify({'success': True, 'user': response_data}), 200
        
    except Exception as e:
        logging.error(f"Token verification error: {str(e)}")
        return jsonify({'error': 'Verification failed'}), 500

@auth_bp.route('/create-user', methods=['POST'])
def create_user():
    """Create user profile in Firestore"""
    try:
        data = request.get_json()
        required_fields = ['uid', 'email', 'name']
        
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        uid = data['uid']
        
        # Verify user exists in Firebase Auth
        try:
            auth.get_user(uid)
        except auth.UserNotFoundError:
            return jsonify({'error': 'User not found in Firebase Auth'}), 404
        
        user_data = {
            'name': data['name'],
            'email': data['email'],
            'language': data.get('language', 'en'),
            'created_at': firestore.SERVER_TIMESTAMP,
            'emailVerified': data.get('emailVerified', False),
            'onboardingComplete': False,
            'lastLogin': firestore.SERVER_TIMESTAMP,
            'isVeteran': data.get('isVeteran', False),
            'subscription': 'free'
        }
        
        db = get_db()
        db.collection('users').document(uid).set(user_data)
        
        return jsonify({'success': True, 'message': 'User profile created'}), 201
        
    except Exception as e:
        logging.error(f"User creation error: {str(e)}")
        return jsonify({'error': 'Failed to create user profile'}), 500

@auth_bp.route('/update-profile', methods=['POST'])
@verify_firebase_token
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        uid = request.user_id
        allowed_fields = ['name', 'language', 'onboardingComplete', 'isVeteran']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        db = get_db()
        db.collection('users').document(uid).update(update_data)
        
        return jsonify({'success': True, 'message': 'Profile updated'}), 200
        
    except Exception as e:
        logging.error(f"Profile update error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@auth_bp.route('/delete-account', methods=['DELETE'])
@verify_firebase_token
def delete_account():
    """Delete user account and all data (GDPR compliance)"""
    try:
        uid = request.user_id
        db = get_db()
        
        # Delete all user data
        # Delete messages
        messages_ref = db.collection('users').document(uid).collection('messages')
        messages = messages_ref.stream()
        for message in messages:
            message.reference.delete()
        
        # Delete memory data
        memory_ref = db.collection('users').document(uid).collection('memory')
        memory_docs = memory_ref.stream()
        for memory_doc in memory_docs:
            memory_doc.reference.delete()
        
        # Delete user profile
        db.collection('users').document(uid).delete()
        
        # Delete from Firebase Auth
        auth.delete_user(uid)
        
        return jsonify({'success': True, 'message': 'Account deleted'}), 200
        
    except Exception as e:
        logging.error(f"Account deletion error: {str(e)}")
        return jsonify({'error': 'Failed to delete account'}), 500

@auth_bp.route('/check-email-verification', methods=['POST'])
@verify_firebase_token
def check_email_verification():
    """Check if user's email is verified"""
    try:
        uid = request.user_id
        user_record = auth.get_user(uid)
        email_verified = user_record.email_verified
        
        db = get_db()
        db.collection('users').document(uid).update({
            'emailVerified': email_verified,
            'lastVerificationCheck': firestore.SERVER_TIMESTAMP
        })
        
        return jsonify({'success': True, 'emailVerified': email_verified}), 200
        
    except Exception as e:
        logging.error(f"Email verification check error: {str(e)}")
        return jsonify({'error': 'Failed to check email verification'}), 500

@auth_bp.route('/health', methods=['GET'])
def auth_health():
    """Auth service health check"""
    return jsonify({'status': 'ok', 'service': 'zentrafuge-auth'}), 200
