/**
 * Simple pub/sub event bus for decoupled module communication
 */

(function() {
  'use strict';

  const EventBus = {
    _listeners: {},

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} handler - Callback handler
     * @returns {function} Unsubscribe function
     */
    on: function(event, handler) {
      if (!this._listeners[event]) {
        this._listeners[event] = [];
      }
      this._listeners[event].push(handler);

      // Return unsubscribe function
      return function() {
        EventBus._listeners[event] = EventBus._listeners[event].filter(h => h !== handler);
      };
    },

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {function} handler - Callback handler
     */
    once: function(event, handler) {
      const unsubscribe = this.on(event, function wrappedHandler(payload) {
        handler(payload);
        unsubscribe();
      });
      return unsubscribe;
    },

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} payload - Event data
     */
    emit: function(event, payload) {
      if (!this._listeners[event]) return;
      this._listeners[event].forEach(handler => {
        try {
          handler(payload);
        } catch (err) {
          console.error('[EventBus] Error in handler for event "' + event + '":', err);
        }
      });
    },

    /**
     * Remove all listeners for an event (or all events if no event specified)
     * @param {string} event - Event name (optional)
     */
    clear: function(event) {
      if (event) {
        delete this._listeners[event];
      } else {
        this._listeners = {};
      }
    }
  };

  // Export for Node and browser
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
  }
  if (typeof window !== 'undefined') {
    window.IPTV = window.IPTV || {};
    window.IPTV.EventBus = EventBus;
  }
})();
