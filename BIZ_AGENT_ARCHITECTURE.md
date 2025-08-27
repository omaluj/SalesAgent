# 🚀 **Biz-Agent - Nezávislý Projekt**

## **Architektúra**

### **Google Cloud Project: salesagent-470115**
- **Nezávislý** od domelia.sk
- **Vlastné API quotas** a limity
- **Izolované oprávnenia**

### **API Integrácie**

#### **1. Google Search API** ✅
- **Status**: Funkčné
- **API Key**: `AIzaSyAAGA9EWySAPhzNRCSyRXDzk2UXetDoCQc`
- **Search Engine ID**: `624924e994b4c46db`
- **Quota**: 100 requests/deň (zadarmo)

#### **2. Contact Scraper** ✅
- **Status**: Funkčné
- **Extrakcia**: Emails, phones, addresses
- **Rate limiting**: Respektuje robots.txt

#### **3. Gmail API** ⚠️
- **Status**: Potrebuje nastavenie
- **Účel**: Posielanie emailov s pozvánkami na stretnutie
- **Možnosti**:
  - **OAuth 2.0 flow** (odporúčané)
  - **Service Account** s Domain-wide Delegation
  - **Mock mode** pre testovanie

#### **4. Google Calendar API** ⚠️
- **Status**: Potrebuje nastavenie
- **Účel**: **Verejný kalendár** s dostupnými časmi
- **Koncept**:
  - Biz-Agent používa **sales@domelia.sk kalendár**
  - Klienti si **vyberú čas** z dostupných slotov
  - Biz-Agent **pošle pozvánku** na stretnutie
  - **Žiadne prístupy** do cudzích kalendárov
- **Možnosti**:
  - **OAuth 2.0 flow** pre vlastný kalendár
  - **Service Account** pre vlastný kalendár
  - **Mock mode** pre testovanie

## **Workflow s verejným kalendárom**

### **1. Objavenie firmy**
```typescript
// Google Search + Scraper nájde firmu
// Extrahuje email kontaktnej osoby
```

### **2. Oslovenie emailom**
```typescript
// Biz-Agent pošle email s:
// - Osobnou ponukou
// - Odkazom na verejný kalendár
// - Call-to-action na výber času
```

### **3. Výber času**
```typescript
// Klient klikne na odkaz
// Vidí dostupné časy v kalendári
// Vyberie si vhodný slot
```

### **4. Automatická pozvánka**
```typescript
// Biz-Agent automaticky:
// - Vytvorí event v kalendári
// - Pošle pozvánku na stretnutie
// - Označí firmu ako "INTERESTED"
```

## **Implementácia verejného kalendára**

### **Google Calendar Setup:**
1. **Vytvoriť verejný kalendár** pre Biz-Agent
2. **Nastaviť dostupné časy** (napr. 9:00-17:00, Po-Pi)
3. **Pridať buffer** medzi stretnutiami (30 min)
4. **Nastaviť trvanie** stretnutí (60 min)

### **Kalendár URL:**
```
https://calendar.google.com/calendar/embed?src=sales@domelia.sk
```

### **API Endpoints:**
```typescript
// GET /api/calendar/available-slots
// POST /api/calendar/book-meeting
// GET /api/calendar/public-url
```

## **Email Templates**

### **Template 1: Oslovenie**
```html
Ahoj {meno},

nášli sme vašu firmu a myslíme si, že by sme vám mohli pomôcť s {problém}.

Môžete si vybrať čas na stretnutie tu: {kalendár_url}

S pozdravom,
Biz-Agent tým
```

### **Template 2: Pozvánka na stretnutie**
```html
Ahoj {meno},

ďakujeme za záujem! Pozvánka na stretnutie je priložená.

Čas: {čas}
Miesto: {miesto/online}

S pozdravom,
Biz-Agent tým
```

## **Nasadenie**

### **Lokálne testovanie:**
```bash
npm run dev          # Development mode
npm run test:search  # Test Google Search
npm run test:scraper # Test Contact Scraper
npm run test:discovery # Test full pipeline
```

### **Produkčné nasadenie:**
```bash
npm run build        # Build aplikácie
npm start           # Production mode
```

## **Monitoring a Logs**

### **Logy:**
- **Development**: `logs/biz-agent-dev.log`
- **Production**: `logs/biz-agent-prod.log`

### **Metriky:**
- **Companies discovered**: Počet nájdených firiem
- **Contacts extracted**: Počet extrahovaných kontaktov
- **Emails sent**: Počet odoslaných emailov
- **Calendar bookings**: Počet rezervovaných stretnutí
- **API usage**: Využitie API quotas

## **Bezpečnosť**

### **Environment Variables:**
- **API Keys**: V `.env` súbore (necommitovať)
- **Credentials**: V `credentials/` priečinku (necommitovať)
- **Database**: PostgreSQL s SSL

### **Rate Limiting:**
- **Google Search**: 100 requests/deň
- **Gmail**: 1 miliarda requests/mesiac
- **Calendar**: 1 miliarda requests/mesiac
- **Scraper**: 2 sekundy medzi requestmi

## **Budúce rozšírenia**

### **Fáza 2:**
- **Web UI** pre správu firiem
- **Email templates** editor
- **Analytics dashboard**
- **Multi-tenant** podpora

### **Fáza 3:**
- **AI-powered** lead scoring
- **Automated follow-ups**
- **CRM integration**
- **Advanced analytics**
