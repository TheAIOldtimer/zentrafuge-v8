// js/auth.js - Clean Authentication Module for Zentrafuge
import { auth, db } from './config.js';

export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
    }

    // Initialize auth state monitoring
    init() {
        return new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                this.notifyAuthStateListeners(user);
                
                if (user) {
                    console.log('✅ User authenticated:', user.uid);
                    // Ensure user document exists
                    this.ensureUserDocument(user);
                } else {
                    console.log('❌ User not authenticated');
                }
                
                resolve(user);
            });
        });
    }

    // Add auth state listener
    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
    }

    // Notify all listeners of auth state changes
    notifyAuthStateListeners(user) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth state listener error:', error);
            }
        });
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get current user ID
    getCurrentUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Ensure user document exists in Firestore
    async ensureUserDocument(user) {
        try {
            const userRef = db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                console.log('Creating user document for:', user.uid);
                await userRef.set({
                    email: user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                    preferences: {
                        theme: 'light',
                        notifications: true
                    }
                }, { merge: true });
            } else {
                // Update last active
                await userRef.update({
                    lastActive: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error ensuring user document:', error);
        }
    }

    // Sign out user
    async signOut() {
        try {
            await firebase.auth().signOut();
            console.log('✅ User signed out successfully');
            
            // Redirect to login
            window.location.href = '/index.html';
        } catch (error) {
            console.error('❌ Sign out error:', error);
            throw error;
        }
    }

    // Get user profile data
    async getUserProfile() {
        if (!this.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            
            if (userDoc.exists) {
                return {
                    uid: this.currentUser.uid,
                    email: this.currentUser.email,
                    ...userDoc.data()
                };
            } else {
                // Return basic profile if document doesn't exist
                return {
                    uid: this.currentUser.uid,
                    email: this.currentUser.email
                };
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    // Update user profile
    async updateUserProfile(profileData) {
        if (!this.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const userRef = db.collection('users').doc(this.currentUser.uid);
            await userRef.update({
                ...profileData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ User profile updated');
        } catch (error) {
            console.error('❌ Error updating user profile:', error);
            throw error;
        }
    }

    // Redirect unauthenticated users
    requireAuth(redirectUrl = '/index.html') {
        if (!this.isAuthenticated()) {
            console.log('🔒 Authentication required, redirecting...');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
}

// Create and export singleton instance
export const authManager = new AuthManager();
