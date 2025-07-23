// frontend/js/modules/translation-manager.js - AI Translation System
import { EventEmitter } from './utils/event-emitter.js';
import { Logger } from './utils/logger.js';
import { ApiClient } from './utils/api-client.js';

export class TranslationManager extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('TranslationManager');
        this.apiClient = new ApiClient();
        this.userLanguage = this.detectUserLanguage();
        this.cache = new Map(); // Cache translations
        this.isTranslating = false;
        
        // UI text mappings (replaces all JSON files)
        this.uiTexts = {
            // Navigation & Header
            app_name: 'Zentrafuge',
            page_title: 'Chat with Cael - Zentrafuge',
            nav_chat: 'Chat',
            nav_settings: 'Settings',
            nav_preferences: 'Preferences',
            nav_support: 'Support',
            nav_help: 'Help',
            
            // Authentication
            sign_in: 'Sign In',
            sign_out: 'Sign Out',
            register: 'Register',
            email: 'Email',
            password: 'Password',
            forgot_password: 'Forgot Password?',
            create_account: 'Create Account',
            
            // Chat Interface
            send_button: 'Send',
            input_placeholder: 'Share what\'s on your mind...',
            typing_indicator: 'Cael is thinking...',
            welcome_message: 'Hello! I\'m Cael, your emotional companion. How are you feeling today?',
            
            // Status Messages
            status_connecting: 'Connecting to Cael...',
            status_connected: 'Connected',
            status_disconnected: 'Disconnected',
            status_loading: 'Loading...',
            
            // Actions
            export_chat: 'Export Chat',
            clear_chat: 'Clear Chat',
            save_settings: 'Save Settings',
            cancel: 'Cancel',
            confirm: 'Confirm',
            delete: 'Delete',
            edit: 'Edit',
            
            // Error Messages
            error_network: 'Network error. Please check your connection.',
            error_auth: 'Authentication required. Please sign in.',
            error_general: 'Something went wrong. Please try again.',
            error_file_size: 'File is too large.',
            error_file_type: 'File type not supported.',
            
            // Success Messages
            success_saved: 'Settings saved successfully',
            success_exported: 'Chat exported successfully',
            success_deleted: 'Data deleted successfully',
            
            // Onboarding
            onboarding_welcome: 'Welcome to Zentrafuge',
            onboarding_intro: 'Let\'s personalize your experience with Cael',
            onboarding_continue: 'Continue',
            onboarding_skip: 'Skip for now',
            
            // Preferences
            pref_language: 'Language',
            pref_theme: 'Theme',
            pref_notifications: 'Notifications',
            pref_communication_style: 'Communication Style',
            
            // Theme Options
            theme_light: 'Light',
            theme_dark: 'Dark',
            theme_auto: 'Auto',
            
            // Communication Styles
            style_supportive: 'Supportive',
            style_direct: 'Direct',
            style_casual: 'Casual',
            style_formal: 'Formal',
            
            // Time & Dates
            time_now: 'now',
            time_minute_ago: '1 minute ago',
            time_minutes_ago: 'minutes ago',
            time_hour_ago: '1 hour ago',
            time_hours_ago: 'hours ago',
            time_yesterday: 'yesterday',
            time_days_ago: 'days ago',
            
            // Military Support (if applicable)
            military_support: 'Military Support Available',
            veteran_resources: 'Veteran Resources',
            crisis_support: 'Crisis Support Available 24/7'
        };
    }

    /**
     * Detect user's preferred language
     */
    detectUserLanguage() {
        // Priority: 1. URL parameter, 2. User setting, 3. Browser language, 4. Default English
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang) return urlLang;

        const saved = localStorage.getItem('zentrafuge_language');
        if (saved) return saved;

        const browserLang = navigator.language.substring(0, 2);
        const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ru', 'nl'];
        
        return supportedLanguages.includes(browserLang) ? browserLang : 'en';
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return [
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'es', name: 'Spanish', nativeName: 'Español' },
            { code: 'fr', name: 'French', nativeName: 'Français' },
            { code: 'de', name: 'German', nativeName: 'Deutsch' },
            { code: 'it', name: 'Italian', nativeName: 'Italiano' },
            { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
            { code: 'ja', name: 'Japanese', nativeName: '日本語' },
            { code: 'zh', name: 'Chinese', nativeName: '中文' },
            { code: 'ru', name: 'Russian', nativeName: 'Русский' },
            { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' }
        ];
    }

    /**
     * Translate text using AI backend
     */
    async translateText(text, targetLang = this.userLanguage, context = 'general') {
        // Skip if already in target language or text is empty
        if (targetLang === 'en' || !text.trim()) return text;

        // Check cache first
        const cacheKey = `${text}:${targetLang}:${context}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            this.logger.debug(`Translating to ${targetLang}`, { text, context });

            const response = await this.apiClient.makeRequest('/translate', {
                method: 'POST',
                body: JSON.stringify({
                    text: text,
                    target_language: targetLang,
                    context: context,
                    preserve_tone: context === 'emotional_support'
                })
            });

            const translatedText = response.translated_text || text;
            
            // Cache the translation
            this.cache.set(cacheKey, translatedText);
            
            this.logger.debug('Translation successful', { original: text, translated: translatedText });
            
            return translatedText;

        } catch (error) {
            this.logger.error('Translation failed:', error);
            return text; // Fallback to original text
        }
    }

    /**
     * Translate UI element
     */
    async translateUI(elementKey, targetLang = this.userLanguage) {
        const originalText = this.uiTexts[elementKey] || elementKey;
        
        if (targetLang === 'en') {
            return originalText;
        }

        return await this.translateText(originalText, targetLang, 'ui');
    }

    /**
     * Translate Cael's response (with emotional context)
     */
    async translateCaelResponse(response, userLanguage = this.userLanguage) {
        if (userLanguage === 'en') return response;
        
        return await this.translateText(response, userLanguage, 'emotional_support');
    }

    /**
     * Set user language preference
     */
    async setLanguage(language) {
        if (language === this.userLanguage) return;

        this.logger.info(`Changing language from ${this.userLanguage} to ${language}`);
        
        this.isTranslating = true;
        this.emit('translationStart', { from: this.userLanguage, to: language });
        
        try {
            this.userLanguage = language;
            localStorage.setItem('zentrafuge_language', language);
            
            // Update page language
            await this.updatePageLanguage();
            
            // Update URL without reload
            const url = new URL(window.location);
            url.searchParams.set('lang', language);
            window.history.replaceState({}, '', url);
            
            this.emit('languageChanged', { language });
            this.logger.info(`Language changed to ${language}`);
            
        } catch (error) {
            this.logger.error('Error changing language:', error);
            this.emit('translationError', { error });
        } finally {
            this.isTranslating = false;
            this.emit('translationComplete', { language });
        }
    }

    /**
     * Update entire page language
     */
    async updatePageLanguage() {
        // Update document language attribute
        document.documentElement.lang = this.userLanguage;
        
        // Translate all elements with data-translate attribute
        const elements = document.querySelectorAll('[data-translate]');
        
        const translationPromises = Array.from(elements).map(async (element) => {
            const key = element.dataset.translate;
            const translatedText = await this.translateUI(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // Handle placeholder text
                if (element.dataset.translatePlaceholder) {
                    const placeholderKey = element.dataset.translatePlaceholder;
                    const translatedPlaceholder = await this.translateUI(placeholderKey);
                    element.placeholder = translatedPlaceholder;
                }
                if (element.value && element.dataset.translateValue) {
                    element.value = translatedText;
                }
            } else if (element.tagName === 'TITLE') {
                document.title = translatedText;
            } else {
                element.textContent = translatedText;
            }
        });

        await Promise.all(translationPromises);
        
        // Translate page title if it has data-translate
        const titleElement = document.querySelector('title[data-translate]');
        if (titleElement) {
            const titleKey = titleElement.dataset.translate;
            document.title = await this.translateUI(titleKey);
        }
    }

    /**
     * Initialize language selector
     */
    initLanguageSelector(selectorId = 'language-selector') {
        const selector = document.getElementById(selectorId);
        if (!selector) return;

        // Populate with supported languages
        const languages = this.getSupportedLanguages();
        selector.innerHTML = languages.map(lang => 
            `<option value="${lang.code}" ${lang.code === this.userLanguage ? 'selected' : ''}>
                ${lang.nativeName}
            </option>`
        ).join('');

        // Add change listener
        selector.addEventListener('change', async (e) => {
            await this.setLanguage(e.target.value);
        });
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.userLanguage;
    }

    /**
     * Check if currently translating
     */
    isCurrentlyTranslating() {
        return this.isTranslating;
    }

    /**
     * Clear translation cache
     */
    clearCache() {
        this.cache.clear();
        this.logger.info('Translation cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            languages: Array.from(new Set(
                Array.from(this.cache.keys()).map(key => key.split(':')[1])
            ))
        };
    }

    /**
     * Preload common translations
     */
    async preloadTranslations() {
        if (this.userLanguage === 'en') return;

        const commonKeys = [
            'send_button', 'input_placeholder', 'typing_indicator',
            'status_connecting', 'status_connected', 'error_network'
        ];

        const preloadPromises = commonKeys.map(key => this.translateUI(key));
        await Promise.all(preloadPromises);
        
        this.logger.info('Common translations preloaded');
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        this.clearCache();
        this.removeAllListeners();
        this.logger.info('TranslationManager destroyed');
    }
}

// Export singleton instance
export const translationManager = new TranslationManager();
