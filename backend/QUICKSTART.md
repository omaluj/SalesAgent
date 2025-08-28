# 🚀 Quick Start - Biz-Agent

Rýchly sprievodca pre spustenie Biz-Agent aplikácie.

## ✅ Čo máme pripravené

**Fáza 1 je dokončená!** Máme:

- ✅ TypeScript konfiguráciu
- ✅ Konfiguračný systém s Zod validáciou
- ✅ Winston logger s rotáciou
- ✅ Error handling s retry a circuit breaker
- ✅ Prisma schema pre databázu
- ✅ Cron job runner
- ✅ Docker setup
- ✅ Testovací framework
- ✅ ESLint a Prettier

## 🎯 Ďalšie kroky

### 1. Inštalácia závislostí
```bash
npm install
```

### 2. Nastavenie prostredia
```bash
# Skopíruj environment súbor
cp env.example .env

# Uprav .env s vašimi API keys
# (viď DEVELOPMENT.md pre detaily)
```

### 3. Spustenie databázy
```bash
# Spusti PostgreSQL cez Docker
docker-compose up -d postgres

# Vytvor databázu a migrácie
npm run db:generate
npm run db:migrate
```

### 4. Testovanie setupu
```bash
# Spusti testy
npm test

# Spusti aplikáciu v development móde
npm run dev
```

## 🔧 Čo implementovať ďalej

### Fáza 2: Core moduly (3-4 dni)

1. **Mailjet integrácia** (`src/modules/mail/`)
   - Mailjet SDK setup
   - Email template system
   - Rate limiting

2. **Google Calendar** (`src/modules/calendar/`)
   - OAuth2 setup
   - Service account konfigurácia
   - Event creation

3. **Database operations** (`src/modules/database/`)
   - Prisma client setup
   - CRUD operácie
   - Connection pooling

### Fáza 3: Business logic (2-3 dni)

1. **Parser a vyhľadávanie** (`src/modules/parser/`)
   - Google Search API
   - Web scraping
   - Email extraction

2. **Email templates** (`src/templates/`)
   - HTML šablóny
   - Template engine
   - Personalization

3. **Business rules**
   - Company filtering
   - Blacklist checking
   - Scheduling logic

## 📊 Aktuálny stav

```
✅ Fáza 1: Základná infraštruktúra (DOKONČENÁ)
🔄 Fáza 2: Core moduly (PRIPRAVENÁ)
⏳ Fáza 3: Business logic
⏳ Fáza 4: Cron runner a orchestration
⏳ Fáza 5: Testing a deployment
```

## 🎉 Výhody tohto setupu

- **TypeScript** - type safety a lepší DX
- **Modulárna architektúra** - ľahké rozšírenia
- **Error handling** - robustné riešenie chýb
- **Logging** - profesionálne logovanie
- **Testing** - kompletný testovací framework
- **Docker** - jednoduchý deployment
- **ESLint/Prettier** - konzistentný kód

## 🚨 Dôležité poznámky

1. **API Keys** - nikdy necommitnite do Git
2. **Environment** - používajte `.env` súbory
3. **Database** - PostgreSQL cez Docker
4. **Logs** - automaticky v `logs/` priečinku
5. **Tests** - spúšťajte pred každým commitom

## 📞 Podpora

Ak máte problémy:
1. Skontrolujte `DEVELOPMENT.md`
2. Spustite `npm test`
3. Pozrite logy v `logs/` priečinku
4. Skontrolujte Docker containers

---

**Teraz môžete pokračovať s implementáciou Fázy 2!** 🚀
