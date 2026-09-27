/**
 * M3U/M3U8 Parser for IPTV playlists
 * Robust parsing tolerant to malformed entries
 */

(function() {
  'use strict';

  const M3UParser = {
    /**
     * Parse M3U playlist text into structured channel data
     * @param {string} text - Raw M3U playlist content
     * @returns {object} {channels, stats, errors}
     */
    parseM3U: function(text) {
      if (!text || typeof text !== 'string') {
        return { channels: [], stats: { totalLines: 0, validChannels: 0, invalidCount: 0, duplicateCount: 0 }, errors: [] };
      }

      const lines = text.split(/\r?\n/);
      const channels = [];
      const errors = [];
      const seenIds = new Set();
      const seenUrls = new Set();
      let pendingExtinf = null;
      let hasM3UHeader = false;
      const MAX_ERRORS = 200;

      // Process each line
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed === '#EXTM3U' || trimmed.startsWith('#EXTM3U ')) {
          hasM3UHeader = true;
          return;
        }

        if (trimmed.startsWith('#EXTINF:')) {
          // New EXTINF entry
          if (pendingExtinf && !pendingExtinf.url) {
            // Previous EXTINF had no URL - discard
            if (errors.length < MAX_ERRORS) {
              errors.push({
                lineNumber: idx,
                rawLine: line,
                reason: 'EXTINF entry without URL'
              });
            }
          }
          pendingExtinf = this._parseExtinf(trimmed);
          return;
        }

        if (trimmed.startsWith('#')) {
          // Other metadata line, ignore
          return;
        }

        // Regular line - should be URL
        if (pendingExtinf) {
          const channel = this._createChannel(pendingExtinf, trimmed);
          if (channel) {
            // Check duplicates
            const isDupId = seenIds.has(channel.id);
            const normalizedUrl = channel.url.toLowerCase().trim();
            const isDupUrl = seenUrls.has(normalizedUrl);

            if (isDupId || isDupUrl) {
              // Record duplicate but don't add
              if (errors.length < MAX_ERRORS) {
                errors.push({
                  lineNumber: idx,
                  rawLine: line,
                  reason: 'Duplicate entry'
                });
              }
              return;
            }

            seenIds.add(channel.id);
            seenUrls.add(normalizedUrl);
            channels.push(channel);
          } else {
            if (errors.length < MAX_ERRORS) {
              errors.push({
                lineNumber: idx,
                rawLine: line,
                reason: 'Invalid channel data'
              });
            }
          }
          pendingExtinf = null;
          return;
        }

        // Line without EXTINF - orphaned URL
        if (errors.length < MAX_ERRORS) {
          errors.push({
            lineNumber: idx,
            rawLine: line,
            reason: 'URL without EXTINF metadata'
          });
        }
      });

      // Discard final EXTINF if no URL
      if (pendingExtinf && !pendingExtinf.url) {
        if (errors.length < MAX_ERRORS) {
          errors.push({
            lineNumber: lines.length,
            rawLine: '',
            reason: 'Final EXTINF entry without URL'
          });
        }
      }

      const stats = {
        totalLines: lines.length,
        validChannels: channels.length,
        invalidCount: errors.length,
        duplicateCount: errors.filter(e => e.reason === 'Duplicate entry').length
      };

      return { channels, stats, errors };
    },

    /**
     * Parse #EXTINF line and extract metadata
     * @private
     */
    _parseExtinf: function(line) {
      const result = {
        duration: -1,
        tvgId: '',
        tvgName: '',
        tvgLogo: '',
        groupTitle: '',
        displayName: ''
      };

      // Extract duration: #EXTINF:-1 or #EXTINF:0.5
      const durationMatch = line.match(/^#EXTINF:([-\d.]+)/);
      if (durationMatch) {
        result.duration = parseInt(durationMatch[1], 10);
      }

      // Find the split point: first comma outside of quotes
      let commaPos = -1;
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
          commaPos = i;
          break;
        }
      }

      if (commaPos > 0) {
        // Extract attributes (before comma)
        const attrsStr = line.substring(0, commaPos);
        const displayName = line.substring(commaPos + 1).trim();
        result.displayName = displayName || 'Sem nome';

        // Parse attributes: key="value"
        const attrRegex = /([\w-]+)="([^"]*)"/g;
        let match;
        while ((match = attrRegex.exec(attrsStr)) !== null) {
          const key = match[1].toLowerCase();
          const value = match[2];
          switch (key) {
            case 'tvg-id':
              result.tvgId = value;
              break;
            case 'tvg-name':
              result.tvgName = value;
              break;
            case 'tvg-logo':
              result.tvgLogo = value;
              break;
            case 'group-title':
              result.groupTitle = value;
              break;
          }
        }
      }

      return result;
    },

    /**
     * Create a Channel object, validating URL
     * @private
     */
    _createChannel: function(extinf, urlStr) {
      const url = urlStr.trim();

      // Validate URL: must start with http:// or https://
      if (!url || !/^https?:\/\//i.test(url)) {
        return null;
      }

      // Generate stable ID
      let id = extinf.tvgId || '';
      if (!id) {
        id = 'gen:' + this._djb2Hash(url.toLowerCase());
      }

      return {
        id: id,
        name: extinf.displayName || 'Sem nome',
        tvgId: extinf.tvgId,
        tvgName: extinf.tvgName,
        tvgLogo: extinf.tvgLogo,
        groupTitle: extinf.groupTitle || 'Sem categoria',
        url: url
      };
    },

    /**
     * Simple stable hash function (djb2)
     * @private
     */
    _djb2Hash: function(str) {
      let hash = 5381;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & 0xFFFFFFFF;
      }
      return Math.abs(hash).toString(16);
    }
  };

  // Export for Node and browser
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = M3UParser;
  }
  if (typeof window !== 'undefined') {
    window.IPTV = window.IPTV || {};
    window.IPTV.M3UParser = M3UParser;
  }
})();
