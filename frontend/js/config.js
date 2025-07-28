// frontend/js/config.js

// Backend configuration
export const BACKEND_URL = 'https://zentrafuge-v8-backend.render.com';

// Firebase configuration (replace with your actual config)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// User preferences defaults - UPDATED with AI name support
export const DEFAULT_PREFERENCES = {
  ai_name: 'Cael',                    // NEW: AI companion name
  language_style: 'direct',           // direct, warm, formal, casual
  response_length: 'moderate',        // brief, moderate, detailed
  military_context: 'auto',           // auto, always, never
  emotional_pacing: 'gentle',         // gentle, moderate, direct
  memory_usage: 'contextual',         // contextual, minimal, detailed
  session_reminders: 'gentle'         // gentle, regular, minimal
};

// Current user state
export let currentUser = null;
export let userPreferences = { ...DEFAULT_PREFERENCES };

// User state management
export function setCurrentUser(user) {
  currentUser = user;
  console.log('👤 Current user set:', user ? user.email : 'None');
}

export function setUserPreferences(preferences) {
  userPreferences = { ...DEFAULT_PREFERENCES, ...preferences };
  console.log('⚙️ User preferences updated:', userPreferences);
}

export function getCurrentUser() {
  return currentUser;
}

export function getUserPreferences() {
  return userPreferences;
}

// Chat configuration
export const CHAT_CONFIG = {
  maxMessageLength: 2000,
  maxHistoryItems: 50,
  autoSaveDelay: 1000,
  typingIndicatorDelay: 500,
  retryAttempts: 3,
  retryDelay: 1000
};

// API endpoints
export const API_ENDPOINTS = {
  CHAT: '/index',
  FEEDBACK: '/feedback',
  CAPTURE_REPLY: '/capture-reply',
  UPDATE_AI_NAME: '/update-ai-name',
  HEALTH: '/health',
  LEARNING_STATS: '/learning-stats',
  DEBUG_PROMPT: '/debug/prompt'
};

// Validation rules
export const VALIDATION_RULES = {
  AI_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9\s\-_']+$/,
    ERROR_MESSAGES: {
      REQUIRED: 'AI companion name is required',
      TOO_LONG: 'Name must be 50 characters or less',
      INVALID_CHARS: 'Name can only contain letters, numbers, spaces, hyphens, underscores, and apostrophes'
    }
  },
  MESSAGE: {
    MAX_LENGTH: 2000,
    ERROR_MESSAGES: {
      TOO_LONG: 'Message must be 2000 characters or less',
      EMPTY: 'Message cannot be empty'
    }
  }
};

// Feature flags
export const FEATURES = {
  LEARNING_ENABLED: true,
  MEMORY_ENABLED: true,
  EMOTION_PARSING: true,
  ADAPTIVE_RESPONSES: true,
  USER_FEEDBACK: true,
  DEBUG_MODE: false,
  AI_NAME_CUSTOMIZATION: true    // NEW: Enable AI name customization
};

// UI configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 3000,
  LOADING_DELAY: 200,
  AUTO_SCROLL_DELAY: 100,
  MESSAGE_FADE_DURATION: 200
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  AUTH_REQUIRED: 'Please log in to continue.',
  INVALID_INPUT: 'Invalid input provided.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  AI_NAME_UPDATE_FAILED: 'Failed to update AI companion name. Please try again.',
  PREFERENCES_SAVE_FAILED: 'Failed to save preferences. Please try again.',
  CHAT_ERROR: 'Failed to send message. Please try again.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  PREFERENCES_SAVED: 'Preferences saved successfully!',
  AI_NAME_UPDATED: 'AI companion name updated successfully!',
  FEEDBACK_SUBMITTED: 'Feedback submitted successfully!',
  ACCOUNT_CREATED: 'Account created successfully!',
  EMAIL_VERIFIED: 'Email verified successfully!'
};

// Theme configuration
export const THEME_CONFIG = {
  PRIMARY_COLOR: '#007bff',
  SECONDARY_COLOR: '#6c757d',
  SUCCESS_COLOR: '#28a745',
  WARNING_COLOR: '#ffc107',
  ERROR_COLOR: '#dc3545',
  INFO_COLOR: '#17a2b8'
};

// Debug utilities
export function logConfig() {
  if (FEATURES.DEBUG_MODE) {
    console.group('🔧 Zentrafuge Configuration');
    console.log('Backend URL:', BACKEND_URL);
    console.log('Default Preferences:', DEFAULT_PREFERENCES);
    console.log('Current User:', currentUser?.email || 'None');
    console.log('User Preferences:', userPreferences);
    console.log('Features:', FEATURES);
    console.groupEnd();
  }
}

// Initialize configuration
export function initializeConfig() {
  console.log('⚙️ Initializing Zentrafuge configuration...');
  
  // Load saved preferences from localStorage if available
  try {
    const savedPreferences = localStorage.getItem('zentrafuge_preferences');
    if (savedPreferences) {
      const parsed = JSON.parse(savedPreferences);
      setUserPreferences(parsed);
      console.log('💾 Loaded preferences from localStorage');
    }
  } catch (error) {
    console.warn('⚠️ Failed to load preferences from localStorage:', error);
  }
  
  // Set up global error handler
  window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise rejection:', event.reason);
    if (FEATURES.DEBUG_MODE) {
      console.error('Stack trace:', event.reason?.stack);
    }
  });
  
  console.log('✅ Configuration initialized');
  
  if (FEATURES.DEBUG_MODE) {
    logConfig();
  }
}

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeConfig);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.ZentrafugeConfig = {
    BACKEND_URL,
    DEFAULT_PREFERENCES,
    FEATURES,
    getCurrentUser,
    getUserPreferences,
    setCurrentUser,
    setUserPreferences
  };
}
