// frontend/js/components/message-renderer.js - Message Display Component
import { EventEmitter } from '../modules/utils/event-emitter.js';
import { Logger } from '../modules/utils/logger.js';

export class MessageRenderer extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('MessageRenderer');
        this.container = null;
        this.messageCount = 0;
        this.maxMessages = 100; // Limit for performance
    }

    /**
     * Initialize the message renderer
     */
    init(container) {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        this.logger.info('MessageRenderer initialized');
        return true;
    }

    /**
     * Render a message in the chat
     */
    renderMessage(message) {
        if (!this.container) {
            this.logger.error('Container not initialized');
            return;
        }

        try {
            const messageElement = this.createMessageElement(message);
            this.container.appendChild(messageElement);
            this.messageCount++;

            // Limit messages for performance
            this.limitMessages();

            // Emit render event
            this.emit('messageRendered', { message, element: messageElement });

            this.logger.debug('Message rendered', { 
                sender: message.sender, 
                length: message.text.length 
            });

        } catch (error) {
            this.logger.error('Error rendering message:', error);
        }
    }

    /**
     * Create message DOM element
     */
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}-message`;
        messageDiv.dataset.messageId = message.id || '';
        messageDiv.dataset.timestamp = message.timestamp.toISOString();

        // Add special classes for message types
        if (message.isWelcome) messageDiv.classList.add('welcome-message');
        if (message.isHistory) messageDiv.classList.add('history-message');
        if (message.isError) messageDiv.classList.add('error-message');

        const timestamp = this.formatTimestamp(message.timestamp);

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessageText(message.text)}</div>
                <div class="message-timestamp">${timestamp}</div>
                ${message.metadata ? this.renderMetadata(message.metadata) : ''}
            </div>
        `;

        // Add animation
        this.animateMessageIn(messageDiv);

        return messageDiv;
    }

    /**
     * Format message text (handle markdown, links, etc.)
     */
    formatMessageText(text) {
        // Escape HTML to prevent XSS
        text = this.escapeHtml(text);

        // Convert line breaks
        text = text.replace(/\n/g, '<br>');

        // Convert **bold** to <strong>
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert *italic* to <em>
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Convert basic links (simple pattern)
        text = text.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );

        return text;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        const now = new Date();
        const diff = now - timestamp;

        // Less than 1 minute
        if (diff < 60000) {
            return 'now';
        }

        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        }

        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }

        // Older - show date
        return timestamp.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Render message metadata (processing time, tokens, etc.)
     */
    renderMetadata(metadata) {
        if (!metadata || typeof metadata !== 'object') return '';

        const items = [];

        if (metadata.processing_time) {
            items.push(`${metadata.processing_time}s`);
        }

        if (metadata.tokens_used) {
            items.push(`${metadata.tokens_used} tokens`);
        }

        if (metadata.model_used && metadata.model_used !== 'gpt-4') {
            items.push(metadata.model_used);
        }

        if (items.length === 0) return '';

        return `<div class="message-metadata">${items.join(' • ')}</div>`;
    }

    /**
     * Animate message entrance
     */
    animateMessageIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        // Trigger animation on next frame
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    /**
     * Limit number of messages for performance
     */
    limitMessages() {
        if (this.messageCount > this.maxMessages) {
            const messages = this.container.querySelectorAll('.message');
            const toRemove = messages.length - this.maxMessages;

            for (let i = 0; i < toRemove; i++) {
                if (messages[i]) {
                    messages[i].remove();
                    this.messageCount--;
                }
            }

            this.logger.debug(`Removed ${toRemove} old messages for performance`);
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        if (this.container) {
            this.container.innerHTML = '';
            this.messageCount = 0;
            this.emit('messagesCleared');
            this.logger.info('All messages cleared');
        }
    }

    /**
     * Scroll to bottom of container
     */
    scrollToBottom() {
        if (this.container) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    }

    /**
     * Scroll to specific message
     */
    scrollToMessage(messageId) {
        if (!this.container) return;

        const messageElement = this.container.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight briefly
            messageElement.classList.add('highlighted');
            setTimeout(() => {
                messageElement.classList.remove('highlighted');
            }, 2000);
        }
    }

    /**
     * Update message content (for editing)
     */
    updateMessage(messageId, newText) {
        if (!this.container) return false;

        const messageElement = this.container.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const textElement = messageElement.querySelector('.message-text');
            if (textElement) {
                textElement.innerHTML = this.formatMessageText(newText);
                
                // Add edited indicator
                const timestamp = messageElement.querySelector('.message-timestamp');
                if (timestamp && !timestamp.textContent.includes('(edited)')) {
                    timestamp.textContent += ' (edited)';
                }

                this.emit('messageUpdated', { messageId, newText });
                return true;
            }
        }

        return false;
    }

    /**
     * Remove specific message
     */
    removeMessage(messageId) {
        if (!this.container) return false;

        const messageElement = this.container.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
            this.messageCount--;
            this.emit('messageRemoved', { messageId });
            return true;
        }

        return false;
    }

    /**
     * Get message statistics
     */
    getStats() {
        return {
            totalMessages: this.messageCount,
            userMessages: this.container?.querySelectorAll('.user-message').length || 0,
            caelMessages: this.container?.querySelectorAll('.cael-message').length || 0,
            welcomeMessages: this.container?.querySelectorAll('.welcome-message').length || 0,
            historyMessages: this.container?.querySelectorAll('.history-message').length || 0
        };
    }

    /**
     * Set maximum number of messages
     */
    setMaxMessages(max) {
        this.maxMessages = Math.max(10, max); // Minimum 10 messages
        this.limitMessages(); // Apply immediately
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.removeAllListeners();
        this.container = null;
        this.messageCount = 0;
        
        this.logger.info('MessageRenderer destroyed');
    }
}
