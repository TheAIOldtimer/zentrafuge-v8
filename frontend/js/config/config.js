// frontend/js/config/config.js - Application Configuration (SECOND CONFIG FILE - MAKE IDENTICAL)
export const CONFIG = {
    // API Configuration - FIXED: Updated to zentrafuge-v8 backend
    API_BASE_URL: 'https://zentrafuge-v8.onrender.com',
    API_TIMEOUT: 30000, // 30 seconds
    API_RETRY_ATTEMPTS: 3,
    API_RETRY_DELAY: 1000, // 1 second

    // Firebase Configuration - FIXED: Updated to zentrafuge-v8 project
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
        WELCOME_MESSAGE: "Hello! I'm Cael, your emotional companion. I'm here to listen, reflect, and support you on your journey. How are you feeling today?",
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
        PASSWORD_MIN_LENGTH: 6,
        MESSAGE_MIN_LENGTH: 1,
        MESSAGE_MAX_LENGTH: 10000,
        USERNAME_MIN_LENGTH: 3,
        USERNAME_MAX_LENGTH: 30,
        DISPLAY_NAME_MAX_LENGTH: 50
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

    // Error Tracking
    ERROR_TRACKING: {
        ENABLED: true,
        MAX_STACK_TRACE_LENGTH: 1000,
        IGNORE_PATTERNS: [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            'Network request failed'
        ]
    },

    // Accessibility
    ACCESSIBILITY: {
        HIGH_CONTRAST_MODE: false,
        REDUCED_MOTION: false,
        SCREEN_READER_SUPPORT: true,
        KEYBOARD_NAVIGATION: true,
        FOCUS_VISIBLE: true
    },

    // Security
    SECURITY: {
        CSP_ENABLED: true,
        XSS_PROTECTION: true,
        IFRAME_PROTECTION: true,
        SECURE_COOKIES: true,
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
        IDLE_TIMEOUT: 30 * 60 * 1000 // 30 minutes
    },

    // Performance
    PERFORMANCE: {
        LAZY_LOADING: true,
        IMAGE_OPTIMIZATION: true,
        DEBOUNCE_DELAY: 300,
        THROTTLE_DELAY: 100,
        VIRTUAL_SCROLLING: false, // Enable for large message lists
        PRELOAD_ASSETS: true
    },

    // Monitoring
    MONITORING: {
        PERFORMANCE_METRICS: true,
        ERROR_REPORTING: true,
        USER_ANALYTICS: false, // Privacy-first approach
        HEALTH_CHECKS: true,
        UPTIME_MONITORING: true
    }
};

// Environment-specific overrides
if (CONFIG.DEVELOPMENT.DEBUG_MODE) {
    CONFIG.UI.ANIMATION_DURATION = 100; // Faster animations in dev
    CONFIG.CHAT.RETRY_DELAY = 500; // Faster retries in dev
    CONFIG.API_TIMEOUT = 10000; // Shorter timeout in dev
    // Override for local development
    CONFIG.API_BASE_URL = 'http://localhost:5000';
}

// Freeze configuration to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.FIREBASE_CONFIG);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.CHAT);
Object.freeze(CONFIG.STORAGE);
Object.freeze(CONFIG.THEMES);
Object.freeze(CONFIG.FEATURES);
Object.freeze(CONFIG.VALIDATION);
Object.freeze(CONFIG.RATE_LIMITS);
Object.freeze(CONFIG.DEVELOPMENT);
Object.freeze(CONFIG.ERROR_TRACKING);
Object.freeze(CONFIG.ACCESSIBILITY);
Object.freeze(CONFIG.SECURITY);
Object.freeze(CONFIG.PERFORMANCE);
Object.freeze(CONFIG.MONITORING);

export default CONFIG;
