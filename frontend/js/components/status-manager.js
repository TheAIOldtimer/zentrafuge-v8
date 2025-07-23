// frontend/js/components/status-manager.js - Status Messages and Loading Component
import { EventEmitter } from '../modules/utils/event-emitter.js';
import { Logger } from '../modules/utils/logger.js';

export class StatusManager extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('StatusManager');
        this.statusContainer = null;
        this.loadingSpinner = null;
        this.currentStatus = null;
        this.statusTimeout = null;
        this.defaultDuration = 5000; // 5 seconds
    }

    /**
     * Initialize the status manager
     */
    init() {
        try {
            // Find or create status containers
            this.initStatusContainer();
            this.initLoadingSpinner();
            
            this.logger.info('StatusManager initialized');
            return true;

        } catch (error) {
            this.logger.error('Failed to initialize StatusManager:', error);
            return false;
        }
    }

    /**
     * Initialize status message container
     */
    initStatusContainer() {
        // Look for existing status container
        this.statusContainer = document.getElementById('status-message') ||
                              document.getElementById('status') ||
                              document.querySelector('.status-message');

        // Create if doesn't exist
        if (!this.statusContainer) {
            this.statusContainer = this.createStatusContainer();
            document.body.appendChild(this.statusContainer);
        }
    }

    /**
     * Initialize loading spinner
     */
    initLoadingSpinner() {
        // Look for existing loading spinner
        this.loadingSpinner = document.getElementById('loading-spinner') ||
                             document.getElementById('loading') ||
                             document.querySelector('.loading-spinner');

        // Create if doesn't exist
        if (!this.loadingSpinner) {
            this.loadingSpinner = this.createLoadingSpinner();
            document.body.appendChild(this.loadingSpinner);
        }
    }

    /**
     * Create status container element
     */
    createStatusContainer() {
        const container = document.createElement('div');
        container.id = 'status-message';
        container.className = 'status-message';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        return container;
    }

    /**
     * Create loading spinner element
     */
    createLoadingSpinner() {
        const spinner = document.createElement('div');
        spinner.id = 'loading-spinner';
        spinner.className = 'loading-spinner';
        spinner.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1001;
            display: none;
        `;

        const spinnerInner = document.createElement('div');
        spinnerInner.className = 'spinner';
        spinnerInner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        spinner.appendChild(spinnerInner);

        // Add CSS animation if not already present
        this.addSpinnerCSS();

        return spinner;
    }

    /**
     * Add spinner CSS animation
     */
    addSpinnerCSS() {
        if (document.getElementById('spinner-styles')) return;

        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show success message
     */
    showSuccess(message, duration = this.defaultDuration) {
        this.showStatus(message, 'success', duration);
        this.logger.info('Success message shown:', message);
    }

    /**
     * Show error message
     */
    showError(message, duration = this.defaultDuration) {
        this.showStatus(message, 'error', duration);
        this.logger.warn('Error message shown:', message);
    }

    /**
     * Show info message
     */
    showInfo(message, duration = this.defaultDuration) {
        this.showStatus(message, 'info', duration);
        this.logger.info('Info message shown:', message);
    }

    /**
     * Show warning message
     */
    showWarning(message, duration = this.defaultDuration) {
        this.showStatus(message, 'warning', duration);
        this.logger.warn('Warning message shown:', message);
    }

    /**
     * Show status message with type
     */
    showStatus(message, type = 'info', duration = this.defaultDuration) {
        if (!this.statusContainer) {
            console.warn('Status container not available');
            return;
        }

        // Clear any existing timeout
        this.clearStatusTimeout();

        // Set message and type
        this.statusContainer.textContent = message;
        this.statusContainer.className = `status-message ${type}`;
        this.currentStatus = { message, type, duration };

        // Set colors based on type
        const colors = {
            success: '#51cf66',
            error: '#ff6b6b',
            warning: '#ff9800',
            info: '#339af0'
        };

        this.statusContainer.style.backgroundColor = colors[type] || colors.info;

        // Show with animation
        this.statusContainer.style.transform = 'translateX(0)';

        // Auto-hide after duration
        if (duration > 0) {
            this.statusTimeout = setTimeout(() => {
                this.hideStatus();
            }, duration);
        }

        // Emit event
        this.emit('statusShown', { message, type, duration });
    }

    /**
     * Hide status message
     */
    hideStatus() {
        if (!this.statusContainer) return;

        this.statusContainer.style.transform = 'translateX(100%)';
        this.clearStatusTimeout();
        this.currentStatus = null;

        this.emit('statusHidden');
    }

    /**
     * Clear status timeout
     */
    clearStatusTimeout() {
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
            this.statusTimeout = null;
        }
    }

    /**
     * Show loading spinner
     */
    showLoading(message = '') {
        if (!this.loadingSpinner) return;

        this.loadingSpinner.style.display = 'flex';
        
        // Add message if provided
        if (message) {
            let messageElement = this.loadingSpinner.querySelector('.loading-message');
            if (!messageElement) {
                messageElement = document.createElement('div');
                messageElement.className = 'loading-message';
                messageElement.style.cssText = `
                    margin-top: 1rem;
                    text-align: center;
                    color: #667eea;
                    font-weight: 500;
                `;
                this.loadingSpinner.appendChild(messageElement);
            }
            messageElement.textContent = message;
        }

        this.emit('loadingShown', { message });
        this.logger.debug('Loading spinner shown');
    }

    /**
     * Hide loading spinner
     */
    hideLoading() {
        if (!this.loadingSpinner) return;

        this.loadingSpinner.style.display = 'none';
        
        // Remove message
        const messageElement = this.loadingSpinner.querySelector('.loading-message');
        if (messageElement) {
            messageElement.remove();
        }

        this.emit('loadingHidden');
        this.logger.debug('Loading spinner hidden');
    }

    /**
     * Show typing indicator
     */
    showTyping(name = 'Cael') {
        this.showStatus(`${name} is thinking...`, 'info', 0); // No auto-hide
        
        // Add typing animation
        if (this.statusContainer) {
            this.statusContainer.classList.add('typing-indicator');
            
            // Add CSS for typing animation if not present
            this.addTypingCSS();
        }

        this.emit('typingShown', { name });
    }

    /**
     * Hide typing indicator
     */
    hideTyping() {
        if (this.statusContainer) {
            this.statusContainer.classList.remove('typing-indicator');
        }
        this.hideStatus();
        this.emit('typingHidden');
    }

    /**
     * Add typing indicator CSS
     */
    addTypingCSS() {
        if (document.getElementById('typing-styles')) return;

        const style = document.createElement('style');
        style.id = 'typing-styles';
        style.textContent = `
            .typing-indicator::after {
                content: '';
                animation: typing-dots 1.5s infinite;
            }
            
            @keyframes typing-dots {
                0%, 20% { content: ''; }
                40% { content: '.'; }
                60% { content: '..'; }
                80%, 100% { content: '...'; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show connection status
     */
    showConnectionStatus(connected = true) {
        if (connected) {
            this.showSuccess('Connected to Cael', 2000);
        } else {
            this.showError('Connection lost. Trying to reconnect...', 0); // No auto-hide
        }

        this.emit('connectionStatusChanged', { connected });
    }

    /**
     * Show progress message
     */
    showProgress(message, percentage = null) {
        let displayMessage = message;
        
        if (percentage !== null) {
            displayMessage += ` (${Math.round(percentage)}%)`;
        }

        this.showStatus(displayMessage, 'info', 0); // No auto-hide
        this.emit('progressShown', { message, percentage });
    }

    /**
     * Update progress
     */
    updateProgress(message, percentage) {
        this.showProgress(message, percentage);
    }

    /**
     * Hide progress
     */
    hideProgress() {
        this.hideStatus();
        this.emit('progressHidden');
    }

    /**
     * Show notification (browser notification if permitted)
     */
    async showNotification(title, message, options = {}) {
        // Show in-app status first
        this.showInfo(`${title}: ${message}`);

        // Try browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification(title, {
                    body: message,
                    icon: '/Zentrafuge-WIDE-Logo-Transparent.png',
                    badge: '/Zentrafuge-WIDE-Logo-Transparent.png',
                    ...options
                });

                // Auto-close after 5 seconds
                setTimeout(() => {
                    notification.close();
                }, 5000);

                this.emit('notificationShown', { title, message, notification });
                return notification;

            } catch (error) {
                this.logger.error('Failed to show browser notification:', error);
            }
        }

        return null;
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            this.logger.warn('Browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            this.showWarning('Notifications are blocked. Enable them in browser settings.');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.showSuccess('Notifications enabled');
                return true;
            } else {
                this.showInfo('Notifications disabled');
                return false;
            }

        } catch (error) {
            this.logger.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Show confirmation dialog
     */
    showConfirmation(message, onConfirm, onCancel = null) {
        // For now, use browser confirm - could be enhanced with custom modal
        const result = confirm(message);
        
        if (result && onConfirm) {
            onConfirm();
        } else if (!result && onCancel) {
            onCancel();
        }

        this.emit('confirmationShown', { message, result });
        return result;
    }

    /**
     * Clear all status messages
     */
    clearAll() {
        this.hideStatus();
        this.hideLoading();
        this.hideTyping();
        this.clearStatusTimeout();
        
        this.emit('allCleared');
        this.logger.debug('All status messages cleared');
    }

    /**
     * Get current status
     */
    getCurrentStatus() {
        return this.currentStatus;
    }

    /**
     * Check if loading is visible
     */
    isLoadingVisible() {
        return this.loadingSpinner && this.loadingSpinner.style.display !== 'none';
    }

    /**
     * Check if status is visible
     */
    isStatusVisible() {
        return this.currentStatus !== null;
    }

    /**
     * Set default duration for status messages
     */
    setDefaultDuration(duration) {
        this.defaultDuration = Math.max(1000, duration); // Minimum 1 second
    }

    /**
     * Customize status container position
     */
    setStatusPosition(position = 'top-right') {
        if (!this.statusContainer) return;

        const positions = {
            'top-right': { top: '20px', right: '20px', left: 'auto', bottom: 'auto' },
            'top-left': { top: '20px', left: '20px', right: 'auto', bottom: 'auto' },
            'bottom-right': { bottom: '20px', right: '20px', top: 'auto', left: 'auto' },
            'bottom-left': { bottom: '20px', left: '20px', top: 'auto', right: 'auto' },
            'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)', right: 'auto', bottom: 'auto' },
            'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)', top: 'auto', right: 'auto' }
        };

        const pos = positions[position] || positions['top-right'];
        
        Object.assign(this.statusContainer.style, pos);
    }

    /**
     * Add custom CSS class to status container
     */
    addStatusClass(className) {
        if (this.statusContainer) {
            this.statusContainer.classList.add(className);
        }
    }

    /**
     * Remove custom CSS class from status container
     */
    removeStatusClass(className) {
        if (this.statusContainer) {
            this.statusContainer.classList.remove(className);
        }
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        // Clear any active timeouts
        this.clearStatusTimeout();
        
        // Hide all status messages
        this.clearAll();
        
        // Remove created elements
        if (this.statusContainer && this.statusContainer.id === 'status-message') {
            this.statusContainer.remove();
        }
        
        if (this.loadingSpinner && this.loadingSpinner.id === 'loading-spinner') {
            this.loadingSpinner.remove();
        }
        
        // Remove styles
        const spinnerStyles = document.getElementById('spinner-styles');
        if (spinnerStyles) spinnerStyles.remove();
        
        const typingStyles = document.getElementById('typing-styles');
        if (typingStyles) typingStyles.remove();
        
        // Clean up references
        this.statusContainer = null;
        this.loadingSpinner = null;
        this.currentStatus = null;
        
        // Remove all event listeners
        this.removeAllListeners();
        
        this.logger.info('StatusManager destroyed');
    }
}
