export const BACKEND_URL = "https://zentrafuge-v8.onrender.com";
export let isTyping = false;
export let currentUser = null;
export let isAuthorized = false;
export let aiName = "Cael";
export let lastKeystroke = Date.now();
export let sessionDurationInterval = null;
export let sessionWarningShown = false;
export let isInitializing = false;

export const DEFAULT_PREFERENCES = {
  language_style: 'direct',
  response_length: 'moderate',
  military_context: 'auto',
  emotional_pacing: 'gentle',
  memory_usage: 'contextual',
  session_reminders: 'gentle'
};

export let userPreferences = { ...DEFAULT_PREFERENCES };

// Setter functions to update state
export function setIsTyping(value) {
  isTyping = value;
}

export function setCurrentUser(user) {
  currentUser = user;
}

export function setIsAuthorized(value) {
  isAuthorized = value;
}

export function setAiName(name) {
  aiName = name;
}

export function setLastKeystroke(time) {
  lastKeystroke = time;
}

export function setSessionDurationInterval(interval) {
  sessionDurationInterval = interval;
}

export function setSessionWarningShown(value) {
  sessionWarningShown = value;
}

export function setIsInitializing(value) {
  isInitializing = value;
}

export function setUserPreferences(preferences) {
  userPreferences = preferences;
}
