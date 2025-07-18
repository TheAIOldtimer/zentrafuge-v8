const BACKEND_URL = "https://zentrafuge-v8.onrender.com";
let isTyping = false;
let currentUser = null;
let isAuthorized = false;
let aiName = "Cael"; // Default AI name
let lastKeystroke = Date.now();
let sessionStart = Date.now();

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

// Initialize Firebase
try {
  const firebaseConfig = {
    apiKey: "AIzaSyCYt2SfTJiCh1egk-q30_NLlO0kA4-RH0k",
    authDomain: "zentrafuge-v8.firebaseapp.com",
    projectId: "zentrafuge-v8",
    storageBucket: "zentrafuge-v8.appspot.com",
    messagingSenderId: "1035979155498",
    appId: "1:1035979155498:web:502d1bdbfadc116542bb53",
    measurementId: "G-WZNXDGR0BN"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('🔥 Firebase initialized successfully');
  } else {
    firebase.app();
    console.log('🔥 Firebase already initialized');
  }

  try {
    if (typeof firebase.analytics === 'function') {
      firebase.analytics();
      console.log('📊 Firebase Analytics initialized');
    }
  } catch (err) {
    console.log('Analytics skipped:', err.message);
  }

  console.log('📧 Auth SDK loaded:', typeof firebase.auth);
  console.log('📂 Firestore SDK loaded:', typeof firebase.firestore);

  window.firebaseApp = firebase.app();
  window.firebaseAuth = firebase.auth();
  window.firebaseDb = firebase.firestore();

} catch (error) {
  console.error('🚨 Firebase initialization failed:', error);
  document.getElementById('auth-loading').innerHTML = '<div class="auth-message">Error connecting to Zentrafuge. Please refresh and try again.</div>';
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
    console.error('Authorization check failed:', error);
    return false;
  }
}

// Redirect to auth
function redirectToAuth(reason = 'unauthorized') {
  console.log('Redirecting to auth:', reason);
  const params = new URLSearchParams({ reason });
  window.location.href = `index.html?${params}`;
}

// Initialize app
async function initializeApp(user) {
  try {
    currentUser = user;
    aiName = await getAiName(user.uid);
    console.log(`Setting AI name to: ${aiName}`);
    
    // Update title and header based on page
    const isDashboard = window.location.pathname.includes('dashboard.html');
    document.title = `Zentrafuge × ${isDashboard ? 'Dashboard' : aiName}`;
    document.querySelector('header img').setAttribute('onerror', 
      `this.style.display='none'; this.insertAdjacentHTML('afterend', '<h1>Zentrafuge × ${isDashboard ? 'Dashboard' : aiName}</h1>');`
    );
    
    // Update user info
    document.getElementById('user-info').textContent = `Welcome, ${user.displayName || user.email}`;
    
    // Show main content
    document.getElementById('auth-loading').style.display = 'none';
    document.getElementById('main-header').style.display = 'flex';
    document.getElementById(isDashboard ? 'dashboard' : 'chat').style.display = 'flex';
    
    if (isDashboard) {
      await renderMoodChart(user.uid);
    } else {
      document.getElementById('chat-form').style.display = 'flex';
      document.getElementById('chat-form').setAttribute('aria-label', `Ask ${aiName} something`);
      document.getElementById('message').placeholder = `Ask ${aiName} something...`;
      await loadPreviousMessages();
      document.getElementById("message").focus();
      sessionStorage.setItem('session_start', Date.now());
      setInterval(checkSessionDuration, 60000);
    }
  } catch (error) {
    console.error('Error initializing app:', error);
    redirectToAuth('initialization_failed');
  }
}

// Firebase Auth State Observer
firebase.auth().onAuthStateChanged(async function(user) {
  try {
    if (user && !user.isAnonymous) {
      console.log('User authenticated:', user.email);
      const authorized = await checkUserAuthorization(user);
      if (authorized) {
        isAuthorized = true;
        await initializeApp(user);
      } else {
        const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
        if (!userDoc.exists || !userDoc.data().emailVerified) {
          redirectToAuth('email_verification');
        } else {
          redirectToAuth('onboarding_incomplete');
        }
      }
    } else {
      redirectToAuth('not_signed_in');
    }
  } catch (error) {
    console.error('Auth state observer error:', error);
    redirectToAuth('auth_error');
  }
});

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
  return generateUniqueUserId();
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
    "How's your spirit doing today?",
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
  
  const followUp = followUps[Math.floor(Math.random() * followUps.length)];
  
  return `${greeting} ${followUp}`;
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
          appendMessage("cael", entry.cael.trim());
          validMessagesLoaded++;
        } else {
          console.warn(`⚠️ Skipping invalid history entry ${index}:`, entry);
        }
      });
      console.log(`✅ Loaded ${validMessagesLoaded} valid messages from history`);
      if (validMessagesLoaded === 0) {
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
  if (duration > 45 * 60 * 1000) {
    appendMessage("cael", `We've been talking for a while, ${currentUser?.displayName || 'friend'}. How are you feeling? Sometimes it helps to take a pause.`);
    clearInterval(checkSessionDuration);
  }
}

// Chat form submission
document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById("message");
  const form = document.getElementById("chat-form");
  if (!form) return;

  const savedDraft = localStorage.getItem(`zentrafuge_draft_${getUserId()}`);
  if (savedDraft) {
    input.value = savedDraft;
    appendMessage("cael", `I saved what you were writing, ${currentUser?.displayName || 'friend'} - want to continue?`);
  }

  setInterval(() => {
    if (!input) return;
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
    
    while (attempt <= maxAttempts && !success) {
      try {
        console.log(`Attempt ${attempt} for message: "${message}"`);
        
        const res = await fetch(`${BACKEND_URL}/index`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message,
            user_id: getUserId(),
          }),
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        
        const data = await res.json();
        console.log(`Response received on attempt ${attempt}:`, data);
        
        if (data.redirect_url) {
          console.log('Crisis detected - redirecting to support');
          hideTypingIndicator();
          if (data.response && data.response.trim()) {
            await appendMessage("cael", data.response, true);
          }
          setTimeout(() => {
            window.location.href = data.redirect_url;
          }, 2000);
          success = true;
          break;
        }
        
        if (data.response && data.response.trim()) {
          hideTypingIndicator();
          await appendMessage("cael", data.response, true);
          success = true;
          console.log(`✅ Success on attempt ${attempt}`);
          break;
        } else {
          throw new Error('Empty or invalid response from server');
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        
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
});
