# Lokálne testovanie emailov

## Prehľad

Pre lokálne testovanie emailov máte niekoľko možností:

1. **Mock Service** - simuluje odosielanie (už funguje)
2. **MailHog** - lokálny SMTP server (potrebuje nastavenie)
3. **Gmail** - skutočné emaily na váš Gmail účet
4. **Mailjet** - skutočné emaily cez Mailjet API

## 1. Mock Service (Aktuálne funguje)

** Stav**: ✅ Funguje
** Použitie**: Testovací režim, simuluje odosielanie
** Výhody**: Rýchle testovanie, žiadne náklady

```bash
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Mock",
    "content": "<h1>Test</h1><p>Mock test</p>",
    "emailService": "mock"
  }'
```

## 2. MailHog (Lokálny SMTP server)

** Stav**: ⚠️ Potrebuje nastavenie
** Použitie**: Lokálny SMTP server, emaily sa zobrazia v webovom rozhraní
** Výhody**: Vidíte skutočné emaily, lokálne testovanie

### Nastavenie MailHog:

#### Krok 1: Spustite MailHog
```bash
# Spustite MailHog v pozadí
mailhog &

# Alebo spustite s konkrétnymi portmi
mailhog -api-bind-addr 127.0.0.1:8025 -smtp-bind-addr 127.0.0.1:1025 -ui-bind-addr 127.0.0.1:8025
```

#### Krok 2: Otvorte webové rozhranie
```bash
# Otvorte MailHog webové rozhranie
open http://localhost:8025
```

#### Krok 3: Otestujte SMTP
```bash
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@localhost",
    "subject": "Test MailHog",
    "content": "<h1>Test MailHog</h1><p>Lokálny test</p>",
    "emailService": "smtp"
  }'
```

#### Krok 4: Skontrolujte emaily
- Choďte na http://localhost:8025
- Mali by ste vidieť odoslaný email

## 3. Gmail (Skutočné emaily)

** Stav**: ⚠️ Potrebuje OAuth nastavenie
** Použitie**: Skutočné emaily na váš Gmail účet
** Výhody**: Testovanie s reálnymi emailmi

### Nastavenie Gmail:

#### Krok 1: Vytvorte Gmail účet
- Vytvorte `numerroom@numerroom.com` Gmail účet
- Alebo použite existujúci Gmail účet

#### Krok 2: Nastavte OAuth
1. Choďte na https://console.cloud.google.com
2. Vytvorte nový projekt
3. Povoľte Gmail API
4. Vytvorte OAuth 2.0 credentials
5. Nastavte redirect URI: `http://localhost:3000/auth/callback`

#### Krok 3: Aktualizujte .env
```env
GOOGLE_OAUTH_CLIENT_ID="your_actual_client_id"
GOOGLE_OAUTH_CLIENT_SECRET="your_actual_client_secret"
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3000/auth/callback"
```

#### Krok 4: Otestujte Gmail
```bash
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "numerroom@numerroom.com",
    "subject": "Test Gmail",
    "content": "<h1>Test Gmail</h1><p>Skutočný email</p>",
    "emailService": "gmail"
  }'
```

## 4. Mailjet (Produkčné emaily)

** Stav**: ⚠️ Potrebuje skutočné API kľúče
** Použitie**: Profesionálne emaily pre produkciu
** Výhody**: Vysoká doručiteľnosť, analytics

### Nastavenie Mailjet:

#### Krok 1: Vytvorte Mailjet účet
1. Choďte na https://mailjet.com
2. Vytvorte bezplatný účet
3. Overte emailovú adresu

#### Krok 2: Získajte API kľúče
1. Choďte na "Account Settings" > "API Key Management"
2. Skopírujte API Key a Secret Key

#### Krok 3: Aktualizujte .env
```env
MAILJET_API_KEY="your_actual_mailjet_api_key"
MAILJET_API_SECRET="your_actual_mailjet_secret"
MAILJET_SENDER_EMAIL="noreply@domelia.sk"
MAILJET_SENDER_NAME="Domelia.sk"
```

#### Krok 4: Otestujte Mailjet
```bash
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "numerroom@numerroom.com",
    "subject": "Test Mailjet",
    "content": "<h1>Test Mailjet</h1><p>Produkčný email</p>",
    "emailService": "mailjet"
  }'
```

## Odporúčaný postup

### Pre Development:
1. **Mock Service** - rýchle testovanie funkcionality
2. **MailHog** - testovanie s reálnymi emailmi lokálne
3. **Gmail** - testovanie s reálnymi emailmi na internete

### Pre Production:
1. **Mailjet** - profesionálne emaily
2. **Gmail** - backup/fallback

## Troubleshooting

### MailHog nefunguje:
```bash
# Skontrolujte, či beží
ps aux | grep mailhog

# Skontrolujte porty
lsof -i :1025
lsof -i :8025

# Reštartujte MailHog
pkill mailhog
mailhog &
```

### Gmail "ready: false":
- Skontrolujte OAuth credentials
- Overte, že Gmail API je povolené
- Skontrolujte redirect URI

### Mailjet nefunguje:
- Skontrolujte API kľúče
- Overte doménu
- Skontrolujte rate limity

## Testovanie cez UI

1. Otvorte http://localhost:3000/
2. Kliknite na "Test Email" kartu
3. Vyberte emailovú službu:
   - **Mock služba** - testovací režim
   - **SMTP (MailHog)** - lokálne emaily
   - **Gmail** - skutočné emaily
   - **Mailjet** - produkčné emaily
4. Vyplňte formulár a otestujte

## Kontrola stavu služieb

```bash
# Skontrolujte stav všetkých služieb
curl -s http://localhost:3001/api/dashboard/email-status | jq
```

## Produkčné testovanie

Pre produkčné testovanie odporúčam:

1. **Vytvorte testovací Gmail účet** (`numerroom@numerroom.com`)
2. **Nastavte Gmail OAuth** pre testovanie
3. **Nastavte Mailjet** pre produkčné emaily
4. **Použite testovací účet** pre všetky testy

Toto vám umožní:
- ✅ Testovať s reálnymi emailmi
- ✅ Vidieť, ako vyzerajú emaily
- ✅ Testovať doručiteľnosť
- ✅ Bezpečné testovanie bez ovplyvnenia zákazníkov
