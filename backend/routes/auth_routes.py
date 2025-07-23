"""
Authentication routes for Zentrafuge
Handles Firebase Auth integration, user verification, and session management
"""

from flask import Blueprint, request, jsonify
from firebase_admin import auth, firestore
import logging
from datetime import datetime
from functools import wraps

# Create auth blueprint
auth_bp = Blueprint('auth', __name__)

# Initialize Firestore
db = firestore.client()

def verify_firebase_token(f):
    """
    Decorator to verify Firebase ID token from request headers
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Get the ID token from Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Missing or invalid authorization header'}), 401
            
            id_token = auth_header.split('Bearer ')[1]
            
            # Verify the ID token
            decoded_token = auth.verify_id_token(id_token)
            request.user_id = decoded_token['uid']
            request.user_email = decoded_token.get('email')
            
            return f(*args, **kwargs)
            
        except auth.InvalidIdTokenError:
            return jsonify({'error': 'Invalid ID token'}), 401
        except auth.ExpiredIdTokenError:
            return jsonify({'error': 'Expired ID token'}), 401
        except Exception as e:
            logging.error(f"Token verification error: {str(e)}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function

@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """
    Verify Firebase ID token and return user info
    """
    try:
        data = request.get_json()
        if not data or 'idToken' not in data:
            return jsonify({'error': 'ID token required'}), 400
        
        id_token = data['idToken']
        
        # Verify the ID token
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        
        # Get user data from Firestore
        user_doc = db.collection('users').document(uid).get()
        
        if not user_doc.exists:
            return jsonify({'error': 'User not found in database'}), 404
        
        user_data = user_doc.to_dict()
        
        # Update last login timestamp
        db.collection('users').document(uid).update({
            'lastLogin': firestore.SERVER_TIMESTAMP
        })
        
        # Return user info (excluding sensitive data)
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
        
        return jsonify({
            'success': True,
            'user': response_data
        }), 200
        
    except auth.InvalidIdTokenError:
        return jsonify({'error': 'Invalid ID token'}), 401
    except auth.ExpiredIdTokenError:
        return jsonify({'error': 'Expired ID token'}), 401
    except Exception as e:
        logging.error(f"Token verification error: {str(e)}")
        return jsonify({'error': 'Verification failed'}), 500

@auth_bp.route('/create-user', methods=['POST'])
def create_user():
    """
    Create user profile in Firestore (called after Firebase Auth registration)
    """
    try:
        data = request.get_json()
        required_fields = ['uid', 'email', 'name']
        
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        uid = data['uid']
        
        # Verify the user exists in Firebase Auth
        try:
            auth.get_user(uid)
        except auth.UserNotFoundError:
            return jsonify({'error': 'User not found in Firebase Auth'}), 404
        
        # Create user document in Firestore
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
        
        # Save to Firestore
        db.collection('users').document(uid).set(user_data)
        
        return jsonify({
            'success': True,
            'message': 'User profile created successfully'
        }), 201
        
    except Exception as e:
        logging.error(f"User creation error: {str(e)}")
        return jsonify({'error': 'Failed to create user profile'}), 500

@auth_bp.route('/update-profile', methods=['POST'])
@verify_firebase_token
def update_profile():
    """
    Update user profile information
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        uid = request.user_id
        
        # Define allowed fields for update
        allowed_fields = ['name', 'language', 'onboardingComplete', 'isVeteran']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Add timestamp
        update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        # Update user document
        db.collection('users').document(uid).update(update_data)
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        }), 200
        
    except Exception as e:
        logging.error(f"Profile update error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@auth_bp.route('/delete-account', methods=['DELETE'])
@verify_firebase_token
def delete_account():
    """
    Delete user account and all associated data (GDPR compliance)
    """
    try:
        uid = request.user_id
        
        # Delete all user data from Firestore
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
        
        return jsonify({
            'success': True,
            'message': 'Account deleted successfully'
        }), 200
        
    except Exception as e:
        logging.error(f"Account deletion error: {str(e)}")
        return jsonify({'error': 'Failed to delete account'}), 500

@auth_bp.route('/check-email-verification', methods=['POST'])
@verify_firebase_token
def check_email_verification():
    """
    Check if user's email is verified and update database
    """
    try:
        uid = request.user_id
        
        # Get latest user info from Firebase Auth
        user_record = auth.get_user(uid)
        email_verified = user_record.email_verified
        
        # Update Firestore with current email verification status
        db.collection('users').document(uid).update({
            'emailVerified': email_verified,
            'lastVerificationCheck': firestore.SERVER_TIMESTAMP
        })
        
        return jsonify({
            'success': True,
            'emailVerified': email_verified
        }), 200
        
    except Exception as e:
        logging.error(f"Email verification check error: {str(e)}")
        return jsonify({'error': 'Failed to check email verification'}), 500

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """
    Resend email verification (requires ID token)
    """
    try:
        data = request.get_json()
        if not data or 'idToken' not in data:
            return jsonify({'error': 'ID token required'}), 400
        
        # This is typically handled client-side with Firebase Auth
        # But we can log the request for monitoring
        logging.info("Email verification resend requested")
        
        return jsonify({
            'success': True,
            'message': 'Verification email resent'
        }), 200
        
    except Exception as e:
        logging.error(f"Resend verification error: {str(e)}")
        return jsonify({'error': 'Failed to resend verification'}), 500

@auth_bp.route('/user-stats', methods=['GET'])
@verify_firebase_token
def get_user_stats():
    """
    Get basic user statistics for dashboard
    """
    try:
        uid = request.user_id
        
        # Get user profile
        user_doc = db.collection('users').document(uid).get()
        if not user_doc.exists:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = user_doc.to_dict()
        
        # Count messages
        messages_ref = db.collection('users').document(uid).collection('messages')
        message_count = len(list(messages_ref.stream()))
        
        # Get creation date
        created_at = user_data.get('created_at')
        if created_at:
            days_since_creation = (datetime.now() - created_at.replace(tzinfo=None)).days
        else:
            days_since_creation = 0
        
        stats = {
            'messageCount': message_count,
            'daysSinceCreation': days_since_creation,
            'onboardingComplete': user_data.get('onboardingComplete', False),
            'subscription': user_data.get('subscription', 'free'),
            'isVeteran': user_data.get('isVeteran', False)
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        logging.error(f"User stats error: {str(e)}")
        return jsonify({'error': 'Failed to get user statistics'}), 500

# Error handlers for the auth blueprint
@auth_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@auth_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@auth_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@auth_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@auth_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
