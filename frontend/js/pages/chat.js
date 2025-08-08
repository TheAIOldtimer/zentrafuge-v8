// frontend/js/pages/chat.js

class ZentrafugeChat {
  constructor() {
    this.backend_url = 'https://zentrafuge-v8.onrender.com';
    this.messageInput = null;
    this.sendButton = null;
    this.chatContainer = null;
    this.isLoading = false;
    this.messageHistory = [];
    this.userPreferences = null;
    this.currentUser = null;
    this.aiName = 'Cael';
    this.userName = 'friend';
    console.log('🎯 ZentrafugeChat constructor called');
  }

  init() {
    console.log('🚀 Initializing ZentrafugeChat...');
    this.messageInput = document.getElementById('message');
    this.sendButton = document.getElementById('send-button');
    this.chatContainer = document.getElementById('chat');

    if (!this.messageInput || !this.sendButton || !this.chatContainer) {
      console.error('❌ Missing core chat DOM elements');
      return false;
    }

    this.setupEventListeners();

    this.loadUserData().then(() => {
      this.showWelcomeMessage();
      this.loadChatHistory();
    }).catch(err => {
      console.error('❌ Error loading user data:', err);
      this.showWelcomeMessage();
    });

    console.log('✅ Zentrafuge Chat initialized');
    return true;
  }

  async loadUserData() {
    console.log('📊 Loading user data...');
    const user = firebase.auth().currentUser;
    if (!user) {
      console.warn('⚠️ No authenticated user');
      return;
    }
    this.currentUser = user;

    const db = firebase.firestore();
    const doc = await db.collection("users").doc(user.uid).get();

    if (doc.exists) {
      const data = doc.data();
      this.userName = data.name || user.displayName || user.email.split('@')[0] || 'friend';
      this.aiName = data?.onboarding_data?.ai_name || data?.ai_preferences?.ai_name || data?.profile?.ai_name || data?.ai_name || 'Cael';

      this.userPreferences = {
        ai_name: this.aiName,
        communication_style: data.communication_style || data.ai_preferences?.language_style || 'direct',
        emotional_pacing: data.emotional_pacing || data.ai_preferences?.emotional_pacing || 'gentle',
        effective_support: data.effective_support || [],
        sources_of_meaning: data.sources_of_meaning || [],
        isVeteran: data.isVeteran || false,
        language: data.language || 'en',
        response_length: data.ai_preferences?.response_length || 'moderate',
        military_context: data.ai_preferences?.military_context || 'auto',
        memory_usage: data.ai_preferences?.memory_usage || 'contextual',
        session_reminders: data.ai_preferences?.session_reminders || 'gentle'
      };

      this.updateWelcomeMessage();
      console.log(`✅ User: ${this.userName}, AI: ${this.aiName}`);
    } else {
      console.log('📄 No user document found');
    }
  }

  setupEventListeners() {
    const form = document.getElementById('chat-form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    this.sendButton.addEventListener('click', e => {
      e.preventDefault();
      this.sendMessage();
    });

    this.messageInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.messageInput.addEventListener('input', () => this.autoResizeInput());
    console.log('✅ Event listeners ready');
  }

  autoResizeInput() {
    if (this.messageInput.tagName === 'TEXTAREA') {
      this.messageInput.style.height = 'auto';
      this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
  }

  showWelcomeMessage() {
    const welcome = {
      text: `Hello${this.userName !== 'friend' ? ` ${this.userName}` : ''}! I'm ${this.aiName}, your emotional companion. How are you feeling today?`,
      sender: 'cael',
      timestamp: new Date(),
      isWelcome: true
    };
    this.displayMessage(welcome);
  }

  updateWelcomeMessage() {
    const messages = this.chatContainer.querySelectorAll('.message.cael-message');
    const latest = messages[messages.length - 1];
    const textEl = latest?.querySelector('.message-text');

    if (textEl && (latest.classList.contains('welcome-message') || textEl.textContent.includes("I'm"))) {
      textEl.textContent = `Hello${this.userName !== 'friend' ? ` ${this.userName}` : ''}! I'm ${this.aiName}, your emotional companion. How are you feeling today?`;
    }
  }

  async sendMessage() {
    const text = this.messageInput.value.trim();
    if (!text || this.isLoading) return;

    this.messageInput.value = '';
    this.autoResizeInput();

    const userMsg = {
      text,
      sender: 'user',
      timestamp: new Date()
    };
    this.displayMessage(userMsg);
    this.messageHistory.push(userMsg);
    this.setLoadingState(true);

    try {
      const aiResponse = await this.sendToBackend(text);

      const caelMsg = {
        text: aiResponse.response || "I'm having trouble responding right now.",
        sender: 'cael',
        timestamp: new Date(),
        metadata: {
          ai_name: aiResponse.ai_name || this.aiName,
          strategy_used: aiResponse.strategy_used,
          confidence: aiResponse.confidence,
          memory_used: aiResponse.memory_used
        }
      };

      if (aiResponse.ai_name && aiResponse.ai_name !== this.aiName) {
        this.aiName = aiResponse.ai_name;
      }

      this.displayMessage(caelMsg);
      this.messageHistory.push(caelMsg);
      await this.saveConversation(userMsg, caelMsg);
      this.updateLearningStats(aiResponse);

    } catch (err) {
      console.error('❌ Message send failed:', err);
      this.displayMessage({
        text: "I'm having connection issues. Please try again later.",
        sender: 'cael',
        timestamp: new Date(),
        isError: true
      });
    } finally {
      this.setLoadingState(false);
      this.messageInput.focus();
    }
  }

  // ✅ TOKEN-FIXED CHAT POST
  async sendToBackend(message) {
    const userId = this.currentUser?.uid;
    const token = await this.currentUser.getIdToken(true); // 🔐 refresh-safe

    if (!userId || !token) throw new Error('Auth token or user ID missing');

    const payload = {
      message,
      user_id: userId,
      ai_name: this.aiName,
      user_name: this.userName,
      ai_preferences: this.userPreferences
    };

    const res = await fetch(`${this.backend_url}/index`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    return await res.json();
  }

  displayMessage(msg) {
    const el = document.createElement('div');
    el.className = `message ${msg.sender}-message`;
    if (msg.isWelcome) el.classList.add('welcome-message');
    if (msg.isHistory) el.classList.add('history-message');
    if (msg.isError) el.classList.add('error-message');

    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    el.innerHTML = `
      <div class="message-content">
        <div class="message-text">${this.formatMessageText(msg.text)}</div>
        <div class="message-timestamp">${time}</div>
        ${msg.metadata ? this.renderMetadata(msg.metadata) : ''}
      </div>
    `;

    this.chatContainer.appendChild(el);
    this.scrollToBottom();
    setTimeout(() => el.classList.add('fade-in'), 10);
  }

  renderMetadata(meta) {
    if (!meta) return '';
    return `
      <div class="message-metadata">
        ${meta.ai_name ? `<span class="metadata-item">AI: ${meta.ai_name}</span>` : ''}
        ${meta.strategy_used ? `<span class="metadata-item">Strategy: ${meta.strategy_used}</span>` : ''}
        ${meta.confidence ? `<span class="metadata-item">Confidence: ${(meta.confidence * 100).toFixed(0)}%</span>` : ''}
        ${meta.memory_used ? `<span class="metadata-item">💭 Memory</span>` : ''}
      </div>
    `;
  }

  formatMessageText(text) {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  setLoadingState(loading) {
    this.isLoading = loading;
    this.sendButton.disabled = loading;
    this.sendButton.innerHTML = loading ? '⏳' : '➤';
    if (loading) this.showTypingIndicator();
    else this.hideTypingIndicator();
  }

  showTypingIndicator() {
    this.hideTypingIndicator();
    const el = document.createElement('div');
    el.className = 'message cael-message typing-indicator';
    el.innerHTML = `
      <div class="message-content">
        <div class="message-text">
          <span class="typing-dots"><span></span><span></span><span></span></span>
          ${this.aiName} is thinking...
        </div>
      </div>
    `;
    this.chatContainer.appendChild(el);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const el = this.chatContainer.querySelector('.typing-indicator');
    if (el) el.remove();
  }

  async loadChatHistory() {
    const userId = this.currentUser?.uid;
    if (!userId) return;

    try {
      const res = await fetch(`${this.backend_url}/history?user_id=${userId}`);
      if (!res.ok) return;

      const data = await res.json();
      const recent = (data.history || []).slice(-10);

      for (const msg of recent) {
        this.displayMessage({
          text: msg.content || msg.text,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp),
          isHistory: true
        });
      }
    } catch (err) {
      console.error('❌ History load error:', err);
    }
  }

  async saveConversation(userMsg, aiMsg) {
    const userId = this.currentUser?.uid;
    if (!userId) return;

    try {
      await fetch(`${this.backend_url}/save-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_message: userMsg.text,
          ai_message: aiMsg.text,
          ai_name: this.aiName,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error('❌ Conversation save failed:', err);
    }
  }

  updateLearningStats(res) {
    try {
      const strat = document.getElementById('currentStrategy');
      const conf = document.getElementById('currentConfidence');
      const mem = document.getElementById('memoryStatus');
      const memInd = document.getElementById('memoryIndicator');

      if (strat && res.strategy_used) strat.textContent = res.strategy_used;
      if (conf && res.confidence) conf.textContent = (res.confidence * 100).toFixed(0) + '%';
      if (mem && memInd) {
        mem.textContent = res.memory_used ? 'Active' : 'Limited';
        memInd.className = `memory-indicator ${res.memory_used ? 'active' : 'limited'}`;
      }
    } catch (err) {
      console.error('❌ Stats update failed:', err);
    }
  }

  showStatusMessage(text, type = 'info') {
    const el = document.createElement('div');
    el.className = `status-message ${type}`;
    el.textContent = text;
    el.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: ${type === 'error' ? '#ff6b6b' : '#4ecdc4'};
      color: white; padding: 12px 20px;
      border-radius: 8px; z-index: 1000;
      opacity: 0; transition: opacity 0.3s ease;
    `;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '1'; }, 10);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => { el.remove(); }, 300);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const chat = new ZentrafugeChat();
  const ok = chat.init();
  if (!ok) {
    console.error('🚫 Chat failed to initialize properly. Check DOM or Firebase readiness.');
  }
});

window.ZentrafugeChat = ZentrafugeChat;
