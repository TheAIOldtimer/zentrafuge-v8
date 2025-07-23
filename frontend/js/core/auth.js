import { redirectToAuth, showAlert } from './ui.js';
import { 
  currentUser, setCurrentUser, isAuthorized, setIsAuthorized, 
  isInitializing, setIsInitializing, aiName, setAiName,
  DEFAULT_PREFERENCES 
} from './config.js';
import { getAiName } from './chat.js';
import { renderMoodChart } from './mood.js';
import { loadUserPreferences, loadPreferencesIntoForm } from './preferences.js';
import { loadPreviousMessages } from './chat.js';

// Global auth state management
let authStateListener = null;
let isAuthInitialized = false;
let authPromiseResolve = null;
let authPromise = null;

export async function waitForFirebase() {
  console.log('🔍 Waiting for Firebase SDK to load...');
  
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined' || !firebase.apps.length) {
    console.error('❌ Firebase SDK not loaded or initialized');
    throw new Error('Firebase SDK not loaded or initialized');
  }
  
  // If auth is already initialized, return immediately
  if (isAuthInitialized) {
    console.log('✅ Firebase auth already initialized');
    return Promise.resolve();
  }
  
  // If we're already waiting for auth, return the existing promise
  if (authPromise) {
    console.log('⏳ Already waiting for Firebase auth...');
    return authPromise;
  }
  
  // Create new auth initialization promise
  authPromise = new Promise((resolve, reject) => {
    authPromiseResolve = resolve;
    
    // Set up auth state listener ONCE
    if (!authStateListener) {
      console.log('🔑 Setting up auth state listener...');
      
      authStateListener = firebase.auth().onAuthStateChanged(
        (user) => {
          console.log('🔄 Auth state changed:', user ? `User: ${user.uid}` : 'No user');
          
          if (!isAuthInitialized) {
            isAuthInitialized = true;
            console.log('✅ Firebase auth state resolved');
            resolve();
          }
          
          // Handle auth state change
          handleAuthStateChange(user);
        },
        (error) => {
          console.error('❌ Firebase auth initialization error:', error);
          if (!isAuthInitialized) {
            isAuthInitialized = true;
            reject(error);
          }
        }
      );
    }
    
    // Fallback timeout
    setTimeout(() => {
      if (!isAuthInitialized) {
        console.warn('⚠️ Firebase auth initialization timeout');
        isAuthInitialized = true;
        resolve();
      }
    }, 5000);
  });
  
  return authPromise;
}

/**
 * Handle auth state changes - called by the single listener
 */
async function handleAuthStateChange(user) {
  try {
    const t = window.zentrafugeIntl?.translations[window.zentrafugeIntl?.selectedLanguage] || {
      verifyEmail: 'Please verify your email before logging in.',
      onboardingIncomplete: 'Please complete onboarding to access the app.',
      loginFailed: 'Failed to log in. Please try again.',
      welcomeBack: 'Welcome back! Redirecting to chat...'
    };

    if (user) {
      try {
        console.log('🔍 Checking user authorization...');
        const isAuthorizedResult = await checkUserAuthorization(user);
        
        if (!isAuthorizedResult) {
          console.log('❌ User not authorized, redirecting to login');
          showAlert(
            user.emailVerified ? t.onboardingIncomplete : t.verifyEmail,
            'error'
          );
          await firebase.auth().signOut();
          redirectToAuth(user.emailVerified ? 'onboarding_incomplete' : 'email_not_verified');
          return;
        }

        console.log('✅ User authorized');
        await initializeApp(user);
        
        if (window.location.pathname.includes('index.html')) {
          console.log('➡️ On index.html, redirecting to chat.html');
          showAlert(t.welcomeBack, 'success');
          setTimeout(() => {
            window.location.assign('/chat.html');
          }, 1500);
        }
      } catch (err) {
        console.error('❌ Auth check failed:', err);
        showAlert(t.loginFailed, 'error');
        await firebase.auth().signOut();
        redirectToAuth('auth_check_failed');
      }
    } else {
      console.log('🔄 No user signed in');
      if (!window.location.pathname.includes('index.html')) {
        redirectToAuth('no_user');
      }
    }
  } catch (error) {
    console.error('❌ Error in handleAuthStateChange:', error);
  }
}

export async function checkUserAuthorization(user) {
  console.log('🔍 === AUTHORIZATION CHECK START ===');
  try {
    if (!user) {
      console.warn('❌ No user provided to checkUserAuthorization');
      throw new Error('No user provided');
    }

    if (!user.emailVerified) {
      console.warn(`❌ Authorization failed for ${user.email}: Email not verified in Firebase Auth`);
      throw new Error('Email not verified');
    }

    console.log(`✅ Email verified in Firebase Auth for ${user.email}`);

    if (user.email === 'buyartbyant@gmail.com') {
      console.log('✅ Bypassing Firestore check for buyartbyant@gmail.com');
      return true;
    }

    const db = firebase.firestore();
    let userDoc;
    let userData = null;

    try {
      userDoc = await db.collection("users").doc(user.uid).get();
      if (userDoc.exists) {
        userData = userDoc.data();
        console.log(`✅ Found user document in Firestore for ${user.email}:`, userData);
      } else {
        console.warn(`⚠️ User document not found in Firestore for ${user.email}, creating new document`);
        await db.collection("users").doc(user.uid).set({
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName || 'User',
          onboardingComplete: true,
          ai_name: 'Cael',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          ai_preferences: DEFAULT_PREFERENCES
        });
        console.log(`✅ Created user document for ${user.email}`);
        userData = { onboardingComplete: true, ai_name: 'Cael', ai_preferences: DEFAULT_PREFERENCES };
      }
    } catch (firestoreError) {
      console.warn(`⚠️ Firestore access failed for ${user.email}:`, firestoreError.message);
    }

    if (userData && !userData.onboardingComplete) {
      console.warn(`❌ Authorization failed for ${user.email}: Onboarding not completed`);
      throw new Error('Onboarding not completed');
    }

    if (userData) {
      console.log(`✅ Full authorization succeeded for ${user.email} with Firestore data`);
    } else {
      console.log(`✅ Basic authorization succeeded for ${user.email} with Firebase Auth only`);
    }

    return true;
  } catch (error) {
    console.error('❌ Authorization check failed:', error.message, error.stack);
    return false;
  } finally {
    console.log('🔍 === AUTHORIZATION CHECK END ===');
  }
}

export async function initializeApp(user) {
  if (isInitializing) {
    console.warn('⚠️ Already initializing, skipping...');
    return;
  }
  setIsInitializing(true);
  try {
    console.log('🚀 Starting app initialization for user:', user.email);
    
    setCurrentUser(user);
    setIsAuthorized(true);
    setAiName(await getAiName(user.uid));
    console.log(`🎭 Setting AI name to: ${aiName}`);
    
    const isDashboard = window.location.pathname.includes('dashboard.html');
    const isPreferences = window.location.pathname.includes('preferences.html');
    const isChatPage = window.location.pathname.includes('chat.html');
    const pageTitle = isDashboard ? 'Dashboard' : isPreferences ? 'Preferences' : aiName;
    document.title = `Zentrafuge × ${pageTitle}`;
    
    const headerImg = document.querySelector('header img');
    if (headerImg) {
      headerImg.setAttribute('onerror', 
        `this.style.display='none'; this.insertAdjacentHTML('afterend', '<h1>Zentrafuge × ${pageTitle}</h1>');`
      );
    }
    
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
      userInfo.textContent = `Welcome, ${user.displayName || user.email}`;
    }
    
    const authLoading = document.getElementById('auth-loading');
    if (authLoading) {
      console.log('🎯 Hiding auth loading screen');
      authLoading.style.display = 'none';
    }
    
    const mainHeader = document.getElementById('main-header');
    if (mainHeader) {
      console.log('🎯 Showing main header');
      mainHeader.style.display = 'flex';
    }
    
    const contentDiv = document.getElementById(isDashboard ? 'dashboard' : isPreferences ? 'preferences' : 'chat-container');
    if (contentDiv) {
      console.log(`🎯 Showing ${isDashboard ? 'dashboard' : isPreferences ? 'preferences' : 'chat'} container`);
      contentDiv.style.display = 'flex';
    }
    
    if (isDashboard) {
      await renderMoodChart(user.uid);
    } else if (isPreferences) {
      await loadUserPreferences();
      loadPreferencesIntoForm();
    } else if (isChatPage) {
      const chatForm = document.getElementById('chat-form');
      if (chatForm) {
        console.log('🎯 Showing chat form');
        chatForm.style.display = 'flex';
        chatForm.setAttribute('aria-label', `Ask ${aiName} something`);
        const messageInput = document.getElementById('message');
        if (messageInput) {
          messageInput.placeholder = `Ask ${aiName} something...`;
          messageInput.focus();
        }
      }
      await loadPreviousMessages();
      
      sessionStorage.setItem('session_start', Date.now());
      setSessionWarningShown(false);
      
      if (sessionDurationInterval) {
        clearInterval(sessionDurationInterval);
      }
      
      setSessionDurationInterval(setInterval(checkSessionDuration, 60000));
    }
    
    console.log('✅ App initialization completed successfully');
  } catch (error) {
    console.error('❌ Error initializing app:', error.message, error.stack);
    redirectToAuth('initialization_failed');
  } finally {
    setIsInitializing(false);
  }
}

export async function handleLogout() {
  try {
    await firebase.auth().signOut();
    window.location.assign('index.html');
  } catch (error) {
    console.error('❌ Logout error:', error);
    showAlert('Error signing out. Please try again.', 'error');
  }
}

export function generateUniqueUserId() {
  return currentUser ? currentUser.uid : `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getUserId() {
  if (!currentUser || !currentUser.uid) {
    console.error('❌ No authenticated user found');
    throw new Error('User not authenticated');
  }
  return currentUser.uid;
}

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
  return firebase.auth().currentUser;
}

/**
 * Wait for user to be authenticated
 */
export function waitForUser() {
  return new Promise((resolve) => {
    const user = firebase.auth().currentUser;
    if (user) {
      resolve(user);
    } else {
      const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
    }
  });
}

/**
 * Clean up auth listeners (call on app shutdown)
 */
export function cleanupAuth() {
  if (authStateListener) {
    authStateListener();
    authStateListener = null;
  }
  isAuthInitialized = false;
  authPromise = null;
  authPromiseResolve = null;
}
