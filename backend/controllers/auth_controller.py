"""
Authentication Controller for Zentrafuge
Handles Firebase Auth integration, user verification, and session management
Separates business logic from route handlers
"""

from firebase_admin import auth, firestore
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

class AuthController:
    """
    Controller class for handling authentication operations
    """
    
    def __init__(self):
        """Initialize the AuthController with Firestore client"""
        self.db = firestore.client()
    
    def verify_firebase_token(self, id_token: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Verify Firebase ID token and return decoded token data
        
        Args:
            id_token (str): Firebase ID token to verify
            
        Returns:
            Tuple[bool, Optional[Dict], Optional[str]]: 
                (success, decoded_token_data, error_message)
        """
        try:
            decoded_token = auth.verify_id_token(id_token)
            return True, decoded_token, None
            
        except auth.InvalidIdTokenError:
            return False, None, "Invalid ID token"
        except auth.ExpiredIdTokenError:
            return False, None, "Expired ID token"
        except Exception as e:
            logging.error(f"Token verification error: {str(e)}")
            return False, None, "Authentication failed"
    
    def get_user_profile(self, uid: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Get user profile from Firestore
        
        Args:
            uid (str): User ID
            
        Returns:
            Tuple[bool, Optional[Dict], Optional[str]]: 
                (success, user_data, error_message)
        """
        try:
            user_doc = self.db.collection('users').document(uid).get()
            
            if not user_doc.exists:
                return False, None, "User not found in database"
            
            user_data = user_doc.to_dict()
            return True, user_data, None
            
        except Exception as e:
            logging.error(f"Error getting user profile: {str(e)}")
            return False, None, "Failed to retrieve user profile"
    
    def create_user_profile(self, user_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Create user profile in Firestore
        
        Args:
            user_data (Dict[str, Any]): User profile data
            
        Returns:
            Tuple[bool, Optional[str]]: (success, error_message)
        """
        try:
            required_fields = ['uid', 'email', 'name']
            
            if not all(field in user_data for field in required_fields):
                return False, "Missing required fields"
            
            uid = user_data['uid']
            
            # Verify the user exists in Firebase Auth
            try:
                auth.get_user(uid)
            except auth.UserNotFoundError:
                return False, "User not found in Firebase Auth"
            
            # Prepare user document
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
            
            # Save to Firestore
            self.db.collection('users').document(uid).set(profile_data)
            return True, None
            
        except Exception as e:
            logging.error(f"User creation error: {str(e)}")
            return False, "Failed to create user profile"
    
    def update_user_profile(self, uid: str, update_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Update user profile information
        
        Args:
            uid (str): User ID
            update_data (Dict[str, Any]): Data to update
            
        Returns:
            Tuple[bool, Optional[str]]: (success, error_message)
        """
        try:
            # Define allowed fields for update
            allowed_fields = ['name', 'language', 'onboardingComplete', 'isVeteran']
            filtered_data = {}
            
            for field in allowed_fields:
                if field in update_data:
                    filtered_data[field] = update_data[field]
            
            if not filtered_data:
                return False, "No valid fields to update"
            
            # Add timestamp
            filtered_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            # Update user document
            self.db.collection('users').document(uid).update(filtered_data)
            return True, None
            
        except Exception as e:
            logging.error(f"Profile update error: {str(e)}")
            return False, "Failed to update profile"
    
    def update_last_login(self, uid: str) -> Tuple[bool, Optional[str]]:
        """
        Update user's last login timestamp
        
        Args:
            uid (str): User ID
            
        Returns:
            Tuple[bool, Optional[str]]: (success, error_message)
        """
        try:
            self.db.collection('users').document(uid).update({
                'lastLogin': firestore.SERVER_TIMESTAMP
            })
            return True, None
            
        except Exception as e:
            logging.error(f"Last login update error: {str(e)}")
            return False, "Failed to update last login"
    
    def verify_and_get_user(self, id_token: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Verify token and return complete user information
        
        Args:
            id_token (str): Firebase ID token
            
        Returns:
            Tuple[bool, Optional[Dict], Optional[str]]: 
                (success, user_response_data, error_message)
        """
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
            self.update_last_login(uid)
            
            # Prepare response data (excluding sensitive information)
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
            
            return True, response_data, None
            
        except Exception as e:
            logging.error(f"Verify and get user error: {str(e)}")
            return False, None, "Authentication failed"
    
    def delete_user_account(self, uid: str) -> Tuple[bool, Optional[str]]:
        """
        Delete user account and all associated data (GDPR compliance)
        
        Args:
            uid (str): User ID
            
        Returns:
            Tuple[bool, Optional[str]]: (success, error_message)
        """
        try:
            # Delete all user data from Firestore
            # Delete messages
            messages_ref = self.db.collection('users').document(uid).collection('messages')
            messages = messages_ref.stream()
            for message in messages:
                message.reference.delete()
            
            # Delete memory data
            memory_ref = self.db.collection('users').document(uid).collection('memory')
            memory_docs = memory_ref.stream()
            for memory_doc in memory_docs:
                memory_doc.reference.delete()
            
            # Delete user profile
            self.db.collection('users').document(uid).delete()
            
            # Delete from Firebase Auth
            auth.delete_user(uid)
            
            return True, None
            
        except Exception as e:
            logging.error(f"Account deletion error: {str(e)}")
            return False, "Failed to delete account"
    
    def check_email_verification(self, uid: str) -> Tuple[bool, Optional[bool], Optional[str]]:
        """
        Check if user's email is verified and update database
        
        Args:
            uid (str): User ID
            
        Returns:
            Tuple[bool, Optional[bool], Optional[str]]: 
                (success, email_verified_status, error_message)
        """
        try:
            # Get latest user info from Firebase Auth
            user_record = auth.get_user(uid)
            email_verified = user_record.email_verified
            
            # Update Firestore with current email verification status
            self.db.collection('users').document(uid).update({
                'emailVerified': email_verified,
                'lastVerificationCheck': firestore.SERVER_TIMESTAMP
            })
            
            return True, email_verified, None
            
        except Exception as e:
            logging.error(f"Email verification check error: {str(e)}")
            return False, None, "Failed to check email verification"
    
    def get_user_statistics(self, uid: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Get basic user statistics for dashboard
        
        Args:
            uid (str): User ID
            
        Returns:
            Tuple[bool, Optional[Dict], Optional[str]]: 
                (success, stats_data, error_message)
        """
        try:
            # Get user profile
            success, user_data, error = self.get_user_profile(uid)
            if not success:
                return False, None, error
            
            # Count messages
            messages_ref = self.db.collection('users').document(uid).collection('messages')
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
            
            return True, stats, None
            
        except Exception as e:
            logging.error(f"User stats error: {str(e)}")
            return False, None, "Failed to get user statistics"
    
    def validate_user_exists_in_auth(self, uid: str) -> Tuple[bool, Optional[str]]:
        """
        Validate that a user exists in Firebase Auth
        
        Args:
            uid (str): User ID to validate
            
        Returns:
            Tuple[bool, Optional[str]]: (exists, error_message)
        """
        try:
            auth.get_user(uid)
            return True, None
        except auth.UserNotFoundError:
            return False, "User not found in Firebase Auth"
        except Exception as e:
            logging.error(f"User validation error: {str(e)}")
            return False, "Failed to validate user"
