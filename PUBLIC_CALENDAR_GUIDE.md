# 📅 **Verejný Kalendár - Návod**

## **Koncept**

Biz-Agent má **vlastný verejný kalendár** s dostupnými časmi. Klienti si môžu vybrať čas na stretnutie bez toho, aby ste mali prístup do ich kalendárov.

### **Workflow:**
1. **Biz-Agent nájde firmu** cez Google Search + Scraper
2. **Pošle email** s odkazom na verejný kalendár
3. **Klient si vyberie čas** z dostupných slotov
4. **Biz-Agent automaticky** vytvorí stretnutie a pošle pozvánku

## **Nastavenie Google Calendar**

### **1. Vytvorenie kalendára**
1. Prihláste sa do **sales@domelia.sk** na [Google Calendar](https://calendar.google.com)
2. Kliknite na **"+"** vedľa "Moje kalendáre"
3. Vyberte **"Vytvoriť nový kalendár"**
4. Názov: `Biz-Agent Stretnutia`
5. Kliknite **"Vytvoriť kalendár"**

### **2. Nastavenie verejnosti**
1. Kliknite na **"..."** vedľa kalendára
2. Vyberte **"Nastavenia a zdieľanie"**
3. Scrollnite dole na **"Integrácia kalendára"**
4. Skopírujte **"Kalendár ID"** (napr. `biz-agent@domelia.sk`)

### **3. Nastavenie dostupných časov**
1. V **"Nastavenia a zdieľanie"**
2. **"Pracovné hodiny"**:
   - **Začiatok**: 9:00
   - **Koniec**: 17:00
   - **Dni**: Pondelok - Piatok
3. **"Dostupné časy"**:
   - **Trvanie stretnutia**: 60 minút
   - **Buffer medzi stretnutiami**: 30 minút

### **4. Verejný prístup**
1. V **"Nastavenia a zdieľanie"**
2. **"Zdieľanie s verejnosťou"**
3. **"Urobiť verejným"** - ANO
4. **"Zobraziť všetky podrobnosti udalostí"** - ANO

## **Konfigurácia v Biz-Agent**

### **1. Environment Variables**
```bash
# V .env súbore
GOOGLE_CALENDAR_ID="c_be1d69240ee32df2924e7ad486abc555655f9a344b72c11b835d0c3da21f2426@group.calendar.google.com"
GOOGLE_CALENDAR_CREDENTIALS_PATH="./credentials/salesagent-470115-c4ddfc1a8d77.json"
```

### **2. Testovanie**
```bash
# Test verejného kalendára
npm run test:public-calendar

# Test celého API
npm run test:api
```

## **API Endpoints**

### **Získanie dostupných slotov**
```typescript
const slots = await publicCalendarService.getAvailableSlots(7); // 7 dní
```

### **Rezervácia stretnutia**
```typescript
const booking = {
  email: 'klient@firma.sk',
  name: 'Ján Novák',
  company: 'Firma s.r.o.',
  startTime: new Date('2024-01-15T10:00:00'),
  endTime: new Date('2024-01-15T11:00:00'),
  notes: 'Záujem o webové riešenie'
};

const event = await publicCalendarService.bookMeeting(booking);
```

### **Verejná URL kalendára**
```typescript
const publicUrl = publicCalendarService.getPublicCalendarUrl();
// https://calendar.google.com/calendar/embed?src=c_be1d69240ee32df2924e7ad486abc555655f9a344b72c11b835d0c3da21f2426%40group.calendar.google.com
```

## **Email Templates**

### **Template s odkazom na kalendár**
```html
Ahoj {meno},

nášli sme vašu firmu a myslíme si, že by sme vám mohli pomôcť s {problém}.

Môžete si vybrať čas na stretnutie tu: {kalendár_url}

S pozdravom,
Biz-Agent tým
```

### **Pozvánka na stretnutie**
```html
Ahoj {meno},

ďakujeme za záujem! Pozvánka na stretnutie je priložená.

Čas: {čas}
Miesto: Online / Domelia.sk

S pozdravom,
Biz-Agent tým
```

## **Výhody tohto riešenia**

### **✅ Bezpečnosť**
- **Žiadne prístupy** do cudzích kalendárov
- **Klienti majú kontrolu** nad svojimi dátami
- **Transparentné** - klienti vidia, čo sa deje

### **✅ Jednoduchosť**
- **Jeden kalendár** pre všetky stretnutia
- **Automatické** vytváranie pozvánok
- **Bez manuálnej práce**

### **✅ Profesionalita**
- **Verejný kalendár** vyzerá profesionálne
- **Dostupné časy** sú jasne viditeľné
- **Automatické** upozornenia

### **✅ Škálovateľnosť**
- **Môže slúžiť** viacerým klientom
- **Jednoduché** pridávanie nových slotov
- **Flexibilné** nastavenie časov

## **Monitoring**

### **Štatistiky kalendára**
```typescript
const stats = await publicCalendarService.getCalendarStats();
// {
//   totalEvents: 15,
//   upcomingEvents: 8,
//   availableSlots: 24
// }
```

### **Logy**
- **Vytvorenie stretnutia**: `Calendar event created`
- **Rezervácia**: `Meeting booked successfully`
- **Chyby**: `Failed to book meeting`

## **Nasadenie**

### **Development**
```bash
npm run dev
# Kalendár funguje v mock móde
```

### **Production**
```bash
npm run build
npm start
# Kalendár používa skutočné Google Calendar API
```

## **Troubleshooting**

### **Problém: Kalendár sa neinicializuje**
**Riešenie**: Skontrolujte `GOOGLE_CALENDAR_CREDENTIALS_PATH`

### **Problém: Žiadne dostupné sloty**
**Riešenie**: Skontrolujte nastavenia pracovných hodín v Google Calendar

### **Problém: Pozvánky sa neposielajú**
**Riešenie**: Skontrolujte Gmail API nastavenia

### **Problém: Kalendár nie je verejný**
**Riešenie**: V Google Calendar nastaveniach povolte verejný prístup
