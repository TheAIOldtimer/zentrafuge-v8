// frontend/js/modules/chat-manager.js - Chat Interface Management
import { EventEmitter } from './utils/event-emitter.js';
import { Logger } from './utils/logger.js';
import { ApiClient } from './utils/api-client.js';
import { MessageRenderer } from './components/message-renderer.js';
import { InputManager } from './components/input-manager.js';
import { StatusManager } from './components/status-manager.js';
import { CONFIG } from '../config/config.js';

export class ChatManager extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('ChatManager');
        this.apiClient = new ApiClient();
        this.messageRenderer = new MessageRenderer();
        this.inputManager = new InputManager();
        this.statusManager = new StatusManager();
        
        this.chatContainer = null;
        this.isInitialized = false;
        this.isLoading = false;
        this.messageHistory = [];
        
        this.setupEventListeners();
    }

    /**
     * Initialize chat interface
     */
    async init() {
        try {
            this.logger.info('Initializing chat interface...');

            // Get DOM elements
            if (!this.getDOMElements()) {
                throw new Error('Required DOM elements not found');
            }

            // Initialize components
            await this.initializeComponents();

            // Load chat history
            await this.loadChatHistory();

            // Show welcome message
            this.showWelcomeMessage();

            this.isInitialized = true;
            this.emit('initialized');
            
            this.logger.info('Chat interface initialized successfully');
            return true;

        } catch (error) {
            this.logger.error('Failed to initialize chat interface:', error);
            this.statusManager.showError('Failed to initialize chat. Please refresh the page.');
            return false;
        }
    }

    /**
     * Get required DOM elements
     */
    getDOMElements() {
        this.chatContainer = document.getElementById('chat-container');
        
        if (!this.chatContainer) {
            this.logger.error('Chat container not found');
            return false;
        }

        return true;
    }

    /**
     * Initialize all components
     */
    async initializeComponents() {
        // Initialize message renderer
        this.messageRenderer.init(this.chatContainer);

        // Initialize input manager
        this.inputManager.init();

        // Initialize status manager
        this.statusManager.init();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Input manager events
        this.inputManager.on('messageSend', (message) => {
            this.sendMessage(message);
        });

        // API client events
        this.apiClient.on('requestStart', () => {
            this.setLoadingState(true);
        });

        this.apiClient.on('requestComplete', () => {
            this.setLoadingState(false);
        });

        this.apiClient.on('requestError', (error) => {
            this.handleApiError(error);
        });
    }

    /**
     * Send message to Cael
     */
    async sendMessage(messageText) {
        if (!messageText.trim() || this.isLoading) {
            return;
        }

        try {
            this.logger.info('Sending message to Cael');

            // Create user message
            const userMessage = {
                text: messageText,
                sender: 'user',
                timestamp: new Date(),
                id: this.generateMessageId()
            };

            // Display user message
            this.displayMessage(userMessage);
            this.messageHistory.push(userMessage);

            // Clear input
            this.inputManager.clearInput();

            // Send to backend
            const response = await this.apiClient.sendChatMessage(messageText);

            // Create Cael's response
            const caelMessage = {
                text: response.response || "I'm having trouble responding right now. Please try again.",
                sender: 'cael',
                timestamp: new Date(),
                id: this.generateMessageId(),
                metadata: response.metadata
            };

            // Display Cael's response
            this.displayMessage(caelMessage);
            this.messageHistory.push(caelMessage);

            // Emit chat event
            this.emit('messageExchange', { userMessage, caelMessage });

        } catch (error) {
            this.logger.error('Error sending message:', error);
            this.handleChatError(error);
        }
    }

    /**
     * Display a message in the chat
     */
    displayMessage(message) {
        this.messageRenderer.renderMessage(message);
        this.scrollToBottom();
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        const welcomeMessage = {
            text: "Hello! I'm Cael, your emotional companion. I'm here to listen, reflect, and support you on your journey. How are you feeling today?",
            sender: 'cael',
            timestamp: new Date(),
            id: this.generateMessageId(),
            isWelcome: true
        };

        this.displayMessage(welcomeMessage);
    }

    /**
     * Load chat history from backend
     */
    async loadChatHistory() {
        try {
            this.logger.info('Loading chat history...');

            const history = await this.apiClient.getChatHistory();
            
            // Display recent messages (last 10)
            const recentMessages = history.slice(-10);
            
            for (const historyItem of recentMessages) {
                if (historyItem.user_message && historyItem.cael_reply) {
                    // Display user message
                    this.displayMessage({
                        text: historyItem.user_message,
                        sender: 'user',
                        timestamp: new Date(historyItem.timestamp),
                        id: this.generateMessageId(),
                        isHistory: true
                    });

                    // Display Cael's response
                    this.displayMessage({
                        text: historyItem.cael_reply,
                        sender: 'cael',
                        timestamp: new Date(historyItem.timestamp),
                        id: this.generateMessageId(),
