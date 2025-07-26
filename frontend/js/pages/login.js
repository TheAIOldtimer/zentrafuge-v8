// ✅ login.js — fixes redirect loop by checking onboarding state before chat.html
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
      this.getDOMElements();
      await this.initTranslation();
      await this.initAuthentication();
      this.setupEventListeners();
      this.isInitialized = true;
      this.logger.info('Login page initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize login page:', error);
    }
  }

  getDOMElements() {
    this.elements = {
      emailInput: document.getElementById('login-email'),
      passwordInput: document.getElementById('login-password'),
      loginButton: document.getElementById('login-button'),
      errorMessage: document.getElementById('error-message'),
      successMessage: document.getElementById('success-message')
    };
  }

  async initTranslation() {
    try {
      if (translationManager.apiClient) {
        translationManager.apiClient.setConfig({ baseUrl: 'https://zentrafuge-v8.onrender.com' });
      }
      await translationManager.preloadTranslations();
      translationManager.initLanguageSelector();
      await translationManager.updatePageLanguage();
      translationManager.on('translationStart', () => document.body.classList.add('translating'));
      translationManager.on('translationComplete', () => document.body.classList.remove('translating'));
      this.logger.info('Translation initialized');
    } catch (err) {
      this.logger.error('Translation failed:', err);
    }
  }

  async initAuthentication() {
    try {
      await authManager.init();
      await authManager.waitForAuth();

      if (authManager.isAuthenticated()) {
        const user = authManager.getCurrentUser();
        const onboarded = await authManager.checkOnboardingStatus(user.uid);

        if (onboarded) {
          this.logger.info('User onboarded — redirecting to chat');
          window.location.href = 'chat.html';
        } else {
          this.logger.info('User NOT onboarded — redirecting to preferences');
          window.location.href = 'preferences.html';
        }
      }

      this.logger.info('Authentication complete');
    } catch (error) {
      this.logger.error('Auth init failed:', error);
    }
  }

  setupEventListeners() {
    this.elements.loginButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = this.elements.emailInput.value.trim();
      const password = this.elements.passwordInput.value.trim();

      try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        const onboarded = await authManager.checkOnboardingStatus(uid);

        if (onboarded) {
          window.location.href = 'chat.html';
        } else {
          window.location.href = 'preferences.html';
        }
      } catch (err) {
        this.logger.error('Login error:', err);
        this.elements.errorMessage.textContent = 'Login failed. Please check your credentials.';
        this.elements.errorMessage.style.display = 'block';
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => new LoginPage());
