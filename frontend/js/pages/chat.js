// frontend/js/pages/chat.js - FIXED FOR PROPER INITIALIZATION

class ZentrafugeChat {
    constructor() {
        this.backend_url = 'https://zentrafuge-v8-backend.render.com';
        this.messageInput = null;
        this.sendButton = null;
        this.chatContainer = null;
        this.isLoading = false;
        this.messageHistory = [];
        this.userPreferences = null;
        this.currentUser = null;
        
        // Track AI and user names
        this.aiName = 'Cael';  // Default fallback
        this.userName = 'friend';  // Default fallback
        
        console.log('🎯 ZentrafugeChat constructor called');
    }

    // Initialize chat interface
    init() {
        console.log('🚀 Initializing ZentrafugeChat...');
        
        try {
            // Check DOM elements
            this.messageInput = document.getElementById('message');
            this.sendButton = document.getElementById('send-button');
            this.chatContainer = document.getElementById('chat-container');
            
            if (!this.messageInput) {
                console.error('❌ Message input not found');
                return false;
            }
            
            if (!this.sendButton) {
                console.error('❌ Send button not found');
                return false;
            }
            
            if (!this.chatContainer) {
                console.error('❌ Chat container not found');
                return false;
            }

            console.log('✅ DOM elements found');

            // Setup event listeners
            this.setupEventListeners();
            
            // Load user data and initialize chat
            this.loadUserData().then(() => {
                this.showWelcomeMessage();
                this.loadChatHistory();
            }).catch(error => {
                console.error('❌ Error during initialization:', error);
                this.showWelcomeMessage(); // Still show welcome even if user data fails
            });
            
            console.log('✅ Zentrafuge Chat initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error initializing chat:', error);
            return false;
        }
    }

    // Load user data including AI name and preferences
    async loadUserData() {
        try {
            console.log('📊 Loading user data...');
            
            const user = firebase.auth().currentUser;
            if (!user) {
                console.warn('⚠️ No authenticated user found');
                return;
            }
            
            this.currentUser = user;
            
            // Load user preferences and AI name from Firestore
            const db = firebase.firestore();
            const userDoc = await db.collection("users").doc(user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('📄 User document found:', userData);
                
                // Get user's display name
                this.userName = userData.name || user.displayName || user.email.split('@')[0] || 'friend';
                
                // Get AI name from various possible locations
                if (userData.onboarding_data?.ai_name) {
                    this.aiName = userData.onboarding_data.ai_name;
                } else if (userData.ai_preferences?.ai_name) {
                    this.aiName = userData.ai_preferences.ai_name;
                } else if (userData.profile?.ai_name) {
                    this.aiName = userData.profile.ai_name;
                } else if (userData.ai_name) {
                    this.aiName = userData.ai_name;
                } else {
                    this.aiName = 'Cael'; // Default fallback
                }
                
                // Load full preferences - handle both old and new structure
                this.userPreferences = {
                    ai_name: this.aiName,
                    communication_style: userData.communication_style || userData.ai_preferences?.language_style || 'direct',
                    emotional_pacing: userData.emotional_pacing || userData.ai_preferences?.emotional_pacing || 'gentle',
                    effective_support: userData.effective_support || [],
                    sources_of_meaning: userData.sources_of_meaning || [],
                    isVeteran: userData.isVeteran || false,
                    language: userData.language || 'en',
                    response_length: userData.ai_preferences?.response_length || 'moderate',
                    military_context: userData.ai_preferences?.military_context || 'auto',
                    memory_usage: userData.ai_preferences?.memory_usage || 'contextual',
                    session_reminders: userData.ai_preferences?.session_reminders || 'gentle'
                };
                
                console.log(`✅ Loaded user data - User: ${this.userName}, AI: ${this.aiName}`);
                console.log('📄 User preferences:', this.userPreferences);
                
                // Update welcome message if already shown
                this.updateWelcomeMessage();
            } else {
                console.log('📄 No user document found, using defaults');
            }
            
        } catch (error) {
            console.error('❌ Error loading user data:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        try {
            // Send message on form submit
            const form = document.getElementById('chat-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.sendMessage();
                });
            }

            // Send message on button click
            this.sendButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.sendMessage();
            });

            // Send message on Enter key (but allow Shift+Enter for new lines)
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize input
            this.messageInput.addEventListener('input', () => {
                this.autoResizeInput();
            });
            
            console.log('✅ Event listeners set up');
            
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    // Auto-resize input field
    autoResizeInput() {
        if (this.messageInput.tagName === 'TEXTAREA') {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        }
    }

    // Show welcome message with correct AI name
    showWelcomeMessage() {
        console.log('👋 Showing welcome message...');
        
        const welcomeMessage = {
            text: `Hello${this.userName !== 'friend' ? ` ${this.userName}` : ''}! I'm ${this.aiName}, your emotional companion. How are you feeling today?`,
            sender: 'cael',
            timestamp: new Date(),
            isWelcome: true
        };
        
        this.displayMessage(welcomeMessage);
    }

    // Update welcome message when user data loads
    updateWelcomeMessage() {
        const welcomeMessages = this.chatContainer.querySelectorAll('.message.cael-message');
        if (welcomeMessages.length > 0) {
            const latestWelcome = welcomeMessages[welcomeMessages.length - 1];
            if (latestWelcome.classList.contains('welcome-message') || 
                latestWelcome.querySelector('.message-text')?.textContent.includes("I'm")) {
                
                const newText = `Hello${this.userName !== 'friend' ? ` ${this.userName}` : ''}! I'm ${this.aiName}, your emotional companion. How are you feeling today?`;
                const textElement = latestWelcome.querySelector('.message-text');
                if (textElement) {
                    textElement.textContent = newText;
                    console.log('🔄 Updated welcome message with correct names');
                }
            }
        }
    }

    // Send message to AI companion
    async sendMessage() {
        const messageText = this.messageInput.value.trim();
        
        if (!messageText || this.isLoading) {
            return;
        }

        console.log('📤 Sending message:', messageText);

        // Clear input and resize
        this.messageInput.value = '';
        this.autoResizeInput();

        // Show user message
        const userMessage = {
            text: messageText,
            sender: 'user',
            timestamp: new Date()
        };
        this.displayMessage(userMessage);
        this.messageHistory.push(userMessage);

        // Show loading state
        this.setLoadingState(true);

        try {
            // Send to backend with AI name and preferences
            const response = await this.sendToBackend(messageText);
            
            // Show AI companion's response
            const aiMessage = {
                text: response.response || "I'm having trouble responding right now. Please try again.",
                sender: 'cael',
                timestamp: new Date(),
                metadata: {
                    ai_name: response.ai_name || this.aiName,
                    strategy_used: response.strategy_used,
                    confidence: response.confidence,
                    memory_used: response.memory_used
                }
            };
            
            // Update AI name if it changed
            if (response.ai_name && response.ai_name !== this.aiName) {
                this.aiName = response.ai_name;
                console.log(`🔄 AI name updated to: ${this.aiName}`);
            }
            
            this.displayMessage(aiMessage);
            this.messageHistory.push(aiMessage);

            // Save conversation
            await this.saveConversation(userMessage, aiMessage);

            // Update learning stats if available
            this.updateLearningStats(response);

        } catch (error) {
            console.error('❌ Chat error:', error);
            
            const errorMessage = {
                text: "I'm having connection issues. Please check your internet and try again.",
                sender: 'cael',
                timestamp: new Date(),
                isError: true
            };
            this.displayMessage(errorMessage);
            
            this.showStatusMessage('Connection error. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
            this.messageInput.focus();
        }
    }

    // Send message to backend with AI name and preferences
    async sendToBackend(message) {
        const userId = this.currentUser?.uid;
        
        if (!userId) {
            throw new Error('User not authenticated');
        }

        console.log(`📤 Sending message to ${this.aiName} for ${this.userName}`);
        
        // Include AI name and user preferences in request
        const requestData = {
            message: message,
            user_id: userId,
            ai_name: this.aiName,
            user_name: this.userName,
            ai_preferences: this.userPreferences
        };

        console.log('📤 Request data:', requestData);

        const response = await fetch(`${this.backend_url}/index`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        const result = await response.json();
        console.log('📥 Backend response:', result);
        
        return result;
    }

    // Display message in chat
    displayMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}-message`;
        
        // Add special classes
        if (message.isWelcome) messageDiv.classList.add('welcome-message');
        if (message.isHistory) messageDiv.classList.add('history-message');
        if (message.isError) messageDiv.classList.add('error-message');
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessageText(message.text)}</div>
                <div class="message-timestamp">${timestamp}</div>
                ${message.metadata ? this.renderMetadata(message.metadata) : ''}
            </div>
        `;

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Animate in
        setTimeout(() => {
            messageDiv.classList.add('fade-in');
        }, 10);
    }

    // Render message metadata
    renderMetadata(metadata) {
        if (!metadata) return '';
        
        return `
            <div class="message-metadata">
                ${metadata.ai_name ? `<span class="metadata-item">AI: ${metadata.ai_name}</span>` : ''}
                ${metadata.strategy_used ? `<span class="metadata-item">Strategy: ${metadata.strategy_used}</span>` : ''}
                ${metadata.confidence ? `<span class="metadata-item">Confidence: ${(metadata.confidence * 100).toFixed(0)}%</span>` : ''}
                ${metadata.memory_used ? `<span class="metadata-item">💭 Memory</span>` : ''}
            </div>
        `;
    }

    // Format message text (handle line breaks, etc.)
    formatMessageText(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    // Scroll chat to bottom
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    // Set loading state
    setLoadingState(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.sendButton.disabled = true;
            this.sendButton.innerHTML = '⏳';
            this.showTypingIndicator();
        } else {
            this.sendButton.disabled = false;
            this.sendButton.innerHTML = '➤';
            this.hideTypingIndicator();
        }
    }

    // Show typing indicator
    showTypingIndicator() {
        // Remove existing typing indicator
        this.hideTypingIndicator();
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message cael-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">
                    <span class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                    ${this.aiName} is thinking...
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    // Hide typing indicator
    hideTypingIndicator() {
        const existingIndicator = this.chatContainer.querySelector('.typing-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }

    // Update learning stats display
    updateLearningStats(response) {
        try {
            const statsPanel = document.getElementById('learningStatsPanel');
            if (!statsPanel) return;

            // Update current strategy
            const strategyElement = document.getElementById('currentStrategy');
            if (strategyElement && response.strategy_used) {
                strategyElement.textContent = response.strategy_used;
            }

            // Update confidence level
            const confidenceElement = document.getElementById('currentConfidence');
            if (confidenceElement && response.confidence) {
                confidenceElement.textContent = (response.confidence * 100).toFixed(0) + '%';
            }

            // Update memory status
            const memoryStatusElement = document.getElementById('memoryStatus');
            const memoryIndicator = document.getElementById('memoryIndicator');
            if (memoryStatusElement && memoryIndicator) {
                if (response.memory_used) {
                    memoryStatusElement.textContent = 'Active';
                    memoryIndicator.className = 'memory-indicator active';
                } else {
                    memoryStatusElement.textContent = 'Limited';
                    memoryIndicator.className = 'memory-indicator limited';
                }
            }

            console.log('📊 Learning stats updated');
        } catch (error) {
            console.error('❌ Error updating learning stats:', error);
        }
    }

    // Load chat history
    async loadChatHistory() {
        try {
            console.log('📜 Loading chat history...');
            
            const userId = this.currentUser?.uid;
            if (!userId) return;

            const response = await fetch(`${this.backend_url}/history?user_id=${userId}`);
            
            if (response.ok) {
                const data = await response.json();
                const history = data.history || [];
                
                // Display recent messages (last 10)
                const recentMessages = history.slice(-10);
                recentMessages.forEach(msg => {
                    const message = {
                        text: msg.content || msg.text,
                        sender: msg.sender,
                        timestamp: new Date(msg.timestamp),
                        isHistory: true
                    };
                    this.displayMessage(message);
                    this.messageHistory.push(message);
                });

                if (recentMessages.length > 0) {
                    console.log(`📜 Loaded ${recentMessages.length} recent messages`);
                }
            }
        } catch (error) {
            console.error('❌ Error loading chat history:', error);
        }
    }

    // Save conversation to backend
    async saveConversation(userMessage, aiMessage) {
        try {
            const userId = this.currentUser?.uid;
            if (!userId) return;

            await fetch(`${this.backend_url}/save-conversation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    user_message: userMessage.text,
                    ai_message: aiMessage.text,
                    ai_name: this.aiName,
                    timestamp: new Date().toISOString()
                })
            });

            console.log('💾 Conversation saved');
        } catch (error) {
            console.error('❌ Error saving conversation:', error);
        }
    }

    // Show status message
    showStatusMessage(message, type = 'info') {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;
        
        // Add styles
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff6b6b' : '#4ecdc4'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(statusDiv);
        
        setTimeout(() => {
            statusDiv.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            statusDiv.style.opacity = '0';
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.parentNode.removeChild(statusDiv);
                }
            }, 300);
        }, 3000);
    }
}

// Export class for global use
window.ZentrafugeChat = ZentrafugeChat;
