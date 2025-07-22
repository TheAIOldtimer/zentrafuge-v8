import { currentUser, aiName, sessionDurationInterval, setSessionDurationInterval, setSessionWarningShown } from './config.js';
import { appendMessage } from './chat.js';
import { generateDynamicWelcome } from './chat.js';
import { renderModalMoodChart } from './mood.js';

export function showAlert(message, type = 'error') {
  const alertElement = document.getElementById(type === 'error' ? 'error-message' : 'success-message');
  if (alertElement) {
    const otherAlert = document.getElementById(type === 'error' ? 'success-message' : 'error-message');
    if (otherAlert) otherAlert.style.display = 'none';
    alertElement.textContent = message;
    alertElement.style.display = 'block';
    setTimeout(() => {
      alertElement.style.display = 'none';
    }, 5000);
  } else {
    const chat = document.getElementById("chat");
    if (!chat) {
      console.warn(`⚠️ No ${type}-message or chat element found for alert:`, message);
      return;
    }
    const alertDiv = document.createElement("div");
    alertDiv.className = `message ${type}-message`;
    alertDiv.textContent = message;
    alertDiv.style.background = type === 'error' ? '#f8d7da' : '#d4edda';
    alertDiv.style.color = type === 'error' ? '#721c24' : '#155724';
    alertDiv.style.alignSelf = 'center';
    alertDiv.style.maxWidth = '90%';
    alertDiv.style.textAlign = 'center';
    chat.appendChild(alertDiv);
    chat.scrollTop = chat.scrollHeight;
    setTimeout(() => alertDiv.remove(), 5000);
  }
}

export function showPreferencesStatus(message, type) {
  const statusDiv = document.getElementById('preferences-status');
  const statusMessage = document.getElementById('status-message');
  
  if (statusDiv && statusMessage) {
    statusMessage.textContent = message;
    statusDiv.className = `preferences-status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  } else {
    showAlert(message, type);
  }
}

export function showTypingIndicator() {
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

export function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) typingIndicator.remove();
}

export function setFormEnabled(enabled) {
  const input = document.getElementById("message");
  const button = document.getElementById("send-button");
  if (!input || !button) {
    console.warn('⚠️ No input or button found for setFormEnabled');
    return;
  }
  input.disabled = !enabled;
  button.disabled = !enabled;
  input.placeholder = enabled ? `Ask ${aiName} something...` : `${aiName} is thinking...`;
}

export function showGentleEncouragement() {
  const chat = document.getElementById("chat");
  if (!chat) return;
  const encouragementDiv = document.createElement("div");
  encouragementDiv.className = "message encouragement-message";
  encouragementDiv.textContent = `Take your time, ${currentUser?.displayName || 'friend'} - I'm here when you're ready.`;
  chat.appendChild(encouragementDiv);
  chat.scrollTop = chat.scrollHeight;
}

export async function showWelcomeMessage(isReturning = false, userName = null) {
  const chat = document.getElementById("chat");
  if (!chat) {
    console.warn('⚠️ No chat element found for welcome message');
    return;
  }
  chat.innerHTML = '';
  const welcomeDiv = document.createElement("div");
  welcomeDiv.className = "message welcome-message";
  welcomeDiv.textContent = await generateDynamicWelcome(userName, isReturning);
  chat.appendChild(welcomeDiv);
  chat.scrollTop = chat.scrollHeight;
  console.log('✨ Dynamic welcome message displayed');
}

export function streamTextAdvanced(text, targetElement, speed = 30) {
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
          delay = speed * 3;
        } else if (char === ',' || char === ';') {
          delay = speed * 2;
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

export function checkSessionDuration() {
  const sessionStartTime = parseInt(sessionStorage.getItem('session_start'), 10) || Date.now();
  const duration = Date.now() - sessionStartTime;
  
  if (duration > 45 * 60 * 1000 && !sessionWarningShown) {
    setSessionWarningShown(true);
    let reminderMessage = `We've been talking for a while, ${currentUser?.displayName || 'friend'}. How are you feeling? Sometimes it helps to take a pause.`;
    
    if (userPreferences.language_style === 'direct') {
      reminderMessage = `We've been chatting for ${Math.round(duration / (60 * 1000))} minutes. Want to take a break?`;
    } else if (userPreferences.language_style === 'casual') {
      reminderMessage = `Hey, we've been talking for a while now. You doing okay? Maybe time for a quick break?`;
    }
    
    appendMessage("cael", reminderMessage);
    
    if (sessionDurationInterval) {
      clearInterval(sessionDurationInterval);
      setSessionDurationInterval(null);
    }
    
    setTimeout(() => {
      if (Date.now() - sessionStartTime > 90 * 60 * 1000) {
        appendMessage("cael", `You've been here a while now. Remember to take care of yourself - I'll be here when you get back.`);
      }
    }, 45 * 60 * 1000);
  }
}

export function showChartsModal() {
  if (!currentUser) {
    showAlert('Please log in to view your charts.', 'error');
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

export function redirectToAuth(reason = 'unauthorized') {
  if (isInitializing) {
    console.warn('⚠️ Preventing redirect loop during initialization:', reason);
    return;
  }
  console.log('➡️ Redirecting to auth:', reason);
  const params = new URLSearchParams({ reason });
  window.location.assign(`index.html?${params}`);
}
