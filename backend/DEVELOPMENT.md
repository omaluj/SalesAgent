# Development Guide - Biz-Agent

Tento dokument obsahuje inštrukcie pre setup a vývoj Biz-Agent aplikácie.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ 
- Docker a Docker Compose
- PostgreSQL (cez Docker)
- Git

### 2. Setup prostredia

```bash
# Clone repository
git clone <repository-url>
cd biz-agent

# Inštaluj dependencies
npm install

# Skopíruj environment súbor
cp env.example .env

# Uprav .env súbor s vašimi API keys
# (viď sekciu Environment Variables)

# Spusti databázu
docker-compose up -d postgres

# Vytvor databázu a migrácie
npm run db:generate
npm run db:migrate

# Spusti aplikáciu v development móde
npm run dev
```

### 3. Verify setup

Aplikácia by mala:
- Spustiť sa bez chýb
- Logovať "Biz-Agent application started successfully"
- Bežať cron job každých 10 minút (v development móde)

## 🔧 Environment Variables

Upravte `.env` súbor s vašimi API keys:

```bash
# Database (Docker Compose)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/domelia"

# Mailjet API (získajte z Mailjet dashboard)
MAILJET_API_KEY="your_mailjet_api_key"
MAILJET_API_SECRET="your_mailjet_api_secret"
MAILJET_SENDER_EMAIL="noreply@domelia.sk"
MAILJET_SENDER_NAME="Domelia.sk"

# Google Calendar (viď Google Setup sekciu)
GOOGLE_CALENDAR_CREDENTIALS_PATH="./credentials/google-service-account.json"

# Security (vygenerujte si)
ENCRYPTION_KEY="your-32-character-encryption-key-here"
JWT_SECRET="your-jwt-secret-here"
```

## 🔑 Google Setup

### 1. Google Cloud Console
1. Choďte na [Google Cloud Console](https://console.cloud.google.com/)
2. Vytvorte nový projekt alebo vyberte existujúci
3. Povoľte Google Calendar API

### 2. Service Account
1. Choďte do "IAM & Admin" > "Service Accounts"
2. Vytvorte nový service account
3. Stiahnite JSON credentials súbor
4. Uložte do `credentials/google-service-account.json`

### 3. Calendar Permissions
1. Otvorte Google Calendar
2. Pridajte service account email ako calendar owner
3. Alebo použite "primary" calendar

## 📁 Projektová štruktúra

```
src/
├── config/           # Konfigurácia a validácia
├── modules/          # Hlavné moduly
│   ├── mail/        # Mailjet integrácia
│   ├── calendar/    # Google Calendar
│   ├── parser/      # Web scraping
│   └── database/    # Prisma operácie
├── templates/        # Email šablóny
├── utils/           # Pomocné funkcie
└── cron/            # Cron job runner
```

## 🧪 Testing

### Spustenie testov
```bash
# Všetky testy
npm test

# Testy s watch mode
npm run test:watch

# Testy s coverage
npm run test:coverage
```

### Testovacie súbory
- `tests/setup.ts` - Test setup
- `tests/unit/` - Unit testy
- `tests/integration/` - Integration testy

## 🔍 Development Tools

### Linting a Formatting
```bash
# ESLint check
npm run lint

# ESLint fix
npm run lint:fix

# Prettier format
npm run format
```

### Database
```bash
# Prisma Studio (GUI pre databázu)
npm run db:studio

# Migrácie
npm run db:migrate

# Seed data
npm run db:seed
```

## 🐳 Docker Development

### Spustenie cez Docker
```bash
# Build image
docker build -t biz-agent .

# Run s environment
docker run --env-file .env biz-agent
```

### Docker Compose (development)
```bash
# Spusti všetky služby
docker-compose up

# Len databázu
docker-compose up postgres

# pgAdmin (http://localhost:8080)
docker-compose up pgadmin
```

## 📊 Monitoring a Logs

### Logy
- `logs/biz-agent.log` - Hlavný log
- `logs/error.log` - Chyby
- `logs/exceptions.log` - Nezachytené výnimky

### Log levels
- `error` - Chyby
- `warn` - Varovania
- `info` - Informácie
- `debug` - Debug informácie

### Monitoring
```bash
# Zobraziť logy v reálnom čase
tail -f logs/biz-agent.log

# Filtrovať chyby
grep "ERROR" logs/biz-agent.log
```

## 🚨 Troubleshooting

### Časté problémy

#### 1. Database connection failed
```bash
# Skontrolujte či beží PostgreSQL
docker-compose ps

# Restartujte databázu
docker-compose restart postgres
```

#### 2. Mailjet API error
- Skontrolujte API keys v `.env`
- Overte či máte dostatok kreditov
- Skontrolujte rate limits

#### 3. Google Calendar error
- Overte service account credentials
- Skontrolujte calendar permissions
- Overte či je API povolené

#### 4. TypeScript compilation errors
```bash
# Clean a rebuild
rm -rf dist/
npm run build
```

### Debug mode
```bash
# Spusti s debug logmi
DEBUG_MODE=true npm run dev
```

## 🔄 Development Workflow

### 1. Feature Development
1. Vytvorte feature branch
2. Implementujte feature
3. Napíšte testy
4. Spustite linting a testy
5. Vytvorte pull request

### 2. Code Quality
- Používajte TypeScript strict mode
- Dodržiavajte ESLint pravidlá
- Píšte unit testy pre nové funkcie
- Dokumentujte API endpoints

### 3. Testing Strategy
- Unit testy pre business logic
- Integration testy pre API calls
- E2E testy pre celý pipeline

## 📈 Performance

### Monitoring
- Response times
- Memory usage
- Database query performance
- API rate limits

### Optimization
- Database indexing
- Connection pooling
- Caching strategies
- Rate limiting

## 🔒 Security

### Best Practices
- Nikdy necommitnite API keys
- Používajte environment variables
- Validujte všetky vstupy
- Logujte security events

### API Security
- Rate limiting
- Input validation
- Error handling
- Secure connections

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Mailjet API](https://dev.mailjet.com/)
- [Google Calendar API](https://developers.google.com/calendar)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
