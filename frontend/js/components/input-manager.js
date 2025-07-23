// frontend/js/components/input-manager.js - Input Handling Component
import { EventEmitter } from '../modules/utils/event-emitter.js';
import { Logger } from '../modules/utils/logger.js';

export class InputManager extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('InputManager');
        this.messageInput = null;
        this.sendButton = null;
        this.isLoading = false;
        this.maxLength = 10000;
        this.debounceTimer = null;
        this.drafts = new Map(); // Store drafts
    }

    /**
     * Initialize the input manager
     */
    init() {
        try {
            // Get DOM elements
            this.messageInput = document.getElementById('message-input') || 
                              document.getElementById('message') ||
                              document.querySelector('.chat-input');
            
            this.sendButton = document.getElementById('send-button') ||
                             document.querySelector('button[type="submit"]') ||
                             document.querySelector('.button');

            if (!this.messageInput) {
                throw new Error('Message input element not found');
            }

            if (!this.sendButton) {
                throw new Error('Send button element not found');
            }

            this.setupEventListeners();
            this.setupAutoResize();
            this.loadDraft();
            
            this.logger.info('InputManager initialized');
            return true;

        } catch (error) {
            this.logger.error('Failed to initialize InputManager:', error);
            return false;
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSend();
        });

        // Enter key handling
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) {
                    // Shift+Enter = new line (default behavior)
                    return;
                } else {
                    // Enter = send message
                    e.preventDefault();
                    this.handleSend();
                }
            }
        });

        // Input validation and formatting
        this.messageInput.addEventListener('input', (e) => {
            this.handleInput(e);
        });

        // Paste handling
        this.messageInput.addEventListener('paste', (e) => {
            this.handlePaste(e);
        });

        // Focus/blur handling
        this.messageInput.addEventListener('focus', () => {
            this.emit('inputFocused');
        });

        this.messageInput.addEventListener('blur', () => {
            this.saveDraft();
            this.emit('inputBlurred');
        });

        // Prevent form submission if wrapped in form
        const form = this.messageInput.closest('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSend();
            });
        }
    }

    /**
     * Set up auto-resize functionality for textarea
     */
    setupAutoResize() {
        if (this.messageInput.tagName.toLowerCase() === 'textarea') {
            this.messageInput.addEventListener('input', () => {
                this.autoResize();
            });
        }
    }

    /**
     * Handle input changes
     */
    handleInput(event) {
        const text = this.messageInput.value;

        // Validate length
        if (text.length > this.maxLength) {
            this.messageInput.value = text.substring(0, this.maxLength);
            this.showLengthWarning();
            return;
        }

        // Auto-resize if textarea
        this.autoResize();

        // Update send button state
        this.updateSendButton();

        // Debounced draft saving
        this.debouncedSaveDraft();

        // Emit input event
        this.emit('inputChanged', { text: this.messageInput.value });
    }

    /**
     * Handle paste events
     */
    handlePaste(event) {
        // Allow paste but validate afterwards
        setTimeout(() => {
            this.handleInput(event);
        }, 0);
    }

    /**
     * Handle send action
     */
    handleSend() {
        const message = this.messageInput.value.trim();

        if (!message) {
            this.focusInput();
            return;
        }

        if (this.isLoading) {
            this.logger.debug('Send blocked - already loading');
            return;
        }

        if (message.length > this.maxLength) {
            this.showError('Message too long');
            return;
        }

        // Clear input immediately
        this.clearInput();
        this.clearDraft();

        // Emit send event
        this.emit('messageSend', message);

        this.logger.debug('Message sent', { length: message.length });
    }

    /**
     * Auto-resize textarea
     */
    autoResize() {
        if (this.messageInput.tagName.toLowerCase() === 'textarea') {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
        }
    }

    /**
     * Update send button state
     */
    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        const isValid = hasText && !this.isLoading;

        this.sendButton.disabled = !isValid;
        this.sendButton.classList.toggle('has-text', hasText);
    }

    /**
     * Set loading state
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.sendButton.disabled = true;
            this.sendButton.classList.add('loading');
            this.messageInput.disabled = true;
            
            // Update button text/icon
            const originalContent = this.sendButton.innerHTML;
            this.sendButton.dataset.originalContent = originalContent;
            this.sendButton.innerHTML = '⏳';
            
        } else {
            this.sendButton.disabled = false;
            this.sendButton.classList.remove('loading');
            this.messageInput.disabled = false;
            
            // Restore button content
            if (this.sendButton.dataset.originalContent) {
                this.sendButton.innerHTML = this.sendButton.dataset.originalContent;
                delete this.sendButton.dataset.originalContent;
            }
            
            this.updateSendButton();
            this.focusInput();
        }

        this.emit('loadingStateChanged', { loading });
    }

    /**
     * Clear input
     */
    clearInput() {
        this.messageInput.value = '';
        this.autoResize();
        this.updateSendButton();
        this.emit('inputCleared');
    }

    /**
     * Focus input
     */
    focusInput() {
        if (this.messageInput && !this.messageInput.disabled) {
            this.messageInput.focus();
        }
    }

    /**
     * Set input text
     */
    setInputText(text) {
        this.messageInput.value = text;
        this.autoResize();
        this.updateSendButton();
        this.emit('inputSet', { text });
    }

    /**
     * Get current input text
     */
    getInputText() {
        return this.messageInput.value;
    }

    /**
     * Show length warning
     */
    showLengthWarning() {
        // Could emit event for external handling
        this.emit('lengthWarning', { 
            currentLength: this.messageInput.value.length, 
            maxLength: this.maxLength 
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        this.emit('inputError', { message });
    }

    /**
     * Save draft with debouncing
     */
    debouncedSaveDraft() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.saveDraft();
        }, 1000); // Save after 1 second of inactivity
    }

    /**
     * Save current input as draft
     */
    saveDraft() {
        const text = this.messageInput.value.trim();
        if (text) {
            try {
                localStorage.setItem('zentrafuge_draft', text);
                this.logger.debug('Draft saved');
            } catch (error) {
                this.logger.error('Failed to save draft:', error);
            }
        }
    }

    /**
     * Load saved draft
     */
    loadDraft() {
        try {
            const draft = localStorage.getItem('zentrafuge_draft');
            if (draft) {
                this.setInputText(draft);
                this.logger.debug('Draft loaded');
            }
        } catch (error) {
            this.logger.error('Failed to load draft:', error);
        }
    }

    /**
     * Clear saved draft
     */
    clearDraft() {
        try {
            localStorage.removeItem('zentrafuge_draft');
            this.logger.debug('Draft cleared');
        } catch (error) {
            this.logger.error('Failed to clear draft:', error);
        }
    }

    /**
     * Set maximum message length
     */
    setMaxLength(maxLength) {
        this.maxLength = maxLength;
        this.handleInput({ target: this.messageInput });
    }

    /**
     * Enable/disable input
     */
    setEnabled(enabled) {
        this.messageInput.disabled = !enabled;
        this.sendButton.disabled = !enabled || !this.messageInput.value.trim();
        
        if (enabled) {
            this.focusInput();
        }

        this.emit('enabledChanged', { enabled });
    }

    /**
     * Add input suggestion/autocomplete
     */
    addSuggestion(text) {
        // Could implement autocomplete dropdown here
        this.emit('suggestionAdded', { text });
    }

    /**
     * Insert text at cursor position
     */
    insertTextAtCursor(text) {
        const start = this.messageInput.selectionStart;
        const end = this.messageInput.selectionEnd;
        const value = this.messageInput.value;
        
        this.messageInput.value = value.substring(0, start) + text + value.substring(end);
        
        // Move cursor to end of inserted text
        const newPosition = start + text.length;
        this.messageInput.setSelectionRange(newPosition, newPosition);
        
        this.handleInput({ target: this.messageInput });
        this.focusInput();
    }

    /**
     * Get input statistics
     */
    getStats() {
        return {
            currentLength: this.messageInput.value.length,
            maxLength: this.maxLength,
            remainingChars: this.maxLength - this.messageInput.value.length,
            wordCount: this.messageInput.value.trim().split(/\s+/).filter(word => word.length > 0).length,
            isLoading: this.isLoading,
            hasText: this.messageInput.value.trim().length > 0
        };
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        // Clear timers
        clearTimeout(this.debounceTimer);
        
        // Save final draft
        this.saveDraft();
        
        // Remove event listeners (they'll be cleaned up when elements are removed)
        this.removeAllListeners();
        
        // Reset state
        this.messageInput = null;
        this.sendButton = null;
        this.isLoading = false;
        
        this.logger.info('InputManager destroyed');
    }
}
