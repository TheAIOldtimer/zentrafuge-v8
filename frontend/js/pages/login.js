// frontend/js/pages/login.js - Login Page Logic
import { translationManager } from '../modules/translation-manager.js';
import { authManager } from '../modules/auth-manager.js';
import { Logger } from '../modules/utils/logger.js';

class LoginPage {
    constructor() {
        this.logger = new Logger('LoginPage');
        this.isInitialized = false;
        this.elements = {};
        
        this.init();
    }

    async init() {
        try {
            this.logger.info('Initializing login page...');
            
            // Get DOM elements
            this.getDOMElements();
            
            // Initialize translation system
            await this.initTranslation();
            
            // Setup authentication
            await this.initAuthentication();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            this.logger.info('Login page initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize login page:', error);
        }
    }

    getDOMElements() {
        this.elements = {
            // Language elements
            languageDropdown: document.getElementById('language-dropdown'),
            selectedFlag: document.getElementById('selected-flag'),
            selectedLanguage: document.getElementById('selected-language'),
            
            // Form elements
            emailInput: document.getElementById('login-email'),
            passwordInput: document.getElementById('login-password'),
            loginButton: document.getElementById('login-button'),
            
            // Message elements
            errorMessage: document.getElementById('error-message'),
            successMessage: document.getElementById('success-message')
        };

        // Verify critical elements exist
        const required = ['emailInput', 'passwordInput', 'loginButton'];
        for (const element of required) {
            if (!this.elements[element]) {
                throw new Error(`Required element ${element} not found`);
            }
        }
    }

    async initTranslation() {
        try {
            if (translationManager.apiClient) {
                translationManager.apiClient.setConfig({
                    baseUrl: 'https://zentrafuge-v8.onrender.com'
                });
            }
            await translationManager.preloadTranslations();
            translationManager.initLanguageSelector();
            await this.populateLanguageDropdown();
            await translationManager.updatePageLanguage();

            translationManager.on('translationStart', () => {
                document.body.classList.add('translating');
            });

            translationManager.on('translationComplete', () => {
                document.body.classList.remove('translating');
            });

            this.logger.info('Translation system initialized');
        } catch (error) {
            this.logger.error('Translation initialization failed:', error);
        }
    }

    async initAuthentication() {
        try {
            await authManager.init();
            await authManager.waitForAuth();

            if (authManager.isAuthenticated()) {
                this.logger.info('User already authenticated, redirecting...');
                window.location.href = 'chat.html';
                return;
            }

            this.logger.info('Authentication system initialized');
        } catch (error) {
            this.logger.error('Authentication initialization failed:', error);
        }
    }

    async populateLanguageDropdown() {
        if (!this.elements.languageDropdown) return;

        const languages = translationManager.getSupportedLanguages();
        const currentLang = translationManager.getCurrentLanguage();

        const flags = {
            'en': '🇬🇧', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪',
            'it': '🇮🇹', 'pt': '🇵🇹', 'ja': '🇯🇵', 'zh': '🇨🇳',
            'ru': '🇷🇺', 'nl': '🇳🇱'
        };

        const currentLangData = languages.find(lang => lang.code === currentLang);

        if (currentLangData && this.elements.selectedFlag && this.elements.selectedLanguage) {
            this.elements.selectedFlag.textContent = flags[currentLang] || '🌍';
            this.elements.selectedLanguage.textContent = currentLangData.nativeName;
        }

        this.elements.languageDropdown.innerHTML = languages.map(lang => `
            <div class="language-option-dropdown" data-lang="${lang.code}">
                <span>${flags[lang.code] || '🌍'}</span>
                <span>${lang.nativeName}</span>
            </div>
        `).join('');
    }

    setupEventListeners() {
        this.elements.loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        this.elements.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleLogin();
            }
        });

        this.elements.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.elements.passwordInput.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.language-option-dropdown')) {
                const langCode = e.target.closest('.language-option-dropdown').dataset.lang;
                if (langCode) {
                    this.changeLanguage(langCode);
                }
            }
            if (!e.target.closest('.language-dropdown-container')) {
                this.closeLanguageDropdown();
            }
        });

        const languageDropdownToggle = document.querySelector('.language-dropdown');
        if (languageDropdownToggle) {
            languageDropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLanguageDropdown();
            });
        }

        this.elements.emailInput.addEventListener('blur', () => {
            this.validateEmail();
        });

        this.elements.passwordInput.addEventListener('input', () => {
            this.validatePassword();
        });
    }

    async handleLogin() {
        const email = this.elements.emailInput.value.trim();
        const password = this.elements.passwordInput.value;

        if (!email || !password) {
            this.showAlert('Please enter both email and password', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showAlert('Please enter a valid email address', 'error');
            return;
        }

        try {
            this.setLoginLoading(true);
            this.logger.info('Attempting login for:', email);

            const user = await authManager.signInWithEmail(email, password);

            if (!user.emailVerified) {
                this.showAlert('Please verify your email before logging in.', 'error');
                await authManager.signOut();
                return;
            }

            const isAuthorized = await this.checkUserAuthorization(user);
            if (!isAuthorized) {
                this.showAlert('Please complete onboarding before logging in.', 'error');
                await authManager.signOut();
                return;
            }

            this.showAlert('Welcome back! Redirecting...', 'success');
            setTimeout(() => {
                this.logger.info('Login successful, redirecting to chat');
                window.location.href = 'chat.html';
            }, 1500);
        } catch (error) {
            this.logger.error('Login error:', error);

            let errorMessage = 'Login failed. Please try again.';

            if (error.message.includes('user-not-found')) {
                errorMessage = 'No account found with this email address.';
            } else if (error.message.includes('wrong-password')) {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.message.includes('too-many-requests')) {
                errorMessage = 'Too many failed attempts. Please try again later.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            }

            this.showAlert(errorMessage, 'error');
        } finally {
            this.setLoginLoading(false);
        }
    }

    async checkUserAuthorization(user) {
        try {
            if (!user) throw new Error('No user provided');

            if (user.email === 'buyartbyant@gmail.com') {
                this.logger.info('Bypassing authorization for test account');
                return true;
            }

            const userProfile = await authManager.getUserProfile();

            if (!userProfile.emailVerified || !userProfile.onboardingComplete) {
                throw new Error('Authorization requirements not met');
            }

            return true;
        } catch (error) {
            this.logger.error('Authorization failed:', error.message);
            return false;
        }
    }

    setLoginLoading(loading) {
        this.elements.loginButton.disabled = loading;

        if (loading) {
            this.elements.loginButton.classList.add('loading');
            this.elements.loginButton.textContent = 'Signing in...';
        } else {
            this.elements.loginButton.classList.remove('loading');
            this.elements.loginButton.textContent = 'Log In';
        }
    }

    showAlert(message, type = 'error') {
        const alertElement = this.elements[type === 'error' ? 'errorMessage' : 'successMessage'];
        const otherAlert = this.elements[type === 'error' ? 'successMessage' : 'errorMessage'];

        if (otherAlert) otherAlert.style.display = 'none';

        if (alertElement) {
            alertElement.textContent = message;
            alertElement.style.display = 'block';

            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 5000);
        }
    }

    async changeLanguage(languageCode) {
        try {
            document.body.classList.add('translating');
            await translationManager.setLanguage(languageCode);
            await this.populateLanguageDropdown();
            this.closeLanguageDropdown();
        } catch (error) {
            this.logger.error('Error changing language:', error);
        } finally {
            document.body.classList.remove('translating');
        }
    }

    toggleLanguageDropdown() {
        if (this.elements.languageDropdown) {
            this.elements.languageDropdown.classList.toggle('open');
        }
    }

    closeLanguageDropdown() {
        if (this.elements.languageDropdown) {
            this.elements.languageDropdown.classList.remove('open');
        }
    }

    validateEmail() {
        const email = this.elements.emailInput.value.trim();
        const isValid = this.isValidEmail(email);
        this.elements.emailInput.classList.toggle('invalid', email && !isValid);
        return isValid;
    }

    validatePassword() {
        const password = this.elements.passwordInput.value;
        const isValid = password.length >= 6;
        this.elements.passwordInput.classList.toggle('invalid', password && !isValid);
        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,6}$/;
        return emailRegex.test(email);
    }

    isReady() {
        return this.isInitialized;
    }

    destroy() {
        this.logger.info('Login page destroyed');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.loginPage = new LoginPage();
});

export { LoginPage };
