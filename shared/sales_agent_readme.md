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
/biz-agent/
├── backend/              # Node.js Backend API Server
│   ├── src/
│   │   ├── config/       # Konfiguračné súbory
│   │   ├── modules/      # Business logic modules
│   │   │   ├── mail/     # Email services
│   │   │   ├── calendar/ # Calendar services
│   │   │   ├── search/   # Search & scraping
│   │   │   ├── companies/# Company management
│   │   │   ├── templates/# Email templates
│   │   │   └── auth/     # OAuth & authentication
│   │   ├── api/          # Express.js API server
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── middleware/# Auth, validation, etc.
│   │   │   └── websocket/# Real-time updates
│   │   ├── cron/         # Cron job runner
│   │   ├── utils/        # Shared utilities
│   │   └── tests/        # Backend tests
│   ├── prisma/           # Database schema
│   ├── env.*             # Environment files
│   ├── docker-compose.yml# Development setup
│   ├── Dockerfile        # Production build
│   └── package.json      # Backend dependencies
├── frontend/             # React.js Web Interface
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API calls
│   │   ├── utils/        # Frontend utilities
│   │   └── types/        # TypeScript types
│   ├── public/           # Static assets
│   ├── index.html        # HTML template
│   └── package.json      # Frontend dependencies
├── shared/               # Shared resources
│   ├── types/            # Shared TypeScript types
│   ├── config/           # Shared configuration
│   └── docs/             # Documentation
├── package.json          # Workspace configuration
└── README.md            # Main documentation
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
- **Express.js** pre Web API
- **React.js** pre Web Interface

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
# Setup workspace
npm run install:all
cd backend
cp env.example env.development
docker-compose up -d postgres
npm run db:migrate
npm run db:seed

# Run everything (backend + frontend)
npm run dev

# Run only backend API
npm run dev:backend

# Run only frontend
npm run dev:frontend

# Run only cron job
npm run dev:cron
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
- [ ] Web Interface - Admin dashboard a monitoring
- [ ] Email Template Editor - HTML editor s preview
- [ ] Analytics Dashboard - Real-time metriky
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
- ⚠️ **Web Interface** - Admin dashboard pre správu a monitoring
- ⚠️ **Email Template Editor** - HTML editor s preview a personalizáciou
- ⚠️ **Analytics Dashboard** - Real-time metriky a reporting
- ⚠️ **Email personalizácia** - AI-powered content generation
- ⚠️ **Follow-up automation** - Automatické sledovanie

### **⏳ Fáza 5 - Deployment a monitoring (PLÁNOVANÉ)**
- ⏳ **Docker deployment** - Production container
- ⏳ **CI/CD pipeline** - Automatické nasadenie
- ⏳ **Monitoring** - Health checks, alerting
- ⏳ **Backup strategy** - Database a log backup

## **🎯 Ďalšie kroky:**

1. **Backend API Server** - Express.js API s existujúcimi službami
2. **React Frontend** - Dashboard, analytics, template editor
3. **Testovanie celého pipeline** - Spustenie s reálnymi dátami
4. **Production deployment** - Docker a CI/CD

---

## **🖥️ Web Interface - Admin Dashboard**

### **Prehľad funkcií:**

#### **1. Dashboard s Real-time Monitoringom**
- 📊 **Pipeline Status** - aktuálny stav cron jobu, posledné spustenie
- 📧 **Email Metrics** - odoslané, úspešné, chyby, rate limiting
- 📅 **Calendar Events** - nové stretnutia, úspešné rezervácie, no-shows
- 🔍 **Discovery Stats** - nájdené firmy, extrahované kontakty, úspešnosť
- ⚡ **API Health** - Gmail, Calendar, Search API status

#### **2. Email Template Editor**
- 📝 **HTML Editor** s syntax highlighting a preview
- 🎨 **Template Variables** - {{company_name}}, {{contact_name}}, {{calendar_link}}
- 📋 **Template Management** - vytváranie, editácia, aktivácia, deaktivácia
- 📊 **A/B Testing** - porovnanie účinnosti rôznych šablón
- 🔄 **Version Control** - história zmien šablón

#### **3. Analytics & Reporting**
- 📈 **Performance Graphs** - emaily v čase, úspešnosť, click-through rates
- 🏢 **Company Tracking** - ktoré firmy reagovali, follow-up potreby
- 📅 **Calendar Analytics** - rezervácie, no-shows, úspešnosť stretnutí
- 📧 **Email Performance** - open rates, replies, bounce rates
- 📊 **Export Reports** - CSV, PDF exporty pre analýzu

#### **4. Configuration Panel**
- ⚙️ **API Settings** - Google OAuth, Mailjet, Search API konfigurácia
- 🔧 **Pipeline Config** - rate limiting, scheduling, business rules
- 👥 **Team Management** - collaborators, permissions, access control
- 🔒 **Security Settings** - API key rotation, audit logs

#### **5. Real-time Notifications**
- 🔔 **Success Alerts** - úspešné emaily, rezervácie
- ⚠️ **Error Notifications** - API chyby, rate limiting, failed operations
- 📊 **Performance Alerts** - nízka úspešnosť, vysoké error rates
- 🎯 **Business Alerts** - nové leads, follow-up potreby

### **Technológie pre Web Interface:**

#### **Frontend:**
- **React.js** - moderný UI framework
- **TypeScript** - type safety a lepší DX
- **Tailwind CSS** - rýchle styling
- **Chart.js** - interaktívne grafy
- **React Query** - server state management
- **React Hook Form** - form handling

#### **Backend API:**
- **Express.js** - REST API endpoints
- **WebSocket** - real-time updates
- **JWT Authentication** - secure access
- **Rate Limiting** - API protection
- **CORS** - cross-origin requests

#### **Database Extensions:**
- **User Management** - admin users, permissions
- **Template History** - version control pre šablóny
- **Analytics Tables** - detailed metrics storage
- **Audit Logs** - user actions tracking

### **Implementačný plán:**

#### **Fáza 4.1: Základný Dashboard (1-2 dni)**
- [ ] Express.js API server
- [ ] React frontend setup
- [ ] Basic authentication
- [ ] Pipeline status monitoring
- [ ] Email metrics display

#### **Fáza 4.2: Template Editor (2-3 dni)**
- [ ] HTML editor component
- [ ] Template CRUD operations
- [ ] Variable system
- [ ] Preview functionality
- [ ] Template validation

#### **Fáza 4.3: Analytics Dashboard (2-3 dni)**
- [ ] Chart.js integration
- [ ] Real-time data updates
- [ ] Performance metrics
- [ ] Export functionality
- [ ] Custom date ranges

#### **Fáza 4.4: Configuration Panel (1-2 dni)**
- [ ] Settings management
- [ ] API configuration
- [ ] User management
- [ ] Security settings
- [ ] Audit logging

---

Tento dokument sa bude priebežne aktualizovať počas vývoja. Každá fáza má jasné deliverable a success criteria.

