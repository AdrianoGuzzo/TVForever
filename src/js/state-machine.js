/**
 * Finite State Machine for app navigation state
 * Pure state transitions defined by a lookup table
 */

(function() {
  'use strict';

  const StateMachine = {
    // Current state
    _state: 'LOADING_PLAYLIST',

    // Context (additional data associated with state)
    _context: {
      channelId: null,
      categoryId: null,
      query: null,
      returnTo: 'CHANNEL_LIST'
    },

    // State transition table: nextState = TRANSITIONS[currentState][event]
    TRANSITIONS: {
      'LOADING_PLAYLIST': {
        'SUCCESS': 'PLAYLIST_LOADED',
        'FAILED': 'PLAYLIST_ERROR'
      },
      'PLAYLIST_LOADED': {
        'AUTO': 'CHANNEL_LIST'
      },
      'PLAYLIST_ERROR': {
        'RETRY': 'LOADING_PLAYLIST',
        'OPEN_SETTINGS': 'SETTINGS'
      },
      'CHANNEL_LIST': {
        'SELECT_CHANNEL': 'PLAYING',
        'OPEN_SETTINGS': 'SETTINGS'
      },
      'PLAYING': {
        'BACK': 'CHANNEL_LIST',
        'ERROR': 'PLAYER_ERROR'
      },
      'PLAYER_ERROR': {
        'RETRY': 'PLAYING',
        'BACK': 'CHANNEL_LIST'
      },
      'SETTINGS': {
        'BACK': 'CHANNEL_LIST',
        'SAVE': 'CHANNEL_LIST'
      }
    },

    /**
     * Dispatch a state transition event
     * @param {string} event - Event name
     * @param {object} payload - Additional context
     */
    dispatch: function(event, payload) {
      payload = payload || {};

      const valid = this.TRANSITIONS[this._state];
      if (!valid) {
        console.warn('[StateMachine] No transitions defined for state "' + this._state + '"');
        return;
      }

      const nextState = valid[event];
      if (!nextState) {
        console.warn('[StateMachine] Invalid transition: ' + this._state + ' -> ' + event);
        return;
      }

      const prevState = this._state;

      // Store return point when entering SETTINGS
      if (nextState === 'SETTINGS' && prevState !== 'SETTINGS') {
        this._context.returnTo = prevState;
      }

      // When exiting SETTINGS, restore previous state on BACK
      if (prevState === 'SETTINGS' && event === 'BACK') {
        this._state = this._context.returnTo;
      } else {
        this._state = nextState;
      }

      // Update context
      Object.keys(payload).forEach(key => {
        this._context[key] = payload[key];
      });

      // Emit state change event
      if (typeof window !== 'undefined' && window.IPTV && window.IPTV.EventBus) {
        window.IPTV.EventBus.emit('state:changed', {
          from: prevState,
          to: this._state,
          event: event,
          context: Object.assign({}, this._context)
        });
      }
    },

    /**
     * Get current state
     * @returns {string} Current state
     */
    getState: function() {
      return this._state;
    },

    /**
     * Get current context
     * @returns {object} Current context
     */
    getContext: function() {
      return Object.assign({}, this._context);
    },

    /**
     * Reset to initial state (for testing)
     * @private
     */
    _reset: function() {
      this._state = 'LOADING_PLAYLIST';
      this._context = {
        channelId: null,
        categoryId: null,
        query: null,
        returnTo: 'CHANNEL_LIST'
      };
    }
  };

  // Export for Node and browser
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateMachine;
  }
  if (typeof window !== 'undefined') {
    window.IPTV = window.IPTV || {};
    window.IPTV.StateMachine = StateMachine;
  }
})();
