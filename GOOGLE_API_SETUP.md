# 🚀 **Google API Setup - Biz-Agent**

## 📋 **Prehľad potrebných API**

Pre Biz-Agent potrebujeme tieto Google API:
- **Gmail API** - odosielanie emailov
- **Google Calendar API** - plánovanie meetingov
- **Custom Search API** - hľadanie firiem

## 🔧 **Krok 1: Vytvorenie Google Cloud Project**

### 1.1 Prístup do Google Cloud Console
1. Choďte na [Google Cloud Console](https://console.cloud.google.com)
2. Prihláste sa s Google účtom (ideálne ten, ktorý používate pre domelia.sk)

### 1.2 Vytvorenie nového projektu
1. Kliknite na **"Select a project"** (horný panel)
2. Kliknite **"New Project"**
3. Nastavte:
   - **Project name**: `Biz-Agent`
   - **Project ID**: `biz-agent-XXXXX` (automaticky vygenerované)
4. Kliknite **"Create"**

### 1.3 Aktivácia projektu
1. Po vytvorení sa automaticky prepnete do nového projektu
2. Overte, že v hornom paneli vidíte **"Biz-Agent"**

## 🔑 **Krok 2: Povolenie potrebných API**

### 2.1 Gmail API
1. V menu choďte do **"APIs & Services"** → **"Library"**
2. Vyhľadajte **"Gmail API"**
3. Kliknite na **"Gmail API"**
4. Kliknite **"Enable"**

### 2.2 Google Calendar API
1. V **"APIs & Services"** → **"Library"**
2. Vyhľadajte **"Google Calendar API"**
3. Kliknite na **"Google Calendar API"**
4. Kliknite **"Enable"**

### 2.3 Custom Search API
1. V **"APIs & Services"** → **"Library"**
2. Vyhľadajte **"Custom Search API"**
3. Kliknite na **"Custom Search API"**
4. Kliknite **"Enable"**

## 👤 **Krok 3: Vytvorenie Service Account**

### 3.1 Prístup do Credentials
1. V menu choďte do **"APIs & Services"** → **"Credentials"**
2. Kliknite **"Create Credentials"** → **"Service Account"**

### 3.2 Konfigurácia Service Account
1. **Service account name**: `biz-agent-service`
2. **Service account ID**: `biz-agent-service@biz-agent-XXXXX.iam.gserviceaccount.com`
3. **Description**: `Service account for Biz-Agent automation`
4. Kliknite **"Create and Continue"**

### 3.3 Pridanie rolí
1. **Role**: `Editor` (alebo `Gmail API Admin` ak je dostupné)
2. Kliknite **"Continue"**
3. Kliknite **"Done"**

### 3.4 Vytvorenie kľúča
1. V zozname Service Accounts kliknite na **"biz-agent-service"**
2. Prejdite na **"Keys"** tab
3. Kliknite **"Add Key"** → **"Create new key"**
4. Vyberte **"JSON"**
5. Kliknite **"Create"**
6. **Stiahne sa vám JSON súbor** - uložte ho ako `google-credentials.json`

## 📁 **Krok 4: Nastavenie v Biz-Agent**

### 4.1 Uloženie credentials
1. Vytvorte priečinok `credentials/` v root adresári projektu
2. Skopírujte `google-credentials.json` do `credentials/`

### 4.2 Aktualizácia .env súboru
```bash
# Google API Configuration
GOOGLE_CALENDAR_ID="primary"
GOOGLE_CALENDAR_CREDENTIALS_PATH="./credentials/google-credentials.json"

# Email Configuration (Gmail)
MAILJET_SENDER_EMAIL="marketing@domelia.sk"
MAILJET_SENDER_NAME="Domelia.sk - Biz Agent"

# Google Search API (budeme nastavovať neskôr)
GOOGLE_SEARCH_API_KEY="your_google_search_api_key_here"
GOOGLE_SEARCH_ENGINE_ID="your_search_engine_id_here"
```

## 🔍 **Krok 5: Vytvorenie Custom Search Engine**

### 5.1 Prístup do Custom Search
1. Choďte na [Google Programmable Search Engine](https://programmablesearchengine.google.com)
2. Prihláste sa s rovnakým Google účtom

### 5.2 Vytvorenie Search Engine
1. Kliknite **"Create a search engine"**
2. Nastavte:
   - **Sites to search**: `www.google.com` (pre celý web)
   - **Name**: `Biz-Agent Company Search`
   - **Language**: `Slovak`
3. Kliknite **"Create"**

### 5.3 Získanie Search Engine ID
1. V **"Setup"** sekcii skopírujte **"Search engine ID"** (cx parameter)
2. Vyzerá ako: `012345678901234567890:abcdefghijk`

## 🧪 **Krok 6: Testovanie**

### 6.1 Test Gmail API
```bash
npm run test:gmail
```

### 6.2 Test Google Calendar API
```bash
npm run test:calendar
```

### 6.3 Test Google Search API
```bash
npm run test:search
```

### 6.4 Test celého systému
```bash
npm run test:api
```

## ⚠️ **Dôležité poznámky**

### Rate Limits
- **Gmail API**: 1 miliarda requests/mesiac (zadarmo)
- **Calendar API**: 1 miliarda requests/mesiac (zadarmo)
- **Custom Search API**: 100 requests/deň (zadarmo)

### Bezpečnosť
- **Nikdy** necommitnite `google-credentials.json` do Git
- Pridajte `credentials/` do `.gitignore`
- Používajte environment variables pre citlivé údaje

### Troubleshooting
- Ak dostanete "Access denied" - skontrolujte Service Account permissions
- Ak "API not enabled" - povolte API v Google Cloud Console
- Ak "Invalid credentials" - skontrolujte cestu k JSON súboru

## 📞 **Podpora**

Ak máte problémy:
1. Skontrolujte Google Cloud Console logs
2. Overte API quotas
3. Skontrolujte Service Account permissions
