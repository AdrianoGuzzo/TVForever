# TVForever — LG webOS TV App

Um aplicativo IPTV nativo para **LG Smart TVs com webOS**, desenvolvido em HTML5, CSS3 e JavaScript vanilla, que carrega e reproduz a playlist pública do [iptv-org](https://github.com/iptv-org/iptv).

![Linguagem](https://img.shields.io/badge/Linguagem-HTML5%2FCSS3%2FJS-blue)
![Versão](https://img.shields.io/badge/Versão-1.0.0-green)
![webOS](https://img.shields.io/badge/webOS-4.0+-orange)
![Licença](https://img.shields.io/badge/Licença-MIT-purple)

## 📺 Funcionalidades

- ✅ Carregamento da playlist M3U do iptv-org (ou URL customizável)
- ✅ Navegação por controle remoto (↑↓←→ OK BACK)
- ✅ Categorias dinâmicas geradas da playlist
- ✅ Busca de canais por nome/tvg-name/grupo
- ✅ Sistema de favoritos com persistência local
- ✅ Player de vídeo com suporte HLS (nativo + fallback hls.js)
- ✅ Configurações editáveis (URL playlist, retomar último canal)
- ✅ Interface otimizada para TV (10-foot UI)
- ✅ Tela de erro tratada elegantemente
- ✅ Cache local de playlist

## 🎯 Compatibilidade

- **webOS TV 4.0+** (alvo principal)
- **Chromium 53+** (baseado na matriz de webOS)
- **Resolução:** 1920x1080, 3840x2160

⚠️ **Nota:** webOS 3.5 (Chromium 38) é best-effort não garantido. Suporte futuro requer restrições adicionais de JS (sem template literals, arrow functions, etc.).

## 📋 Requisitos

### PC (Windows 10+, macOS, Linux)

- **Node.js** 18+  
  *Nota: webOS CLI recomenda 14.15.1–16.20.2, mas testes da app funcionam em Node 24+. Use nvm se precisar de múltiplas versões.*
- **npm** 8+
- **webOS CLI** (@webos-tools/cli ~3.2.x)
  ```bash
  npm install -g @webos-tools/cli
  ```
- **VS Code** (recomendado, com WebOS Studio extension)

### LG TV

- **Conta LG Developer** (necessária para Developer Mode)
- **Developer Mode** ativado na TV
- **Conexão de rede** entre PC e TV

## 🚀 Início Rápido

### 0. Criar Conta no LG Developer Portal (uma única vez)

⚠️ **Importante:** Você precisa de uma conta **específica** no LG Developer Portal, não a conta LG genérica do Store.

1. Acesse: https://webostv.developer.lge.com/develop/getting-started/
2. Clique em **"Sign Up"** ou **"Register"**
3. Crie uma conta com email + senha
4. **Anote** o email e senha — vai usar no Developer Mode app da TV

### 1. Configurar Developer Mode na TV

1. Abra **LG Content Store** (LG Apps)
2. Procure por **"Developer Mode"** e instale
3. Abra o app **Developer Mode**
4. **Faça login com a conta do LG Developer Portal** (não a conta LG genérica)
   - Email: (a que você criou no passo 0)
   - Senha: (a que você criou no passo 0)
5. Clique em **"Dev Mode Status"** para ativar
6. A TV vai reiniciar
7. Note o **IP da TV** (visível no app, ou em Settings > Network > Connection Status)

### 2. Instalar webOS CLI no PC

```bash
npm install -g @webos-tools/cli
ares -V  # Verifica instalação
```

### 3. Parear a TV ao PC (uma única vez)

```bash
ares-setup-device --add MyTV -i "host=192.168.x.x" -i "port=9922" -i "username=prisoner"
```

Na TV:
- Abra Developer Mode app
- Clique em **Key Server**
- Copie a passphrase exibida (ex: "A1B2C3")

No PC:
```bash
ares-novacom --device MyTV --getkey
# Paste passphrase when prompted
```

### 4. Fazer Build & Deploy

```bash
# Ambiente de desenvolvimento
git clone https://github.com/seu-usuario/tvforever.git
cd tvforever
npm install

# Build + teste
npm run build

# Package + install + launch
npm run dev -- -Device MyTV -Inspect
```

Alternativa passo a passo:
```bash
npm run build      # Valida e copia src → dist
npm run package    # Cria .ipk
npm run deploy -- -Device MyTV    # Instala na TV
npm run launch -- -Device MyTV    # Inicia o app
```

A TV deve mostrar a app "TVForever" no launcher. Abra e navegue com o controle remoto.

---

## 🎮 Controle Remoto

| Tecla | Ação |
|-------|------|
| **↑** | Subir no menu / categoria anterior |
| **↓** | Descer no menu / próxima categoria |
| **←** | Esquerda / voltar à sidebar de categorias |
| **→** | Direita / selecionar categoria |
| **OK** | Confirmar / reproduzir canal |
| **BACK** (462) | Voltar à tela anterior / fechar player |

**Nota:** O keyCode de BACK (`461`) é uma convenção comunitária para LG webOS e foi validado através de implementação, mas pode variar por região/modelo. Se BACK não funcionar, console logs mostrarão o keyCode correto.

---

## 📦 Estrutura do Projeto

```
src/
├── index.html              # Ponto de entrada
├── appinfo.json           # Manifest webOS
├── icon.png               # Ícone 80x80
├── largeIcon.png          # Ícone 130x130
├── css/
│   ├── app.css            # Estilos principais
│   ├── layout.css         # Layout e TV-specific
│   └── player.css         # Estilos do player
└── js/
    ├── event-bus.js       # Pub/sub genérico
    ├── state-machine.js   # Máquina de estados
    ├── storage-service.js # localStorage abstrato
    ├── m3u-parser.js      # Parser M3U/M3U8
    ├── playlist-service.js # Carregamento e cache
    ├── channel-service.js  # Índices e busca de canais
    ├── favorites-service.js # Sistema de favoritos
    ├── navigation.js      # Navegação por teclado
    ├── player.js          # Vídeo player
    ├── settings.js        # Tela de configurações
    ├── app.js             # Bootstrap e tela home
    └── vendor/
        └── hls.min.js     # hls.js 1.4.12 (injetado sob demanda)

tests/
├── m3u-parser.test.js
├── state-machine.test.js
└── storage-service.test.js

scripts/
├── build.ps1              # Valida, testa e copia para dist/
├── package.ps1            # Cria .ipk
├── install.ps1            # Instala na TV
├── launch.ps1             # Inicia o app
├── dev.ps1                # Orquestra build→package→install→launch
└── dev-server.js          # Servidor estático para desktop

dist/                       # (Gerado) staging do .ipk
.gitignore
package.json
README.md
```

---

## 🔧 Arquitetura

### Conceitos Chave

**Sem ES Modules:** Os módulos usam scripts clássicos (`<script>`) para compatibilidade com Chromium 38+ (webOS 3.x). Cada módulo exporta duplo: `window.IPTV.<Nome>` (browser) + `module.exports` (Node, para testes).

**Máquina de Estados:** App navega por estados (`LOADING_PLAYLIST`, `CHANNEL_LIST`, `PLAYING`, `SETTINGS`, etc.). Transições são validadas, contexto é preservado.

**Event Bus:** Módulos desacoplados comunicam via `EventBus.emit('evento', {data})`, evitando acoplamento bidirecional.

**Navegação Genérica:** Controller de foco suporta zonas de dois tipos (`list` 1D, `grid` 2D). Cada tela cria sua própria instância de controller; ao sair da tela, controller é destruído (evita foco fantasma).

**Parser M3U:** Tolerante a erros; linhas inválidas não abortam o parse todo. Duplicados (por ID ou URL) são descartados, estatísticas mantidas para debug.

**Player:** Feature-detection nativa HLS via `canPlayType()`. hls.js é injetado dinamicamente só se necessário (poupa recurso em TVs que já suportam HLS).

### Fluxo de Inicialização

1. **DOMContentLoaded** → `App.init()`
2. `PlaylistService.loadPlaylist()` → baixa M3U do iptv-org
3. `M3UParser.parseM3U()` → estrutura canais
4. `ChannelService.setChannels()` → constrói índices
5. Renderiza sidebar de categorias + grid de canais
6. Usuário navega e seleciona canal → `StateMachine.dispatch('SELECT_CHANNEL')`
7. `Player.mount()` → exibe vídeo + controles

### Persistência de Dados

- **Favoritos:** `localStorage` (chave `iptv:favorites:v1`)
- **Cache de Playlist:** `localStorage` (chave `iptv:playlist:cache:v1`, refresca em background)
- **Último Canal:** `localStorage` (chave `iptv:lastChannel:v1`, para futuro "retomar")
- **Configurações:** `localStorage` (chave `iptv:settings:v1`)

⚠️ **Limitação Conhecida:** Todos os dados em localStorage são **apagados quando o app é reinstalado/atualizado** via Developer Mode. Isso é um comportamento documentado de webOS. Cache local é sempre uma otimização opcional, nunca uma dependência.

---

## 🔌 Configurações

Clique em **⚙️ Configurações** na tela home para editar:

- **URL da Playlist:** URL de uma playlist M3U (default: iptv-org)
- **Retomar Último Canal:** Toggle para auto-play do último canal assistido
- **Atualizar Playlist:** Botão para força refresh (útil durante desenvolvimento)

---

## 🎬 Reprodução de Vídeo

### Formatos Suportados

A compatibilidade depende de **webOS version** e **chipset da TV**:

| Versão webOS | H.264 | HEVC | VP9 | AV1 | HLS |
|---|---|---|---|---|---|
| 4.0+ (Full HD) | ✅ Nativo | ✅ Nativo* | ⚠️ Limitado | ❌ | ✅ |
| 5.0+ (Full HD) | ✅ Nativo | ✅ Nativo* | ✅ 4K+ | ⚠️ | ✅ |
| 24+ (Full HD/4K) | ✅ Nativo | ✅ Nativo* | ✅ Nativo | ✅ Nativo | ✅ |

*HEVC: perfil e bitrate variam por modelo/resolução.

**HLS:** Suportado nativamente em TVs reais desde webOS 3.5. O app detecta automaticamente; se não tiver suporte, hls.js é injetado e usado como fallback.

### Limitações Conhecidas

- **MPEG-DASH:** Não documentado como suportado. O app usa HLS/MP4 apenas.
- **Alguns canais da playlist podem não funcionar:** O iptv-org agrega milhares de fontes. Disponibilidade/formato varia por fonte e localização.
- **HTTPS obrigatório:** URLs com schema misto (app `file://` carregando HTTP) podem ser bloqueadas.
- **CORS não é um problema** para `<video>` nativo (o browser carrega o stream direto).

---

## 🐛 Debug

### Web Inspector

Enquanto o app está rodando:

```bash
npm run launch -- -Device MyTV -Inspect
# Abre Chrome DevTools conectado à TV
```

No DevTools:
- **Console:** Veja logs em tempo real (`[App]`, `[Player]`, `[M3U]`, etc.)
- **Elements:** Inspecione DOM da TV em tempo real
- **Network:** Monitore downloads de playlist e streams

### Logs da Console

O app loga estruturadamente:

```javascript
[App] Loaded 12345 channels, 42 errors
[Player] HLS native support: yes
[StorageService] localStorage available
[StateMachine] Invalid transition: LOADING_PLAYLIST -> INVALID_EVENT
```

### Troubleshooting

**"Developer Mode app pede login mas não aceita minha conta LG":**
- ❌ Você está tentando usar a conta LG genérica (do Store)
- ✅ Você precisa da conta do **LG Developer Portal** (https://webostv.developer.lge.com)
- Solução: Crie uma conta nova no Developer Portal, use essas credenciais no app

**TV não aparece em `ares-setup-device --list`:**
- Verifique que ambos PC e TV estão na mesma rede
- Ping do PC para o IP da TV: `ping 192.168.x.x`
- Verifique firewall (porta 9922 deve estar aberta)
- Reinicie Developer Mode na TV

**`ares-install` falha com erro de permissão:**
- Verifique que Key Server está ativo no app Developer Mode da TV
- Re-registre a chave SSH: `ares-novacom --device MyTV --getkey`

**Playlist não carrega na TV:**
- Verifique conexão de rede da TV
- Tente acesso direto de browser: abre Settings → Network → Test Connection
- Console deve mostrar erro: `[PlaylistService] Failed to load...` com detalhes

**Alguns canais não reproduzem:**
- Isso é esperado. Nem todas as fontes do iptv-org têm suporte garantido.
- Console deve mostrar: `[Player] Formato não suportado` ou timeout
- Tente outro canal

**Developer Mode expirou:**
- TV mostrará notificação. Abra Developer Mode app e clique "EXTEND"
- Apps instaladas serão removidas após expiração (comportamento documentado)

---

## 📖 Referências Oficiais da LG

- **webOS TV Developer Portal:** https://webostv.developer.lge.com
- **webOS TV CLI Installation:** https://webostv.developer.lge.com/develop/tools/cli-installation
- **webOS TV CLI Dev Guide:** https://webostv.developer.lge.com/develop/tools/webos-tv-cli-dev-guide
- **appinfo.json Reference:** https://webostv.developer.lge.com/develop/references/appinfo-json
- **Developer Mode App:** https://webostv.developer.lge.com/develop/getting-started/developer-mode-app
- **Video/Audio Specs (by version):** https://webostv.developer.lge.com/develop/specifications/video-audio-240
- **Streaming & DRM:** https://webostv.developer.lge.com/develop/specifications/streaming-protocol-drm
- **TLS & Security:** https://webostv.developer.lge.com/develop/specifications/tls

---

## 📦 Dependências

### Produção
- **hls.js** 1.4.12 (vendorizado em `src/js/vendor/hls.min.js`)
  - Fonte: https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js
  - Licença: Apache 2.0
  - Usado: Fallback para HLS quando navegador não suporta nativamente

### Desenvolvimento
- **Node.js** 18+ (testes)
- **npm** (package management)
- **node:test** (built-in, sem dependências externas)

---

## 🧪 Testes

```bash
npm test
```

Roda todos os testes em `tests/*.test.js`:
- Parser M3U (13 casos)
- State Machine (11 casos)
- Storage Service (integração)
- **Total:** 26+ testes

---

## 🎨 Customização

### Cores

Edite `src/css/app.css`, seção `:root`:

```css
--color-primary: #FF6B35;      /* Laranja */
--color-secondary: #1a1a1a;    /* Preto */
--color-text: #ffffff;         /* Branco */
```

### Ícones

Substitua `src/icon.png` (80x80) e `src/largeIcon.png` (130x130) pelos seus próprios.

### Playlist Padrão

Edite `src/js/playlist-service.js`:
```javascript
_defaultUrl: 'https://sua-playlist.com/playlist.m3u8'
```

---

## 📝 Licença

MIT — Use livremente para fins pessoais e educacionais.

---

## ⚠️ Aviso Legal

**Sobre a playlist:** A app carrega dados do [iptv-org/iptv](https://github.com/iptv-org/iptv), que é um **índice de canais de terceiros**. A app não hospeda nenhum conteúdo de vídeo ou stream. 

**Responsabilidade:** A disponibilidade, legalidade, conteúdo e funcionamento dos canais dependem:
- Das fontes de streaming originais
- Da localização geográfica e legislação local
- Da conformidade com direitos autorais e termos de serviço dos provedores

**Use responsavelmente.** A app é fornecida "como está" sem garantias. Não incluir conteúdo IPTV proprietário, credenciais privadas ou feeds comerciais neste projeto.

---

## 🙋 Suporte & Feedback

- Reporte bugs via GitHub Issues
- Perguntas sobre webOS? Consulte a documentação oficial (links acima)
- Changelog: veja `git log` ou GitHub Releases

---

**Última atualização:** Setembro 2026  
**App Version:** 1.0.0  
**webOS CLI:** @webos-tools/cli ~3.2.x
