import { BACKEND_URL, currentUser, DEFAULT_PREFERENCES, userPreferences, setUserPreferences } from './config.js';
import { getUserId } from './auth.js';
import { showPreferencesStatus } from './ui.js';

export async function loadUserPreferences() {
  try {
    if (!currentUser) {
      console.warn('⚠️ No current user, returning default preferences');
      return DEFAULT_PREFERENCES;
    }
    
    const db = firebase.firestore();
    const userDoc = await db.collection("users").doc(currentUser.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      setUserPreferences({ ...DEFAULT_PREFERENCES, ...userData.ai_preferences });
      console.log('📄 Loaded user preferences:', userPreferences);
    } else {
      console.warn('⚠️ User document not found, using default preferences');
    }
    
    return userPreferences;
  } catch (error) {
    console.error("❌ Error loading user preferences:", error.message, error.stack);
    return DEFAULT_PREFERENCES;
  }
}

export async function saveUserPreferences() {
  try {
    if (!currentUser) {
      showPreferencesStatus('Please log in to save preferences', 'error');
      return;
    }
    
    const preferences = {
      language_style: document.getElementById('language-style')?.value || 'direct',
      response_length: document.getElementById('response-length')?.value || 'moderate',
      military_context: document.getElementById('military-context')?.value || 'auto',
      emotional_pacing: document.getElementById('emotional-pacing')?.value || 'gentle',
      memory_usage: document.getElementById('memory-usage')?.value || 'contextual',
      session_reminders: document.getElementById('session-reminders')?.value || 'gentle',
      updated_at: new Date().toISOString()
    };
    
    const db = firebase.firestore();
    await db.collection("users").doc(currentUser.uid).update({
      ai_preferences: preferences
    });
    
    setUserPreferences(preferences);
    
    showPreferencesStatus('Preferences saved successfully!', 'success');
    console.log('📄 User preferences saved:', preferences);
  } catch (error) {
    console.error("❌ Error saving preferences:", error.message, error.stack);
    showPreferencesStatus('Failed to save preferences. Please try again.', 'error');
  }
}

export function loadPreferencesIntoForm() {
  try {
    document.getElementById('language-style')?.value = userPreferences.language_style || 'direct';
    document.getElementById('response-length')?.value = userPreferences.response_length || 'moderate';
    document.getElementById('military-context')?.value = userPreferences.military_context || 'auto';
    document.getElementById('emotional-pacing')?.value = userPreferences.emotional_pacing || 'gentle';
    document.getElementById('memory-usage')?.value = userPreferences.memory_usage || 'contextual';
    document.getElementById('session-reminders')?.value = userPreferences.session_reminders || 'gentle';
  } catch (error) {
    console.error("❌ Error loading preferences into form:", error.message, error.stack);
  }
}

export async function resetUserPreferences() {
  try {
    if (confirm('Are you sure you want to reset all preferences to defaults?')) {
      setUserPreferences({ ...DEFAULT_PREFERENCES });
      loadPreferencesIntoForm();
      await saveUserPreferences();
      showPreferencesStatus('Preferences reset to defaults', 'success');
    }
  } catch (error) {
    console.error("❌ Error resetting preferences:", error.message, error.stack);
    showPreferencesStatus('Failed to reset preferences', 'error');
  }
}

export async function testCurrentPreferences() {
  try {
    const testMessage = generateTestMessage();
    
    showPreferencesStatus('Testing current settings...', 'info');
    
    const testResponse = await fetch(`${BACKEND_URL}/index`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "This is a test of my current AI preferences",
        user_id: getUserId(),
        ai_preferences: userPreferences,
        is_test: true
      }),
    });
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      showPreferencesStatus(`Test successful! Response style: ${userPreferences.language_style}`, 'success');
    } else {
      showPreferencesStatus('Test failed. Please check your connection.', 'error');
    }
  } catch (error) {
    console.error("❌ Error testing preferences:", error.message, error.stack);
    showPreferencesStatus('Test failed. Please try again.', 'error');
  }
}

export function generateTestMessage() {
  const style = userPreferences.language_style;
  const testMessages = {
    direct: "How are you doing today?",
    warm: "I hope you're having a good day. How are you feeling?",
    formal: "Good day. How may I assist you today?",
    casual: "Hey there! What's up?"
  };
  
  return testMessages[style] || testMessages.direct;
}

export function applyPreferencesToResponse(response, preferences) {
  if (!preferences || !response) return response;
  
  let modifiedResponse = response;
  
  switch (preferences.language_style) {
    case 'direct':
      modifiedResponse = modifiedResponse
        .replace(/like a (.*?) (blooming|sprouting|growing)/gi, '')
        .replace(/much like (.*?),/gi, '')
        .replace(/it's like (.*?),/gi, '');
      break;
    case 'formal':
      modifiedResponse = modifiedResponse.replace(/\b(hey|hi)\b/gi, 'Good day');
      break;
    case 'casual':
      modifiedResponse = modifiedResponse.replace(/\bGood (morning|afternoon|evening)\b/gi, 'Hey');
      break;
  }
  
  if (preferences.response_length === 'brief') {
    const sentences = modifiedResponse.split('. ');
    if (sentences.length > 2) {
      modifiedResponse = sentences.slice(0, 2).join('. ') + '.';
    }
  }
  
  return modifiedResponse;
}
