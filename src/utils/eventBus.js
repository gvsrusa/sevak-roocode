/**
 * Sevak Mini Tractor - Event Bus
 * 
 * Provides a centralized event bus for communication between system components.
 * Implements publish-subscribe pattern with support for request-response.
 */

const Logger = require('./logger');

class EventBus {
  constructor() {
    this.logger = new Logger('EventBus');
    
    // Event subscribers
    this.subscribers = new Map();
    
    // Request handlers
    this.requestHandlers = new Map();
    
    // Request ID counter
    this.requestIdCounter = 0;
    
    // Pending requests
    this.pendingRequests = new Map();
    
    this.logger.info('Event Bus initialized');
  }
  
  /**
   * Subscribe to an event
   * @param {string} eventType - Event type to subscribe to
   * @param {function} callback - Callback function to be called when event is published
   * @returns {string} Subscription ID
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Map());
    }
    
    const subscriptionId = `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.subscribers.get(eventType).set(subscriptionId, callback);
    
    this.logger.debug(`Subscribed to event: ${eventType} (ID: ${subscriptionId})`);
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from an event
   * @param {string} subscriptionId - Subscription ID returned from subscribe
   * @returns {boolean} True if unsubscribed successfully
   */
  unsubscribe(subscriptionId) {
    // Extract event type from subscription ID
    const eventType = subscriptionId.split('_')[0];
    
    if (!this.subscribers.has(eventType)) {
      return false;
    }
    
    const result = this.subscribers.get(eventType).delete(subscriptionId);
    
    if (result) {
      this.logger.debug(`Unsubscribed from event: ${eventType} (ID: ${subscriptionId})`);
      
      // Clean up empty event types
      if (this.subscribers.get(eventType).size === 0) {
        this.subscribers.delete(eventType);
      }
    }
    
    return result;
  }
  
  /**
   * Publish an event
   * @param {string} eventType - Event type to publish
   * @param {object} data - Event data
   */
  publish(eventType, data) {
    if (!this.subscribers.has(eventType)) {
      return;
    }
    
    this.logger.debug(`Publishing event: ${eventType}`);
    
    // Call all subscribers
    for (const callback of this.subscribers.get(eventType).values()) {
      try {
        callback(data);
      } catch (error) {
        this.logger.error(`Error in event subscriber for ${eventType}: ${error.message}`);
      }
    }
  }
  
  /**
   * Register a request handler
   * @param {string} requestType - Request type to handle
   * @param {function} handler - Handler function to be called when request is made
   * @returns {string} Handler ID
   */
  registerRequestHandler(requestType, handler) {
    if (!this.requestHandlers.has(requestType)) {
      this.requestHandlers.set(requestType, new Map());
    }
    
    const handlerId = `${requestType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.requestHandlers.get(requestType).set(handlerId, handler);
    
    this.logger.debug(`Registered request handler for: ${requestType} (ID: ${handlerId})`);
    
    return handlerId;
  }
  
  /**
   * Unregister a request handler
   * @param {string} handlerId - Handler ID returned from registerRequestHandler
   * @returns {boolean} True if unregistered successfully
   */
  unregisterRequestHandler(handlerId) {
    // Extract request type from handler ID
    const requestType = handlerId.split('_')[0];
    
    if (!this.requestHandlers.has(requestType)) {
      return false;
    }
    
    const result = this.requestHandlers.get(requestType).delete(handlerId);
    
    if (result) {
      this.logger.debug(`Unregistered request handler for: ${requestType} (ID: ${handlerId})`);
      
      // Clean up empty request types
      if (this.requestHandlers.get(requestType).size === 0) {
        this.requestHandlers.delete(requestType);
      }
    }
    
    return result;
  }
  
  /**
   * Make a request
   * @param {string} requestType - Request type
   * @param {object} data - Request data
   * @param {number} timeout - Request timeout in milliseconds
   * @returns {Promise} Promise that resolves with response data or rejects with error
   */
  request(requestType, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.requestHandlers.has(requestType)) {
        reject(new Error(`No handler registered for request type: ${requestType}`));
        return;
      }
      
      // Generate request ID
      const requestId = this.requestIdCounter++;
      
      this.logger.debug(`Making request: ${requestType} (ID: ${requestId})`);
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        // Remove pending request
        this.pendingRequests.delete(requestId);
        
        reject(new Error(`Request timed out: ${requestType} (ID: ${requestId})`));
      }, timeout);
      
      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeoutId
      });
      
      // Call first handler
      const handlers = Array.from(this.requestHandlers.get(requestType).values());
      
      if (handlers.length === 0) {
        // No handlers
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);
        reject(new Error(`No handler available for request type: ${requestType}`));
        return;
      }
      
      try {
        // Call first handler
        handlers[0]({
          ...data,
          _requestId: requestId
        })
          .then(response => {
            // Clear timeout
            clearTimeout(timeoutId);
            
            // Remove pending request
            this.pendingRequests.delete(requestId);
            
            // Resolve promise
            resolve(response);
          })
          .catch(error => {
            // Clear timeout
            clearTimeout(timeoutId);
            
            // Remove pending request
            this.pendingRequests.delete(requestId);
            
            // Reject promise
            reject(error);
          });
      } catch (error) {
        // Clear timeout
        clearTimeout(timeoutId);
        
        // Remove pending request
        this.pendingRequests.delete(requestId);
        
        // Reject promise
        reject(error);
      }
    });
  }
  
  /**
   * Respond to a request
   * @param {number} requestId - Request ID
   * @param {object} data - Response data
   * @param {Error} error - Error if request failed
   */
  respond(requestId, data, error) {
    if (!this.pendingRequests.has(requestId)) {
      this.logger.warn(`No pending request with ID: ${requestId}`);
      return;
    }
    
    const pendingRequest = this.pendingRequests.get(requestId);
    
    // Clear timeout
    clearTimeout(pendingRequest.timeoutId);
    
    // Remove pending request
    this.pendingRequests.delete(requestId);
    
    if (error) {
      // Reject promise
      pendingRequest.reject(error);
    } else {
      // Resolve promise
      pendingRequest.resolve(data);
    }
  }
}

// Create singleton instance
const eventBus = new EventBus();

module.exports = eventBus;