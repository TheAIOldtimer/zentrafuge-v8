// frontend/js/modules/config/config.js - Application Configuration
export const CONFIG = {
    // API Configuration - FIXED TO V8
    API_BASE_URL: 'https://zentrafuge-v8.onrender.com',
    API_TIMEOUT: 30000, // 30 seconds
    API_RETRY_ATTEMPTS: 3,
    API_RETRY_DELAY: 1000, // 1 second

    // Firebase Configuration - FIXED TO V8
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyCYt2SfTJiCh1egk-q30_NLlO0kA4-RH0k",
        authDomain: "zentrafuge-v8.firebaseapp.com",
        projectId: "zentrafuge-v8",
        storageBucket: "zentrafuge-v8.appspot.com",
        messagingSenderId: "1035979155498",
        appId: "1:1035979155498:web:502d1bdbfadc116542bb53",
        measurementId: "G-WZNXDGR0BN"
    },

    // UI Configuration
    UI: {
        MESSAGE_MAX_LENGTH: 10000,
        HISTORY_LOAD_LIMIT: 20,
        AUTO_SCROLL_DELAY: 100,
        TYPING_INDICATOR_DELAY: 500,
        STATUS_MESSAGE_DURATION: 5000,
        ANIMATION_DURATION: 300
    },

    // Chat Configuration
    CHAT: {
        WELCOME_MESSAGE: "Hi - I'm Cael. I'm here to listen, whatever's going on. How has your inner weather been lately?",
        ERROR_MESSAGE: "I'm having trouble processing your message right now. Please try again.",
        CONNECTION_ERROR_MESSAGE: "I'm having connection issues. Please check your internet and try again.",
        TYPING_INDICATORS: ['⏳', '💭', '🤔'],
        MAX_RETRIES: 3,
        RETRY_DELAY: 2000
    },

    // Storage Configuration
    STORAGE: {
        KEYS: {
            LOG_LEVEL: 'zentrafuge_log_level',
            USER_PREFERENCES: 'zentrafuge_user_preferences',
            THEME: 'zentrafuge_theme',
            CHAT_DRAFTS: 'zentrafuge_chat_drafts',
            ERRORS: 'zentrafuge_errors'
        },
        MAX_STORED_ERRORS: 50,
        MAX_CHAT_DRAFTS: 10
    },

    // Theme Configuration
    THEMES: {
        LIGHT: {
            name: 'light',
            primary: '#667eea',
            secondary: '#764ba2',
            background: '#ffffff',
            surface: '#f8f9fa',
            text: '#333333',
            textSecondary: '#666666',
            border: '#e9ecef',
            success: '#51cf66',
            warning: '#ff9800',
            error: '#f44336',
            info: '#339af0'
        },
        DARK: {
            name: 'dark',
            primary: '#667eea',
            secondary: '#764ba2',
            background: '#1a1a1a',
            surface: '#2d2d2d',
            text: '#ffffff',
            textSecondary: '#cccccc',
            border: '#404040',
            success: '#51cf66',
            warning: '#ff9800',
            error: '#f44336',
            info: '#339af0'
        }
    },

    // Feature Flags
    FEATURES: {
        VOICE_INPUT: false,
        FILE_UPLOAD: false,
        MOOD_TRACKING: true,
        EXPORT_DATA: true,
        DARK_MODE: true,
        NOTIFICATIONS: false,
        ANALYTICS: false,
        BETA_FEATURES: false
    },

    // Validation Rules
    VALIDATION: {
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        MESSAGE_MIN_LENGTH: 1,
        MESSAGE_MAX_LENGTH: 10000,
        PASSWORD_MIN_LENGTH: 6
    },

    // Rate Limiting (client-side)
    RATE_LIMITS: {
        MESSAGES_PER_MINUTE: 20,
        API_CALLS_PER_MINUTE: 50,
        LOGIN_ATTEMPTS_PER_HOUR: 5
    },

    // Development Configuration
    DEVELOPMENT: {
        DEBUG_MODE: window.location.hostname === 'localhost' || window.location.search.includes('debug=true'),
        MOCK_API: window.location.search.includes('mock=true'),
        PERFORMANCE_MONITORING: true,
        CONSOLE_LOGGING: true
    },

    // Security
    SECURITY: {
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
        IDLE_TIMEOUT: 30 * 60 * 1000 // 30 minutes
    },

    // Environment
    ENVIRONMENT: 'production',
    VERSION: '8.0.0'
};

// Environment-specific overrides (BEFORE freezing)
if (CONFIG.DEVELOPMENT.DEBUG_MODE && window.location.hostname === 'localhost' && window.location.port) {
    // Only override for actual local development
    console.warn('🔧 Development mode: Using localhost backend');
    CONFIG.API_BASE_URL = 'http://localhost:5000';
    CONFIG.UI.ANIMATION_DURATION = 100;
    CONFIG.CHAT.RETRY_DELAY = 500;
    CONFIG.API_TIMEOUT = 10000;
} else if (CONFIG.DEVELOPMENT.DEBUG_MODE) {
    console.log('🔧 Debug mode enabled but using production backend');
}

// Freeze configuration to prevent accidental modifications
Object.freeze(CONFIG);
