# Quickstart — Adriano IPTV

## ⏱️ 5 Min Setup

### 0. Criar Conta no LG Developer Portal (uma única vez)

**Importante:** Você precisa de uma conta **específica** do LG Developer Portal (não é a conta LG comum do Store).

Acesse: https://webostv.developer.lge.com/develop/getting-started/
- Clique "Sign Up" ou "Register"
- Use um email válido e crie uma senha
- **Anote o email e senha** — vais usar no Developer Mode app da TV

### 1. Instalar webOS CLI (uma única vez no PC)
```bash
npm install -g @webos-tools/cli
ares -V
```

### 2. Parear TV ao PC (uma única vez)

**Na TV:**
- Abra **LG Content Store** → procure **"Developer Mode"** → instale
- Abra **Developer Mode app**
- **Login:** Use o email + senha da sua conta no LG Developer Portal (não a conta LG comum!)
- Clique **"Dev Mode Status"** para ativar → TV reinicia
- Note o **IP da TV** (visto no app)

**No PC:**
```bash
ares-setup-device --add MyTV -i "host=192.168.1.100" -i "port=9922" -i "username=prisoner"
```

Substitua `192.168.1.100` pelo IP da TV. Na TV:
- Abra Developer Mode app novamente
- Clique **"Key Server"** → copie passphrase (ex: "A1B2C3")

No PC:
```bash
ares-novacom --device MyTV --getkey
# Cole a passphrase quando pedido
```

### 3. Build & Deploy
```bash
# Dentro da pasta AdrianoIPTV
cd C:\Projetos\AdrianoIPTV

npm run dev -- -Device MyTV -Inspect
```

Isso vai:
1. ✅ Testar a app (26 testes)
2. ✅ Criar `.ipk`
3. ✅ Instalar na TV
4. ✅ Iniciar a app
5. ✅ Abrir Web Inspector no PC

---

## 🎮 Use a App

- ↑↓←→ = navega
- OK = seleciona canal
- BACK (botão vermelho) = volta
- Clique em ⚙️ = configurações
- Clique em ⭐ = favorito (salva auto)

---

## 🔧 Desenvolvimento

### Teste desktop (sem TV)
```bash
npm run dev-server
# Abra http://localhost:8080 no Chrome/Edge
# Setas = navegação, Enter = seleciona
```

### Build apenas
```bash
npm run build     # Testa e copia src → dist
npm run package   # Cria .ipk
npm test          # Roda testes
```

### Ver logs da TV
```bash
npm run launch -- -Device MyTV -Inspect
# DevTools abre. Veja console em tempo real.
```

---

## ❌ Problemas?

**"TV não encontrada"**
```bash
ares-setup-device --list
# Deve listar MyTV
```

**"Key Server error"**
- Na TV: Abra Developer Mode app → clique Key Server
- No PC: `ares-novacom --device MyTV --getkey` novamente

**"Playlist não carrega"**
- Tela mostra carregamento: normal, aguarde
- Se não sair do carregamento: verifique rede da TV (Settings > Network > Test)
- Console (DevTools): procure por `[App] Failed to load...`

**"Alguns canais não reproduzem"**
- Esperado. Nem todos os streams no iptv-org funcionam em todas as TVs.
- Tente outro canal.

---

## 📚 Referências

- **Docs completa:** Leia `README.md`
- **LG webOS:** https://webostv.developer.lge.com
- **Testes:** `npm test`
- **Código:** Bem documentado em cada módulo `src/js/*.js`

---

**Pronto?** Siga para o passo 1 acima. 🚀
