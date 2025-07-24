"""
Authentication Controller - FIXED Firebase initialization
"""

from firebase_admin import auth, firestore
import logging
from typing import Dict, Any, Optional, Tuple

class AuthController:
    """Authentication controller with proper Firebase initialization"""
    
    def __init__(self):
        """Initialize without creating Firestore client"""
        pass
    
    def get_db(self):
        """Get Firestore client when needed"""
        return firestore.client()
    
    def verify_firebase_token(self, id_token: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """Verify Firebase ID token"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return True, decoded_token, None
        except Exception as e:
            logging.error(f"Token verification error: {str(e)}")
            return False, None, "Authentication failed"
    
    def get_user_profile(self, uid: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """Get user profile from Firestore"""
        try:
            db = self.get_db()
            user_doc = db.collection('users').document(uid).get()
            
            if not user_doc.exists:
                return False, None, "User not found"
            
            return True, user_doc.to_dict(), None
        except Exception as e:
            logging.error(f"Error getting user profile: {str(e)}")
            return False, None, "Failed to retrieve user profile"
    
    def create_user_profile(self, user_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Create user profile in Firestore"""
        try:
            required_fields = ['uid', 'email', 'name']
            if not all(field in user_data for field in required_fields):
                return False, "Missing required fields"
            
            uid = user_data['uid']
            
            # Verify user exists in Firebase Auth
            try:
                auth.get_user(uid)
            except auth.UserNotFoundError:
                return False, "User not found in Firebase Auth"
            
            profile_data = {
                'name': user_data['name'],
                'email': user_data['email'],
                'language': user_data.get('language', 'en'),
                'created_at': firestore.SERVER_TIMESTAMP,
                'emailVerified': user_data.get('emailVerified', False),
                'onboardingComplete': False,
                'lastLogin': firestore.SERVER_TIMESTAMP,
                'isVeteran': user_data.get('isVeteran', False),
                'subscription': 'free'
            }
            
            db = self.get_db()
            db.collection('users').document(uid).set(profile_data)
            return True, None
            
        except Exception as e:
            logging.error(f"User creation error: {str(e)}")
            return False, "Failed to create user profile"
    
    def verify_and_get_user(self, id_token: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """Verify token and return complete user information"""
        try:
            # Verify token
            success, decoded_token, error = self.verify_firebase_token(id_token)
            if not success:
                return False, None, error
            
            uid = decoded_token['uid']
            
            # Get user profile
            success, user_data, error = self.get_user_profile(uid)
            if not success:
                return False, None, error
            
            # Update last login
            db = self.get_db()
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
            
    def update_user_profile(self, uid: str, update_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Update user profile information"""
        try:
            allowed_fields = ['name', 'language', 'onboardingComplete', 'isVeteran']
            filtered_data = {}
            
            for field in allowed_fields:
                if field in update_data:
                    filtered_data[field] = update_data[field]
            
            if not filtered_data:
                return False, "No valid fields to update"
            
            filtered_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            db = self.get_db()
            db.collection('users').document(uid).update(filtered_data)
            return True, None
            
        except Exception as e:
            logging.error(f"Profile update error: {str(e)}")
            return False, "Failed to update profile"
    
    def delete_user_account(self, uid: str) -> Tuple[bool, Optional[str]]:
        """Delete user account and all associated data (GDPR compliance)"""
        try:
            db = self.get_db()
            
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
            
            return True, None
            
        except Exception as e:
            logging.error(f"Account deletion error: {str(e)}")
            return False, "Failed to delete account"
    
    def check_email_verification(self, uid: str) -> Tuple[bool, Optional[bool], Optional[str]]:
        """Check if user's email is verified and update database"""
        try:
            user_record = auth.get_user(uid)
            email_verified = user_record.email_verified
            
            db = self.get_db()
            db.collection('users').document(uid).update({
                'emailVerified': email_verified,
                'lastVerificationCheck': firestore.SERVER_TIMESTAMP
            })
            
            return True, email_verified, None
            
        except Exception as e:
            logging.error(f"Email verification check error: {str(e)}")
            return False, None, "Failed to check email verification"
    
    def get_user_statistics(self, uid: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """Get basic user statistics for dashboard"""
        try:
            success, user_data, error = self.get_user_profile(uid)
            if not success:
                return False, None, error
            
            db = self.get_db()
            messages_ref = db.collection('users').document(uid).collection('messages')
            message_count = len(list(messages_ref.stream()))
            
            from datetime import datetime
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
            
            return True, stats, None
            
        except Exception as e:
            logging.error(f"User stats error: {str(e)}")
            return False, None, "Failed to get user statistics"
    
    def update_last_login(self, uid: str) -> Tuple[bool, Optional[str]]:
        """Update user's last login timestamp"""
        try:
            db = self.get_db()
            db.collection('users').document(uid).update({
                'lastLogin': firestore.SERVER_TIMESTAMP
            })
            return True, None
        except Exception as e:
            logging.error(f"Last login update error: {str(e)}")
            return False, "Failed to update last login"
    
    def validate_user_exists_in_auth(self, uid: str) -> Tuple[bool, Optional[str]]:
        """Validate that a user exists in Firebase Auth"""
        try:
            auth.get_user(uid)
            return True, None
        except auth.UserNotFoundError:
            return False, "User not found in Firebase Auth"
        except Exception as e:
            logging.error(f"User validation error: {str(e)}")
            return False, "Failed to validate user"
