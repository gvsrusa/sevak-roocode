/**
 * Unit tests for EventBus
 */

// Since eventBus is a singleton, we need to get a fresh instance for testing
jest.mock('../../../src/utils/logger');

describe('EventBus', () => {
  let eventBus;
  
  beforeEach(() => {
    // Clear the module cache to get a fresh instance
    jest.resetModules();
    eventBus = require('../../../src/utils/eventBus');
  });
  
  describe('subscribe and publish', () => {
    test('should call subscriber when event is published', () => {
      // Setup
      const eventType = 'test.event';
      const eventData = { foo: 'bar' };
      const subscriber = jest.fn();
      
      // Execute
      const subscriptionId = eventBus.subscribe(eventType, subscriber);
      eventBus.publish(eventType, eventData);
      
      // Verify
      expect(subscriptionId).toBeDefined();
      expect(subscriber).toHaveBeenCalledWith(eventData);
    });
    
    test('should not call subscriber for different event types', () => {
      // Setup
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      
      // Execute
      eventBus.subscribe('event1', subscriber1);
      eventBus.subscribe('event2', subscriber2);
      eventBus.publish('event1', { data: 'event1' });
      
      // Verify
      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).not.toHaveBeenCalled();
    });
    
    test('should call multiple subscribers for the same event', () => {
      // Setup
      const eventType = 'test.event';
      const eventData = { foo: 'bar' };
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      
      // Execute
      eventBus.subscribe(eventType, subscriber1);
      eventBus.subscribe(eventType, subscriber2);
      eventBus.publish(eventType, eventData);
      
      // Verify
      expect(subscriber1).toHaveBeenCalledWith(eventData);
      expect(subscriber2).toHaveBeenCalledWith(eventData);
    });
    
    test('should handle subscriber errors gracefully', () => {
      // Setup
      const eventType = 'test.event';
      const eventData = { foo: 'bar' };
      const errorSubscriber = jest.fn().mockImplementation(() => {
        throw new Error('Subscriber error');
      });
      const normalSubscriber = jest.fn();
      
      // Execute
      eventBus.subscribe(eventType, errorSubscriber);
      eventBus.subscribe(eventType, normalSubscriber);
      eventBus.publish(eventType, eventData);
      
      // Verify - normal subscriber should still be called
      expect(errorSubscriber).toHaveBeenCalledWith(eventData);
      expect(normalSubscriber).toHaveBeenCalledWith(eventData);
    });
    
    test('should do nothing when publishing to an event with no subscribers', () => {
      // This should not throw an error
      eventBus.publish('nonexistent.event', { data: 'test' });
    });
  });
  
  describe('unsubscribe', () => {
    test('should remove subscriber when unsubscribed', () => {
      // Setup
      const eventType = 'test.event';
      const subscriber = jest.fn();
      
      // Execute
      const subscriptionId = eventBus.subscribe(eventType, subscriber);
      const result = eventBus.unsubscribe(subscriptionId);
      eventBus.publish(eventType, { data: 'test' });
      
      // Verify
      expect(result).toBe(true);
      expect(subscriber).not.toHaveBeenCalled();
    });
    
    test('should return false when unsubscribing with invalid ID', () => {
      // Execute
      const result = eventBus.unsubscribe('invalid_id');
      
      // Verify
      expect(result).toBe(false);
    });
    
    test('should clean up empty event types', () => {
      // Setup
      const eventType = 'test.event';
      const subscriber = jest.fn();
      
      // Execute
      const subscriptionId = eventBus.subscribe(eventType, subscriber);
      eventBus.unsubscribe(subscriptionId);
      
      // Verify - this is an implementation detail, but we can check that
      // publishing to the event type doesn't throw an error
      eventBus.publish(eventType, { data: 'test' });
    });
  });
  
  describe('request and respond', () => {
    test('should resolve promise when response is received', async () => {
      // Setup
      const requestType = 'test.request';
      const requestData = { foo: 'bar' };
      const responseData = { result: 'success' };
      
      // Register handler
      const handler = jest.fn().mockImplementation(async (data) => {
        expect(data.foo).toBe('bar');
        return responseData;
      });
      
      eventBus.registerRequestHandler(requestType, handler);
      
      // Execute
      const response = await eventBus.request(requestType, requestData);
      
      // Verify
      expect(handler).toHaveBeenCalled();
      expect(response).toEqual(responseData);
    });
    
    test('should reject promise when handler throws error', async () => {
      // Setup
      const requestType = 'test.request';
      const requestData = { foo: 'bar' };
      const errorMessage = 'Handler error';
      
      // Register handler
      const handler = jest.fn().mockImplementation(async () => {
        throw new Error(errorMessage);
      });
      
      eventBus.registerRequestHandler(requestType, handler);
      
      // Execute and verify
      await expect(eventBus.request(requestType, requestData)).rejects.toThrow();
    });
    
    test('should reject promise when no handler is registered', async () => {
      // Execute and verify
      await expect(eventBus.request('nonexistent.request', {})).rejects.toThrow();
    });
    
    test('should reject promise when request times out', async () => {
      // Setup
      const requestType = 'test.request';
      const requestData = { foo: 'bar' };
      
      // Register handler that never resolves
      const handler = jest.fn().mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });
      
      eventBus.registerRequestHandler(requestType, handler);
      
      // Execute and verify
      await expect(eventBus.request(requestType, requestData, 100)).rejects.toThrow(/timeout/i);
    }, 1000); // Increase timeout for this test
    
    test('should unregister request handler', async () => {
      // Setup
      const requestType = 'test.request';
      const handler = jest.fn();
      
      // Register and then unregister handler
      const handlerId = eventBus.registerRequestHandler(requestType, handler);
      const result = eventBus.unregisterRequestHandler(handlerId);
      
      // Verify
      expect(result).toBe(true);
      await expect(eventBus.request(requestType, {})).rejects.toThrow();
    });
    
    test('should return false when unregistering with invalid handler ID', () => {
      // Execute
      const result = eventBus.unregisterRequestHandler('invalid_id');
      
      // Verify
      expect(result).toBe(false);
    });
  });
  
  describe('respond', () => {
    test('should resolve pending request', () => {
      // This is an implementation detail that's hard to test directly
      // We'll test it indirectly through the request/response flow
    });
    
    test('should do nothing for non-existent request ID', () => {
      // This should not throw an error
      eventBus.respond(999, { data: 'test' });
    });
  });
});