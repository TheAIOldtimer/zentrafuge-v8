import { initializeApp } from 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
import { getFirestore, collection, doc, setDoc } from 'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js';
import { loadTranslations, applyTranslations } from './utils/translations.js';

export class ZentrafugeOnboarding {
  constructor() {
    this.currentStep = 0;
    this.onboardingData = {};
    this.firebaseInitialized = false;
    this.firebaseUser = null;
    this.translations = {};
    this.supportedLanguages = {
      'en': { name: 'English', flag: '🇬🇧' },
      'de': { name: 'Deutsch', flag: '🇩🇪' },
      'fr': { name: 'Français', flag: '🇫🇷' },
      'es': { name: 'Español', flag: '🇪🇸' },
      'it': { name: 'Italiano', flag: '🇮🇹' },
      'pt': { name: 'Português', flag: '🇵🇹' },
      'nl': { name: 'Nederlands', flag: '🇳🇱' },
      'ru': { name: 'Русский', flag: '🇷🇺' },
      'ja': { name: '日本語', flag: '🇯🇵' },
      'zh': { name: '中文', flag: '🇨🇳' }
    };
    this.currentLanguage = this.detectLanguage();
    this.initialize();
  }

  detectLanguage() {
    const savedLanguage = localStorage.getItem('zentrafuge_language');
    if (savedLanguage && this.supportedLanguages[savedLanguage]) return savedLanguage;
    const browserLanguage = navigator.language.split('-')[0];
    return this.supportedLanguages[browserLanguage] ? browserLanguage : 'en';
  }

  async initialize() {
    try {
      this.translations = await loadTranslations(this.currentLanguage);
      this.applyTranslations();
      this.setupLanguageDropdown();
      this.initializeFirebase();
      document.getElementById('loading-overlay').style.opacity = '0';
      setTimeout(() => document.getElementById('loading-overlay').style.display = 'none', 300);
    } catch (error) {
      console.error('App initialization failed:', error);
      this.showStatusMessage('Failed to load application. Please refresh the page.', 'error');
    }
  }

  async applyTranslations() {
    applyTranslations(this.translations, this.currentLanguage);
    document.getElementById('begin-button').disabled = false;
  }

  setupLanguageDropdown() {
    const currentLang = this.supportedLanguages[this.currentLanguage];
    document.getElementById('selected-language').textContent = currentLang.name;
    document.getElementById('selected-flag').textContent = currentLang.flag;

    const languageDropdown = document.getElementById('language-dropdown');
    languageDropdown.innerHTML = Object.keys(this.supportedLanguages).map(langCode => {
      const lang = this.supportedLanguages[langCode];
      return `
        <div class="language-option-dropdown ${langCode === this.currentLanguage ? 'selected' : ''}" data-lang="${langCode}">
          <span class="language-flag">${lang.flag}</span>
          <span class="language-name">${lang.name}</span>
        </div>
      `;
    }).join('');

    languageDropdown.querySelectorAll('.language-option-dropdown').forEach(option => {
      option.addEventListener('click', () => this.selectLanguage(option.dataset.lang));
    });
  }

  async selectLanguage(langCode) {
    if (langCode === this.currentLanguage) {
      toggleLanguageDropdown();
      return;
    }
    this.currentLanguage = langCode;
    localStorage.setItem('zentrafuge_language', langCode);
    this.translations = await loadTranslations(langCode);
    this.applyTranslations();
    this.setupLanguageDropdown();
    this.showStatusMessage(`Language changed to ${this.supportedLanguages[langCode].name}`, 'success');
    toggleLanguageDropdown();
  }

  initializeFirebase() {
    console.log('Initializing Firebase authentication...');
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded');
      this.enableOfflineMode();
      return;
    }

    onAuthStateChanged(getAuth(), user => {
      console.log('Auth state changed:', user ? user.uid : 'No user');
      if (user && !user.isAnonymous) {
        if (!user.emailVerified) {
          this.showStatusMessage(this.translations.emailNotVerified || 'Please verify your email before continuing onboarding.', 'error');
          document.getElementById('auth-notice').style.display = 'block';
          document.getElementById('begin-button').disabled = true;
          return;
        }
        this.firebaseUser = user;
        this.firebaseInitialized = true;
        this.onboardingData.user_id = user.uid;
        this.onboardingData.email = user.email;
        document.getElementById('auth-notice').style.display = 'none';
        document.getElementById('begin-button').disabled = false;
        this.showStatusMessage(this.translations.authSuccess || 'Authentication successful!', 'success');
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  enableOfflineMode() {
    console.log('Enabling offline mode...');
    this.firebaseUser = null;
    this.firebaseInitialized = false;
    document.getElementById('auth-notice').style.display = 'block';
    document.getElementById('begin-button').disabled = false;
    this.showStatusMessage(this.translations.offlineWarning || 'Continuing in offline mode', 'warning');
  }

  showStatusMessage(message, type) {
    const statusMessageDiv = document.getElementById('status-message');
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `status-message ${type}`;
    statusMessageDiv.style.display = 'block';
    setTimeout(() => statusMessageDiv.style.display = 'none', 5000);
  }

  async saveResponsesToFirestore(data) {
    if (!this.firebaseInitialized || !this.firebaseUser) {
      console.log('Firebase not available, skipping cloud save');
      return false;
    }
    try {
      const db = getFirestore();
      const userRef = doc(collection(db, 'users'), this.firebaseUser.uid);
      const dataWithTimestamps = {
        ...data,
        onboardingComplete: true,
        onboarding_completed_at: firebase.firestore.FieldValue.serverTimestamp(),
        last_updated: firebase.firestore.FieldValue.serverTimestamp(),
        version: "1.0",
        emailVerified: true
      };
      await setDoc(userRef, dataWithTimestamps, { merge: true });
      console.log('Successfully saved to Firestore');
      return true;
    } catch (error) {
      console.error('Firestore save error:', error);
      return false;
    }
  }

  async completeOnboarding() {
    try {
      this.collectAllFormData();
      this.saveOnboardingData();
      const completeButton = document.getElementById('complete-button');
      const originalButtonText = completeButton.innerHTML;
      const loadingSpinner = completeButton.querySelector('.loading-spinner');
      completeButton.disabled = true;
      completeButton.innerHTML = this.translations.savingMessage || 'Saving...';
      if (loadingSpinner) loadingSpinner.style.display = 'inline-block';
      this.showStatusMessage(this.translations.savingMessage || 'Saving your preferences...', 'warning');
      const firestoreSaved = await this.saveResponsesToFirestore(this.onboardingData);
      this.showStatusMessage(
        firestoreSaved ? (this.translations.successSaving || 'Preferences saved successfully!') : 
        (this.translations.errorSaving || 'Error saving preferences. Continuing with local storage.'), 
        firestoreSaved ? 'success' : 'error'
      );
      completeButton.disabled = false;
      completeButton.innerHTML = originalButtonText;
      if (loadingSpinner) loadingSpinner.style.display = 'none';
      setTimeout(() => window.location.href = './chat.html', 2000);
    } catch (error) {
      console.error('Error in completeOnboarding:', error);
      this.showStatusMessage('An error occurred. Please try again.', 'error');
      const completeButton = document.getElementById('complete-button');
      completeButton.disabled = false;
      completeButton.innerHTML = `<span data-translate="completeButton">${this.translations.completeButton || 'Begin our journey'}</span> <span class="loading-spinner"></span>`;
    }
  }

  loadOnboardingData() {
    const savedData = localStorage.getItem('zentrafuge_onboarding_data');
    if (savedData) this.onboardingData = JSON.parse(savedData);
  }

  saveOnboardingData() {
    localStorage.setItem('zentrafuge_onboarding_data', JSON.stringify(this.onboardingData));
  }

  collectAllFormData() {
    console.log('Collecting data from all steps...');
    this.onboardingData.sources_of_meaning = [];
    this.onboardingData.effective_support = [];
    for (let stepNum = 0; stepNum <= 4; stepNum++) {
      const stepElement = document.getElementById(`step-${stepNum}`);
      if (!stepElement) continue;
      stepElement.querySelectorAll('input[type="radio"]:checked').forEach(input => {
        this.onboardingData[input.name] = input.value;
      });
      stepElement.querySelectorAll('input[type="checkbox"]:checked').forEach(input => {
        if (!this.onboardingData[input.name]) this.onboardingData[input.name] = [];
        if (!this.onboardingData[input.name].includes(input.value)) {
          this.onboardingData[input.name].push(input.value);
        }
      });
      stepElement.querySelectorAll('input[type="text"], textarea').forEach(input => {
        if (input.id && input.value) this.onboardingData[input.id] = input.value;
      });
    }
    if (!this.onboardingData.user_id) {
      this.onboardingData.user_id = this.firebaseUser ? this.firebaseUser.uid : `local_${Date.now()}`;
    }
    this.onboardingData.language = this.currentLanguage;
    this.onboardingData.completed_at = new Date().toISOString();
    console.log('Final collected data:', this.onboardingData);
  }

  nextStep() {
    this.collectAllFormData();
    this.saveOnboardingData();
    const currentStepElement = document.getElementById(`step-${this.currentStep}`);
    if (currentStepElement) {
      currentStepElement.classList.remove('active');
      currentStepElement.classList.add('hidden');
    }
    this.currentStep++;
    if (this.currentStep > 4) return;
    const nextStepElement = document.getElementById(`step-${this.currentStep}`);
    if (nextStepElement) {
      nextStepElement.classList.remove('hidden');
      nextStepElement.classList.add('active');
    }
    this.updateProgressIndicator();
  }

  prevStep() {
    this.collectAllFormData();
    this.saveOnboardingData();
    const currentStepElement = document.getElementById(`step-${this.currentStep}`);
    if (currentStepElement) {
      currentStepElement.classList.remove('active');
      currentStepElement.classList.add('hidden');
    }
    this.currentStep--;
    if (this.currentStep < 0) this.currentStep = 0;
    const prevStepElement = document.getElementById(`step-${this.currentStep}`);
    if (prevStepElement) {
      prevStepElement.classList.remove('hidden');
      prevStepElement.classList.add('active');
    }
    this.updateProgressIndicator();
  }

  updateProgressIndicator() {
    document.querySelectorAll('.progress-dot').forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentStep);
      dot.classList.toggle('completed', index < this.currentStep);
    });
  }
}

function toggleLanguageDropdown() {
  const dropdown = document.getElementById('language-dropdown');
  const dropdownButton = document.querySelector('.language-dropdown');
  dropdown.classList.toggle('open');
  dropdownButton.classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', () => {
  window.onboarding = new ZentrafugeOnboarding();
  document.getElementById('language-toggle').addEventListener('click', toggleLanguageDropdown);
  document.querySelectorAll('.btn-primary:not(#complete-button)').forEach(btn => {
    btn.addEventListener('click', () => window.onboarding.nextStep());
  });
  document.querySelectorAll('.btn-secondary').forEach(btn => {
    btn.addEventListener('click', () => window.onboarding.prevStep());
  });
  document.getElementById('complete-button').addEventListener('click', () => window.onboarding.completeOnboarding());
});
