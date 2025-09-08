# Gmail Setup Guide - Rýchle nastavenie

## Prečo Gmail?

- ✅ **Bezplatné** - 500 emailov/deň
- ✅ **Jednoduché nastavenie** - OAuth 2.0
- ✅ **Vysoká doručiteľnosť**
- ✅ **Používa existujúci Gmail účet**

## Rýchle nastavenie (5 minút)

### Krok 1: Vytvorte Gmail účet
1. Choďte na https://gmail.com
2. Vytvorte nový účet: `numerroom@numerroom.com`
3. Alebo použite existujúci Gmail účet

### Krok 2: Google Cloud Console
1. Choďte na https://console.cloud.google.com
2. Kliknite "Select a project" > "New Project"
3. Názov: "Domelia Email Testing"
4. Kliknite "Create"

### Krok 3: Povoľte Gmail API
1. Choďte na "APIs & Services" > "Library"
2. Vyhľadajte "Gmail API"
3. Kliknite "Enable"

### Krok 4: Vytvorte OAuth Credentials
1. Choďte na "APIs & Services" > "Credentials"
2. Kliknite "Create Credentials" > "OAuth 2.0 Client ID"
3. Ak sa zobrazí "Configure consent screen":
   - Vyberte "External"
   - Kliknite "Create"
   - Vyplňte:
     - App name: "Domelia Email Testing"
     - User support email: váš email
     - Developer contact: váš email
   - Kliknite "Save and Continue"
   - Kliknite "Save and Continue" (Scopes)
   - Kliknite "Save and Continue" (Test users)
   - Kliknite "Save and Continue" (Summary)

4. Vytvorte OAuth Client:
   - Application type: "Web application"
   - Name: "Domelia Email Testing"
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`
   - Kliknite "Create"

5. Skopírujte Client ID a Client Secret

### Krok 5: Nastavte v aplikácii
1. Otvorte `backend/env.development`
2. Nahraďte testovacie hodnoty:

```env
GOOGLE_OAUTH_CLIENT_ID="your_actual_client_id_here"
GOOGLE_OAUTH_CLIENT_SECRET="your_actual_client_secret_here"
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3000/auth/callback"
```

### Krok 6: Reštartujte aplikáciu
```bash
./restart.sh
```

### Krok 7: Otestujte Gmail
1. Otvorte http://localhost:3000/
2. Kliknite "Test Email"
3. Vyberte "Gmail"
4. Vyplňte:
   - Email: `numerroom@numerroom.com`
   - Subject: "Test Gmail"
   - Content: `<h1>Test</h1><p>Gmail test</p>`
5. Kliknite "Odoslať test email"

## OAuth Flow

Pri prvom použití sa zobrazí OAuth flow:
1. Aplikácia presmeruje na Google
2. Prihláste sa do Gmail účtu
3. Povolte prístup k Gmail API
4. Aplikácia získa access token
5. Emaily sa začnú odosielať

## Testovanie

### Cez UI:
1. Dashboard > Test Email > Gmail
2. Vyplňte formulár
3. Otestujte

### Cez API:
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

## Kontrola stavu

```bash
curl -s http://localhost:3001/api/dashboard/email-status | jq
```

Mali by ste vidieť:
```json
{
  "gmail": {
    "ready": true
  }
}
```

## Troubleshooting

### "Gmail ready: false"
- Skontrolujte OAuth credentials
- Overte, že Gmail API je povolené
- Skontrolujte redirect URI

### OAuth error
- Skontrolujte Client ID a Secret
- Overte redirect URI
- Skontrolujte, že doména je overená

### Email sa neodoslal
- Skontrolujte Gmail účet
- Overte, že OAuth flow je dokončený
- Skontrolujte logy

## Výhody Gmail

- ✅ **Bezplatné** - 500 emailov/deň
- ✅ **Dôveryhodné** - Gmail má vysokú doručiteľnosť
- ✅ **Jednoduché** - používa existujúci účet
- ✅ **Bezpečné** - OAuth 2.0
- ✅ **Rýchle nastavenie** - 5 minút

## Ďalšie kroky

Po nastavení Gmail môžete:
1. **Testovať emaily** s reálnymi adresami
2. **Vidieť, ako vyzerajú** emaily
3. **Testovať doručiteľnosť**
4. **Nastaviť Mailjet** pre produkciu
