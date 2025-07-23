// frontend/js/modules/utils/api-client.js - API Communication
import { EventEmitter } from './event-emitter.js';
import { Logger } from './logger.js';
import { CONFIG } from '../config/config.js';

export class ApiClient extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('ApiClient');
        this.baseUrl = CONFIG.API_BASE_URL;
        this.timeout = CONFIG.API_TIMEOUT || 30000;
        this.retryAttempts = CONFIG.API_RETRY_ATTEMPTS || 3;
        this.retryDelay = CONFIG.API_RETRY_DELAY || 1000;
    }

    /**
     * Make HTTP request with retry logic
     */
    async makeRequest(url, options = {}) {
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.timeout,
            ...options
        };

        this.emit('requestStart', { url: fullUrl, options: defaultOptions });

        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                this.logger.debug(`API request attempt ${attempt}/${this.retryAttempts}`, {
                    url: fullUrl,
                    method: defaultOptions.method || 'GET'
                });

                const response = await this.fetchWithTimeout(fullUrl, defaultOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                this.emit('requestComplete', { url: fullUrl, data });
                this.logger.debug('API request successful', { url: fullUrl, status: response.status });
                
                return data;

            } catch (error) {
                lastError = error;
                this.logger.warn(`API request attempt ${attempt} failed`, {
                    url: fullUrl,
                    error: error.message
                });

                // Don't retry on certain errors
                if (this.isNonRetryableError(error)) {
                    break;
                }

                // Wait before retrying (except on last attempt)
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        this.emit('requestError', { url: fullUrl, error: lastError });
        throw lastError;
    }

    /**
     * Fetch with timeout support
     */
    async fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }

    /**
     * Check if error should not be retried
     */
    isNonRetryableError(error) {
        const nonRetryableMessages = [
            'Request timeout',
            'HTTP 400',
            'HTTP 401',
            'HTTP 403',
            'HTTP 404'
        ];

        return nonRetryableMessages.some(message => 
            error.message.includes(message)
        );
    }

    /**
     * Delay utility for retries
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current user ID from auth
     */
    getCurrentUserId() {
        const user = firebase.auth().currentUser;
        return user ? user.uid : null;
    }

    /**
     * Send chat message to Cael
     */
    async sendChatMessage(message) {
        const userId = this.getCurrentUserId();
        
        if (!userId) {
            throw new Error('User not authenticated');
        }

        this.logger.info('Sending chat message', { messageLength: message.length });

        return await this.makeRequest('/index', {
            method: 'POST',
            body: JSON.stringify({
                message: message,
                user_id: userId
            })
        });
    }

    /**
     * Get chat history
     */
    async getChatHistory(limit = 20, offset = 0) {
        const userId = this.getCurrentUserId();
        
        if (!userId) {
            throw new Error('User not authenticated');
        }

        this.logger.info('Fetching chat history', { limit, offset });

        const response = await this.makeRequest(
            `/history?user_id=${userId}&limit=${limit}&offset=${offset}`
        );

        return response.history || [];
    }

    /**
     * Get user context
     */
    async getUserContext() {
        const userId = this.getCurrentUserId();
        
        if (!userId) {
            throw new Error('User not authenticated');
        }

        this.logger.info('Fetching user context');

        return await this.makeRequest(`/context?user_id=${userId}`);
    }

    /**
     * Record mood
     */
    async recordMood(mood, notes = '') {
        const userId = this.getCurrentUserId();
        
        if (!userId) {
            throw new Error('User not authenticated');
        }

        this.logger.info('Recording mood', { mood });

        return await this.makeRequest('/mood', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                mood: mood,
                notes: notes
            })
        });
    }

    /**
     * Export user data
     */
    async exportUserData() {
        const userId = this.getCurrentUserId();
        
        if (!userId) {
            throw new Error('User not authenticated');
        }

        this.logger.info('Exporting user data');

        return await this.makeRequest(`/export?user_id=${userId}`);
    }

    /**
     * Delete user data
     */
    async deleteUserData() {
        const userId = this.getCurrentUserId();
        
        if (!userId) {
            throw new Error('User not authenticated');
        }

        this.logger.warn('Deleting user data');

        return await this.makeRequest('/delete', {
            method: 'DELETE',
            body: JSON.stringify({
                user_id: userId
            })
        });
    }

    /**
     * Check API health
     */
    async checkHealth() {
        this.logger.debug('Checking API health');

        return await this.makeRequest('/health');
    }

    /**
     * Get API status
     */
    async getStatus() {
        this.logger.debug('Getting API status');

        return await this.makeRequest('/status');
    }

    /**
     * Upload file (if supported)
     */
    async uploadFile(file, purpose = 'general') {
        const userId = this.getCurrentUserId();
        
        if (!userId) {
            throw new Error('User not authenticated');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', userId);
        formData.append('purpose', purpose);

        this.logger.info('Uploading file', { 
            fileName: file.name, 
            fileSize: file.size,
            purpose 
        });

        return await this.makeRequest('/upload', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
    }

    /**
     * Set API configuration
     */
    setConfig(config) {
        if (config.baseUrl) {
            this.baseUrl = config.baseUrl;
        }
        
        if (config.timeout) {
            this.timeout = config.timeout;
        }
        
        if (config.retryAttempts) {
            this.retryAttempts = config.retryAttempts;
        }
        
        if (config.retryDelay) {
            this.retryDelay = config.retryDelay;
        }

        this.logger.info('API configuration updated', config);
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return {
            baseUrl: this.baseUrl,
            timeout: this.timeout,
            retryAttempts: this.retryAttempts,
            retryDelay: this.retryDelay
        };
    }

    /**
     * Destroy client and cleanup
     */
    destroy() {
        this.removeAllListeners();
        this.logger.info('API client destroyed');
    }
}
