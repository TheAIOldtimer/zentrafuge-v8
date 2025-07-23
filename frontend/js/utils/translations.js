export async function loadTranslations(langCode) {
  try {
    const response = await fetch(`/translations/${langCode}.json`);
    if (!response.ok) throw new Error(`Failed to load ${langCode} translations`);
    return await response.json();
  } catch (error) {
    console.warn(`Failed to load ${langCode} translations:`, error);
    if (langCode !== 'en') {
      const response = await fetch('/translations/en.json');
      return await response.json();
    }
    throw error;
  }
}

export function applyTranslations(translations, langCode) {
  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate');
    if (translations[key]) element.textContent = translations[key];
  });
  document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
    const key = element.getAttribute('data-translate-placeholder');
    if (translations[key]) element.placeholder = translations[key];
  });
  document.documentElement.lang = langCode;
}
