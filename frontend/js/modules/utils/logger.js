// frontend/js/modules/utils/logger.js - Frontend Logging
export class Logger {
    constructor(namespace = 'Zentrafuge') {
        this.namespace = namespace;
        this.logLevel = this.getLogLevel();
        this.colors = {
            debug: '#9E9E9E',
            info: '#2196F3',
            warn: '#FF9800',
            error: '#F44336',
            chat: '#4CAF50'
        };
    }

    /**
     * Get log level from localStorage or environment
     */
    getLogLevel() {
        // Check localStorage first
        const stored = localStorage.getItem('zentrafuge_log_level');
        if (stored) {
            return stored.toLowerCase();
        }

        // Check if in development
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.search.includes('debug=true')) {
            return 'debug';
        }

        return 'warn'; // Production default
    }

    /**
     * Check if level should be logged
     */
    shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3, chat: 1 };
        const currentLevel = levels[this.logLevel] || 2;
        const messageLevel = levels[level] || 0;
        
        return messageLevel >= currentLevel;
    }

    /**
     * Format log message
     */
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${this.namespace}] [${level.toUpperCase()}]`;
        
        return {
            prefix,
            message,
            data,
            color: this.colors[level] || '#000000'
        };
    }

    /**
     * Log message to console
     */
    log(level, message, data = null) {
        if (!this.shouldLog(level)) {
            return;
        }

        const formatted = this.formatMessage(level, message, data);
        
        // Use appropriate console method
        const consoleMethod = level === 'error' ? 'error' : 
                            level === 'warn' ? 'warn' : 'log';

        if (data) {
            console[consoleMethod](
                `%c${formatted.prefix} ${formatted.message}`,
                `color: ${formatted.color}; font-weight: bold;`,
                data
            );
        } else {
            console[consoleMethod](
                `%c${formatted.prefix} ${formatted.message}`,
                `color: ${formatted.color}; font-weight: bold;`
            );
        }

        // Send to remote logging if configured
        this.sendToRemote(level, message, data);
    }

    /**
     * Debug level logging
     */
    debug(message, data = null) {
        this.log('debug', message, data);
    }

    /**
     * Info level logging
     */
    info(message, data = null) {
        this.log('info', message, data);
    }

    /**
     * Warning level logging
     */
    warn(message, data = null) {
        this.log('warn', message, data);
    }

    /**
     * Error level logging
     */
    error(message, data = null) {
        this.log('error', message, data);
        
        // Also track errors for debugging
        this.trackError(message, data);
    }

    /**
     * Chat-specific logging
     */
    chat(message, data = null) {
        this.log('chat', message, data);
    }

    /**
     * Group logging
     */
    group(title, callback) {
        if (!this.shouldLog('debug')) {
            callback();
            return;
        }

        console.group(`%c[${this.namespace}] ${title}`, 
                     `color: ${this.colors.info}; font-weight: bold;`);
        
        try {
            callback();
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Time measurement
     */
    time(label) {
        if (this.shouldLog('debug')) {
            console.time(`[${this.namespace}] ${label}`);
        }
    }

    /**
     * End time measurement
     */
    timeEnd(label) {
        if (this.shouldLog('debug')) {
            console.timeEnd(`[${this.namespace}] ${label}`);
        }
    }

    /**
     * Track errors for analytics
     */
    trackError(message, data) {
        try {
            // Store recent errors in localStorage for debugging
            const errors = JSON.parse(localStorage.getItem('zentrafuge_errors') || '[]');
            
            errors.push({
                timestamp: new Date().toISOString(),
                namespace: this.namespace,
                message,
                data: data ? JSON.stringify(data) : null,
                url: window.location.href,
                userAgent: navigator.userAgent
            });

            // Keep only last 50 errors
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }

            localStorage.setItem('zentrafuge_errors', JSON.stringify(errors));

        } catch (e) {
            // Ignore localStorage errors
        }
    }

    /**
     * Send logs to remote service (if configured)
     */
    sendToRemote(level, message, data) {
        // Only send errors and warnings to remote in production
        if (level !== 'error' && level !== 'warn') {
            return;
        }

        // Don't send in development
        if (this.logLevel === 'debug') {
            return;
        }

        try {
            // This could be configured to send to a logging service
            const logData = {
                timestamp: new Date().toISOString(),
                level,
                namespace: this.namespace,
                message,
                data,
                url: window.location.href,
                userAgent: navigator.userAgent
            };

            // Example: send to backend logging endpoint
            // fetch('/api/logs', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(logData)
            // });

        } catch (e) {
            // Ignore remote logging errors
        }
    }

    /**
     * Get stored errors for debugging
     */
    getStoredErrors() {
        try {
            return JSON.parse(localStorage.getItem('zentrafuge_errors') || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * Clear stored errors
     */
    clearStoredErrors() {
        try {
            localStorage.removeItem('zentrafuge_errors');
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Set log level dynamically
     */
    setLogLevel(level) {
        this.logLevel = level.toLowerCase();
        localStorage.setItem('zentrafuge_log_level', this.logLevel);
        this.info(`Log level set to: ${this.logLevel}`);
    }
}

// Global logger functions for convenience
export const createLogger = (namespace) => new Logger(namespace);

// Default logger
export const logger = new Logger('Zentrafuge');
