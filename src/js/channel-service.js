/**
 * Channel management and searching service
 * Maintains indices for fast lookups
 */

(function() {
  'use strict';

  const ChannelService = {
    _channels: [],
    _byId: {}, // Map: id -> channel
    _categories: {}, // Map: categoryId -> count
    _byCategory: {}, // Map: categoryId -> channel[]
    _brazilCategoryName: '🇧🇷 Brasil',

    /**
     * Check if a channel is from Brazil
     * @private
     */
    _isBrazilianChannel: function(channel) {
      const groupTitle = (channel.groupTitle || '').toLowerCase();
      return groupTitle.includes('brasil') || groupTitle.includes('brazil');
    },

    /**
     * Set all channels and rebuild indices
     * @param {array} channels - Channel array
     */
    setChannels: function(channels) {
      this._channels = channels || [];
      this._byId = {};
      this._categories = {};
      this._byCategory = {};

      // Build indices and reorganize Brazilian channels
      this._channels.forEach(channel => {
        this._byId[channel.id] = channel;

        // Check if this is a Brazilian channel and reorganize it
        if (this._isBrazilianChannel(channel)) {
          channel.originalGroupTitle = channel.groupTitle;
          channel.groupTitle = this._brazilCategoryName;
        }

        const cat = channel.groupTitle || 'Sem categoria';
        if (!this._byCategory[cat]) {
          this._byCategory[cat] = [];
        }
        this._byCategory[cat].push(channel);
        this._categories[cat] = (this._categories[cat] || 0) + 1;
      });
    },

    /**
     * Get all categories
     * @returns {array} [{id, name, count}]
     */
    getCategories: function() {
      const all = [{
        id: '__ALL__',
        name: 'Todos',
        count: this._channels.length
      }];

      // Separate Brazil category from others
      const brazilCat = {
        id: this._brazilCategoryName,
        name: this._brazilCategoryName,
        count: this._categories[this._brazilCategoryName] || 0
      };

      // Add other categories sorted by count desc, then alphabetically
      const cats = Object.keys(this._categories)
        .filter(name => name !== this._brazilCategoryName)
        .sort((a, b) => {
          const diff = this._categories[b] - this._categories[a];
          return diff !== 0 ? diff : a.localeCompare(b);
        })
        .map(name => ({
          id: name,
          name: name,
          count: this._categories[name]
        }));

      // Add Brazil category first if it has channels
      if (brazilCat.count > 0) {
        return all.concat([brazilCat]).concat(cats);
      }
      return all.concat(cats);
    },

    /**
     * Get channels by category
     * @param {string} categoryId
     * @returns {array} Channels
     */
    getChannelsByCategory: function(categoryId) {
      if (categoryId === '__ALL__') {
        return this._channels.slice();
      }
      return this._byCategory[categoryId] || [];
    },

    /**
     * Search channels
     * @param {string} query
     * @param {object} options - {categoryId}
     * @returns {array} Matching channels
     */
    search: function(query, options) {
      options = options || {};
      const categoryId = options.categoryId;
      const q = (query || '').toLowerCase().trim();

      if (!q) {
        return this.getChannelsByCategory(categoryId || '__ALL__');
      }

      let pool = this._channels;
      if (categoryId && categoryId !== '__ALL__') {
        pool = this._byCategory[categoryId] || [];
      }

      return pool.filter(ch => {
        return ch.name.toLowerCase().includes(q) ||
               ch.tvgName.toLowerCase().includes(q) ||
               ch.groupTitle.toLowerCase().includes(q);
      });
    },

    /**
     * Get channel by ID
     * @param {string} id
     * @returns {object} Channel or null
     */
    getChannelById: function(id) {
      return this._byId[id] || null;
    },

    /**
     * Get all channels
     * @returns {array}
     */
    getAllChannels: function() {
      return this._channels.slice();
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChannelService;
  }
  if (typeof window !== 'undefined') {
    window.IPTV = window.IPTV || {};
    window.IPTV.ChannelService = ChannelService;
  }
})();
