import { BACKEND_URL, isAuthorized, userPreferences, currentUser, aiName } from './config.js';
import { getUserId } from './auth.js';
import { applyPreferencesToResponse } from './preferences.js';
import { streamTextAdvanced, showWelcomeMessage } from './ui.js';

export async function getAiName(userId) {
  try {
    const db = firebase.firestore();
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`✅ Fetched user document for ${userId}:`, userData);
      return userData.ai_name || "Cael";
    }
    console.warn(`⚠️ User document not found for ${userId}`);
    return "Cael";
  } catch (error) {
    console.error("❌ Error fetching AI name:", error);
    return "Cael";
  }
}

export async function getLastSessionContext(userId) {
  try {
    const res = await fetch(`${BACKEND_URL}/context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    console.log('🔍 Context fetch response status:', res.status);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    console.log('📦 Last session context:', data);
    return data.context || { mood: null, theme: null };
  } catch (error) {
    console.error("❌ Error fetching session context:", error);
    return { mood: null, theme: null };
  }
}

export async function loadPreviousMessages() {
  if (!isAuthorized) {
    console.warn('⚠️ Not authorized, skipping loadPreviousMessages');
    await showWelcomeMessage(false);
    return;
  }
  console.log('🔍 Loading previous messages...');
  try {
    const chat = document.getElementById("chat");
    if (!chat) {
      console.error('❌ No chat element found');
      await showWelcomeMessage(false);
      return;
    }
    const res = await fetch(`${BACKEND_URL}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: getUserId() }),
    });
    console.log('🔍 History fetch response status:', res.status);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    console.log('📦 History data received:', data);
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
        await showWelcomeMessage(false);
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
      await showWelcomeMessage(false);
    }
  } catch (err) {
    console.error("❌ Error loading chat history:", err);
    await showWelcomeMessage(false);
  }
}

export function appendMessage(role, text, useStreaming = false) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    console.warn('⚠️ Attempted to append empty/invalid message:', { role, text });
    return;
  }
  
  const chat = document.getElementById("chat");
  if (!chat) {
    console.warn('⚠️ No chat element found for appending message');
    return;
  }
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

export async function generateDynamicWelcome(userName = null, isReturning = false) {
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

export async function getNewUserGreetings() {
  // Fixed: Use aiName from config.js import instead of undefined variable
  const currentAiName = aiName || 'Cael';
  return [
    `Hi there. I'm ${currentAiName} - I'm here if you need someone to talk to.`,
    `Hey. I'm ${currentAiName}. I hope this space can feel safe for you.`,
    `Hi - I'm ${currentAiName}. I'm here to listen, whatever's going on.`,
    `Hey there. I'm ${currentAiName}, and I'm genuinely glad you're here.`,
    `Hi. I'm ${currentAiName} - think of me as a friend who's always here.`,
    `Hey. I'm ${currentAiName}. This can be whatever kind of conversation you need.`
  ];
}

export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 6) return 'late night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

export function getSeasonalContext() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}
