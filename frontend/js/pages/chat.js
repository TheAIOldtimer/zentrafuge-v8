// js/chat.js - Clean Chat Interface Module for Zentrafuge
import { authManager } from './auth.js';
import { showStatusMessage, clearStatusMessage } from './components/status-messages.js';
import { showLoadingSpinner, hideLoadingSpinner } from './components/loading-spinner.js';

export class ChatManager {
    constructor() {
        this.chatContainer = null;
        this.messageInput = null;
        this.sendButton = null;
        this.isLoading = false;
        this.backend_url = 'https://zentrafuge-backend.onrender.com';
        this.messageHistory = [];
    }

    // Initialize chat interface
    async init() {
        console.log('🚀 Initializing chat interface...');

        // Check authentication
        if (!authManager.requireAuth()) {
            return false;
        }

        // Get DOM elements
        this.getDOMElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load chat history
        await this.loadChatHistory();
        
        // Show welcome message
        this.showWelcomeMessage();

        console.log('✅ Chat interface initialized successfully');
        return true;
    }

    // Get required DOM elements
    getDOMElements() {
        this.chatContainer = document.getElementById('chat-container');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');

        // Verify all elements exist
        if (!this.chatContainer || !this.messageInput || !this.sendButton) {
            console.error('❌ Required chat elements not found in DOM');
            showStatusMessage('Chat interface error. Please refresh the page.', 'error');
            return false;
        }

        return true;
    }

    // Set up event listeners
    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key in input
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize input
        this.messageInput.addEventListener('input', () => {
            this.autoResizeInput();
        });

        // Focus input on load
        this.messageInput.focus();
    }

    // Auto-resize message input
    autoResizeInput() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
    }

    // Show welcome message
    showWelcomeMessage() {
        const user = authManager.getCurrentUser();
        const welcomeMessage = {
            text: `Hello${user ? ` ${user.email.split('@')[0]}` : ''}! I'm Cael, your emotional companion. How are you feeling today?`,
            sender: 'cael',
            timestamp: new Date()
        };
        
        this.displayMessage(welcomeMessage);
    }

    // Send message to Cael
    async sendMessage() {
        const messageText = this.messageInput.value.trim();
        
        if (!messageText || this.isLoading) {
            return;
        }

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
            // Send to backend
            const response = await this.sendToBackend(messageText);
            
            // Show Cael's response
            const caelMessage = {
                text: response.response || "I'm having trouble responding right now. Please try again.",
                sender: 'cael',
                timestamp: new Date()
            };
            this.displayMessage(caelMessage);
            this.messageHistory.push(caelMessage);

            // Save conversation
            await this.saveConversation(userMessage, caelMessage);

        } catch (error) {
            console.error('❌ Chat error:', error);
            
            const errorMessage = {
                text: "I'm having connection issues. Please check your internet and try again.",
                sender: 'cael',
                timestamp: new Date()
            };
            this.displayMessage(errorMessage);
            
            showStatusMessage('Connection error. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
            this.messageInput.focus();
        }
    }

    // Send message to backend
    async sendToBackend(message) {
        const userId = authManager.getCurrentUserId();
        
        const response = await fetch(`${this.backend_url}/index`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                user_id: userId
            })
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        return await response.json();
    }

    // Display message in chat
    displayMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}-message`;
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessageText(message.text)}</div>
                <div class="message-timestamp">${timestamp}</div>
            </div>
        `;

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
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
            showLoadingSpinner();
        } else {
            this.sendButton.disabled = false;
            this.sendButton.innerHTML = '➤';
            hideLoadingSpinner();
        }
    }

    // Load chat history
    async loadChatHistory() {
        try {
            const userId = authManager.getCurrentUserId();
            const response = await fetch(`${this.backend_url}/history?user_id=${userId}`);
            
            if (response.ok) {
                const history = await response.json();
                
                // Display recent messages (last 10)
                const recentMessages = history.slice(-10);
                recentMessages.forEach(msg => {
                    if (msg.user_message && msg.cael_reply) {
                        this.displayMessage({
                            text: msg.user_message,
                            sender: 'user',
                            timestamp: new Date(msg.timestamp)
                        });
                        
                        this.displayMessage({
                            text: msg.cael_reply,
                            sender: 'cael',
                            timestamp: new Date(msg.timestamp)
                        });
                    }
                });
                
                console.log(`✅ Loaded ${recentMessages.length} messages from history`);
            }
        } catch (error) {
            console.error('❌ Error loading chat history:', error);
        }
    }

    // Save conversation to backend
    async saveConversation(userMessage, caelMessage) {
        try {
            // This is handled by the backend when we send messages
            // Just log for now
            console.log('💾 Conversation saved automatically');
        } catch (error) {
            console.error('❌ Error saving conversation:', error);
        }
    }

    // Clear chat history
    clearChat() {
        this.chatContainer.innerHTML = '';
        this.messageHistory = [];
        this.showWelcomeMessage();
    }

    // Export chat history
    exportChat() {
        const chatData = {
            timestamp: new Date().toISOString(),
            user: authManager.getCurrentUser()?.email,
            messages: this.messageHistory
        };

        const blob = new Blob([JSON.stringify(chatData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zentrafuge-chat-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Create and export singleton instance
export const chatManager = new ChatManager();
