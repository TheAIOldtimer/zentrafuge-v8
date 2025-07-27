// frontend/js/modules/auth-manager.js - Authentication Management
import { EventEmitter } from './utils/event-emitter.js';
import { Logger } from './utils/logger.js';
import { CONFIG } from '../config/config.js';

export class AuthManager extends EventEmitter {
    constructor() {
        super();
        this.currentUser = null;
        this.authStateInitialized = false;
        this.authUnsubscribe = null;
        this.isListenerRegistered = false; // FIXED: Prevent multiple listeners
        
        this.logger = new Logger('AuthManager');
        this.logger.info('AuthManager initialized');
    }

    /**
     * Initialize authentication system
     */
    async init() {
        try {
            this.logger.info('Initializing authentication...');
            
            // FIXED: Prevent multiple listener registration
            if (this.isListenerRegistered) {
                this.logger.warn('Auth listener already registered, skipping initialization');
                return;
            }

            this.setupAuthStateListener();
            this.isListenerRegistered = true;
            
            this.logger.info('Authentication system initialized');
        } catch (error) {
            this.logger.error('Failed to initialize authentication', error);
            throw error;
        }
    }

    /**
     * Set up Firebase auth state listener
     */
    setupAuthStateListener() {
        this.authUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
            this.logger.info('Auth state changed', { 
                userId: user ? user.uid : null,
                emailVerified: user ? user.emailVerified : null 
            });

            this.currentUser = user;
            this.authStateInitialized = true;

            this.emit('authStateChanged', { user });

            if (user) {
                this.handleUserAuthenticated(user);
            } else {
                this.handleUserSignedOut();
            }
        });
    }

    /**
     * Handle user authentication
     */
    async handleUserAuthenticated(user) {
        try {
            this.logger.info(`User authenticated: ${user.uid}`);
            
            // Ensure user document exists
            await this.ensureUserDocument(user);
            
            // Update last active timestamp
            await this.updateLastActive(user.uid);
            
            this.emit('userAuthenticated', user);
            
        } catch (error) {
            this.logger.error('Error handling user authentication:', error);
        }
    }

    /**
     * Handle user sign out
     */
    handleUserSignedOut() {
        this.logger.info('User signed out');
        this.emit('userSignedOut');
    }

    /**
     * Ensure user document exists in Firestore
     */
    async ensureUserDocument(user) {
        try {
            const userRef = firebase.firestore().collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                await userRef.set({
                    email: user.email,
                    emailVerified: user.emailVerified,
                    created_at: firebase.firestore.FieldValue.serverTimestamp(),
                    last_active: firebase.firestore.FieldValue.serverTimestamp(),
                    onboarding_complete: false
                });
                this.logger.info('User document created');
            }
        } catch (error) {
            this.logger.error('Error ensuring user document:', error);
        }
    }

    /**
     * Update last active timestamp
     */
    async updateLastActive(uid) {
        try {
            await firebase.firestore().collection('users').doc(uid).update({
                last_active: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            this.logger.error('Error updating last active:', error);
        }
    }

    /**
     * Sign in with email and password
     */
    async signInWithEmailAndPassword(email, password) {
        try {
            this.logger.info('Attempting email login', { email });
            
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            this.logger.info('Email login successful', { userId: user.uid });
            return user;
            
        } catch (error) {
            this.logger.error('Email login failed', error);
            throw this.formatAuthError(error);
        }
    }

    /**
     * Create user with email and password
     */
    async createUserWithEmailAndPassword(email, password) {
        try {
            this.logger.info('Creating user account', { email });
            
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Send email verification
            await user.sendEmailVerification();
            
            this.logger.info('User account created', { userId: user.uid });
            return user;
            
        } catch (error) {
            this.logger.error('User creation failed', error);
            throw this.formatAuthError(error);
        }
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            this.logger.info('Signing out user');
            await firebase.auth().signOut();
            this.logger.info('User signed out successfully');
        } catch (error) {
            this.logger.error('Sign out failed', error);
            throw error;
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email) {
        try {
            this.logger.info('Sending password reset email', { email });
            await firebase.auth().sendPasswordResetEmail(email);
            this.logger.info('Password reset email sent');
        } catch (error) {
            this.logger.error('Password reset failed', error);
            throw this.formatAuthError(error);
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }

    /**
     * Check if user is anonymous
     */
    isAnonymous() {
        return this.currentUser ? this.currentUser.isAnonymous : false;
    }

    /**
     * Check if user needs authentication
     */
    needsAuth() {
        return !this.currentUser;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }

    /**
     * Require authentication (redirect if not authenticated)
     */
    requireAuth(redirectUrl = '/index.html') {
        if (!this.isAuthenticated()) {
            this.logger.info('Authentication required, redirecting...');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    /**
     * Wait for auth state to be initialized
     */
    async waitForAuth() {
        if (this.authStateInitialized) {
            return this.currentUser;
        }

        return new Promise((resolve) => {
            const unsubscribe = this.on('authStateChanged', ({ user }) => {
                unsubscribe();
                resolve(user);
            });
        });
    }

    /**
     * Format authentication errors for user display
     */
    formatAuthError(error) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/user-disabled': 'This account has been disabled.',
        };

        return new Error(errorMessages[error.code] || error.message);
    }

    /**
     * Check onboarding status
     */
    async checkOnboardingStatus(uid) {
        try {
            const doc = await firebase.firestore().collection('users').doc(uid).get();
            return doc.exists && doc.data().onboarding_complete === true;
        } catch (err) {
            this.logger.error('Failed to check onboarding status:', err);
            return false;
        }
    }

    /**
     * Update onboarding status
     */
    async updateOnboardingStatus(uid, completed = true) {
        try {
            await firebase.firestore().collection('users').doc(uid).update({
                onboarding_complete: completed,
                onboarding_completed_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            this.logger.info('Onboarding status updated', { uid, completed });
        } catch (error) {
            this.logger.error('Failed to update onboarding status:', error);
            throw error;
        }
    }

    /**
     * Get user profile data
     */
    async getUserProfile() {
        if (!this.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const userDoc = await firebase.firestore().collection('users').doc(this.currentUser.uid).get();
            
            if (userDoc.exists) {
                return {
                    uid: this.currentUser.uid,
                    email: this.currentUser.email,
                    emailVerified: this.currentUser.emailVerified,
                    ...userDoc.data()
                };
            } else {
                return {
                    uid: this.currentUser.uid,
                    email: this.currentUser.email,
                    emailVerified: this.currentUser.emailVerified
                };
            }
        } catch (error) {
            this.logger.error('Error fetching user profile:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(profileData) {
        if (!this.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const userRef = firebase.firestore().collection('users').doc(this.currentUser.uid);
            await userRef.update({
                ...profileData,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.logger.info('User profile updated');
        } catch (error) {
            this.logger.error('Error updating user profile:', error);
            throw error;
        }
    }

    /**
     * Cleanup resources - FIXED: Add proper cleanup
     */
    destroy() {
        if (this.authUnsubscribe) {
            this.authUnsubscribe();
            this.authUnsubscribe = null;
        }
        this.isListenerRegistered = false;
        this.removeAllListeners();
        this.logger.info('AuthManager destroyed');
    }
}

// Export singleton instance
export const authManager = new AuthManager();
