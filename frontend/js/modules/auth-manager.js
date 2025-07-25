// frontend/js/modules/auth-manager.js - Authentication Management
import { EventEmitter } from './utils/event-emitter.js';
import { Logger } from './utils/logger.js';
import { CONFIG } from '../config/config.js';

export class AuthManager extends EventEmitter {
    constructor() {
        super();
        this.currentUser = null;
        this.authStateInitialized = false;
        this.logger = new Logger('AuthManager');
        
        // Initialize Firebase auth state listener
        this.initAuthState();
    }

    /**
     * Initialize Firebase authentication state monitoring
     */
    initAuthState() {
        return new Promise((resolve) => {
            this.logger.info('Initializing authentication state...');
            
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                const wasInitialized = this.authStateInitialized;
                this.currentUser = user;
                this.authStateInitialized = true;

                if (user) {
                    this.logger.info(`User authenticated: ${user.uid}`);
                    this.handleUserAuthenticated(user);
                } else {
                    this.logger.info('User not authenticated');
                    this.handleUserSignedOut();
                }

                // Emit auth state change event
                this.emit('authStateChanged', { user, wasInitialized });

                if (!wasInitialized) {
                    resolve(user);
                }
            });

            // Store unsubscribe function for cleanup
            this.authUnsubscribe = unsubscribe;
        });
    }

    /**
     * Handle user authentication
     */
    async handleUserAuthenticated(user) {
        try {
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
        this.currentUser = null;
        this.emit('userSignedOut');
    }

    /**
     * Ensure user document exists in Firestore
     */
    async ensureUserDocument(user) {
        try {
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                this.logger.info(`Creating user document for: ${user.uid}`);
                
                await userRef.set({
                    email: user.email,
                    displayName: user.displayName || '',
                    photoURL: user.photoURL || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                    preferences: {
                        theme: 'light',
                        notifications: true,
                        language: 'en'
                    },
                    profile: {
                        onboardingCompleted: false,
                        supportStyle: null,
                        communicationPreferences: {}
                    }
                }, { merge: true });
            }
        } catch (error) {
            this.logger.error('Error ensuring user document:', error);
            throw error;
        }
    }

    /**
     * Update user's last active timestamp
     */
    async updateLastActive(userId) {
        try {
            const db = firebase.firestore();
            await db.collection('users').doc(userId).update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            this.logger.error('Error updating last active:', error);
        }
    }

    /**
     * Sign in with email and password
     */
    async signInWithEmail(email, password) {
        try {
            this.logger.info(`Attempting to sign in: ${email}`);
            
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            
            this.logger.info('Sign in successful');
            return result.user;
            
        } catch (error) {
            this.logger.error('Sign in error:', error);
            throw this.formatAuthError(error);
        }
    }

    /**
     * Create account with email and password
     */
    async createAccount(email, password, displayName = '') {
        try {
            this.logger.info(`Creating account: ${email}`);
            
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Update profile with display name
            if (displayName) {
                await result.user.updateProfile({ displayName });
            }
            
            this.logger.info('Account created successfully');
            return result.user;
            
        } catch (error) {
            this.logger.error('Account creation error:', error);
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
            this.logger.info('Sign out successful');
        } catch (error) {
            this.logger.error('Sign out error:', error);
            throw error;
        }
    }

    /**
     * Send password reset email
     */
    async resetPassword(email) {
        try {
            this.logger.info(`Sending password reset email: ${email}`);
            await firebase.auth().sendPasswordResetEmail(email);
            this.logger.info('Password reset email sent');
        } catch (error) {
            this.logger.error('Password reset error:', error);
            throw this.formatAuthError(error);
        }
    }

    /**
     * Send email verification
     */
    async sendEmailVerification() {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }

            await this.currentUser.sendEmailVerification();
            this.logger.info('Email verification sent');
        } catch (error) {
            this.logger.error('Email verification error:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData) {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }

            const db = firebase.firestore();
            const userRef = db.collection('users').doc(this.currentUser.uid);

            await userRef.update({
                ...profileData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.logger.info('Profile updated successfully');
            this.emit('profileUpdated', profileData);
            
        } catch (error) {
            this.logger.error('Profile update error:', error);
            throw error;
        }
    }

    /**
     * Get user profile data
     */
    async getUserProfile() {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }

            const db = firebase.firestore();
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();

            if (userDoc.exists) {
                return {
                    uid: this.currentUser.uid,
                    email: this.currentUser.email,
                    displayName: this.currentUser.displayName,
                    photoURL: this.currentUser.photoURL,
                    emailVerified: this.currentUser.emailVerified,
                    ...userDoc.data()
                };
            } else {
                // Return basic profile if document doesn't exist
                return {
                    uid: this.currentUser.uid,
                    email: this.currentUser.email,
                    displayName: this.currentUser.displayName,
                    photoURL: this.currentUser.photoURL,
                    emailVerified: this.currentUser.emailVerified
                };
            }
        } catch (error) {
            this.logger.error('Error fetching user profile:', error);
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
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
     * Cleanup resources
     */
    destroy() {
        if (this.authUnsubscribe) {
            this.authUnsubscribe();
        }
        this.removeAllListeners();
    }
}

// Export singleton instance
export const authManager = new AuthManager();
