# Biz-Agent

Automatizovaný obchodný agent pre projekt **Domelia.sk**. Cieľom je automatizovať vyhľadávanie firiem, kontaktovanie prostredníctvom emailu a nastavovanie stretnutí v kalendári.

---

## 🌐 Architektúra

Mikroslužba postavená v **TypeScript + Node.js**, beží ako cron job každých 10 minút. Komunikuje s:

- **Mailjet API** na odosielanie emailov
- **Google Calendar API** na nastavovanie stretnutí
- **Google Search API / Scraper** na vyhľadávanie firiem
- **PostgreSQL** (existujúca DB Domelia) na logovanie

---

## 📂 Štruktúrna organizácia projektu

```
/biz-agent
├── src/
│   ├── config/           # Konfiguračné súbory
│   │   ├── index.ts      # Hlavná konfigurácia
│   │   ├── database.ts   # DB konfigurácia
│   │   └── validation.ts # Zod schemas
│   ├── modules/
│   │   ├── mail/         # Mailjet integrácia
│   │   ├── calendar/     # Google Calendar API
│   │   ├── parser/       # Web scraping
│   │   └── database/     # Prisma models & queries
│   ├── templates/        # HTML šablóny emailov
│   ├── utils/            # Pomocné funkcie
│   │   ├── logger.ts     # Winston logger
│   │   ├── errors.ts     # Error handling
│   │   └── rateLimit.ts  # Rate limiting
│   └── cron/             # Cron job runner
├── tests/                # Unit a integration testy
├── prisma/               # Database schema
├── .env.example          # Príklad environment
├── docker-compose.yml    # Development setup
├── Dockerfile           # Production build
└── README.md
```

---

## ⚙️ Použité technológie

### Core
- **TypeScript** - typová kontrola a lepší DX
- **Node.js 18+** s ES Modules
- **Zod** - validácia konfigurácie a dát
- **Winston** - profesionálne logovanie

### APIs & Integrations
- **Mailjet SDK** pre emailing
- **googleapis** pre Calendar API
- **axios + cheerio** na scraping (rýchlejšie ako Puppeteer)
- **Prisma** pre PostgreSQL

### Development & Deployment
- **Jest** - testovanie
- **nodemon** - development hot reload
- **node-cron** - scheduling (jednoduchšie ako PM2)
- **Docker** - containerization

---

## 🎯 Detailný plán implementácie

### Fáza 1: Základná infraštruktúra (1-2 dni)

#### 1.1 Projekt setup
- [ ] Inicializácia TypeScript projektu
- [ ] Konfiguračný systém s Zod validáciou
- [ ] Winston logger setup
- [ ] Error handling middleware
- [ ] Environment variables (.env)

#### 1.2 Database setup
- [ ] Prisma inicializácia
- [ ] Schema pre `agent_logs`, `companies`, `email_templates`
- [ ] Database connection pooling
- [ ] Migration scripts

#### 1.3 Development environment
- [ ] Docker Compose pre PostgreSQL
- [ ] Nodemon konfigurácia
- [ ] Jest test setup
- [ ] ESLint + Prettier

### Fáza 2: Core moduly (3-4 dni)

#### 2.1 Mailjet integrácia
- [ ] Mailjet SDK setup
- [ ] Email template system
- [ ] `sendEmail(templateName, recipientData)` funkcia
- [ ] Rate limiting (max 6/h)
- [ ] Error handling a retry logic
- [ ] Unit testy

#### 2.2 Google Calendar modul
- [ ] OAuth2 setup (Google Cloud Console)
- [ ] Service account konfigurácia
- [ ] `createMeeting(firmData)` funkcia
- [ ] Calendar event templates
- [ ] Error handling pre API limity
- [ ] Unit testy

#### 2.3 Database operations
- [ ] Prisma client setup
- [ ] CRUD operácie pre firmy
- [ ] Logging queries
- [ ] Connection pooling
- [ ] Unit testy

### Fáza 3: Business logic (2-3 dni)

#### 3.1 Parser a vyhľadávanie
- [ ] Google Search API integrácia
- [ ] Web scraping s axios + cheerio
- [ ] Email extraction z kontaktov
- [ ] Company data validation
- [ ] Rate limiting pre requests
- [ ] Unit testy

#### 3.2 Email templates
- [ ] HTML šablóny pre rôzne kategórie
- [ ] Template engine (Handlebars)
- [ ] Personalization variables
- [ ] A/B testing support
- [ ] Template validation

#### 3.3 Business rules
- [ ] Company filtering logic
- [ ] Blacklist checking
- [ ] Duplicate detection
- [ ] Scheduling rules
- [ ] Unit testy

### Fáza 4: Cron runner a orchestration (1-2 dni)

#### 4.1 Main cron job
- [ ] `node-cron` setup
- [ ] Pipeline orchestration
- [ ] Error recovery
- [ ] Performance monitoring
- [ ] Integration testy

#### 4.2 Monitoring a logging
- [ ] Structured logging
- [ ] Performance metrics
- [ ] Error tracking
- [ ] Success/failure rates
- [ ] Alerting system

### Fáza 5: Testing a deployment (1-2 dni)

#### 5.1 Testing
- [ ] Unit testy pre všetky moduly
- [ ] Integration testy
- [ ] E2E testy pre pipeline
- [ ] Test coverage reporting

#### 5.2 Production deployment
- [ ] Docker optimization
- [ ] Environment-specific configs
- [ ] Health checks
- [ ] Backup strategy
- [ ] Monitoring setup

---

## 🔧 Konfiguračný systém

### Environment variables (.env)
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/domelia"

# APIs
MAILJET_API_KEY="your_key"
MAILJET_API_SECRET="your_secret"
GOOGLE_CALENDAR_CREDENTIALS="path/to/service-account.json"

# Rate limiting
MAX_EMAILS_PER_HOUR=6
MAX_REQUESTS_PER_MINUTE=10

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/biz-agent.log"
```

### Config validation (Zod)
```typescript
const configSchema = z.object({
  database: z.object({
    url: z.string().url(),
  }),
  mailjet: z.object({
    apiKey: z.string(),
    apiSecret: z.string(),
  }),
  rateLimiting: z.object({
    maxEmailsPerHour: z.number().min(1).max(100),
  }),
});
```

---

## 🛡️ Error handling a monitoring

### Error types
- **API errors** - Mailjet, Google Calendar, Search API
- **Network errors** - Timeout, connection issues
- **Validation errors** - Invalid data, missing fields
- **Business logic errors** - Rate limits, blacklisted companies

### Retry strategy
- Exponential backoff pre API calls
- Max 3 retries pre email sending
- Circuit breaker pre external APIs
- Dead letter queue pre failed operations

### Monitoring
- Success/failure rates
- Response times
- API quota usage
- Database performance
- Error frequency

---

## 📦 Deployment

### Development
```bash
# Setup
npm install
cp .env.example .env
docker-compose up -d postgres
npx prisma migrate dev

# Run
npm run dev
```

### Production (Docker)
```bash
# Build
docker build -t biz-agent .

# Run
docker run -d \
  --env-file .env \
  --name biz-agent \
  biz-agent
```

### Production (PM2)
```bash
npm install -g pm2
pm2 start dist/cron/run.js --name biz-agent --cron "*/10 * * * *"
```

---

## 🧪 Testing stratégia

### Unit tests
- Každý modul má vlastné testy
- Mock external APIs
- Test error scenarios
- Coverage > 80%

### Integration tests
- Test celý pipeline
- Test database operations
- Test API integrations

### E2E tests
- Test kompletného workflow
- Test rate limiting
- Test error recovery

---

## ⚠️ Bezpečnostné opatrenia

### Rate limiting
- Max 6 emailov/hodinu
- Max 10 API requests/minútu
- Progressive delays pri chybách

### Data protection
- Encrypted environment variables
- Secure database connections
- API key rotation
- Audit logging

### Error handling
- No sensitive data in logs
- Graceful degradation
- Circuit breakers
- Alerting on critical errors

---

## 🔮 Budúcnosť a rozšírenia

### Krátkodobé (1-2 mesiace)
- [ ] Web dashboard pre monitoring
- [ ] Manuálne schvaľovanie emailov
- [ ] A/B testing šablón
- [ ] Email scheduling

### Strednodobé (3-6 mesiacov)
- [ ] Machine learning pre targeting
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] CRM integration

### Dlhodobé (6+ mesiacov)
- [ ] AI-powered content generation
- [ ] Predictive analytics
- [ ] Multi-channel outreach
- [ ] Advanced automation

---

## 📋 Checklist pre spustenie

### Pred prvým spustením
- [ ] Všetky API keys nastavené
- [ ] Database schema vytvorená
- [ ] Email templates pripravené
- [ ] Rate limiting konfigurovaný
- [ ] Monitoring nastavený
- [ ] Backup strategy implementovaná

### Po spustení
- [ ] Test prvých 5 emailov
- [ ] Overiť logging
- [ ] Skontrolovať calendar events
- [ ] Monitorovať error rates
- [ ] Optimalizovať performance

---

## **🔧 Aktuálny stav implementácie (26.8.2025):**

### **✅ Fáza 1 - Základná infraštruktúra (DOKONČENÁ)**
- ✅ **Projektová štruktúra** - TypeScript, ESLint, Prettier, Jest
- ✅ **Konfigurácia** - Zod validácia, environment variables
- ✅ **Logging** - Winston logger s rotáciou súborov
- ✅ **Error handling** - Custom error classes, retry mechanism, circuit breaker
- ✅ **Database** - PostgreSQL + Prisma schema
- ✅ **Cron job** - node-cron scheduler (každú minútu v development)
- ✅ **Development tools** - nodemon, hot reload, mock services
- ✅ **Testing** - Jest setup, test utilities, mock data

### **✅ Fáza 2 - Základné služby (DOKONČENÁ)**
- ✅ **Email Queue** - Fronta pre odosielanie emailov
- ✅ **Company Service** - Business logic pre firmy
- ✅ **Template Service** - Email templates s personalizáciou
- ✅ **Database seeding** - Test data pre development

### **✅ Fáza 3 - Google API integrácie (DOKONČENÁ)**
- ✅ **Google Search API** - Hľadanie firiem podľa odvetvia
- ✅ **Contact Scraper** - Extrakcia kontaktov z webstránok
- ✅ **Company Discovery** - Kombinácia Search + Scraper
- ✅ **Gmail API** - OAuth 2.0 pre odosielanie emailov ✅
- ✅ **Google Calendar API** - OAuth 2.0 pre správu kalendára ✅
- ✅ **Public Calendar** - Správa verejného kalendára s dostupnými slotmi ✅
- ✅ **OAuth 2.0 Service** - Centralizovaná správa OAuth tokenov ✅

### **⚠️ Fáza 4 - Pokročilé funkcie (V PRÍPRAVE)**
- ⚠️ **Email personalizácia** - AI-powered content generation
- ⚠️ **Follow-up automation** - Automatické sledovanie
- ⚠️ **Analytics dashboard** - Metriky a reporting
- ⚠️ **Web interface** - Admin panel pre správu

### **⏳ Fáza 5 - Deployment a monitoring (PLÁNOVANÉ)**
- ⏳ **Docker deployment** - Production container
- ⏳ **CI/CD pipeline** - Automatické nasadenie
- ⏳ **Monitoring** - Health checks, alerting
- ⏳ **Backup strategy** - Database a log backup

## **🎯 Ďalšie kroky:**

1. **Testovanie celého pipeline** - Spustenie s reálnymi dátami
2. **Optimalizácia performance** - Rate limiting a caching
3. **Monitoring a alerting** - Sledovanie chýb a výkonu
4. **Web interface** - Admin panel pre správu
5. **Production deployment** - Docker a CI/CD

---

Tento dokument sa bude priebežne aktualizovať počas vývoja. Každá fáza má jasné deliverable a success criteria.

