/**
 * Video player component
 * Handles native HTML5 + hls.js fallback
 */

(function() {
  'use strict';

  const Player = {
    _container: null,
    _video: null,
    _hls: null,
    _hasHLSSupport: null,
    _loadTimeout: null,
    _currentChannelId: null,
    _controller: null,
    _hideControlsTimeout: null,
    _controlsVisible: true,
    LOAD_TIMEOUT: 15000,
    HIDE_CONTROLS_DELAY: 5000,

    /**
     * Mount player in container
     */
    mount: function(container, context) {
      context = context || {};
      this._container = container;
      this._currentChannelId = context.channelId;

      // Build HTML
      this._container.innerHTML = `
        <div class="player-wrapper">
          <video id="player-video" class="player-video" playsinline preload="auto" crossorigin="anonymous"></video>
          <div class="player-overlay" style="display: none;">
            <div class="player-spinner"></div>
            <div class="player-error" style="display: none;">
              <p class="error-text"></p>
              <button class="btn-retry-player">Tentar novamente</button>
            </div>
          </div>
          <div class="player-controls">
            <button class="control-btn control-back" data-action="back">← Voltar</button>
            <button class="control-btn control-favorite" data-action="favorite">⭐ Favorito</button>
            <button class="control-btn control-prev" data-action="prev">◄ Anterior</button>
            <button class="control-btn control-next" data-action="next">Próximo ►</button>
          </div>
        </div>
      `;

      this._video = document.getElementById('player-video');
      this._setupVideoListeners();
      this._setupControlButtons();
      this._setupNavigation();

      // Auto-detect HLS support once
      if (this._hasHLSSupport === null) {
        this._detectHLSSupport();
      }

      if (context.channelId) {
        this.playChannel(context.channelId);
      }
    },

    /**
     * Unmount player
     */
    unmount: function() {
      this._clearLoadTimeout();
      this._clearHideControlsTimeout();
      if (this._hls) {
        this._hls.destroy();
        this._hls = null;
      }
      if (this._video) {
        this._video.pause();
        this._video.src = '';
      }
      if (this._controller) {
        this._controller.destroy();
        this._controller = null;
      }
      this._container.innerHTML = '';
      this._container = null;
      this._video = null;
    },

    /**
     * Play a channel
     */
    playChannel: function(channelId) {
      this._currentChannelId = channelId;

      const channelService = window.IPTV && window.IPTV.ChannelService;
      if (!channelService) return;

      const channel = channelService.getChannelById(channelId);
      if (!channel) return;

      this._clearLoadTimeout();
      this._clearHideControlsTimeout();
      this._hideControls();
      this._hideError();
      this._showSpinner();

      const url = channel.url;
      const isHLS = /\.m3u8(\?|$)/i.test(url);

      // Pause and reset video
      this._video.pause();
      this._video.currentTime = 0;

      if (isHLS && !this._hasHLSSupport) {
        // Use hls.js for HLS when no native support
        this._loadWithHLS(url);
      } else if (isHLS && this._hasHLSSupport) {
        // Use native HLS support
        this._video.src = url;
        this._video.play().catch(err => {
          console.warn('[Player] Autoplay failed:', err);
          this._video.play();
        });
      } else {
        // Direct stream (MP4, etc)
        this._video.src = url;
        this._video.play().catch(err => {
          console.warn('[Player] Autoplay failed:', err);
          this._video.play();
        });
      }

      this._setLoadTimeout();

      // Save last channel
      const storage = window.IPTV && window.IPTV.StorageService;
      if (storage) {
        storage.set(storage.KEYS.LAST_CHANNEL, { channelId: channelId });
      }
    },

    /**
     * Next/prev channel in current context
     */
    next: function() {
      // Would be wired to prev/next in current filtered list
      console.log('[Player] next() - to be wired');
    },

    prev: function() {
      console.log('[Player] prev() - to be wired');
    },

    /**
     * Toggle favorite
     */
    toggleFavorite: function() {
      const favService = window.IPTV && window.IPTV.FavoritesService;
      if (favService && this._currentChannelId) {
        favService.toggle(this._currentChannelId);
        this._updateControlsState();
      }
    },

    /**
     * Toggle controls visibility
     */
    toggleControls: function() {
      if (this._controlsVisible) {
        this._hideControls();
      } else {
        this._showControls();
      }
    },

    _detectHLSSupport: function() {
      this._hasHLSSupport = this._video.canPlayType('application/vnd.apple.mpegurl') === 'probably' ||
                             this._video.canPlayType('application/vnd.apple.mpegurl') === 'maybe';
      console.log('[Player] HLS native support:', this._hasHLSSupport ? 'yes' : 'no');
    },

    _loadWithHLS: function(url) {
      // Load hls.js dynamically if not already loaded
      if (!window.Hls) {
        const script = document.createElement('script');
        script.src = 'js/vendor/hls.min.js';
        script.onload = () => {
          this._initHLS(url);
        };
        script.onerror = () => {
          this._showError('Falha ao carregar player HLS');
        };
        document.head.appendChild(script);
      } else {
        this._initHLS(url);
      }
    },

    _initHLS: function(url) {
      if (this._hls) {
        this._hls.destroy();
      }

      const Hls = window.Hls;
      if (!Hls) return;

      // Configure hls.js for better compatibility
      const hlsConfig = {
        debug: false,
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 60,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        startLevel: undefined,
        autoStartLoad: true
      };

      this._hls = new Hls(hlsConfig);
      this._hls.loadSource(url);
      this._hls.attachMedia(this._video);

      // Log manifest details for debugging
      this._hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('[Player] HLS manifest parsed, starting playback');
        this._video.play().catch(err => {
          console.warn('[Player] Autoplay failed after manifest:', err);
        });
      });

      this._hls.on(Hls.Events.ERROR, (event, data) => {
        console.warn('[Player] HLS error:', data.type, data.details, data.fatal);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              this._showError('Erro de rede');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this._showError('Erro de vídeo');
              break;
            default:
              this._showError('Falha ao reproduzir');
          }
        }
      });

      // Fallback autoplay if manifest parse doesn't happen
      setTimeout(() => {
        if (this._video.paused && this._video.readyState >= 2) {
          this._video.play().catch(err => {
            console.warn('[Player] Delayed autoplay failed:', err);
          });
        }
      }, 2000);
    },

    _setupVideoListeners: function() {
      this._video.addEventListener('canplay', () => {
        this._clearLoadTimeout();
        this._hideSpinner();
      });
      this._video.addEventListener('error', (e) => {
        const error = this._video.error;
        let msg = 'Erro desconhecido';
        if (error) {
          if (error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED) msg = 'Formato não suportado';
          else if (error.code === error.MEDIA_ERR_NETWORK) msg = 'Erro de rede';
          else if (error.code === error.MEDIA_ERR_ABORTED) msg = 'Reprodução abortada';
        }
        this._showError(msg);
      });
    },

    _setupControlButtons: function() {
      const buttons = this._container.querySelectorAll('.control-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const action = btn.getAttribute('data-action');
          switch (action) {
            case 'back':
              this._onBack();
              break;
            case 'favorite':
              this.toggleFavorite();
              break;
            case 'next':
              this.next();
              break;
            case 'prev':
              this.prev();
              break;
          }
        });
      });
    },

    _setupNavigation: function() {
      this._controller = window.IPTV && window.IPTV.Navigation && window.IPTV.Navigation.create();
      if (!this._controller) return;

      const controls = this._container.querySelectorAll('.control-btn');
      this._controller.registerZone('controls', {
        type: 'list',
        itemCount: controls.length,
        getElement: (idx) => controls[idx],
        onSelect: (idx) => {
          controls[idx].click();
        }
      });

      this._controller.onBack(() => this._onBack());
      this._controller.attach();

      // Show controls on any key, hide after delay
      this._video.addEventListener('keydown', () => {
        this._showControls();
        this._resetHideControlsTimeout();
      }, true);
    },

    _showSpinner: function() {
      const overlay = this._container.querySelector('.player-overlay');
      const spinner = this._container.querySelector('.player-spinner');
      const errorEl = this._container.querySelector('.player-error');
      if (overlay) overlay.style.display = 'flex';
      if (spinner) spinner.style.display = 'block';
      if (errorEl) errorEl.style.display = 'none';
    },

    _hideSpinner: function() {
      const overlay = this._container.querySelector('.player-overlay');
      const spinner = this._container.querySelector('.player-spinner');
      if (spinner) spinner.style.display = 'none';
      if (overlay) overlay.style.display = 'none';
    },

    _hideError: function() {
      const errorEl = this._container.querySelector('.player-error');
      const overlay = this._container.querySelector('.player-overlay');
      if (errorEl) errorEl.style.display = 'none';
      if (overlay) overlay.style.display = 'none';
    },

    _showError: function(msg) {
      this._clearLoadTimeout();
      const overlay = this._container.querySelector('.player-overlay');
      const spinner = this._container.querySelector('.player-spinner');
      const errorEl = this._container.querySelector('.player-error');
      const errorText = this._container.querySelector('.error-text');
      const retryBtn = this._container.querySelector('.btn-retry-player');

      if (overlay) overlay.style.display = 'flex';
      if (spinner) spinner.style.display = 'none';
      if (errorEl) errorEl.style.display = 'block';
      if (errorText) errorText.textContent = msg;

      if (retryBtn) {
        retryBtn.onclick = () => this.playChannel(this._currentChannelId);
      }

      this._showControls();
    },

    _showControls: function() {
      const controls = this._container.querySelector('.player-controls');
      if (controls) controls.style.display = 'flex';
      this._controlsVisible = true;
    },

    _hideControls: function() {
      const controls = this._container.querySelector('.player-controls');
      if (controls) controls.style.display = 'none';
      this._controlsVisible = false;
    },

    _resetHideControlsTimeout: function() {
      this._clearHideControlsTimeout();
      this._hideControlsTimeout = setTimeout(() => {
        this._hideControls();
      }, this.HIDE_CONTROLS_DELAY);
    },

    _clearHideControlsTimeout: function() {
      if (this._hideControlsTimeout) {
        clearTimeout(this._hideControlsTimeout);
        this._hideControlsTimeout = null;
      }
    },

    _setLoadTimeout: function() {
      this._loadTimeout = setTimeout(() => {
        this._showError('Tempo de carregamento excedido');
      }, this.LOAD_TIMEOUT);
    },

    _clearLoadTimeout: function() {
      if (this._loadTimeout) {
        clearTimeout(this._loadTimeout);
        this._loadTimeout = null;
      }
    },

    _updateControlsState: function() {
      // Update favorite button visual state
    },

    _onBack: function() {
      const stateMachine = window.IPTV && window.IPTV.StateMachine;
      if (stateMachine) {
        stateMachine.dispatch('BACK');
      }
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
  }
  if (typeof window !== 'undefined') {
    window.IPTV = window.IPTV || {};
    window.IPTV.Player = Player;
  }
})();
