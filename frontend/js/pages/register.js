// Registration Page Logic
import { translationManager } from '../modules/translation-manager.js';

/**
 * Initialize translation system and set up event listeners
 */
async function initTranslation() {
  try {
    await translationManager.preloadTranslations();
    translationManager.initLanguageSelector();
    await translationManager.updatePageLanguage();
    console.log('✅ Translation system initialized');
  } catch (error) {
    console.error('❌ Translation initialization failed:', error);
  }
}

/**
 * Set up translation event listeners for loading states
 */
function setupTranslationEventListeners() {
  translationManager.on('translationStart', () => {
    document.body.classList.add('translating');
  });

  translationManager.on('translationComplete', () => {
    document.body.classList.remove('translating');
  });
}

/**
 * Validate email format using regex
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Show message to user with appropriate styling
 * @param {string} message - Message text
 * @param {string} type - Message type ('error' or 'success')
 */
function showMessage(message, type) {
  const messageEl = document.getElementById('message');
  messageEl.className = `message ${type}`;
  messageEl.textContent = message;
  messageEl.style.display = 'block';
}

/**
 * Hide the message element
 */
function hideMessage() {
  const messageEl = document.getElementById('message');
  messageEl.style.display = 'none';
}

/**
 * Set loading state for the form
 * @param {boolean} isLoading - Whether to show loading state
 */
async function setLoadingState(isLoading) {
  const loadingEl = document.getElementById('loading');
  const submitButton = document.getElementById('register-button');
  
  if (isLoading) {
    loadingEl.style.display = 'block';
    submitButton.disabled = true;
    const pleaseWait = await translationManager.translateUI('please_wait');
    submitButton.textContent = pleaseWait || 'Please wait...';
    hideMessage();
  } else {
    loadingEl.style.display = 'none';
    submitButton.disabled = false;
    const registerText = await translationManager.translateUI('register_button');
    submitButton.textContent = registerText || 'Register';
  }
}

/**
 * Get error message based on Firebase auth error code
 * @param {string} errorCode - Firebase error code
 * @returns {Promise<string>} - Translated error message
 */
async function getErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return await translationManager.translateUI('error_email_in_use') || 'This email is already registered.';
    case 'auth/invalid-email':
      return await translationManager.translateUI('error_invalid_email') || 'Please enter a valid email address.';
    case 'auth/weak-password':
      return await translationManager.translateUI('error_weak_password') || 'Password must be at least 6 characters long.';
    default:
      return `Registration failed: ${errorCode}`;
  }
}

/**
 * Perform client-side validation of form inputs
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<string|null>} - Error message if validation fails, null if passes
 */
async function validateInputs(email, password) {
  if (password.length < 6) {
    const errorWeak = await translationManager.translateUI('error_weak_password');
    return errorWeak || 'Password must be at least 6 characters long.';
  }

  if (!isValidEmail(email)) {
    const errorInvalid = await translationManager.translateUI('error_invalid_email');
    return errorInvalid || 'Please enter a valid email address.';
  }

  return null;
}

/**
 * Create user profile in Firestore
 * @param {Object} user - Firebase user object
 * @param {string} name - User's display name
 * @param {boolean} isVeteran - Whether user is a veteran
 */
async function createUserProfile(user, name, isVeteran) {
  await firebase.firestore().collection("users").doc(user.uid).set({
    name: name,
    email: user.email,
    language: translationManager.getCurrentLanguage(),
    created_at: firebase.firestore.FieldValue.serverTimestamp(),
    emailVerified: user.emailVerified,
    onboardingComplete: false,
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
    isVeteran: isVeteran,
    subscription: 'free'
  });
}

/**
 * Handle the registration form submission
 * @param {Event} e - Form submit event
 */
async function handleRegistration(e) {
  e.preventDefault();
  
  // Get form values
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const name = document.getElementById('name').value.trim();
  const isVeteran = document.getElementById('veteran').checked;

  // Client-side validation
  const validationError = await validateInputs(email, password);
  if (validationError) {
    showMessage(validationError, 'error');
    return;
  }

  // Show loading state
  await setLoadingState(true);
  
  try {
    // Create user with Firebase Auth
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Update Firebase Auth profile with name
    await user.updateProfile({ displayName: name });

    // Save profile to Firestore
    await createUserProfile(user, name, isVeteran);
    
    // Send verification email
    try {
      await user.sendEmailVerification();
      console.log("✅ Verification email sent successfully!");
    } catch (emailError) {
      console.error("❌ Email verification failed:", emailError);
    }
    
    // Show success message
    const successMessage = await translationManager.translateUI('registration_success');
    showMessage(
      successMessage || 'Registration successful! Please check your email to verify before logging in.',
      'success'
    );
    
    // Clear form
    document.getElementById('register-form').reset();
    
    // Redirect to login page after 3 seconds
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3000);
    
  } catch (error) {
    // Handle registration errors
    const errorMessage = await getErrorMessage(error.code);
    showMessage(errorMessage, 'error');
    console.error('Registration error:', error);
  } finally {
    await setLoadingState(false);
  }
}

/**
 * Set up keyboard event handlers for better UX
 */
function setupKeyboardHandlers() {
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        document.getElementById('register-form').dispatchEvent(new Event('submit'));
      }
    });
  });
}

/**
 * Initialize the registration page
 */
async function initRegistrationPage() {
  // Initialize translation system
  await initTranslation();
  
  // Set up event listeners
  setupTranslationEventListeners();
  setupKeyboardHandlers();
  
  // Set up form submission handler
  document.getElementById('register-form').addEventListener('submit', handleRegistration);
  
  console.log('✅ Registration page initialized');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initRegistrationPage);
