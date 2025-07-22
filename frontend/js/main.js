import { waitForFirebase, getUserId } from './auth.js';
import { showAlert, setFormEnabled, appendMessage } from './ui.js';
import { loadUserPreferences, loadPreferencesIntoForm, saveUserPreferences, resetUserPreferences, testCurrentPreferences } from './preferences.js';
import { currentUser, isAuthorized, lastKeystroke, setLastKeystroke } from './config.js';
import { BACKEND_URL, userPreferences } from './config.js';
import { showTypingIndicator, hideTypingIndicator } from './ui.js';
import { applyPreferencesToResponse } from './preferences.js';

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔥 DOM loaded, waiting for Firebase initialization');
  
  try {
    // Initialize Firebase and wait for auth state to be determined
    await waitForFirebase();
    console.log('✅ Firebase initialized');
    
    // NOTE: Auth state is now handled in auth.js - no need for onAuthStateChanged here
    // The waitForFirebase() function sets up the auth listener and handles all auth state changes
    
    // Set up chat functionality
    const input = document.getElementById("message");
    const form = document.getElementById("chat-form");
    
    if (form) {
      // Draft saving functionality
      const savedDraft = localStorage.getItem(`zentrafuge_draft_${getUserId()}`);
      if (savedDraft && currentUser) {
        input.value = savedDraft;
        appendMessage("cael", `I saved what you were writing, ${currentUser?.displayName || 'friend'} - want to continue?`);
      }

      // Auto-save drafts
      setInterval(() => {
        if (!input || !currentUser) return;
        const draft = input.value;
        if (draft.length > 3) {
          localStorage.setItem(`zentrafuge_draft_${getUserId()}`, draft);
        } else {
          localStorage.removeItem(`zentrafuge_draft_${getUserId()}`);
        }
      }, 2000);

      // Keystroke tracking for encouragement
      input?.addEventListener('keyup', () => {
        setTimeout(() => {
          const pauseDuration = Date.now() - lastKeystroke;
          if (pauseDuration > 5000 && input.value.length > 10) {
            showGentleEncouragement();
          }
        }, 5000);
        setLastKeystroke(Date.now());
      });

      // Network status handling
      window.addEventListener('offline', () => {
        appendMessage("cael", `I notice we've lost connection, ${currentUser?.displayName || 'friend'}. Your thoughts are safe with me - I'll be here when you're back online.`);
        setFormEnabled(false);
      });

      window.addEventListener('online', () => {
        appendMessage("cael", `We're reconnected, ${currentUser?.displayName || 'friend'}. How are you feeling?`);
        setFormEnabled(true);
      });

      // Chat form submission
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        if (!isAuthorized) {
          showAlert('You are not authorized to chat. Please sign in and complete onboarding.', 'error');
          return;
        }
        
        const message = input.value.trim();
        if (!message || isTyping) return;
        
        appendMessage("user", message);
        input.value = "";
        localStorage.removeItem(`zentrafuge_draft_${getUserId()}`);
        
        setFormEnabled(false);
        showTypingIndicator();
        
        let attempt = 1;
        const maxAttempts = 3;
        let success = false;
        
        await loadUserPreferences();
        
        let militaryResponse = null;
        let country = null;
        
        // Military context detection
        if (userPreferences.military_context !== 'never') {
          const messageLower = message.toLowerCase();
          if (messageLower.includes('uk') || messageLower.includes('british') || messageLower.includes('guards') || messageLower.includes('paras')) {
            country = 'uk';
          } else if (messageLower.includes('us') || messageLower.includes('marine corps') || messageLower.includes('semper fi') || messageLower.includes('fort bragg')) {
            country = 'us';
          } else if (messageLower.includes('canada') || messageLower.includes('van doos') || messageLower.includes('ppcli') || messageLower.includes('peacekeeping')) {
            country = 'ca';
          } else if (messageLower.includes('australia') || messageLower.includes('anzac') || messageLower.includes('digger') || messageLower.includes('sasr')) {
            country = 'au';
          } else if (messageLower.includes('new zealand') || messageLower.includes('kiwi') || messageLower.includes('nzsas') || messageLower.includes('māori battalion')) {
            country = 'nz';
          }
          
          // Country-specific military knowledge
          if (country === 'uk' && window.UKMilitaryKnowledge?.detectMilitaryService(message)) {
            const regimentInfo = window.UKMilitaryKnowledge.getRegimentInfo(message);
            const opContext = window.UKMilitaryKnowledge.getOperationContext(message);
            if (regimentInfo) {
              militaryResponse = window.UKMilitaryKnowledge.getMilitaryResponse(message, regimentInfo);
            } else if (opContext) {
              militaryResponse = `You mentioned ${opContext.context} (${opContext.period}). That was a significant time for many. Want to share more about your experience?`;
            }
          } else if (country === 'us' && window.USMilitaryKnowledge?.detectMilitaryService(message)) {
            const unitInfo = window.USMilitaryKnowledge.getUnitInfo(message);
            const opContext = window.USMilitaryKnowledge.getOperationContext(message);
            if (unitInfo) {
              militaryResponse = window.USMilitaryKnowledge.getMilitaryResponse(message, unitInfo);
            } else if (opContext) {
              militaryResponse = `You mentioned ${opContext.context} (${opContext.period}). That was a defining moment for many. Want to share more?`;
            }
          } else if (country === 'ca' && window.CAMilitaryKnowledge?.detectMilitaryService(message)) {
            const unitInfo = window.CAMilitaryKnowledge.getUnitInfo(message);
            const opContext = window.CAMilitaryKnowledge.getOperationContext(message);
            const isFrench = window.CAMilitaryKnowledge.detectLanguage(message) === 'french';
            if (unitInfo) {
              militaryResponse = window.CAMilitaryKnowledge.getMilitaryResponse(message, unitInfo);
            } else if (opContext) {
              militaryResponse = isFrench
                ? `Vous avez mentionné ${opContext.context} (${opContext.period}). C'était une période importante. Voulez-vous en dire plus?`
                : `You mentioned ${opContext.context} (${opContext.period}). That was a significant time for many. Want to share more?`;
            }
          } else if (country === 'au' && window.AUMilitaryKnowledge?.detectMilitaryService(message)) {
            const unitInfo = window.AUMilitaryKnowledge.getUnitInfo(message);
            const opContext = window.AUMilitaryKnowledge.getOperationContext(message);
            if (unitInfo) {
              militaryResponse = window.AUMilitaryKnowledge.getMilitaryResponse(message, unitInfo);
            } else if (opContext) {
              militaryResponse = `You mentioned ${opContext.context} (${opContext.period}). That's part of the ANZAC legacy. Want to share more, mate?`;
            }
          } else if (country === 'nz' && window.NZMilitaryKnowledge?.detectMilitaryService(message)) {
            const unitInfo = window.NZMilitaryKnowledge.getUnitInfo(message);
            const opContext = window.NZMilitaryKnowledge.getOperationContext(message);
            const isMaori = window.NZMilitaryKnowledge.detectMaoriHeritage(message);
            if (unitInfo) {
              militaryResponse = window.NZMilitaryKnowledge.getMilitaryResponse(message, unitInfo);
            } else if (opContext) {
              militaryResponse = isMaori
                ? `You mentioned ${opContext.context} (${opContext.period}). That's tied to Māori warrior pride. Ake Ake Kia Kaha! Want to share more?`
                : `You mentioned ${opContext.context} (${opContext.period}). That's part of the Kiwi legacy. Want to share more, mate?`;
            }
          }
        }
        
        // Retry logic for backend communication
        while (attempt <= maxAttempts && !success) {
          try {
            console.log(`📤 Attempt ${attempt} for message: "${message}"`);
            
            const res = await fetch(`${BACKEND_URL}/index`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: message,
                user_id: getUserId(),
                ai_preferences: userPreferences,
                military_context: militaryResponse ? { detected: true, response: militaryResponse, country } : null
              }),
            });
            
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            
            const data = await res.json();
            console.log(`📬 Response received on attempt ${attempt}:`, data);
            
            // Handle crisis detection
            if (data.redirect_url) {
              console.log('🚨 Crisis detected - redirecting to support');
              hideTypingIndicator();
              if (data.response && data.response.trim()) {
                const processedResponse = applyPreferencesToResponse(data.response, userPreferences);
                await appendMessage("cael", processedResponse, true);
              }
              setTimeout(() => {
                window.location.href = data.redirect_url;
              }, 2000);
              success = true;
              break;
            }
            
            // Handle normal response
            if (data.response && data.response.trim()) {
              hideTypingIndicator();
              let finalResponse = applyPreferencesToResponse(data.response, userPreferences);
              
              // Apply military context if appropriate
              if (militaryResponse && userPreferences.military_context === 'always') {
                finalResponse = `${militaryResponse} ${finalResponse}`;
              } else if (militaryResponse && userPreferences.military_context === 'auto') {
                finalResponse = militaryResponse.includes('Want to share more') ? 
                  `${militaryResponse} ${finalResponse}` : finalResponse;
              }
              
              await appendMessage("cael", finalResponse, true);
              success = true;
              console.log(`✅ Success on attempt ${attempt}`);
              break;
            } else {
              throw new Error('Empty or invalid response from server');
            }
          } catch (error) {
            console.error(`❌ Attempt ${attempt} failed:`, error.message, error.stack);
            if (attempt < maxAttempts) {
              const retryMessages = [
                `I'm still here, ${currentUser?.displayName || 'friend'}. Let me try to respond to that again.`,
                `Sorry about that - sometimes I need a moment to find the right words.`,
                `Technical hiccup on my end. Give me one more try?`
              ];
              await appendMessage("cael", retryMessages[attempt - 1], true);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            attempt++;
          }
        }
        
        // Handle complete failure
        if (!success) {
          hideTypingIndicator();
          await appendMessage("cael", `I'm really sorry, I'm struggling to connect right now, ${currentUser?.displayName || 'friend'}. Please try again soon—I'm here for you.`, true);
        }
        
        setFormEnabled(true);
        document.getElementById("message")?.focus();
      });
    }
    
    // Set up preferences page if present
    if (document.getElementById('language-style')) {
      await loadUserPreferences();
      loadPreferencesIntoForm();
      document.getElementById('save-preferences')?.addEventListener('click', saveUserPreferences);
      document.getElementById('reset-preferences')?.addEventListener('click', resetUserPreferences);
      document.getElementById('test-preferences')?.addEventListener('click', testCurrentPreferences);
    }
    
  } catch (error) {
    console.error('❌ DOMContentLoaded error:', error.message, error.stack);
    redirectToAuth('firebase_init_error');
  }
});

/**
 * Show gentle encouragement when user pauses typing
 */
function showGentleEncouragement() {
  if (!currentUser) return;
  
  const encouragements = [
    `Take your time, ${currentUser.displayName || 'friend'}. I'm here when you're ready.`,
    `No rush - I'm listening whenever you want to share.`,
    `I'm here with you. Share what feels right.`
  ];
  
  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
  appendMessage("cael", randomEncouragement, true);
}
