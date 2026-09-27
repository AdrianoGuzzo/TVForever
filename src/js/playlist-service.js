/**
 * Playlist loading and caching service
 * Memoizes in-flight requests to prevent concurrent downloads
 */

(function() {
  'use strict';

  const PlaylistService = {
    _cache: null,
    _fetching: null,
    _defaultUrl: 'https://iptv-org.github.io/iptv/index.m3u',

    /**
     * Load playlist from network or cache
     * @param {object} options - {forceRefresh, url}
     * @returns {Promise}
     */
    loadPlaylist: function(options) {
      options = options || {};
      const url = options.url || this._defaultUrl;
      const forceRefresh = options.forceRefresh || false;

      // Return cached result if available and not forcing refresh
      if (!forceRefresh && this._cache && this._cache.url === url) {
        // Return cache immediately, refresh in background
        const result = Object.assign({}, this._cache);
        this._refreshInBackground(url);
        return Promise.resolve(result);
      }

      // If already fetching same URL, return existing promise
      if (this._fetching && this._fetching.url === url) {
        return this._fetching.promise;
      }

      // Start new fetch
      const promise = this._fetch(url);
      this._fetching = { url: url, promise: promise };

      return promise.then(result => {
        this._fetching = null;
        this._cache = result;
        return result;
      }).catch(err => {
        this._fetching = null;
        throw err;
      });
    },

    /**
     * Get configured playlist URL
     * @returns {string}
     */
    getPlaylistUrl: function() {
      return this._defaultUrl;
    },

    /**
     * Set playlist URL
     * @param {string} url
     */
    setPlaylistUrl: function(url) {
      if (url && typeof url === 'string' && /^https?:\/\//i.test(url)) {
        this._defaultUrl = url;
      }
    },

    /**
     * Fetch playlist from network
     * @private
     */
    _fetch: function(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.timeout = 30000; // 30 second timeout

        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            const parser = window.IPTV && window.IPTV.M3UParser;
            if (!parser) {
              reject(new Error('M3UParser not available'));
              return;
            }

            const parseResult = parser.parseM3U(xhr.responseText);
            resolve({
              channels: parseResult.channels,
              stats: parseResult.stats,
              source: 'network',
              fetchedAt: new Date().toISOString(),
              url: url
            });
          } else {
            reject(new Error('HTTP ' + xhr.status + ': ' + xhr.statusText));
          }
        };

        xhr.onerror = function() {
          reject(new Error('Network error'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timeout'));
        };

        xhr.open('GET', url, true);
        xhr.send();
      });
    },

    /**
     * Refresh playlist in background without blocking caller
     * @private
     */
    _refreshInBackground: function(url) {
      if (this._fetching && this._fetching.url === url) {
        return; // Already fetching
      }

      this._fetch(url).then(result => {
        this._cache = result;
        if (typeof window !== 'undefined' && window.IPTV && window.IPTV.EventBus) {
          window.IPTV.EventBus.emit('playlist:updated', { channels: result.channels, stats: result.stats });
        }
      }).catch(err => {
        console.warn('[PlaylistService] Background refresh failed:', err);
      });
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlaylistService;
  }
  if (typeof window !== 'undefined') {
    window.IPTV = window.IPTV || {};
    window.IPTV.PlaylistService = PlaylistService;
  }
})();
