/**
 * Navigation controller for TV remote control
 * Manages focus, zones, and keyboard input
 */

(function() {
  'use strict';

  const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    OK: 13,
    BACK: 461 // webOS convention (to be validated on real device)
  };

  function FocusController() {
    this.zones = {};
    this.activeZone = null;
    this.focusIndex = 0;
    this.onBackCallback = null;
    this._keydownHandler = null;
    this._focused = null;
  }

  FocusController.prototype.registerZone = function(zoneId, config) {
    this.zones[zoneId] = {
      id: zoneId,
      type: config.type || 'list', // 'list' or 'grid'
      columns: config.columns || 1,
      itemCount: config.itemCount || 0,
      getElement: config.getElement,
      onSelect: config.onSelect,
      neighbors: config.neighbors || {}
    };
  };

  FocusController.prototype.setActiveZone = function(zoneId, initialIndex) {
    this.activeZone = zoneId;
    this.focusIndex = initialIndex || 0;
    this._updateFocus();
  };

  FocusController.prototype.attach = function() {
    const self = this;
    this._keydownHandler = function(e) {
      self._handleKeydown(e);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this._keydownHandler, true);
    }
  };

  FocusController.prototype.destroy = function() {
    if (this._keydownHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this._keydownHandler, true);
    }
    this._keydownHandler = null;
    this.zones = {};
    this.activeZone = null;
    this._focused = null;
  };

  FocusController.prototype.onBack = function(fn) {
    this.onBackCallback = fn;
  };

  FocusController.prototype._handleKeydown = function(e) {
    const keyCode = e.keyCode;

    if (keyCode === KEYS.BACK) {
      e.preventDefault();
      if (this.onBackCallback) {
        this.onBackCallback();
      }
      return;
    }

    if (keyCode === KEYS.OK) {
      e.preventDefault();
      this._selectCurrent();
      return;
    }

    const zone = this.zones[this.activeZone];
    if (!zone) return;

    if (keyCode === KEYS.UP) {
      e.preventDefault();
      this._moveFocus(zone, 'UP');
    } else if (keyCode === KEYS.DOWN) {
      e.preventDefault();
      this._moveFocus(zone, 'DOWN');
    } else if (keyCode === KEYS.LEFT) {
      e.preventDefault();
      this._moveFocus(zone, 'LEFT');
    } else if (keyCode === KEYS.RIGHT) {
      e.preventDefault();
      this._moveFocus(zone, 'RIGHT');
    }
  };

  FocusController.prototype._moveFocus = function(zone, direction) {
    if (zone.type === 'list') {
      if (direction === 'UP') {
        if (this.focusIndex > 0) {
          this.focusIndex--;
        } else if (zone.neighbors.up) {
          this.setActiveZone(zone.neighbors.up, 0);
          return;
        }
      } else if (direction === 'DOWN') {
        if (this.focusIndex < zone.itemCount - 1) {
          this.focusIndex++;
        } else if (zone.neighbors.down) {
          this.setActiveZone(zone.neighbors.down, 0);
          return;
        }
      } else if (direction === 'LEFT' && zone.neighbors.left) {
        this.setActiveZone(zone.neighbors.left, this.focusIndex);
        return;
      } else if (direction === 'RIGHT' && zone.neighbors.right) {
        this.setActiveZone(zone.neighbors.right, this.focusIndex);
        return;
      }
    } else if (zone.type === 'grid') {
      const cols = zone.columns;
      const rows = Math.ceil(zone.itemCount / cols);
      const row = Math.floor(this.focusIndex / cols);
      const col = this.focusIndex % cols;

      let newIdx = this.focusIndex;

      if (direction === 'UP') {
        if (row > 0) {
          newIdx = (row - 1) * cols + col;
        } else if (zone.neighbors.up) {
          this.setActiveZone(zone.neighbors.up, 0);
          return;
        }
      } else if (direction === 'DOWN') {
        if (row < rows - 1) {
          newIdx = Math.min((row + 1) * cols + col, zone.itemCount - 1);
        } else if (zone.neighbors.down) {
          this.setActiveZone(zone.neighbors.down, 0);
          return;
        }
      } else if (direction === 'LEFT') {
        if (col > 0) {
          newIdx = row * cols + (col - 1);
        } else if (zone.neighbors.left) {
          this.setActiveZone(zone.neighbors.left, 0);
          return;
        }
      } else if (direction === 'RIGHT') {
        if (col < cols - 1 && row * cols + col + 1 < zone.itemCount) {
          newIdx = row * cols + (col + 1);
        } else if (zone.neighbors.right) {
          this.setActiveZone(zone.neighbors.right, 0);
          return;
        }
      }

      if (newIdx !== this.focusIndex) {
        this.focusIndex = newIdx;
      }
    }

    this._updateFocus();
  };

  FocusController.prototype._updateFocus = function() {
    const zone = this.zones[this.activeZone];
    if (!zone || !zone.getElement) return;

    // Remove focus from previous element
    if (this._focused) {
      this._focused.classList.remove('is-focused');
    }

    // Add focus to current element
    const el = zone.getElement(this.focusIndex);
    if (el) {
      el.classList.add('is-focused');
      el.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      this._focused = el;
    }
  };

  FocusController.prototype._selectCurrent = function() {
    const zone = this.zones[this.activeZone];
    if (zone && zone.onSelect) {
      zone.onSelect(this.focusIndex);
    }
  };

  const Navigation = {
    KEYS: KEYS,

    create: function() {
      return new FocusController();
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navigation;
  }
  if (typeof window !== 'undefined') {
    window.IPTV = window.IPTV || {};
    window.IPTV.Navigation = Navigation;
  }
})();
