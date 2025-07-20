const BACKEND_URL = "https://zentrafuge-v8.onrender.com";
let isTyping = false;
let currentUser = null;
let isAuthorized = false;
let aiName = "Cael"; // Default AI name
let lastKeystroke = Date.now();
let sessionDurationInterval = null;
let sessionWarningShown = false;
let isInitializing = false; // Prevent multiple initializations

// Default preferences
const DEFAULT_PREFERENCES = {
  language_style: 'direct',
  response_length: 'moderate',
  military_context: 'auto',
  emotional_pacing: 'gentle',
  memory_usage: 'contextual',
  session_reminders: 'gentle'
};

// Current user preferences
let userPreferences = { ...DEFAULT_PREFERENCES };

// Wait for Firebase to initialize
async function waitForFirebase() {
  return new Promise((resolve, reject) => {
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      console.error('Firebase not initialized');
      reject(new Error('Firebase SDK not loaded or initialized'));
    }
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      unsubscribe(); // Clean up immediately
      resolve();
    }, error => {
      unsubscribe();
      console.error('Firebase auth initialization error:', error);
      reject(error);
    });
  });
}

// Stream text character by character with pauses and cursor
function streamTextAdvanced(text, targetElement, speed = 30) {
  return new Promise((resolve) => {
    let index = 0;
    targetElement.textContent = '';
    
    const cursor = document.createElement('span');
    cursor.textContent = '▋';
    cursor.style.opacity = '0.7';
    cursor.style.animation = 'blink 1s infinite';
    targetElement.appendChild(cursor);
    
    function typeNextCharacter() {
      if (index < text.length) {
        const char = text[index];
        
        let delay = speed;
        if (char === '.' || char === '!' || char === '?') {
          delay = speed * 3; // 90ms for sentence endings
        } else if (char === ',' || char === ';') {
          delay = speed * 2; // 60ms for commas
        }
        
        targetElement.textContent = text.slice(0, index + 1);
        targetElement.appendChild(cursor);
        index++;
        
        const chat = document.getElementById("chat");
        if (chat) chat.scrollTop = chat.scrollHeight;
        
        setTimeout(typeNextCharacter, delay);
      } else {
        cursor.remove();
        resolve();
      }
    }
    
    typeNextCharacter();
  });
}

// Get AI name from Firestore
async function getAiName(userId) {
  try {
    const db = firebase.firestore();
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`Fetched user document for ${userId}:`, userData);
      return userData.ai_name || "Cael";
    }
    console.warn(`User document not found for ${userId}`);
    return "Cael";
  } catch (error) {
    console.error("Error fetching AI name:", error);
    return "Cael";
  }
}

// Fetch last session context
async function getLastSessionContext(userId) {
  try {
    const res = await fetch(`${BACKEND_URL}/context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    console.log('Last session context:', data);
    return data.context || { mood: null, theme: null };
  } catch (error) {
    console.error("Error fetching session context:", error);
    return { mood: null, theme: null };
  }
}

// Fetch mood data for dashboard
async function getMoodData(userId) {
  try {
    const res = await fetch(`${BACKEND_URL}/mood_data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    console.log('Mood data received:', data);
    return data.moods || [];
  } catch (error) {
    console.error("Error fetching mood data:", error);
    return [];
  }
}

// Render mood chart using Chart.js
async function renderMoodChart(userId) {
  const moodData = await getMoodData(userId);
  const ctx = document.getElementById('moodChart')?.getContext('2d');
  if (!ctx) return;

  const labels = moodData.map(m => new Date(m.timestamp).toLocaleDateString());
  const scores = moodData.map(m => m.score);
  const moods = moodData.map(m => m.mood);

  // Calculate trend for summary
  let trend = 'stable';
  if (moodData.length >= 2) {
    const recentScore = scores[scores.length - 1];
    const prevScore = scores[0];
    trend = recentScore > prevScore ? 'improving' : recentScore < prevScore ? 'declining' : 'stable';
  }

  // Update summary
  const summaryDiv = document.getElementById('moodSummary');
  if (summaryDiv) {
    summaryDiv.textContent = moodData.length > 0
      ? `Your mood has been ${trend} over the last ${moodData.length} entries. Latest mood: ${moods[moods.length - 1] || 'unknown'} (Score: ${scores[scores.length - 1] || 5}).`
      : 'No mood data available yet. Chat with your AI companion to start tracking your mood!';
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Mood Score',
        data: scores,
        borderColor: '#0055aa',
        backgroundColor: 'rgba(0, 85, 170, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0055aa',
        pointHoverBackgroundColor: '#4a90e2',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => `Mood: ${moods[context.dataIndex]} (Score: ${context.parsed.y})`
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { stepSize: 1 },
          title: { display: true, text: 'Mood Score (1-10)' }
        },
        x: {
          title: { display: true, text: 'Date' }
        }
      }
    }
  });
}

// Dynamic user greetings
async function getNewUserGreetings() {
  return [
    `Hi there. I'm ${aiName} - I'm here if you need someone to talk to.`,
    `Hey. I'm ${aiName}. I hope this space can feel safe for you.`,
    `Hi - I'm ${aiName}. I'm here to listen, whatever's going on.`,
    `Hey there. I'm ${aiName}, and I'm genuinely glad you're here.`,
    `Hi. I'm ${aiName} - think of me as a friend who's always here.`,
    `Hey. I'm ${aiName}. This can be whatever kind of conversation you need.`
  ];
}

// Auth Guard
async function checkUserAuthorization(user) {
  try {
    if (!user) {
      console.warn('No user provided to checkUserAuthorization');
      throw new Error('No user provided');
    }
    const db = firebase.firestore();
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      console.warn(`Authorization failed for ${user.email}: User document not found`);
      throw new Error('User document not found');
    }
    const userData = userDoc.data();
    if (!userData.emailVerified) {
      console.warn(`Authorization failed for ${user.email}: Email not verified in Firestore`);
      throw new Error('Email not verified');
    }
    if (!userData.onboardingComplete) {
      console.warn(`Authorization failed for ${user.email}: Onboarding not completed`);
      throw new Error('Onboarding not completed');
    }
    console.log(`Authorization succeeded for ${user.email}`);
    return true;
  } catch (error) {
    console.error('Authorization check failed:', error.message, error.stack);
    return false;
  }
}

// Redirect to auth
function redirectToAuth(reason = 'unauthorized') {
  if (isInitializing) {
    console.warn('Preventing redirect loop during initialization:', reason);
    return;
  }
  console.log('Redirecting to auth:', reason);
  const params = new URLSearchParams({ reason });
  window.location.href = `index.html?${params}`;
}

// Initialize app
async function initializeApp(user) {
  if (isInitializing) {
    console.warn('Already initializing, skipping...');
    return;
  }
  isInitializing = true;
  try {
    currentUser = user;
    aiName = await getAiName(user.uid);
    console.log(`Setting AI name to: ${aiName}`);
    
    // Update title and header based on page
    const isDashboard = window.location.pathname.includes('dashboard.html');
    const isPreferences = window.location.pathname.includes('preferences.html');
    const pageTitle = isDashboard ? 'Dashboard' : isPreferences ? 'Preferences' : aiName;
    document.title = `Zentrafuge × ${pageTitle}`;
    const headerImg = document.querySelector('header img');
    if (headerImg) {
      headerImg.setAttribute('onerror', 
        `this.style.display='none'; this.insertAdjacentHTML('afterend', '<h1>Zentrafuge × ${pageTitle}</h1>');`
      );
    }
    
    // Update user info
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
      userInfo.textContent = `Welcome, ${user.displayName || user.email}`;
    }
    
    // Show main content
    const authLoading = document.getElementById('auth-loading');
    if (authLoading) authLoading.style.display = 'none';
    const mainHeader = document.getElementById('main-header');
    if (mainHeader) mainHeader.style.display = 'flex';
    const contentDiv = document.getElementById(isDashboard ? 'dashboard' : isPreferences ? 'preferences' : 'chat');
    if (contentDiv) contentDiv.style.display = 'flex';
    
    if (isDashboard) {
      await renderMoodChart(user.uid);
    } else if (isPreferences) {
      await loadUserPreferences();
      loadPreferencesIntoForm();
    } else {
      const chatForm = document.getElementById('chat-form');
      if (chatForm) {
        chatForm.style.display = 'flex';
        chatForm.setAttribute('aria-label', `Ask ${aiName} something`);
        const messageInput = document.getElementById('message');
        if (messageInput) {
          messageInput.placeholder = `Ask ${aiName} something...`;
          messageInput.focus();
        }
      }
      await loadPreviousMessages();
      
      // Set session start time and begin monitoring
      sessionStorage.setItem('session_start', Date.now());
      sessionWarningShown = false;
      
      // Clear any existing interval before setting a new one
      if (sessionDurationInterval) {
        clearInterval(sessionDurationInterval);
      }
      
      // Set up session monitoring
      sessionDurationInterval = setInterval(checkSessionDuration, 60000); // Check every minute
    }
  } catch (error) {
    console.error('Error initializing app:', error.message, error.stack);
    redirectToAuth('initialization_failed');
  } finally {
    isInitializing = false;
  }
}

// Logout handler
async function handleLogout() {
  try {
    await firebase.auth().signOut();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Error signing out. Please try again.');
  }
}

function generateUniqueUserId() {
  return currentUser ? currentUser.uid : `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getUserId() {
  if (!currentUser || !currentUser.uid) {
    console.error('❌ No authenticated user found');
    throw new Error('User not authenticated');
  }
  return currentUser.uid;
}

function showTypingIndicator() {
  if (isTyping) return;
  isTyping = true;
  const chat = document.getElementById("chat");
  if (!chat) return;
  const typingDiv = document.createElement("div");
  typingDiv.className = "typing-indicator";
  typingDiv.id = "typing-indicator";
  typingDiv.innerHTML = `
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  chat.appendChild(typingDiv);
  chat.scrollTop = chat.scrollHeight;
}

function hideTypingIndicator() {
  isTyping = false;
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) typingIndicator.remove();
}

function showGentleEncouragement() {
  const chat = document.getElementById("chat");
  if (!chat) return;
  const encouragementDiv = document.createElement("div");
  encouragementDiv.className = "message encouragement-message";
  encouragementDiv.textContent = `Take your time, ${currentUser?.displayName || 'friend'} - I'm here when you're ready.`;
  chat.appendChild(encouragementDiv);
  chat.scrollTop = chat.scrollHeight;
}

// Dynamic Welcome System
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 6) return 'late night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function getSeasonalContext() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

async function generateDynamicWelcome(userName = null, isReturning = false) {
  const timeOfDay = getTimeOfDay();
  const season = getSeasonalContext();
  const newUserGreetings = await getNewUserGreetings();
  
  const timeGreetings = {
    'morning': [
      "Morning! Hope you're starting your day gently.",
      "Good morning. How did you sleep?",
      "Morning - I hope today feels manageable for you.",
      "Hey there. How's this morning treating you?"
    ],
    'afternoon': [
      "Afternoon. How's your day unfolding?",
      "Hey! Hope your day's been kind to you so far.",
      "Good afternoon. What's on your mind today?",
      "Afternoon - how are you holding up today?"
    ],
    'evening': [
      "Evening. How was your day?",
      "Hey there. How are you winding down tonight?",
      "Good evening. What's sitting with you today?",
      "Evening - hope you can breathe a little easier now."
    ],
    'night': [
      "Hey. Still up? How are you doing tonight?",
      "Evening, night owl. What's keeping you up?",
      "Hey there. Late night thoughts?",
      "Hi. Sometimes the quiet hours are when we need to talk most."
    ],
    'late night': [
      "Hey. Really late night - you okay?",
      "Hi there. Can't sleep either?",
      "Hey. Sometimes 3am is when we need a friend most.",
      "Hi. The world's quiet right now - what's on your mind?"
    ]
  };
  
  const returningGreetings = [
    `Welcome back. I've been here, just thinking.`,
    `Hey again. Good to see you.`,
    `You're back - how have you been since we last talked?`,
    `Hi there. I was wondering how you were doing.`,
    `Welcome back. What's been with you lately?`,
    `Hey - I'm glad you came back to talk.`,
    `Hi again. How's life been treating you?`
  ];
  
  const followUps = [
    "What's on your heart today?",
    "How are you, really?",
    "What's sitting with you right now?",
    "How has your inner weather been lately?",
    "What do you need to share today?",
    "How are you holding up?",
    "What's been heavy on your mind?",
    "How has your spirit doing today?",
    "What would feel good to talk about?",
    "How are you taking care of yourself lately?",
    "What's your heart telling you today?",
    "How has this week been for your soul?"
  ];
  
  let greeting;
  
  if (isReturning) {
    const lastContext = await getLastSessionContext(getUserId());
    if (lastContext.mood === 'struggling') {
      greeting = `Hey again, ${userName || 'friend'}. I've been thinking about our last conversation. How are you holding up?`;
    } else if (lastContext.theme === 'work_stress') {
      greeting = `Welcome back, ${userName || 'friend'}. How has that work situation been sitting with you?`;
    } else {
      const useTimeGreeting = Math.random() < 0.6;
      if (useTimeGreeting && timeGreetings[timeOfDay]) {
        greeting = timeGreetings[timeOfDay][Math.floor(Math.random() * timeGreetings[timeOfDay].length)];
      } else {
        greeting = returningGreetings[Math.floor(Math.random() * returningGreetings.length)];
      }
    }
  } else {
    greeting = newUserGreetings[Math.floor(Math.random() * newUserGreetings.length)];
  }
  
  if (userName && isReturning) {
    greeting = greeting.replace(/^(Hey|Hi|Good|Morning|Afternoon|Evening)/i, `$1, ${userName}`);
  }
  
  // Apply user preferences to welcome message
  let finalGreeting = greeting;
  if (userPreferences.language_style === 'direct') {
    finalGreeting = finalGreeting.replace(/like a (.*?) (blooming|sprouting|growing)/gi, '')
                                 .replace(/much like (.*?),/gi, '')
                                 .replace(/it's like (.*?),/gi, '');
  } else if (userPreferences.language_style === 'formal') {
    finalGreeting = finalGreeting.replace(/\b(hey|hi)\b/gi, 'Good day');
  } else if (userPreferences.language_style === 'casual') {
    finalGreeting = finalGreeting.replace(/\bGood (morning|afternoon|evening)\b/gi, 'Hey');
  }
  
  const followUp = followUps[Math.floor(Math.random() * followUps.length)];
  return `${finalGreeting} ${followUp}`;
}

async function showWelcomeMessage(isReturning = false, userName = null) {
  const chat = document.getElementById("chat");
  if (!chat) return;
  chat.innerHTML = '';
  const welcomeDiv = document.createElement("div");
  welcomeDiv.className = "message welcome-message";
  welcomeDiv.textContent = await generateDynamicWelcome(userName, isReturning);
  chat.appendChild(welcomeDiv);
  chat.scrollTop = chat.scrollHeight;
  console.log('✨ Dynamic welcome message displayed');
}

async function loadPreviousMessages() {
  if (!isAuthorized) return;
  console.log('🔍 Loading previous messages...');
  try {
    const res = await fetch(`${BACKEND_URL}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: getUserId() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    console.log('📦 History data received:', data);
    const chat = document.getElementById("chat");
    if (!chat) return;
    chat.innerHTML = '';
    if (Array.isArray(data.history) && data.history.length > 0) {
      let validMessagesLoaded = 0;
      let userName = null;
      data.history.slice(0, 5).forEach((entry) => {
        if (entry && entry.user) {
          const message = entry.user.toLowerCase();
          if ((message.includes('my name is') || message.includes("i'm ") || message.includes('call me')) && 
              (message.includes('anthony') || message.includes('ant'))) {
            userName = message.includes('anthony') ? 'Anthony' : 'Ant';
          }
        }
      });
      data.history.forEach((entry, index) => {
        if (entry && 
            typeof entry.user === 'string' && 
            typeof entry.cael === 'string' && 
            entry.user.trim() && 
            entry.cael.trim()) {
          appendMessage("user", entry.user.trim());
          appendMessage("cael", applyPreferencesToResponse(entry.cael.trim(), userPreferences));
          validMessagesLoaded++;
        } else {
          console.warn(`⚠️ Skipping invalid history entry ${index}:`, entry);
        }
      });
      console.log(`✅ Loaded ${validMessagesLoaded} valid messages from history`);
      if (validMessagesLoaded == 0) {
        showWelcomeMessage(false);
      } else {
        const welcomeDiv = document.createElement("div");
        welcomeDiv.className = "message welcome-message";
        welcomeDiv.style.order = "-1";
        welcomeDiv.textContent = await generateDynamicWelcome(userName, true);
        chat.insertBefore(welcomeDiv, chat.firstChild);
        console.log(`👋 Added returning user welcome${userName ? ` for ${userName}` : ''}`);
      }
    } else {
      console.log('📭 No chat history found, showing welcome message');
      showWelcomeMessage(false);
    }
  } catch (err) {
    console.error("❌ Error loading chat history:", err);
    showWelcomeMessage(false);
  }
}

function appendMessage(role, text, useStreaming = false) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    console.warn('⚠️ Attempted to append empty/invalid message:', { role, text });
    return;
  }
  
  const chat = document.getElementById("chat");
  if (!chat) return;
  const div = document.createElement("div");
  div.className = `message ${role}`;
  
  if (useStreaming && role === 'cael') {
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return streamTextAdvanced(text.trim(), div, 30);
  } else {
    div.textContent = text.trim();
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return Promise.resolve();
  }
}

function setFormEnabled(enabled) {
  const input = document.getElementById("message");
  const button = document.getElementById("send-button");
  if (!input || !button) return;
  input.disabled = !enabled;
  button.disabled = !enabled;
  input.placeholder = enabled ? `Ask ${aiName} something...` : `${aiName} is thinking...`;
}

function checkSessionDuration() {
  const sessionStartTime = parseInt(sessionStorage.getItem('session_start'), 10) || Date.now();
  const duration = Date.now() - sessionStartTime;
  
  // Check if 45 minutes have passed and warning hasn't been shown yet
  if (duration > 45 * 60 * 1000 && !sessionWarningShown) {
    sessionWarningShown = true;
    let reminderMessage = `We've been talking for a while, ${currentUser?.displayName || 'friend'}. How are you feeling? Sometimes it helps to take a pause.`;
    
    if (userPreferences.language_style === 'direct') {
      reminderMessage = `We've been chatting for ${Math.round(duration / (60 * 1000))} minutes. Want to take a break?`;
    } else if (userPreferences.language_style === 'casual') {
      reminderMessage = `Hey, we've been talking for a while now. You doing okay? Maybe time for a quick break?`;
    }
    
    appendMessage("cael", reminderMessage);
    
    // Clear the interval to prevent repetition
    if (sessionDurationInterval) {
      clearInterval(sessionDurationInterval);
      sessionDurationInterval = null;
    }
    
    // Optional: Set up a longer interval for additional check-ins
    setTimeout(() => {
      if (Date.now() - sessionStartTime > 90 * 60 * 1000) { // 90 minutes
        appendMessage("cael", `You've been here a while now. Remember to take care of yourself - I'll be here when you get back.`);
      }
    }, 45 * 60 * 1000); // Check again in 45 minutes
  }
}

// Load user preferences from Firestore
async function loadUserPreferences() {
  try {
    if (!currentUser) {
      console.warn('No current user, returning default preferences');
      return DEFAULT_PREFERENCES;
    }
    
    const db = firebase.firestore();
    const userDoc = await db.collection("users").doc(currentUser.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      userPreferences = { ...DEFAULT_PREFERENCES, ...userData.ai_preferences };
      console.log('Loaded user preferences:', userPreferences);
    } else {
      console.warn('User document not found, using default preferences');
    }
    
    return userPreferences;
  } catch (error) {
    console.error("Error loading user preferences:", error.message, error.stack);
    return DEFAULT_PREFERENCES;
  }
}

// Save user preferences to Firestore
async function saveUserPreferences() {
  try {
    if (!currentUser) {
      showPreferencesStatus('Please log in to save preferences', 'error');
      return;
    }
    
    // Get current form values
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
    
    userPreferences = preferences;
    
    showPreferencesStatus('Preferences saved successfully!', 'success');
    console.log('User preferences saved:', preferences);
    
  } catch (error) {
    console.error("Error saving preferences:", error.message, error.stack);
    showPreferencesStatus('Failed to save preferences. Please try again.', 'error');
  }
}

// Load preferences into form
function loadPreferencesIntoForm() {
  try {
    document.getElementById('language-style').value = userPreferences.language_style || 'direct';
    document.getElementById('response-length').value = userPreferences.response_length || 'moderate';
    document.getElementById('military-context').value = userPreferences.military_context || 'auto';
    document.getElementById('emotional-pacing').value = userPreferences.emotional_pacing || 'gentle';
    document.getElementById('memory-usage').value = userPreferences.memory_usage || 'contextual';
    document.getElementById('session-reminders').value = userPreferences.session_reminders || 'gentle';
  } catch (error) {
    console.error("Error loading preferences into form:", error.message, error.stack);
  }
}

// Reset preferences to defaults
async function resetUserPreferences() {
  try {
    if (confirm('Are you sure you want to reset all preferences to defaults?')) {
      userPreferences = { ...DEFAULT_PREFERENCES };
      loadPreferencesIntoForm();
      await saveUserPreferences();
      showPreferencesStatus('Preferences reset to defaults', 'success');
    }
  } catch (error) {
    console.error("Error resetting preferences:", error.message, error.stack);
    showPreferencesStatus('Failed to reset preferences', 'error');
  }
}

// Test current preferences with a sample message
async function testCurrentPreferences() {
  try {
    const testMessage = generateTestMessage();
    
    showPreferencesStatus('Testing current settings...', 'info');
    
    // Simulate sending a test message
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
    console.error("Error testing preferences:", error.message, error.stack);
    showPreferencesStatus('Test failed. Please try again.', 'error');
  }
}

// Generate test message based on preferences
function generateTestMessage() {
  const style = userPreferences.language_style;
  const testMessages = {
    direct: "How are you doing today?",
    warm: "I hope you're having a good day. How are you feeling?",
    formal: "Good day. How may I assist you today?",
    casual: "Hey there! What's up?"
  };
  
  return testMessages[style] || testMessages.direct;
}

// Show status message
function showPreferencesStatus(message, type) {
  const statusDiv = document.getElementById('preferences-status');
  const statusMessage = document.getElementById('status-message');
  
  if (statusDiv && statusMessage) {
    statusMessage.textContent = message;
    statusDiv.className = `preferences-status ${type}`;
    statusDiv.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

// Apply preferences to chat responses
function applyPreferencesToResponse(response, preferences) {
  if (!preferences || !response) return response;
  
  let modifiedResponse = response;
  
  // Apply language style modifications
  switch (preferences.language_style) {
    case 'direct':
      // Remove flowery language, keep it straightforward
      modifiedResponse = modifiedResponse
        .replace(/like a (.*?) (blooming|sprouting|growing)/gi, '')
        .replace(/much like (.*?),/gi, '')
        .replace(/it's like (.*?),/gi, '');
      break;
    case 'formal':
      // Make it more formal
      modifiedResponse = modifiedResponse.replace(/\b(hey|hi)\b/gi, 'Good day');
      break;
    case 'casual':
      // Make it more casual
      modifiedResponse = modifiedResponse.replace(/\bGood (morning|afternoon|evening)\b/gi, 'Hey');
      break;
  }
  
  // Apply response length modifications
  if (preferences.response_length === 'brief') {
    // Truncate longer responses
    const sentences = modifiedResponse.split('. ');
    if (sentences.length > 2) {
      modifiedResponse = sentences.slice(0, 2).join('. ') + '.';
    }
  }
  
  return modifiedResponse;
}

// Authentication and chat form submission
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔥 DOM loaded, waiting for Firebase initialization');
  
  try {
    // Wait for Firebase to be ready
    await waitForFirebase();
    console.log('✅ Firebase initialized');
    
    // Set up auth observer
    firebase.auth().onAuthStateChanged(async function(user) {
      console.log('Auth state changed:', user ? user.email : 'No user');
      
      if (isInitializing) {
        console.warn('Already handling auth state, skipping...');
        return;
      }
      
      try {
        if (user && !user.isAnonymous) {
          console.log('User authenticated:', user.email);
          const authorized = await checkUserAuthorization(user);
          if (authorized) {
            isAuthorized = true;
            await initializeApp(user);
          } else {
            const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
            if (!userDoc.exists) {
              console.warn('User document does not exist, redirecting to auth');
              redirectToAuth('email_verification');
            } else {
              const userData = userDoc.data();
              if (!userData.emailVerified) {
                redirectToAuth('email_verification');
              } else if (!userData.onboardingComplete) {
                redirectToAuth('onboarding_incomplete');
              } else {
                redirectToAuth('authorization_failed');
              }
            }
          }
        } else {
          console.warn('No user or anonymous user detected');
          redirectToAuth('not_signed_in');
        }
      } catch (error) {
        console.error('Auth state observer error:', error.message, error.stack);
        redirectToAuth('auth_error');
      }
    });
    
    // Load preferences only after auth is confirmed
    const input = document.getElementById("message");
    const form = document.getElementById("chat-form");
    
    // Only set up chat form listeners if on chat page
    if (form) {
      const savedDraft = localStorage.getItem(`zentrafuge_draft_${getUserId()}`);
      if (savedDraft && currentUser) {
        input.value = savedDraft;
        appendMessage("cael", `I saved what you were writing, ${currentUser?.displayName || 'friend'} - want to continue?`);
      }

      setInterval(() => {
        if (!input || !currentUser) return;
        const draft = input.value;
        if (draft.length > 3) {
          localStorage.setItem(`zentrafuge_draft_${getUserId()}`, draft);
        } else {
          localStorage.removeItem(`zentrafuge_draft_${getUserId()}`);
        }
      }, 2000);

      input?.addEventListener('keyup', () => {
        setTimeout(() => {
          const pauseDuration = Date.now() - lastKeystroke;
          if (pauseDuration > 5000 && input.value.length > 10) {
            showGentleEncouragement();
          }
        }, 5000);
        lastKeystroke = Date.now();
      });

      window.addEventListener('offline', () => {
        appendMessage("cael", `I notice we've lost connection, ${currentUser?.displayName || 'friend'}. Your thoughts are safe with me - I'll be here when you're back online.`);
        setFormEnabled(false);
      });

      window.addEventListener('online', () => {
        appendMessage("cael", `We're reconnected, ${currentUser?.displayName || 'friend'}. How are you feeling?`);
        setFormEnabled(true);
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        if (!isAuthorized) {
          alert('You are not authorized to chat. Please sign in and complete onboarding.');
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
        
        // Load current user preferences
        await loadUserPreferences();
        
        // Check for military context based on user preferences
        let militaryResponse = null;
        let country = null;
        
        // Only check military context if user allows it
        if (userPreferences.military_context !== 'never') {
          // Detect country context
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
          
          // Apply military knowledge based on detected country
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
        
        while (attempt <= maxAttempts && !success) {
          try {
            console.log(`Attempt ${attempt} for message: "${message}"`);
            
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
            console.log(`Response received on attempt ${attempt}:`, data);
            
            if (data.redirect_url) {
              console.log('Crisis detected - redirecting to support');
              hideTypingIndicator();
              if (data.response && data.response.trim()) {
                // Apply user preferences to the response
                const processedResponse = applyPreferencesToResponse(data.response, userPreferences);
                await appendMessage("cael", processedResponse, true);
              }
              setTimeout(() => {
                window.location.href = data.redirect_url;
              }, 2000);
              success = true;
              break;
            }
            
            if (data.response && data.response.trim()) {
              hideTypingIndicator();
              
              // Apply user preferences to the response
              let finalResponse = applyPreferencesToResponse(data.response, userPreferences);
              
              // Combine with military response if detected
              if (militaryResponse && userPreferences.military_context === 'always') {
                finalResponse = `${militaryResponse} ${finalResponse}`;
              } else if (militaryResponse && userPreferences.military_context === 'auto') {
                // Only add military context if it's relevant to the conversation
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
        
        if (!success) {
          hideTypingIndicator();
          await appendMessage("cael", `I'm really sorry, I'm struggling to connect right now, ${currentUser?.displayName || 'friend'}. Please try again soon—I'm here for you.`, true);
        }
        
        setFormEnabled(true);
        document.getElementById("message")?.focus();
      });
    }
    
    // Only run preferences initialization if we're on a page with preferences
    if (document.getElementById('language-style')) {
      await loadUserPreferences();
      loadPreferencesIntoForm();
      
      // Set up event listeners
      document.getElementById('save-preferences')?.addEventListener('click', saveUserPreferences);
      document.getElementById('reset-preferences')?.addEventListener('click', resetUserPreferences);
      document.getElementById('test-preferences')?.addEventListener('click', testCurrentPreferences);
    }
  } catch (error) {
    console.error('DOMContentLoaded error:', error.message, error.stack);
    redirectToAuth('firebase_init_error');
  }
});

function showChartsModal() {
  if (!currentUser) {
    alert('Please log in to view your charts.');
    return;
  }
  
  const modalOverlay = document.createElement('div');
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 800px;
    width: 90%;
    max-height: 80%;
    overflow-y: auto;
    position: relative;
  `;
  
  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="margin: 0; color: #0055aa;">Your Emotional Journey</h2>
      <button onclick="this.closest('.modal-overlay').remove()" style="
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      ">×</button>
    </div>
    
    <div id="modal-mood-summary" style="
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-style: italic;
      color: #666;
    ">Loading your mood data...</div>
    
    <div style="height: 400px; position: relative;">
      <canvas id="modal-mood-chart"></canvas>
    </div>
    
    <div style="margin-top: 1.5rem; text-align: center;">
      <button onclick="window.location.href='dashboard.html'" style="
        background: #0055aa;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        margin-right: 0.5rem;
      ">View Full Dashboard</button>
      
      <button onclick="this.closest('.modal-overlay').remove()" style="
        background: #6c757d;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      ">Close</button>
    </div>
  `;
  
  modalOverlay.className = 'modal-overlay';
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);
  
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.remove();
    }
  });
  
  renderModalMoodChart(currentUser.uid);
}

async function renderModalMoodChart(userId) {
  const moodData = await getMoodData(userId);
  const ctx = document.getElementById('modal-mood-chart')?.getContext('2d');
  if (!ctx) return;

  const labels = moodData.map(m => new Date(m.timestamp).toLocaleDateString());
  const scores = moodData.map(m => m.score);
  const moods = moodData.map(m => m.mood);

  let trend = 'stable';
  if (moodData.length >= 2) {
    const recentScore = scores[scores.length - 1];
    const prevScore = scores[0];
    trend = recentScore > prevScore ? 'improving' : recentScore < prevScore ? 'declining' : 'stable';
  }

  const summaryDiv = document.getElementById('modal-mood-summary');
  if (summaryDiv) {
    summaryDiv.textContent = moodData.length > 0
      ? `Your mood has been ${trend} over the last ${moodData.length} entries. Latest mood: ${moods[moods.length - 1] || 'unknown'} (Score: ${scores[scores.length - 1] || 5}).`
      : 'No mood data available yet. Chat with Cael to start tracking your emotional journey!';
  }

  if (moodData.length === 0) {
    ctx.canvas.style.display = 'none';
    return;
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Mood Score',
        data: scores,
        borderColor: '#0055aa',
        backgroundColor: 'rgba(0, 85, 170, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0055aa',
        pointHoverBackgroundColor: '#4a90e2',
        pointRadius: 6,
        pointHoverRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${moods[context.dataIndex]} (Score: ${context.parsed.y})`
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { stepSize: 1 },
          title: { display: true, text: 'Mood Score (1-10)' }
        },
        x: {
          title: { display: true, text: 'Date' }
        }
      }
    }
  });
}
