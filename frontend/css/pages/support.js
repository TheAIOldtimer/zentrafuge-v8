// Support Page Logic
import { translationManager } from '../modules/translation-manager.js';

/**
 * Crisis helplines data organized by language/region
 */
const helplines = {
  en: {
    title: "🇬🇧 English (UK)",
    emergency: "Emergency: 999",
    lines: [
      "Samaritans – 116 123 (Free, 24/7)",
      "Shout Crisis Text – Text SHOUT to 85258",
      "Mind – <a href=\"https://www.mind.org.uk/\" target=\"_blank\">www.mind.org.uk</a>"
    ]
  },
  de: {
    title: "🇩🇪 Deutsch (Germany)",
    emergency: "Emergency: 112",
    lines: [
      "Telefonseelsorge – 0800 111 0 111 or 0800 111 0 222 (Free, 24/7)",
      "Nummer gegen Kummer – 116 111 (Children/Youth)",
      "Online-Beratung – <a href=\"https://www.telefonseelsorge.de/\" target=\"_blank\">www.telefonseelsorge.de</a>"
    ]
  },
  fr: {
    title: "🇫🇷 Français (France)",
    emergency: "Emergency: 15 (SAMU) or 112",
    lines: [
      "SOS Amitié – 09 72 39 40 50 (24/7)",
      "Suicide Écoute – 01 45 39 40 00 (24/7)",
      "Chat en ligne – <a href=\"https://www.sos-amitie.com/\" target=\"_blank\">www.sos-amitie.com</a>"
    ]
  },
  es: {
    title: "🇪🇸 Español (Spain)",
    emergency: "Emergency: 112",
    lines: [
      "Teléfono de la Esperanza – 717 003 717 (24/7)",
      "ANAR – 900 20 20 10 (Children/Youth)",
      "Chat online – <a href=\"https://www.telefonodelaesperanza.org/\" target=\"_blank\">www.telefonodelaesperanza.org</a>"
    ]
  },
  it: {
    title: "🇮🇹 Italiano (Italy)",
    emergency: "Emergency: 112",
    lines: [
      "Telefono Amico – 02 2327 2327 (10:00–24:00)",
      "Samaritans Onlus – 800 86 00 22 (13:00–22:00)",
      "Chat online – <a href=\"https://www.telefonoamico.it/\" target=\"_blank\">www.telefonoamico.it</a>"
    ]
  },
  nl: {
    title: "🇳🇱 Nederlands (Netherlands)",
    emergency: "Emergency: 112",
    lines: [
      "113 Zelfmoordpreventie – 113 or 0800-0113 (Free, 24/7)",
      "Kindertelefoon – 0800-0432 (Children)",
      "Online chat – <a href=\"https://www.113.nl/\" target=\"_blank\">www.113.nl</a>"
    ]
  },
  pt: {
    title: "🇵🇹 Português (Portugal)",
    emergency: "Emergency: 112",
    lines: [
      "SOS Voz Amiga – 213 544 545 (16:00–24:00)",
      "Linha Vida – 1414 (24/7)",
      "Chat online – <a href=\"https://www.sosvozamiga.org/\" target=\"_blank\">www.sosvozamiga.org</a>"
    ]
  }
};

/**
 * Global crisis resources available worldwide
 */
const globalResources = {
  title: "🌍 Global Resources",
  lines: [
    "Crisis Text Line – Text HOME to 741741 (US/UK/Canada)",
    "Befrienders Worldwide – <a href=\"https://www.befrienders.org/\" target=\"_blank\">www.befrienders.org</a>",
    "International Association for Suicide Prevention – <a href=\"https://www.iasp.info/resources/Crisis_Centres\" target=\"_blank\">www.iasp.info</a>",
    "OpenCounseling Crisis Directory – <a href=\"https://www.opencounseling.com/suicide-hotlines\" target=\"_blank\">Crisis Helplines Worldwide</a>"
  ]
};

/**
 * Initialize translation system and set up event listeners
 */
async function initTranslation() {
  try {
    await translationManager.preloadTranslations();
    translationManager.initLanguageSelector();
    await translationManager.updatePageLanguage();
    await updateHelplines();
    console.log('✅ Translation system initialized');
  } catch (error) {
    console.error('❌ Translation initialization failed:', error);
    // Fallback to English helplines
    await updateHelplines('en');
  }
}

/**
 * Update helplines display based on current language
 * @param {string} languageOverride - Optional language code to override current language
 */
async function updateHelplines(languageOverride = null) {
  const currentLang = languageOverride || translationManager.getCurrentLanguage();
  const content = document.getElementById("helpline-content");
  const data = helplines[currentLang] || helplines.en;

  // Get translated section title
  const globalTitle = await translationManager.translateUI('global_resources') || globalResources.title;

  // Build HTML content
  const helplineHTML = `
    <div class="section">
      <h2>${data.title}</h2>
      <div class="helpline"><strong>${data.emergency}</strong></div>
      ${data.lines.map(line => `<div class="helpline">${line}</div>`).join('')}
    </div>
    <div class="section">
      <h2>${globalTitle}</h2>
      ${globalResources.lines.map(line => `<div class="helpline">${line}</div>`).join('')}
    </div>
  `;

  content.innerHTML = helplineHTML;
}

/**
 * Set up translation event listeners for loading states and language changes
 */
function setupTranslationEventListeners() {
  translationManager.on('translationStart', () => {
    document.body.classList.add('translating');
  });

  translationManager.on('translationComplete', () => {
    document.body.classList.remove('translating');
  });

  translationManager.on('languageChanged', async ({ language }) => {
    await updateHelplines(language);
  });
}

/**
 * Initialize the support page
 */
async function initSupportPage() {
  // Set up translation event listeners
  setupTranslationEventListeners();
  
  // Initialize translation system
  await initTranslation();
  
  console.log('✅ Support page initialized');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSupportPage);
