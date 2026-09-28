/**
 * Bootstrap and main app orchestration
 * Home screen: sidebar (categories) + grid (channels)
 */

(function() {
  'use strict';

  const App = {
    _currentScreen: null,
    _controller: null,
    _searchTimeout: null,
    _currentCategoryId: '__ALL__',
    _searchQuery: '',

    init: function() {
      const appEl = document.getElementById('app');
      if (!appEl) {
        console.error('[App] #app container not found');
        return;
      }

      // Initialize services
      this._initServices();

      // Setup state machine listener
      const eventBus = window.IPTV && window.IPTV.EventBus;
      if (eventBus) {
        eventBus.on('state:changed', (change) => {
          this._onStateChanged(change);
        });
      }

      // Start: load playlist
      const stateMachine = window.IPTV && window.IPTV.StateMachine;
      if (stateMachine) {
        stateMachine.dispatch('SUCCESS');
        stateMachine.dispatch('AUTO');
      }

      this._loadAndRenderPlaylist(appEl);
    },

    _initServices: function() {
      // Initialize storage
      const storageService = window.IPTV && window.IPTV.StorageService;
      if (storageService) {
        storageService.init();
      }
    },

    _loadAndRenderPlaylist: function(appEl) {
      this._renderLoading(appEl);

      const playlistService = window.IPTV && window.IPTV.PlaylistService;
      if (!playlistService) {
        this._renderError(appEl, 'PlaylistService not available');
        return;
      }

      playlistService.loadPlaylist()
        .then(result => {
          const channelService = window.IPTV && window.IPTV.ChannelService;
          if (channelService) {
            channelService.setChannels(result.channels);
          }

          console.log('[App] Loaded ' + result.channels.length + ' channels, ' + result.stats.invalidCount + ' errors');
          this._renderHome(appEl);
        })
        .catch(err => {
          console.error('[App] Failed to load playlist:', err);
          this._renderError(appEl, 'Falha ao carregar playlist: ' + err.message);
        });
    },

    _renderLoading: function(appEl) {
      appEl.innerHTML = `
        <div class="screen-loading">
          <div class="loading-spinner"></div>
          <p>Carregando playlist...</p>
        </div>
      `;
    },

    _renderError: function(appEl, msg) {
      appEl.innerHTML = `
        <div class="screen-error">
          <h2>Erro</h2>
          <p>${msg}</p>
          <button class="btn-primary btn-retry">Tentar Novamente</button>
          <button class="btn-secondary btn-settings">Configurações</button>
        </div>
      `;

      appEl.querySelector('.btn-retry')?.addEventListener('click', () => {
        this._loadAndRenderPlaylist(appEl);
      });

      appEl.querySelector('.btn-settings')?.addEventListener('click', () => {
        const stateMachine = window.IPTV && window.IPTV.StateMachine;
        if (stateMachine) {
          stateMachine.dispatch('OPEN_SETTINGS');
        }
      });
    },

    _renderHome: function(appEl) {
      appEl.innerHTML = `
        <div class="screen-home">
          <header class="app-header">
            <h1>Adriano IPTV</h1>
            <button class="btn-settings-header">⚙️ Configurações</button>
          </header>
          <div class="home-container">
            <aside class="sidebar-categories">
              <h3>Categorias</h3>
              <ul class="category-list"></ul>
            </aside>
            <main class="channels-grid">
              <div class="search-container">
                <input type="text" class="search-input" placeholder="Pesquisar..." />
              </div>
              <div class="channels-list"></div>
            </main>
          </div>
        </div>
      `;

      // Setup event listeners
      appEl.querySelector('.btn-settings-header')?.addEventListener('click', () => {
        const stateMachine = window.IPTV && window.IPTV.StateMachine;
        if (stateMachine) {
          stateMachine.dispatch('OPEN_SETTINGS');
        }
      });

      // Setup search
      const searchInput = appEl.querySelector('.search-input');
      searchInput?.addEventListener('keyup', (e) => {
        clearTimeout(this._searchTimeout);
        this._searchTimeout = setTimeout(() => {
          this._searchQuery = e.target.value.trim();
          this._renderChannels(appEl);
        }, 300);
      });

      // Render categories
      this._renderCategories(appEl);
      // Render channels
      this._renderChannels(appEl);
      // Setup navigation
      this._setupHomeNavigation(appEl);
    },

    _renderCategories: function(appEl) {
      const channelService = window.IPTV && window.IPTV.ChannelService;
      if (!channelService) return;

      const list = appEl.querySelector('.category-list');
      const categories = channelService.getCategories();

      list.innerHTML = categories.map((cat, idx) => {
        const isActive = cat.id === this._currentCategoryId ? ' active' : '';
        return `
          <li class="category-item${isActive}" data-id="${cat.id}" data-idx="${idx}">
            <span class="category-name">${cat.name}</span>
            <span class="category-count">${cat.count}</span>
          </li>
        `;
      }).join('');

      list.querySelectorAll('.category-item').forEach(el => {
        el.addEventListener('click', () => {
          this._currentCategoryId = el.getAttribute('data-id');
          this._searchQuery = '';
          appEl.querySelector('.search-input').value = '';
          // Update active state
          list.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
          el.classList.add('active');
          this._renderChannels(appEl);
        });
      });
    },

    _renderChannels: function(appEl) {
      const channelService = window.IPTV && window.IPTV.ChannelService;
      if (!channelService) return;

      let channels;
      if (this._searchQuery) {
        channels = channelService.search(this._searchQuery, { categoryId: this._currentCategoryId });
      } else {
        channels = channelService.getChannelsByCategory(this._currentCategoryId);
      }

      const list = appEl.querySelector('.channels-list');
      const favService = window.IPTV && window.IPTV.FavoritesService;

      // Pagination: show 100 at a time (Fase 1 como no plano)
      const PAGE_SIZE = 100;
      const page = 0;
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const visible = channels.slice(start, end);

      list.innerHTML = visible.map((ch, idx) => {
        const isFav = favService && favService.isFavorite(ch.id);
        return `
          <div class="channel-tile" data-id="${ch.id}" data-idx="${start + idx}" title="${ch.name}">
            ${ch.tvgLogo ? `<img src="${ch.tvgLogo}" alt="${ch.name}" class="channel-logo" onerror="this.style.display='none'" />` : '<div class="channel-logo-placeholder">📺</div>'}
            <div class="channel-info">
              <span class="channel-name">${ch.name}</span>
              <span class="channel-group">${ch.groupTitle}</span>
              ${isFav ? '<span class="channel-favorite">⭐</span>' : ''}
            </div>
          </div>
        `;
      }).join('');

      if (visible.length === 0) {
        list.innerHTML = '<div class="no-results">Nenhum canal encontrado</div>';
      }

      // Setup click handlers
      list.querySelectorAll('.channel-tile').forEach(el => {
        el.addEventListener('click', () => {
          const channelId = el.getAttribute('data-id');
          const stateMachine = window.IPTV && window.IPTV.StateMachine;
          if (stateMachine) {
            stateMachine.dispatch('SELECT_CHANNEL', { channelId: channelId, categoryId: this._currentCategoryId, query: this._searchQuery });
          }
        });
      });

      // Update navigation after rendering new channels
      this._setupHomeNavigation(appEl);
    },

    _setupHomeNavigation: function(appEl) {
      if (this._controller) {
        this._controller.destroy();
      }

      this._controller = window.IPTV && window.IPTV.Navigation && window.IPTV.Navigation.create();
      if (!this._controller) return;

      const categories = appEl.querySelectorAll('.category-item');
      const channels = appEl.querySelectorAll('.channel-tile');

      this._controller.registerZone('categories', {
        type: 'list',
        itemCount: categories.length,
        getElement: (idx) => categories[idx],
        onSelect: (idx) => categories[idx].click(),
        neighbors: { right: 'channels' }
      });

      this._controller.registerZone('channels', {
        type: 'grid',
        columns: 1,
        itemCount: channels.length,
        getElement: (idx) => channels[idx],
        onSelect: (idx) => channels[idx].click(),
        neighbors: { left: 'categories' }
      });

      this._controller.setActiveZone('categories', 0);
      this._controller.onBack(() => {
        console.log('[App] Back pressed from home');
      });
      this._controller.attach();
    },

    _onStateChanged: function(change) {
      const appEl = document.getElementById('app');
      if (!appEl) return;

      const state = change.to;

      if (this._currentScreen === state) return; // No re-render
      this._currentScreen = state;

      // Unmount current screen
      if (this._controller) {
        this._controller.destroy();
        this._controller = null;
      }

      switch (state) {
        case 'CHANNEL_LIST':
          this._renderHome(appEl);
          break;

        case 'PLAYING':
          appEl.innerHTML = '<div class="screen-player"></div>';
          const playerContainer = appEl.querySelector('.screen-player');
          const player = window.IPTV && window.IPTV.Player;
          if (player) {
            player.mount(playerContainer, change.context);
          }
          break;

        case 'SETTINGS':
          appEl.innerHTML = '<div class="screen-settings"></div>';
          const settingsContainer = appEl.querySelector('.screen-settings');
          const settings = window.IPTV && window.IPTV.Settings;
          if (settings) {
            settings.mount(settingsContainer);
          }
          break;

        case 'PLAYLIST_ERROR':
          this._renderError(appEl, 'Falha ao carregar playlist');
          break;

        default:
          console.log('[App] State changed to:', state);
      }
    }
  };

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  // Export for testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
  }
  if (typeof window !== 'undefined') {
    window.IPTV = window.IPTV || {};
    window.IPTV.App = App;
  }
})();
