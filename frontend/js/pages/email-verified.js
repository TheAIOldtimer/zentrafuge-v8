import { initializeApp } from 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
import { getAuth, applyActionCode } from 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
import { loadTranslations, applyTranslations } from './utils/translations.js';

export class EmailVerificationPage {
  constructor() {
    this.supportedLanguages = {
      'en': { name: 'English', flag: '🇬🇧' },
      'de': { name: 'Deutsch', flag: '🇩🇪' },
      'fr': { name: 'Français', flag: '🇫🇷' },
      'es': { name: 'Español', flag: '🇪🇸' },
      'it': { name: 'Italiano', flag: '🇮🇹' },
      'nl': { name: 'Nederlands', flag: '🇳🇱' },
      'pt': { name: 'Português', flag: '🇵🇹' },
      'ru': { name: 'Русский', flag: '🇷🇺' },
      'zh': { name: '中文', flag: '🇨🇳' },
      'ja': { name: '日本語', flag: '🇯🇵' }
    };
    this.selectedLanguage = this.detectLanguage();
    this.translations = {};
    this.initialize();
  }

  detectLanguage() {
    const storedLang = localStorage.getItem('zentrafuge_language') || sessionStorage.getItem('zentrafuge_selected_language');
    if (storedLang && this.supportedLanguages[storedLang]) return storedLang;

    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang') || urlParams.get('language') || urlParams.get('locale');
    if (langParam && langParam !== 'en' && this.supportedLanguages[langParam]) {
      localStorage.setItem('zentrafuge_language', langParam);
      sessionStorage.setItem('zentrafuge_selected_language', langParam);
      return langParam;
    }

    try {
      const referrer = document.referrer;
      if (referrer.includes('register.html') || referrer.includes('index.html')) {
        const referrerUrl = new URL(referrer);
        const referrerLang = referrerUrl.searchParams.get('lang');
        if (referrerLang && this.supportedLanguages[referrerLang]) {
          localStorage.setItem('zentrafuge_language', referrerLang);
          sessionStorage.setItem('zentrafuge_selected_language', referrerLang);
          return referrerLang;
        }
      }
    } catch (e) {}

    const browserLang = (navigator.language || navigator.userLanguage).split('-')[0];
    const detectedLang = this.supportedLanguages[browserLang] ? browserLang : 'en';
    localStorage.setItem('zentrafuge_language', detectedLang);
    sessionStorage.setItem('zentrafuge_selected_language', detectedLang);
    return detectedLang;
  }

  async initialize() {
    try {
      this.translations = await loadTranslations(this.selectedLanguage);
      this.updateContent();
      this.handleEmailVerification();
    } catch (error) {
      console.error('Initialization error:', error);
      document.getElementById('error-state').style.display = 'block';
    }
  }

  updateContent() {
    applyTranslations(this.translations, this.selectedLanguage);
    this.updateLanguageSelector();
    document.documentElement.lang = this.selectedLanguage;
    const onboardingLink = document.getElementById('start-onboarding');
    onboardingLink.href = `onboarding.html?lang=${this.selectedLanguage}`;
    const loginLink = document.getElementById('login-instead');
    loginLink.href = `index.html?lang=${this.selectedLanguage}`;
  }

  updateLanguageSelector() {
    const selectedLang = this.supportedLanguages[this.selectedLanguage];
    document.getElementById('selected-flag').textContent = selectedLang.flag;
    document.getElementById('selected-language').textContent = selectedLang.name;

    const dropdown = document.getElementById('language-dropdown');
    dropdown.innerHTML = Object.entries(this.supportedLanguages).map(([code, lang]) => `
      <div class="language-option-dropdown ${code === this.selectedLanguage ? 'selected' : ''}" 
           data-lang="${code}">
        <span class="language-flag">${lang.flag}</span>
        <span class="language-name">${lang.name}</span>
      </div>
    `).join('');

    dropdown.querySelectorAll('.language-option-dropdown').forEach(option => {
      option.addEventListener('click', () => this.setLanguage(option.dataset.lang));
    });
  }

  async setLanguage(langCode) {
    if (langCode === this.selectedLanguage) {
      this.closeLanguageDropdown();
      return;
    }
    this.selectedLanguage = langCode;
    localStorage.setItem('zentrafuge_language', langCode);
    sessionStorage.setItem('zentrafuge_selected_language', langCode);
    this.translations = await loadTranslations(langCode);
    this.updateContent();
    this.closeLanguageDropdown();
  }

  closeLanguageDropdown() {
    document.getElementById('language-dropdown').classList.remove('open');
    document.querySelector('.language-dropdown').classList.remove('open');
  }

  async handleEmailVerification() {
    document.getElementById('loading').style.display = 'block';
    try {
      await new Promise(resolve => {
        const checkAuth = () => firebase.auth ? resolve() : setTimeout(checkAuth, 100);
        checkAuth();
      });

      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const actionCode = urlParams.get('oobCode');

      if (mode === 'verifyEmail' && actionCode) {
        await applyActionCode(getAuth(), actionCode);
        console.log('Email verified successfully');
      }
      document.getElementById('loading').style.display = 'none';
    } catch (error) {
      console.error('Email verification error:', error);
      document.getElementById('loading').style.display = 'none';
      document.getElementById('error-state').style.display = 'block';
      const errorEl = document.getElementById('error-message');
      if (error.code === 'auth/invalid-action-code') {
        errorEl.textContent = `${this.translations.errorMessage} (Invalid or expired verification link)`;
      } else if (error.code === 'auth/user-disabled') {
        errorEl.textContent = 'This account has been disabled. Please contact support.';
      } else {
        errorEl.textContent = this.translations.errorMessage;
      }
    }
  }
}

function toggleLanguageDropdown() {
  const dropdown = document.getElementById('language-dropdown');
  const button = document.querySelector('.language-dropdown');
  dropdown.classList.toggle('open');
  button.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const container = document.querySelector('.language-dropdown-container');
  if (!container.contains(e.target)) {
    document.getElementById('language-dropdown').classList.remove('open');
    document.querySelector('.language-dropdown').classList.remove('open');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  window.emailVerificationPage = new EmailVerificationPage();
  document.getElementById('language-toggle').addEventListener('click', toggleLanguageDropdown);
});
