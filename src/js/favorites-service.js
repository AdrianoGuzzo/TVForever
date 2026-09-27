/**
 * Favorites management service
 * Persists favorite channel IDs
 */

(function() {
  'use strict';

  const FavoritesService = {
    /**
     * Get all favorite IDs
     * @returns {array}
     */
    getAll: function() {
      const storage = window.IPTV && window.IPTV.StorageService;
      if (!storage) return [];
      return storage.get(storage.KEYS.FAVORITES, []);
    },

    /**
     * Check if channel is favorited
     * @param {string} id
     * @returns {boolean}
     */
    isFavorite: function(id) {
      return this.getAll().includes(id);
    },

    /**
     * Toggle favorite status
     * @param {string} id
     * @returns {boolean} New favorite state
     */
    toggle: function(id) {
      const storage = window.IPTV && window.IPTV.StorageService;
      if (!storage) return false;

      const favorites = storage.get(storage.KEYS.FAVORITES, []);
      const idx = favorites.indexOf(id);

      if (idx === -1) {
        favorites.push(id);
      } else {
        favorites.splice(idx, 1);
      }

      storage.set(storage.KEYS.FAVORITES, favorites);

      // Emit event
      const eventBus = window.IPTV && window.IPTV.EventBus;
      if (eventBus) {
        eventBus.emit('favorites:changed', { id: id, isFavorite: idx === -1 });
      }

      return idx === -1; // Return new state
    },

    /**
     * Add to favorites
     * @param {string} id
     */
    add: function(id) {
      if (!this.isFavorite(id)) {
        this.toggle(id);
      }
    },

    /**
     * Remove from favorites
     * @param {string} id
     */
    remove: function(id) {
      if (this.isFavorite(id)) {
        this.toggle(id);
      }
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FavoritesService;
  }
  if (typeof window !== 'undefined') {
    window.IPTV = window.IPTV || {};
    window.IPTV.FavoritesService = FavoritesService;
  }
})();
