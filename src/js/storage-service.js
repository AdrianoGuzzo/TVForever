/**
 * Storage service abstraction for localStorage with fallback
 * Allows injection of custom storage backend (useful for testing)
 */

(function() {
  'use strict';

  const StorageService = {
    // Injected or default storage backend
    _backend: null,

    // Standard key names (versioned for migration compatibility)
    KEYS: {
      FAVORITES: 'iptv:favorites:v1',
      PLAYLIST_CACHE: 'iptv:playlist:cache:v1',
      LAST_CHANNEL: 'iptv:lastChannel:v1',
      SETTINGS: 'iptv:settings:v1'
    },

    /**
     * Initialize storage with optional custom backend
     * @param {object} customBackend - Custom storage object (for testing)
     */
    init: function(customBackend) {
      if (customBackend) {
        this._backend = customBackend;
      } else {
        // Try native localStorage, fallback to in-memory
        try {
          localStorage.setItem('__test__', '1');
          localStorage.removeItem('__test__');
          this._backend = localStorage;
        } catch (err) {
          console.warn('[StorageService] localStorage unavailable, using in-memory fallback');
          this._backend = this._createMemoryBackend();
        }
      }
    },

    /**
     * Get a value from storage
     * @param {string} key - Storage key
     * @param {*} fallback - Default value if not found
     * @returns {*} Stored value or fallback
     */
    get: function(key, fallback) {
      if (!this._backend) this.init();

      try {
        const value = this._backend.getItem(key);
        if (value === null) return fallback;
        try {
          return JSON.parse(value);
        } catch (e) {
          // Value is not JSON, return as-is
          return value;
        }
      } catch (err) {
        console.error('[StorageService] Error reading key "' + key + '":', err);
        return fallback;
      }
    },

    /**
     * Set a value in storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store (automatically JSON-serialized)
     */
    set: function(key, value) {
      if (!this._backend) this.init();

      try {
        this._backend.setItem(key, JSON.stringify(value));
      } catch (err) {
        if (err.name === 'QuotaExceededError') {
          console.warn('[StorageService] Storage quota exceeded for key "' + key + '"');
        } else {
          console.error('[StorageService] Error writing key "' + key + '":', err);
        }
      }
    },

    /**
     * Remove a value from storage
     * @param {string} key - Storage key
     */
    remove: function(key) {
      if (!this._backend) this.init();

      try {
        this._backend.removeItem(key);
      } catch (err) {
        console.error('[StorageService] Error removing key "' + key + '":', err);
      }
    },

    /**
     * Clear all storage
     */
    clear: function() {
      if (!this._backend) this.init();

      try {
        this._backend.clear();
      } catch (err) {
        console.error('[StorageService] Error clearing storage:', err);
      }
    },

    /**
     * Create in-memory fallback storage
     * @private
     */
    _createMemoryBackend: function() {
      const data = {};
      return {
        getItem: function(key) {
          return data[key] || null;
        },
        setItem: function(key, value) {
          data[key] = value;
        },
        removeItem: function(key) {
          delete data[key];
        },
        clear: function() {
          for (const key in data) {
            delete data[key];
          }
        }
      };
    }
  };

  // Initialize on load if in browser
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => StorageService.init());
    } else {
      StorageService.init();
    }
  }

  // Export for Node and browser
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
  }
  if (typeof window !== 'undefined') {
    window.IPTV = window.IPTV || {};
    window.IPTV.StorageService = StorageService;
  }
})();
