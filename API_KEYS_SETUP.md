# 🔑 Nastavenie API kľúčov pre Biz-Agent

## 📧 **Mailjet API**

### 1. Vytvorenie Mailjet účtu
1. Choďte na [mailjet.com](https://mailjet.com)
2. Zaregistrujte sa a overte email
3. Overte doménu `domelia.sk` v Mailjet

### 2. Získanie API kľúčov
1. V Mailjet dashboarde choďte na **Account Settings** → **API Keys**
2. Skopírujte **API Key** a **Secret Key**
3. Vložte ich do `env.production`:
   ```bash
   MAILJET_API_KEY="your_actual_api_key"
   MAILJET_API_SECRET="your_actual_secret_key"
   ```

### 3. Nastavenie odosielateľa
```bash
MAILJET_SENDER_EMAIL="noreply@domelia.sk"
MAILJET_SENDER_NAME="Domelia.sk - Biz Agent"
```

## 📅 **Google Calendar API**

### 1. Vytvorenie Google Cloud Project
1. Choďte na [Google Cloud Console](https://console.cloud.google.com)
2. Vytvorte nový projekt alebo použite existujúci
3. Povoľte **Google Calendar API**

### 2. Vytvorenie Service Account
1. V Google Cloud Console choďte na **IAM & Admin** → **Service Accounts**
2. Kliknite **Create Service Account**
3. Pomenujte ho napr. `biz-agent-calendar`
4. Pridajte role: **Calendar API Admin**

### 3. Stiahnutie credentials
1. Kliknite na vytvorený service account
2. Choďte na **Keys** tab
3. Kliknite **Add Key** → **Create new key** → **JSON**
4. Stiahnutý súbor premenujte na `google-calendar-credentials.json`
5. Umiestnite ho do `credentials/` adresára

### 4. Nastavenie v env.production
```bash
GOOGLE_CALENDAR_CREDENTIALS_PATH="./credentials/google-calendar-credentials.json"
GOOGLE_CALENDAR_ID="primary"
```

## 🔍 **Google Search API (pre automatické hľadanie firiem)**

### 1. Povolenie Custom Search API
1. V Google Cloud Console povolte **Custom Search API**
2. Vytvorte API kľúč v **APIs & Services** → **Credentials**

### 2. Vytvorenie Custom Search Engine
1. Choďte na [Google Programmable Search Engine](https://programmablesearchengine.google.com)
2. Kliknite **Create a search engine**
3. Nastavte:
   - **Sites to search**: `www.google.com` (pre celý web)
   - **Name**: `Biz-Agent Company Search`
   - **Language**: `Slovak`
4. Kliknite **Create**
5. Skopírujte **Search Engine ID** (cx parameter)

### 3. Nastavenie v env.production
```bash
GOOGLE_SEARCH_API_KEY="your_google_search_api_key"
GOOGLE_SEARCH_ENGINE_ID="your_search_engine_id"
```

### 4. Testovanie
```bash
npm run test:search
```

## 🔐 **Security kľúče**

### 1. Encryption Key
Vygenerujte 32-znakový kľúč:
```bash
# V terminali:
openssl rand -hex 16
```

### 2. JWT Secret
Vygenerujte náhodný string:
```bash
# V terminali:
openssl rand -base64 32
```

### 3. Nastavenie v env.production
```bash
ENCRYPTION_KEY="your_32_character_encryption_key"
JWT_SECRET="your_jwt_secret"
```

## 🚀 **Spustenie s reálnymi API**

### 1. Nastavenie production env
```bash
cp env.production .env
```

### 2. Úprava kľúčov
Upravte `.env` súbor a nahraďte všetky `your_*_here` reálnymi hodnotami.

### 3. Spustenie aplikácie
```bash
npm run start
```

## ⚠️ **Bezpečnostné poznámky**

1. **Nikdy necommitnite** `.env` súbor do git
2. **Nikdy necommitnite** `credentials/` adresár
3. Používajte **Service Accounts** namiesto OAuth pre automatizáciu
4. **Omezte API kľúče** na potrebné služby
5. **Monitorujte API usage** v Google Cloud Console

## 🧪 **Testovanie API**

### Test Mailjet
```bash
npm run test:mailjet
```

### Test Google Calendar
```bash
npm run test:calendar
```

## 🕷️ **Web Scraper (automatické)**

### Funkcie
- **Automatické hľadanie firiem** cez Google Search
- **Extrakcia kontaktov** z webových stránok
- **Rozpoznávanie emailov** a telefónnych čísel
- **Respektovanie rate limitov** a robots.txt

### Testovanie
```bash
npm run test:scraper
npm run test:discovery
```

## 📊 **Monitoring**

Po nastavení API kľúčov môžete monitorovať:
- **Mailjet**: Sending statistics, bounces, opens
- **Google Calendar**: Event creation, meeting links
- **Google Search**: Search queries, results
- **Web Scraper**: Companies discovered, contacts extracted
