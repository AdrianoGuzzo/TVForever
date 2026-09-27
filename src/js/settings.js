/**
 * Settings screen and configuration management
 */

(function() {
  'use strict';

  const Settings = {
    _container: null,
    _controller: null,
    _config: {
      playlistUrl: 'https://iptv-org.github.io/iptv/index.m3u',
      resumeLastChannel: true
    },

    /**
     * Mount settings screen
     */
    mount: function(container) {
      this._container = container;
      this._loadConfig();

      this._container.innerHTML = `
        <div class="settings-screen">
          <h2>Configurações</h2>
          <div class="settings-form">
            <div class="settings-field">
              <label>URL da Playlist M3U:</label>
              <input type="text" class="settings-input settings-url" value="${this._config.playlistUrl}" />
            </div>
            <div class="settings-field">
              <label><input type="checkbox" class="settings-resume" ${this._config.resumeLastChannel ? 'checked' : ''} /> Retomar último canal</label>
            </div>
            <div class="settings-actions">
              <button class="btn-primary settings-save">Salvar</button>
              <button class="btn-secondary settings-cancel">Cancelar</button>
              <button class="btn-secondary settings-refresh">Atualizar Playlist</button>
            </div>
          </div>
        </div>
      `;

      this._setupEventListeners();
      this._setupNavigation();
    },

    /**
     * Unmount settings
     */
    unmount: function() {
      if (this._controller) {
        this._controller.destroy();
        this._controller = null;
      }
      this._container.innerHTML = '';
    },

    /**
     * Get current config
     */
    get: function() {
      return Object.assign({}, this._config);
    },

    /**
     * Save config
     */
    set: function(partial) {
      Object.assign(this._config, partial);
      this._saveConfig();
    },

    _loadConfig: function() {
      const storage = window.IPTV && window.IPTV.StorageService;
      if (storage) {
        const saved = storage.get(storage.KEYS.SETTINGS, {});
        Object.assign(this._config, saved);
      }
    },

    _saveConfig: function() {
      const storage = window.IPTV && window.IPTV.StorageService;
      if (storage) {
        storage.set(storage.KEYS.SETTINGS, this._config);
      }
    },

    _setupEventListeners: function() {
      const saveBtn = this._container.querySelector('.settings-save');
      const cancelBtn = this._container.querySelector('.settings-cancel');
      const refreshBtn = this._container.querySelector('.settings-refresh');

      saveBtn?.addEventListener('click', () => {
        const url = this._container.querySelector('.settings-url').value.trim();
        const resume = this._container.querySelector('.settings-resume').checked;

        if (url && /^https?:\/\//i.test(url)) {
          this.set({ playlistUrl: url, resumeLastChannel: resume });
          console.log('[Settings] Configurações salvas');
        } else {
          alert('URL inválida. Use http:// ou https://');
        }
      });

      cancelBtn?.addEventListener('click', () => {
        const stateMachine = window.IPTV && window.IPTV.StateMachine;
        if (stateMachine) {
          stateMachine.dispatch('BACK');
        }
      });

      refreshBtn?.addEventListener('click', () => {
        const playlistService = window.IPTV && window.IPTV.PlaylistService;
        if (playlistService) {
          playlistService.loadPlaylist({ forceRefresh: true, url: this._config.playlistUrl })
            .then(() => {
              alert('Playlist atualizada com sucesso');
            })
            .catch(err => {
              alert('Falha ao atualizar playlist: ' + err.message);
            });
        }
      });
    },

    _setupNavigation: function() {
      this._controller = window.IPTV && window.IPTV.Navigation && window.IPTV.Navigation.create();
      if (!this._controller) return;

      const inputs = this._container.querySelectorAll('input, button');
      this._controller.registerZone('inputs', {
        type: 'list',
        itemCount: inputs.length,
        getElement: (idx) => inputs[idx],
        onSelect: (idx) => {
          const el = inputs[idx];
          if (el.type === 'button') {
            el.click();
          } else if (el.type === 'checkbox') {
            el.checked = !el.checked;
          } else {
            el.focus();
          }
        }
      });

      this._controller.onBack(() => {
        const stateMachine = window.IPTV && window.IPTV.StateMachine;
        if (stateMachine) {
          stateMachine.dispatch('BACK');
        }
      });

      this._controller.attach();
    }
  };

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Settings;
  }
  if (typeof window !== 'undefined') {
    window.IPTV = window.IPTV || {};
    window.IPTV.Settings = Settings;
  }
})();
