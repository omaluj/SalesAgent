# Email Services Setup Guide

## Prehľad

Biz-Agent aplikácia podporuje 3 emailové služby:
1. **Mock Service** - testovací režim (už funguje)
2. **Gmail** - cez OAuth 2.0 (potrebuje nastavenie)
3. **Mailjet** - cez API (potrebuje skutočné kľúče)

## 1. Mock Service (Aktuálne aktívny)

** Stav**: ✅ Funguje
** Použitie**: Testovací režim, simuluje odosielanie emailov
** Výhody**: Rýchle testovanie, žiadne náklady, žiadne skutočné odosielanie

## 2. Gmail Service (Potrebuje nastavenie)

### Prečo Gmail?
- ✅ **Bezplatné** - 500 emailov/deň
- ✅ **Dôveryhodné** - Gmail má vysokú doručiteľnosť
- ✅ **Jednoduché** - používa existujúci Gmail účet
- ✅ **OAuth 2.0** - bezpečné prihlásenie

### Nastavenie Gmail OAuth:

#### Krok 1: Vytvorte Google Cloud Project
1. Choďte na https://console.cloud.google.com
2. Vytvorte nový projekt alebo vyberte existujúci
3. Povoľte Gmail API

#### Krok 2: Vytvorte OAuth 2.0 Credentials
1. Choďte na "APIs & Services" > "Credentials"
2. Kliknite "Create Credentials" > "OAuth 2.0 Client ID"
3. Vyberte "Web application"
4. Pridajte redirect URI: `http://localhost:3000/auth/callback`
5. Stiahnite JSON súbor s credentials

#### Krok 3: Nastavte v aplikácii
```env
GOOGLE_OAUTH_CLIENT_ID="your_actual_client_id"
GOOGLE_OAUTH_CLIENT_SECRET="your_actual_client_secret"
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3000/auth/callback"
```

#### Krok 4: OAuth Flow
1. Aplikácia presmeruje na Google OAuth
2. Užívateľ sa prihlási do Gmail účtu
3. Povolí prístup k Gmail API
4. Aplikácia získa access token

### Testovanie Gmail:
```bash
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@gmail.com",
    "subject": "Test Gmail",
    "content": "<h1>Test</h1><p>Gmail test</p>",
    "emailService": "gmail"
  }'
```

## 3. Mailjet Service (Potrebuje skutočné kľúče)

### Prečo Mailjet?
- ✅ **Profesionálne** - pre business emaily
- ✅ **Analytics** - tracking otvorení, kliknutí
- ✅ **Templates** - predpripravené šablóny
- ✅ **Deliverability** - vysoká doručiteľnosť

### Nastavenie Mailjet:

#### Krok 1: Vytvorte Mailjet účet
1. Choďte na https://mailjet.com
2. Vytvorte bezplatný účet
3. Overte emailovú adresu

#### Krok 2: Získajte API kľúče
1. Choďte na "Account Settings" > "API Key Management"
2. Skopírujte API Key a Secret Key
3. Overte doménu (pre production)

#### Krok 3: Nastavte v aplikácii
```env
MAILJET_API_KEY="your_actual_mailjet_api_key"
MAILJET_API_SECRET="your_actual_mailjet_secret"
MAILJET_SENDER_EMAIL="noreply@domelia.sk"
MAILJET_SENDER_NAME="Domelia.sk"
```

### Testovanie Mailjet:
```bash
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Mailjet",
    "content": "<h1>Test</h1><p>Mailjet test</p>",
    "emailService": "mailjet"
  }'
```

## Porovnanie služieb

| Služba | Cena | Limit | Setup | Doručiteľnosť | Analytics |
|--------|------|-------|-------|---------------|-----------|
| Mock | Bezplatné | Neobmedzené | ✅ Hotové | N/A | N/A |
| Gmail | Bezplatné | 500/deň | ⚠️ OAuth | Vysoká | Základné |
| Mailjet | Bezplatné | 200/deň | ⚠️ API | Vysoká | Pokročilé |

## Odporúčania

### Pre Development:
- **Mock Service** - rýchle testovanie
- **Gmail** - testovanie s reálnymi emailmi

### Pre Production:
- **Mailjet** - profesionálne emaily
- **Gmail** - backup/fallback

### Hybrid prístup:
- **Gmail** pre personálne emaily
- **Mailjet** pre marketing kampane

## Troubleshooting

### Gmail "ready: false"
- Skontrolujte OAuth credentials
- Overte, že Gmail API je povolené
- Skontrolujte redirect URI

### Mailjet "ready: true" ale nefunguje
- Skontrolujte API kľúče
- Overte doménu
- Skontrolujte rate limity

### Testovanie
```bash
# Skontrolujte stav služieb
curl -s http://localhost:3001/api/dashboard/email-status | jq

# Testujte mock
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -d '{"to":"test@example.com","subject":"Test","content":"<h1>Test</h1>","emailService":"mock"}'

# Testujte Gmail
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -d '{"to":"your-email@gmail.com","subject":"Test","content":"<h1>Test</h1>","emailService":"gmail"}'

# Testujte Mailjet
curl -X POST http://localhost:3001/api/dashboard/test-email \
  -d '{"to":"test@example.com","subject":"Test","content":"<h1>Test</h1>","emailService":"mailjet"}'
```

## Ďalšie kroky

1. **Nastavte Gmail OAuth** pre testovanie s reálnymi emailmi
2. **Nastavte Mailjet** pre production emaily
3. **Implementujte OAuth flow** v UI
4. **Pridajte email templates** pre rôzne scenáre
5. **Implementujte analytics** pre tracking

## Bezpečnosť

- ✅ Nikdy necommitnite API kľúče do git
- ✅ Používajte `.env` súbory
- ✅ Rotujte kľúče pravidelne
- ✅ Monitorujte usage a limity
- ✅ Používajte testovacie adresy pre development
